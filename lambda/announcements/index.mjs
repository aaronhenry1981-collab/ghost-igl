import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { randomUUID } from 'node:crypto'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.ANNOUNCEMENTS_TABLE || 'ghost-igl-announcements'
const TESTIMONIALS_TABLE = process.env.TESTIMONIALS_TABLE || 'ghost-igl-testimonials'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

const ALLOWED_ORIGINS = ['https://r6coaching.com', 'https://www.r6coaching.com', 'http://localhost:5173']
const ALLOWED_LEVELS = ['info', 'update', 'maintenance', 'warning']

function buildHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://r6coaching.com',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  }
}

export async function handler(event) {
  const headers = buildHeaders(event)
  const method = event.requestContext?.http?.method
  const path = event.requestContext?.http?.path || event.rawPath || ''

  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const isAnnouncementsAdmin = path.includes('/admin/announcements')
  const isAnnouncementsPublic = !isAnnouncementsAdmin && /\/announcements$/.test(path)
  const isTestimonialsAdmin = path.includes('/admin/testimonials')
  const isTestimonialsPublic = !isTestimonialsAdmin && /\/testimonials$/.test(path)
  const isDemoVideoAdmin = path.includes('/admin/demo-video')
  const isDemoVideoPublic = !isDemoVideoAdmin && /\/demo-video$/.test(path)

  try {
    // Public reads — no auth required
    if (isAnnouncementsPublic && method === 'GET') return await listPublic(headers)
    if (isTestimonialsPublic && method === 'GET') return await listPublicTestimonials(headers)
    if (isDemoVideoPublic && method === 'GET') return await getDemoVideo(headers)

    if (!isAnnouncementsAdmin && !isTestimonialsAdmin && !isDemoVideoAdmin) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown route: ${method} ${path}` }) }
    }

    // Admin-only below: auth required
    const adminCheck = await verifyAdmin(event)
    if (!adminCheck.ok) return { statusCode: adminCheck.status, headers, body: JSON.stringify({ error: adminCheck.error }) }

    if (isAnnouncementsAdmin) {
      const hasId = /\/admin\/announcements\/[^/]+$/.test(path)
      if (!hasId && method === 'GET') return await listAll(headers)
      if (!hasId && method === 'POST') return await create(event.body, adminCheck.email, headers)
      if (hasId && method === 'DELETE') return await remove(path.split('/').pop(), headers)
    }

    if (isTestimonialsAdmin) {
      const hasId = /\/admin\/testimonials\/[^/]+$/.test(path)
      if (!hasId && method === 'GET') return await listAllTestimonials(headers)
      if (!hasId && method === 'POST') return await createTestimonial(event.body, adminCheck.email, headers)
      if (hasId && method === 'DELETE') return await removeTestimonial(path.split('/').pop(), headers)
    }

    if (isDemoVideoAdmin) {
      if (method === 'POST') return await setDemoVideo(event.body, adminCheck.email, headers)
      if (method === 'DELETE') return await clearDemoVideo(headers)
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown route: ${method} ${path}` }) }
  } catch (err) {
    console.error('Lambda error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Internal error' }) }
  }
}

async function verifyAdmin(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return { ok: false, status: 401, error: 'No token' }

  let payload
  try { payload = await verifier.verify(token) }
  catch { return { ok: false, status: 401, error: 'Invalid token' } }

  const groups = payload['cognito:groups'] || []
  if (!Array.isArray(groups) || !groups.includes('admins')) {
    return { ok: false, status: 403, error: 'Admin access required' }
  }
  return { ok: true, email: payload.email }
}

function nowIso() { return new Date().toISOString() }

function isActive(a) {
  if (a.dismissed_at) return false
  if (a.expires_at) {
    try { if (new Date(a.expires_at) < new Date()) return false }
    catch { /* ignore */ }
  }
  return true
}

async function scanAll() {
  const items = []
  let lastKey
  do {
    const r = await ddb.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: lastKey }))
    items.push(...(r.Items || []))
    lastKey = r.LastEvaluatedKey
  } while (lastKey)
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  return items
}

async function listPublic(headers) {
  const items = (await scanAll()).filter(isActive)
  return { statusCode: 200, headers, body: JSON.stringify({ announcements: items }) }
}

async function listAll(headers) {
  const items = await scanAll()
  return { statusCode: 200, headers, body: JSON.stringify({ announcements: items }) }
}

async function create(bodyStr, authorEmail, headers) {
  let body
  try { body = JSON.parse(bodyStr || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const title = (body.title || '').toString().trim()
  const message = (body.message || '').toString().trim()
  const level = ALLOWED_LEVELS.includes(body.level) ? body.level : 'info'
  const expiresAt = body.expires_at || null

  if (!title || title.length > 120) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'title required (max 120 chars)' }) }
  }
  if (!message || message.length > 2000) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'message required (max 2000 chars)' }) }
  }

  const item = {
    id: randomUUID(),
    title,
    message,
    level,
    created_at: nowIso(),
    created_by: authorEmail || 'unknown',
    expires_at: expiresAt,
  }

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }))
  return { statusCode: 201, headers, body: JSON.stringify({ announcement: item }) }
}

async function remove(id, headers) {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id } }))
  return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) }
}

// ============================================================================
// TESTIMONIALS — visible on landing page for social proof.
//
// Schema (per row):
//   id           string (UUID, partition key)
//   name         string (display name; can be initials only for privacy)
//   text         string (the testimonial content, max 500 chars)
//   rank         string? (e.g. "Bronze → Gold" — optional rank progression)
//   hours        string? (e.g. "120hrs" — optional play time)
//   tier         string? ('pro' | 'champion' — optional verified-customer badge)
//   featured     bool? (true = pin to top of landing-page list)
//   created_at   ISO timestamp
//   created_by   string (admin email who posted it — audit trail)
//
// Public read returns ALL active testimonials (no expiry — they're evergreen
// social proof). Admin can delete via DELETE /admin/testimonials/{id}.
//
// Why same Lambda as announcements: identical pattern (public read + admin
// write + admin list), same auth, same DDB client. Saves the operational
// overhead of a 3rd Lambda for what's essentially a CRUD interface.
// ============================================================================

async function scanAllTestimonials() {
  const items = []
  let lastKey
  do {
    const r = await ddb.send(new ScanCommand({ TableName: TESTIMONIALS_TABLE, ExclusiveStartKey: lastKey }))
    items.push(...(r.Items || []))
    lastKey = r.LastEvaluatedKey
  } while (lastKey)
  // Filter out the demo-video singleton (shares this table for storage).
  const filtered = items.filter(i => i.id !== '__demo_video__')
  // Sort: featured first, then newest first.
  filtered.sort((a, b) => {
    if (!!b.featured !== !!a.featured) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    return (b.created_at || '').localeCompare(a.created_at || '')
  })
  return filtered
}

async function listPublicTestimonials(headers) {
  const items = await scanAllTestimonials()
  // Strip admin-only fields before returning to the public.
  const safe = items.map(t => ({
    id: t.id,
    name: t.name,
    text: t.text,
    rank: t.rank || null,
    hours: t.hours || null,
    tier: t.tier || null,
    featured: !!t.featured,
    created_at: t.created_at,
  }))
  return { statusCode: 200, headers, body: JSON.stringify({ testimonials: safe }) }
}

async function listAllTestimonials(headers) {
  const items = await scanAllTestimonials()
  return { statusCode: 200, headers, body: JSON.stringify({ testimonials: items }) }
}

async function createTestimonial(bodyStr, authorEmail, headers) {
  let body
  try { body = JSON.parse(bodyStr || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const name = (body.name || '').toString().trim()
  const text = (body.text || '').toString().trim()
  const rank = (body.rank || '').toString().trim()
  const hours = (body.hours || '').toString().trim()
  const tier = ['pro', 'champion'].includes(body.tier) ? body.tier : null
  const featured = body.featured === true

  if (!name || name.length > 60) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name required (max 60 chars)' }) }
  }
  if (!text || text.length > 500) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required (max 500 chars)' }) }
  }
  if (rank.length > 40) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'rank max 40 chars' }) }
  }
  if (hours.length > 20) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'hours max 20 chars' }) }
  }

  const item = {
    id: randomUUID(),
    name,
    text,
    rank: rank || null,
    hours: hours || null,
    tier,
    featured,
    created_at: nowIso(),
    created_by: authorEmail || 'unknown',
  }

  await ddb.send(new PutCommand({ TableName: TESTIMONIALS_TABLE, Item: item }))
  return { statusCode: 201, headers, body: JSON.stringify({ testimonial: item }) }
}

async function removeTestimonial(id, headers) {
  if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) }
  await ddb.send(new DeleteCommand({ TableName: TESTIMONIALS_TABLE, Key: { id } }))
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id }) }
}

// ============================================================================
// DEMO VIDEO — singleton config row in the testimonials table.
//
// Stored as id='__demo_video__' so it lives alongside testimonials but the
// testimonials list endpoint filters it out. Public GET /demo-video returns
// the active video (or null). Admin POST/DELETE manages it.
//
// Schema:
//   id           string ('__demo_video__' constant)
//   url          string (raw YouTube/Twitch URL — the frontend parser handles embed)
//   title        string? (optional caption for the video)
//   updated_at   ISO timestamp
//   updated_by   string (admin email)
// ============================================================================

const DEMO_VIDEO_ID = '__demo_video__'

async function getDemoVideo(headers) {
  const r = await ddb.send(new ScanCommand({
    TableName: TESTIMONIALS_TABLE,
    FilterExpression: '#id = :id',
    ExpressionAttributeNames: { '#id': 'id' },
    ExpressionAttributeValues: { ':id': DEMO_VIDEO_ID },
    Limit: 1,
  }))
  const item = (r.Items || [])[0]
  if (!item) return { statusCode: 200, headers, body: JSON.stringify({ video: null }) }
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      video: { url: item.url, title: item.title || null, updated_at: item.updated_at },
    }),
  }
}

async function setDemoVideo(bodyStr, authorEmail, headers) {
  let body
  try { body = JSON.parse(bodyStr || '{}') }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const url = (body.url || '').toString().trim()
  const title = (body.title || '').toString().trim()
  if (!url || url.length > 500) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'url required (max 500 chars)' }) }
  }
  if (title.length > 200) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'title max 200 chars' }) }
  }
  // Basic URL sanity check — frontend does the heavy parsing.
  if (!/^https?:\/\//i.test(url)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'url must start with http:// or https://' }) }
  }

  const item = {
    id: DEMO_VIDEO_ID,
    url,
    title: title || null,
    updated_at: nowIso(),
    updated_by: authorEmail || 'unknown',
  }
  await ddb.send(new PutCommand({ TableName: TESTIMONIALS_TABLE, Item: item }))
  return { statusCode: 200, headers, body: JSON.stringify({ video: { url, title: item.title, updated_at: item.updated_at } }) }
}

async function clearDemoVideo(headers) {
  await ddb.send(new DeleteCommand({ TableName: TESTIMONIALS_TABLE, Key: { id: DEMO_VIDEO_ID } }))
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
}
