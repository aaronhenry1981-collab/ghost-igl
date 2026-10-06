#!/usr/bin/env node
// Finds and verifies the outside references the guides and blog posts cite:
// Ubisoft's official operator and map pages, and SiegeGG's operator and map
// stats pages. A link is kept only if it answers 200 (both sites answer 500
// for a slug that doesn't exist). Writes src/data/reference-links.json, which
// the page generators read; they never touch the network.
//
// Run by hand when operators or maps change:  node scripts/verify-reference-links.mjs
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'reference-links.json')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae')
const slugify = (s) => ascii(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function ok(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' })
      if (res.status === 200) return true
      if (res.status !== 429 && res.status < 500) return false
      if (res.status === 500 && attempt === 0) return false // both sites: 500 = unknown slug
    } catch { /* retry */ }
    await sleep(1500)
  }
  return false
}

async function firstOk(candidates) {
  for (const url of candidates) {
    await sleep(350)
    if (await ok(url)) return url
  }
  return null
}

// Every operator any plan uses (the operator guides and blog posts cover these).
const OP_NAMES = [...new Set(Object.values(STRATS).flatMap((sites) => Object.values(sites).flatMap((sides) =>
  ['attack', 'defense'].flatMap((side) => (sides?.[side]?.operators || []).map((op) => op.name)))))].sort()

const MAP_SLUG_ALIASES = { clubhouse: ['club-house'], hereford: ['hereford-base'], plane: ['presidential-plane'], kafe: ['kafe-dostoyevsky'], nighthaven: ['nighthaven-labs'] }

const operators = {}
for (const name of OP_NAMES) {
  const slug = slugify(name)
  const ubisoft = await firstOk([`https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/operators/${slug}`])
  const siegegg = await firstOk([`https://siege.gg/operators/${slug}`])
  operators[name] = { ubisoft, siegegg }
  console.log(`${name.padEnd(14)} ubisoft:${ubisoft ? 'ok' : '--'} siegegg:${siegegg ? 'ok' : '--'}`)
}

const maps = {}
for (const map of MAPS.filter((m) => !m.comingSoon && STRATS[m.id])) {
  const slugs = [...new Set([map.id, slugify(map.name), ...(MAP_SLUG_ALIASES[map.id] || [])])]
  const ubisoft = await firstOk(slugs.map((s) => `https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps/${s}`))
  const siegegg = await firstOk(slugs.map((s) => `https://siege.gg/maps/${s}`))
  maps[map.id] = { ubisoft, siegegg }
  console.log(`${map.id.padEnd(16)} ubisoft:${ubisoft ? 'ok' : '--'} siegegg:${siegegg ? 'ok' : '--'}`)
}

const general = {
  ubisoftOperators: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/operators',
  ubisoftMaps: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps',
  ubisoftPatchNotes: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes',
  ubisoftSeasonNotes: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/PONCuRt8LaCr3O31NkBQb/y11s3-designers-notes',
  trackerLeaderboards: 'https://r6.tracker.network/r6siege/leaderboards',
  siegeggOperators: 'https://siege.gg/operators',
  siegeggMaps: 'https://siege.gg/maps',
}
for (const [key, url] of Object.entries(general)) {
  await sleep(350)
  if (!(await ok(url))) {
    console.log(`general ${key}: FAILED, dropped`)
    delete general[key]
  }
}

const verifiedOn = new Date().toISOString().slice(0, 10)
writeFileSync(OUT, `${JSON.stringify({ verifiedOn, general, operators, maps }, null, 2)}\n`, 'utf8')
console.log(`✓ Wrote ${OUT}`)
