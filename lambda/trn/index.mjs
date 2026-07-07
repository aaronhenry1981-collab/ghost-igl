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

const TRN_KEY = process.env.TRN_API_KEY || ''
const TRN_GAME = process.env.TRN_GAME || 'r6siege' // 'r6siege' or legacy 'r6'
const TRN_BASE = 'https://public-api.tracker.gg/v2'

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

export async function handler(event) {
  const method = event.requestContext?.http?.method || 'GET'
  if (method === 'OPTIONS') return resp(200, {})

  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return resp(401, { error: 'sign in required' })
  try { await verifier.verify(token) } catch { return resp(401, { error: 'invalid token' }) }

  if (!TRN_KEY) return resp(503, { error: 'tracker not configured yet' })

  const q = event.queryStringParameters || {}
  const platform = PLATFORM[String(q.platform || '').toLowerCase()]
  const ign = String(q.ign || '').trim()
  if (!platform || !ign) return resp(400, { error: 'platform and ign required' })

  const cacheKey = `${platform}/${ign.toLowerCase()}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL_MS) return resp(200, { ...hit.data, cached: true })

  const url = `${TRN_BASE}/${TRN_GAME}/standard/profile/${platform}/${encodeURIComponent(ign)}`
  let r
  try {
    r = await fetch(url, { headers: { 'TRN-Api-Key': TRN_KEY, Accept: 'application/json' } })
  } catch {
    return resp(502, { error: 'tracker unreachable' })
  }
  if (r.status === 404) return resp(404, { error: 'profile not found — check the name/platform' })
  if (r.status === 429) return resp(429, { error: 'tracker rate limit — try again in a minute' })
  if (!r.ok) return resp(502, { error: `tracker error ${r.status}` })

  let body
  try { body = await r.json() } catch { return resp(502, { error: 'bad tracker response' }) }

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
  cache.set(cacheKey, { at: Date.now(), data: out })
  return resp(200, out)
}
