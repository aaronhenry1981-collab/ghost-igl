import test from 'node:test'
import assert from 'node:assert/strict'
import { attributionProps, captureAttribution, markSynced, readAttribution, readSynced, STORE_KEY, userKeyFor } from './store.js'

const T0 = Date.parse('2026-09-25T12:00:00.000Z')
const MIN = 60 * 1000

function fakeStorage(initial = {}, { throws = false } = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem(k) { if (throws) throw new Error('blocked'); return map.has(k) ? map.get(k) : null },
    setItem(k, v) { if (throws) throw new Error('blocked'); map.set(k, String(v)) },
    removeItem(k) { map.delete(k) },
  }
}

function fakeWindow(url, { referrer = '', storage = fakeStorage() } = {}) {
  const u = new URL(url)
  return { location: { search: u.search, hash: u.hash, pathname: u.pathname, hostname: u.hostname }, document: { referrer }, localStorage: storage }
}

test('first visit from a ChatGPT link is stored with the raw tag, then a later TikTok visit keeps first touch', () => {
  const storage = fakeStorage()
  captureAttribution({ win: fakeWindow('https://r6coaching.com/blog/bank-defense-setups-ranked.html?utm_source=chatgpt.com', { storage }), now: T0 })
  captureAttribution({ win: fakeWindow('https://r6coaching.com/?utm_source=tiktok&utm_campaign=site_files&utm_content=sf012', { storage }), now: T0 + 90 * MIN })
  const state = readAttribution(storage)
  assert.equal(state.firstTouch.source, 'chatgpt')
  assert.equal(state.firstTouch.sourceRaw, 'chatgpt.com')
  assert.equal(state.lastTouch.source, 'tiktok')
  assert.equal(state.landingPath, '/blog/bank-defense-setups-ranked.html')
  assert.equal(state.visits, 2)
})

test('an older recon:src value is kept as the historical first touch (including "chatgptcom")', () => {
  const storage = fakeStorage({ 'recon:src': 'chatgptcom' })
  captureAttribution({ win: fakeWindow('https://r6coaching.com/?utm_source=youtube', { storage }), now: T0 })
  const state = readAttribution(storage)
  assert.equal(state.firstTouch.evidence, 'legacy_first_touch')
  assert.equal(state.firstTouch.source, 'chatgpt')
  assert.equal(state.firstTouch.sourceRaw, 'chatgptcom')
  assert.equal(state.lastTouch.source, 'youtube')
  assert.equal(storage.map.get('recon:src'), 'chatgptcom', 'the legacy key is never modified')
})

test('a recon:src value written from this very URL is not mistaken for history', () => {
  const storage = fakeStorage({ 'recon:src': 'twitter' })
  captureAttribution({ win: fakeWindow('https://r6coaching.com/?ref=twitter', { storage }), now: T0 })
  const state = readAttribution(storage)
  assert.equal(state.firstTouch.evidence, 'ref_code')
  assert.equal(state.touches.length, 1)
})

test('internal navigation, corrupt stored JSON and blocked storage never throw', () => {
  const storage = fakeStorage({ [STORE_KEY]: '{not json' })
  const state = captureAttribution({ win: fakeWindow('https://www.r6coaching.com/strats', { referrer: 'https://www.r6coaching.com/', storage }), now: T0 })
  assert.equal(state.firstTouch.source, 'direct')
  assert.equal(captureAttribution({ win: fakeWindow('https://r6coaching.com/?utm_source=reddit', { storage: fakeStorage({}, { throws: true }) }), now: T0 })?.firstTouch?.source, 'reddit', 'works in memory even when storage is blocked')
  assert.equal(captureAttribution({ win: null }), null)
})

test('sync log remembers recorded event keys per user, without storing the user id', () => {
  const storage = fakeStorage()
  const key = userKeyFor('11111111-2222-3333-4444-555555555555')
  assert.match(key, /^[0-9a-f]{8}$/)
  assert.equal(key, userKeyFor('11111111-2222-3333-4444-555555555555'))
  markSynced(key, ['a', 'b'], storage)
  markSynced(key, ['b', 'c'], storage)
  assert.deepEqual([...readSynced(key, storage)], ['a', 'b', 'c'])
  assert.ok(!storage.map.get('recon:attr:sync:v1').includes('11111111'))
})

test('Plausible properties: first real source, channel, campaign and landing page only', () => {
  const storage = fakeStorage()
  captureAttribution({ win: fakeWindow('https://r6coaching.com/', { storage }), now: T0 })
  captureAttribution({ win: fakeWindow('https://r6coaching.com/coaching?utm_source=chatgpt.com&utm_campaign=answer', { storage }), now: T0 + MIN })
  const props = attributionProps(readAttribution(storage))
  assert.deepEqual(props, { source: 'chatgpt', channel: 'ai_search', campaign: 'answer', last_source: 'chatgpt', landing: '/' })
  assert.deepEqual(attributionProps(null), {})
})
