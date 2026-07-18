import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalizeUrl, contentHash, createHandler, extractArticleUrls } from './index.mjs'

test('canonicalizeUrl strips query and fragment from official R6 URLs', () => {
  assert.equal(
    canonicalizeUrl('https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/test?foo=1#x'),
    'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/test',
  )
})

test('canonicalizeUrl rejects non-Ubisoft and lookalike hosts', () => {
  assert.throws(() => canonicalizeUrl('https://evil.example/news-updates/x'), /source_not_allowed/)
  assert.throws(() => canonicalizeUrl('https://www.ubisoft.com.evil.example/en-us/game/rainbow-six/siege/news-updates/x'), /source_not_allowed/)
})

test('extractArticleUrls returns unique allowed article links only', () => {
  const html = [
    '<a href="/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2">one</a>',
    '<a href="https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2?x=1">duplicate</a>',
    '<a href="https://example.com/en-us/game/rainbow-six/siege/news-updates/nope">external</a>',
  ].join('')
  assert.deepEqual(extractArticleUrls(html, 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates'), [
    'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2',
  ])
})

test('contentHash is deterministic SHA-256', () => {
  assert.equal(contentHash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

function htmlResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    text: async () => body,
  }
}

test('handler stores evidence and records a pending review without publishing', async () => {
  process.env.PATCH_EVENTS_TABLE = 'events'
  process.env.PATCH_SNAPSHOTS_BUCKET = 'snapshots'
  const sent = []
  const client = { send: async (command) => { sent.push(command); return {} } }
  const article = 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/y11s2'
  const fetchImpl = async (url) => url === 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates'
    ? htmlResponse(`<a href="${article}">notes</a>`)
    : htmlResponse('<main>official patch notes</main>')
  const handler = createHandler({
    fetchImpl,
    dynamodbClient: client,
    s3Client: client,
    now: () => new Date('2026-07-18T12:00:00.000Z'),
    uuid: () => 'run-1',
  })

  const result = await handler({ source: 'aws.events' }, { awsRequestId: 'request-1' })

  assert.equal(result.autoPublish, false)
  assert.equal(result.discoveries.length, 1)
  assert.equal(result.discoveries[0].status, 'pending_review')
  assert.equal(result.errors.length, 0)
  assert.equal(sent.filter((command) => command.constructor.name === 'PutObjectCommand').length, 2)
  assert.equal(sent.filter((command) => command.constructor.name === 'PutItemCommand').length, 1)
})

test('handler throws after persisting the run when any article fails so retries and DLQ activate', async () => {
  process.env.PATCH_EVENTS_TABLE = 'events'
  process.env.PATCH_SNAPSHOTS_BUCKET = 'snapshots'
  const sent = []
  const client = { send: async (command) => { sent.push(command); return {} } }
  const article = 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/broken'
  const fetchImpl = async (url) => url.endsWith('/news-updates')
    ? htmlResponse(`<a href="${article}">notes</a>`)
    : htmlResponse('unavailable', 503)
  const handler = createHandler({ fetchImpl, dynamodbClient: client, s3Client: client })

  await assert.rejects(handler({}, { awsRequestId: 'request-2' }), /patch_watcher_partial_failure:1/)
  assert.equal(sent.filter((command) => command.constructor.name === 'PutObjectCommand').length, 1)
})
