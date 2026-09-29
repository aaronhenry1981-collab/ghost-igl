#!/usr/bin/env node
// Data export and deletion requests (Privacy page: access, export, deletion).
// Operator tool, run with the operator's own AWS credentials. Nothing here is
// exposed through an API.
//
//   node tools/privacy-request.mjs export         <email> --out <dir>
//   node tools/privacy-request.mjs preview-delete <email> --out <dir>
//   node tools/privacy-request.mjs apply-delete   <email> --plan <planId> --confirm "DELETE ALL DATA FOR <email>"
//   node tools/privacy-request.mjs pending
//
// --sub <cognito-sub> adds the sub of an account that no longer exists; subs
// recorded by the admin console's "Delete user" are found automatically.
// pending lists console deletions that still need the full purge.
//
// export and preview-delete only READ. apply-delete re-collects everything,
// rebuilds the plan and refuses unless the plan id matches the preview (so a
// stale preview can never run), there are no blockers (a live subscription
// or an admin account), and the typed confirmation is exact. Output files are
// named by a hash of the email and must stay outside the public repository.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { configureContactKeySecret, contactKeyFor, reconPlayerIdFor } from '../lib/ids.mjs'
import { createSources, reviewArchiveHash } from './privacy/sources.mjs'
import { buildDeletionPlan, buildExport } from './privacy/plan.mjs'
import { applyDeletionPlan } from './privacy/apply.mjs'
import { completionPlan, createRegister, daysLeft, exportStillOwed, manualRow } from './privacy/register.mjs'

const REGION = 'us-east-1'
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB'
const CONTACT_KEY_PARAM = process.env.CONTACT_KEY_SECRET_PARAM || '/recon/customer-success/contact-key-secret'

function arg(name) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : null
}

// extraSubs: Cognito subs of accounts that no longer exist (--sub, or found
// in the audit log of an admin-console deletion). Player data, Road to
// Champion and coaching history are keyed by the sub, not the email.
export async function collect(email, sources, { extraSubs = [] } = {}) {
  const typed = String(email).trim()
  const lower = typed.toLowerCase()
  // The pool is case-sensitive on email; legacy accounts may use capitals.
  const cognito = [...await sources.cognitoUser(lower), ...(typed !== lower ? await sources.cognitoUser(typed) : [])]
  const audited = sources.deletedAccountSubs ? await sources.deletedAccountSubs(lower) : []
  const subs = [...new Set([...cognito.map((u) => u.sub), ...audited, ...extraSubs].filter(Boolean))]
  const rpids = subs.map((s) => reconPlayerIdFor(s))
  const perSub = async (fn) => (await Promise.all(subs.map(fn))).flat()
  const player = await Promise.all(rpids.map((r) => sources.playerData(r)))
  const records = {
    profile: await sources.profile(lower),
    subscriptions: await sources.subscriptions(lower),
    crmLog: await sources.crmLog(lower),
    referrals: await sources.referrals(lower),
    referralRewards: sources.referralRewards ? await sources.referralRewards(lower) : [],
    climb: await perSub((s) => sources.climb(s)),
    coachingEvents: await perSub((s) => sources.coachingEvents(s)),
    bookings: await sources.bookings(lower),
    reviewArchive: await sources.reviewArchive(lower),
    customerSuccess: await sources.customerSuccess(contactKeyFor(lower)),
    playerStore: player.flatMap((p) => p.store),
    playerEvents: player.flatMap((p) => p.events),
    playerSnapshots: player.flatMap((p) => p.snapshots),
    playerIdentities: player.flatMap((p) => p.identities),
  }
  return { email: lower, cognito, subs, records }
}

// Admin-console deletions ("Delete user") that have not had the full privacy
// purge yet. The console removes the sign-in, profile and membership rows;
// the rest is removed by running preview-delete / apply-delete for each.
export function pendingPurges(auditItems) {
  const purged = new Map()
  for (const i of auditItems) {
    // Only a deletion whose removal was verified counts as the purge.
    if (i.action !== 'privacy.delete' || i.details?.verification?.verified !== true) continue
    const t = String(i.timestamp || '')
    if (t > (purged.get(i.target) || '')) purged.set(i.target, t)
  }
  return auditItems
    .filter((i) => i.action === 'user.delete' && String(i.target || '').includes('@'))
    .filter((i) => String(i.timestamp || '') > (purged.get(`email_hash:${reviewArchiveHash(i.target)}`) || ''))
    .map((i) => ({ email: i.target, deletedAt: i.timestamp, cognitoSub: i.details?.cognito_sub || null, review: auditItems.filter((r) => r.action === 'user.delete.review' && r.target === i.target).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0]?.details?.finding || null }))
    .sort((a, b) => String(a.deletedAt).localeCompare(String(b.deletedAt)))
}

// Record a finished export / VERIFIED deletion on this person's open requests
// (register.mjs completionPlan decides which parts and which closes).
async function recordCompletion(register, email, action, { verified = false, note } = {}) {
  const { updates, untouched } = completionPlan(await register.all(), email, action, { verified })
  for (const u of updates) {
    await register.complete(u, { note, actor: process.env.PRIVACY_ACTOR })
    console.log(`register: ${u.requestId} ${u.part} part recorded${u.close ? ', request CLOSED as completed' : ', request stays OPEN (other part not done)'}`)
  }
  for (const t of untouched) console.log(`register: ${t.requestId} (${t.kind}) left open: ${t.why}`)
  if (!updates.length && !untouched.length) console.log('register: no open request for this email (log one first if this was a request: privacy-request.mjs log)')
}

async function registerCommand(mode, register) {
  if (mode === 'requests') {
    const rows = (await register.all()).sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)))
    const open = rows.filter((r) => r.status === 'open')
    console.log(`open privacy requests: ${open.length}`)
    for (const r of open) {
      const d = daysLeft(r)
      console.log(`  ${r.request_id}  ${r.kind}  received ${r.received_at.slice(0, 10)}  due ${r.due_at.slice(0, 10)}  ${d < 0 ? `OVERDUE ${-d}d` : `${d}d left`}  ${r.email || '(address removed)'}  via ${r.source}`)
    }
    const closed = rows.filter((r) => r.status !== 'open').slice(-10)
    if (closed.length) console.log(`recently closed: ${closed.map((r) => `${r.request_id} ${r.outcome} ${String(r.closed_at).slice(0, 10)}`).join('; ')}`)
    return
  }
  if (mode === 'log') {
    const [, , , email] = process.argv
    if (!email || !email.includes('@')) throw new Error('usage: privacy-request.mjs log <email> --kind <deletion|export|access|unspecified> --received <ISO date> [--note "..."]')
    const row = await register.add(manualRow({ email, kind: arg('--kind'), receivedAt: arg('--received'), note: arg('--note') }))
    console.log(`logged ${row.request_id} (${row.kind}), due ${row.due_at.slice(0, 10)}`)
    return
  }
  if (mode === 'kind') {
    const [, , , requestId] = process.argv
    if (!requestId?.startsWith('PR-')) throw new Error('usage: privacy-request.mjs kind <PR-id> --kind <deletion|export|access|export+deletion>')
    await register.setKind(requestId, arg('--kind'))
    console.log(`${requestId} kind set to ${arg('--kind')}`)
    return
  }
  if (mode === 'close') {
    const [, , , requestId] = process.argv
    if (!requestId?.startsWith('PR-')) throw new Error('usage: privacy-request.mjs close <PR-id> --outcome <completed|rejected|not_a_request|test> --note "..."')
    await register.close(requestId, { outcome: arg('--outcome'), note: arg('--note'), actor: process.env.PRIVACY_ACTOR })
    console.log(`closed ${requestId} (${arg('--outcome')})`)
  }
}

async function main() {
  const [mode, email] = process.argv.slice(2)
  const registerModes = ['requests', 'log', 'kind', 'close']
  const noEmail = ['pending', 'requests', 'kind', 'close']
  if (![...registerModes, 'export', 'preview-delete', 'apply-delete', 'pending'].includes(mode) || (!noEmail.includes(mode) && (!email || !email.includes('@')))) {
    console.error([
      'usage: privacy-request.mjs export|preview-delete|apply-delete <email> [--sub <cognito-sub>] [--out <dir>] [--plan <id> --confirm "<phrase>"]',
      '       privacy-request.mjs requests                       open requests and their deadlines',
      '       privacy-request.mjs log <email> --kind <k> --received <ISO> [--note "..."]   a request that arrived another way',
      '       privacy-request.mjs kind <PR-id> --kind <deletion|export|access|export+deletion>   after reading an unspecified request',
      '       privacy-request.mjs close <PR-id> --outcome <completed|rejected|not_a_request|test> --note "..."',
      '       privacy-request.mjs pending                        console deletions still owed a full purge',
    ].join('\n'))
    process.exit(2)
  }
  if (registerModes.includes(mode)) {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } })
    return registerCommand(mode, createRegister(ddb))
  }
  const secret = execFileSync('aws', ['ssm', 'get-parameter', '--name', CONTACT_KEY_PARAM, '--with-decryption', '--region', REGION, '--query', 'Parameter.Value', '--output', 'text'], { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim()
  configureContactKeySecret(secret)
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } })
  const cognito = new CognitoIdentityProviderClient({ region: REGION })
  const sources = createSources({ ddb, cognito, userPoolId: USER_POOL_ID })
  if (mode === 'pending') {
    const pending = pendingPurges(await sources.deletionAudit())
    console.log(`admin-console deletions awaiting the full purge: ${pending.length}`)
    for (const p of pending) console.log(`  ${p.deletedAt}  ${p.email}  ${p.cognitoSub ? 'sub recorded' : 'sub NOT recorded (sub-keyed data cannot be located)'}${p.review ? `
      reviewed: ${p.review}` : ''}`)
    return
  }
  const extraSubs = process.argv.flatMap((a, i) => (a === '--sub' && process.argv[i + 1] ? [process.argv[i + 1]] : []))
  const collected = await collect(email, sources, { extraSubs })
  console.log(`cognito accounts: ${collected.cognito.length}, subs searched: ${collected.subs.length}`)
  const tag = `${new Date().toISOString().slice(0, 10)}-${reviewArchiveHash(collected.email).slice(0, 8)}`
  const out = arg('--out')

  if (mode === 'export') {
    if (!out) throw new Error('--out <dir> is required (outside the repository)')
    mkdirSync(out, { recursive: true })
    const bundle = buildExport({ email: collected.email, collected, generatedAt: new Date().toISOString() })
    const path = join(out, `${tag}-export.json`)
    writeFileSync(path, JSON.stringify(bundle, null, 2))
    console.log(`export written: ${path}`)
    console.log('counts:', JSON.stringify(bundle.counts), `cognito accounts: ${collected.cognito.length}`)
    await recordCompletion(createRegister(ddb), collected.email, 'export', { note: `export ${tag} (send it to the verified email, then delete the local copy)` })
    return
  }

  const plan = buildDeletionPlan({ email: collected.email, collected })
  if (mode === 'preview-delete') {
    if (out) {
      mkdirSync(out, { recursive: true })
      writeFileSync(join(out, `${tag}-delete-plan.json`), JSON.stringify(plan, null, 2))
    }
    console.log(`planId: ${plan.planId}`)
    console.log('would change:', JSON.stringify(plan.counts))
    console.log(`Stripe customers to delete by hand in the Stripe Dashboard: ${plan.stripeCustomers.length}`)
    console.log(plan.blockers.length ? `BLOCKED: ${plan.blockers.join('; ')}` : 'blockers: none')
    console.log(`to apply: --plan ${plan.planId} --confirm "${plan.confirmPhrase}"`)
    return
  }

  // apply-delete
  if (arg('--plan') !== plan.planId) throw new Error(`plan id mismatch: the data changed since that preview (current plan ${plan.planId}); preview again`)
  if (arg('--confirm') !== plan.confirmPhrase) throw new Error(`confirmation must be exactly: ${plan.confirmPhrase}`)
  const owedExport = exportStillOwed(await createRegister(ddb).all(), collected.email)
  if (owedExport.length) throw new Error(`${owedExport.map((r) => r.request_id).join(', ')} asks for a copy AND deletion: run export first (deleting first would make the export impossible)`)
  const result = await applyDeletionPlan({ plan, ddb, cognito, userPoolId: USER_POOL_ID, actor: process.env.PRIVACY_ACTOR || 'privacy-tool' })
  const { verification, ...counts } = result
  console.log('deletion result:', JSON.stringify(counts))
  console.log(`verification: ${verification.verified ? `all ${verification.checked} targeted records confirmed removed` : `${verification.remaining.length} of ${verification.checked} NOT removed: ${JSON.stringify(verification.remaining)}`}`)
  console.log(`Remaining manual step: delete ${plan.stripeCustomers.length} Stripe customer(s) in the Stripe Dashboard if the request covers payment data.`)
  if (!verification.verified) console.log('register: deletion NOT recorded (not verified); fix what remains and run preview-delete / apply-delete again')
  else await recordCompletion(createRegister(ddb), collected.email, 'delete', { verified: true, note: `apply-delete plan ${plan.planId}, ${verification.checked} records verified removed` })
}

// Run only when invoked directly (tests import collect() without running main).
if (String(process.argv[1] || '').split('\\').join('/').endsWith('/tools/privacy-request.mjs')) {
  main().catch((err) => { console.error(`error: ${err.message}`); process.exit(1) })
}
