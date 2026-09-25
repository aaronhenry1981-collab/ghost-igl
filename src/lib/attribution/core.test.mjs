import test from 'node:test'
import assert from 'node:assert/strict'
import { attributionSnapshot, describeTouch, legacySourceValue, mergeTouch, seedFromLegacy, touchFromLocation } from './core.js'

const T0 = Date.parse('2026-09-25T12:00:00.000Z')
const MIN = 60 * 1000
const visit = (opts, at = T0) => touchFromLocation({ siteHost: 'r6coaching.com', now: at, pathname: '/', ...opts })

test('ChatGPT search link: raw kept, readable label, reported as a tagged visit (not a recommendation)', () => {
  const t = visit({ search: '?utm_source=chatgpt.com', pathname: '/blog/bank-defense-setups-ranked.html' })
  assert.equal(t.source, 'chatgpt')
  assert.equal(t.sourceLabel, 'ChatGPT')
  assert.equal(t.sourceRaw, 'chatgpt.com', 'the raw value is preserved for auditing')
  assert.equal(t.channel, 'ai_search')
  assert.equal(t.evidence, 'utm_tag')
  assert.equal(t.landingPath, '/blog/bank-defense-setups-ranked.html')
  assert.equal(describeTouch(t), 'ChatGPT-tagged visit (utm_source=chatgpt.com)')
  assert.doesNotMatch(describeTouch(t), /recommend/i)
})

test('ChatGPT referrer without a tag is a referrer visit', () => {
  const t = visit({ referrer: 'https://chatgpt.com/c/abc123' })
  assert.equal(t.source, 'chatgpt')
  assert.equal(t.evidence, 'referrer')
  assert.equal(t.referrerDomain, 'chatgpt.com')
  assert.equal(describeTouch(t), 'Visit from chatgpt.com (referrer)')
})

test('TikTok, YouTube, Google, Discord and Reddit by UTM and by referrer', () => {
  const cases = [
    [{ search: '?utm_source=tiktok&utm_medium=social&utm_campaign=site_files&utm_content=sf012' }, 'tiktok', 'social_video', 'utm_tag'],
    [{ referrer: 'https://www.tiktok.com/@recon6/video/1' }, 'tiktok', 'social_video', 'referrer'],
    [{ search: '?utm_source=youtube&utm_medium=shorts' }, 'youtube', 'social_video', 'utm_tag'],
    [{ referrer: 'https://youtu.be/xyz' }, 'youtube', 'social_video', 'referrer'],
    [{ referrer: 'https://www.google.com/' }, 'google', 'search', 'referrer'],
    [{ referrer: 'https://www.google.co.uk/' }, 'google', 'search', 'referrer'],
    [{ search: '?utm_source=discord&utm_campaign=server_welcome' }, 'discord', 'community', 'utm_tag'],
    [{ referrer: 'https://discord.com/channels/1/2' }, 'discord', 'community', 'referrer'],
    [{ referrer: 'https://old.reddit.com/r/Rainbow6/comments/x' }, 'reddit', 'community', 'referrer'],
    [{ search: '?utm_source=reddit&utm_medium=cpc' }, 'reddit', 'paid', 'utm_tag'],
  ]
  for (const [opts, source, channel, evidence] of cases) {
    const t = visit(opts)
    assert.equal(t.source, source, JSON.stringify(opts))
    assert.equal(t.channel, channel, JSON.stringify(opts))
    assert.equal(t.evidence, evidence, JSON.stringify(opts))
  }
  const tiktok = visit({ search: '?utm_source=tiktok&utm_medium=social&utm_campaign=site_files&utm_content=sf012' })
  assert.deepEqual([tiktok.medium, tiktok.campaign, tiktok.content, tiktok.contentId], ['social', 'site_files', 'sf012', 'sf012'])
})

test('utm_term and explicit content ids are captured', () => {
  const t = visit({ search: '?utm_source=google&utm_medium=cpc&utm_term=r6+coaching&cid=post-2026-09-24' })
  assert.equal(t.term, 'r6 coaching')
  assert.equal(t.contentId, 'post-2026-09-24')
  assert.equal(t.channel, 'paid')
})

test('creator codes via ?ref= become creator touches; known sources via ?ref= stay that source', () => {
  const creator = visit({ search: '?ref=SplitAim' })
  assert.equal(creator.source, 'creator:splitaim')
  assert.equal(creator.channel, 'creator')
  assert.equal(creator.evidence, 'ref_code')
  assert.equal(describeTouch(creator), 'Creator code "splitaim"')
  const known = visit({ search: '?ref=twitter' })
  assert.equal(known.source, 'x')
  assert.equal(known.evidence, 'ref_code')
})

test('friend referrals via /r/<code>', () => {
  const t = visit({ pathname: '/r/ab12cd' })
  assert.equal(t.source, 'friend_referral')
  assert.equal(t.channel, 'referral')
  assert.equal(t.referralCode, 'AB12CD')
})

test('direct traffic and internal navigation are direct', () => {
  assert.equal(visit({}).source, 'direct')
  const internal = visit({ referrer: 'https://www.r6coaching.com/strats' })
  assert.equal(internal.source, 'direct')
  assert.equal(internal.referrerDomain, null)
})

test('query inside the hash route is read too', () => {
  const t = visit({ hash: '#/?utm_source=chatgpt.com&utm_campaign=answer' })
  assert.equal(t.source, 'chatgpt')
  assert.equal(t.campaign, 'answer')
})

test('malformed and hostile parameters never break capture or store unsafe values', () => {
  const t = visit({ search: '?utm_source=%3Cscript%3Ealert(1)%3C/script%3E&utm_campaign=me@example.test&utm_content=' + 'x'.repeat(500) })
  assert.ok(!/[<>]/.test(t.sourceRaw))
  assert.equal(t.campaign, '[redacted]', 'emails are never stored')
  assert.ok(t.content.length <= 100)
  const broken = visit({ search: '?utm_source=%E0%A4%A', referrer: 'not a url' })
  assert.ok(broken.source)
  const empty = visit({ search: '?utm_source=&ref=' })
  assert.equal(empty.source, 'direct')
  // Landing page query strings (which can carry tokens) are dropped.
  assert.equal(visit({ pathname: '/auth?token=abc' }).landingPath, '/auth')
})

test('first touch is preserved across repeated visits; last touch follows the last real source', () => {
  let state = mergeTouch(null, visit({ search: '?utm_source=chatgpt.com' }, T0), { now: T0 })
  state = mergeTouch(state, visit({}, T0 + 60 * MIN), { now: T0 + 60 * MIN })
  assert.equal(state.lastTouch.source, 'chatgpt', 'a direct visit does not erase the last real source')
  state = mergeTouch(state, visit({ referrer: 'https://www.tiktok.com/@x' }, T0 + 120 * MIN), { now: T0 + 120 * MIN })
  state = mergeTouch(state, visit({ search: '?utm_source=youtube' }, T0 + 240 * MIN), { now: T0 + 240 * MIN })
  assert.equal(state.firstTouch.source, 'chatgpt')
  assert.equal(state.lastTouch.source, 'youtube')
  assert.equal(state.visits, 4)
  assert.deepEqual(state.touches.map((t) => t.source), ['chatgpt', 'tiktok', 'youtube'])
})

test('repeat of the same touch within 30 minutes is not double-counted in touch history', () => {
  let state = mergeTouch(null, visit({ search: '?utm_source=tiktok&utm_campaign=a' }, T0), { now: T0 })
  state = mergeTouch(state, visit({ search: '?utm_source=tiktok&utm_campaign=a' }, T0 + 5 * MIN), { now: T0 + 5 * MIN })
  assert.equal(state.touches.length, 1)
  assert.equal(state.visits, 2)
})

test('a direct first visit keeps its place, and the first real source is recorded separately', () => {
  let state = mergeTouch(null, visit({}, T0), { now: T0 })
  state = mergeTouch(state, visit({ search: '?utm_source=reddit' }, T0 + MIN), { now: T0 + MIN })
  assert.equal(state.firstTouch.source, 'direct')
  assert.equal(state.firstNonDirectTouch.source, 'reddit')
})

test('legacy first-touch values are preserved, including the old "chatgptcom" mangling', () => {
  const seeded = seedFromLegacy('chatgptcom', { now: T0 })
  assert.equal(seeded.firstTouch.source, 'chatgpt')
  assert.equal(seeded.firstTouch.sourceRaw, 'chatgptcom')
  assert.equal(seeded.firstTouch.evidence, 'legacy_first_touch')
  const next = mergeTouch(seeded, visit({ search: '?utm_source=tiktok' }, T0 + MIN), { now: T0 + MIN })
  assert.equal(next.firstTouch.sourceRaw, 'chatgptcom', 'history is never overwritten')
  assert.equal(next.lastTouch.source, 'tiktok')
  assert.equal(seedFromLegacy(''), null)
})

test('snapshots and legacy values for events and the profile field', () => {
  const state = mergeTouch(null, visit({ search: '?utm_source=chatgpt.com&utm_campaign=answer' }), { now: T0 })
  const snap = attributionSnapshot(state)
  assert.equal(snap.firstTouch.source, 'chatgpt')
  assert.equal(snap.lastTouch.campaign, 'answer')
  assert.equal(legacySourceValue(state.firstTouch), 'chatgpt', 'no more "chatgptcom"')
  assert.equal(legacySourceValue(visit({ search: '?ref=SplitAim' })), 'splitaim')
  assert.equal(legacySourceValue(visit({})), null)
})
