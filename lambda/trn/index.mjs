// recon6-trn — server-side proxy to the Tracker Network (tracker.gg) R6 API.
//
// Why a proxy: the TRN API key must stay secret, so it can never live in the
// browser. This Lambda holds the key in an env var, is Cognito-authed (only
// signed-in users can call it), and caches responses in-memory per container
// to respect TRN's rate limit. Successful live refreshes are also forwarded
// to Recon's IAM-only player-data ingest Lambda when that integration is
// configured. Customer TRN passwords are never requested or stored.

import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'

const TRN_KEY = process.env.TRN_API_KEY || ''
const TRN_GAME = process.env.TRN_GAME || 'r6siege' // 'r6siege' or legacy 'r6'
const TRN_BASE = 'https://public-api.tracker.gg/v2'
const PLAYER_DATA_INGEST_FUNCTION = process.env.PLAYER_DATA_INGEST_FUNCTION || ''
const lambda = new LambdaClient({})

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '5bpa1cteenctoue24v4e245re8',
})

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}
const resp = (code, obj) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(obj) })

// Per-container cache: key → { at, data }. 10-minute TTL. Ranked stats barely
// move within a session, and this is the first line of rate-limit defense.
const cache = new Map()
const TTL_MS = 10 * 60 * 1000

const PLATFORM = { ps5: 'psn', psn: 'psn', xbox: 'xbl', xbl: 'xbl', pc: 'ubi', ubi: 'ubi' }

function pickStat(segments, names) {
  for (const seg of segments || []) {
    for (const n of names) {
      const s = seg?.stats?.[n]
      if (s && s.value != null) return { name: n, value: s.value, display: s.displayValue }
    }
  }
  return null
}

function compactFields(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && value !== ''))
}

async function publishPlayerDataBundle(user, bundle) {
  if (!PLAYER_DATA_INGEST_FUNCTION || !user?.sub) return
  try {
    await lambda.send(new InvokeCommand({
      FunctionName: PLAYER_DATA_INGEST_FUNCTION,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({
        source: 'recon.player-data-provider',
        detail: {
          action: 'ingest_bundle',
          producer: 'trn',
          owner_user_id: user.sub,
          owner_email: user.email || null,
          ...bundle,
        },
      })),
    }))
  } catch (err) {
    // Player history persistence must not break the live tracker experience.
    console.error('TRN player-data publish failed:', err?.name || err?.message || 'unknown')
  }
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || 'GET'
  if (method === 'OPTIONS') return resp(200, {})

  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return resp(401, { error: 'sign in required' })
  let user
  try { user = await verifier.verify(token) } catch { return resp(401, { error: 'invalid token' }) }

  if (!TRN_KEY) return resp(503, { error: 'tracker not configured yet' })

  const q = event.queryStringParameters || {}
  const platform = PLATFORM[String(q.platform || '').toLowerCase()]
  const ign = String(q.ign || '').trim()
  if (!platform || !ign) return resp(400, { error: 'platform and ign required' })

  const cacheKey = `${platform}/${ign.toLowerCase()}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL_MS) return resp(200, { ...hit.data, cached: true })

  const url = `${TRN_BASE}/${TRN_GAME}/standard/profile/${platform}/${encodeURIComponent(ign)}`
  const startedAt = Date.now()
  let r
  try {
    r = await fetch(url, { headers: { 'TRN-Api-Key': TRN_KEY, Accept: 'application/json' } })
  } catch {
    await publishPlayerDataBundle(user, {
      provider_health: [{ provider: 'trn', status: 'down', latency_ms: Date.now() - startedAt, error_code: 'network_unreachable' }],
    })
    return resp(502, { error: 'tracker unreachable' })
  }
  if (r.status === 404) return resp(404, { error: 'profile not found — check the name/platform' })
  if (r.status === 429) {
    await publishPlayerDataBundle(user, {
      provider_health: [{ provider: 'trn', status: 'rate_limited', latency_ms: Date.now() - startedAt, error_code: 'http_429' }],
    })
    return resp(429, { error: 'tracker rate limit — try again in a minute' })
  }
  if (!r.ok) {
    await publishPlayerDataBundle(user, {
      provider_health: [{ provider: 'trn', status: 'degraded', latency_ms: Date.now() - startedAt, error_code: `http_${r.status}` }],
    })
    return resp(502, { error: `tracker error ${r.status}` })
  }

  let body
  try { body = await r.json() } catch {
    await publishPlayerDataBundle(user, {
      provider_health: [{ provider: 'trn', status: 'schema_changed', latency_ms: Date.now() - startedAt, error_code: 'invalid_json' }],
    })
    return resp(502, { error: 'bad tracker response' })
  }

  // Parse defensively — TRN nests stats under data.segments[].stats.<name>.
  const segments = body?.data?.segments || []
  const overview = segments.find((s) => s.type === 'overview') || segments[0]
  const rankStat = pickStat([overview], ['rankedRankName', 'rank', 'seasonalRankName'])
  const pointsStat = pickStat([overview], ['rankedMmr', 'mmr', 'rankedPoints'])
  const kdStat = pickStat([overview], ['kd', 'kdRatio'])
  const winStat = pickStat([overview], ['wlPercentage', 'winPct'])
  const levelStat = pickStat([overview], ['level'])
  const out = {
    name: body?.data?.platformInfo?.platformUserHandle || ign,
    avatar: body?.data?.platformInfo?.avatarUrl || null,
    rank: rankStat?.display || null,
    mmr: pointsStat?.value ?? null,
    kd: kdStat?.display || null,
    winPct: winStat?.display || null,
    level: levelStat?.value ?? null,
    profileUrl: `https://r6.tracker.network/r6siege/profile/${platform}/${encodeURIComponent(ign)}/overview`,
  }
  cache.set(cacheKey, { at: Date.now(), data: out })

  const capturedAt = new Date().toISOString()
  const platformInfo = body?.data?.platformInfo || {}
  const platformUserId = platformInfo.platformUserId || platformInfo.platformUserIdentifier || null
  const trnExternalId = `${platform}:${platformUserId || out.name.toLowerCase()}`
  await publishPlayerDataBundle(user, {
    identities: [{
      provider: 'trn',
      external_id: trnExternalId,
      username: out.name,
      verified: true,
      verification: 'verified_external',
      source: 'trn',
    }],
    snapshots: [{
      snapshot_id: `trn-${Date.now()}`,
      snapshot_type: 'trn_refresh',
      fields: compactFields({
        tracker_name: out.name,
        platform,
        rank: out.rank,
        rank_points: pointsStat?.value ?? null,
        kd: kdStat?.value ?? kdStat?.display ?? null,
        win_rate: winStat?.value ?? winStat?.display ?? null,
        level: out.level,
      }),
      source: 'trn',
      captured_at: capturedAt,
      confidence: 0.9,
      verification: 'verified_external',
      visibility: 'private',
    }],
    events: [{
      event_type: 'external_profile_refreshed',
      occurred_at: capturedAt,
      source: 'trn',
      visibility: 'private',
      data: { provider: 'trn', platform },
    }],
    provider_health: [{
      provider: 'trn',
      status: 'healthy',
      observed_at: capturedAt,
      latency_ms: Date.now() - startedAt,
      schema_version: TRN_GAME,
    }],
  })

  return resp(200, out)
}
