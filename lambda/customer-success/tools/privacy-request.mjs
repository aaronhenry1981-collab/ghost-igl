#!/usr/bin/env node
// Data export and deletion requests (Privacy page: access, export, deletion).
// Operator tool, run with the operator's own AWS credentials. Nothing here is
// exposed through an API.
//
//   node tools/privacy-request.mjs export         <email> --out <dir>
//   node tools/privacy-request.mjs preview-delete <email> --out <dir>
//   node tools/privacy-request.mjs apply-delete   <email> --plan <planId> --confirm "DELETE ALL DATA FOR <email>"
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

const REGION = 'us-east-1'
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB'
const CONTACT_KEY_PARAM = process.env.CONTACT_KEY_SECRET_PARAM || '/recon/customer-success/contact-key-secret'

function arg(name) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : null
}

export async function collect(email, sources) {
  const typed = String(email).trim()
  const lower = typed.toLowerCase()
  // The pool is case-sensitive on email; legacy accounts may use capitals.
  const cognito = [...await sources.cognitoUser(lower), ...(typed !== lower ? await sources.cognitoUser(typed) : [])]
  const subs = [...new Set(cognito.map((u) => u.sub).filter(Boolean))]
  const rpids = subs.map((s) => reconPlayerIdFor(s))
  const perSub = async (fn) => (await Promise.all(subs.map(fn))).flat()
  const player = await Promise.all(rpids.map((r) => sources.playerData(r)))
  const records = {
    profile: await sources.profile(lower),
    subscriptions: await sources.subscriptions(lower),
    crmLog: await sources.crmLog(lower),
    referrals: await sources.referrals(lower),
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
  return { email: lower, cognito, records }
}

async function main() {
  const [mode, email] = process.argv.slice(2)
  if (!['export', 'preview-delete', 'apply-delete'].includes(mode) || !email || !email.includes('@')) {
    console.error('usage: privacy-request.mjs export|preview-delete|apply-delete <email> [--out <dir>] [--plan <id> --confirm "<phrase>"]')
    process.exit(2)
  }
  const secret = execFileSync('aws', ['ssm', 'get-parameter', '--name', CONTACT_KEY_PARAM, '--with-decryption', '--region', REGION, '--query', 'Parameter.Value', '--output', 'text'], { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim()
  configureContactKeySecret(secret)
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } })
  const cognito = new CognitoIdentityProviderClient({ region: REGION })
  const sources = createSources({ ddb, cognito, userPoolId: USER_POOL_ID })
  const collected = await collect(email, sources)
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
  const result = await applyDeletionPlan({ plan, ddb, cognito, userPoolId: USER_POOL_ID, actor: process.env.PRIVACY_ACTOR || 'privacy-tool' })
  console.log('deletion result:', JSON.stringify(result))
  console.log(`Remaining manual step: delete ${plan.stripeCustomers.length} Stripe customer(s) in the Stripe Dashboard if the request covers payment data.`)
}

// Run only when invoked directly (tests import collect() without running main).
if (String(process.argv[1] || '').split('\\').join('/').endsWith('/tools/privacy-request.mjs')) {
  main().catch((err) => { console.error(`error: ${err.message}`); process.exit(1) })
}
