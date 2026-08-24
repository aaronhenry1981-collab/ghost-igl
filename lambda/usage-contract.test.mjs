import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const vod = await readFile(new URL('./vod/index.mjs', import.meta.url), 'utf8')
const webhook = await readFile(new URL('./webhook/index.mjs', import.meta.url), 'utf8')
const subscription = await readFile(new URL('./subscription/index.mjs', import.meta.url), 'utf8')

test('monthly and prepaid usage are hard-capped before a paid model call', () => {
  const handlerStart = vod.indexOf('export async function handler')
  const reserve = vod.indexOf('await reservePurchasedUsage(email)', handlerStart)
  const model = vod.indexOf('await callBedrock(', handlerStart)
  assert.ok(reserve > handlerStart && reserve < model, 'prepaid usage must be reserved before Bedrock')
  assert.match(vod, /ConditionExpression: 'attribute_exists\(ai_usage_credits\) AND ai_usage_credits >= :cost'/)
  assert.match(vod, /ConditionExpression: 'attribute_not_exists\(vod_sessions_used\) OR vod_sessions_used < :limit'/)
  assert.match(vod, /blocking paid model call/)
})

test('a model invocation consumes reserved usage even when downstream parsing fails', () => {
  assert.doesNotMatch(vod, /await refundReservedSession\(activeSub, isTrial\)/)
  assert.doesNotMatch(vod, /await refundPurchasedUsage\(email\)/)
  assert.match(vod, /Usage is intentionally not refunded after model invocation starts/)
})

test('a prepaid pack is a one-time Checkout and grants credits idempotently', () => {
  assert.match(subscription, /mode: 'payment'/)
  assert.match(subscription, /'metadata\[kind\]': 'ai_usage_pack'/)
  assert.match(webhook, /new TransactWriteCommand/)
  assert.match(webhook, /ConditionExpression: 'attribute_not_exists\(stripe_customer_id\)'/)
  assert.match(webhook, /ai_usage_credits = if_not_exists\(ai_usage_credits, :zero\) \+ :credits/)
  assert.doesNotMatch(subscription, /usage_type|metered|automatic_overage/i)
})

test('the four paid-tier limits remain intentionally bounded', () => {
  assert.match(vod, /VOD_PRO_LIMIT = parseInt\(process\.env\.VOD_PRO_LIMIT \|\| '20'/)
  assert.match(vod, /VOD_ELITE_LIMIT = parseInt\(process\.env\.VOD_ELITE_LIMIT \|\| '60'/)
  assert.match(vod, /VOD_CHAMPION_LIMIT = parseInt\(process\.env\.VOD_CHAMPION_LIMIT \|\| '75'/)
  assert.match(vod, /VOD_PURCHASED_CREDIT_COST = parseInt\(process\.env\.VOD_PURCHASED_CREDIT_COST \|\| '5'/)
})
