// Contract between the support backend and the support UI.
//  1. A fresh in-memory run of the real backend still produces every field
//     the UI reads (src/features/support/contract.mjs).
//  2. The committed snapshots (src/features/support/fixtures/generated) are
//     exactly what the backend produces now; if not, regenerate them:
//       node scripts/support/generate-fixtures.mjs
//  3. The UI's copies of backend vocabularies (categories, resolution codes,
//     queue views, transitions, attachment types, teams, action kinds,
//     buckets) equal the backend's.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSnapshots, CONTRACT_DOC, contractDocWith, FILES, OUT_DIR, serialize } from './generate-fixtures.mjs'
import { checkContract } from '../../src/features/support/contract.mjs'
import * as ui from '../../src/features/support/supportLogic.mjs'
import { HELP_SECTIONS } from '../../src/features/support/helpText.mjs'
import * as items from '../../lambda/customer-success/support/items.mjs'
import * as wf from '../../lambda/customer-success/support/workflow.mjs'
import { ACTION_KINDS, ATTACHMENT_MIME, BILLING_ACTION_KINDS, QUEUE_VIEWS } from '../../lambda/customer-success/support/service.mjs'

const fresh = await buildSnapshots()

test('a fresh backend run satisfies the UI contract', () => {
  const problems = checkContract(fresh)
  assert.deepEqual(problems, [], problems.join('\n'))
})

test('committed snapshots are current (regenerate with node scripts/support/generate-fixtures.mjs)', () => {
  for (const name of FILES) {
    const committed = readFileSync(join(OUT_DIR, `${name}.json`), 'utf8').replace(/\r\n/g, '\n')
    assert.equal(committed, serialize(fresh[name]), `${name}.json drifted from the backend`)
  }
})

test('docs/player-success/API-CONTRACT.md response shapes are current', () => {
  const doc = readFileSync(CONTRACT_DOC, 'utf8').split('\r\n').join('\n')
  assert.equal(doc, contractDocWith(fresh, doc), 'regenerate with node scripts/support/generate-fixtures.mjs')
  assert.match(doc, /BEGIN GENERATED SHAPES/)
})

test('the generator is deterministic', async () => {
  const again = await buildSnapshots()
  for (const name of FILES) assert.equal(serialize(again[name]), serialize(fresh[name]), name)
})

test('UI vocabularies equal the backend vocabularies', () => {
  assert.deepEqual(ui.CATEGORIES.map((c) => c.id).sort(), [...items.CATEGORIES].sort(), 'categories')
  assert.deepEqual(ui.RESOLUTION_CODES.map((c) => c.id).sort(), [...items.RESOLUTION_CODES].sort(), 'resolution codes')
  assert.deepEqual(ui.TEAMS.map((t) => t.id).sort(), [...items.TEAMS].sort(), 'teams')
  assert.deepEqual(ui.QUEUE_VIEWS.map((v) => v.id).sort(), [...QUEUE_VIEWS].sort(), 'queue views')
  assert.deepEqual(ui.ACTION_KINDS.map((a) => a.id).sort(), [...ACTION_KINDS].sort(), 'action kinds')
  assert.deepEqual([...ui.BILLING_ACTION_KINDS].sort(), [...BILLING_ACTION_KINDS].sort(), 'billing action kinds')
  assert.deepEqual([...ui.ATTACHMENT_TYPES].sort(), [...ATTACHMENT_MIME].sort(), 'attachment types')
  assert.deepEqual([...ui.CASE_STATUSES].sort(), [...wf.STATUSES].sort(), 'statuses')
  assert.deepEqual(ui.BUCKET_IDS, Object.keys(wf.PLAYER_BUCKETS), 'player buckets')
  for (const b of ui.BUCKETS) assert.deepEqual([...b.statuses].sort(), [...wf.PLAYER_BUCKETS[b.id]].sort(), `bucket ${b.id}`)
  for (const s of wf.STATUSES) assert.deepEqual(ui.staffTransitions(s).sort(), wf.allowedTargets(s, 'staff').sort(), `staff transitions from ${s}`)
  for (const section of HELP_SECTIONS) for (const c of [section.category, ...section.categories]) assert.ok(items.CATEGORIES.includes(c), `help section ${section.id}: ${c}`)
})
