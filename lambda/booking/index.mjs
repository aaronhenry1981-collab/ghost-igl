// recon6-booking — the in-house scheduler (Calendly-equivalent).
//
// Closes the five gaps a contact form can't:
//   1. DOUBLE-BOOKING  — bookings PK IS the slotId; a conditional
//      attribute_not_exists(slotId) write makes two people winning the same
//      slot physically impossible.
//   2. TIMEZONES       — slots are stored/keyed in UTC; availability windows
//      are defined in the coach's timezone and expanded DST-safely; the
//      client formats in the visitor's own timezone via Intl.
//   3. NO-SHOWS        — EventBridge invokes {action:'reminders'} every 30min;
//      24h and 1h reminders to both sides, flagged so they send once.
//   4. RESCHEDULE/CANCEL — signed manage token in every confirmation email;
//      no login needed, slot is freed on cancel.
//   5. AVAILABILITY    — one editable config record; Aaron edits windows/
//      blackouts from the AdminPage, never from code.
//
// Routes (existing HTTP API u0k402df6j, all auth in-Lambda per house pattern):
//   GET  /booking/slots?days=14        public — open slots (UTC ids)
//   POST /booking/hold                 public — 5-minute hold {slotId}
//   POST /booking/confirm              public — {slotId, holdToken, customer...}
//   GET  /booking/manage?token=        public — booking info for the manage page
//   POST /booking/manage               public — {token, action: cancel|reschedule, newSlotId?}
//   GET  /admin/bookings               admin  — upcoming bookings
//   GET  /admin/availability           admin  — current config
//   PUT  /admin/availability           admin  — replace config
//   (EventBridge) {action:'reminders'} cron   — send due reminders

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand,
  DeleteCommand, ScanCommand, BatchGetCommand,
} from '@aws-sdk/lib-dynamodb'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import crypto from 'node:crypto'

const REGION = process.env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const ses = new SESv2Client({ region: REGION })

const AVAIL_TABLE = process.env.AVAILABILITY_TABLE || 'recon6-availability'
const BOOK_TABLE = process.env.BOOKINGS_TABLE || 'recon6-bookings'
const FROM = process.env.FROM_ADDRESS || 'Recon 6 Coaching <coach@r6coaching.com>'
const ALERT_EMAILS = (process.env.ALERT_EMAIL || 'aaron@ironfrontdigital.com,aaronhenry1981@gmail.com').split(',').map((s) => s.trim())
const SITE = 'https://r6coaching.com'
const HOLD_MINUTES = 5

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '5bpa1cteenctoue24v4e245re8',
})

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
}
const resp = (code, obj) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(obj) })

// ---- availability config -----------------------------------------------------
const DEFAULT_CONFIG = {
  config_id: 'default',
  timezone: 'America/New_York',
  session_minutes: 60,
  buffer_minutes: 15,
  booking_horizon_days: 21,
  min_notice_hours: 12,
  // dow: 0=Sun … 6=Sat, times in the coach's timezone
  windows: [
    { dow: 1, start: '18:00', end: '22:00' },
    { dow: 3, start: '18:00', end: '22:00' },
    { dow: 5, start: '18:00', end: '22:00' },
    { dow: 6, start: '13:00', end: '17:00' },
  ],
  blackouts: [],
}

async function getConfig() {
  const r = await ddb.send(new GetCommand({ TableName: AVAIL_TABLE, Key: { config_id: 'default' } }))
  return r.Item || DEFAULT_CONFIG
}

// ---- DST-safe local-time → UTC (two-pass wall-clock technique) ---------------
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  let guess = Date.UTC(y, m - 1, d, hh, mm)
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(guess))
    const get = (t) => Number(parts.find((p) => p.type === t).value)
    const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
    const want = Date.UTC(y, m - 1, d, hh, mm)
    guess += want - wall
  }
  return guess
}

function dayInfoInTz(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date(epochMs))
  const get = (t) => parts.find((p) => p.type === t)?.value
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    dow: dowMap[get('weekday')],
  }
}

// Expand availability into candidate UTC slot ids within the horizon.
function expandSlots(cfg, now = Date.now()) {
  const slots = []
  const step = (cfg.session_minutes + cfg.buffer_minutes) * 60000
  const minStart = now + cfg.min_notice_hours * 3600000
  const horizonEnd = now + cfg.booking_horizon_days * 86400000
  for (let t = now; t <= horizonEnd; t += 86400000) {
    const { date, dow } = dayInfoInTz(t, cfg.timezone)
    if ((cfg.blackouts || []).includes(date)) continue
    for (const w of cfg.windows || []) {
      if (w.dow !== dow) continue
      const winStart = zonedTimeToUtc(date, w.start, cfg.timezone)
      const winEnd = zonedTimeToUtc(date, w.end, cfg.timezone)
      for (let s = winStart; s + cfg.session_minutes * 60000 <= winEnd; s += step) {
        if (s >= minStart) slots.push(new Date(s).toISOString().replace(/\.\d{3}Z$/, 'Z'))
      }
    }
  }
  return [...new Set(slots)].sort()
}

// Remove slots that are booked or actively held.
async function filterOpen(slotIds) {
  const open = new Set(slotIds)
  const now = new Date().toISOString()
  for (let i = 0; i < slotIds.length; i += 100) {
    const batch = slotIds.slice(i, i + 100)
    const r = await ddb.send(new BatchGetCommand({
      RequestItems: { [BOOK_TABLE]: { Keys: batch.map((slotId) => ({ slotId })), ProjectionExpression: 'slotId, #s, heldUntil', ExpressionAttributeNames: { '#s': 'status' } } },
    }))
    for (const item of r.Responses?.[BOOK_TABLE] || []) {
      const activeHold = item.status === 'held' && item.heldUntil > now
      if (item.status === 'confirmed' || activeHold) open.delete(item.slotId)
    }
  }
  return [...open]
}

// ---- email helpers ------------------------------------------------------------
async function sendMail(to, subject, body) {
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: body, Charset: 'UTF-8' } } } },
    }))
    return true
  } catch (err) {
    console.warn(`mail failed → ${to}: ${err.name}`) // sandbox holds customer mail until prod access
    return false
  }
}

function icsFor(slotId, minutes, summary, description) {
  const dt = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace(/Z$/, 'Z')
  const end = new Date(Date.parse(slotId) + minutes * 60000).toISOString().replace(/\.\d{3}Z$/, 'Z')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RECON6//Coaching//EN', 'BEGIN:VEVENT',
    `UID:${slotId}@r6coaching.com`, `DTSTAMP:${dt(new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))}`,
    `DTSTART:${dt(slotId)}`, `DTEND:${dt(end)}`, `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
}

function googleCalLink(slotId, minutes, title) {
  const s = slotId.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const e = new Date(Date.parse(slotId) + minutes * 60000).toISOString().replace(/\.\d{3}Z$/, '').replace(/[-:]/g, '') + 'Z'
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${s}/${e}&details=${encodeURIComponent(SITE + '/coaching/')}`
}

function manageLinks(token) {
  return `Reschedule or cancel any time: ${SITE}/booking/manage/?token=${token}`
}

async function notifyBooked(item, cfg) {
  const title = `RECON6 Coaching — ${item.sessionType || 'Free Intro'}`
  const when = `${item.slotId} (UTC) — your calendar file/link shows it in your local time`
  const gcal = googleCalLink(item.slotId, cfg.session_minutes, title)
  const ics = icsFor(item.slotId, cfg.session_minutes, title, `With your RECON6 coach. ${manageLinks(item.manageToken)}`)
  const customerBody = `You're booked.

Session: ${title}
When: ${when}
Where: Discord (you'll get a DM before the session — make sure you've joined: https://discord.gg/namGQqs3jb)

Come with 2-3 clips or screenshots of rounds you lost — that's the raw material.

Add to Google Calendar: ${gcal}

Apple/Outlook (.ics):
----------------------------------------
${ics}
----------------------------------------

${manageLinks(item.manageToken)}

Aaron — Recon 6`
  const sentCustomer = await sendMail(item.customer.email, `Booked: ${title}`, customerBody)
  for (const a of ALERT_EMAILS) {
    await sendMail(a, `BOOKING: ${item.sessionType || 'Free Intro'} — ${item.slotId}`,
      `New booking.\n\nSlot: ${item.slotId}\nType: ${item.sessionType}\nName: ${item.customer.name}\nEmail: ${item.customer.email}\nDiscord: ${item.customer.discord || '-'}\nRank/goal: ${item.customer.rank_goal || '-'}\nTZ: ${item.customer.tz || '-'}\nNotes: ${item.customer.notes || '-'}\n\nAdd to Google: ${gcal}\n\nCustomer confirmation ${sentCustomer ? 'sent' : 'HELD BY SES SANDBOX — reach out manually'}.`)
  }
  return sentCustomer
}

// ---- auth ---------------------------------------------------------------------
async function requireAdmin(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const payload = await verifier.verify(token)
    const groups = payload['cognito:groups']
    if (Array.isArray(groups) && groups.includes('admins')) return payload
  } catch (err) { console.warn('JWT verify failed:', err.name) }
  return null
}

// ---- reminders (EventBridge, every 30 min) -------------------------------------
async function runReminders() {
  const cfg = await getConfig()
  const now = Date.now()
  const scan = await ddb.send(new ScanCommand({
    TableName: BOOK_TABLE,
    FilterExpression: '#s = :c',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':c': 'confirmed' },
  }))
  let sent = 0
  for (const b of scan.Items || []) {
    const start = Date.parse(b.slotId)
    if (Number.isNaN(start) || start < now) continue
    const hoursOut = (start - now) / 3600000
    const due = (!b.reminded24 && hoursOut <= 24 && hoursOut > 1.5) ? '24' : (!b.reminded1 && hoursOut <= 1.5) ? '1' : null
    if (!due) continue
    const label = due === '24' ? 'tomorrow' : 'in about an hour'
    await sendMail(b.customer.email, `Reminder: your RECON6 coaching session is ${label}`,
      `Your ${b.sessionType || 'Free Intro'} session is ${label}.\n\nSlot (UTC): ${b.slotId}\nBring 2-3 clips of rounds you lost.\nDiscord: https://discord.gg/namGQqs3jb\n\n${manageLinks(b.manageToken)}\n\nAaron — Recon 6`)
    for (const a of ALERT_EMAILS) {
      await sendMail(a, `Session ${label}: ${b.customer.name} (${b.sessionType || 'Free Intro'})`,
        `Slot (UTC): ${b.slotId}\nCustomer: ${b.customer.name} <${b.customer.email}> discord: ${b.customer.discord || '-'}`)
    }
    await ddb.send(new UpdateCommand({
      TableName: BOOK_TABLE, Key: { slotId: b.slotId },
      UpdateExpression: `SET ${due === '24' ? 'reminded24' : 'reminded1'} = :t`,
      ExpressionAttributeValues: { ':t': new Date().toISOString() },
    }))
    sent++
  }
  console.log(`reminders pass: ${sent} sent / ${scan.Items?.length || 0} confirmed`)
  return sent
}

// ---- handler --------------------------------------------------------------------
export async function handler(event) {
  // EventBridge reminder tick (no HTTP context)
  if (event?.action === 'reminders') { await runReminders(); return { ok: true } }

  const method = event.requestContext?.http?.method || 'GET'
  const path = event.rawPath || ''
  if (method === 'OPTIONS') return resp(200, {})
  let body = {}
  try { body = event.body ? JSON.parse(event.body) : {} } catch { return resp(400, { error: 'bad json' }) }

  try {
    // ---------- public: open slots ----------
    if (method === 'GET' && path.endsWith('/booking/slots')) {
      const cfg = await getConfig()
      const all = expandSlots(cfg)
      const open = await filterOpen(all)
      return resp(200, { slots: open.sort(), session_minutes: cfg.session_minutes })
    }

    // ---------- public: hold a slot ----------
    if (method === 'POST' && path.endsWith('/booking/hold')) {
      const slotId = String(body.slotId || '')
      const cfg = await getConfig()
      if (!expandSlots(cfg).includes(slotId)) return resp(400, { error: 'not an open slot' })
      const holdToken = crypto.randomBytes(16).toString('hex')
      const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60000).toISOString()
      const nowIso = new Date().toISOString()
      try {
        await ddb.send(new PutCommand({
          TableName: BOOK_TABLE,
          Item: { slotId, status: 'held', holdToken, heldUntil, createdAt: nowIso },
          ConditionExpression: 'attribute_not_exists(slotId)',
        }))
      } catch {
        // Slot row exists — reclaim only if it's an EXPIRED hold.
        try {
          await ddb.send(new UpdateCommand({
            TableName: BOOK_TABLE, Key: { slotId },
            UpdateExpression: 'SET holdToken = :t, heldUntil = :u, createdAt = :c',
            ConditionExpression: '#s = :held AND heldUntil < :now',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':t': holdToken, ':u': heldUntil, ':held': 'held', ':now': nowIso, ':c': nowIso },
          }))
        } catch {
          return resp(409, { error: 'That slot just went — pick another.' })
        }
      }
      return resp(200, { holdToken, heldUntil })
    }

    // ---------- public: confirm ----------
    if (method === 'POST' && path.endsWith('/booking/confirm')) {
      const { slotId, holdToken, name, email, discord, rank_goal, tz, sessionType, notes } = body
      if (!slotId || !holdToken || !email || !name) return resp(400, { error: 'missing fields' })
      const manageToken = crypto.randomBytes(20).toString('hex')
      const customer = {
        name: String(name).slice(0, 80), email: String(email).slice(0, 120),
        discord: String(discord || '').slice(0, 60), rank_goal: String(rank_goal || '').slice(0, 60),
        tz: String(tz || '').slice(0, 60), notes: String(notes || '').slice(0, 500),
      }
      try {
        await ddb.send(new UpdateCommand({
          TableName: BOOK_TABLE, Key: { slotId },
          UpdateExpression: 'SET #s = :c, customer = :cust, sessionType = :ty, manageToken = :m, confirmedAt = :t REMOVE holdToken, heldUntil',
          ConditionExpression: '#s = :held AND holdToken = :h',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':c': 'confirmed', ':held': 'held', ':h': String(holdToken),
            ':cust': customer, ':ty': String(sessionType || 'Free Intro').slice(0, 60),
            ':m': manageToken, ':t': new Date().toISOString(),
          },
        }))
      } catch {
        return resp(409, { error: 'Hold expired or slot taken — pick another slot.' })
      }
      const cfg = await getConfig()
      const item = { slotId, customer, sessionType: sessionType || 'Free Intro', manageToken }
      const emailed = await notifyBooked(item, cfg)
      return resp(200, { booked: true, slotId, manageToken, confirmationEmail: emailed ? 'sent' : 'pending' })
    }

    // ---------- public: manage (info) ----------
    if (method === 'GET' && path.endsWith('/booking/manage')) {
      const token = event.queryStringParameters?.token || ''
      if (!token) return resp(400, { error: 'no token' })
      const scan = await ddb.send(new ScanCommand({
        TableName: BOOK_TABLE,
        FilterExpression: 'manageToken = :t',
        ExpressionAttributeValues: { ':t': token },
      }))
      const b = (scan.Items || [])[0]
      if (!b) return resp(404, { error: 'booking not found' })
      return resp(200, { slotId: b.slotId, status: b.status, sessionType: b.sessionType, name: b.customer?.name })
    }

    // ---------- public: manage (cancel / reschedule) ----------
    if (method === 'POST' && path.endsWith('/booking/manage')) {
      const { token, action, newSlotId } = body
      if (!token) return resp(400, { error: 'no token' })
      const scan = await ddb.send(new ScanCommand({
        TableName: BOOK_TABLE, FilterExpression: 'manageToken = :t',
        ExpressionAttributeValues: { ':t': String(token) },
      }))
      const b = (scan.Items || [])[0]
      if (!b || b.status !== 'confirmed') return resp(404, { error: 'active booking not found' })

      if (action === 'cancel') {
        // Free the slot (PK = slotId) but keep history under a tombstone key.
        await ddb.send(new PutCommand({
          TableName: BOOK_TABLE,
          Item: { ...b, slotId: `${b.slotId}#cancelled#${Date.now()}`, status: 'cancelled', cancelledAt: new Date().toISOString() },
        }))
        await ddb.send(new DeleteCommand({ TableName: BOOK_TABLE, Key: { slotId: b.slotId } }))
        await sendMail(b.customer.email, 'Your RECON6 session is cancelled',
          `Cancelled: ${b.sessionType} at ${b.slotId} (UTC).\nBook again any time: ${SITE}/coaching/\n\nAaron — Recon 6`)
        for (const a of ALERT_EMAILS) await sendMail(a, `CANCELLED: ${b.slotId}`, `${b.customer.name} <${b.customer.email}> cancelled ${b.sessionType} at ${b.slotId}.`)
        return resp(200, { cancelled: true })
      }

      if (action === 'reschedule') {
        const cfg = await getConfig()
        if (!newSlotId || !expandSlots(cfg).includes(newSlotId)) return resp(400, { error: 'pick a valid new slot' })
        try {
          await ddb.send(new PutCommand({
            TableName: BOOK_TABLE,
            Item: {
              slotId: newSlotId, status: 'confirmed', customer: b.customer, sessionType: b.sessionType,
              manageToken: b.manageToken, confirmedAt: new Date().toISOString(), rescheduledFrom: b.slotId,
            },
            ConditionExpression: 'attribute_not_exists(slotId)',
          }))
        } catch { return resp(409, { error: 'That slot just went — pick another.' }) }
        await ddb.send(new DeleteCommand({ TableName: BOOK_TABLE, Key: { slotId: b.slotId } }))
        const item = { slotId: newSlotId, customer: b.customer, sessionType: b.sessionType, manageToken: b.manageToken }
        await notifyBooked(item, cfg)
        return resp(200, { rescheduled: true, slotId: newSlotId })
      }
      return resp(400, { error: 'unknown action' })
    }

    // ---------- admin ----------
    if (path.includes('/admin/')) {
      const admin = await requireAdmin(event)
      if (!admin) return resp(403, { error: 'admin only' })

      if (method === 'GET' && path.endsWith('/admin/bookings')) {
        const scan = await ddb.send(new ScanCommand({ TableName: BOOK_TABLE }))
        const items = (scan.Items || [])
          .filter((b) => b.status === 'confirmed')
          .sort((a, b2) => a.slotId.localeCompare(b2.slotId))
        return resp(200, { bookings: items })
      }
      if (method === 'GET' && path.endsWith('/admin/availability')) {
        return resp(200, { config: await getConfig() })
      }
      if (method === 'PUT' && path.endsWith('/admin/availability')) {
        const cfg = body.config || {}
        const clean = {
          config_id: 'default',
          timezone: String(cfg.timezone || DEFAULT_CONFIG.timezone),
          session_minutes: Math.min(240, Math.max(15, Number(cfg.session_minutes) || 60)),
          buffer_minutes: Math.min(120, Math.max(0, Number(cfg.buffer_minutes) || 15)),
          booking_horizon_days: Math.min(60, Math.max(1, Number(cfg.booking_horizon_days) || 21)),
          min_notice_hours: Math.min(168, Math.max(0, Number(cfg.min_notice_hours) || 12)),
          windows: (Array.isArray(cfg.windows) ? cfg.windows : DEFAULT_CONFIG.windows)
            .filter((w) => Number.isInteger(w.dow) && w.dow >= 0 && w.dow <= 6 && /^\d{2}:\d{2}$/.test(w.start) && /^\d{2}:\d{2}$/.test(w.end))
            .slice(0, 30),
          blackouts: (Array.isArray(cfg.blackouts) ? cfg.blackouts : []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 100),
        }
        await ddb.send(new PutCommand({ TableName: AVAIL_TABLE, Item: clean }))
        return resp(200, { saved: true, config: clean })
      }
    }

    return resp(404, { error: 'unknown route' })
  } catch (err) {
    console.error('booking error:', err)
    return resp(500, { error: 'internal' })
  }
}
