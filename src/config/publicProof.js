// Public-safe evidence only. Approval records and source exports stay outside the
// client bundle. See docs/audits/2026-10-17-heycatch.md for publication requirements.
export const PUBLIC_PROOF = Object.freeze({
  community: null, // { approved, verifiedOn, metric: 'registered_accounts' | 'players_coached', count }
  members: [], // { approved, name, image: '/proof/...', verifiedOn }; permission required
  testimonials: [], // { approved, id, name, text, rank, hours, image, verifiedOn }
  testimonialPhotos: {}, // Existing testimonial ID -> approved member photo record
  founder: null, // { approved, name, image, profileUrl, profileLabel, verifiedOn }
  review: null, // { approved, title, url, publishedOn, verifiedOn }; no inferred rating
})

const dated = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value))
export const approvedProof = (record) => record?.approved === true && dated(record.verifiedOn)
export const localProofImage = (value) => typeof value === 'string' && /^\/proof\/[a-z0-9/_-]+\.(webp|avif|png|jpg)$/i.test(value)
export function publicHttpsUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password }
  catch { return false }
}
export function communityProof(data = PUBLIC_PROOF) {
  const item = data.community
  const labels = { registered_accounts: 'registered accounts', players_coached: 'players coached' }
  if (!approvedProof(item) || !labels[item.metric] || !Number.isSafeInteger(item.count) || item.count <= 0) return null
  return { ...item, label: labels[item.metric], members: data.members.filter(m => approvedProof(m) && m.name && localProofImage(m.image)).slice(0, 20) }
}
export function testimonialPhoto(item, data = PUBLIC_PROOF) {
  const photo = data.testimonialPhotos[item.id]
  return approvedProof(photo) && localProofImage(photo.image) ? photo.image : null
}
export function approvedTestimonials(data = PUBLIC_PROOF) {
  return data.testimonials.filter(t => approvedProof(t) && t.id && t.name && t.text && t.rank && localProofImage(t.image))
}
export function founderProof(data = PUBLIC_PROOF) {
  const item = data.founder
  return approvedProof(item) && item.name === 'Aaron Henry' && localProofImage(item.image) && publicHttpsUrl(item.profileUrl) && item.profileLabel ? item : null
}
export function reviewProof(data = PUBLIC_PROOF) {
  const item = data.review
  return approvedProof(item) && dated(item.publishedOn) && item.title && publicHttpsUrl(item.url) ? item : null
}
