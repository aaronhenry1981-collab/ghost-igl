// The committed backend snapshots still carry every field the UI reads
// (contract.mjs). scripts/support/contract.test.mjs regenerates them from a
// fresh in-memory backend run and checks they are current.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkContract } from './contract.mjs'

const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/generated/${name}.json`, import.meta.url), 'utf8'))
const bundle = () => Object.fromEntries(['meta', 'player', 'staff', 'help', 'errors'].map((n) => [n, load(n)]))

test('committed support snapshots satisfy the UI contract', () => {
  const problems = checkContract(bundle())
  assert.deepEqual(problems, [], problems.join('\n'))
})

test('the checker catches drift: a renamed or dropped field fails', () => {
  const b = bundle()
  const firstCase = Object.values(b.staff.cases)[0]
  firstCase.case.slaState = { ...firstCase.case.slaState }
  delete firstCase.case.slaState.state
  const queue = b.staff.queue.all_open
  queue.items = queue.cases
  delete queue.cases
  b.player.list.buckets.waitingOnMe = b.player.list.buckets.waiting_on_me
  delete b.player.list.buckets.waiting_on_me
  b.errors.versionConflict.code = 'conflict'
  const problems = checkContract(b)
  assert.ok(problems.some((p) => p.includes('case.slaState.state')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('GET /cs/admin/support/queue') && p.includes('cases')))
  assert.ok(problems.some((p) => p.includes('buckets.waiting_on_me')))
  assert.ok(problems.some((p) => p.includes('version_conflict')))
})

test('snapshots are fictional: example domains only, no live-looking secrets', () => {
  const text = JSON.stringify(bundle())
  const emails = [...new Set(text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || [])]
  assert.ok(emails.length > 0)
  for (const e of emails) assert.match(e, /@(?:[\w-]+\.)*example\.(?:test|org|com)$|@r6coaching\.com$/i, e)
  assert.doesNotMatch(text, /\b(?:sk|rk)_live_|\bwhsec_|\bAKIA[0-9A-Z]{16}\b/)
})
