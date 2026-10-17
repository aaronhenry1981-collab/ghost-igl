import { createHash, randomUUID } from 'node:crypto'

export function validateSubmission(body, now = new Date().toISOString()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please complete the form.')
  if (body.website) throw new Error('Unable to accept this submission.')
  const field = (key, max, min = 0) => {
    const value = typeof body[key] === 'string' ? body[key].trim() : ''
    if (value.length < min || value.length > max) throw new Error(`Check ${key}: use ${min}–${max} characters.`)
    return value
  }
  const name = field('name', 60, 1), text = field('text', 500, 20)
  const rank = field('rank', 40), hours = field('hours', 20), outcome = field('outcome', 300)
  const email = field('email', 254)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email or leave it blank.')
  if (!['first_name', 'gamertag', 'initials'].includes(body.displayPreference)) throw new Error('Choose how your name should appear.')
  if (body.honestExperience !== true) throw new Error('Confirm this describes your own experience.')
  if (body.photo || body.photoConsent) throw new Error('Photo uploads are not accepted. Arrange an optional photo separately after review.')
  return { id: randomUUID(), record_type: 'customer_submission', status: 'pending', name, text, rank, hours, outcome, email: email || null,
    display_preference: body.displayPreference, quote_consent: body.quoteConsent === true, photo_consent: false,
    photo: null, consent_version: '2026-10-17', consent_at: now, honest_experience: true, created_at: now, game_id: 'r6' }
}

export function publicTestimonial(item) {
  if (!item || item.id?.startsWith('__') || item.record_type === 'submission_rate') return null
  if (item.record_type === 'customer_submission' && (item.status !== 'approved' || item.quote_consent !== true)) return null
  return { id: item.id, name: item.name, text: item.text, rank: item.rank || null, hours: item.hours || null,
    tier: item.tier || null, featured: !!item.featured, created_at: item.created_at,
    ...(item.record_type === 'customer_submission' && item.photo_consent && item.photo ? { photo: item.photo } : {}) }
}

export function moderateSubmission(item, action, reviewer, now = new Date().toISOString()) {
  if (!item || item.record_type !== 'customer_submission' || item.status !== 'pending') throw new Error('This submission is no longer pending.')
  if (!['approve', 'reject'].includes(action)) throw new Error('Choose approve or reject.')
  if (action === 'approve' && !item.quote_consent) throw new Error('The customer did not grant publication permission.')
  return { ...item, status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: now, reviewed_by: reviewer,
    ...(action === 'reject' ? { photo: null, email: null } : {}) }
}

export function rateRecord(subject, now = Date.now(), delayMs = 60000) {
  if (typeof subject !== 'string' || !subject) throw new Error('Verified account unavailable.')
  return { id: '__submission_rate__' + createHash('sha256').update(subject).digest('hex'), record_type: 'submission_rate', next_allowed: now + delayMs }
}
