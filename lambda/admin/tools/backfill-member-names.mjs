#!/usr/bin/env node
// Backfill member first/last names from reliable linked data (member-names.mjs
// decideName): Cognito given_name/family_name, Cognito `name`, and the Stripe
// customer name. Operator tool; run with your own AWS credentials.
//
//   node tools/backfill-member-names.mjs [--apply] [--report <dir>]
//
// Default is a PREVIEW (reads only). --apply writes, and is repeatable:
//   - existing names are never changed (conditional write: only when the
//     profile has neither first_name nor last_name);
//   - an ambiguous or conflicting name is stored as name_review for a person
//     to decide, never split by guesswork;
//   - nothing is derived from email addresses or gamer display names;
//   - accounts removed in the admin console (audit user.delete) are never
//     written, and no profile row is created for a historical Stripe-only
//     customer (no site account, no live subscription).
// Stripe is read only if STRIPE_READONLY_KEY is set (GET /v1/customers/:id).
// The report (per-email decisions, including names) is written to --report,
// which must be outside the public repository; the console shows counts only.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { decideName } from '../member-names.mjs'

const REGION = 'us-east-1'
const POOL = process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB'
const apply = process.argv.includes('--apply')
const reportDir = (() => { const i = process.argv.indexOf('--report'); return i > -1 ? process.argv[i + 1] : null })()
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const cognito = new CognitoIdentityProviderClient({ region: REGION })

async function scanAll(TableName) {
  const items = []
  let ExclusiveStartKey
  do {
    const r = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey }))
    items.push(...(r.Items || []))
    ExclusiveStartKey = r.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return items
}

async function cognitoUsers() {
  const users = []
  let PaginationToken
  do {
    const r = await cognito.send(new ListUsersCommand({ UserPoolId: POOL, PaginationToken }))
    users.push(...(r.Users || []))
    PaginationToken = r.PaginationToken
  } while (PaginationToken)
  return users.map((u) => Object.fromEntries((u.Attributes || []).map((a) => [a.Name, a.Value])))
}

async function stripeCustomerName(id) {
  const key = process.env.STRIPE_READONLY_KEY
  if (!key || !id || !id.startsWith('cus_')) return null
  const res = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` } })
  if (!res.ok) return null
  const c = await res.json()
  return c.deleted ? null : (c.name || null)
}

async function main() {
  const [profiles, users, subs, auditRows] = await Promise.all([scanAll('ghost-igl-profiles'), cognitoUsers(), scanAll('ghost-igl-subscriptions'), scanAll('ghost-igl-audit-log')])
  const removed = new Set(auditRows.filter((a) => a.action === 'user.delete').map((a) => String(a.target || '').toLowerCase()))
  const LIVE = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])
  const hasAccount = new Set(users.map((u) => String(u.email || '').toLowerCase()).filter(Boolean))
  const hasLiveSub = new Set(subs.filter((s) => LIVE.has(String(s.status || '').toLowerCase())).map((s) => String(s.email || '').toLowerCase()))
  const profileByEmail = new Map(profiles.map((p) => [String(p.email || '').toLowerCase(), p]))
  const emails = new Set()
  const sources = new Map()
  const add = (email, src) => { if (!email) return; emails.add(email); if (!sources.has(email)) sources.set(email, []); sources.get(email).push(src) }
  for (const u of users) {
    const email = String(u.email || '').toLowerCase()
    if (!email) continue
    emails.add(email)
    if (u.given_name || u.family_name) add(email, { source: 'cognito', given: u.given_name || '', family: u.family_name || '' })
    if (u.name) add(email, { source: 'cognito', full: u.name })
  }
  const stripeRead = Boolean(process.env.STRIPE_READONLY_KEY)
  for (const s of subs) {
    const email = String(s.email || '').toLowerCase()
    if (!email) continue
    emails.add(email)
    if (stripeRead) {
      const name = await stripeCustomerName(s.stripe_customer_id)
      if (name) add(email, { source: 'stripe', full: name })
    }
  }

  const counts = { members: emails.size, keep: 0, set: 0, review: 0, missing: 0, excludedRemoved: 0, excludedNoAccount: 0, written: 0, skippedChanged: 0 }
  const report = []
  for (const email of [...emails].sort()) {
    if (removed.has(email)) { counts.excludedRemoved += 1; report.push({ email, action: 'excluded', why: 'account removed in the admin console; records left untouched' }); continue }
    if (!hasAccount.has(email) && !profileByEmail.has(email) && !hasLiveSub.has(email)) { counts.excludedNoAccount += 1; report.push({ email, action: 'excluded', why: 'historical Stripe-only customer: no site account or live subscription, so no profile is created' }); continue }
    const d = decideName(profileByEmail.get(email), sources.get(email) || [])
    counts[d.action] += 1
    report.push({ email, ...d })
    if (!apply || (d.action !== 'set' && d.action !== 'review')) continue
    const now = new Date().toISOString()
    const set = ['updated_at = :now', 'created_at = if_not_exists(created_at, :now)']
    const values = { ':now': now }
    let remove = ''
    if (d.action === 'set') {
      set.push('name_source = :src', 'name_updated_at = :now', 'name_updated_by = :by')
      Object.assign(values, { ':src': d.source, ':by': 'name-backfill' })
      if (d.first) { set.push('first_name = :first'); values[':first'] = d.first }
      if (d.last) { set.push('last_name = :last'); values[':last'] = d.last }
      remove = ' REMOVE name_review'
    } else {
      set.push('name_review = :review')
      values[':review'] = JSON.stringify(d.candidates)
    }
    try {
      await ddb.send(new UpdateCommand({
        TableName: 'ghost-igl-profiles', Key: { email },
        UpdateExpression: `SET ${set.join(', ')}${remove}`,
        ConditionExpression: 'attribute_not_exists(first_name) AND attribute_not_exists(last_name)',
        ExpressionAttributeValues: values,
      }))
      counts.written += 1
    } catch (err) {
      if (err?.name === 'ConditionalCheckFailedException') counts.skippedChanged += 1
      else throw err
    }
  }

  console.log(`${apply ? 'APPLIED' : 'PREVIEW (nothing written)'} · Stripe names ${stripeRead ? 'read' : 'NOT read (no STRIPE_READONLY_KEY)'}`)
  console.log(JSON.stringify(counts))
  if (reportDir) {
    mkdirSync(reportDir, { recursive: true })
    const path = join(reportDir, `member-names-${apply ? 'applied' : 'preview'}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`)
    writeFileSync(path, JSON.stringify({ counts, report }, null, 2))
    console.log(`report: ${path}`)
  }
}

main().catch((err) => { console.error(`error: ${err.message}`); process.exit(1) })
