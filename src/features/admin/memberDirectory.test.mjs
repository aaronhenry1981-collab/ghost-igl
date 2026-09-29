// Admin member directory: search, name status, filters, sorting, pagination
// and exports. All people are fictional.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  accountIdOf, csvCell, directoryCounts, emailsOnly, filterMembers, findMember, fullNameOf,
  matchesQuery, membersCsv, nameStatusOf, paginate, sortMembers,
} from './memberDirectory.mjs'

const jordan = { username: 'u-1', email: 'jordan.reyes@example.test', first_name: 'Jordan', last_name: 'Reyes', plan: 'pro', billing_state: 'paid', sub_status: 'active', live_subscription_count: 1, created_at: '2026-09-01T00:00:00Z', last_seen_at: '2026-09-28T10:00:00Z' }
const zoe = { username: 'u-2', email: 'zm@example.test', first_name: 'Zoë', last_name: "O'Neill-Park", plan: 'champion', billing_state: 'trialing', sub_status: 'trialing', live_subscription_count: 1, created_at: '2026-09-05T00:00:00Z' }
const cher = { username: 'u-3', email: 'cher@example.test', first_name: 'Cher', plan: 'free', sub_status: 'none', created_at: '2026-08-01T00:00:00Z' }
const handle = { username: 'u-4', email: 'xx.slayer@example.test', display_name: 'xXSlayerXx', name_review: [{ source: 'stripe', value: 'Slayer', reason: 'one word' }], plan: 'free', sub_status: 'none', created_at: '2026-07-01T00:00:00Z' }
const orphan = { username: null, email: 'paid.no.account@example.test', cognito_status: 'NO_ACCOUNT', orphan: true, stripe_customer_id: 'cus_FIXTURE1', plan: 'pro', sub_status: 'active', live_subscription_count: 1, billing_state: 'paid' }
const jordanTwo = { username: 'u-6', email: 'another.jordan@example.test', first_name: 'Jordan', last_name: 'Reyes', plan: 'free', sub_status: 'none', created_at: '2026-06-01T00:00:00Z' }
const ALL = [jordan, zoe, cher, handle, orphan, jordanTwo]

test('search: first, last, full name or email; partial, case-insensitive, extra spaces, accents', () => {
  assert.ok(matchesQuery(jordan, 'jordan'))
  assert.ok(matchesQuery(jordan, 'REYES'))
  assert.ok(matchesQuery(jordan, '  Jordan    Reyes  '), 'full name with extra spaces')
  assert.ok(matchesQuery(jordan, 'reyes jordan'), 'word order does not matter')
  assert.ok(matchesQuery(jordan, 'jor rey'), 'partial words')
  assert.ok(matchesQuery(jordan, 'JORDAN.REYES@EXAMPLE'), 'partial email, any case')
  assert.ok(matchesQuery(zoe, 'zoe o\'neill'), 'accent-insensitive')
  assert.ok(matchesQuery(orphan, 'cus_fixture1'), 'Stripe id still searchable')
  assert.ok(matchesQuery(handle, 'slayerxx'), 'gamer display name')
  assert.ok(!matchesQuery(jordan, 'jordan smith'))
  assert.ok(matchesQuery(jordan, '   '), 'blank query matches everyone')
  assert.deepEqual(filterMembers(ALL, { q: 'jordan reyes' }).map((m) => m.username), ['u-1', 'u-6'], 'the complete directory is searched')
})

test('name status: full, single-name, review and missing are distinct', () => {
  assert.equal(nameStatusOf(jordan), 'complete')
  assert.equal(nameStatusOf(cher), 'single', 'a single-name member is not "missing"')
  assert.equal(nameStatusOf({ last_name: 'Only' }), 'single')
  assert.equal(nameStatusOf(handle), 'review')
  assert.equal(nameStatusOf(orphan), 'missing')
  assert.equal(fullNameOf(cher), 'Cher')
  assert.deepEqual(directoryCounts(ALL), { total: 6, complete: 3, single: 1, review: 1, missing: 1 })
})

test('filters combine status, plan and name', () => {
  assert.deepEqual(filterMembers(ALL, { name: 'needs' }).map((m) => m.email), [handle.email, orphan.email])
  assert.deepEqual(filterMembers(ALL, { name: 'single' }).map((m) => m.email), [cher.email])
  assert.deepEqual(filterMembers(ALL, { plan: 'pro', status: 'paid' }).map((m) => m.email), [jordan.email, orphan.email])
  assert.deepEqual(filterMembers(ALL, { status: 'stripe_only' }).map((m) => m.email), [orphan.email])
  assert.deepEqual(filterMembers(ALL, { status: 'trialing', q: 'zoe' }).map((m) => m.email), [zoe.email])
  assert.equal(filterMembers(ALL, { status: 'no-such-filter' }).length, ALL.length, 'unknown filter ids fall back to all')
})

test('sorting: name sorts by family name with single names by what they have; unnamed last', () => {
  const byName = sortMembers(ALL, 'name').map((m) => m.email)
  assert.deepEqual(byName.slice(0, 4), [cher.email, zoe.email, jordanTwo.email, jordan.email])
  assert.deepEqual(byName.slice(4), [handle.email, orphan.email].sort(), 'members without a name follow, by email')
  const joined = sortMembers(ALL, 'joined').map((m) => m.username)
  assert.deepEqual(joined.slice(0, 2), ['u-2', 'u-1'])
  assert.equal(joined.at(-1), null, 'no created date sorts last')
  assert.equal(sortMembers(ALL, 'active')[0].username, 'u-1')
  assert.notEqual(sortMembers(ALL, 'name'), ALL, 'returns a copy')
})

test('pagination clamps pages and reports the visible range', () => {
  const list = Array.from({ length: 60 }, (_, i) => ({ email: `p${i}@example.test` }))
  assert.deepEqual({ ...paginate(list, 3, 25), items: undefined }, { items: undefined, page: 3, pages: 3, pageSize: 25, total: 60, from: 51, to: 60 })
  assert.equal(paginate(list, 99, 25).page, 3)
  assert.equal(paginate(list, -1, 25).page, 1)
  assert.equal(paginate(list, 1, 7).pageSize, 25, 'only offered page sizes')
  assert.deepEqual({ ...paginate([], 1, 25), items: undefined }, { items: undefined, page: 1, pages: 1, pageSize: 25, total: 0, from: 0, to: 0 })
})

test('CSV export has names and email; copy-emails has emails only', () => {
  const csv = membersCsv([jordan, cher, orphan])
  const [header, first, second, third] = csv.trim().split('\r\n')
  assert.match(header, /^account_id,first_name,last_name,full_name,email,name_status,plan,/)
  assert.match(first, /^u-1,Jordan,Reyes,Jordan Reyes,jordan\.reyes@example\.test,complete,pro,/)
  assert.match(second, /^u-3,Cher,,Cher,cher@example\.test,single,/)
  assert.match(third, /^stripe:cus_FIXTURE1,,,,paid\.no\.account@example\.test,missing,/)
  const copied = emailsOnly([jordan, cher, jordan, { email: '' }])
  assert.equal(copied, 'jordan.reyes@example.test, cher@example.test')
  assert.doesNotMatch(copied, /Jordan|Reyes|Cher\b/, 'no names in the copied list')
})

test('CSV cells are escaped and cannot run as spreadsheet formulas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
  assert.equal(csvCell('+1'), "'+1")
  assert.equal(csvCell('Reyes, Jordan'), '"Reyes, Jordan"')
  assert.equal(csvCell(['duplicate', 'past_due']), 'duplicate; past_due')
  assert.equal(csvCell(null), '')
})

test('identity: stable account ids, never merged or found by name', () => {
  assert.equal(accountIdOf(jordan), 'u-1')
  assert.equal(accountIdOf(orphan), 'stripe:cus_FIXTURE1')
  assert.equal(accountIdOf({ email: 'X@Example.test' }), 'email:x@example.test')
  assert.notEqual(accountIdOf(jordan), accountIdOf(jordanTwo), 'same name, different people')
  assert.equal(findMember(ALL, 'u-6').email, jordanTwo.email)
  assert.equal(findMember(ALL, 'Jordan Reyes'), null)
})
