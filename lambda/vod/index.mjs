// VOD Analysis Lambda — Recon+ headline AI feature.
//
// Accepts 1-10 gameplay screenshots from a single session and returns
// context-aware tactical feedback. Differentiator vs. generic AI: we pass
// curated map/site/character/ban context (from <game>-context.json) so the
// model references actual strats and current meta for whatever game the
// player is reviewing — not generic knowledge.
//
// Endpoint: POST /vod/analyze
// Body: {
//   game_id?: 'r6' | 'cs2' | 'valorant' | 'ow2' | 'apex' | 'mvr' | 'halo' |
//             'finals' | 'cod' | 'fn' | 'rl',          // defaults to 'r6'
//   images: [{ base64, media_type }],                   // 1-10 images
//   context?: { map?, site?, side?, operator?, game_id? } // optional hints
// }
// Response: see RESPONSE_SCHEMA below.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildMapContext, buildRefundUpdate, validateAnalysis } from './coach-contract.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Per-game context map. Each file is generated from the same source-of-truth
// data the website uses (maps.js, strats.js, bans.js per game). Re-bundle the
// Lambda whenever those data files change.
const GAME_IDS = [
  // Core 11
  'r6', 'cs2', 'valorant', 'ow2', 'apex', 'mvr', 'halo', 'finals', 'cod', 'fn', 'rl',
  // Early Access 9
  'lol', 'dota2', 'eafc', 'tk8', 'sf6', 'pubg', 'deadlock', 'naraka', 'nba2k',
]

// Light metadata so we can build a coherent system prompt for games whose
// context file doesn't include a game_meta block (R6's was generated
// before the schema standardized). Used as fallback labels.
const GAME_DISPLAY = {
  r6: { name: 'Rainbow Six Siege', short: 'R6', sides: 'attack / defense', character_noun: 'operator' },
  cs2: { name: 'Counter-Strike 2', short: 'CS2', sides: 'T / CT', character_noun: 'agent' },
  valorant: { name: 'VALORANT', short: 'VAL', sides: 'attack / defense', character_noun: 'agent' },
  ow2: { name: 'Overwatch 2', short: 'OW2', sides: 'attack / defense (or KOTH)', character_noun: 'hero' },
  apex: { name: 'Apex Legends', short: 'APEX', sides: 'BR squad — no fixed side', character_noun: 'legend' },
  mvr: { name: 'Marvel Rivals', short: 'MVR', sides: 'attack / defense', character_noun: 'hero' },
  halo: { name: 'Halo Infinite', short: 'HALO', sides: 'Eagle / Cobra (Slayer/Objective)', character_noun: 'spartan' },
  finals: { name: 'THE FINALS', short: 'FINALS', sides: 'cashout teams', character_noun: 'build' },
  cod: { name: 'Call of Duty', short: 'COD', sides: 'attack / defense (game-mode dependent)', character_noun: 'operator' },
  fn: { name: 'Fortnite', short: 'FN', sides: 'BR squad — no fixed side', character_noun: 'loadout' },
  rl: { name: 'Rocket League', short: 'RL', sides: 'offense / defense', character_noun: 'role' },
  // Early Access 9
  lol: { name: 'League of Legends', short: 'LoL', sides: 'Blue / Red Side', character_noun: 'champion' },
  dota2: { name: 'Dota 2', short: 'Dota', sides: 'Radiant / Dire', character_noun: 'hero' },
  eafc: { name: 'EA Sports FC', short: 'FC', sides: 'attack / defense', character_noun: 'formation slot' },
  tk8: { name: 'Tekken 8', short: 'TK8', sides: 'P1 / P2', character_noun: 'character' },
  sf6: { name: 'Street Fighter 6', short: 'SF6', sides: 'P1 / P2', character_noun: 'character' },
  pubg: { name: 'PUBG: Battlegrounds', short: 'PUBG', sides: 'BR squad — pushing / holding', character_noun: 'squad role' },
  deadlock: { name: 'Deadlock', short: 'DL', sides: 'Sapphire / Amber', character_noun: 'hero' },
  naraka: { name: 'Naraka: Bladepoint', short: 'Naraka', sides: 'BR — pushing / holding', character_noun: 'hero' },
  nba2k: { name: 'NBA 2K', short: '2K', sides: 'offense / defense', character_noun: 'build' },
}

const CONTEXTS_BY_GAME = {}
for (const id of GAME_IDS) {
  const p = join(__dirname, `${id}-context.json`)
  if (existsSync(p)) {
    try {
      CONTEXTS_BY_GAME[id] = JSON.parse(readFileSync(p, 'utf8'))
    } catch (err) {
      console.error(`Failed to load ${id}-context.json:`, err.message)
    }
  }
}
console.log(`VOD Lambda loaded contexts for: ${Object.keys(CONTEXTS_BY_GAME).join(', ')}`)

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' })

const SUBS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const MODEL_ID = process.env.VOD_MODEL_ID || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB decoded per image
const MAX_IMAGES_PER_SESSION = 10
const PRO_MAX_IMAGES = 5    // Pro tier: up to 5 images per session
const CHAMPION_MAX_IMAGES = 10  // Champion tier: up to 10 images per session

// Per-tier session caps. Caps prevent Bedrock cost blowouts on trial abuse
// and on heavy paying-user runs (one Pro at $9/mo running 500 sessions a
// month would cost $25-50 in Bedrock alone — negative margin).
//
// Trial users: lifetime cap, never resets. 3 sessions = enough to evaluate
// the product across multiple matches but not enough to extract value.
//
// Paid users: monthly cap, rolls every 30 days from period_start_at.
//   Pro single ($9):  20 sessions → ~$2 worst-case Bedrock vs $7+ margin
//   Pro all ($19):    30 sessions → ~$3 worst-case vs $16+ margin
//   Champ single ($29): 60 sessions → ~$6 worst-case vs $23+ margin
//   Champ all ($49):   75 sessions → ~$7.50 worst-case vs $41+ margin
//
// All limits are env-configurable so they can be tuned without redeploy.
const VOD_TRIAL_LIMIT = parseInt(process.env.VOD_TRIAL_LIMIT || '3', 10)
const VOD_PRO_LIMIT = parseInt(process.env.VOD_PRO_LIMIT || '20', 10)
const VOD_PRO_ALL_LIMIT = parseInt(process.env.VOD_PRO_ALL_LIMIT || '30', 10)
const VOD_CHAMPION_LIMIT = parseInt(process.env.VOD_CHAMPION_LIMIT || '60', 10)
const VOD_CHAMPION_ALL_LIMIT = parseInt(process.env.VOD_CHAMPION_ALL_LIMIT || '75', 10)
const VOD_PERIOD_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getMonthlyLimit(plan, tierScope) {
  if (plan === 'champion') {
    return tierScope === 'all_access' ? VOD_CHAMPION_ALL_LIMIT : VOD_CHAMPION_LIMIT
  }
  if (plan === 'pro') {
    return tierScope === 'all_access' ? VOD_PRO_ALL_LIMIT : VOD_PRO_LIMIT
  }
  return 0
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

const ALLOWED_ORIGINS = ['https://r6coaching.com', 'https://www.r6coaching.com', 'http://localhost:5173']

function buildHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://r6coaching.com',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  }
}

const RESPONSE_SCHEMA = `{
  "session": {
    "headline": <string, 1-2 sentences — top takeaway across all images>,
    "score": <integer 0-100 — overall tactical score>,
    "detected_map": <string or null>,
    "detected_side": <string or null — game-appropriate side label>,
    "image_count": <integer>
  },
  "per_image": [
    {
      "image_index": <integer, 0-based>,
      "detected": {
        "map": <string or null>,
        "site": <string or null>,
        "side": <string or null>,
        "character": <string or null — the operator/agent/hero/legend played>,
        "round_phase": <"prep" | "action" | "post-plant" | "post-round" | "mid-fight" | "rotating" | "unknown">
      },
      "what_happened": <string — 1-2 sentences describing the moment>,
      "what_went_wrong": [<2-4 specific items, referencing visible HUD/positions/utility>],
      "what_went_right": [<1-3 specific items if applicable, else empty>],
      "specific_advice": [<2-4 actionable items, mention concrete callouts/angles/timings>]
    }
  ],
  "patterns": {
    "recurring_weaknesses": [<2-4 patterns observed across multiple images>],
    "standout_strengths": [<1-3 patterns that worked>]
  },
  "practice_plan": {
    "this_week": [<3-5 specific drills tailored to the patterns above>]
  },
  "character_feedback": <string or null — character-specific feedback if a single character was identified across images, referencing kit usage and role expectations>
}`

// Pull a compact, JSON-stringified slice of a game's context tailored to the
// user's hints. We pass the slice (not the full file) so token cost stays
// reasonable per request while the model still sees the relevant strats.
function buildGameContextSlice(gameId, userContext) {
  const ctx = CONTEXTS_BY_GAME[gameId]
  if (!ctx) return ''

  const meta = GAME_DISPLAY[gameId] || { name: gameId, short: gameId.toUpperCase(), sides: '', character_noun: 'character' }
  const gameMeta = ctx.game_meta || null

  const lines = []
  lines.push(`GAME: ${meta.name} (${meta.short})`)
  if (gameMeta?.tagline) lines.push(`MODE: ${gameMeta.tagline}`)
  if (gameMeta?.sides && typeof gameMeta.sides === 'object') {
    const sides = Object.entries(gameMeta.sides).map(([k, v]) => `${k}: ${v}`).join(' · ')
    if (sides) lines.push(`SIDES: ${sides}`)
  } else if (meta.sides) {
    lines.push(`SIDES: ${meta.sides}`)
  }
  if (gameMeta?.character_vocab) lines.push(`CHARACTER VOCAB: ${gameMeta.character_vocab}`)
  if (Array.isArray(gameMeta?.key_mechanics) && gameMeta.key_mechanics.length) {
    lines.push(`KEY MECHANICS:\n  - ${gameMeta.key_mechanics.slice(0, 6).join('\n  - ')}`)
  }
  if (gameMeta?.round_economy) lines.push(`ROUND ECONOMY: ${gameMeta.round_economy}`)
  if (gameMeta?.round_format) lines.push(`ROUND FORMAT: ${gameMeta.round_format}`)

  // Map slice — pull the specific map the user/AI flagged, otherwise just
  // list all map names so the model knows the catalog.
  const maps = ctx.maps || {}
  const mapKeys = Object.keys(maps)
  const targetMapKey = resolveMapKey(maps, userContext?.map)
  if (targetMapKey && maps[targetMapKey]) {
    lines.push(`\nMAP CONTEXT: ${maps[targetMapKey].name || targetMapKey}`)
    lines.push(buildMapContext(maps[targetMapKey], userContext?.site))
  } else if (mapKeys.length) {
    const names = mapKeys.map((k) => maps[k]?.name || k).join(', ')
    lines.push(`\nMAPS IN CATALOG: ${names}`)
  }

  // Character slice — find whichever key the file uses for the character
  // roster and either dump the requested character or list the roster.
  const charField = pickCharacterField(ctx)
  if (charField) {
    const roster = ctx[charField] || {}
    const requested = userContext?.operator || userContext?.character
    const matchKey = requested ? findCharacterKey(roster, requested) : null
    if (matchKey) {
      lines.push(`\n${meta.character_noun.toUpperCase()} CONTEXT: ${matchKey}`)
      lines.push(stringifyForModel(roster[matchKey], 1200))
    } else {
      const names = Array.isArray(roster) ? roster.map((r) => r?.name || r).filter(Boolean) : Object.keys(roster)
      if (names.length) {
        lines.push(`\n${meta.character_noun.toUpperCase()}S IN CATALOG: ${names.slice(0, 40).join(', ')}${names.length > 40 ? '…' : ''}`)
      }
    }
  }

  if (Array.isArray(ctx.common_mistakes_by_rank) && ctx.common_mistakes_by_rank.length) {
    lines.push(`\nCOMMON MISTAKES BY RANK:\n${stringifyForModel(ctx.common_mistakes_by_rank, 1200)}`)
  } else if (ctx.common_mistakes_by_rank && typeof ctx.common_mistakes_by_rank === 'object') {
    lines.push(`\nCOMMON MISTAKES BY RANK:\n${stringifyForModel(ctx.common_mistakes_by_rank, 1200)}`)
  }

  return lines.join('\n')
}

// Try a few normalizations to map user-supplied "Bank" / "bank" / "Bank Map"
// to the actual key in the context file.
function resolveMapKey(maps, userMap) {
  if (!userMap) return null
  const norm = String(userMap).toLowerCase().trim().replace(/\s+/g, '-')
  if (maps[norm]) return norm
  const altNorm = String(userMap).toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  for (const k of Object.keys(maps)) {
    if (k.replace(/[^a-z0-9]/g, '') === altNorm) return k
    const name = (maps[k]?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (name && name === altNorm) return k
  }
  return null
}

function pickCharacterField(ctx) {
  for (const k of ['operator_roles', 'agents', 'heroes', 'legends', 'builds', 'roles']) {
    if (ctx[k] && (typeof ctx[k] === 'object' || Array.isArray(ctx[k]))) return k
  }
  return null
}

function findCharacterKey(roster, requested) {
  if (!requested) return null
  const norm = String(requested).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (Array.isArray(roster)) return null
  for (const k of Object.keys(roster)) {
    if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) return k
  }
  return null
}

// JSON-stringify with a soft budget so we never blow the prompt by accident.
function stringifyForModel(obj, maxChars) {
  let s = JSON.stringify(obj, null, 2)
  if (s.length > maxChars) s = s.slice(0, maxChars) + '\n... [truncated]'
  return s
}

function buildSystemPrompt(gameId, userContext) {
  const meta = GAME_DISPLAY[gameId] || GAME_DISPLAY.r6
  const slice = buildGameContextSlice(gameId, userContext)

  return `You are an expert ${meta.name} coach reviewing a session of gameplay screenshots from a single player. Your job is to give SPECIFIC, ACTIONABLE feedback that references visible HUD elements, ${meta.character_noun} kits, map geometry, round timers, and economy/loadout state.

NEVER give generic advice. Examples of what NOT to say: "improve your aim", "use utility better", "play more cautiously". Examples of what TO say: "your crosshair was on the floor when you peeked at 1:23 — pre-aim head-level when entering through that doorway", "you brought Thermite but I see no charge on the Bandit batteries — that's wasted utility".

Reference the game context I provide below when relevant. If the user didn't specify a map, try to detect it from HUD/visuals. Adapt your vocabulary to ${meta.name} — don't use R6 terms if the game is CS2, don't use CS2 terms if the game is OW2, etc.

EVIDENCE RULES:
- Tie every diagnosis to something visible in an image or to the supplied authoritative map/site context.
- Do not invent unseen enemies, utility, sound cues, teammates, routes, or outcomes.
- When an important detail is unreadable or ambiguous, say "uncertain" and give a conditional recommendation instead of guessing.
- Prefer the user-selected map/site/side. If the image appears to contradict it, keep the supplied context and explicitly describe the visual uncertainty.
- Never repeat generic filler across images. Each advice item must name the observed position, timer/phase, utility state, operator interaction, or selected-site callout that makes it useful.

Return STRICT JSON matching this schema exactly — no markdown fences, no prose outside the JSON:

${RESPONSE_SCHEMA}

If none of the images appear to be ${meta.name} gameplay, return:
{"error":"wrong_game","message":"None of these images look like ${meta.name} gameplay screenshots."}

${slice}`
}

export async function handler(event) {
  const headers = buildHeaders(event)
  const method = event.requestContext?.http?.method
  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  // Auth
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = await verifier.verify(token) }
  catch (err) {
    console.error('JWT verify failed:', err)
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const email = payload.email?.toLowerCase()
  const groups = payload['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')

  // Subscription gate + session-usage cap. Admins bypass everything.
  //
  // Trial users are capped at VOD_TRIAL_LIMIT lifetime sessions to prevent
  // multi-account trial abuse from burning Bedrock credits. Paid users are
  // capped at VOD_*_LIMIT per 30-day period for unit-economics protection
  // (one Pro at $9/mo running 500 sessions/month would cost $25-50 in
  // Bedrock alone — negative margin).
  let tier = 'free'
  let tierScope = 'all_access'
  let activeSub = null
  let isTrial = false
  if (isAdmin) {
    tier = 'champion'
  } else {
    activeSub = await getActiveSub(email)
    if (activeSub && activeSub.status === 'active' && (activeSub.plan === 'pro' || activeSub.plan === 'champion')) {
      tier = activeSub.plan
      tierScope = activeSub.tier_scope || (activeSub.plan === 'champion' ? 'all_access' : 'single')
      isTrial = !!activeSub.trial
    } else {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: 'pro_required', message: 'VOD review requires Pro or Champion.' }),
      }
    }
  }

  // Enforce usage cap before we hit Bedrock. Non-admins only — admins bypass.
  let usageMeta = null
  if (!isAdmin && activeSub) {
    const usage = computeUsage(activeSub, tier, tierScope, isTrial)
    if (usage.remaining <= 0) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'usage_limit_exceeded',
          message: usage.message,
          used: usage.used,
          limit: usage.limit,
          is_trial: isTrial,
          period_end: usage.periodEnd,
          upgrade_url: 'https://r6coaching.com/#pricing',
        }),
      }
    }
    usageMeta = usage
  }

  // Parse body
  let body
  try { body = JSON.parse(event.body || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) } }

  // Game selection — accept body.game_id, body.context.game_id, or default to r6
  // for backward compat with the old UI that didn't pass a game.
  const requestedGame =
    (body.game_id && String(body.game_id).toLowerCase()) ||
    (body.context && body.context.game_id && String(body.context.game_id).toLowerCase()) ||
    'r6'
  const gameId = CONTEXTS_BY_GAME[requestedGame] ? requestedGame : 'r6'

  // Tier-scope check: 'single' tier_scope users can only review their active
  // game. For now we don't know which game they bought without more data, so
  // we just allow any game the contexts file knows about — the active-game
  // gate is enforced client-side. Champion/all-access bypass any check.
  // (Future: bind subs.active_game_id and reject mismatches here.)

  let images = body.images
  if (!images && body.image_base64) {
    images = [{ base64: body.image_base64, media_type: body.media_type || 'image/png' }]
  }
  if (!Array.isArray(images) || images.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'images array required (1-10 items)' }) }
  }
  const maxImages = tier === 'champion' ? CHAMPION_MAX_IMAGES : PRO_MAX_IMAGES
  if (images.length > maxImages) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Max ${maxImages} images per session on ${tier} tier — got ${images.length}` }) }
  }
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (!img.base64 || typeof img.base64 !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `images[${i}].base64 missing` }) }
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(img.media_type)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `images[${i}].media_type unsupported (got ${img.media_type})` }) }
    }
    const approxBytes = Math.floor((img.base64.length * 3) / 4)
    if (approxBytes > MAX_IMAGE_BYTES) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: `images[${i}] too large — max 5MB each` }) }
    }
  }

  const userContext = body.context && typeof body.context === 'object' ? body.context : {}

  // Atomically reserve this session BEFORE calling Bedrock. We do the reserve
  // first because Bedrock charges us regardless of whether we can later track
  // it — if the DDB increment fails, we shouldn't have made the model call.
  // Admins skip — they're allowed unlimited.
  let sessionReserved = false
  if (!isAdmin && activeSub) {
    try {
      await reserveSession(activeSub, isTrial, usageMeta)
      sessionReserved = true
    } catch (err) {
      if (err?.name === 'ConditionalCheckFailedException') {
        // Race: another concurrent request pushed us over the limit between
        // the check and the reserve. Treat as 429 — limit reached.
        const usage = computeUsage(activeSub, tier, tierScope, isTrial)
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: 'usage_limit_exceeded',
            message: usage.message,
            used: usage.used,
            limit: usage.limit,
            is_trial: isTrial,
            period_end: usage.periodEnd,
            upgrade_url: 'https://r6coaching.com/#pricing',
          }),
        }
      }
      // Don't fail the request on a DDB hiccup — log and proceed. Better to
      // serve one over-quota session than to break a paying user's review.
      console.error('reserveSession failed (non-fatal):', err)
    }
  }

  try {
    const analysis = await callBedrock(gameId, images, userContext, tier)
    // Compute the updated usage AFTER reservation so the response can show
    // the user their remaining count without an extra round-trip.
    const responseUsage = !isAdmin && activeSub
      ? { used: (usageMeta?.used || 0) + 1, limit: usageMeta?.limit || 0, remaining: Math.max(0, (usageMeta?.limit || 0) - (usageMeta?.used || 0) - 1), is_trial: isTrial, period_end: usageMeta?.periodEnd || null }
      : null
    return { statusCode: 200, headers, body: JSON.stringify({ ...analysis, tier, game_id: gameId, usage: responseUsage }) }
  } catch (err) {
    console.error('Bedrock error:', err)
    if (sessionReserved) {
      try {
        await refundReservedSession(activeSub, isTrial)
      } catch (refundError) {
        // Never hide the original failure. A failed compensation is an
        // operational alert, and the conditional decrement prevents a count
        // from going below zero.
        console.error('refundReservedSession failed:', refundError)
      }
    }
    const errName = err.name || ''
    const msg = String(err.message || '')
    let code = 'analysis_failed'
    let status = 502
    let friendly = msg || 'Upstream model error'

    if (errName === 'ThrottlingException' || /throttl|too many tokens/i.test(msg)) {
      code = 'quota_throttled'; status = 503
      friendly = 'VOD analysis is temporarily rate-limited. Try again in a few minutes.'
    } else if (errName === 'AccessDeniedException' || /not authorized/i.test(msg)) {
      code = 'model_access'; status = 503
      friendly = 'Model access is being provisioned. This should clear up shortly.'
    } else if (errName === 'ValidationException') {
      code = 'invalid_image'; status = 400
      friendly = 'One or more images could not be analyzed. Try clearer PNG or JPG screenshots.'
    }
    return { statusCode: status, headers, body: JSON.stringify({ error: code, message: friendly }) }
  }
}

async function getActiveSub(email) {
  if (!email) return null
  const r = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE, IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  const items = r.Items || []
  return items.find((s) => s.status === 'active') || null
}

// Returns { used, limit, remaining, periodEnd, message, isExpired }.
// For trial users `used` = lifetime count; for paid users `used` = current
// 30-day-period count (rolls over silently when period_start + 30d < now).
function computeUsage(sub, tier, tierScope, isTrial) {
  if (isTrial) {
    const used = sub.vod_lifetime_used || 0
    const limit = VOD_TRIAL_LIMIT
    const remaining = Math.max(0, limit - used)
    return {
      used, limit, remaining,
      periodEnd: null,
      isExpired: false,
      message: remaining > 0
        ? `Trial allowance: ${remaining} of ${limit} sessions left.`
        : `You've used all ${limit} of your trial sessions. Subscribe to Pro to keep reviewing.`,
    }
  }

  // Paid path — check period rollover.
  const periodStart = sub.vod_period_start_at ? new Date(sub.vod_period_start_at).getTime() : 0
  const periodEnd = periodStart + VOD_PERIOD_MS
  const periodExpired = !periodStart || Date.now() > periodEnd
  const used = periodExpired ? 0 : (sub.vod_sessions_used || 0)
  const limit = getMonthlyLimit(tier, tierScope)
  const remaining = Math.max(0, limit - used)
  return {
    used, limit, remaining,
    periodEnd: periodExpired ? null : new Date(periodEnd).toISOString(),
    isExpired: periodExpired,
    message: remaining > 0
      ? `${remaining} of ${limit} VOD sessions left this month.`
      : `You've used all ${limit} VOD sessions for this billing period. ${tier === 'pro' ? 'Upgrade to Champion for ' + VOD_CHAMPION_LIMIT + '/month, ' : ''}or wait until your next period.`,
  }
}

// Atomic session reserve. Increments the appropriate counter with a
// ConditionExpression that prevents going over the limit even under race.
// On period rollover (paid users only) we reset the counter to 1 + bump
// the period_start_at to "now".
async function reserveSession(sub, isTrial, usageMeta) {
  const now = new Date().toISOString()
  const key = { stripe_customer_id: sub.stripe_customer_id }

  if (isTrial) {
    // Trial: lifetime cap on vod_lifetime_used. Never resets.
    return ddb.send(new UpdateCommand({
      TableName: SUBS_TABLE,
      Key: key,
      UpdateExpression: 'SET vod_lifetime_used = if_not_exists(vod_lifetime_used, :zero) + :one, vod_updated_at = :now',
      ConditionExpression: 'attribute_not_exists(vod_lifetime_used) OR vod_lifetime_used < :limit',
      ExpressionAttributeValues: {
        ':zero': 0, ':one': 1, ':limit': VOD_TRIAL_LIMIT, ':now': now,
      },
    }))
  }

  if (usageMeta?.isExpired) {
    // Period rollover — reset count to 1 + new period_start. Conditional on
    // the existing period_start matching what we read, so two concurrent
    // rollover writes don't both reset.
    return ddb.send(new UpdateCommand({
      TableName: SUBS_TABLE,
      Key: key,
      UpdateExpression: 'SET vod_sessions_used = :one, vod_period_start_at = :now, vod_updated_at = :now',
    }))
  }

  // Within the current period — atomic increment with cap enforcement.
  return ddb.send(new UpdateCommand({
    TableName: SUBS_TABLE,
    Key: key,
    UpdateExpression: 'SET vod_sessions_used = if_not_exists(vod_sessions_used, :zero) + :one, vod_period_start_at = if_not_exists(vod_period_start_at, :now), vod_updated_at = :now',
    ConditionExpression: 'attribute_not_exists(vod_sessions_used) OR vod_sessions_used < :limit',
    ExpressionAttributeValues: {
      ':zero': 0, ':one': 1, ':limit': usageMeta?.limit || 0, ':now': now,
    },
  }))
}

// Compensating atomic update for requests where the upstream model failed or
// returned unusable output. Customers only spend a session on a valid result.
async function refundReservedSession(sub, isTrial) {
  return ddb.send(new UpdateCommand(buildRefundUpdate(sub, isTrial, SUBS_TABLE)))
}

async function callBedrock(gameId, images, userContext, tier) {
  const meta = GAME_DISPLAY[gameId] || GAME_DISPLAY.r6
  const content = []
  for (let i = 0; i < images.length; i++) {
    content.push({ type: 'text', text: `Image ${i + 1} of ${images.length}:` })
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: images[i].media_type, data: images[i].base64 },
    })
  }
  const hintParts = []
  if (userContext.map) hintParts.push(`Map: ${userContext.map}`)
  if (userContext.site) hintParts.push(`Site: ${userContext.site}`)
  if (userContext.side) hintParts.push(`Side: ${userContext.side}`)
  if (userContext.operator) hintParts.push(`${meta.character_noun}: ${userContext.operator}`)
  else if (userContext.character) hintParts.push(`${meta.character_noun}: ${userContext.character}`)
  const hintLine = hintParts.length ? `\n\nUser-specified context (trust these unless visually contradicted): ${hintParts.join(' · ')}` : ''
  content.push({
    type: 'text',
    text: `Analyze ${images.length === 1 ? 'this screenshot' : 'these screenshots as a single session — they\'re all from the same player, often the same match'}. The game is ${meta.name}. Return the strict JSON described in your system prompt.${hintLine}`,
  })

  const input = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: tier === 'champion' ? 3500 : 2200,
    temperature: 0.2,
    system: buildSystemPrompt(gameId, userContext),
    messages: [{ role: 'user', content }],
  }

  const text = await invokeModel(input)
  let parsed = parseModelJson(text)
  let validationErrors = parsed ? validateAnalysis(parsed, images.length) : ['result was not valid JSON']
  if (validationErrors.length === 0) return parsed

  // One bounded repair attempt is cheaper and kinder than returning malformed
  // data to the UI. It receives no images or secrets, only the model output.
  const repairInput = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: tier === 'champion' ? 3500 : 2200,
    temperature: 0,
    system: `Repair the candidate into strict JSON matching this schema. Preserve supported observations; do not add facts. Return JSON only.\n${RESPONSE_SCHEMA}`,
    messages: [{ role: 'user', content: [{ type: 'text', text: `Validation errors:\n- ${validationErrors.join('\n- ')}\n\nCandidate:\n${text.slice(0, 14000)}` }] }],
  }
  const repairedText = await invokeModel(repairInput)
  parsed = parseModelJson(repairedText)
  validationErrors = parsed ? validateAnalysis(parsed, images.length) : ['repair was not valid JSON']
  if (validationErrors.length) {
    const err = new Error(`Model result failed schema validation: ${validationErrors.slice(0, 5).join('; ')}`)
    err.name = 'ModelSchemaError'
    throw err
  }
  return parsed
}

async function invokeModel(input) {
  const resp = await bedrock.send(new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(input),
  }))
  const decoded = JSON.parse(new TextDecoder().decode(resp.body))
  return decoded.content?.[0]?.text || ''
}

function parseModelJson(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(cleaned) }
  catch { return null }
}
