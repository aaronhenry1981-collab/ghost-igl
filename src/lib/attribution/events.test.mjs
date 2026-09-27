import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeTouch, seedFromLegacy, touchFromLocation } from './core.js'
import { ACQUISITION_EVENT_TYPES, attributedEvent, checkoutEvent, eventKey, pendingEvents, touchEvent } from './events.js'
import { syncAttribution } from './sync.js'
import { assertNoCredentialFields } from '../../../lambda/player-data/core.mjs'

const T0 = Date.parse('2026-09-25T12:00:00.000Z')
const MIN = 60 * 1000
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/ // lambda/player-data/index.mjs

function history() {
  const visit = (search, at, pathname = '/') => touchFromLocation({ search, pathname, siteHost: 'r6coaching.com', now: at })
  let state = mergeTouch(null, visit('?utm_source=chatgpt.com', T0, '/blog/bank-defense-setups-ranked.html'), { now: T0 })
  state = mergeTouch(state, visit('?utm_source=tiktok&utm_campaign=site_files&utm_content=sf012', T0 + 60 * MIN), { now: T0 + 60 * MIN })
  state = mergeTouch(state, visit('', T0 + 120 * MIN), { now: T0 + 120 * MIN })
  return state
}

test('event types fit the player-data contract and payloads pass its credential guard and size cap', () => {
  const state = history()
  const events = [...pendingEvents(state), checkoutEvent(state, { tier: 'elite', location: 'pricing-card', now: T0 })]
  assert.ok(events.length >= 3)
  for (const event of events) {
    assert.ok(ACQUISITION_EVENT_TYPES.includes(event.event_type))
    assert.match(event.event_type, EVENT_TYPE_PATTERN)
    assert.ok(event.event_id.length <= 100)
    assert.ok(Number.isFinite(Date.parse(event.occurred_at)))
    assertNoCredentialFields(event, 'event')
    assert.ok(JSON.stringify(event.data).length < 20000)
    assert.doesNotMatch(JSON.stringify(event), /@|https?:\/\/|\?/, 'no emails, full URLs or query strings')
  }
})

test('first-touch event is dated to first sight and keeps the raw ChatGPT tag', () => {
  const event = attributedEvent(history())
  assert.equal(event.event_id, 'acq-first-v1')
  assert.equal(event.occurred_at, new Date(T0).toISOString())
  assert.equal(event.data.first_touch.source, 'chatgpt')
  assert.equal(event.data.first_touch.source_raw, 'chatgpt.com')
  assert.equal(event.data.first_touch.evidence, 'utm_tag')
  assert.equal(event.data.last_touch.source, 'tiktok')
  assert.equal(event.data.landing_path, '/blog/bank-defense-setups-ranked.html')
})

test('event ids are deterministic, so retries and second tabs produce the same keys', () => {
  const a = pendingEvents(history()).map(eventKey)
  const b = pendingEvents(history()).map(eventKey)
  assert.deepEqual(a, b)
  assert.equal(new Set(a).size, a.length)
  const c1 = checkoutEvent(history(), { tier: 'elite', location: 'pricing-card', now: T0 + 5000 })
  const c2 = checkoutEvent(history(), { tier: 'elite', location: 'pricing-card', now: T0 + 50000 })
  assert.equal(eventKey(c1), eventKey(c2), 'two clicks in the same minute record once')
})

test('direct visits and legacy seeds are not sent as touches; the legacy first touch travels in the snapshot', () => {
  assert.equal(touchEvent(touchFromLocation({ now: T0 })), null)
  const seeded = seedFromLegacy('chatgptcom', { now: T0 })
  const events = pendingEvents(seeded)
  assert.deepEqual(events.map((e) => e.event_type), ['acquisition_attributed'])
  assert.equal(events[0].data.seeded_from_legacy, true)
  assert.equal(events[0].data.first_touch.source_raw, 'chatgptcom')
})

test('sync posts each pending event once, remembers it, and stops at the first failure', async () => {
  const state = history()
  const posted = []
  let synced = new Set()
  const markSynced = (keys) => { synced = new Set([...synced, ...keys]) }
  let fail = true
  const flaky = async (event) => {
    if (event.event_type === 'acquisition_touch' && fail) { fail = false; throw new Error('503') }
    posted.push(eventKey(event))
    return { event }
  }
  const first = await syncAttribution({ state, synced, post: flaky, markSynced })
  assert.equal(first.status, 'failed')
  assert.equal(first.posted, 1)
  const second = await syncAttribution({ state, synced, post: flaky, markSynced })
  assert.equal(second.status, 'ok')
  assert.equal(second.remaining, 0)
  const third = await syncAttribution({ state, synced, post: flaky, markSynced })
  assert.equal(third.posted, 0, 'nothing is re-sent')
  assert.equal(new Set(posted).size, posted.length)
})

test('sync reports "not configured" when the player-data API is not set up, and records nothing', async () => {
  let marked = false
  const res = await syncAttribution({ state: history(), post: async () => null, markSynced: () => { marked = true } })
  assert.equal(res.status, 'not_configured')
  assert.equal(marked, false)
})
