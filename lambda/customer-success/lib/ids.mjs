// Identifier helpers shared by the Lambda and the fixtures.
//
// `reconPlayerIdFor` must stay byte-for-byte compatible with
// lambda/player-data/core.mjs so the CRM links to the same player-data record.
// ids.test.mjs checks that against the real implementation.

import { createHash, createHmac } from 'node:crypto'

// Decision D-C1: in production the contact key is an HMAC keyed by a secret
// (SSM SecureString, loaded by index.mjs at cold start), so knowing a
// player's email is not enough to compute their key. Tests and fixtures run
// unkeyed (v1) so their keys stay deterministic.
let contactKeySecret = null

export function configureContactKeySecret(secret) {
  const value = secret == null ? null : String(secret)
  if (value !== null && value.length < 32) throw new Error('contact key secret must be at least 32 characters')
  contactKeySecret = value
}

export function contactKeyIsKeyed() {
  return contactKeySecret !== null
}

export function reconPlayerIdFor(ownerUserId) {
  const value = String(ownerUserId || '').trim()
  if (!value) throw new Error('ownerUserId is required')
  const digest = createHash('sha256').update(`recon-player:v1:${value}`).digest('hex').slice(0, 24)
  return `RP-${digest}`
}

// Opaque, URL-safe CRM key for a contact. Emails never go in admin URLs, logs
// or analytics; this key is resolved back to the contact server-side.
export function contactKeyFor(email) {
  const value = String(email || '').trim().toLowerCase()
  if (!value) throw new Error('email is required')
  const digest = contactKeySecret
    ? createHmac('sha256', contactKeySecret).update(`recon-contact:v2:${value}`).digest('hex')
    : createHash('sha256').update(`recon-contact:v1:${value}`).digest('hex')
  return `pl_${digest.slice(0, 20)}`
}
