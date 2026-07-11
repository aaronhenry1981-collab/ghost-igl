import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import crypto from 'node:crypto'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const SUBS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
const REFERRALS_TABLE = process.env.REFERRALS_TABLE || 'ghost-igl-referrals'
// Referral cooldown — referred subscription must clear this window before
// counting toward the referrer's "3 active referrals = free month" credit.
// Set to 30 days to cover the 7-day refund window plus dunning churn.
const REFERRAL_QUALIFY_DAYS = 30

// Hybrid referral program window. The program launched 2026-05-11. For
// the first 90 days any paid tier subscriber can refer + earn a free
// month at their current tier (founding-referrer pattern, parallel to
// founding pricing). After 2026-08-09, NEW referrers must be on Champion+
// All-Access to qualify; founding referrers who locked in before that
// keep their benefit at their original tier forever.
const REFERRAL_PROGRAM_LAUNCH_ISO = '2026-05-11T00:00:00.000Z'
const REFERRAL_FOUNDING_WINDOW_DAYS = 90
const REFERRAL_FOUNDING_CUTOFF_MS =
  Date.parse(REFERRAL_PROGRAM_LAUNCH_ISO) +
  REFERRAL_FOUNDING_WINDOW_DAYS * 86400000

// Decide whether a given referrer is eligible to earn the free-month
// comp. Three rules in order of precedence:
//   1. Founding referrer (first paid sub before the cutoff) → always eligible
//      at their original tier, forever
//   2. Currently a Champion+ All-Access subscriber → eligible regardless
//      of when they joined
//   3. Else: not eligible (post-launch restriction)
function referrerIsEligible({ plan, tierScope, foundingReferrer, isAdmin }) {
  if (isAdmin) return true
  if (foundingReferrer) return true
  return plan === 'champion' && tierScope === 'all_access'
}

// Has the founding window passed? Used by getMyReferrals to label new
// signups correctly (founding/post-launch) and to decide which copy to
// show on the dashboard widget.
function isFoundingWindowOpen(now = Date.now()) {
  return now < REFERRAL_FOUNDING_CUTOFF_MS
}
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const PORTAL_RETURN_URL = process.env.PORTAL_RETURN_URL || 'https://r6coaching.com/#/account'
const DESKTOP_TOKEN_SECRET = process.env.DESKTOP_TOKEN_SECRET || ''
const ACTIVATION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

const ALLOWED_ORIGINS = ['https://r6coaching.com', 'https://www.r6coaching.com', 'http://localhost:5173']
// Profile fields stored in ghost-igl-profiles. Game-agnostic identity fields
// (display_name, platform, region, discord, etc.) apply to every Recon+ game.
// Game-specific fields (R6 rank, role, ubi username, etc.) are nested inside
// game_profiles_json — stored as a JSON-encoded string so this Lambda doesn't
// need separate validation per game. Frontend parses + validates per game.
//
// Legacy fields (discord_handle, gamer_id, etc.) are kept for backward compat
// with existing profile rows; new signups use the modern names.
const ALLOWED_PROFILE_FIELDS = [
  // Modern fields — preferred
  'display_name',          // "gamer tag" — public-facing display name
  'discord_username',      // for cold-DM contact
  'platform',              // 'pc' | 'xbox' | 'ps5'
  'region',                // 'na' | 'eu' | 'sa' | 'apac'
  'referral_source',       // 'reddit' | 'youtube' | 'discord' | 'twitter' | 'friend' | 'google' | 'other'
  'game_profiles_json',    // JSON string: { r6: { rank, goal_rank, main_role, ubisoft_username, squad_size }, cs2: {...}, ... }
  'active_game_id',        // 'r6' | 'cs2' | 'valorant' | 'ow2' | 'apex' | 'mvr' | 'halo' | 'finals' | 'cod' | 'fn' | 'rl'
  // Legacy fields kept for backward compatibility with existing rows
  'discord_handle',
  'gamer_id',
  'preferred_server',
  'main_role',
]

// Referral system fields — stored on the profile but not user-editable via
// PUT /me. referral_code is auto-generated on first /me access; referred_by
// is set once via POST /me/referral-attribution and never overwritten.
const REFERRAL_FIELDS = ['referral_code', 'referred_by']

// HMAC-signed activation token format: <base64url-payload>.<base64url-signature>
// Server-issued only — clients can't forge a valid signature without the secret.
// Replaces the old unsigned base64 JSON, which let anyone with a Champion's
// email forge an activation. Tokens expire 30 days after issue (then user
// re-visits /activate to get a fresh one).
function b64url(input) {
  return Buffer.from(input).toString('base64url')
}
function signActivationToken(payload) {
  if (!DESKTOP_TOKEN_SECRET) throw new Error('DESKTOP_TOKEN_SECRET not configured')
  const payloadStr = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', DESKTOP_TOKEN_SECRET).update(payloadStr).digest('base64url')
  return `${payloadStr}.${sig}`
}
function verifyActivationToken(tokenStr) {
  if (!DESKTOP_TOKEN_SECRET) return { ok: false, reason: 'Server not configured' }
  if (typeof tokenStr !== 'string' || !tokenStr.includes('.')) return { ok: false, reason: 'Malformed token' }
  const [payloadStr, sig] = tokenStr.split('.')
  if (!payloadStr || !sig) return { ok: false, reason: 'Malformed token' }
  const expected = crypto.createHmac('sha256', DESKTOP_TOKEN_SECRET).update(payloadStr).digest('base64url')
  let sigBuf, expBuf
  try {
    sigBuf = Buffer.from(sig)
    expBuf = Buffer.from(expected)
  } catch {
    return { ok: false, reason: 'Malformed signature' }
  }
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: 'Invalid signature' }
  }
  let payload
  try {
    payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'))
  } catch {
    return { ok: false, reason: 'Malformed payload' }
  }
  if (payload.expires_at && Date.now() > payload.expires_at) {
    return { ok: false, reason: 'Token expired' }
  }
  return { ok: true, payload }
}

function buildHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  // If the request origin isn't in the allowlist, omit ACAO entirely. The
  // browser will block the response, which is the correct behavior — better
  // than echoing back a whitelisted origin that doesn't match the requester
  // (would leak our trusted-origins set without enforcing it).
  const headers = {
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Content-Type': 'application/json',
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// Desktop app has no web origin — allow any origin on its dedicated public route.
function buildDesktopHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  }
}

export async function handler(event) {
  const method = event.requestContext?.http?.method
  const path = event.requestContext?.http?.path || event.rawPath || ''

  // Public endpoint for desktop-app license verification — no Cognito session.
  // Sits ahead of the auth gate so the desktop app can call without a JWT.
  if (path.endsWith('/desktop/verify')) {
    const desktopHeaders = buildDesktopHeaders()
    if (method === 'OPTIONS') return { statusCode: 200, headers: desktopHeaders, body: '' }
    if (method === 'POST') return await postDesktopVerify(event.body, desktopHeaders)
    return { statusCode: 405, headers: desktopHeaders, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Public lookup for referral landing pages — /referral/<code>. No auth so
  // unauthenticated visitors hitting /r/<code> can see who invited them
  // before they sign up.
  const referralMatch = path.match(/\/referral\/([\w-]+)\/?$/)
  if (referralMatch) {
    const publicHeaders = buildHeaders(event)
    if (method === 'OPTIONS') return { statusCode: 200, headers: publicHeaders, body: '' }
    if (method === 'GET') return await getReferralByCode(referralMatch[1], publicHeaders)
    return { statusCode: 405, headers: publicHeaders, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const headers = buildHeaders(event)
  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = await verifier.verify(token) }
  catch (err) {
    console.error('Token verify failed:', err)
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const email = payload.email?.toLowerCase()
  if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No email in token' }) }

  try {
    if (path.endsWith('/subscription') && method === 'GET') return await getSubscription(email, headers, payload)
    if (path.endsWith('/me') && method === 'GET') return await getMe(email, headers, payload)
    if (path.endsWith('/me') && method === 'PUT') return await putMe(email, event.body, headers)
    if (path.endsWith('/me/billing-portal') && method === 'POST') return await postBillingPortal(email, headers)
    if (path.endsWith('/me/activation-token') && method === 'POST') return await postActivationToken(email, headers, payload)
    if (path.endsWith('/me/start-trial') && method === 'POST') return await postStartTrial(email, headers)
    if (path.endsWith('/me/referrals') && method === 'GET') return await getMyReferrals(email, headers, payload)
    if (path.endsWith('/me/referral-attribution') && method === 'POST') return await postReferralAttribution(email, event.body, headers)
    return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown route: ${method} ${path}` }) }
  } catch (err) {
    console.error('Route error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Internal error' }) }
  }
}

async function getActiveSub(email) {
  const r = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  const items = r.Items || []
  return items.find((s) => isActiveSub(s)) || items[0] || null
}

// Returns true if a subscription row should grant access right now.
//
// Stripe-managed rows: trust the `status` field — Stripe webhooks update it
// when subscriptions cancel, and the row's `current_period_end` matches the
// last paid invoice (Stripe handles dunning/grace periods on its side).
//
// Comp rows (`comp: true`): there's no Stripe webhook to flip status when a
// trial ends, so we have to enforce the expiry server-side. A comp with
// `current_period_end` in the past is treated as expired even if `status` is
// still 'active' in the row. Admins can extend by re-comping.
function isActiveSub(s) {
  if (!s) return false
  // 'trialing' = a Stripe card-up-front trial (card on file, auto-converts). It
  // IS paid access, so grant the plan during the trial — the webhook flips the
  // row to 'active' (payment ok) or 'past_due'/'canceled' (failed) when the
  // trial ends. Comp / no-card trials use status 'active' + comp:true and are
  // still bounded by current_period_end below.
  if (s.status !== 'active' && s.status !== 'trialing') return false
  if (s.comp === true && s.current_period_end) {
    const end = Date.parse(s.current_period_end)
    if (Number.isFinite(end) && end < Date.now()) return false
  }
  return true
}

async function getSubscription(email, headers, payload) {
  // Admins get Champion-level access without a DynamoDB subscription record
  const groups = payload?.['cognito:groups'] || []
  if (Array.isArray(groups) && groups.includes('admins')) {
    return { statusCode: 200, headers, body: JSON.stringify({ plan: 'champion', status: 'active', comp: true }) }
  }

  const sub = await getActiveSub(email)
  if (isActiveSub(sub)) {
    return { statusCode: 200, headers, body: JSON.stringify({ plan: sub.plan, status: sub.status, current_period_end: sub.current_period_end, comp: sub.comp === true }) }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ plan: 'free', status: 'none' }) }
}

async function getMe(email, headers, payload) {
  let [sub, profile] = await Promise.all([
    getActiveSub(email),
    ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } })).then((r) => r.Item || null),
  ])

  // Bump last_seen_at on every /me call — this is the natural "user opened
  // the app" signal (useUserRole calls GET /me once per app load for signed-in
  // users). Powers the admin dashboard's "last active" column. Best-effort:
  // never block or fail the response if this write has trouble. Fire-and-forget
  // (don't await) so it can't add latency to the real /me response.
  ddb.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { email },
    UpdateExpression: 'SET last_seen_at = :now',
    ExpressionAttributeValues: { ':now': new Date().toISOString() },
  })).catch((err) => console.error('last_seen_at update failed:', err.message))

  // Generate a referral code on first /me access if the user doesn't have
  // one. Idempotent — only writes if the field is missing. Stored on the
  // profile row so future reads are a single GetCommand.
  if (!profile?.referral_code) {
    const code = await generateReferralCode(email)
    try {
      await ddb.send(new UpdateCommand({
        TableName: PROFILES_TABLE,
        Key: { email },
        UpdateExpression: 'SET referral_code = if_not_exists(referral_code, :code), created_at = if_not_exists(created_at, :now), updated_at = :now',
        ExpressionAttributeValues: { ':code': code, ':now': new Date().toISOString() },
      }))
      profile = { ...(profile || { email }), referral_code: code }
    } catch (err) {
      console.error('Failed to set referral_code:', err)
      // Non-fatal — continue without code, retry on next access
    }
  }

  const groups = payload?.['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')

  const subActive = isActiveSub(sub)
  const plan = isAdmin ? 'champion' : subActive ? sub.plan : 'free'
  // Tier scope determines whether the subscription unlocks one game (single)
  // or all 11 games (all_access). Admins always get all_access. Free users
  // get all_access too (they're just browsing — gating doesn't matter).
  // Paid Pro / Champion subscribers get the scope from their Stripe row.
  const tierScope = isAdmin
    ? 'all_access'
    : subActive ? (sub.tier_scope || 'single') : 'all_access'
  // Surface 'expired' to the UI for comp rows whose period_end has passed —
  // lets the Account page show a friendly "your trial ended" CTA instead of
  // pretending the user just unsubscribed.
  const subStatus = isAdmin
    ? 'active'
    : sub?.comp === true && sub?.status === 'active' && !subActive
      ? 'expired'
      : sub?.status || 'none'

  const stripped = profile ? stripProfile(profile) : null
  const vodUsage = computeVodUsage(sub, plan, tierScope)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      email,
      plan,
      sub_status: subStatus,
      is_admin: isAdmin,
      comp: isAdmin && !sub,
      // tier_scope determines whether this user can switch games. 'single'
      // means Pro/Champion locked to one game (active_game_id on profile).
      // 'all_access' means they can switch freely.
      tier_scope: tierScope,
      current_period_end: sub?.current_period_end || null,
      stripe_customer_id: sub?.stripe_customer_id || null,
      profile: stripped,
      // profile_complete is true iff the user has filled in the minimum
      // identity fields needed for personalization. Frontend uses this to
      // show/hide the onboarding modal on first login.
      profile_complete: isProfileComplete(stripped),
      // VOD session-cap state. Frontend displays "X of Y sessions left"
      // on Account page + upload zone so users know where they stand
      // before hitting the 429.
      vod_usage: vodUsage,
    }),
  }
}

// Tier limits — must match the VOD Lambda's values. Single source of truth
// is the VOD Lambda env vars; this Lambda mirrors them via its own env vars
// to avoid a cross-Lambda dependency.
const VOD_TRIAL_LIMIT = parseInt(process.env.VOD_TRIAL_LIMIT || '3', 10)
const VOD_PRO_LIMIT = parseInt(process.env.VOD_PRO_LIMIT || '20', 10)
const VOD_PRO_ALL_LIMIT = parseInt(process.env.VOD_PRO_ALL_LIMIT || '30', 10)
const VOD_CHAMPION_LIMIT = parseInt(process.env.VOD_CHAMPION_LIMIT || '60', 10)
const VOD_CHAMPION_ALL_LIMIT = parseInt(process.env.VOD_CHAMPION_ALL_LIMIT || '75', 10)
const VOD_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

function computeVodUsage(sub, plan, tierScope) {
  if (plan === 'free') return null
  if (!sub) {
    // Admin without a sub row — unlimited.
    return { used: 0, limit: null, remaining: null, is_trial: false, period_end: null, unlimited: true }
  }
  const isTrial = !!sub.trial
  if (isTrial) {
    const used = sub.vod_lifetime_used || 0
    const limit = VOD_TRIAL_LIMIT
    return {
      used, limit, remaining: Math.max(0, limit - used),
      is_trial: true,
      period_end: null,
      unlimited: false,
    }
  }
  // Paid: compute current-period state with rollover detection.
  const periodStart = sub.vod_period_start_at ? new Date(sub.vod_period_start_at).getTime() : 0
  const periodEnd = periodStart + VOD_PERIOD_MS
  const expired = !periodStart || Date.now() > periodEnd
  const used = expired ? 0 : (sub.vod_sessions_used || 0)
  let limit = 0
  if (plan === 'champion') limit = tierScope === 'all_access' ? VOD_CHAMPION_ALL_LIMIT : VOD_CHAMPION_LIMIT
  else if (plan === 'pro') limit = tierScope === 'all_access' ? VOD_PRO_ALL_LIMIT : VOD_PRO_LIMIT
  return {
    used, limit, remaining: Math.max(0, limit - used),
    is_trial: false,
    period_end: expired ? null : new Date(periodEnd).toISOString(),
    unlimited: false,
  }
}

function stripProfile(p) {
  const out = {}
  for (const f of ALLOWED_PROFILE_FIELDS) if (p[f] != null) out[f] = p[f]
  // Referral fields are surfaced read-only — users can't edit them via PUT /me
  // (system-managed), but the frontend needs them for the dashboard widget.
  for (const f of REFERRAL_FIELDS) if (p[f] != null) out[f] = p[f]
  // Surface game_profiles as a parsed object alongside the raw JSON string.
  if (out.game_profiles_json) {
    try { out.game_profiles = JSON.parse(out.game_profiles_json) } catch { out.game_profiles = {} }
  }
  return out
}

// Generate a referral code from email + 6 hex chars of random.
// Format: <firstname>-<hex6>. Collision-resistant enough for our scale
// (millions of codes before birthday paradox) without needing a uniqueness
// scan against the table on every signup.
async function generateReferralCode(email) {
  const firstPart = String(email || '').split('@')[0].split('.')[0].split('+')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12) || 'player'
  const rnd = crypto.randomBytes(3).toString('hex') // 6 hex chars
  return `${firstPart}-${rnd}`
}

// Public endpoint — given a referral code, find the referrer and return
// a minimal profile (first name + tier) for the landing page. Returns 404
// if no match. Scans the profiles table since we don't have a GSI on
// referral_code yet (cheap at current scale).
async function getReferralByCode(code, headers) {
  if (!code || typeof code !== 'string' || code.length > 100) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid code' }) }
  }
  try {
    const r = await ddb.send(new ScanCommand({
      TableName: PROFILES_TABLE,
      FilterExpression: 'referral_code = :code',
      ExpressionAttributeValues: { ':code': code },
      Limit: 1,
    }))
    const referrer = (r.Items || [])[0]
    if (!referrer) {
      return { statusCode: 404, headers, body: JSON.stringify({ valid: false, error: 'Referral code not found' }) }
    }
    // Look up referrer's tier to display "Pro user invited you" / "Champion
    // invited you" — small social proof on the landing page.
    const sub = await getActiveSub(referrer.email)
    const tier = isActiveSub(sub) ? sub.plan : 'free'
    const firstName = (referrer.display_name || referrer.email.split('@')[0]).split(/[.\s+]/)[0]
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        referrer_name: firstName,
        tier,
      }),
    }
  } catch (err) {
    console.error('getReferralByCode error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lookup failed' }) }
  }
}

// Attach a referrer to the current user. One-shot — if the user already has
// a referred_by set, don't overwrite. Prevents users from changing referrers
// after the fact to game the system.
async function postReferralAttribution(email, bodyJson, headers) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const code = String(body.code || '').trim()
  if (!code || code.length > 100) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid code' }) }
  }

  try {
    // Look up the referrer's email by code.
    const r = await ddb.send(new ScanCommand({
      TableName: PROFILES_TABLE,
      FilterExpression: 'referral_code = :code',
      ExpressionAttributeValues: { ':code': code },
      Limit: 1,
    }))
    const referrer = (r.Items || [])[0]
    if (!referrer) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Referral code not found' }) }
    }
    if (referrer.email === email) {
      // Self-referral attempt — silently ignore (don't reward).
      return { statusCode: 200, headers, body: JSON.stringify({ attributed: false, reason: 'self_referral' }) }
    }

    // Set referred_by on the new user's profile. Use attribute_not_exists to
    // prevent overwriting an existing attribution (first-touch wins).
    await ddb.send(new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { email },
      UpdateExpression: 'SET referred_by = if_not_exists(referred_by, :ref), updated_at = :now, created_at = if_not_exists(created_at, :now)',
      ExpressionAttributeValues: { ':ref': referrer.email, ':now': new Date().toISOString() },
    }))

    return { statusCode: 200, headers, body: JSON.stringify({ attributed: true }) }
  } catch (err) {
    console.error('postReferralAttribution error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Attribution failed' }) }
  }
}

// Dashboard widget data — returns the user's referral status + the list of
// people who used their code. Email addresses are hashed to a short token in
// the response so the UI shows "j****@gmail.com" instead of full PII to the
// referrer (privacy-friendly).
async function getMyReferrals(email, headers, payload) {
  try {
    // Make sure the user has a code — generate one if they haven't called /me
    // yet for some reason.
    const profileResult = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
    let profile = profileResult.Item || { email }
    if (!profile.referral_code) {
      const code = await generateReferralCode(email)
      await ddb.send(new UpdateCommand({
        TableName: PROFILES_TABLE,
        Key: { email },
        UpdateExpression: 'SET referral_code = if_not_exists(referral_code, :code), updated_at = :now, created_at = if_not_exists(created_at, :now)',
        ExpressionAttributeValues: { ':code': code, ':now': new Date().toISOString() },
      }))
      profile = { ...profile, referral_code: code }
    }

    // Look up referrals where this user is the referrer.
    const refResult = await ddb.send(new QueryCommand({
      TableName: REFERRALS_TABLE,
      KeyConditionExpression: 'referrer_email = :email',
      ExpressionAttributeValues: { ':email': email },
    }))
    const referrals = refResult.Items || []

    // Figure out the user's own tier — same-tier referrals are what counts
    // toward the "3 for a free month" credit.
    const groups = payload?.['cognito:groups'] || []
    const isAdmin = Array.isArray(groups) && groups.includes('admins')
    const ownSub = await getActiveSub(email)
    const ownTier = isAdmin ? 'champion' : (isActiveSub(ownSub) ? ownSub.plan : 'free')
    const ownTierScope = isAdmin
      ? 'all_access'
      : (isActiveSub(ownSub) ? (ownSub.tier_scope || 'single') : 'all_access')

    // Hybrid eligibility — founding referrers (paid sub before the
    // 90-day cutoff) keep the program forever at their original tier.
    // Post-launch, only Champion+ All-Access can earn the comp.
    // foundingReferrer is set on first paid-sub activation by the
    // webhook; absence means they joined after the cutoff or never paid.
    const isFoundingReferrer = !!profile.founding_referrer
    const referralWindowOpen = isFoundingWindowOpen()
    const eligibleToEarn = referrerIsEligible({
      plan: ownTier,
      tierScope: ownTierScope,
      foundingReferrer: isFoundingReferrer,
      isAdmin,
    })

    const now = Date.now()
    const summarized = referrals.map((r) => {
      const qualifiesAt = r.qualifies_at ? Date.parse(r.qualifies_at) : null
      // A referral qualifies if it's NOT churned AND the 30-day cooldown
      // has passed. We don't require status === 'active' explicitly so the
      // count is correct even before the daily cron promotes pending →
      // active. Churned referrals never qualify regardless of age.
      const isChurned = r.status === 'churned' || r.status === 'refunded'
      const qualified = !isChurned && qualifiesAt && qualifiesAt <= now
      const daysUntilActive = qualifiesAt && qualifiesAt > now
        ? Math.ceil((qualifiesAt - now) / 86400000)
        : 0
      return {
        // Mask email for privacy — show first letter + domain only.
        email_masked: maskEmail(r.referred_email),
        tier: r.tier,
        status: r.status,
        qualified,
        days_until_active: daysUntilActive,
        created_at: r.created_at,
      }
    })

    const sameTierActive = summarized.filter((r) => r.tier === ownTier && r.qualified).length
    const sameTierPending = summarized.filter((r) => r.tier === ownTier && !r.qualified && r.status !== 'churned' && r.status !== 'refunded').length
    // qualifies_for_comp combines the 3+ referral count AND eligibility.
    // Even with 3 active referrals, a non-founding non-Champion+ user
    // won't get the comp under the hybrid rules.
    const qualifiesForComp = sameTierActive >= 3 && eligibleToEarn

    const shareUrl = `https://r6coaching.com/r/${profile.referral_code}`

    // Days remaining in the founding window — drives the urgency
    // messaging on the dashboard widget. Negative means the window
    // closed; frontend hides the founding banner in that case.
    const foundingDaysLeft = Math.max(0, Math.ceil((REFERRAL_FOUNDING_CUTOFF_MS - now) / 86400000))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: profile.referral_code,
        share_url: shareUrl,
        own_tier: ownTier,
        own_tier_scope: ownTierScope,
        same_tier_active: sameTierActive,
        same_tier_pending: sameTierPending,
        total_referrals: summarized.length,
        qualifies_for_comp: qualifiesForComp,
        // Hybrid program state for the dashboard widget:
        //   eligible_to_earn — can this user earn the comp at all?
        //   is_founding_referrer — locked-in benefit at original tier
        //   founding_window_open — first 90 days of the program
        //   founding_days_left — countdown for urgency framing
        eligible_to_earn: eligibleToEarn,
        is_founding_referrer: isFoundingReferrer,
        founding_window_open: referralWindowOpen,
        founding_days_left: foundingDaysLeft,
        // Comp application is handled by the daily cron — we just report
        // status here. Frontend should show "applied this cycle" when the
        // user's most recent invoice has the referral coupon attached.
        comp_active_this_cycle: false,
        referrals: summarized,
      }),
    }
  } catch (err) {
    console.error('getMyReferrals error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load referrals' }) }
  }
}

function maskEmail(email) {
  if (!email) return ''
  const [local, domain] = String(email).split('@')
  if (!domain) return email
  return `${local[0] || '*'}****@${domain}`
}

function isProfileComplete(p) {
  if (!p) return false
  // Minimum required fields for "complete" status. Display name + platform
  // is enough to personalize emails and content. Everything else is bonus.
  return !!(p.display_name && p.platform)
}

async function putMe(email, bodyJson, headers) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const updates = {}
  for (const f of ALLOWED_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      const v = body[f]
      if (v != null && typeof v !== 'string') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `${f} must be a string` }) }
      }
      // game_profiles_json holds JSON-encoded nested per-game data — allow
      // larger size. Other fields stay capped at 100 chars to prevent abuse.
      const maxLen = f === 'game_profiles_json' ? 5000 : 100
      if (typeof v === 'string' && v.length > maxLen) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `${f} max ${maxLen} chars` }) }
      }
      // Validate game_profiles_json is parseable JSON (object).
      if (f === 'game_profiles_json' && typeof v === 'string' && v.length > 0) {
        try {
          const parsed = JSON.parse(v)
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'game_profiles_json must be a JSON object' }) }
          }
        } catch {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'game_profiles_json must be valid JSON' }) }
        }
      }
      updates[f] = v === '' ? null : v
    }
  }

  if (Object.keys(updates).length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid fields in body' }) }
  }

  const now = new Date().toISOString()
  const setParts = ['updated_at = :now']
  const removeParts = []
  const attrNames = {}
  const attrValues = { ':now': now }

  let i = 0
  for (const [k, v] of Object.entries(updates)) {
    const nameAlias = `#f${i}`
    attrNames[nameAlias] = k
    if (v === null) {
      removeParts.push(nameAlias)
    } else {
      const valAlias = `:v${i}`
      setParts.push(`${nameAlias} = ${valAlias}`)
      attrValues[valAlias] = v
    }
    i += 1
  }

  // Build SET/REMOVE expressions. created_at is set on first insert via
  // if_not_exists so existing rows aren't overwritten on profile edits.
  const setExpr = setParts.join(', ') + ', created_at = if_not_exists(created_at, :now)'
  let expr = 'SET ' + setExpr
  if (removeParts.length) expr += ' REMOVE ' + removeParts.join(', ')

  await ddb.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { email },
    UpdateExpression: expr,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  }))

  const fresh = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
  return { statusCode: 200, headers, body: JSON.stringify({ profile: stripProfile(fresh.Item || {}) }) }
}

// Desktop-app license check. Accepts either:
//   - an HMAC-signed activation token (issued by /me/activation-token after
//     Cognito auth confirmed the user is Champion), OR
//   - a bare email (used by the desktop app on periodic re-verification, ONLY
//     after the original signed token already proved identity at activation
//     time and the email is stored locally).
//
// Token-based path is the strong-auth path: signed by the server, faked tokens
// fail signature verification. Email-only path trusts that the desktop app
// already activated successfully. If you want to harden further, store the
// stripe_customer_id from the verify response on the desktop app and also
// re-verify against that.
async function postDesktopVerify(bodyJson, headers) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  let email = typeof body.email === 'string' ? body.email.toLowerCase() : null

  if (typeof body.token === 'string' && body.token.length > 0) {
    const result = verifyActivationToken(body.token.trim())
    if (!result.ok) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: `Invalid activation token: ${result.reason}` }) }
    }
    if (typeof result.payload?.email === 'string') {
      email = result.payload.email.toLowerCase()
    }
  }

  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email or token' }) }
  }

  const sub = await getActiveSub(email)
  if (isActiveSub(sub)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        plan: sub.plan,
        status: sub.status,
        email,
        current_period_end: sub.current_period_end ?? null,
        comp: sub.comp === true,
      }),
    }
  }
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ plan: 'free', status: 'none', email, current_period_end: null }),
  }
}

// Issues a signed activation token to a Cognito-authenticated Champion (or
// admin). The frontend ActivatePage calls this and pastes the result into
// the desktop app. Token includes email, plan, expiry; signature proves it
// came from us.
async function postActivationToken(email, headers, payload) {
  if (!DESKTOP_TOKEN_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Activation tokens not configured (DESKTOP_TOKEN_SECRET missing)' }) }
  }
  const groups = payload?.['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')

  let plan = 'free'
  if (isAdmin) {
    plan = 'champion'
  } else {
    const sub = await getActiveSub(email)
    // Trialing Champions (card-up-front trial) can activate the desktop app too.
    if (isActiveSub(sub) && sub.plan === 'champion') plan = 'champion'
  }

  if (plan !== 'champion') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Champion subscription required to activate the desktop app.' }) }
  }

  const issuedAt = Date.now()
  const expiresAt = issuedAt + ACTIVATION_TTL_MS
  const tokenStr = signActivationToken({
    email,
    plan: 'champion',
    issued_at: issuedAt,
    expires_at: expiresAt,
  })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      token: tokenStr,
      expires_at: expiresAt,
      email,
    }),
  }
}

async function postBillingPortal(email, headers) {
  if (!STRIPE_SECRET) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) }
  const sub = await getActiveSub(email)
  if (!sub?.stripe_customer_id) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'No Stripe customer. Subscribe first.' }) }
  }

  const form = new URLSearchParams({
    customer: sub.stripe_customer_id,
    return_url: PORTAL_RETURN_URL,
  })
  const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })
  const data = await r.json()
  if (!r.ok) {
    console.error('Stripe portal error:', data)
    return { statusCode: 502, headers, body: JSON.stringify({ error: data.error?.message || 'Stripe error' }) }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) }
}

// Self-service 7-day Pro trial. Called once per user on first profile setup.
// Grants them 'pro' plan with comp:true and current_period_end 7 days out.
//
// Why this matters for MRR: free→Pro conversion in SaaS averages 2-5%. Trial→
// paid conversion averages 15-25%. Auto-granting a trial 5x the conversion
// rate of asking users to pay upfront. Critical for the launch push.
//
// Idempotency: blocks repeat calls. If the user already has ANY subscription
// row (active, expired, canceled, or trial), we refuse so customers can't
// game the system by deleting + re-trialing.
async function postStartTrial(email, headers) {
  if (!email) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not signed in' }) }

  // Check for any existing sub row
  const r = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  if (r.Items && r.Items.length > 0) {
    return {
      statusCode: 409,
      headers,
      body: JSON.stringify({ error: 'trial_already_used', message: 'You\'ve already started a trial or subscription on this account.' }),
    }
  }

  const now = new Date().toISOString()
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const customerId = `trial_${email.replace(/[^a-z0-9]/g, '_')}`

  await ddb.send(new PutCommand({
    TableName: SUBS_TABLE,
    Item: {
      stripe_customer_id: customerId,
      email,
      plan: 'pro',
      status: 'active',
      comp: true,
      comp_note: 'Auto-granted 7-day Pro trial on signup',
      tier_scope: 'single', // R6 only during trial
      created_at: now,
      updated_at: now,
      current_period_end: sevenDaysOut,
      trial: true,
      // VOD usage tracking: trials use vod_lifetime_used (capped lifetime,
      // never resets). Initial value 0; VOD Lambda increments atomically.
      vod_lifetime_used: 0,
    },
  }))

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      plan: 'pro',
      trial: true,
      current_period_end: sevenDaysOut,
      days_remaining: 7,
    }),
  }
}
