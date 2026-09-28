import { createHash } from 'node:crypto'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const dynamodb = new DynamoDBClient({})
const s3 = new S3Client({})

const DEFAULT_SOURCE = 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates'
const ALLOWED_HOST = 'www.ubisoft.com'
const ALLOWED_PATH_PREFIX = '/en-us/game/rainbow-six/siege/news-updates'
const USER_AGENT = 'Recon6PatchWatcher/1.0 (+https://r6coaching.com)'

export function canonicalizeUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== ALLOWED_HOST) {
    throw new Error('source_not_allowed')
  }
  const path = url.pathname.replace(/\/+$/, '') || '/'
  if (path !== ALLOWED_PATH_PREFIX && !path.startsWith(`${ALLOWED_PATH_PREFIX}/`)) {
    throw new Error('source_not_allowed')
  }
  url.pathname = path
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function contentHash(body) {
  return createHash('sha256').update(body, 'utf8').digest('hex')
}

export function extractArticleUrls(html, baseUrl) {
  const found = new Set()
  const hrefPattern = /href=["']([^"'<>]+)["']/gi
  for (const match of html.matchAll(hrefPattern)) {
    try {
      const canonical = canonicalizeUrl(new URL(match[1], baseUrl).toString())
      if (canonical !== canonicalizeUrl(DEFAULT_SOURCE)) found.add(canonical)
    } catch {
      // Ignore relative links and external hosts outside the strict allowlist.
    }
  }
  return [...found].sort()
}

function log(level, event, fields = {}) {
  console.log(JSON.stringify({ level, event, at: new Date().toISOString(), ...fields }))
}

async function fetchOfficial(url, fetchImpl = fetch) {
  const canonicalUrl = canonicalizeUrl(url)
  const response = await fetchImpl(canonicalUrl, {
    headers: { accept: 'text/html', 'user-agent': USER_AGENT },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`source_http_${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('text/html')) throw new Error('source_not_html')
  const body = await response.text()
  if (Buffer.byteLength(body, 'utf8') > 5_000_000) throw new Error('source_too_large')
  return { canonicalUrl, body, contentType }
}

async function putImmutableSnapshot(client, bucket, canonicalUrl, body, hash) {
  const key = `sources/sha256/${hash}.html`
  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/html; charset=utf-8',
      Metadata: { canonical_url_sha256: contentHash(canonicalUrl), content_sha256: hash },
      IfNoneMatch: '*',
    }))
  } catch (error) {
    if (error?.name !== 'PreconditionFailed' && error?.$metadata?.httpStatusCode !== 412) throw error
  }
  return key
}

async function recordDiscovery(client, tableName, item) {
  try {
    await client.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        event_id: { S: item.eventId },
        canonical_url: { S: item.canonicalUrl },
        content_hash: { S: item.hash },
        discovered_at: { S: item.discoveredAt },
        snapshot_key: { S: item.snapshotKey },
        status: { S: 'pending_review' },
      },
      ConditionExpression: 'attribute_not_exists(event_id)',
    }))
    return true
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') return false
    throw error
  }
}

export function createHandler({
  fetchImpl = fetch,
  dynamodbClient = dynamodb,
  s3Client = s3,
  now = () => new Date(),
  uuid = () => crypto.randomUUID(),
} = {}) {
  return async function patchWatcherHandler(event = {}, context = {}) {
  const tableName = process.env.PATCH_EVENTS_TABLE
  const bucket = process.env.PATCH_SNAPSHOTS_BUCKET
  if (!tableName || !bucket) throw new Error('missing_required_configuration')

  const configured = (process.env.SOURCE_URLS || DEFAULT_SOURCE)
    .split(',')
    .map((value) => canonicalizeUrl(value.trim()))
  const requested = Array.isArray(event.sourceUrls)
    ? event.sourceUrls.map(canonicalizeUrl)
    : configured

  const maxArticles = Math.min(Number(process.env.MAX_ARTICLES || 20), 50)
  const candidates = new Set()
  for (const sourceUrl of requested) {
    const landing = await fetchOfficial(sourceUrl, fetchImpl)
    for (const articleUrl of extractArticleUrls(landing.body, sourceUrl)) {
      if (candidates.size < maxArticles) candidates.add(articleUrl)
    }
  }

  const discoveredAt = now().toISOString()
  const discoveries = []
  const errors = []
  for (const articleUrl of candidates) {
    try {
      const page = await fetchOfficial(articleUrl, fetchImpl)
      const hash = contentHash(page.body)
      const snapshotKey = await putImmutableSnapshot(s3Client, bucket, page.canonicalUrl, page.body, hash)
      const eventId = contentHash(`${page.canonicalUrl}\n${hash}`)
      const isNew = await recordDiscovery(dynamodbClient, tableName, {
        eventId,
        canonicalUrl: page.canonicalUrl,
        hash,
        discoveredAt,
        snapshotKey,
      })
      if (isNew) discoveries.push({
        eventId,
        canonicalUrl: page.canonicalUrl,
        contentHash: hash,
        snapshotKey,
        status: 'pending_review',
      })
    } catch (error) {
      errors.push({ url: articleUrl, error: error.message })
      log('error', 'article_failed', { url: articleUrl, error: error.message })
    }
  }

  const runId = context.awsRequestId || uuid()
  const output = {
    schemaVersion: 1,
    runId,
    discoveredAt,
    invocation: event.source === 'aws.events' ? 'scheduled' : 'manual',
    candidates: candidates.size,
    discoveries,
    errors,
    autoPublish: false,
  }
  const runKey = `runs/${discoveredAt.slice(0, 10).replaceAll('-', '/')}/${runId}.json`
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: runKey,
    Body: JSON.stringify(output, null, 2),
    ContentType: 'application/json',
  }))
  log('info', 'run_complete', {
    runId,
    candidates: candidates.size,
    newDiscoveries: discoveries.length,
    failures: errors.length,
    runKey,
  })
  if (errors.length) {
    const failure = new Error(`patch_watcher_partial_failure:${errors.length}`)
    failure.cause = errors
    throw failure
  }
  return output
  }
}

export const handler = createHandler()
