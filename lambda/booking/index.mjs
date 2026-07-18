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
import Stripe from 'stripe'
import crypto from 'node:crypto'

const REGION = process.env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const ses = new SESv2Client({ region: REGION })

const AVAIL_TABLE = process.env.AVAILABILITY_TABLE || 'recon6-availability'
const BOOK_TABLE = process.env.BOOKINGS_TABLE || 'recon6-bookings'

// Stripe — one-time coaching payments. Secret is the same live key the webhook
// Lambda uses (STRIPE_SECRET_KEY), set on this function's env; never logged.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
// Session type → { price id, amount cents, label }. Kept in sync with
// src/config/stripe.js COACHING_*_PRICE_ID.
const COACHING = {
  intro: { price: process.env.COACHING_INTRO_PRICE_ID || 'price_1TsOskJNddvjgWcgOPhkaqnK', amount: 2000, label: 'First Session (intro)' },
  single: { price: process.env.COACHING_SINGLE_PRICE_ID || 'price_1TsOsaJNddvjgWcgmalTAfcn', amount: 4000, label: 'Single Session' },
  package: { price: process.env.COACHING_PACKAGE_PRICE_ID || 'price_1TsOswJNddvjgWcgBuf68fSA', amount: 14000, label: '4-Session Package' },
}
const PACKAGE_SESSIONS = 4 // legacy à-la-carte package (archived); kept for old rows
// Reconciled model: the $70/mo add-on grants a fixed monthly credit balance.
const COACHING_ADDON_PRICE_ID = process.env.COACHING_ADDON_PRICE_ID || 'price_1TsZtQJNddvjgWcgwPKVEYQm'
const CREDITS_PER_MONTH = 2 // set (not incremented) each cycle — no rollover
const FROM = process.env.FROM_ADDRESS || 'Recon 6 Coaching <coach@r6coaching.com>'
const ALERT_EMAILS = (process.env.ALERT_EMAIL || 'aaron@ironfrontdigital.com,aaronhenry1981@gmail.com').split(',').map((s) => s.trim())
const SITE = 'https://r6coaching.com'
const API_BASE = process.env.API_BASE || 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'
const CAL_FEED_TOKEN = process.env.CAL_FEED_TOKEN || '' // unguessable key for the private webcal feed
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

// Channel attribution — mirror src/lib/refSource.js sanitize; default 'direct'
// so every booking has a source and coaching attribution is never blind.
const refSource = (raw) => {
  const clean = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32)
  return clean || 'direct'
}

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
  // One-off availability: specific date+time ranges Aaron opens OUTSIDE his
  // weekly pattern. One-off time-off: specific ranges he blocks (partial-day;
  // full-day off is a blackout). Both in the coach's timezone.
  //   availability = windows + oneoffs − blackouts − timeoff − booked
  oneoffs: [],  // [{ date:'YYYY-MM-DD', start:'HH:MM', end:'HH:MM' }]
  timeoff: [],  // [{ date:'YYYY-MM-DD', start:'HH:MM', end:'HH:MM' }]
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

// Does [slotStart, slotStart+minutes) overlap any time-off range on `date`?
function inTimeoff(slotStartMs, minutes, date, timeoff, tz) {
  const slotEnd = slotStartMs + minutes * 60000
  for (const r of timeoff || []) {
    if (r.date !== date || !/^\d{2}:\d{2}$/.test(r.start || '') || !/^\d{2}:\d{2}$/.test(r.end || '')) continue
    const rs = zonedTimeToUtc(r.date, r.start, tz)
    const re = zonedTimeToUtc(r.date, r.end, tz)
    if (slotStartMs < re && slotEnd > rs) return true // overlap
  }
  return false
}

// Expand availability into candidate UTC slot ids within the horizon.
//   availability = weekly windows + one-offs − blackouts − time-off
// (booked/held slots are removed later by filterOpen).
function expandSlots(cfg, now = Date.now()) {
  const slots = []
  const step = (cfg.session_minutes + cfg.buffer_minutes) * 60000
  const minStart = now + cfg.min_notice_hours * 3600000
  const horizonEnd = now + cfg.booking_horizon_days * 86400000
  const timeoff = cfg.timeoff || []

  // Emit every session-length slot inside one window (a recurring window or a
  // one-off), applying notice/horizon/blackout/time-off subtraction uniformly.
  const emit = (date, winStart, winEnd) => {
    if ((cfg.blackouts || []).includes(date)) return
    for (let s = winStart; s + cfg.session_minutes * 60000 <= winEnd; s += step) {
      if (s < minStart || s > horizonEnd) continue
      if (inTimeoff(s, cfg.session_minutes, date, timeoff, cfg.timezone)) continue
      slots.push(new Date(s).toISOString().replace(/\.\d{3}Z$/, 'Z'))
    }
  }

  // Recurring weekly windows across the horizon.
  for (let t = now; t <= horizonEnd; t += 86400000) {
    const { date, dow } = dayInfoInTz(t, cfg.timezone)
    for (const w of cfg.windows || []) {
      if (w.dow !== dow) continue
      emit(date, zonedTimeToUtc(date, w.start, cfg.timezone), zonedTimeToUtc(date, w.end, cfg.timezone))
    }
  }

  // One-off availability on specific dates (outside the weekly pattern).
  for (const o of cfg.oneoffs || []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date || '') || !/^\d{2}:\d{2}$/.test(o.start || '') || !/^\d{2}:\d{2}$/.test(o.end || '')) continue
    emit(o.date, zonedTimeToUtc(o.date, o.start, cfg.timezone), zonedTimeToUtc(o.date, o.end, cfg.timezone))
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

// Send with a real .ics attachment (a proper "add to calendar" file, not
// inline text) via a raw MIME message. Falls back to plain sendMail on error.
async function sendMailWithIcs(to, subject, body, ics, filename = 'recon6-session.ics') {
  const boundary = '=_recon6_' + crypto.randomBytes(8).toString('hex')
  const icsB64 = Buffer.from(ics, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n')
  const raw = [
    `From: ${FROM}`, `To: ${to}`, `Subject: ${subject}`, 'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`, '',
    `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 7bit', '', body, '',
    `--${boundary}`,
    `Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`, '', icsB64, '',
    `--${boundary}--`, '',
  ].join('\r\n')
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: { Raw: { Data: Buffer.from(raw, 'utf8') } },
    }))
    return true
  } catch (err) {
    console.warn(`ics mail failed → ${to}: ${err.name} — falling back to plain`)
    return sendMail(to, subject, body)
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

// Live iCalendar feed of all upcoming confirmed/comped sessions — the private
// webcal subscription Aaron adds to his phone once. Standard iCal, no 3rd party.
function feedIcs(items, minutes) {
  const dt = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const stamp = dt(new Date().toISOString())
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RECON6//Coaching//EN', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'X-WR-CALNAME:RECON6 Coaching', 'X-WR-TIMEZONE:UTC', 'REFRESH-INTERVAL;VALUE=DURATION:PT15M']
  for (const b of items) {
    const start = String(b.slotId).split('#')[0]
    const end = new Date(Date.parse(start) + minutes * 60000).toISOString()
    lines.push('BEGIN:VEVENT', `UID:${esc(b.slotId)}@r6coaching.com`, `DTSTAMP:${stamp}`,
      `DTSTART:${dt(start)}`, `DTEND:${dt(end)}`,
      `SUMMARY:RECON6: ${esc(b.customer?.name || 'Session')} (${esc(b.sessionType || 'coaching')})`,
      `DESCRIPTION:${esc((b.customer?.email || '') + ' · ' + (b.customer?.rank_goal || '') + (b.customer?.discord ? ' · discord ' + b.customer.discord : ''))}`,
      'STATUS:CONFIRMED', 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
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
  const title = `RECON6 Coaching — ${item.sessionType || 'Intro Session'}`
  const when = `${item.slotId} (UTC) — your calendar file/link shows it in your local time`
  const gcal = googleCalLink(item.slotId, cfg.session_minutes, title)
  const ics = icsFor(item.slotId, cfg.session_minutes, title, `With your RECON6 coach. ${manageLinks(item.manageToken)}`)
  const customerBody = `You're booked.

Session: ${title}
When: ${when}
Where: Discord (you'll get a DM before the session — make sure you've joined: https://discord.gg/namGQqs3jb)

Come with 2-3 clips or screenshots of rounds you lost — that's the raw material.

Your calendar invite is attached (recon6-session.ics) — open it to add the
session to Apple/Outlook/Google Calendar.
Prefer a one-click Google link? ${gcal}

${manageLinks(item.manageToken)}

Aaron — Recon 6`
  // Real .ics attachment so "add to calendar" works in one tap.
  const sentCustomer = await sendMailWithIcs(item.customer.email, `Booked: ${title}`, customerBody, ics)
  for (const a of ALERT_EMAILS) {
    await sendMail(a, `BOOKING: ${item.sessionType || 'Intro Session'} — ${item.slotId}`,
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
      `Your ${b.sessionType || 'Intro Session'} session is ${label}.\n\nSlot (UTC): ${b.slotId}\nBring 2-3 clips of rounds you lost.\nDiscord: https://discord.gg/namGQqs3jb\n\n${manageLinks(b.manageToken)}\n\nAaron — Recon 6`)
    for (const a of ALERT_EMAILS) {
      await sendMail(a, `Session ${label}: ${b.customer.name} (${b.sessionType || 'Intro Session'})`,
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

// ---- coaching payments (Stripe one-time) -------------------------------------
// First-session $20 gating: ANY prior confirmed/comped/completed coaching
// session for this email disqualifies the intro rate. The SERVER decides —
// never the client. Scan is fine at this table's volume.
async function hasPriorConfirmed(email) {
  const e = String(email || '').toLowerCase()
  if (!e) return false
  const scan = await ddb.send(new ScanCommand({
    TableName: BOOK_TABLE,
    FilterExpression: '#s IN (:c, :cm, :d)',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':c': 'confirmed', ':cm': 'comped', ':d': 'completed' },
  }))
  return (scan.Items || []).some((b) => String(b.customer?.email || '').toLowerCase() === e)
}

// Package credits live in the bookings table under a `credits#<email>` key so
// the booking Lambda owns them without touching the profiles table.
const creditKey = (email) => `credits#${String(email || '').toLowerCase()}`
async function getCredits(email) {
  const r = await ddb.send(new GetCommand({ TableName: BOOK_TABLE, Key: { slotId: creditKey(email) } }))
  return Number(r.Item?.credits || 0)
}
async function addCredits(email, n) {
  await ddb.send(new UpdateCommand({
    TableName: BOOK_TABLE, Key: { slotId: creditKey(email) },
    UpdateExpression: 'SET credits = if_not_exists(credits, :z) + :n, email = :e',
    ExpressionAttributeValues: { ':z': 0, ':n': n, ':e': String(email || '').toLowerCase() },
  }))
}
// SET the balance (add-on monthly grant/reset — no rollover).
async function setCredits(email, n) {
  await ddb.send(new UpdateCommand({
    TableName: BOOK_TABLE, Key: { slotId: creditKey(email) },
    UpdateExpression: 'SET credits = :n, email = :e, updatedAt = :t',
    ExpressionAttributeValues: { ':n': n, ':e': String(email || '').toLowerCase(), ':t': new Date().toISOString() },
  }))
}

// Confirm a held slot and send the confirmation email. Shared by paid finalize
// and credit-based booking. Idempotent: a already-confirmed slot just re-sends
// nothing and reports ok.
async function confirmHeld(slotId, extra) {
  const g = await ddb.send(new GetCommand({ TableName: BOOK_TABLE, Key: { slotId } }))
  const row = g.Item
  if (!row) return { ok: false, error: 'slot not found' }
  if (row.status === 'confirmed' || row.status === 'comped') return { ok: true, already: true }
  const manageToken = row.manageToken || crypto.randomBytes(20).toString('hex')
  await ddb.send(new UpdateCommand({
    TableName: BOOK_TABLE, Key: { slotId },
    UpdateExpression: 'SET #s = :c, manageToken = :m, confirmedAt = :t, payment = :p REMOVE holdToken, heldUntil',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':c': 'confirmed', ':m': manageToken, ':t': new Date().toISOString(), ':p': extra?.payment || { status: 'paid' } },
  }))
  const cfg = await getConfig()
  await notifyBooked({ slotId, customer: row.customer || {}, sessionType: row.sessionType, manageToken }, cfg)
  return { ok: true, slotId }
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
      // Channel attribution: the widget passes the first-touch ?ref source
      // (from localStorage 'recon:src'); default 'direct'. Same sanitize as
      // src/lib/refSource.js so coaching attribution matches membership.
      const referralSource = refSource(body.referral_source)
      try {
        await ddb.send(new UpdateCommand({
          TableName: BOOK_TABLE, Key: { slotId },
          UpdateExpression: 'SET #s = :c, customer = :cust, sessionType = :ty, manageToken = :m, referral_source = :rs, confirmedAt = :t REMOVE holdToken, heldUntil',
          ConditionExpression: '#s = :held AND holdToken = :h',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':c': 'confirmed', ':held': 'held', ':h': String(holdToken),
            ':cust': customer, ':ty': String(sessionType || 'Intro Session').slice(0, 60),
            ':m': manageToken, ':rs': referralSource, ':t': new Date().toISOString(),
          },
        }))
      } catch {
        return resp(409, { error: 'Hold expired or slot taken — pick another slot.' })
      }
      const cfg = await getConfig()
      const item = { slotId, customer, sessionType: sessionType || 'Intro Session', manageToken }
      const emailed = await notifyBooked(item, cfg)
      return resp(200, { booked: true, slotId, manageToken, confirmationEmail: emailed ? 'sent' : 'pending' })
    }

    // ---------- public: create Stripe checkout for a PAID session ----------
    // The widget holds the slot first (POST /booking/hold), then calls this.
    // Returns a Checkout URL to redirect to; the slot flips to confirmed only
    // after payment (webhook / success page → /booking/finalize). If the
    // customer has package credits, we skip checkout and confirm directly.
    if (method === 'POST' && path.endsWith('/booking/checkout')) {
      if (!stripe) return resp(500, { error: 'payments not configured' })
      const { slotId, holdToken, name, email, discord, rank_goal, tz, notes } = body
      const type = String(body.type || '').toLowerCase()
      const plan = COACHING[type]
      if (!slotId || !holdToken || !email || !name || !plan) return resp(400, { error: 'missing or invalid fields' })

      // Server-side first-session gating for the $20 intro.
      if (type === 'intro' && await hasPriorConfirmed(email)) {
        return resp(409, { code: 'not_first_session', error: 'The $20 intro is first-session only — book a Single Session ($40).' })
      }

      // Attach customer + type to the held row (conditional on the hold) so
      // finalize can confirm after payment.
      const customer = {
        name: String(name).slice(0, 80), email: String(email).slice(0, 120),
        discord: String(discord || '').slice(0, 60), rank_goal: String(rank_goal || '').slice(0, 60),
        tz: String(tz || '').slice(0, 60), notes: String(notes || '').slice(0, 500),
      }
      try {
        await ddb.send(new UpdateCommand({
          TableName: BOOK_TABLE, Key: { slotId },
          UpdateExpression: 'SET customer = :cust, sessionType = :ty, coachingType = :ct, referral_source = :rs',
          ConditionExpression: '#s = :held AND holdToken = :h',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':cust': customer, ':ty': plan.label, ':ct': type, ':rs': refSource(body.referral_source), ':held': 'held', ':h': String(holdToken) },
        }))
      } catch {
        return resp(409, { error: 'Hold expired or slot taken — pick another slot.' })
      }

      // Pre-paid package credit → confirm now, skip checkout, decrement.
      const credits = await getCredits(email)
      if (credits > 0) {
        await addCredits(email, -1)
        const r = await confirmHeld(slotId, { payment: { status: 'credit', amount: 0 } })
        if (!r.ok) { await addCredits(email, 1); return resp(409, r) } // refund the credit if confirm failed
        return resp(200, { booked: true, viaCredit: true, creditsLeft: credits - 1, slotId })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: plan.price, quantity: 1 }],
        customer_email: email,
        metadata: { slotId, email: String(email).toLowerCase(), type },
        success_url: `${SITE}/coaching/booked/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE}/coaching/?cancelled=1`,
      })
      return resp(200, { checkoutUrl: session.url })
    }

    // ---------- public: finalize a paid booking (webhook + success page) ----------
    // Idempotent — safe to call from both the Stripe webhook and the success
    // page. Verifies payment with Stripe (the session id is the capability),
    // flips held → confirmed, records payment, sends the confirmation email,
    // and credits a package's remaining sessions exactly once.
    if (method === 'POST' && path.endsWith('/booking/finalize')) {
      if (!stripe) return resp(500, { error: 'payments not configured' })
      const sessionId = String(body.sessionId || '')
      if (!sessionId) return resp(400, { error: 'sessionId required' })
      let cs
      try { cs = await stripe.checkout.sessions.retrieve(sessionId) } catch { return resp(400, { error: 'unknown session' }) }
      if (cs.payment_status !== 'paid') return resp(402, { error: 'not paid yet' })
      const slotId = cs.metadata?.slotId
      const type = cs.metadata?.type
      const email = cs.metadata?.email
      if (!slotId) return resp(400, { error: 'no slot in session metadata' })
      const r = await confirmHeld(slotId, { payment: { status: 'paid', amount: (cs.amount_total || 0) / 100, stripe_id: cs.payment_intent || cs.id } })
      if (!r.ok) return resp(404, r)
      if (type === 'package' && !r.already) await addCredits(email, PACKAGE_SESSIONS - 1)
      return resp(200, { booked: true, slotId, alreadyConfirmed: !!r.already })
    }

    // ---------- coaching add-on: set the monthly credit balance ----------
    // Called by the webhook on the $70/mo add-on's checkout.session.completed
    // and each invoice.paid renewal. Re-verifies with Stripe (the capability):
    // only a live ACTIVE add-on subscription sets credits, and it's SET to the
    // monthly grant (no rollover). Idempotent.
    if (method === 'POST' && path.endsWith('/booking/credits')) {
      if (!stripe) return resp(500, { error: 'payments not configured' })
      const subscriptionId = String(body.subscriptionId || '')
      if (!subscriptionId) return resp(400, { error: 'subscriptionId required' })
      let sub
      try { sub = await stripe.subscriptions.retrieve(subscriptionId) } catch { return resp(400, { error: 'unknown subscription' }) }
      if (!['active', 'trialing'].includes(sub.status)) return resp(402, { error: 'subscription not active' })
      if (sub.items?.data?.[0]?.price?.id !== COACHING_ADDON_PRICE_ID) return resp(400, { error: 'not the coaching add-on' })
      let email = sub.customer_email
      if (!email && sub.customer) { try { const c = await stripe.customers.retrieve(sub.customer); email = c.email } catch { /* fall through */ } }
      if (!email) return resp(400, { error: 'no customer email on subscription' })
      await setCredits(email, CREDITS_PER_MONTH)
      return resp(200, { ok: true, email: String(email).toLowerCase(), credits: CREDITS_PER_MONTH })
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

    // ---------- public (key-guarded): live webcal feed ----------
    // Calendar apps subscribe with a plain GET and can't send an auth header,
    // so this is guarded by an unguessable ?key= token, not the admin JWT.
    if (method === 'GET' && path.endsWith('/admin/calendar.ics')) {
      const key = event.queryStringParameters?.key || ''
      if (!CAL_FEED_TOKEN || key !== CAL_FEED_TOKEN) return resp(403, { error: 'bad key' })
      const cfg = await getConfig()
      const scan = await ddb.send(new ScanCommand({ TableName: BOOK_TABLE }))
      const cutoff = Date.now() - 86400000 // keep yesterday onward
      const items = (scan.Items || [])
        .filter((b) => (b.status === 'confirmed' || b.status === 'comped') && Date.parse(String(b.slotId).split('#')[0]) >= cutoff)
        .sort((a, b2) => a.slotId.localeCompare(b2.slotId))
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="recon6-coaching.ics"',
          'Access-Control-Allow-Origin': '*',
        },
        body: feedIcs(items, cfg.session_minutes),
      }
    }

    // ---------- admin ----------
    if (path.includes('/admin/')) {
      const admin = await requireAdmin(event)
      if (!admin) return resp(403, { error: 'admin only' })

      // The webcal subscription URL (with the private key) for the admin UI's
      // "Add to my phone" button — keeps the key off the public site.
      if (method === 'GET' && path.endsWith('/admin/calendar-url')) {
        if (!CAL_FEED_TOKEN) return resp(200, { url: null, note: 'CAL_FEED_TOKEN not configured' })
        const httpsUrl = `${API_BASE}/admin/calendar.ics?key=${CAL_FEED_TOKEN}`
        return resp(200, { url: httpsUrl.replace(/^https:/, 'webcal:'), httpsUrl })
      }

      if (method === 'GET' && path.endsWith('/admin/bookings')) {
        const all = event.queryStringParameters?.all === '1'
        const scan = await ddb.send(new ScanCommand({ TableName: BOOK_TABLE }))
        // `start` = leading ISO of the slotId (cancelled rows carry a
        // `#cancelled#ts` suffix). Default view = real upcoming bookings
        // (confirmed/comped/completed); the calendar passes ?all=1 to also get
        // held slots and cancelled tombstones for full colour-coding.
        const cutoff = new Date(Date.now() - 86400000).toISOString()
        const items = (scan.Items || [])
          .map((b) => ({ ...b, start: String(b.slotId).split('#')[0] }))
          .filter((b) => /^\d{4}-\d{2}-\d{2}T/.test(b.start))
          .filter((b) => all || (['confirmed', 'comped', 'completed'].includes(b.status) && b.start >= cutoff))
          .sort((a, b2) => a.start.localeCompare(b2.start))
        return resp(200, { bookings: items, session_minutes: (await getConfig()).session_minutes })
      }

      // Admin booking actions: private notes, mark complete, comp ($0
      // confirmed), cancel (notify + free slot), reschedule (atomic move).
      if (method === 'POST' && path.endsWith('/admin/booking')) {
        const { action, slotId, newSlotId, notes } = body
        const cfg = await getConfig()
        if (action === 'notes') {
          if (!slotId) return resp(400, { error: 'slotId required' })
          await ddb.send(new UpdateCommand({
            TableName: BOOK_TABLE, Key: { slotId: String(slotId) },
            UpdateExpression: 'SET notes = :n',
            ExpressionAttributeValues: { ':n': String(notes || '').slice(0, 2000) },
          }))
          return resp(200, { saved: true })
        }
        if (action === 'complete') {
          if (!slotId) return resp(400, { error: 'slotId required' })
          await ddb.send(new UpdateCommand({
            TableName: BOOK_TABLE, Key: { slotId: String(slotId) },
            UpdateExpression: 'SET #s = :done', ConditionExpression: 'attribute_exists(slotId)',
            ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':done': 'completed' },
          }))
          return resp(200, { completed: true })
        }
        if (action === 'comp') {
          // Create a $0 confirmed booking directly on an open slot (the pass).
          if (!slotId || !body.email || !body.name) return resp(400, { error: 'slotId, name, email required' })
          if (!expandSlots(cfg).includes(String(slotId))) return resp(400, { error: 'not an open slot' })
          const manageToken = crypto.randomBytes(20).toString('hex')
          const customer = {
            name: String(body.name).slice(0, 80), email: String(body.email).slice(0, 120),
            discord: String(body.discord || '').slice(0, 60), rank_goal: String(body.rank_goal || '').slice(0, 60),
            tz: String(body.tz || cfg.timezone).slice(0, 60), notes: String(body.customerNotes || '').slice(0, 500),
          }
          try {
            await ddb.send(new PutCommand({
              TableName: BOOK_TABLE,
              Item: {
                slotId: String(slotId), status: 'comped', customer, sessionType: String(body.sessionType || 'Comped session').slice(0, 60),
                payment: { status: 'comped', amount: 0 }, manageToken, notes: String(notes || '').slice(0, 2000),
                referral_source: refSource(body.referral_source || 'comp'), confirmedAt: new Date().toISOString(),
              },
              ConditionExpression: 'attribute_not_exists(slotId)',
            }))
          } catch { return resp(409, { error: 'That slot is already taken.' }) }
          await notifyBooked({ slotId: String(slotId), customer, sessionType: body.sessionType || 'Comped session', manageToken }, cfg)
          return resp(200, { comped: true, slotId })
        }
        if (action === 'cancel') {
          if (!slotId) return resp(400, { error: 'slotId required' })
          const g = await ddb.send(new GetCommand({ TableName: BOOK_TABLE, Key: { slotId: String(slotId) } }))
          const b = g.Item
          if (!b) return resp(404, { error: 'booking not found' })
          await ddb.send(new PutCommand({
            TableName: BOOK_TABLE,
            Item: { ...b, slotId: `${b.slotId}#cancelled#${new Date().toISOString()}`, status: 'cancelled', cancelledAt: new Date().toISOString() },
          }))
          await ddb.send(new DeleteCommand({ TableName: BOOK_TABLE, Key: { slotId: String(slotId) } }))
          if (b.customer?.email) await sendMail(b.customer.email, 'Your RECON6 session was cancelled',
            `Your ${b.sessionType || 'session'} at ${b.slotId} (UTC) was cancelled by the coach.\nBook again any time: ${SITE}/coaching/\n\nAaron — Recon 6`)
          return resp(200, { cancelled: true })
        }
        if (action === 'reschedule') {
          if (!slotId || !newSlotId) return resp(400, { error: 'slotId and newSlotId required' })
          if (!expandSlots(cfg).includes(String(newSlotId))) return resp(400, { error: 'new slot not open' })
          const g = await ddb.send(new GetCommand({ TableName: BOOK_TABLE, Key: { slotId: String(slotId) } }))
          const b = g.Item
          if (!b) return resp(404, { error: 'booking not found' })
          try {
            await ddb.send(new PutCommand({
              TableName: BOOK_TABLE,
              Item: { ...b, slotId: String(newSlotId), confirmedAt: new Date().toISOString(), rescheduledFrom: b.slotId },
              ConditionExpression: 'attribute_not_exists(slotId)',
            }))
          } catch { return resp(409, { error: 'That slot just went — pick another.' }) }
          await ddb.send(new DeleteCommand({ TableName: BOOK_TABLE, Key: { slotId: String(slotId) } }))
          await notifyBooked({ slotId: String(newSlotId), customer: b.customer, sessionType: b.sessionType, manageToken: b.manageToken }, cfg)
          return resp(200, { rescheduled: true, slotId: newSlotId })
        }
        return resp(400, { error: 'unknown action' })
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
          // One-off availability + partial-day time-off, both {date,start,end}
          // in the coach's timezone. end must be after start to be meaningful.
          oneoffs: (Array.isArray(cfg.oneoffs) ? cfg.oneoffs : [])
            .filter((o) => /^\d{4}-\d{2}-\d{2}$/.test(o.date) && /^\d{2}:\d{2}$/.test(o.start) && /^\d{2}:\d{2}$/.test(o.end) && o.end > o.start)
            .map((o) => ({ date: o.date, start: o.start, end: o.end }))
            .slice(0, 200),
          timeoff: (Array.isArray(cfg.timeoff) ? cfg.timeoff : [])
            .filter((o) => /^\d{4}-\d{2}-\d{2}$/.test(o.date) && /^\d{2}:\d{2}$/.test(o.start) && /^\d{2}:\d{2}$/.test(o.end) && o.end > o.start)
            .map((o) => ({ date: o.date, start: o.start, end: o.end }))
            .slice(0, 200),
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
