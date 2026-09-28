import test from 'node:test'
import assert from 'node:assert/strict'
import MAPS from './maps.js'
import { CURRENT_R6_SEASON } from './r6-season.js'

// Audit P0-12: the UI (maps.js rankedPool) and the season record disagreed
// on six maps. The season record is the single source; this keeps them equal.
test('maps.js rankedPool matches the verified season Ranked pool', () => {
  const ui = MAPS.filter((m) => m.rankedPool).map((m) => m.id).sort()
  const season = [...CURRENT_R6_SEASON.rankedMapIds].sort()
  assert.deepEqual(ui, season)
})

test('every Ranked map id exists in maps.js', () => {
  const ids = new Set(MAPS.map((m) => m.id))
  for (const id of CURRENT_R6_SEASON.rankedMapIds) assert.ok(ids.has(id), id)
})
