// The Discord bot's map list must carry the same Villa site label as the
// site (src/data/maps.js), and a withdrawn site gets no link, callouts or
// tactics: only the withdrawn notice.
import test from 'node:test'
import assert from 'node:assert/strict'
import BOT_MAPS from './maps.mjs'
import SITE_MAPS from '../../src/data/maps.js'
import { calloutsResponse, stratResponse } from './index.mjs'

const opts = (map, site) => ({ data: { options: [{ name: 'map', value: map }, ...(site ? [{ name: 'site', value: site }] : [])] } })

test('the bot\'s Villa sites match the site data, including the withdrawn basement site', () => {
  const bot = BOT_MAPS.find((m) => m.id === 'villa').sites.map(({ id, name, floor }) => ({ id, name, floor }))
  const site = SITE_MAPS.find((m) => m.id === 'villa').sites
  const moved = site.find((s) => s.id === 'living-library')
  assert.equal(moved.notice.kind, 'unavailable')
  assert.deepEqual(bot.find((s) => s.id === 'living-library'), { id: 'living-library', name: moved.name, floor: moved.floor })
  assert.deepEqual(bot, site.map(({ id, name, floor }) => ({ id, name, floor })), 'every Villa label matches the site data')
  for (const s of site) {
    if (s.notice?.kind === 'unavailable') assert.equal(BOT_MAPS.find((m) => m.id === 'villa').sites.find((b) => b.id === s.id).unavailable, true, `${s.id} is withdrawn in the bot too`)
  }
})

test('/strat and /callouts show the withdrawn notice, with no link or callouts', () => {
  const strat = stratResponse(opts('villa'))
  const line = strat.split('\n').find((l) => l.includes('Art Storage / Old Office'))
  assert.match(line, /plan withdrawn/)
  assert.doesNotMatch(line, /\/strats\/villa\/living-library/)
  assert.match(strat, /\/strats\/villa\/aviator-games\/attack/, 'the other Villa sites still link')
  const callouts = calloutsResponse(opts('villa', 'living-library'))
  assert.match(callouts, /plan withdrawn/)
  assert.doesNotMatch(callouts, /Library|Garden|callouts \(click/)
})
