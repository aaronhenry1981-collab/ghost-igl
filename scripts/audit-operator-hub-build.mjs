#!/usr/bin/env node
// No authenticated corpus may leak into the website deployment.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
// The public build uses a fictional canary only. A separate private release
// scan compares real corpus spans with the complete candidate tree and dist.
const fixtureMarker = 'OPHUB_TEST_FIXTURE_ONLY_ZY7Q2'

let scanned = 0
function inspect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) { inspect(path); continue }
    const name = relative(dist, path)
    assert.doesNotMatch(name, /operator-hub-(?:content|attack|defense|loadouts)\b/, 'Private data file copied to website bundle')
    if (!/\.(?:js|html|json|xml|txt|css|map)$/i.test(name)) continue
    const text = readFileSync(path, 'utf8')
    assert.ok(!text.includes(fixtureMarker), `Operator Hub test fixture leaked to ${name}`)
    if (/sitemap[^/]*\.xml$|llms(?:-full)?\.txt$|feed\.xml$/.test(name)) {
      assert.ok(!text.includes('/operator-hub'), `Operator Hub added to a discovery feed: ${name}`)
    }
    scanned++
  }
}
inspect(dist)
const shell = readFileSync(join(dist, '_shell', 'operator-hub.html'), 'utf8')
assert.match(shell, /name="robots" content="noindex/)
assert.doesNotMatch(shell, /plausible\.io|window\.plausible=/)
assert.match(shell, /<div id="root"><\/div>/)
console.log(`Checked ${scanned} public files for Operator Hub fixture/data filenames, sitemap exclusion and generic noindex shell.`)
