import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import STRATS from '../src/data/strats.js'
import BANS from '../src/data/bans.js'
import ENEMY_META from '../src/data/enemyMeta.js'
import SQUAD_ROLES from '../src/data/squadRoles.js'
import VERIFIED_CALLOUTS from '../src/data/verified-callouts.js'
import { VERIFIED_SETUPS } from '../src/data/verified-setups.js'
import { CAPABILITIES, FLOOR_PRIORITY } from '../src/data/capabilities.js'
import { VARIATIONS } from '../src/data/variations.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function publicStrategyCatalog() {
  return Object.fromEntries(Object.entries(STRATS).map(([mapId, sites]) => [
    mapId,
    Object.fromEntries(Object.entries(sites).map(([siteId, sides]) => [
      siteId,
      Object.fromEntries(Object.entries(sides).map(([side, strat]) => [
        side,
        {
          operators: Array.isArray(strat?.operators) ? strat.operators : [],
          strategy: typeof strat?.strategy === 'string'
            ? (strat.strategy.match(/^.*?[.!?](?:\s|$)/)?.[0] || strat.strategy).trim()
            : '',
          callouts: Array.isArray(strat?.callouts) ? strat.callouts.slice(0, 4) : [],
          utility: [],
        },
      ])),
    ])),
  ]))
}

function genericPickOrder() {
  const weights = { essential: 3, recommended: 2, flex: 1 }
  const sides = { attack: new Map(), defense: new Map() }
  for (const sites of Object.values(STRATS)) {
    for (const site of Object.values(sites || {})) {
      for (const side of ['attack', 'defense']) {
        for (const operator of site?.[side]?.operators || []) {
          const score = weights[operator.priority] || 1
          sides[side].set(operator.name, (sides[side].get(operator.name) || 0) + score)
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(sides).map(([side, scores]) => [
    side,
    [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([op]) => ({ op })),
  ]))
}

async function writeModule(path, banner, value) {
  const body = `${banner}\nconst DATA = ${JSON.stringify(value, null, 2)}\n\nexport default DATA\n`
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, body, 'utf8')
}

const publicStrats = publicStrategyCatalog()
const generatedAt = new Date().toISOString()

await writeModule(
  resolve(root, 'src/data/public-strats.generated.js'),
  '// AUTO-GENERATED. Public preview projection only; never add paid fields here.',
  publicStrats,
)

await writeModule(
  resolve(root, 'src/data/public-bans.generated.js'),
  '// AUTO-GENERATED. Ban recommendations are server-authorized paid content.',
  {},
)

const protectedCatalog = {
  schema_version: 1,
  generated_at: generatedAt,
  strategies: STRATS,
  bans: BANS,
  enemy_meta: ENEMY_META,
  squad_roles: SQUAD_ROLES,
  verified_setups: VERIFIED_SETUPS,
  verified_callouts: VERIFIED_CALLOUTS,
  setup_capabilities: Object.fromEntries(Object.entries(CAPABILITIES).map(([side, capabilities]) => [
    side,
    capabilities.map((capability) => ({
      ...capability,
      needs: capability.needs instanceof RegExp ? capability.needs.source : String(capability.needs || ''),
    })),
  ])),
  setup_floor_priority: FLOOR_PRIORITY,
  setup_variations: VARIATIONS,
  setup_pick_order: genericPickOrder(),
}

const protectedPath = resolve(root, 'lambda/subscription/protected-content.json')
await mkdir(dirname(protectedPath), { recursive: true })
await writeFile(protectedPath, `${JSON.stringify(protectedCatalog)}\n`, 'utf8')

console.log(`Generated public strategy projection and protected catalog (${generatedAt}).`)
