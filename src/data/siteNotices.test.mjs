import test from 'node:test'
import assert from 'node:assert/strict'
import { siteNoticeFor, sitesWithNotices } from './siteNotices.js'
import STRATS from './strats.js'
import PUBLIC_STRATS from './public-strats.generated.js'
import * as PREMIUM from './premium-tactics.js'
import * as ENEMY from './enemyMeta.js'

test('Villa\'s moved site (Y11S3 basement) is marked withdrawn', () => {
  const n = siteNoticeFor('villa', 'living-library')
  assert.ok(n, 'the moved site stays flagged until a verified plan exists')
  assert.equal(n.kind, 'unavailable')
  assert.equal(n.since, 'Y11S3')
  assert.match(n.text, /withdrawn/)
})

test('a withdrawn site has no plan anywhere, so nothing can serve the old one', () => {
  const tables = { STRATS, PUBLIC_STRATS, PREMIUM: PREMIUM.default || Object.values(PREMIUM)[0], ENEMY: ENEMY.default || Object.values(ENEMY)[0] }
  for (const { mapId, siteId, notice } of sitesWithNotices()) {
    if (notice.kind !== 'unavailable') continue
    for (const [name, table] of Object.entries(tables)) {
      assert.equal(table?.[mapId]?.[siteId], undefined, `${name} still has a plan for withdrawn ${mapId}/${siteId}`)
    }
  }
})

test('normal sites have no notice; every notice has text', () => {
  assert.equal(siteNoticeFor('bank', 'ceo'), null)
  assert.equal(siteNoticeFor('nope', 'nope'), null)
  for (const { notice } of sitesWithNotices()) assert.ok(notice.text && notice.text.length > 20)
})
