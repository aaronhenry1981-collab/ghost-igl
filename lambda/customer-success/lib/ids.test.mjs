import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { configureContactKeySecret, contactKeyFor, contactKeyIsKeyed } from './ids.mjs'

// Decision D-C1: production keys are HMACs, so an email alone cannot be
// turned into a player's CRM key. Every route validates this exact format.
const KEY = /^pl_[a-f0-9]{20}$/
const EMAIL = 'Player.A@Example.test'
const SECRET = ['fixture', 'contact', 'key', 'secret', '0123456789abcdef'].join('-')

test('unkeyed by default: deterministic v1 keys for tests and fixtures', () => {
  configureContactKeySecret(null)
  assert.equal(contactKeyIsKeyed(), false)
  const v1 = `pl_${createHash('sha256').update('recon-contact:v1:player.a@example.test').digest('hex').slice(0, 20)}`
  assert.equal(contactKeyFor(EMAIL), v1)
})

test('keyed: the key is not derivable from the email, keeps the route format, and is stable', () => {
  try {
    configureContactKeySecret(null)
    const unkeyed = contactKeyFor(EMAIL)
    configureContactKeySecret(SECRET)
    assert.equal(contactKeyIsKeyed(), true)
    const keyed = contactKeyFor(EMAIL)
    assert.match(keyed, KEY)
    assert.notEqual(keyed, unkeyed, 'the public unkeyed hash must not be the production key')
    assert.equal(contactKeyFor('  player.a@example.TEST '), keyed, 'normalised like before')
    configureContactKeySecret(`${SECRET}-other`)
    assert.notEqual(contactKeyFor(EMAIL), keyed, 'a different secret gives a different key')
  } finally {
    configureContactKeySecret(null)
  }
})

test('a short or empty secret is refused', () => {
  assert.throws(() => configureContactKeySecret('too-short'))
  assert.throws(() => configureContactKeySecret(''))
  assert.equal(contactKeyIsKeyed(), false)
})
