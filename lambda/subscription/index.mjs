import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { validateWorkbookPurchase, workbookIntegrationIdentifier } from './workbook-purchase.mjs'
import { membershipIdempotencyKey, membershipIntegrationIdentifier, resolveMembershipOffer } from './membership-checkout.mjs'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
const DESKTOP_DOWNLOAD_BUCKET = process.env.DESKTOP_DOWNLOAD_BUCKET || 'r6coaching-private-downloads'
const DESKTOP_DOWNLOAD_KEY = process.env.DESKTOP_DOWNLOAD_KEY || 'windows/Recon-6-Command-2.0.4-x64.exe'
const DESKTOP_DOWNLOAD_FILENAME = 'Recon-6-Command-2.0.4-x64.exe'
const WORKBOOK_PRICE_ID = process.env.STRIPE_WORKBOOK_PRICE_ID || 'price_1U7okSJNddvjgWcgyomwEAa2'
const WORKBOOK_DOWNLOAD_BUCKET = process.env.WORKBOOK_DOWNLOAD_BUCKET || DESKTOP_DOWNLOAD_BUCKET
const WORKBOOK_DOWNLOAD_KEY = process.env.WORKBOOK_DOWNLOAD_KEY || 'workbooks/recon6-siege-starter-field-workbook-bundle.zip'
const WORKBOOK_DOWNLOAD_FILENAME = 'Recon6-Siege-Starter-Workbook-Bundle.zip'
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
// Elite+ All-Access to qualify; founding referrers who locked in before that
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
//   2. Currently an Elite+ All-Access subscriber → eligible regardless
//      of when they joined
//   3. Else: not eligible (post-launch restriction)
function referrerIsEligible({ plan, tierScope, foundingReferrer, isAdmin }) {
  if (isAdmin) return true
  if (foundingReferrer) return true
  return (plan === 'elite' || plan === 'champion') && tierScope === 'all_access'
}

// Has the founding window passed? Used by getMyReferrals to label new
// signups correctly (founding/post-launch) and to decide which copy to
// show on the dashboard widget.
function isFoundingWindowOpen(now = Date.now()) {
  return now < REFERRAL_FOUNDING_CUTOFF_MS
}
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || '2026-07-29.dahlia'
const SITE_URL = String(process.env.SITE_URL || 'https://r6coaching.com').replace(/\/$/, '')
const PORTAL_RETURN_URL = process.env.PORTAL_RETURN_URL || 'https://r6coaching.com/#/account'
const AI_USAGE_PACK_PRICE_ID = process.env.AI_USAGE_PACK_PRICE_ID || 'price_1TzrjoJNddvjgWcgzp9RSUOK'
const AI_USAGE_PACK_CREDITS = parseInt(process.env.AI_USAGE_PACK_CREDITS || '100', 10)
const DESKTOP_TOKEN_SECRET = process.env.DESKTOP_TOKEN_SECRET || ''
const ACTIVATION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
let protectedCatalog = null
const protectedCatalogByPlan = new Map()
const LEGACY_ELITE_PRICE_IDS = new Set([
  process.env.STRIPE_CHAMPION_PRICE_ID,
  process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
  process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
  process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
  process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
  'price_1TLEtsJNddvjgWcgYcmiNmW7',
  'price_1TPtOYJNddvjgWcgfEWjzGnp',
  'price_1TVUd0JNddvjgWcgIPWakA3S',
  'price_1TVUd6JNddvjgWcgc3csHICD',
].filter(Boolean))

function effectivePlan(sub) {
  if (!sub) return 'free'
  return LEGACY_ELITE_PRICE_IDS.has(sub.price_id) ? 'elite' : sub.plan || 'free'
}

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
  if (payload.iss !== 'https://r6coaching.com' || payload.aud !== 'recon6-desktop' || payload.product !== 'recon6' || payload.version !== 2) {
    return { ok: false, reason: 'Wrong token audience' }
  }
  if (!payload.user_id || !payload.email || !payload.issued_at || !payload.expires_at) {
    return { ok: false, reason: 'Incomplete token' }
  }
  if (payload.issued_at > Date.now() + 60000 || payload.expires_at - payload.issued_at > ACTIVATION_TTL_MS) {
    return { ok: false, reason: 'Invalid token lifetime' }
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
  if (payload.email_verified !== true) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Verified email required' }) }
  }

  try {
    const identityBound = await bindIdentity(email, payload.sub)
    if (!identityBound) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'This billing identity belongs to a different account' }) }
    }
    if (path.endsWith('/subscription') && method === 'GET') return await getSubscription(email, headers, payload)
    if (path.endsWith('/content/catalog') && method === 'GET') return await getProtectedCatalog(email, headers, payload)
    if (path.endsWith('/me') && method === 'GET') return await getMe(email, headers, payload)
    if (path.endsWith('/me') && method === 'PUT') return await putMe(email, event.body, headers)
    if (path.endsWith('/me/billing-portal') && method === 'POST') {
      let billingAction = null
      try { billingAction = JSON.parse(event.body || '{}')?.action || null } catch { /* normal portal open */ }
      return billingAction === 'usage_pack' ? await postUsageCheckout(email, headers) : await postBillingPortal(email, headers)
    }
    if (path.endsWith('/me/membership-checkout') && method === 'POST') {
      return await postMembershipCheckout(email, event.body, headers, payload)
    }
    if (path.endsWith('/me/workbook-checkout') && method === 'POST') {
      return await postWorkbookCheckout(email, headers, payload)
    }
    if (path.endsWith('/me/workbook-download') && method === 'POST') {
      return await postWorkbookDownload(email, event.body, headers)
    }
    if (path.endsWith('/me/activation-token') && method === 'POST') {
      let action = null
      try { action = JSON.parse(event.body || '{}')?.action || null } catch { /* activation body remains optional */ }
      return action === 'desktop_download'
        ? await postDesktopDownload(email, headers, payload)
        : await postActivationToken(email, headers, payload)
    }
    if (path.endsWith('/me/referrals') && method === 'GET') return await getMyReferrals(email, headers, payload)
    if (path.endsWith('/me/referral-attribution') && method === 'POST') return await postReferralAttribution(email, event.body, headers)
    return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown route: ${method} ${path}` }) }
  } catch (err) {
    console.error('Route error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Internal error' }) }
  }
}

// Rank order for picking between several live rows on one email. Higher wins.
const PLAN_RANK = { champion: 4, elite: 3, pro: 2, free: 1 }

// Pick the BEST live subscription row for an email, not the first one found.
//
// One email can legitimately hold several rows: every Stripe Checkout mints a
// new customer id (the table's partition key), so an upgrade does not replace
// the old row, it adds one. `email-index` is a HASH-only GSI — no sort key — so
// the order DynamoDB returns them in is arbitrary.
//
// The old code took `items.find(isActiveSub)`, i.e. whichever arbitrary row came
// back first. On 2026-07-29 that cost a real customer: he bought Pro at 07:00,
// upgraded to Champion at 07:29, and the query kept returning the Pro row. The
// site told him he was Pro. He re-bought Champion at 07:30, 07:31 and 07:34 —
// the webhook's duplicate guard correctly auto-cancelled the last two, so he was
// not billed four times, but he still never saw the Champion content he had paid
// for. At 07:38 he gave up, signed up under a second email, and it worked first
// try — because that email had exactly one row.
//
// So: rank by plan, then by the furthest paid-through date. A customer who is
// paying for Champion gets Champion regardless of what else is on the account.
function pickBestSub(items) {
  const live = (items || []).filter(isActiveSub)
  if (!live.length) return (items || [])[0] || null
  return live.slice().sort((a, b) => {
    const byPlan = (PLAN_RANK[effectivePlan(b)] || 0) - (PLAN_RANK[effectivePlan(a)] || 0)
    if (byPlan) return byPlan
    // Same tier: the row paid furthest into the future is the current one.
    return String(b.current_period_end || '').localeCompare(String(a.current_period_end || ''))
  })[0]
}

async function getActiveSub(email) {
  const r = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  return pickBestSub(r.Items || [])
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
  const end = Date.parse(s.current_period_end || '')
  if (!Number.isFinite(end) || end <= Date.now()) return false
  return true
}

async function getSubscriptionRows(email) {
  const r = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  return r.Items || []
}

async function bindIdentity(email, subject) {
  if (!email || !subject) return false
  const subscriptions = await ddb.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  for (const row of subscriptions.Items || []) {
    if (isActiveSub(row) && row.cognito_sub && row.cognito_sub !== subject) return false
    if (!row.cognito_sub) {
      try {
        await ddb.send(new UpdateCommand({
          TableName: SUBS_TABLE,
          Key: { stripe_customer_id: row.stripe_customer_id },
          ConditionExpression: 'attribute_not_exists(cognito_sub)',
          UpdateExpression: 'SET cognito_sub = :subject, identity_bound_at = :now',
          ExpressionAttributeValues: { ':subject': subject, ':now': new Date().toISOString() },
        }))
      } catch (err) {
        if (err.name !== 'ConditionalCheckFailedException') throw err
        const current = await ddb.send(new GetCommand({
          TableName: SUBS_TABLE,
          Key: { stripe_customer_id: row.stripe_customer_id },
        }))
        if (isActiveSub(current.Item) && current.Item?.cognito_sub !== subject) return false
      }
    }
  }

  const profile = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
  if (profile.Item?.cognito_sub && profile.Item.cognito_sub !== subject) return false
  if (!profile.Item?.cognito_sub) {
    try {
      await ddb.send(new UpdateCommand({
        TableName: PROFILES_TABLE,
        Key: { email },
        ConditionExpression: 'attribute_not_exists(cognito_sub)',
        UpdateExpression: 'SET cognito_sub = :subject, identity_bound_at = :now, created_at = if_not_exists(created_at, :now)',
        ExpressionAttributeValues: { ':subject': subject, ':now': new Date().toISOString() },
      }))
    } catch (err) {
      if (err.name !== 'ConditionalCheckFailedException') throw err
      const current = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
      if (current.Item?.cognito_sub !== subject) return false
    }
  }
  return true
}

function loadProtectedCatalog() {
  if (protectedCatalog) return protectedCatalog
  protectedCatalog = JSON.parse(readFileSync(new URL('./protected-content.json', import.meta.url), 'utf8'))
  return protectedCatalog
}

function catalogForPlan(plan) {
  if (protectedCatalogByPlan.has(plan)) return protectedCatalogByPlan.get(plan)
  const source = loadProtectedCatalog()
  const elite = plan === 'elite' || plan === 'champion'
  const strategies = {}
  for (const [mapId, sites] of Object.entries(source.strategies || {})) {
    strategies[mapId] = {}
    for (const [siteId, sides] of Object.entries(sites || {})) {
      strategies[mapId][siteId] = {}
      for (const [side, strat] of Object.entries(sides || {})) {
        const projection = { ...strat }
        if (!elite) delete projection.premiumTactics
        strategies[mapId][siteId][side] = projection
      }
    }
  }
  const result = {
    schema_version: source.schema_version,
    generated_at: source.generated_at,
    plan,
    strategies,
    bans: source.bans || {},
    enemy_meta: source.enemy_meta || {},
    squad_roles: source.squad_roles || {},
    verified_setups: elite ? source.verified_setups || {} : {},
    verified_callouts: elite ? source.verified_callouts || {} : {},
    setup_capabilities: elite ? source.setup_capabilities || {} : {},
    setup_floor_priority: elite ? source.setup_floor_priority || {} : {},
    setup_variations: elite ? source.setup_variations || {} : {},
    setup_pick_order: elite ? source.setup_pick_order || {} : {},
  }
  protectedCatalogByPlan.set(plan, result)
  return result
}

async function getProtectedCatalog(email, headers, payload) {
  if (payload?.email_verified !== true) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Verified email required.' }) }
  }
  const groups = payload?.['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')
  let plan = isAdmin ? 'champion' : 'free'
  if (!isAdmin) {
    const sub = await getActiveSub(email)
    if (isActiveSub(sub)) plan = effectivePlan(sub)
  }
  if (!['pro', 'elite', 'champion'].includes(plan)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'An active paid membership is required.' }) }
  }
  try {
    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'private, no-store' },
      body: JSON.stringify(catalogForPlan(plan)),
    }
  } catch (err) {
    console.error('Protected catalog load failed:', err)
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Protected content is temporarily unavailable.' }) }
  }
}

async function getSubscription(email, headers, payload) {
  // Admins get Champion-level access without a DynamoDB subscription record
  const groups = payload?.['cognito:groups'] || []
  if (Array.isArray(groups) && groups.includes('admins')) {
    return { statusCode: 200, headers, body: JSON.stringify({ plan: 'champion', status: 'active', comp: true }) }
  }

  const sub = await getActiveSub(email)
  if (isActiveSub(sub)) {
    return { statusCode: 200, headers, body: JSON.stringify({ plan: effectivePlan(sub), status: sub.status, current_period_end: sub.current_period_end, comp: sub.comp === true }) }
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
  const plan = isAdmin ? 'champion' : subActive ? effectivePlan(sub) : 'free'
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
      ai_usage: {
        purchased_credits: Math.max(0, Number(profile?.ai_usage_credits || 0)),
        pack_credits: AI_USAGE_PACK_CREDITS,
        pack_price_dollars: 10,
      },
    }),
  }
}

// Tier limits — must match the VOD Lambda's values. Single source of truth
// is the VOD Lambda env vars; this Lambda mirrors them via its own env vars
// to avoid a cross-Lambda dependency.
const VOD_TRIAL_LIMIT = parseInt(process.env.VOD_TRIAL_LIMIT || '3', 10)
const VOD_PRO_LIMIT = parseInt(process.env.VOD_PRO_LIMIT || '20', 10)
const VOD_PRO_ALL_LIMIT = parseInt(process.env.VOD_PRO_ALL_LIMIT || '30', 10)
const VOD_ELITE_LIMIT = parseInt(process.env.VOD_ELITE_LIMIT || '60', 10)
const VOD_ELITE_ALL_LIMIT = parseInt(process.env.VOD_ELITE_ALL_LIMIT || '75', 10)
const VOD_CHAMPION_LIMIT = parseInt(process.env.VOD_CHAMPION_LIMIT || '75', 10)
const VOD_CHAMPION_ALL_LIMIT = parseInt(process.env.VOD_CHAMPION_ALL_LIMIT || '90', 10)
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
  else if (plan === 'elite') limit = tierScope === 'all_access' ? VOD_ELITE_ALL_LIMIT : VOD_ELITE_LIMIT
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
    const tier = isActiveSub(sub) ? effectivePlan(sub) : 'free'
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
    const ownTier = isAdmin ? 'champion' : (isActiveSub(ownSub) ? effectivePlan(ownSub) : 'free')
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

// Desktop-app license check. A signed activation token is always required;
// bare email lookups are intentionally rejected to prevent account enumeration.
async function postDesktopVerify(bodyJson, headers) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  if (typeof body.token !== 'string' || !body.token.trim()) {
    return { statusCode: 401, headers, body: JSON.stringify({ valid: false }) }
  }
  const result = verifyActivationToken(body.token.trim())
  if (!result.ok) return { statusCode: 401, headers, body: JSON.stringify({ valid: false }) }
  const activationPayload = result.payload
  const email = activationPayload.email.toLowerCase()

  const sub = await getActiveSub(email)
  if (isActiveSub(sub)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        plan: effectivePlan(sub),
        expires_at: Math.min(activationPayload.expires_at, Date.parse(sub.current_period_end)),
      }),
    }
  }
  if (activationPayload?.admin === true) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: true, plan: 'champion', expires_at: activationPayload.expires_at }),
    }
  }
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({ valid: false }),
  }
}

// Issues a signed activation token to a Cognito-authenticated paid member (or
// admin). Champion remains a superset, so no existing customer loses access.
// The frontend ActivatePage calls this and pastes the result into
// the desktop app. Token includes email, plan, expiry; signature proves it
// came from us.
async function postActivationToken(email, headers, payload) {
  if (!DESKTOP_TOKEN_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Activation tokens not configured (DESKTOP_TOKEN_SECRET missing)' }) }
  }
  const groups = payload?.['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')

  let plan = 'free'
  let activeSub = null
  if (isAdmin) {
    plan = 'champion'
  } else {
    const sub = await getActiveSub(email)
    activeSub = sub
    // Trialing paid members can activate too. Desktop access begins at Pro.
    const subPlan = effectivePlan(sub)
    if (isActiveSub(sub) && ['pro', 'elite', 'champion'].includes(subPlan)) plan = subPlan
  }

  if (!['pro', 'elite', 'champion'].includes(plan)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'A paid Recon 6 membership is required to activate the desktop app.' }) }
  }

  const issuedAt = Date.now()
  const paidThrough = activeSub ? Date.parse(activeSub.current_period_end || '') : Number.POSITIVE_INFINITY
  const expiresAt = Math.min(issuedAt + ACTIVATION_TTL_MS, Number.isFinite(paidThrough) ? paidThrough : issuedAt + ACTIVATION_TTL_MS)
  const tokenStr = signActivationToken({
    iss: 'https://r6coaching.com',
    aud: 'recon6-desktop',
    product: 'recon6',
    version: 2,
    user_id: payload?.sub || email,
    email,
    plan,
    admin: isAdmin,
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

async function postDesktopDownload(email, headers, payload) {
  const groups = payload?.['cognito:groups'] || []
  const isAdmin = Array.isArray(groups) && groups.includes('admins')
  let plan = 'free'
  if (isAdmin) plan = 'champion'
  else {
    const sub = await getActiveSub(email)
    if (isActiveSub(sub)) plan = effectivePlan(sub)
  }
  if (!['pro', 'elite', 'champion'].includes(plan)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'A paid Recon 6 membership is required to download the desktop coach.' }) }
  }
  const command = new GetObjectCommand({
    Bucket: DESKTOP_DOWNLOAD_BUCKET,
    Key: DESKTOP_DOWNLOAD_KEY,
    ResponseContentDisposition: `attachment; filename="${DESKTOP_DOWNLOAD_FILENAME}"`,
    ResponseContentType: 'application/vnd.microsoft.portable-executable',
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ url, filename: DESKTOP_DOWNLOAD_FILENAME, version: '2.0.4', expires_in: 300, plan }),
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

async function stripeCustomerById(customerId) {
  if (!customerId) return null
  const response = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Stripe-Version': STRIPE_API_VERSION,
    },
  })
  if (response.status === 404) return null
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe customer lookup failed')
  return data?.deleted ? null : data
}

async function findCanonicalStripeCustomer(email, subject) {
  const [profileResult, rows] = await Promise.all([
    ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } })),
    getSubscriptionRows(email),
  ])
  const candidates = [
    profileResult.Item?.stripe_customer_id,
    ...rows
      .slice()
      .sort((a, b) => Number(isActiveSub(b)) - Number(isActiveSub(a)) || String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
      .map((row) => row.stripe_customer_id),
  ].filter(Boolean)

  for (const customerId of [...new Set(candidates)]) {
    const customer = await stripeCustomerById(customerId)
    if (customer && String(customer.email || '').trim().toLowerCase() === email) return customer
  }

  const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=100`, {
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Stripe-Version': STRIPE_API_VERSION,
    },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe customer search failed')
  const customers = (data.data || []).filter((customer) => !customer.deleted)
  return customers.sort((a, b) => {
    const aSubjectMatch = a.metadata?.cognito_sub === subject ? 1 : 0
    const bSubjectMatch = b.metadata?.cognito_sub === subject ? 1 : 0
    return bSubjectMatch - aSubjectMatch || Number(b.created || 0) - Number(a.created || 0)
  })[0] || null
}

function attachCustomer(form, customer, email) {
  if (/^cus_[A-Za-z0-9]+$/.test(customer?.id || '')) form.set('customer', customer.id)
  else form.set('customer_email', email)
}

async function rememberCanonicalCustomer(email, subject, customerId) {
  if (!customerId) return
  await ddb.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { email },
    UpdateExpression: 'SET stripe_customer_id = :customer, cognito_sub = if_not_exists(cognito_sub, :subject), updated_at = :now',
    ExpressionAttributeValues: {
      ':customer': customerId,
      ':subject': subject,
      ':now': new Date().toISOString(),
    },
  }))
}

async function postMembershipCheckout(email, bodyJson, headers, payload) {
  if (!STRIPE_SECRET || STRIPE_SECRET === 'None') {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Billing is temporarily unavailable.' }) }
  }
  let body = {}
  try { body = JSON.parse(bodyJson || '{}') } catch { /* invalid tier is handled below */ }
  const offer = resolveMembershipOffer(body.tier)
  if (!offer?.priceId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Choose Pro, Elite, or Champion.' }) }
  }

  const existing = await getActiveSub(email)
  if (isActiveSub(existing) && existing.stripe_subscription_id && /^cus_[A-Za-z0-9]+$/.test(existing.stripe_customer_id || '')) {
    // One live subscription per person. Stripe's portal performs plan changes
    // on the existing subscription so proration and the customer identity stay intact.
    return await postBillingPortal(email, headers)
  }

  const customer = await findCanonicalStripeCustomer(email, payload.sub)
  const form = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': offer.priceId,
    'line_items[0][quantity]': '1',
    client_reference_id: payload.sub,
    success_url: `${SITE_URL}/#/account?checkout=success`,
    cancel_url: `${SITE_URL}/#/?checkout=cancelled`,
    payment_method_collection: 'always',
    integration_identifier: membershipIntegrationIdentifier(),
    'metadata[kind]': 'recon6_membership',
    'metadata[email]': email,
    'metadata[cognito_sub]': payload.sub,
    'metadata[tier]': offer.tier,
    'subscription_data[metadata][kind]': 'recon6_membership',
    'subscription_data[metadata][email]': email,
    'subscription_data[metadata][cognito_sub]': payload.sub,
    'subscription_data[metadata][tier]': offer.tier,
  })
  if (offer.trialDays > 0) form.set('subscription_data[trial_period_days]', String(offer.trialDays))
  attachCustomer(form, customer, email)

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
      'Idempotency-Key': membershipIdempotencyKey(payload.sub, offer.tier),
    },
    body: form,
  })
  const data = await response.json()
  if (!response.ok || !data.url) {
    console.error('Membership checkout error:', data?.error?.type || response.status)
    return { statusCode: 502, headers, body: JSON.stringify({ error: data?.error?.message || 'Could not open membership checkout.' }) }
  }
  if (customer?.id) await rememberCanonicalCustomer(email, payload.sub, customer.id)
  return { statusCode: 200, headers, body: JSON.stringify({ url: data.url, destination: 'checkout' }) }
}

async function postUsageCheckout(email, headers) {
  if (!STRIPE_SECRET || !AI_USAGE_PACK_PRICE_ID) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Usage packs are not configured yet.' }) }
  }
  const sub = await getActiveSub(email)
  if (!isActiveSub(sub) || !['pro', 'elite', 'champion'].includes(effectivePlan(sub))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'A paid membership is required before buying extra AI usage.' }) }
  }

  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': AI_USAGE_PACK_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: 'https://r6coaching.com/#/account?usage=success',
    cancel_url: 'https://r6coaching.com/#/account?usage=cancelled',
    'metadata[kind]': 'ai_usage_pack',
    'metadata[email]': email,
    'metadata[credits]': String(AI_USAGE_PACK_CREDITS),
  })
  attachCustomer(form, { id: sub.stripe_customer_id }, email)
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: form,
  })
  const data = await r.json()
  if (!r.ok || !data.url) {
    console.error('Usage-pack checkout error:', data?.error?.type || r.status)
    return { statusCode: 502, headers, body: JSON.stringify({ error: data?.error?.message || 'Could not open usage checkout.' }) }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) }
}

async function postWorkbookCheckout(email, headers, payload) {
  if (!STRIPE_SECRET || !WORKBOOK_PRICE_ID) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Workbook checkout is not configured yet.' }) }
  }

  const customer = await findCanonicalStripeCustomer(email, payload?.sub)
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': WORKBOOK_PRICE_ID,
    'line_items[0][quantity]': '1',
    client_reference_id: payload?.sub || email,
    success_url: `${SITE_URL}/beginner-guide?workbook=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/beginner-guide?workbook=cancelled`,
    submit_type: 'pay',
    integration_identifier: workbookIntegrationIdentifier(),
    'metadata[kind]': 'beginner_workbook',
    'metadata[email]': email,
    'metadata[price_id]': WORKBOOK_PRICE_ID,
  })
  attachCustomer(form, customer, email)
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: form,
  })
  const data = await response.json()
  if (!response.ok || !data.url) {
    console.error('Workbook checkout error:', data?.error?.type || response.status)
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not open workbook checkout.' }) }
  }
  if (customer?.id && payload?.sub) await rememberCanonicalCustomer(email, payload.sub, customer.id)
  return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) }
}

async function postWorkbookDownload(email, bodyJson, headers) {
  if (!STRIPE_SECRET || !WORKBOOK_PRICE_ID || !WORKBOOK_DOWNLOAD_BUCKET || !WORKBOOK_DOWNLOAD_KEY) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Workbook delivery is not configured yet.' }) }
  }

  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request.' }) } }
  const sessionId = String(body.session_id || '').trim()
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid checkout session.' }) }
  }

  const stripeHeaders = {
    Authorization: `Bearer ${STRIPE_SECRET}`,
    'Stripe-Version': STRIPE_API_VERSION,
  }
  const [sessionResponse, lineItemsResponse] = await Promise.all([
    fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: stripeHeaders }),
    fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=10`, { headers: stripeHeaders }),
  ])
  const [session, lineItems] = await Promise.all([
    sessionResponse.json(),
    lineItemsResponse.json(),
  ])
  if (!sessionResponse.ok || !lineItemsResponse.ok) {
    console.error('Workbook purchase verification failed:', session?.error?.type || lineItems?.error?.type || 'stripe_error')
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not verify this purchase. Please retry.' }) }
  }

  const validation = validateWorkbookPurchase({
    session,
    lineItems: lineItems.data || [],
    accountEmail: email,
    expectedPriceId: WORKBOOK_PRICE_ID,
  })
  if (!validation.ok) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: validation.error }) }
  }

  const command = new GetObjectCommand({
    Bucket: WORKBOOK_DOWNLOAD_BUCKET,
    Key: WORKBOOK_DOWNLOAD_KEY,
    ResponseContentDisposition: `attachment; filename="${WORKBOOK_DOWNLOAD_FILENAME}"`,
    ResponseContentType: 'application/zip',
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      url,
      filename: WORKBOOK_DOWNLOAD_FILENAME,
      expires_in: 300,
      purchase: 'verified',
    }),
  }
}
