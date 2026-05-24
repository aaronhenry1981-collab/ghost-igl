import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, ListUsersCommand, AdminDeleteUserCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { randomUUID } from 'node:crypto'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const cognito = new CognitoIdentityProviderClient({})
const TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'ghost-igl-audit-log'
const POOL_ID = process.env.COGNITO_USER_POOL_ID
const PRO_CENTS = parseInt(process.env.PRO_PLAN_AMOUNT_CENTS || '1200', 10)
const CHAMPION_CENTS = parseInt(process.env.CHAMPION_PLAN_AMOUNT_CENTS || '2900', 10)
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
const STRIPE_CHAMPION_PRICE_ID = process.env.STRIPE_CHAMPION_PRICE_ID
const STRIPE_PRO_FOUNDING_PRICE_ID = process.env.STRIPE_PRO_FOUNDING_PRICE_ID
const STRIPE_CHAMPION_REGULAR_PRICE_ID = process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID

const verifier = CognitoJwtVerifier.create({
  userPoolId: POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

const ALLOWED_ORIGINS = ['https://r6coaching.com', 'https://www.r6coaching.com', 'http://localhost:5173']

function buildHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://r6coaching.com',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  }
}

export async function handler(event) {
  const headers = buildHeaders(event)
  const method = event.requestContext?.http?.method
  const path = event.requestContext?.http?.path || event.rawPath || ''

  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = await verifier.verify(token) }
  catch (err) {
    console.error('JWT verify failed:', err)
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const groups = payload['cognito:groups'] || []
  if (!Array.isArray(groups) || !groups.includes('admins')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) }
  }

  try {
    if (path.endsWith('/admin/subscriptions') && method === 'GET') return await getSubscriptions(headers)
    if (path.endsWith('/admin/users') && method === 'GET') return await getUsers(headers)
    if (path.endsWith('/admin/backfill') && method === 'POST') return await backfill(headers)
    if (path.endsWith('/admin/comp') && method === 'POST') return await compUser(event.body, headers, payload?.email)
    if (path.endsWith('/admin/comps') && method === 'GET') return await listComps(headers)
    if (path.endsWith('/admin/uncomp') && method === 'POST') return await uncompUser(event.body, headers, payload?.email)
    if (path.endsWith('/admin/users/delete') && method === 'POST') return await deleteUser(event.body, headers, payload?.email)
    if (path.endsWith('/admin/audit') && method === 'GET') return await listAuditLog(headers)
    return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown route: ${method} ${path}` }) }
  } catch (err) {
    console.error('Route handler error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Internal error' }) }
  }
}

// Grant a comp Champion subscription to an arbitrary email. Use cases:
// influencer trials, refund cases, support tickets where the customer can't
// pay, beta testers. Comp rows have `comp: true` so the Monday metrics
// briefing can exclude them from real MRR. Idempotent — re-comping the same
// email just refreshes updated_at.
//
// Body: { email: string, plan?: 'pro'|'champion', note?: string, durationDays?: number }
//   - plan defaults to 'champion'
//   - note shows up in the row for audit ("comped by Aaron 2026-04-29 — refund case #12")
//   - durationDays defaults to 365; pass 0 for the placeholder 2099 expiry
// Append a structured audit log entry. Best-effort — never blocks the
// caller's response if the write fails. CloudWatch already captures any
// errors via the catch.
async function audit(actor, action, target, details) {
  try {
    await ddb.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        actor: actor || 'unknown',
        action,
        target: target || null,
        details: details || null,
      },
    }))
  } catch (err) {
    console.error('Audit write failed:', err.message)
  }
}

async function compUser(bodyJson, headers, actorEmail) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const plan = body.plan === 'pro' ? 'pro' : 'champion'
  const note = typeof body.note === 'string' ? body.note.slice(0, 200) : ''
  const durationDays = Number.isFinite(body.durationDays) ? Math.max(0, Math.floor(body.durationDays)) : 365

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email required' }) }
  }

  const now = new Date().toISOString()
  const periodEnd = durationDays === 0
    ? '2099-12-31T23:59:59Z'
    : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

  // Use a deterministic placeholder customer ID so re-comp doesn't create dupes.
  const customerId = `comp_${email.replace(/[^a-z0-9]/g, '_')}`

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      stripe_customer_id: customerId,
      email,
      plan,
      status: 'active',
      comp: true,
      comp_note: note,
      created_at: now,
      updated_at: now,
      current_period_end: periodEnd,
    },
  }))

  await audit(actorEmail, 'comp.grant', email, { plan, durationDays, note, periodEnd })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      email,
      plan,
      stripe_customer_id: customerId,
      current_period_end: periodEnd,
      comp: true,
    }),
  }
}

async function scanAllSubs() {
  const items = []
  let lastKey
  do {
    const r = await ddb.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: lastKey }))
    items.push(...(r.Items || []))
    lastKey = r.LastEvaluatedKey
  } while (lastKey)
  return items
}

async function getSubscriptions(headers) {
  const items = await scanAllSubs()
  return { statusCode: 200, headers, body: JSON.stringify({ subscriptions: items, summary: computeSummary(items) }) }
}

async function getUsers(headers) {
  // Fetch all Cognito users (paginated) and all DDB subs, then join on email
  const cogUsers = []
  let nextToken
  do {
    const r = await cognito.send(new ListUsersCommand({
      UserPoolId: POOL_ID,
      Limit: 60,
      PaginationToken: nextToken,
    }))
    cogUsers.push(...(r.Users || []))
    nextToken = r.PaginationToken
  } while (nextToken)

  const subs = await scanAllSubs()
  // Index subs by lowercased email. Prefer active sub if multiple.
  const subByEmail = new Map()
  for (const s of subs) {
    const key = (s.email || '').toLowerCase()
    if (!key) continue
    const prev = subByEmail.get(key)
    if (!prev || (s.status === 'active' && prev.status !== 'active')) subByEmail.set(key, s)
  }

  // Track which sub emails have been claimed by a Cognito user so we can
  // surface the unclaimed ones (orphan Stripe customers — paid but never
  // finished Cognito signup). These were invisible before this change
  // because the admin list was built from Cognito only.
  const claimedSubEmails = new Set()

  const users = cogUsers.map((u) => {
    const emailAttr = (u.Attributes || []).find((a) => a.Name === 'email')
    const email = (emailAttr?.Value || '').toLowerCase()
    const sub = subByEmail.get(email)
    if (sub) claimedSubEmails.add(email)
    return {
      username: u.Username,
      email,
      cognito_status: u.UserStatus,
      enabled: u.Enabled,
      created_at: u.UserCreateDate,
      plan: sub?.plan || 'free',
      sub_status: sub?.status || 'none',
      stripe_customer_id: sub?.stripe_customer_id || null,
      stripe_subscription_id: sub?.stripe_subscription_id || null,
      current_period_end: sub?.current_period_end || null,
      orphan: false, // has a Cognito account
    }
  })

  // Append Stripe-orphan customers — they paid but never created a Cognito
  // account. Common when checkout completes before signup. Aaron needs to
  // see these to send them a signup link / chase the missing account.
  for (const [email, sub] of subByEmail.entries()) {
    if (claimedSubEmails.has(email)) continue
    users.push({
      username: null,             // no Cognito user
      email,
      cognito_status: 'NO_ACCOUNT',
      enabled: false,
      created_at: sub.created_at || null,
      plan: sub.plan || 'unknown',
      sub_status: sub.status || 'unknown',
      stripe_customer_id: sub.stripe_customer_id || null,
      stripe_subscription_id: sub.stripe_subscription_id || null,
      current_period_end: sub.current_period_end || null,
      orphan: true,               // Stripe-only, no Cognito match
    })
  }

  return { statusCode: 200, headers, body: JSON.stringify({ users, summary: computeSummary(subs), total_users: users.length }) }
}

async function backfill(headers) {
  if (!STRIPE_SECRET) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) }
  // Map every known Pro/Champion price ID (founding + regular + All-Access
  // monthly + All-Access annual) to a plan label. Must stay in sync with the
  // webhook's getPlanFromPrice() — when those diverge, backfill silently
  // drops subs the webhook would have accepted (e.g. All-Access SKUs were
  // dropped by backfill but accepted by webhook until this fix).
  const PRICES = {}
  // Pro tier
  if (process.env.STRIPE_PRO_PRICE_ID) PRICES[process.env.STRIPE_PRO_PRICE_ID] = 'pro'
  if (process.env.STRIPE_PRO_FOUNDING_PRICE_ID) PRICES[process.env.STRIPE_PRO_FOUNDING_PRICE_ID] = 'pro'
  if (process.env.STRIPE_PRO_ALL_ACCESS_PRICE_ID) PRICES[process.env.STRIPE_PRO_ALL_ACCESS_PRICE_ID] = 'pro'
  if (process.env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID) PRICES[process.env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID] = 'pro'
  // Champion tier
  if (process.env.STRIPE_CHAMPION_PRICE_ID) PRICES[process.env.STRIPE_CHAMPION_PRICE_ID] = 'champion'
  if (process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID) PRICES[process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID] = 'champion'
  if (process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID) PRICES[process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID] = 'champion'
  if (process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID) PRICES[process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID] = 'champion'
  if (process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID) PRICES[process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID] = 'champion'

  let upserted = 0
  let scanned = 0
  let startingAfter = null

  while (true) {
    const qs = new URLSearchParams({ limit: '100', status: 'all' })
    if (startingAfter) qs.set('starting_after', startingAfter)
    const r = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
    })
    if (!r.ok) throw new Error(`Stripe error: ${r.status}`)
    const data = await r.json()
    scanned += data.data.length

    for (const sub of data.data) {
      const item = sub.items.data[0]
      const priceId = item?.price?.id
      const plan = PRICES[priceId]
      if (!plan) continue

      // Fetch customer for email
      const cr = await fetch(`https://api.stripe.com/v1/customers/${sub.customer}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
      })
      const cust = cr.ok ? await cr.json() : {}
      const email = (cust.email || '').toLowerCase()

      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          stripe_customer_id: sub.customer,
          email,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          created_at: sub.created ? new Date(sub.created * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
      }))
      upserted += 1
    }

    if (!data.has_more) break
    startingAfter = data.data[data.data.length - 1].id
  }

  return { statusCode: 200, headers, body: JSON.stringify({ scanned, upserted }) }
}

function computeSummary(items) {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  let active = 0, canceled = 0, pastDue = 0, pro = 0, champion = 0, mrrCents = 0, newLast30 = 0

  for (const it of items) {
    if (it.status === 'active') active += 1
    else if (it.status === 'canceled') canceled += 1
    else if (it.status === 'past_due') pastDue += 1

    if (it.status === 'active') {
      if (it.plan === 'pro') { pro += 1; mrrCents += PRO_CENTS }
      else if (it.plan === 'champion') { champion += 1; mrrCents += CHAMPION_CENTS }
    }

    if (it.created_at) {
      const created = Date.parse(it.created_at)
      if (created >= thirtyDaysAgo) newLast30 += 1
    }
  }

  return {
    total: items.length,
    active, canceled, past_due: pastDue,
    pro_active: pro, champion_active: champion,
    mrr_cents: mrrCents,
    mrr_dollars: (mrrCents / 100).toFixed(2),
    arr_dollars: ((mrrCents * 12) / 100).toFixed(2),
    new_last_30_days: newLast30,
  }
}

// List all comp subscriptions with computed expiry status. Powers the admin
// UI's "Active comps" panel — Aaron can see at a glance who has comps,
// when each expires, and revoke/extend as needed.
//
// Status semantics:
//   - active: comp row, status='active', period_end > now
//   - expiring: same as active but period_end < 14 days away
//   - expired: status='active' but period_end < now (Lambda treats as canceled)
//   - revoked: status='canceled' (uncomp called)
async function listComps(headers) {
  const r = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: '#c = :true',
    ExpressionAttributeNames: { '#c': 'comp' },
    ExpressionAttributeValues: { ':true': true },
  }))
  const now = Date.now()
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
  const comps = (r.Items || []).map((item) => {
    const periodEndMs = item.current_period_end ? Date.parse(item.current_period_end) : null
    const daysRemaining = periodEndMs ? Math.ceil((periodEndMs - now) / (24 * 60 * 60 * 1000)) : null
    let status = item.status
    if (item.status === 'active' && periodEndMs && periodEndMs < now) status = 'expired'
    else if (item.status === 'active' && periodEndMs && periodEndMs - now < FOURTEEN_DAYS_MS) status = 'expiring'
    return {
      email: item.email,
      plan: item.plan,
      status,
      raw_status: item.status,
      current_period_end: item.current_period_end,
      days_remaining: daysRemaining,
      comp_note: item.comp_note || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
      stripe_customer_id: item.stripe_customer_id,
    }
  }).sort((a, b) => {
    // Sort: active expiring soonest first, then expired, then revoked
    const order = { expiring: 0, active: 1, expired: 2, canceled: 3 }
    const oa = order[a.status] ?? 99
    const ob = order[b.status] ?? 99
    if (oa !== ob) return oa - ob
    return (a.days_remaining ?? Infinity) - (b.days_remaining ?? Infinity)
  })
  return { statusCode: 200, headers, body: JSON.stringify({ comps }) }
}

// Revoke an active comp early — typically when converting a comp user to a
// real paying customer (they signed up via the Stripe link, the webhook
// creates a real row, this cleanup makes sure they're not double-counted as
// both a comp and a paid customer).
//
// Body: { email: string }
//   Marks the comp_<email> row as status='canceled'. Does NOT delete — keeps
//   the audit trail (when comp was given, who issued it, when revoked).
async function uncompUser(bodyJson, headers, actorEmail) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email required' }) }
  }

  const customerId = `comp_${email.replace(/[^a-z0-9]/g, '_')}`
  const now = new Date().toISOString()

  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: customerId },
      UpdateExpression: 'SET #s = :canceled, updated_at = :now, revoked_at = :now',
      ConditionExpression: 'attribute_exists(stripe_customer_id) AND #c = :true',
      ExpressionAttributeNames: { '#s': 'status', '#c': 'comp' },
      ExpressionAttributeValues: { ':canceled': 'canceled', ':now': now, ':true': true },
    }))
    await audit(actorEmail, 'comp.revoke', email, null)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email, status: 'canceled' }) }
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No active comp found for that email' }) }
    }
    throw err
  }
}

// Permanently delete a user account. Cascades across all the places we store
// per-user data: Cognito (auth identity), profiles table (display fields),
// subscriptions table (any rows for this email).
//
// Body: { email: string, hard?: boolean }
//   - hard=false (default): mark sub rows as canceled with deleted_at=now,
//     keeping the audit trail. Cognito + profile still deleted (irreversible —
//     only the per-customer billing history stays).
//   - hard=true: also delete the sub rows (no audit trail). Use sparingly —
//     once gone, you can't reconstruct who was on what plan when.
//
// Safety guards:
//   - Refuses to delete admins (someone in the `admins` Cognito group)
//   - Refuses to delete users with active PAID Stripe subscriptions —
//     leaving Stripe billing them with no account on our side is the worst
//     case. Have the customer cancel via the Stripe portal first.
//   - Won't delete the calling admin (you can't delete yourself)
//
// Idempotent: if the user is already gone from Cognito, returns 200 — finishes
// cleaning up DDB rows in case a previous call partially succeeded.
async function deleteUser(bodyJson, headers, callerEmail) {
  let body
  try { body = JSON.parse(bodyJson || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const hard = body.hard === true
  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email required' }) }
  }
  if (callerEmail && email === callerEmail.toLowerCase()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "You can't delete your own account from the admin UI." }) }
  }

  // Step 1: find Cognito user (need username, which is the UUID — email is an attribute)
  const usersResp = await cognito.send(new ListUsersCommand({
    UserPoolId: POOL_ID,
    Filter: `email = "${email}"`,
    Limit: 1,
  }))
  const cogUser = usersResp.Users?.[0]
  // OK if user is missing — this is a cleanup pass.
  
  // Step 2: admin guard
  if (cogUser) {
    const groupsResp = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: POOL_ID,
      Username: cogUser.Username,
    }))
    const inAdminGroup = (groupsResp.Groups || []).some(g => g.GroupName === 'admins')
    if (inAdminGroup) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Refusing to delete an admin account. Remove from admins group first.' }) }
    }
  }

  // Step 3: find subscription rows + active-paid guard
  const subsResp = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  const subs = subsResp.Items || []
  const activePaid = subs.find(s => s.status === 'active' && s.comp !== true && s.stripe_customer_id && !s.stripe_customer_id.startsWith('comp_') && !s.stripe_customer_id.startsWith('admin_'))
  if (activePaid) {
    return {
      statusCode: 409,
      headers,
      body: JSON.stringify({
        error: 'User has an active paid Stripe subscription. Cancel it in the Stripe portal first (otherwise Stripe keeps billing them with no account on our side).',
        stripe_customer_id: activePaid.stripe_customer_id,
        plan: activePaid.plan,
      }),
    }
  }

  const now = new Date().toISOString()
  const summary = { email, cognito_deleted: false, profile_deleted: false, sub_rows: 0, mode: hard ? 'hard' : 'soft' }

  // Step 4: delete from Cognito
  if (cogUser) {
    await cognito.send(new AdminDeleteUserCommand({
      UserPoolId: POOL_ID,
      Username: cogUser.Username,
    }))
    summary.cognito_deleted = true
  }

  // Step 5: delete profile row (idempotent — DeleteCommand with Key is fine if it doesn't exist)
  try {
    const existingProfile = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
    if (existingProfile.Item) {
      await ddb.send(new DeleteCommand({ TableName: PROFILES_TABLE, Key: { email } }))
      summary.profile_deleted = true
    }
  } catch (err) {
    console.error('Profile delete error:', err)
  }

  // Step 6: subscription rows — soft-cancel (default) or hard-delete
  for (const sub of subs) {
    if (hard) {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { stripe_customer_id: sub.stripe_customer_id },
      }))
    } else {
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { stripe_customer_id: sub.stripe_customer_id },
        UpdateExpression: 'SET #s = :canceled, deleted_at = :now, updated_at = :now',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':canceled': 'canceled', ':now': now },
      }))
    }
    summary.sub_rows++
  }

  await audit(callerEmail, 'user.delete', email, summary)

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...summary }) }
}

async function listAuditLog(headers) {
  // Scan + sort newest-first. For an admin UI showing the last ~100 events
  // this is fine; if the table grows large, switch to a GSI on timestamp.
  const r = await ddb.send(new ScanCommand({ TableName: AUDIT_TABLE, Limit: 200 }))
  const items = (r.Items || []).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
  return { statusCode: 200, headers, body: JSON.stringify({ events: items.slice(0, 100) }) }
}
