import test from 'node:test'
import assert from 'node:assert/strict'
import { fixtureApp } from '../fixtures/app.mjs'
import { routeModules } from './index.mjs'
import { analyzeFeedback, selectFeedbackPrompt, validateAnswers } from '../domain/feedback.mjs'
import { buildFacts } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { evaluateOutreach } from '../domain/outreach.mjs'

const NOW = Date.parse('2026-09-25T15:00:00.000Z')
const DAY = 86400000
const parse = (res) => JSON.parse(res.body)
const app = (config = {}) => fixtureApp({ extraRoutes: routeModules, config: { directoryCacheMs: 0, ...config } })

function factsWith({ createdDaysAgo = 3, lastSeenDaysAgo = 1, prompts = [], feedback = [], billing = [] } = {}) {
  const facts = buildFacts({
    now: NOW,
    identity: { email: 'p@example.test', signedIn: true },
    sources: {
      profile: { status: 'ok', data: { first_name: 'P', last_name: 'Q', display_name: 'PQ', platform: 'pc', created_at: new Date(NOW - createdDaysAgo * DAY).toISOString(), last_seen_at: new Date(NOW - lastSeenDaysAgo * DAY).toISOString() } },
      billing: { status: 'ok', data: billing },
      cs: { status: 'ok', data: { messages: [], outreach: [], feedback, prompts, decisions: [], activity: [] } },
    },
  })
  return { facts, lifecycle: deriveLifecycle(facts, NOW) }
}

test('home shows the right moment for each fictional player, one prompt at most', async () => {
  const { call } = app()
  const vod = parse(await call('GET', '/cs/me/home', { token: 'tok-paying_active' })).feedbackPrompt
  assert.equal(vod.momentId, 'after_vod')
  assert.ok(vod.questions.every((q) => q.label))
  assert.equal(parse(await call('GET', '/cs/me/home', { token: 'tok-payment_failed' })).feedbackPrompt.momentId, 'failed_renewal')
  assert.equal(parse(await call('GET', '/cs/me/home', { token: 'tok-new' })).feedbackPrompt, null, 'nothing on day 0')
  assert.equal(parse(await call('GET', '/cs/me/home', { token: 'tok-at_risk' })).feedbackPrompt, null, 'already answered week 1, nothing else due')
})

test('cooldown: no new prompt within 5 days of the last one, except cancellation/failed renewal', () => {
  const recentPrompt = [{ momentKey: 'after_vod#2026-09-20', status: 'answered', shownAt: new Date(NOW - 2 * DAY).toISOString() }]
  const { facts, lifecycle } = factsWith({ createdDaysAgo: 3, prompts: recentPrompt })
  assert.equal(selectFeedbackPrompt(facts, lifecycle, { now: NOW }), null)
  const failing = factsWith({ createdDaysAgo: 3, prompts: recentPrompt, billing: [{ stripe_customer_id: 'cus_x', plan: 'pro', price_id: 'price_1TLEtrJNddvjgWcg9iTWJoLS', status: 'past_due', current_period_end: new Date(NOW + 3 * DAY).toISOString(), updated_at: new Date(NOW - DAY).toISOString() }] })
  assert.equal(selectFeedbackPrompt(failing.facts, failing.lifecycle, { now: NOW }).momentId, 'failed_renewal')
})

test('dedupe: answered and dismissed moments never return; snooze works once', () => {
  const base = factsWith({ createdDaysAgo: 3 })
  assert.equal(selectFeedbackPrompt(base.facts, base.lifecycle, { now: NOW }).momentKey, 'early_days#account')
  const dismissed = factsWith({ createdDaysAgo: 3, prompts: [{ momentKey: 'early_days#account', status: 'dismissed', shownAt: new Date(NOW - 10 * DAY).toISOString() }] })
  assert.equal(selectFeedbackPrompt(dismissed.facts, dismissed.lifecycle, { now: NOW }), null)
  const snoozed = factsWith({ createdDaysAgo: 3, prompts: [{ momentKey: 'early_days#account', status: 'snoozed', snoozeCount: 1, snoozedUntil: new Date(NOW + DAY).toISOString(), shownAt: new Date(NOW - 10 * DAY).toISOString() }] })
  assert.equal(selectFeedbackPrompt(snoozed.facts, snoozed.lifecycle, { now: NOW }), null)
  const back = factsWith({ createdDaysAgo: 4, prompts: [{ momentKey: 'early_days#account', status: 'snoozed', snoozeCount: 1, snoozedUntil: new Date(NOW - 1000).toISOString(), shownAt: new Date(NOW - 10 * DAY).toISOString() }] })
  const again = selectFeedbackPrompt(back.facts, back.lifecycle, { now: NOW })
  assert.equal(again.momentKey, 'early_days#account')
  assert.equal(again.canSnooze, false, 'second time around it can only be answered or dismissed')
})

test('answers are validated per moment and never store card numbers or passwords', () => {
  assert.equal(validateAnswers('week_1', { helpful: 4, nps: 11 }).ok, false)
  assert.equal(validateAnswers('week_1', { helpful: 0, nps: 7 }).ok, false)
  assert.equal(validateAnswers('week_1', { helpful: 4, nps: 7, missing: 'my card 4242 4242 4242 4242 got charged' }).ok, false)
  assert.equal(validateAnswers('early_days', { helpful: 4, confusing: 'password: hunter2' }).ok, false)
  const ok = validateAnswers('week_1', { helpful: 4, nps: 9, used: ['round_plans', 'bogus'], missing: 'Duo setups for Kafe' })
  assert.deepEqual(ok.answers, { used: ['round_plans'], helpful: 4, missing: 'Duo setups for Kafe', nps: 9 })
  assert.equal(validateAnswers('nope', {}).ok, false)
})

test('submit flow: seen -> answer -> no duplicates; closed moments rejected; flag respected', async () => {
  const { call } = app()
  const prompt = parse(await call('GET', '/cs/me/home', { token: 'tok-paying_active' })).feedbackPrompt
  assert.equal((await call('POST', '/cs/me/feedback/seen', { token: 'tok-paying_active', body: { momentKey: prompt.momentKey } })).statusCode, 200)
  assert.equal((await call('POST', '/cs/me/feedback', { token: 'tok-paying_active', body: { momentKey: 'week_1#account', answers: { helpful: 5, nps: 10 } } })).statusCode, 409, 'cannot answer a moment that is not open')
  assert.equal((await call('POST', '/cs/me/feedback', { token: 'tok-paying_active', body: { momentKey: prompt.momentKey, answers: { helpful: 9 } } })).statusCode, 400)
  const ok = await call('POST', '/cs/me/feedback', { token: 'tok-paying_active', body: { momentKey: prompt.momentKey, answers: { helpful: 4, result: 'fixed_mistake', confusing: 'The map name was detected as Bank but it was Clubhouse.' } } })
  assert.equal(ok.statusCode, 201)
  assert.equal((await call('POST', '/cs/me/feedback', { token: 'tok-paying_active', body: { momentKey: prompt.momentKey, answers: { helpful: 4, result: 'fixed_mistake' } } })).statusCode, 409)
  assert.equal(parse(await call('GET', '/cs/me/home', { token: 'tok-paying_active' })).feedbackPrompt, null, 'answered moments do not come back, and cooldown holds the rest')

  const off = fixtureApp({ extraRoutes: routeModules, config: { features: { feedback: false } } })
  assert.equal((await off.call('POST', '/cs/me/feedback', { token: 'tok-paying_active', body: { momentKey: prompt.momentKey, answers: {} } })).statusCode, 404)
  assert.equal(parse(await off.call('GET', '/cs/me/home', { token: 'tok-paying_active' })).feedbackPrompt, null)
})

test('CRM feedback: themes with quotes, NPS withheld under 5 answers, complaints resolvable, admin only', async () => {
  const { call } = app()
  assert.equal((await call('GET', '/cs/admin/feedback', { token: 'tok-at_risk' })).statusCode, 403)
  const fb = parse(await call('GET', '/cs/admin/feedback', { token: 'tok-admin' }))
  assert.equal(fb.responses, 1)
  assert.equal(fb.nps.score, null, 'one answer is not an NPS')
  const themeIds = fb.themes.map((t) => t.id)
  assert.ok(themeIds.includes('squad') && themeIds.includes('maps'))
  assert.ok(fb.themes[0].quotes[0].text.includes('Kafe'))
  assert.equal(fb.complaints.length, 1)
  assert.equal(fb.requests[0].text, 'Duo-specific plans')

  const c = fb.complaints[0]
  assert.equal((await call('POST', '/cs/admin/feedback/resolve', { token: 'tok-admin', body: { player: c.player.key, feedbackId: c.feedbackId, note: 'Duo Kafe plans shipped' } })).statusCode, 200)
  assert.equal(parse(await call('GET', '/cs/admin/feedback', { token: 'tok-admin' })).complaints.length, 0)
})

test('analyzeFeedback computes NPS only from 5+ real answers', () => {
  const mk = (nps) => ({ feedbackId: `f${nps}`, answers: { nps } })
  const r = analyzeFeedback([mk(10), mk(9), mk(8), mk(3), mk(6)])
  assert.deepEqual({ promoters: r.nps.promoters, passives: r.nps.passives, detractors: r.nps.detractors, score: r.nps.score }, { promoters: 2, passives: 1, detractors: 2, score: 0 })
})

test('reviews: only permission-granted quotes can be approved; approval returns a draft, never publishes', async () => {
  const { call, store } = app()
  const all = await store.listAll()
  const fbItem = all.find((i) => i.type === 'FB')
  // Give the fictional at-risk player's answer an explicit publish permission.
  await store.update(fbItem.pk, fbItem.sk, { answers: { ...fbItem.answers, review: { mayRequest: true, mayPublishQuote: true, quote: 'The Bank CEO plan finally made anchoring click.', displayName: 'Jordan P.' } } })
  const reviews = parse(await call('GET', '/cs/admin/reviews', { token: 'tok-admin' }))
  assert.equal(reviews.candidates.length, 1)
  assert.equal(reviews.testimonials.status, 'ok')
  const cand = reviews.candidates[0]
  const ok = parse(await call('POST', '/cs/admin/reviews/decision', { token: 'tok-admin', body: { player: cand.player.key, feedbackId: cand.feedbackId, decision: 'approve' } }))
  assert.equal(ok.testimonialDraft.text, 'The Bank CEO plan finally made anchoring click.')
  assert.equal(ok.testimonialDraft.tier, null, 'never adds a tier badge automatically')
  assert.equal((await call('POST', '/cs/admin/reviews/decision', { token: 'tok-admin', body: { player: cand.player.key, feedbackId: cand.feedbackId, decision: 'approve' } })).statusCode, 409)

  await store.update(fbItem.pk, fbItem.sk, { reviewDecision: null, answers: { ...fbItem.answers, review: { mayRequest: true, mayPublishQuote: false, quote: null } } })
  const noPerm = await call('POST', '/cs/admin/reviews/decision', { token: 'tok-admin', body: { player: cand.player.key, feedbackId: cand.feedbackId, decision: 'approve' } })
  assert.equal(noPerm.statusCode, 409)
})

test('email fallback: a due feedback moment reaches a player who stopped opening the app (delivery disabled)', () => {
  const { facts, lifecycle } = factsWith({ createdDaysAgo: 9, lastSeenDaysAgo: 6 })
  const fallback = evaluateOutreach(facts, lifecycle, { now: NOW }).find((c) => c.workflowId === 'feedback_email_fallback')
  assert.ok(fallback)
  assert.equal(fallback.instanceKey, 'week_1#account')
  assert.equal(fallback.channel, 'email')
})

test('moment ids with digits (week_1, month_1) can be answered', async () => {
  const { call } = app()
  // quiet.anchor signed up 9 days ago: week 1 is due unless meaningful use wins; accept either, then answer it.
  const prompt = parse(await call('GET', '/cs/me/home', { token: 'tok-free_activated' })).feedbackPrompt
  assert.ok(prompt)
  const answers = prompt.momentId === 'week_1' ? { helpful: 4, nps: 8 } : { helpful: 4 }
  const res = await call('POST', '/cs/me/feedback', { token: 'tok-free_activated', body: { momentKey: prompt.momentKey, answers } })
  assert.equal(res.statusCode, 201)
  const week = await call('POST', '/cs/me/feedback/dismiss', { token: 'tok-free_activated', body: { momentKey: 'week_1#account', action: 'dismiss' } })
  assert.notEqual(week.statusCode, 400, 'week_1 keys are valid')
})
