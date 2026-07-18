// ghost-igl-crm — the automated customer lifecycle engine.
//
// Runs daily via EventBridge. Replaces the "scheduled agent writes Gmail
// drafts nobody sends" flow with real, tracked, once-only sends:
//
//   1. WELCOME     confirmed signup < 14 days old, no welcome yet → email
//   2. CONFIRM     UNCONFIRMED account > 24h → resend Cognito code (max 2, 72h apart)
//   3. WINBACK     account > 7 days old, never/not seen in 14 days → one email, ever
//   4. ORPHANS     active Stripe sub with no Cognito login → flagged in digest
//   5. DIGEST      summary of everything it did + risks → ALERT_EMAIL
//
// State lives in ghost-igl-crm-log (PK email) — flags are set ONLY after a
// successful send, so SES-sandbox failures retry daily and the whole system
// self-activates the day production access is granted. DRY_RUN=true logs
// instead of sending.

import { CognitoIdentityProviderClient, ListUsersCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const REGION = process.env.AWS_REGION || 'us-east-1'
const cognito = new CognitoIdentityProviderClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const ses = new SESv2Client({ region: REGION })

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID
const CRM_TABLE = process.env.CRM_TABLE || 'ghost-igl-crm-log'
const SUBS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
// Digest goes to BOTH addresses — Google Workspace has been silently binning
// digests to the ironfrontdigital.com inbox (delivery test arrived, digests
// didn't), so the personal Gmail is the reliability backstop. Comma-separated.
const ALERT_EMAILS = (process.env.ALERT_EMAIL || 'aaron@ironfrontdigital.com,aaronhenry1981@gmail.com').split(',').map((s) => s.trim())
const FROM = process.env.FROM_ADDRESS || 'Recon 6 <coach@r6coaching.com>'
const SITE = 'https://r6coaching.com'
const DRY_RUN = process.env.DRY_RUN === 'true'

const DAY = 24 * 60 * 60 * 1000

// ---- email templates (plain text, Aaron's voice, no emojis) -----------------
function welcomeEmail(email) {
  return {
    subject: 'Welcome to Recon 6 — start with these three things',
    body: `Hey,

You're in. Three things worth doing first:

1. Live Coach — the in-match walkthrough. Pick your stack size, map, and bans, and it tells you what to pick and how to play it: ${SITE}/#/live
2. Map strats — every ranked map, site by site: ${SITE}/#/strats
3. Finish your profile (30 seconds) and you get a free 7-day Pro trial — no card: ${SITE}/#/account

If anything's confusing or broken, just reply to this email. I read everything.

Aaron — Recon 6`,
  }
}

function winbackEmail(email) {
  return {
    subject: 'Your Recon 6 account is sitting idle',
    body: `Hey,

You signed up for Recon 6 but haven't been back — fair enough, so here's the one thing worth returning for:

Live Coach walks you through your actual ranked match in real time — map bans, operator bans, what to pick, where to spawn, how to play the site: ${SITE}/#/live

It's updated for the current patch (Dokkaebi cooldown, the prone-cancel removal — the meta moved). Takes one match to see if it helps.

If Recon 6 wasn't what you were looking for, reply and tell me what was missing — that's genuinely useful to me.

Aaron — Recon 6`,
  }
}

// One-time coaching-intro campaign (NOT part of the daily lifecycle — only
// runs when invoked with {campaign:'coaching-intro'}). Pushes the $20 first
// session. ?ref=email so the booking Lambda's referral_source attribution
// records which channel converted. Aaron's voice, no emojis (CRM convention).
function coachingIntroEmail() {
  return {
    subject: 'The thing costing you the most rounds — let us find it ($20)',
    body: `Hey,

You have the strat library. Here is the part it cannot do for you: watch YOUR rounds and tell you which mistake you are repeating five matches in a row.

That is a coaching session. Your first one is $20 — half the $40 single rate, first-timers only.

How it works:
- Bring 2-3 clips or screenshots of rounds you lost.
- The AI processes them before we meet: what killed you, where, and the pattern across rounds.
- We watch the moments that matter, fix ONE thing properly, and you leave with a concrete plan for your next queue.
- Console (PS5 capture-card) or PC. Any rank. Sessions run on Discord. 7-day money-back guarantee.

Pick a time: ${SITE}/coaching/?ref=email#book

Not boosting — nobody touches your account, ever. You earn the rank; coaching just stops the repeat mistakes.

Aaron — Recon 6`,
  }
}

// ---- helpers ----------------------------------------------------------------
async function sendEmail(to, { subject, body }, forceDry = false) {
  if (DRY_RUN || forceDry) { console.log(`DRY_RUN send → ${to}: ${subject}`); return true }
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: body, Charset: 'UTF-8' } } } },
    }))
    return true
  } catch (err) {
    // Sandbox rejections land here — logged, flag NOT set, retries next run.
    console.warn(`send failed → ${to}: ${err.name}: ${err.message}`)
    return false
  }
}

async function crmGet(email) {
  const r = await ddb.send(new GetCommand({ TableName: CRM_TABLE, Key: { email } }))
  return r.Item || { email }
}

async function crmSet(email, fields) {
  const sets = Object.keys(fields).map((k, i) => `#k${i} = :v${i}`).join(', ')
  const names = Object.fromEntries(Object.keys(fields).map((k, i) => [`#k${i}`, k]))
  const values = Object.fromEntries(Object.values(fields).map((v, i) => [`:v${i}`, v]))
  await ddb.send(new UpdateCommand({
    TableName: CRM_TABLE, Key: { email },
    UpdateExpression: 'SET ' + sets,
    ExpressionAttributeNames: names, ExpressionAttributeValues: values,
  }))
}

async function listAllUsers() {
  const users = []
  let token
  do {
    const r = await cognito.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID, Limit: 60, PaginationToken: token }))
    users.push(...(r.Users || []))
    token = r.PaginationToken
  } while (token)
  return users.map((u) => ({
    username: u.Username,
    email: (u.Attributes?.find((a) => a.Name === 'email')?.Value || '').toLowerCase(),
    status: u.UserStatus,
    created: u.UserCreateDate ? new Date(u.UserCreateDate).getTime() : 0,
  })).filter((u) => u.email)
}

async function scanAll(table) {
  const items = []
  let key
  do {
    const r = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey: key }))
    items.push(...(r.Items || []))
    key = r.LastEvaluatedKey
  } while (key)
  return items
}

// ---- coaching-intro campaign (invoke-triggered, NOT the daily cron) ----------
// Invoke with { campaign: 'coaching-intro', segment?, limit?, dryRun? }.
//   segment: 'all' (default) | 'free' (no active sub) | 'subscribers' (active sub)
//   limit:   cap this batch (send to a small first wave, then the rest)
//   dryRun:  force preview even if env DRY_RUN is unset — logs + counts, no send
// Once-only per address via crm-log flag `coaching_intro_sent_at`. Best-effort
// exclusion of anyone who already booked a coaching session (the $20 "first
// session" copy would be wrong for them; the server enforces first-timer-only
// anyway, so this is a courtesy filter, not a correctness gate).
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE || 'recon6-bookings'

async function priorCoachingEmails() {
  try {
    const rows = await scanAll(BOOKINGS_TABLE)
    const set = new Set()
    for (const b of rows) {
      if (['confirmed', 'comped', 'completed'].includes(b.status) && b.customer?.email) {
        set.add(String(b.customer.email).toLowerCase())
      }
    }
    return set
  } catch (err) {
    console.warn(`priorCoachingEmails: could not read ${BOOKINGS_TABLE} (${err.name}) — proceeding without prior-customer exclusion`)
    return null // signal "unknown" so the digest can flag it
  }
}

async function runCoachingIntroCampaign(event) {
  const now = Date.now()
  const segment = ['all', 'free', 'subscribers'].includes(event.segment) ? event.segment : 'all'
  const limit = Number.isInteger(event.limit) && event.limit > 0 ? event.limit : Infinity
  const dryRun = DRY_RUN || event.dryRun === true
  const tmpl = coachingIntroEmail()

  const [users, subs] = await Promise.all([listAllUsers(), scanAll(SUBS_TABLE)])
  const activeSubEmails = new Set(
    subs.filter((s) => ['active', 'trialing'].includes(s.status) && s.email)
      .map((s) => String(s.email).toLowerCase()),
  )
  const prior = await priorCoachingEmails()
  // Never pitch the owner/alert inboxes — they receive the digest, not the ad.
  const ownerEmails = new Set(ALERT_EMAILS.map((e) => String(e).toLowerCase()))

  const report = { campaign: 'coaching-intro', segment, dryRun, sent: [], skipped: {}, failures: [] }
  const skip = (why) => { report.skipped[why] = (report.skipped[why] || 0) + 1 }

  for (const u of users) {
    if (report.sent.length >= limit) { skip('over_batch_limit'); continue }
    if (u.status !== 'CONFIRMED') { skip('unconfirmed'); continue }
    if (ownerEmails.has(u.email)) { skip('owner_address'); continue }
    const isSub = activeSubEmails.has(u.email)
    if (segment === 'free' && isSub) { skip('is_subscriber'); continue }
    if (segment === 'subscribers' && !isSub) { skip('not_subscriber'); continue }
    if (prior && prior.has(u.email)) { skip('already_coached'); continue }
    const log = await crmGet(u.email)
    if (log.coaching_intro_sent_at) { skip('already_emailed'); continue }

    if (await sendEmail(u.email, tmpl, dryRun)) {
      if (!dryRun) await crmSet(u.email, { coaching_intro_sent_at: new Date(now).toISOString() })
      report.sent.push(u.email)
    } else report.failures.push(u.email)
  }

  const mask = (e) => String(e).replace('@', ' [at] ')
  const few = (arr) => arr.slice(0, 5).map(mask).join(', ') + (arr.length > 5 ? ` +${arr.length - 5} more` : '')
  const digest = [
    `Recon 6 coaching-intro campaign ${dryRun ? '(DRY RUN — nothing sent)' : '(LIVE SEND)'}`,
    `Segment: ${segment}${limit !== Infinity ? ` · batch limit ${limit}` : ''}`,
    prior === null ? 'WARNING: could not read bookings table — prior coaching customers NOT excluded.' : `Prior coaching customers excluded: ${prior.size}`,
    '',
    `${dryRun ? 'WOULD send' : 'Sent'}: ${report.sent.length}${report.sent.length ? ' (' + few(report.sent) + ')' : ''}`,
    `Skipped: ${Object.entries(report.skipped).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`,
    report.failures.length ? `Send failures (SES): ${report.failures.length}` : '',
    '',
    `Universe: ${users.length} accounts, ${activeSubEmails.size} active subs.`,
  ].filter((l) => l !== '').join('\n')
  for (const addr of ALERT_EMAILS) {
    await sendEmail(addr, { subject: `Coaching-intro campaign: ${dryRun ? 'DRY RUN' : 'SENT'} ${report.sent.length}`, body: digest })
  }
  console.log(JSON.stringify(report))
  return report
}

// ---- main -------------------------------------------------------------------
export async function handler(event = {}) {
  // Invoke-triggered campaigns branch off here so the daily EventBridge run
  // (no event.campaign) keeps its exact prior behavior.
  if (event?.campaign === 'coaching-intro') return runCoachingIntroCampaign(event)

  const now = Date.now()
  const report = { welcome: [], confirmNudge: [], winback: [], orphans: [], pastDue: [], failures: [] }

  const [users, subs, profiles] = await Promise.all([
    listAllUsers(), scanAll(SUBS_TABLE), scanAll(PROFILES_TABLE),
  ])
  const profileByEmail = new Map(profiles.map((p) => [(p.email || '').toLowerCase(), p]))
  const cognitoEmails = new Set(users.map((u) => u.email))

  // 4. Orphans + past-due (digest only — recovery emails are personal, Aaron sends)
  for (const s of subs) {
    const email = (s.email || '').toLowerCase()
    if (s.status === 'active' && email && !cognitoEmails.has(email)) report.orphans.push(email)
    if (s.status === 'past_due') report.pastDue.push(email)
  }

  for (const u of users) {
    const log = await crmGet(u.email)
    const ageDays = (now - u.created) / DAY

    // 1. Welcome — confirmed, fresh, not yet welcomed
    if (u.status === 'CONFIRMED' && ageDays <= 14 && !log.welcome_sent_at) {
      if (await sendEmail(u.email, welcomeEmail(u.email))) {
        await crmSet(u.email, { welcome_sent_at: new Date(now).toISOString() })
        report.welcome.push(u.email)
      } else report.failures.push('welcome:' + u.email)
      continue
    }

    // 2. Confirmation nudge — Cognito's own mailer, works regardless of SES sandbox
    if (u.status === 'UNCONFIRMED' && ageDays * 24 >= 24) {
      const nudges = log.confirm_nudges || 0
      const last = log.confirm_nudge_at ? Date.parse(log.confirm_nudge_at) : 0
      if (nudges < 2 && now - last > 3 * DAY) {
        try {
          if (!DRY_RUN) await cognito.send(new ResendConfirmationCodeCommand({ ClientId: CLIENT_ID, Username: u.email }))
          await crmSet(u.email, { confirm_nudges: nudges + 1, confirm_nudge_at: new Date(now).toISOString() })
          report.confirmNudge.push(u.email)
        } catch (err) { report.failures.push('confirm:' + u.email + ':' + err.name) }
      }
      continue
    }

    // 3. Winback — signed up a while ago, never/not recently active, once ever
    const lastSeen = profileByEmail.get(u.email)?.last_seen_at ? Date.parse(profileByEmail.get(u.email).last_seen_at) : 0
    const dormant = now - Math.max(lastSeen, 0) > 14 * DAY
    if (u.status === 'CONFIRMED' && ageDays > 7 && dormant && !log.winback_sent_at && !log.welcome_sent_at) {
      if (await sendEmail(u.email, winbackEmail(u.email))) {
        await crmSet(u.email, { winback_sent_at: new Date(now).toISOString() })
        report.winback.push(u.email)
      } else report.failures.push('winback:' + u.email)
    }
  }

  // 5. Digest to Aaron — the daily pulse, replaces manually scanning the table.
  // FILTER-FRIENDLY: the first version dumped 20+ raw email addresses into the
  // body and Google Workspace silently binned it as spam (the plain-sentence
  // delivery test arrived fine; every digest vanished). Addresses are obfuscated
  // (name [at] domain) and capped — full lists live in CloudWatch logs.
  const mask = (e) => String(e).replace('@', ' [at] ')
  const few = (arr) => arr.slice(0, 3).map(mask).join(', ') + (arr.length > 3 ? ` +${arr.length - 3} more` : '')
  const lines = [
    `Recon 6 CRM daily run ${new Date(now).toISOString().slice(0, 10)}`,
    '',
    `Welcome emails sent: ${report.welcome.length}${report.welcome.length ? ' (' + few(report.welcome) + ')' : ''}`,
    `Confirmation nudges: ${report.confirmNudge.length}${report.confirmNudge.length ? ' (' + few(report.confirmNudge) + ')' : ''}`,
    `Win-back emails sent: ${report.winback.length}${report.winback.length ? ' (' + few(report.winback) + ')' : ''}`,
    '',
    `ORPHANS (paying, no login, needs your action): ${report.orphans.length ? report.orphans.map(mask).join(', ') : 'none'}`,
    `Past due: ${report.pastDue.length ? report.pastDue.map(mask).join(', ') : 'none'}`,
    report.failures.length ? `Send attempts held by SES sandbox (auto-retry daily): ${report.failures.length}` : '',
    '',
    `Totals: ${users.length} accounts, ${subs.filter((s) => s.status === 'active').length} active subs.`,
    'Full per-address detail: CloudWatch logs, /aws/lambda/ghost-igl-crm.',
  ].filter((l) => l !== '').join('\n')

  const digestSubject = 'Recon 6 CRM daily: ' + ([report.welcome.length && `${report.welcome.length} welcome`, report.confirmNudge.length && `${report.confirmNudge.length} nudge`, report.winback.length && `${report.winback.length} winback`, report.orphans.length && `${report.orphans.length} ORPHAN`].filter(Boolean).join(', ') || 'quiet day')
  for (const addr of ALERT_EMAILS) {
    await sendEmail(addr, { subject: digestSubject, body: lines })
  }

  console.log(JSON.stringify(report))
  return report
}
