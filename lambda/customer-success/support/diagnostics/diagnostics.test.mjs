import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDiagnostics, PROVIDERS } from './index.mjs'
import { accountProvider } from './account.mjs'
import { usageProvider } from './usage.mjs'
import { onboardingProvider } from './onboarding.mjs'
import { desktopProvider } from './desktop.mjs'
import { replayProvider } from './replay.mjs'
import { incidentsProvider } from './incidents.mjs'
import { previousCasesProvider } from './previousCases.mjs'
import { findSecrets, SECRET_PATTERNS } from './shared.mjs'
import { buildFacts } from '../../domain/facts.mjs'
import { buildSupportWorld, supportCtx, playerIdentity, FIXED_NOW } from '../fixtures.mjs'
// Fake secret prefixes are assembled at runtime so secret scanners never see a
// key-shaped literal in the source; the values under test are unchanged.
const SK_LIVE = ['sk', 'live', ''].join('_')
const RK_LIVE = ['rk', 'live', ''].join('_')
const WHSEC = ['whsec', ''].join('_')
const AKIA = ['AK', 'IA'].join('')


const STATUSES = new Set(['ok', 'degraded', 'unavailable', 'not_connected', 'not_recorded', 'not_available'])

async function diag(key, opts = {}) {
  const world = opts.world || buildSupportWorld()
  const ctx = supportCtx(world, { failures: opts.failures || {} })
  return buildDiagnostics({ ctx, identity: playerIdentity(world, key), now: FIXED_NOW, view: opts.view || 'staff', roles: opts.roles || ['agent'], incidents: 'incidents' in opts ? opts.incidents : [], cases: 'cases' in opts ? opts.cases : [], category: opts.category || null })
}

const panelOf = (d, id) => d.panels.find((p) => p.id === id)
const factOf = (p, label) => p.facts.find((f) => f.label === label)

test('staff view returns every provider panel in the documented shape', async () => {
  const d = await diag('paying_active')
  assert.deepEqual(d.panels.map((p) => p.id), PROVIDERS.map((p) => p.id))
  for (const p of d.panels) {
    assert.ok(STATUSES.has(p.status), `${p.id} status ${p.status}`)
    assert.ok(Array.isArray(p.facts) && Array.isArray(p.inferences))
    assert.ok(Array.isArray(p.actions.user) && Array.isArray(p.actions.recon))
    for (const f of p.facts) assert.deepEqual(Object.keys(f).sort(), ['at', 'label', 'source', 'value'])
    for (const i of p.inferences) assert.deepEqual(Object.keys(i).sort(), ['basis', 'confidence', 'label', 'value'])
  }
  assert.equal(d.observedAt, new Date(FIXED_NOW).toISOString())
  assert.equal(d.signals.entitlementKnown, true)
  assert.equal(d.signals.plan, 'elite')
  assert.deepEqual(d.signals.linkedPlatforms, ['ubisoft'])
})

test('player view: safe panels only, no inferences, no Recon actions, no table names or ids', async () => {
  const d = await diag('payment_failed', { view: 'player', roles: ['admin'] })
  assert.deepEqual(d.panels.map((p) => p.id), ['account', 'entitlement', 'connections', 'vod', 'replay', 'coaching', 'desktop'])
  for (const p of d.panels) {
    assert.equal(p.inferences.length, 0, `${p.id} inferences`)
    assert.equal(p.actions.recon.length, 0, `${p.id} recon actions`)
    for (const f of p.facts) assert.ok(!/ghost-igl|recon-|cognito|resolveBilling|dynamo/i.test(f.source), `${p.id}: ${f.source}`)
  }
  const json = JSON.stringify(d)
  assert.ok(!/cus_|sub_FIX|snap-|RP-|cognito_sub|mismatch/i.test(json), 'no identifiers or rule ids for players')
  assert.equal(d.context, undefined)
  assert.equal(factOf(panelOf(d, 'entitlement'), 'Access').value, 'Paused: the last payment did not go through')
  assert.ok(panelOf(d, 'entitlement').actions.user.length > 0)
  assert.equal(d.signals.mismatchRules, undefined)
  assert.equal(d.signals.plan, 'free')
})

test('role filtering: billing identifiers masked for agents, full for billing/lead/admin', async () => {
  const agent = JSON.stringify(await diag('paying_active', { roles: ['agent'] }))
  assert.ok(agent.includes('cus_…003A'))
  assert.ok(!agent.includes('cus_FIXTURE0003A'))
  assert.ok(!agent.includes('sub_FIXTUREVEX0003'))
  for (const role of [['billing'], ['support-lead'], ['admins']]) {
    const json = JSON.stringify(await diag('paying_active', { roles: role }))
    assert.ok(json.includes('cus_FIXTURE0003A'), `${role} sees full customer id`)
    assert.ok(json.includes('sub_FIXTUREVEX0003'), `${role} sees full subscription id`)
  }
  const engineering = JSON.stringify(await diag('paying_active', { roles: ['engineering'] }))
  assert.ok(!engineering.includes('cus_FIXTURE0003A'), 'engineering is not billing')
})

test('role filtering: request/record ids only for engineering/lead/admin', async () => {
  const agent = JSON.stringify(await diag('paying_active', { roles: ['agent'] }))
  const billing = JSON.stringify(await diag('paying_active', { roles: ['billing'] }))
  for (const json of [agent, billing]) {
    assert.ok(!json.includes('snap-vex-ubi-2'), 'no snapshot ids')
    assert.ok(!json.includes('snapshotId'), 'context stripped of ids')
  }
  for (const role of [['engineering'], ['lead'], ['admin']]) {
    const json = JSON.stringify(await diag('paying_active', { roles: role }))
    assert.ok(json.includes('snap-vex-ubi-2'), `${role} sees snapshot id`)
  }
})

test('no secrets or credentials ever reach the output (poisoned sources)', async () => {
  const world = buildSupportWorld()
  const vex = world.scenarios.paying_active
  const profile = world.profiles.find((p) => p.email === vex.email)
  Object.assign(profile, { api_token: `${SK_LIVE}FAKEFIXTURE1234567890`, notes: 'password: hunter2hunter2', display_name: 'VerticalVex' })
  const row = world.subscriptions.find((r) => r.email === vex.email)
  Object.assign(row, { webhook_secret: `${WHSEC}FAKEFIXTURE123456`, price_id: row.price_id })
  world.playerSnapshots[0].fields.session_cookie = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmaXh0dXJlIn0.c2lnbmF0dXJlZml4dHVyZQ'
  world.playerEvents.push({ recon_player_id: vex.reconPlayerId, event_key: 'x#1', event_type: 'vod_reviewed', occurred_at: new Date(FIXED_NOW - 3600000).toISOString(), data: { detected_map: `${AKIA}ABCDEFGHIJKLMNOP` } })
  const incidents = [{ incidentId: 'inc-1', title: `leaked ${SK_LIVE}FAKEFIXTURE0987654321 in logs`, service: 'trn', status: 'investigating', severity: 'sev3' }]
  const cases = [{ caseId: 'c-1', caseNumber: 'R6-000001', category: 'bug', status: 'resolved', createdAt: '2026-10-01T00:00:00Z', rootCause: 'Bearer abcdefghijklmnopqrstuvwxyz0123' }]
  for (const view of ['staff', 'player']) {
    for (const roles of [['admin'], ['agent'], ['billing'], ['engineering']]) {
      const d = await diag('paying_active', { world, view, roles, incidents, cases })
      const json = JSON.stringify(d)
      assert.deepEqual(findSecrets(json), [], `${view}/${roles}: ${findSecrets(json)}`)
      for (const p of SECRET_PATTERNS) assert.ok(!p.re.test(json), `${view}/${roles} leaked ${p.id}`)
      assert.ok(!/hunter2|api_token|webhook_secret|session_cookie/.test(json))
    }
  }
})

test('each provider fails independently', async () => {
  const noHistory = await diag('paying_active', { failures: { playerSnapshots: true, playerIdentities: true } })
  assert.equal(panelOf(noHistory, 'connections').status, 'unavailable')
  assert.equal(panelOf(noHistory, 'entitlement').status, 'ok')
  assert.equal(panelOf(noHistory, 'account').status, 'ok')

  const noBilling = await diag('paying_active', { failures: { subscriptions: true } })
  assert.equal(panelOf(noBilling, 'entitlement').status, 'unavailable')
  assert.equal(panelOf(noBilling, 'vod').status, 'unavailable')
  assert.equal(panelOf(noBilling, 'account').status, 'ok')
  assert.notEqual(panelOf(noBilling, 'connections').status, 'unavailable')

  const noBookings = await diag('at_risk', { failures: { bookings: true } })
  assert.equal(panelOf(noBookings, 'coaching').status, 'unavailable')
  assert.equal(panelOf(noBookings, 'entitlement').status, 'ok')

  const badInputs = await diag('paying_active', { incidents: null, cases: null })
  assert.equal(panelOf(badInputs, 'incidents').status, 'unavailable')
  assert.equal(panelOf(badInputs, 'previousCases').status, 'unavailable')
  assert.equal(panelOf(badInputs, 'entitlement').status, 'ok')

  // A table method that throws something unexpected degrades only its panel.
  const world = buildSupportWorld()
  const ctx = supportCtx(world)
  ctx.tables.providerHealth = async () => { throw new TypeError('boom') }
  const d = await buildDiagnostics({ ctx, identity: playerIdentity(world, 'paying_active'), now: FIXED_NOW, view: 'staff', roles: ['agent'] })
  assert.equal(panelOf(d, 'connections').status, 'ok')
  assert.ok(factOf(panelOf(d, 'connections'), 'Provider health'))

  // Whole record unreadable: every panel still renders.
  const broken = { tables: null, factsFor: async () => { throw new Error('down') }, log: { warn() {} } }
  const all = await buildDiagnostics({ ctx: broken, identity: { email: 'x@example.com', sub: 'sub-x' }, now: FIXED_NOW, view: 'staff', roles: ['agent'] })
  assert.equal(all.panels.length, PROVIDERS.length)
  assert.equal(panelOf(all, 'entitlement').status, 'not_connected')
  assert.equal(panelOf(all, 'account').status, 'unavailable')
  assert.equal(panelOf(all, 'replay').status, 'not_available')
})

test('account provider: ok / unavailable / not_recorded', async () => {
  assert.equal(panelOf(await diag('paying_active'), 'account').status, 'ok')
  assert.equal(panelOf(await diag('paying_active', { failures: { cognito: true, profiles: true } }), 'account').status, 'unavailable')
  const sources = { account: { status: 'not_connected', data: null }, profile: { status: 'ok', data: null }, billing: { status: 'ok', data: [] } }
  const facts = buildFacts({ now: FIXED_NOW, identity: { email: 'inbound.only@example.com' }, sources })
  const p = await accountProvider({ one: { sources }, facts, identity: { email: 'inbound.only@example.com', signedIn: false } })
  assert.equal(p.status, 'not_recorded')
})

test('entitlement provider: ok / degraded / unavailable / not_connected', async () => {
  assert.equal(panelOf(await diag('paying_active'), 'entitlement').status, 'ok')
  const failed = panelOf(await diag('payment_failed'), 'entitlement')
  assert.equal(failed.status, 'degraded')
  assert.ok(failed.inferences.some((i) => /paid_live_identity_unbound/.test(i.label)))
  assert.equal(factOf(failed, 'Stripe-reported state').value, 'not checked (no read-only Stripe port configured)')
  assert.equal(factOf(failed, 'Last reconciliation check').value, 'not recorded')
  assert.equal(panelOf(await diag('paying_active', { failures: { subscriptions: true } }), 'entitlement').status, 'unavailable')
})

test('connections provider: ok-ish / unavailable / not_recorded', async () => {
  const d = await diag('paying_active')
  const p = panelOf(d, 'connections')
  assert.ok(['ok', 'degraded'].includes(p.status))
  assert.ok(factOf(p, 'Ubisoft').value.startsWith('linked'))
  assert.match(factOf(p, 'Ubisoft detail').value, /last attempt not recorded/)
  assert.equal(panelOf(await diag('paying_active', { failures: { playerSnapshots: true, playerIdentities: true } }), 'connections').status, 'unavailable')
  // No Recon player id (no Cognito sub) -> nothing recorded.
  assert.equal(panelOf(await diag('unconfirmed'), 'connections').status, 'not_recorded')
  // A PSN player during a global PSN outage: degraded + incident guidance.
  const psn = panelOf(await diag('payment_failed'), 'connections')
  assert.equal(psn.status, 'degraded')
  assert.ok(psn.actions.recon.some((a) => /failing globally/.test(a)))
})

test('vod provider: ok / unavailable / not_recorded, with honest gaps', async () => {
  const p = panelOf(await diag('paying_active'), 'vod')
  assert.equal(p.status, 'ok')
  assert.equal(factOf(p, 'Review job / request ids').value, 'not recorded')
  assert.equal(factOf(p, 'Failed-review records').value, 'not recorded')
  assert.equal(factOf(p, 'Review archive').value, 'not connected in this deployment')
  assert.equal(factOf(p, 'Completed review records this period').value, '2')
  assert.ok(p.inferences.some((i) => /Possible failed/.test(i.label)), 'counted uses exceed completed reviews')
  assert.equal(panelOf(await diag('paying_active', { failures: { subscriptions: true } }), 'vod').status, 'unavailable')
  assert.equal(panelOf(await diag('paying_locked_out'), 'vod').status, 'not_recorded')
  const free = panelOf(await diag('free_activated'), 'vod')
  assert.equal(factOf(free, 'AI VOD review').value, 'not included on your current plan')
})

test('replay provider is honestly not available', async () => {
  const p = await replayProvider()
  assert.equal(p.status, 'not_available')
  assert.equal(p.facts[0].value, 'not available in Recon today')
})

test('coaching provider: ok / unavailable / not_recorded', async () => {
  const p = panelOf(await diag('at_risk'), 'coaching')
  assert.equal(p.status, 'degraded', 'Champion access with no credits row')
  assert.equal(factOf(p, 'Coaching credits').value, 'none on record')
  assert.ok(p.inferences.some((i) => /without a credits row/.test(i.label)))
  const world = buildSupportWorld()
  world.bookings.push({ slotId: 'credits#fading.roamer@example.test', credits: 2, email: 'fading.roamer@example.test' })
  assert.equal(panelOf(await diag('at_risk', { world }), 'coaching').status, 'ok')
  assert.equal(panelOf(await diag('at_risk', { failures: { bookings: true } }), 'coaching').status, 'unavailable')
  assert.equal(panelOf(await diag('new'), 'coaching').status, 'not_recorded')
})

test('onboarding provider: ok / unavailable / not_recorded', async () => {
  assert.equal(panelOf(await diag('paying_active'), 'onboarding').status, 'ok')
  assert.equal((await onboardingProvider({ facts: null })).status, 'unavailable')
  assert.equal(panelOf(await diag('new'), 'onboarding').status, 'not_recorded')
  const locked = panelOf(await diag('paying_locked_out'), 'onboarding')
  assert.ok(locked.inferences.some((i) => i.value === 'account_setup_incomplete'))
})

test('usage provider: ok / unavailable / not_connected / not_recorded', async () => {
  const at = new Date(FIXED_NOW - 86400000).toISOString()
  const mk = (cs) => {
    const sources = { cs, billing: { status: 'ok', data: [] } }
    return { one: { sources }, facts: buildFacts({ now: FIXED_NOW, identity: { email: 'u@example.com' }, sources }) }
  }
  assert.equal((await usageProvider(mk({ status: 'ok', data: { activity: [{ type: 'strat_viewed', at }] } }))).status, 'ok')
  assert.equal((await usageProvider(mk({ status: 'ok', data: { activity: [] } }))).status, 'not_recorded')
  assert.equal((await usageProvider(mk({ status: 'unavailable', data: null }))).status, 'unavailable')
  assert.equal((await usageProvider(mk({ status: 'not_connected', data: null }))).status, 'not_connected')
})

test('desktop provider always says activation/version are not recorded', async () => {
  const p = await desktopProvider({ facts: null })
  assert.equal(p.status, 'not_recorded')
  assert.ok(p.facts.every((f) => f.value === 'not recorded'))
})

test('incidents provider: ok with matching inference / unavailable', async () => {
  const incidents = [
    { incidentId: 'inc-7', title: 'TRN lookups failing', service: 'trn', status: 'identified', severity: 'sev3' },
    { incidentId: 'inc-8', title: 'Old outage', service: 'auth', status: 'resolved', severity: 'sev2' },
  ]
  const p = await incidentsProvider({ incidents, category: 'rank_stat_discrepancy' })
  assert.equal(p.status, 'ok')
  assert.equal(p.facts[0].value, '1')
  assert.equal(p.inferences.length, 1)
  assert.deepEqual(p.signals.matchingIncidentIds, ['inc-7'])
  assert.equal((await incidentsProvider({ incidents: undefined })).status, 'unavailable')
})

test('previous cases provider: ok with repeat inference / unavailable', async () => {
  const cases = [
    { caseId: 'a', caseNumber: 'R6-000010', category: 'vod_analysis', status: 'resolved', createdAt: '2026-09-01T00:00:00Z' },
    { caseId: 'b', caseNumber: 'R6-000011', category: 'bug', status: 'in_progress', createdAt: '2026-10-01T00:00:00Z' },
  ]
  const p = await previousCasesProvider({ cases, category: 'vod_analysis', currentCaseId: 'z' })
  assert.equal(p.status, 'ok')
  assert.match(p.facts[0].value, /2 \(1 open\)/)
  assert.equal(p.inferences.length, 1)
  assert.equal((await previousCasesProvider({ cases: 'nope' })).status, 'unavailable')
})
