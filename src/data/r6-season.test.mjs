import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CURRENT_R6_SEASON,
  UPCOMING_R6_SEASON,
  SPLIT_FIRE_LAUNCH_ANNOUNCEMENT,
  Y11S31_BALANCE_CHANGES,
  Y11S31_NOOR_FIXES,
  Y11S31_PATCH_NOTES_URL,
  balanceChangesFor,
} from './r6-season.js'
import { LIVE_RULESET } from './operatorTraining.js'

// Values copied from Ubisoft's official Y11S3.1 patch notes (September 22, 2026).
const OFFICIAL = {
  'buck-skeleton-key-ammo': { operators: ['Buck'], item: 'Skeleton Key', before: '31', after: '36' },
  'castle-armor-panel-melee': { operators: ['Castle'], item: 'Armor Panel', before: '9', after: '10' },
  'fenrir-dread-mine-gas': { operators: ['Fenrir'], item: 'F-NATT Dread Mine', before: '2 seconds', after: '1.9 seconds' },
  'maestro-evil-eye-battery': { operators: ['Maestro'], item: 'Evil Eye', before: '8 seconds', after: '9 seconds' },
  'thermite-exothermic-damage': { operators: ['Thermite'], item: 'Exothermic Charge', before: '200 HP', after: '220 HP' },
  'sledge-hammer-swing': { operators: ['Sledge'], item: 'Breaching Hammer', before: '1 second', after: '0.8 seconds' },
  'm1014-damage': { operators: ['Ace', 'Castle', 'Pulse', 'Thermite'], item: 'M1014', before: '28 HP', after: '30 HP' },
  'spas15-damage': { operators: ['Caveira', 'Thunderbird'], item: 'SPAS-15', before: '24 HP', after: '26 HP' },
}

test('live season is Operation Split Fire, patch Y11S3.1, sourced to the official notes', () => {
  assert.equal(CURRENT_R6_SEASON.code, 'Y11S3.1')
  assert.equal(CURRENT_R6_SEASON.season, 'Y11S3')
  assert.equal(CURRENT_R6_SEASON.name, 'Operation Split Fire')
  assert.equal(CURRENT_R6_SEASON.patchDate, '2026-09-22')
  assert.equal(CURRENT_R6_SEASON.patchDateLabel, 'September 22, 2026')
  assert.equal(CURRENT_R6_SEASON.patchNotesUrl, 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/3WMly2DNZqv1GpUK9GNGm5/y11s31-patch-notes')
  assert.equal(CURRENT_R6_SEASON.sourceUrl, Y11S31_PATCH_NOTES_URL)
  assert.equal(UPCOMING_R6_SEASON, null, 'no next season has been reviewed')
  assert.equal(SPLIT_FIRE_LAUNCH_ANNOUNCEMENT.status, 'launched')
})

test('every Y11S3.1 refinement change matches the official notes exactly', () => {
  assert.equal(Y11S31_BALANCE_CHANGES.length, 8)
  for (const change of Y11S31_BALANCE_CHANGES) {
    const official = OFFICIAL[change.id]
    assert.ok(official, `unexpected change ${change.id}`)
    assert.deepEqual([...change.operators], official.operators, change.id)
    assert.equal(change.item, official.item, change.id)
    assert.equal(change.before, official.before, change.id)
    assert.equal(change.after, official.after, change.id)
    const afterNumber = official.after.split(' ')[0]
    const beforeNumber = official.before.split(' ')[0]
    assert.match(change.summary, new RegExp(`\\b${afterNumber.replace('.', '\\.')}\\b`), `${change.id} summary states the new value`)
    assert.match(change.summary, new RegExp(`\\(was ${beforeNumber}\\b`), `${change.id} summary labels the old value as historical`)
  }
})

test('changes are attached to exactly the operators Ubisoft lists', () => {
  const items = (name) => balanceChangesFor(name).map((c) => c.item).sort()
  assert.deepEqual(items('Buck'), ['Skeleton Key'])
  assert.deepEqual(items('Castle'), ['Armor Panel', 'M1014'])
  assert.deepEqual(items('Fenrir'), ['F-NATT Dread Mine'])
  assert.deepEqual(items('Maestro'), ['Evil Eye'])
  assert.deepEqual(items('Thermite'), ['Exothermic Charge', 'M1014'])
  assert.deepEqual(items('Sledge'), ['Breaching Hammer'])
  assert.deepEqual(items('Ace'), ['M1014'])
  assert.deepEqual(items('Pulse'), ['M1014'])
  assert.deepEqual(items('Caveira'), ['SPAS-15'])
  assert.deepEqual(items('Thunderbird'), ['SPAS-15'])
  assert.deepEqual(items('Noor'), [])
  assert.deepEqual(items('Montagne'), [])
})

test('Noor guidance states the corrected behaviour and never the fixed bug as current', () => {
  assert.equal(Y11S31_NOOR_FIXES.length, 12)
  const text = Y11S31_NOOR_FIXES.join('\n')
  assert.match(text, /Le Roc Shield no longer auto-retracts just because a Horus Lance hits it/)
  assert.match(text, /Shield Operators can throw devices while affected by a Horus Lance/)
  assert.match(text, /against a wall no longer prevents its damage/)
  assert.match(text, /Cancelling the animation no longer removes a Horus Lance immediately/)
  for (const line of Y11S31_NOOR_FIXES) {
    assert.doesNotMatch(line, /\b(can't|cannot|unable to) throw\b/i, line)
    assert.doesNotMatch(line, /\b(should|try|use this|abuse|exploit)\b/i, `${line} must not read as a tactic`)
  }
})

test('areas the Y11S3.1 notes do not change are carried over untouched', () => {
  assert.deepEqual([...CURRENT_R6_SEASON.rankedMapIds], [
    'bank', 'border', 'calypso-casino', 'chalet', 'clubhouse', 'consulate', 'fortress',
    'kafe', 'kanal', 'lair', 'nighthaven', 'oregon', 'theme-park', 'villa',
  ])
  assert.equal(CURRENT_R6_SEASON.rankedVerifiedOn, '2026-08-23', 'the ranked facts keep their original verification date')
  assert.equal(CURRENT_R6_SEASON.officialMapIndexCount, 27)
  const legend = SPLIT_FIRE_LAUNCH_ANNOUNCEMENT.highlights.find((h) => h.title === 'Legend Division')
  assert.match(legend.summary, /SoloQ-only playlist/)
  const villa = SPLIT_FIRE_LAUNCH_ANNOUNCEMENT.highlights.find((h) => h.title === 'Villa targeted update')
  assert.match(villa.summary, /basement and garage/)
})

test('training ruleset follows the central season snapshot', () => {
  assert.equal(LIVE_RULESET.season, 'Operation Split Fire')
  assert.equal(LIVE_RULESET.patch, 'Y11S3.1')
  assert.equal(LIVE_RULESET.patchDate, '2026-09-22')
  assert.deepEqual([...LIVE_RULESET.trainingPlaylists], ['Shooting Range', 'Clear House', 'Field Training', 'Quick Match', 'Custom Game'])
})

test('generated operator pages carry the Y11S3.1 facts for every affected operator', () => {
  const page = (slug) => readFileSync(new URL(`../../public/blog/r6-operator-${slug}.html`, import.meta.url), 'utf8')
  const expect = {
    buck: ['Skeleton Key total ammo increased to 36 (was 31).'],
    castle: ['An Armor Panel now takes 10 melee hits to destroy (was 9).', 'M1014 damage increased to 30 (was 28).'],
    maestro: ['Evil Eye battery life increased to 9 seconds (was 8 seconds).'],
    thermite: ['Exothermic Charge damage increased to 220 HP (was 200 HP).', 'M1014 damage increased to 30 (was 28).'],
    sledge: ['Breaching Hammer swing time reduced to 0.8 seconds (was 1 second).'],
    ace: ['M1014 damage increased to 30 (was 28).'],
    pulse: ['M1014 damage increased to 30 (was 28).'],
    caveira: ['SPAS-15 damage increased to 26 (was 24).'],
    thunderbird: ['SPAS-15 damage increased to 26 (was 24).'],
  }
  for (const [slug, lines] of Object.entries(expect)) {
    const html = page(slug)
    assert.match(html, /Y11S3\.1 update \(September 22, 2026\)/, slug)
    assert.match(html, /y11s31-patch-notes/, `${slug} links the official notes`)
    for (const line of lines) assert.ok(html.includes(line), `${slug}: ${line}`)
  }
  const castle = page('castle')
  assert.doesNotMatch(castle, /Universal Breaching Shield/)
  assert.doesNotMatch(castle, /4-6 hits/)
  assert.match(castle, /<strong>Gadget:<\/strong> Armor Panel/)
  assert.doesNotMatch(page('sledge'), /silently and instantly/)
})

test('the workbook page no longer calls Split Fire upcoming', () => {
  const src = readFileSync(new URL('../pages/BeginnerGuidePage.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /Upcoming · not live/)
  assert.doesNotMatch(src, /UPCOMING_R6_SEASON/)
  assert.match(src, /CURRENT_R6_SEASON\.patchNotesUrl/)
  assert.match(src, /Current as of \{CURRENT_R6_SEASON\.rankedVerifiedOn\}/)
})
