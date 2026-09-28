import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateProactive, RULES } from './proactive.mjs'
import { buildSupportWorld, supportCtx, FIXED_NOW } from './fixtures.mjs'
import { contactKeyFor } from '../lib/ids.mjs'
import { isoWeek } from './diagnostics/shared.mjs'

async function contactsFor(world, keys) {
  const ctx = supportCtx(world)
  const out = []
  for (const key of keys) {
    const s = world.scenarios[key]
    const r = await ctx.factsFor({ email: s.email, sub: s.sub }, { withCognito: true })
    out.push({ contactKey: contactKeyFor(s.email), one: r.one, facts: r.facts, lifecycle: r.lifecycle, signals: {}, key })
  }
  return out
}

const ALL = ['new', 'free_activated', 'paying_active', 'paying_locked_out', 'paying_renewal_stale', 'at_risk', 'payment_failed', 'churned', 'dormant_free', 'unconfirmed']

test('exactly the five §12 rules, each backed by recorded data', () => {
  assert.deepEqual(RULES.map((r) => r.id), ['paid_past_due_or_unbound', 'coaching_purchase_no_credits', 'onboarding_stalled_paid', 'vod_usage_without_review', 'provider_global_failure'])
  for (const r of RULES) assert.ok(r.dataSources.length > 0 && r.summary)
})

test('rules fire on the right fixture players and nowhere else', async () => {
  const world = buildSupportWorld()
  const contacts = await contactsFor(world, ALL)
  const findings = evaluateProactive({ contacts, now: FIXED_NOW, providerHealth: world.providerHealth })
  const keyOf = (ck) => contacts.find((c) => c.contactKey === ck)?.key || ck
  const got = findings.map((f) => `${f.ruleId}:${keyOf(f.contactKey)}`).sort()
  assert.deepEqual(got, [
    'coaching_purchase_no_credits:at_risk',
    'onboarding_stalled_paid:paying_locked_out',
    'paid_past_due_or_unbound:paying_locked_out',
    'paid_past_due_or_unbound:paying_renewal_stale',
    'paid_past_due_or_unbound:payment_failed',
    'provider_global_failure:global:psn',
    'vod_usage_without_review:paying_active',
  ])
  const week = isoWeek(FIXED_NOW)
  for (const f of findings) {
    assert.equal(f.dedupeKey, `${f.ruleId}#${f.contactKey}#${week}`)
    assert.ok(f.category && f.severity && f.summary)
    assert.ok(f.evidence.length > 0 && f.evidence.every((e) => e.kind === 'fact' && e.source))
  }
  const pastDue = findings.find((f) => f.ruleId === 'paid_past_due_or_unbound' && keyOf(f.contactKey) === 'payment_failed')
  assert.equal(pastDue.category, 'billing_question')
  const incident = findings.find((f) => f.ruleId === 'provider_global_failure')
  assert.equal(incident.kind, 'incident_suggestion')
  assert.equal(incident.service, 'identity_psn')
  const vod = findings.find((f) => f.ruleId === 'vod_usage_without_review')
  assert.equal(vod.inference.kind, 'inference')
  assert.ok(vod.evidence.some((e) => e.value === 'not recorded'))
})

test('dedupe: markers from an earlier run (with or without PRO# prefix) suppress findings', async () => {
  const world = buildSupportWorld()
  const contacts = await contactsFor(world, ALL)
  const first = evaluateProactive({ contacts, now: FIXED_NOW, providerHealth: world.providerHealth })
  assert.ok(first.length > 0)
  const markers = new Set(first.map((f) => f.dedupeKey))
  assert.deepEqual(evaluateProactive({ contacts, now: FIXED_NOW, existingMarkers: markers, providerHealth: world.providerHealth }), [])
  const prefixed = new Set(first.map((f) => `PRO#${f.dedupeKey}`))
  assert.deepEqual(evaluateProactive({ contacts, now: FIXED_NOW, existingMarkers: prefixed, providerHealth: world.providerHealth }), [])
  // A new ISO week produces fresh keys.
  const nextWeek = evaluateProactive({ contacts, now: FIXED_NOW + 7 * 86400000, existingMarkers: markers, providerHealth: world.providerHealth })
  assert.ok(nextWeek.length > 0)
  // Duplicate contacts in one run collapse to one finding.
  const doubled = evaluateProactive({ contacts: [...contacts, ...contacts], now: FIXED_NOW })
  assert.equal(new Set(doubled.map((f) => f.dedupeKey)).size, doubled.length)
})

test('unknown is not "none": unreadable sources produce no findings', async () => {
  const world = buildSupportWorld()
  const ctx = supportCtx(world, { failures: { subscriptions: true, bookings: true, player: true } })
  const contacts = []
  for (const key of ['payment_failed', 'at_risk', 'paying_active']) {
    const s = world.scenarios[key]
    const r = await ctx.factsFor({ email: s.email, sub: s.sub }, { withCognito: true })
    contacts.push({ contactKey: contactKeyFor(s.email), one: r.one, facts: r.facts, lifecycle: r.lifecycle })
  }
  assert.deepEqual(evaluateProactive({ contacts, now: FIXED_NOW }), [])
})

test('coaching rule clears once a credits row exists; single paid sessions never trigger it', async () => {
  const world = buildSupportWorld()
  world.bookings.push({ slotId: 'credits#fading.roamer@example.test', credits: 2 })
  world.bookings.push({ slotId: '2026-10-01T20:00:00.000Z', status: 'completed', customer: { email: 'quiet.anchor@example.test' }, coachingType: 'single', payment: { status: 'paid' } })
  const contacts = await contactsFor(world, ['at_risk', 'free_activated'])
  assert.ok(!evaluateProactive({ contacts, now: FIXED_NOW }).some((f) => f.ruleId === 'coaching_purchase_no_credits'))
  world.bookings.push({ slotId: '2026-10-02T20:00:00.000Z', status: 'confirmed', customer: { email: 'quiet.anchor@example.test' }, coachingType: 'package', payment: { status: 'paid' } })
  const again = await contactsFor(world, ['free_activated'])
  assert.ok(evaluateProactive({ contacts: again, now: FIXED_NOW }).some((f) => f.ruleId === 'coaching_purchase_no_credits'))
})

test('no player contact: findings are only case/incident suggestions', async () => {
  const world = buildSupportWorld()
  const findings = evaluateProactive({ contacts: await contactsFor(world, ALL), now: FIXED_NOW, providerHealth: world.providerHealth })
  for (const f of findings) {
    assert.ok(!('message' in f) && !('email' in f) && !('send' in f))
    assert.ok(!JSON.stringify(f).includes('@example.test'), 'no emails in findings')
  }
})

test('service-shaped entries (facts only, with email) still evaluate, without guessing', async () => {
  const world = buildSupportWorld()
  const full = await contactsFor(world, ALL)
  const entries = full.map(({ contactKey, facts, lifecycle }) => ({ contactKey, email: facts.identity.email, facts, lifecycle }))
  const findings = evaluateProactive({ entries, now: FIXED_NOW, providerHealth: world.providerHealth })
  const keyOf = (ck) => full.find((c) => c.contactKey === ck)?.key || ck
  const got = findings.map((f) => `${f.ruleId}:${keyOf(f.contactKey)}`).sort()
  // Identity binding needs raw rows, so only past_due survives for rule 1.
  assert.deepEqual(got, [
    'coaching_purchase_no_credits:at_risk',
    'onboarding_stalled_paid:paying_locked_out',
    'paid_past_due_or_unbound:payment_failed',
    'provider_global_failure:global:psn',
    'vod_usage_without_review:paying_active',
  ])
  for (const f of findings) {
    assert.ok(['player', 'global'].includes(f.scope))
    assert.match(f.window, /^\d{4}-W\d{2}$/)
    assert.ok(f.subject && f.description.includes(f.subject))
    if (f.scope === 'player') assert.match(f.email, /@example\.test$/)
    else assert.equal(f.email, undefined)
  }
})
