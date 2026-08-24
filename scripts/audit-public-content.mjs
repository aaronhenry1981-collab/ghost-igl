import { readFile, readdir } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import STRATS from '../src/data/strats.js'
import BANS from '../src/data/bans.js'
import { VERIFIED_SETUPS } from '../src/data/verified-setups.js'
import { CAPABILITIES } from '../src/data/capabilities.js'
import { VARIATIONS } from '../src/data/variations.js'

// An optional directory lets deployment verification audit the actual S3
// snapshot, not only the local build that was intended to be published.
const dist = resolve(process.argv[2] || 'dist')
const textExts = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt'])

function collectRestrictedSamples() {
  const samples = []
  for (const sites of Object.values(STRATS)) {
    for (const sides of Object.values(sites)) {
      for (const strat of Object.values(sides)) {
        for (const value of strat?.utility || []) {
          if (typeof value === 'string' && value.length >= 36) samples.push(value)
        }
        const premium = strat?.premiumTactics || {}
        for (const value of premium.advancedSetups || premium.antiSpawnPeek || []) {
          if (typeof value === 'string' && value.length >= 36) samples.push(value)
        }
        for (const value of premium.spawnKillSpots || premium.runouts || []) {
          for (const field of Object.values(value || {})) {
            if (typeof field === 'string' && field.length >= 36) samples.push(field)
          }
        }
      }
    }
  }
  for (const sides of Object.values(BANS)) {
    for (const bans of Object.values(sides)) {
      for (const ban of bans || []) {
        if (typeof ban?.reason === 'string' && ban.reason.length >= 36) samples.push(ban.reason)
      }
    }
  }
  const collectStrings = (value) => {
    if (typeof value === 'string') {
      if (value.length >= 36) samples.push(value)
      return
    }
    if (Array.isArray(value)) {
      value.forEach(collectStrings)
      return
    }
    if (value && typeof value === 'object') Object.values(value).forEach(collectStrings)
  }
  collectStrings(VERIFIED_SETUPS)
  collectStrings(CAPABILITIES)
  collectStrings(VARIATIONS)
  const unique = [...new Set(samples)]
  if (unique.length <= 1500) return unique
  const selected = []
  const step = unique.length / 1500
  for (let index = 0; index < 1500; index++) selected.push(unique[Math.floor(index * step)])
  return selected
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (textExts.has(extname(entry.name).toLowerCase())) files.push(path)
  }
  return files
}

const samples = collectRestrictedSamples()
const leaks = []
for (const file of await walk(dist)) {
  const body = await readFile(file, 'utf8')
  for (const sample of samples) {
    if (body.includes(sample)) {
      leaks.push({ file, sample: sample.slice(0, 80) })
      break
    }
  }
}

if (leaks.length) {
  console.error('Public-content audit failed. Paid content appeared in the public build:')
  for (const leak of leaks.slice(0, 30)) console.error(`- ${leak.file}: ${leak.sample}`)
  process.exit(1)
}

console.log(`Public-content audit passed across ${(await walk(dist)).length} files.`)
