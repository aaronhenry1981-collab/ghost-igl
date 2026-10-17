import test from 'node:test'
import assert from 'node:assert/strict'
import { PUBLIC_PROOF, communityProof, approvedTestimonials, testimonialPhoto, founderProof, reviewProof } from './publicProof.js'
import { PRICING_PROMOTION } from './pricingPromotion.js'

test('missing approvals produce no community, founder, review, testimonial or offer claims', () => {
  assert.equal(communityProof(), null)
  assert.equal(founderProof(), null)
  assert.equal(reviewProof(), null)
  assert.deepEqual(approvedTestimonials(), [])
  assert.equal(PRICING_PROMOTION.enabled, false)
  assert.equal(PRICING_PROMOTION.amount, null)
})
const approval = { approved: true, verifiedOn: '2026-10-17' }
test('a signup aggregate retains its actual metric instead of becoming players coached', () => {
  const data = { ...PUBLIC_PROOF, community: { ...approval, metric: 'registered_accounts', count: 12 } }
  assert.equal(communityProof(data).label, 'registered accounts')
  for (const count of [NaN, Infinity, -1, 0, 1.1]) assert.equal(communityProof({ ...data, community: { ...data.community, count } }), null)
  assert.equal(communityProof({ ...data, community: { ...data.community, approved: false } }), null)
  assert.equal(communityProof({ ...data, community: { ...data.community, metric: 'happy_players' } }), null)
})
test('unapproved or external photos stay hidden; approved additions require an outcome', () => {
  const entry = { ...approval, id: 'fixture-only', name: 'Test fixture', text: 'Fixture quote', rank: 'Fixture outcome', image: '/proof/fixture.webp' }
  assert.equal(approvedTestimonials({ ...PUBLIC_PROOF, testimonials: [entry] }).length, 1)
  for (const change of [{ approved: false }, { rank: '' }, { image: 'https://example.com/personal.jpg' }, { image: '/proof/../private.jpg' }]) {
    assert.deepEqual(approvedTestimonials({ ...PUBLIC_PROOF, testimonials: [{ ...entry, ...change }] }), [])
  }
  assert.equal(testimonialPhoto(entry), null)
  assert.equal(testimonialPhoto(entry, { ...PUBLIC_PROOF, testimonialPhotos: { [entry.id]: entry } }), '/proof/fixture.webp')
})
test('founder identity and public HTTPS links must be explicitly approved', () => {
  const entry = { ...approval, name: 'Aaron Henry', image: '/proof/fixture.webp', profileUrl: 'https://example.com/fixture', profileLabel: 'Fixture profile' }
  assert.equal(founderProof({ ...PUBLIC_PROOF, founder: entry }), entry)
  for (const change of [{ approved: false }, { name: 'Someone else' }, { profileUrl: 'javascript:alert(1)' }, { profileUrl: 'https://name:secret@example.com' }]) {
    assert.equal(founderProof({ ...PUBLIC_PROOF, founder: { ...entry, ...change } }), null)
  }
})
test('independent review requires a publication date and does not infer a rating', () => {
  const entry = { ...approval, title: 'Fixture review', url: 'https://example.com/fixture', publishedOn: '2026-10-16' }
  assert.equal(reviewProof({ ...PUBLIC_PROOF, review: entry }), entry)
  assert.equal(reviewProof({ ...PUBLIC_PROOF, review: { ...entry, publishedOn: null } }), null)
  assert.equal(reviewProof({ ...PUBLIC_PROOF, review: { ...entry, approved: false } }), null)
})
