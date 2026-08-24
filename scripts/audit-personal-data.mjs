// Fail the build if a real person's identity ends up in the shipped bundle.
//
// Why this exists: on 2026-07-30 a new Champion signed up and the Setups page
// showed him Aaron's ranked ladder, Aaron's win rates, and the regular duo's PSN
// gamertag next to that person's operator pool. The tactics were fine. The
// identities and the numbers were one specific account's, presented as the
// customer's own.
//
// A UI gate is not enough on its own. Anything in dist/ is downloadable by
// anyone who loads the site, gated or not — so the rule is that a third party's
// identity must not be IN THE FILE, not merely hidden from the render. The fix
// was to write the setup prose in second person at source; this is the check
// that keeps it that way, because "we rewrote the data" is the kind of thing
// that stays true right up until someone writes one new setup.
//
//   node scripts/audit-personal-data.mjs
//
// LEAK  a third party's identity. Fails the build.
// OWNER Aaron's own details. Reported, does not fail — his site, his call, but
//       it should not grow silently either.
import fs from 'fs'
import path from 'path'

const DIST = path.resolve(process.cwd(), 'dist')

const CHECKS = [
  ['LEAK', "regular duo's gamertag", /JoCeph[iu]s88/i],
  ['LEAK', "regular duo's first name", /\bJackson\b/],
  ['LEAK', 'owner PSN handle used as sample data', /Splinter2581/i],
  ['OWNER', 'owner first name', /\bAaron\b/],
  ['OWNER', 'personal round counts', /\d[\d,]*\s+rounds\b/i],
]

if (!fs.existsSync(DIST)) {
  console.error('no dist/ — run the build first')
  process.exit(1)
}

const files = []
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name)
  if (e.isDirectory()) walk(p)
  else if (/\.(js|css|html|json)$/.test(e.name)) files.push(p)
})
walk(DIST)

let failed = 0
for (const [severity, label, re] of CHECKS) {
  const hits = files.filter((f) => re.test(fs.readFileSync(f, 'utf8')))
  if (!hits.length) {
    console.log(`  ok   ${label}`)
    continue
  }
  if (severity === 'LEAK') failed++
  const names = hits.map((f) => path.relative(DIST, f)).slice(0, 4).join(', ')
  console.log(`  ${severity.padEnd(6)}${label} — ${hits.length} file(s): ${names}`)
}

console.log('')
if (failed) {
  console.error(`${failed} third-party identity leak(s) in dist/. Not shipping this.`)
  console.error('Setup prose must be written in second person ("you", "your duo") at source.')
  process.exit(1)
}
console.log(`clean — no third-party identity in ${files.length} built files`)
