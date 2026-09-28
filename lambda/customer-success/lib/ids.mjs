// Identifier helpers shared by the Lambda and the fixtures.
//
// `reconPlayerIdFor` must stay byte-for-byte compatible with
// lambda/player-data/core.mjs so the CRM links to the same player-data record.
// ids.test.mjs checks that against the real implementation.

import { createHash } from 'node:crypto'

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
  return `pl_${createHash('sha256').update(`recon-contact:v1:${value}`).digest('hex').slice(0, 20)}`
}
