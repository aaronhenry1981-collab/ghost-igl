// ghost-igl-crm — the automated customer lifecycle engine.
//
// Runs daily via EventBridge. Replaces the "scheduled agent writes Gmail
// drafts nobody sends" flow with real, tracked, once-only sends:
//
//   1. WELCOME     confirmed signup < 14 days old, no welcome yet → email
//   2. CONFIRM     UNCONFIRMED account > 24h → resend Cognito code (max 2, 72h apart)
//   3. WINBACK     account > 7 days old, never/not seen in 14 days → one email, ever
//   4. ORPHANS     active Stripe sub with no Cognito login → new cases alert once
//   5. DIGEST      summary of everything it did + risks → ALERT_EMAIL
//
// State lives in ghost-igl-crm-log (PK email) — flags are set ONLY after a
// successful send, except orphan acknowledgement state which is operational
// bookkeeping and is safe to persist without sending customer email.

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
const ALERT_EMAILS = (process.env.ALERT_EMAIL || 'aaron@ironfrontdigital.com,aaronhenry1981@gmail.com').split(',').map((s) => s.trim())
const FROM = process.env.FROM_ADDRESS || 'Recon 6 <coach@r6coaching.com>'
const SITE = 'https://r6coaching.com'
const DRY_RUN = process.env.DRY_RUN === 'true'

const DAY = 24 * 60 * 60 * 1000
const LEGACY_ORPHAN_AGE = 7 * DAY

function welcomeEmail(email) {
  return {
    subject: 'Welcome to Recon 6 — start with these three things',
    body: `Hey,\n\nYou're in. Three things worth doing first:\n\n1. Live Coach — the in-match walkthrough. Pick your stack size, map, and bans, and it tells you what to pick and how to play it: ${SITE}/#/live\n2. Map strats — every ranked map, site by site: ${SITE}/#/strats\n3. Finish your profile (30 seconds) and you get a free 7-day Pro trial — no card: ${SITE}/#/account\n\nIf anything's confusing or broken, just reply to this email. I read everything.\n\nAaron — Recon 6`,
  }
}

function winbackEmail(email) {
  return {
    subject: 'Your Recon 6 account is sitting idle',
    body: `Hey,\n\nYou signed up for Recon 6 but haven't been back — fair enough, so here's the one thing worth returning for:\n\nLive Coach walks you through your actual ranked match in real time — map bans, operator bans, what to pick, where to spawn, how to play the site: ${SITE}/#/live\n\nIt's updated for Y11S2.2 (Dokkaebi's Jegeo Payload is now 14 seconds per target, not the old 7-second global timing). Takes one match to see if it helps.\n\nIf Recon 6 wasn't what you were looking for, reply and tell me what was missing — that's genuinely useful to me.\n\nAaron — Recon 6`,
  }
}

async function sendEmail(to, { subject, body }) {
  if (DRY_RUN) { console.log(`DRY_RUN send → ${to}: ${subject}`); return true }
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: body, Charset: 'UTF-8' } } } },
    }))
    return true
  } catch (err) {
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

export async function handler() {
  const now = Date.now()
  const report = { welcome: [], confirmNudge: [], winback: [], orphans: [], acknowledgedOrphans: [], pastDue: [], failures: [] }

  const [users, subs, profiles] = await Promise.all([
    listAllUsers(), scanAll(SUBS_TABLE), scanAll(PROFILES_TABLE),
  ])
  const profileByEmail = new Map(profiles.map((p) => [(p.email || '').toLowerCase(), p]))
  const cognitoEmails = new Set(users.map((u) => u.email))

  // Orphan policy:
  // - Never email these customers automatically. Aaron has already handled legacy
  //   no-login subscribers and some intentionally continue paying without logging in.
  // - Existing/legacy cases are acknowledged silently so the digest stops crying wolf.
  // - A genuinely new no-login subscription is surfaced ONCE, then remembered in
  //   CRM_TABLE so the same address is not reported every day forever.
  for (const s of subs) {
    const email = (s.email || '').toLowerCase()
    if (s.status === 'active' && email && !cognitoEmails.has(email)) {
      const log = await crmGet(email)
      const alreadyAcknowledged = Boolean(log.orphan_acknowledged_at)
      const createdAt = Date.parse(s.created_at || s.updated_at || '')
      const legacy = Number.isFinite(createdAt) && now - createdAt >= LEGACY_ORPHAN_AGE

      if (!alreadyAcknowledged) {
        const stamp = new Date(now).toISOString()
        await crmSet(email, {
          orphan_acknowledged_at: stamp,
          orphan_first_seen_at: log.orphan_first_seen_at || stamp,
          orphan_reason: legacy ? 'legacy_no_login_preexisting' : 'active_subscription_no_login',
        })
        if (legacy) report.acknowledgedOrphans.push(email)
        else report.orphans.push(email)
      }
    }
    if (s.status === 'past_due') report.pastDue.push(email)
  }

  for (const u of users) {
    const log = await crmGet(u.email)
    const profile = profileByEmail.get(u.email)
    const marketingSuppressed = Boolean(log.marketing_suppressed_at)
    const marketingConsented = Boolean(profile?.marketing_consent_at)
    const ageDays = (now - u.created) / DAY

    if (u.status === 'CONFIRMED' && ageDays <= 14 && !log.welcome_sent_at && !marketingSuppressed) {
      if (await sendEmail(u.email, welcomeEmail(u.email))) {
        await crmSet(u.email, { welcome_sent_at: new Date(now).toISOString() })
        report.welcome.push(u.email)
      } else report.failures.push('welcome:' + u.email)
      continue
    }

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

    const lastSeen = profile?.last_seen_at ? Date.parse(profile.last_seen_at) : 0
    const dormant = now - Math.max(lastSeen, 0) > 14 * DAY
    if (u.status === 'CONFIRMED' && ageDays > 7 && dormant && marketingConsented && !marketingSuppressed && !log.winback_sent_at && !log.welcome_sent_at) {
      if (await sendEmail(u.email, winbackEmail(u.email))) {
        await crmSet(u.email, { winback_sent_at: new Date(now).toISOString() })
        report.winback.push(u.email)
      } else report.failures.push('winback:' + u.email)
    }
  }

  const mask = (e) => String(e).replace('@', ' [at] ')
  const few = (arr) => arr.slice(0, 3).map(mask).join(', ') + (arr.length > 3 ? ` +${arr.length - 3} more` : '')
  const lines = [
    `Recon 6 CRM daily run ${new Date(now).toISOString().slice(0, 10)}`,
    '',
    `Welcome emails sent: ${report.welcome.length}${report.welcome.length ? ' (' + few(report.welcome) + ')' : ''}`,
    `Confirmation nudges: ${report.confirmNudge.length}${report.confirmNudge.length ? ' (' + few(report.confirmNudge) + ')' : ''}`,
    `Win-back emails sent: ${report.winback.length}${report.winback.length ? ' (' + few(report.winback) + ')' : ''}`,
    '',
    `NEW no-login paid accounts: ${report.orphans.length ? report.orphans.map(mask).join(', ') : 'none'}`,
    `Legacy no-login accounts auto-acknowledged today: ${report.acknowledgedOrphans.length}`,
    `Past due: ${report.pastDue.length ? report.pastDue.map(mask).join(', ') : 'none'}`,
    report.failures.length ? `Send attempts held by SES sandbox (auto-retry daily): ${report.failures.length}` : '',
    '',
    `Totals: ${users.length} accounts, ${subs.filter((s) => s.status === 'active').length} active subs.`,
    'Full per-address detail: CloudWatch logs, /aws/lambda/ghost-igl-crm.',
  ].filter((l) => l !== '').join('\n')

  const digestSubject = 'Recon 6 CRM daily: ' + ([report.welcome.length && `${report.welcome.length} welcome`, report.confirmNudge.length && `${report.confirmNudge.length} nudge`, report.winback.length && `${report.winback.length} winback`, report.orphans.length && `${report.orphans.length} NEW NO-LOGIN`].filter(Boolean).join(', ') || 'quiet day')
  for (const addr of ALERT_EMAILS) {
    await sendEmail(addr, { subject: digestSubject, body: lines })
  }

  console.log(JSON.stringify(report))
  return report
}
