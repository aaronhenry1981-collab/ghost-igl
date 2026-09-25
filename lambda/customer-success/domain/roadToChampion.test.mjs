import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CLIMB_TIERS, CLIMB_TASK_TOTAL, summarizeRoadToChampion, tierIdForRank } from './roadToChampion.mjs'

// Drift guard: the static /climb page is the source of the checklist.
function tiersFromClimbPage() {
  // The page may be checked out with CRLF line endings on Windows.
  const html = readFileSync(new URL('../../../public/climb/index.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const start = html.indexOf('const TIERS = [')
  assert.notEqual(start, -1, 'public/climb/index.html must define const TIERS')
  const body = html.slice(start)
  const tiers = []
  const tierPattern = /id:"([a-z]+)",\s*rank:"([^"]+)",\s*color:[^,]+,\s*theme:"([^"]+)"/g
  let match
  while ((match = tierPattern.exec(body)) && tiers.length < 20) {
    const tasksStart = body.indexOf('tasks:[', match.index)
    const tasksEnd = body.indexOf('\n watch:', tasksStart)
    const titles = [...body.slice(tasksStart, tasksEnd).matchAll(/\["([^"]+)",/g)].map((m) => m[1])
    tiers.push({ id: match[1], rank: match[2], theme: match[3], tasks: titles })
    if (match[1] === 'champ') break
  }
  return tiers
}

test('catalog matches the live /climb checklist (ids, ranks, themes, task titles)', () => {
  const page = tiersFromClimbPage()
  assert.equal(page.length, CLIMB_TIERS.length)
  page.forEach((tier, i) => {
    assert.equal(tier.id, CLIMB_TIERS[i].id)
    assert.equal(tier.rank, CLIMB_TIERS[i].rank)
    assert.equal(tier.theme, CLIMB_TIERS[i].theme)
    assert.deepEqual(tier.tasks, CLIMB_TIERS[i].tasks)
  })
  assert.equal(CLIMB_TASK_TOTAL, 40)
})

test('no saved progress is "not started" (null), never a fabricated 0%', () => {
  assert.equal(summarizeRoadToChampion(null), null)
  assert.equal(summarizeRoadToChampion({}), null)
  assert.equal(summarizeRoadToChampion({ checks: {} }), null)
})

test('summarises real checks and focuses on the player rank tier while unfinished', () => {
  const summary = summarizeRoadToChampion(
    { checks: { 'copper-0': true, 'copper-1': true, 'gold-0': true, 'gold-2': true } },
    { updatedAt: '2026-09-20T00:00:00.000Z', playerRank: 'Gold II' },
  )
  assert.equal(summary.tasksDone, 4)
  assert.equal(summary.tasksTotal, 40)
  assert.equal(summary.currentTier.id, 'gold')
  assert.equal(summary.currentTier.done, 2)
  assert.equal(summary.currentTier.nextTask, 'Run default site setups')
})

test('without a rank the focus is the first unfinished tier', () => {
  const checks = Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`copper-${i}`, true]))
  const summary = summarizeRoadToChampion({ checks })
  assert.equal(summary.tiersComplete, 1)
  assert.equal(summary.currentTier.id, 'bronze')
  assert.equal(summary.currentTier.nextTask, '10-minute warmup, every session')
})

test('rank strings map to tiers', () => {
  assert.equal(tierIdForRank('Platinum III'), 'plat')
  assert.equal(tierIdForRank('champion'), 'champ')
  assert.equal(tierIdForRank('Emerald'), 'emerald')
  assert.equal(tierIdForRank('Unranked'), null)
})
