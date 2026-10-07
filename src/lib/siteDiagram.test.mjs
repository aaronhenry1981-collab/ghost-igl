import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDiagramZones, diagramAlt, diagramSummary } from './siteDiagram.mjs'

test('builds a four-zone attack picture from the selected strategy', () => {
  const zones = buildDiagramZones({
    callouts: ['Roof', 'Hall', 'Breach', 'Plant'],
    operators: [{ name: 'Thermite', role: 'Hard Breach' }, { name: 'Nomad', role: 'Flank Watch' }],
  }, 'attack', ['DRONE', 'TAKE SPACE', 'EXECUTE', 'CLOSE'])

  assert.equal(zones.length, 4)
  assert.deepEqual(zones.map((zone) => zone.label), ['Roof', 'Hall', 'Breach', 'Plant'])
  assert.equal(zones[0].operator, 'Thermite')
  assert.equal(zones[2].operator, 'Thermite')
  assert.equal(zones[3].phase, 'CLOSE')
})

test('uses honest priority-zone fallbacks when strategy data is thin', () => {
  const zones = buildDiagramZones({ callouts: ['Site'] }, 'defense', ['BUILD', 'DENY', 'HOLD', 'RETAKE'])
  assert.deepEqual(zones.map((zone) => zone.label), ['Site', 'Breach denial', 'Power position', 'Retake lane'])
  assert.match(diagramSummary(zones, 'defense'), /not an exact floor plan/i)
})

test('alt text names the diagram, the site, and each operator job', () => {
  const zones = buildDiagramZones({
    callouts: ['CEO', 'Executive Lounge', 'Janitor', 'Skylight'],
    operators: [
      { name: 'Thermite', role: 'Hard Breach' }, { name: 'Thatcher', role: 'Support' },
      { name: 'Sledge', role: 'Vertical Play' }, { name: 'Nomad', role: 'Flank Watch' },
    ],
  }, 'attack', ['DRONE', 'TAKE SPACE', 'EXECUTE', 'CLOSE'])
  assert.equal(
    diagramAlt(zones, 'attack', 'Bank', 'CEO Office'),
    'Attack execution path diagram for Bank CEO Office showing four operator jobs: CEO (Thermite), Executive Lounge (Thatcher), Janitor (Sledge), Skylight (Nomad)',
  )
  const empty = buildDiagramZones({}, 'defense', ['BUILD', 'DENY', 'HOLD', 'RETAKE'])
  assert.equal(diagramAlt(empty, 'defense', 'Kafe Dostoyevsky', ''), 'Defense setup diagram for Kafe Dostoyevsky showing no operator jobs')
})
