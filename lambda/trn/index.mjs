// recon6-trn — server-side proxy to the Tracker Network (tracker.gg) R6 API.
//
// Why a proxy: the TRN API key must stay secret, so it can never live in the
// browser. This Lambda holds the key in an env var, is Cognito-authed (only
// signed-in users can call it), and caches responses in-memory per container
// to respect TRN's free-tier rate limit. The /progress page calls
// GET /me/trn-stats?platform=&ign= and renders the rank/RP/KD it returns.
//
// TRN endpoint shape is configurable via env (TRN_GAME segment) because the
// Siege X rebrand shifted some paths — set once after a live test, no code
// change needed.

import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

const TRN_KEY = process.env.TRN_API_KEY || ''
const TRN_GAME = process.env.TRN_GAME || 'r6siege' // 'r6siege' or legacy 'r6'
const TRN_BASE = 'https://public-api.tracker.gg/v2'
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }))

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
// move within a session, and this is the whole rate-limit defense.
const cache = new Map()
const TTL_MS = 10 * 60 * 1000
const subjectWindows = new Map()
const SUBJECT_WINDOW_MS = 10 * 60 * 1000
const SUBJECT_LOOKUP_LIMIT = 6
let circuitOpenUntil = 0

const PLATFORM = { ps5: 'psn', psn: 'psn', xbox: 'xbl', xbl: 'xbl', pc: 'ubi', ubi: 'ubi' }

function pickStat(segments, names) {
  for (const seg of segments || []) {
    for (const n of names) {
      const s = seg?.stats?.[n]
      if (s && s.value != null) return { value: s.value, display: s.displayValue }
    }
  }
  return null
}

async function hasPaidAccess(claims) {
  if ((claims?.['cognito:groups'] || []).includes('admins')) return true
  const email = String(claims?.email || '').trim().toLowerCase()
  if (!email) return false
  const r = await ddb.send(new QueryCommand({
    TableName: SUBSCRIPTIONS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  return (r.Items || []).some((row) =>
    ['active', 'trialing'].includes(row.status) &&
    ['pro', 'elite', 'champion'].includes(row.plan) &&
    Number.isFinite(Date.parse(row.current_period_end || '')) &&
    Date.parse(row.current_period_end) > Date.now()
  )
}

function consumeSubjectLookup(subject) {
  const now = Date.now()
  const current = subjectWindows.get(subject)
  const state = !current || now - current.startedAt >= SUBJECT_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current
  if (state.count >= SUBJECT_LOOKUP_LIMIT) return false
  state.count += 1
  subjectWindows.set(subject, state)
  return true
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || 'GET'
  if (method === 'OPTIONS') return resp(200, {})

  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return resp(401, { error: 'sign in required' })
  let claims
  try { claims = await verifier.verify(token) } catch { return resp(401, { error: 'invalid token' }) }
  if (claims.email_verified !== true) return resp(403, { error: 'verified email required' })
  if (!(await hasPaidAccess(claims))) return resp(403, { error: 'active paid membership required' })

  if (!TRN_KEY) return resp(503, { error: 'tracker not configured yet' })

  const q = event.queryStringParameters || {}
  const platform = PLATFORM[String(q.platform || '').toLowerCase()]
  const ign = String(q.ign || '').trim()
  if (!platform || !ign) return resp(400, { error: 'platform and ign required' })
  if (ign.length > 32 || !/^[\p{L}\p{N}_. -]+$/u.test(ign)) return resp(400, { error: 'invalid player name' })

  const cacheKey = `${platform}/${ign.toLowerCase()}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL_MS) return resp(hit.status || 200, { ...hit.data, cached: true })
  if (Date.now() < circuitOpenUntil) return resp(429, { error: 'tracker is rate limited — try again in a minute' })
  if (!consumeSubjectLookup(claims.sub)) return resp(429, { error: 'too many new player lookups — try again later' })

  const url = `${TRN_BASE}/${TRN_GAME}/standard/profile/${platform}/${encodeURIComponent(ign)}`
  let r
  try {
    r = await fetch(url, { headers: { 'TRN-Api-Key': TRN_KEY, Accept: 'application/json' } })
  } catch {
    return resp(502, { error: 'tracker unreachable' })
  }
  if (r.status === 404) {
    const data = { error: 'profile not found — check the name/platform' }
    cache.set(cacheKey, { at: Date.now(), status: 404, data })
    return resp(404, data)
  }
  if (r.status === 429) {
    circuitOpenUntil = Date.now() + 60 * 1000
    return resp(429, { error: 'tracker rate limit — try again in a minute' })
  }
  if (!r.ok) return resp(502, { error: `tracker error ${r.status}` })

  let body
  try { body = await r.json() } catch { return resp(502, { error: 'bad tracker response' }) }

  // Admin-only structure probe: reveals the response SHAPE (segment types +
  // stat KEY names, no values, no PII) so the richer parser can be wired to the
  // fields TRN actually returns post-Siege-X-rebrand. Remove once parse is in.
  const groups = claims?.['cognito:groups'] || []
  if (q.debug === 'structure' && groups.includes('admins')) {
    const segs = body?.data?.segments || []
    return resp(200, {
      debug: 'structure',
      game: TRN_GAME,
      dataKeys: Object.keys(body?.data || {}),
      platformInfoKeys: Object.keys(body?.data?.platformInfo || {}),
      segmentCount: segs.length,
      segments: segs.map((s) => ({
        type: s.type,
        attributes: s.attributes || {},
        metadataName: s.metadata?.name ?? null,
        statKeys: Object.keys(s.stats || {}),
      })),
    })
  }

  // Parse defensively — TRN nests stats under data.segments[].stats.<name>.
  const segments = body?.data?.segments || []
  const overview = segments.find((s) => s.type === 'overview') || segments[0]
  const out = {
    name: body?.data?.platformInfo?.platformUserHandle || ign,
    avatar: body?.data?.platformInfo?.avatarUrl || null,
    rank: pickStat([overview], ['rankedRankName', 'rank', 'seasonalRankName'])?.display || null,
    mmr: pickStat([overview], ['rankedMmr', 'mmr', 'rankedPoints'])?.value ?? null,
    kd: pickStat([overview], ['kd', 'kdRatio'])?.display || null,
    winPct: pickStat([overview], ['wlPercentage', 'winPct'])?.display || null,
    level: pickStat([overview], ['level'])?.value ?? null,
    profileUrl: `https://r6.tracker.network/r6siege/profile/${platform}/${encodeURIComponent(ign)}/overview`,
  }
  cache.set(cacheKey, { at: Date.now(), status: 200, data: out })
  return resp(200, out)
}
