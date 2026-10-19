import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const page = readFileSync(new URL('./VodPage.jsx', import.meta.url), 'utf8')
const upload = readFileSync(new URL('../components/vod/SessionUploadZone.jsx', import.meta.url), 'utf8')
const youtube = readFileSync(new URL('../components/vod/YoutubeSubmission.jsx', import.meta.url), 'utf8')
test('review entry and demo copy do not promise causal diagnosis, habits or unconditional saving', () => {
  assert.doesNotMatch(page + upload, /moment that cost the round|finds the recurring mistake|spot a recurring mistake|saves the lesson|Unlimited VOD sessions/)
  assert.match(page, /Rejected or timed-out reviews are not saved/)
  assert.match(page, /may still use an allowance attempt/)
  assert.match(upload, /do not prove recurring habits or actions between frames/)
})
test('YouTube remains a manual Support submission separate from screenshot analysis', () => {
  assert.match(youtube, /Support for manual review/)
  assert.match(youtube, /does not run video analysis or use a screenshot review/)
  assert.match(youtube, /Review availability and timing are not guaranteed/)
  assert.match(youtube, /Submit for manual review/)
})
