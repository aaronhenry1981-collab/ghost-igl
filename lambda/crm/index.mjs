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
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'aaron@ironfrontdigital.com'
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

// ---- helpers ----------------------------------------------------------------
async function sendEmail(to, { subject, body }) {
  if (DRY_RUN) { console.log(`DRY_RUN send → ${to}: ${subject}`); return true }
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } },
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

// ---- main -------------------------------------------------------------------
export async function handler() {
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

  // 5. Digest to Aaron — the daily pulse, replaces manually scanning the table
  const lines = [
    `Recon 6 CRM — daily run ${new Date(now).toISOString().slice(0, 10)}`,
    '',
    `Welcome emails sent: ${report.welcome.length}${report.welcome.length ? ' — ' + report.welcome.join(', ') : ''}`,
    `Confirmation nudges: ${report.confirmNudge.length}${report.confirmNudge.length ? ' — ' + report.confirmNudge.join(', ') : ''}`,
    `Win-back emails sent: ${report.winback.length}${report.winback.length ? ' — ' + report.winback.join(', ') : ''}`,
    '',
    `ORPHANS (paying, no login — needs your action): ${report.orphans.length ? report.orphans.join(', ') : 'none'}`,
    `Past due: ${report.pastDue.length ? report.pastDue.join(', ') : 'none'}`,
    report.failures.length ? `\nSend failures (retry tomorrow — SES sandbox until production access): ${report.failures.join(', ')}` : '',
    '',
    `Totals: ${users.length} accounts, ${subs.filter((s) => s.status === 'active').length} active subs.`,
  ].filter((l) => l !== '').join('\n')

  await sendEmail(ALERT_EMAIL, { subject: 'Recon 6 CRM daily — ' + [report.welcome.length && `${report.welcome.length} welcome`, report.confirmNudge.length && `${report.confirmNudge.length} nudge`, report.winback.length && `${report.winback.length} winback`, report.orphans.length && `${report.orphans.length} ORPHAN`].filter(Boolean).join(', ') || 'quiet day', body: lines })

  console.log(JSON.stringify(report))
  return report
}
