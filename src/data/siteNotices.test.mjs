import test from 'node:test'
import assert from 'node:assert/strict'
import { siteNoticeFor, sitesWithNotices } from './siteNotices.js'

test('Villa Living Room / Library carries the Y11S3 layout-change notice', () => {
  const n = siteNoticeFor('villa', 'living-library')
  assert.ok(n, 'the moved site is flagged until its plan is re-verified')
  assert.equal(n.since, 'Y11S3')
  assert.match(n.text, /moved this bomb site/)
})

test('normal sites have no notice; every notice has text', () => {
  assert.equal(siteNoticeFor('bank', 'ceo'), null)
  assert.equal(siteNoticeFor('nope', 'nope'), null)
  for (const { notice } of sitesWithNotices()) assert.ok(notice.text && notice.text.length > 20)
})
