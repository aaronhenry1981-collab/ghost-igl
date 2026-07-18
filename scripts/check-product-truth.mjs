#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const errors = []
const requireText = (path, pattern, message) => {
  if (!pattern.test(read(path))) errors.push(`${path}: ${message}`)
}
const forbidText = (path, pattern, message) => {
  if (pattern.test(read(path))) errors.push(`${path}: ${message}`)
}

const registry = JSON.parse(read('config/product-truth.json'))
if (JSON.stringify(registry.activeMarketingGames) !== JSON.stringify(['r6'])) {
  errors.push('config/product-truth.json: activeMarketingGames must remain ["r6"]')
}

// Dormant inventory may remain available to existing customers and future work,
// but the normal production build must never regenerate or promote it.
forbidText('package.json', /"generate:all"[^\n]+generate:(?:games|gameog|stadiumog|cast|loadouts|maploadouts)/,
  'default build includes dormant multi-game generators')
requireText('src/pages/LandingPage.jsx', /const R6_ONLY = true/,
  'R6-only marketing kill switch is not enabled')
forbidText('src/main.jsx', /path: '\/tools\/ow2-stadium-tier-list'/,
  'non-R6 tool route is active')
requireText('src/main.jsx', /path: '\/download'.+DESKTOP_APP_RELEASED[^\n]+Navigate to="\/account"/,
  'desktop download route is not release-gated')

const otherGames = /\b(?:Counter-Strike|CS2|Valorant|Overwatch|OW2|Apex|Marvel Rivals|Halo|Fortnite|Rocket League|Call of Duty|CoD|League of Legends|Dota|Tekken|PUBG)\b/i
forbidText('index.html', otherGames, 'homepage metadata promotes a non-R6 product')

// These files are generated before this check in CI. Validate what search
// engines and users will actually receive rather than only changed source.
forbidText('public/tools/index.html', otherGames, 'tools page promotes a non-R6 product')
forbidText('public/tools/index.html', /across\s+20|All Games|Pick Your Game/i,
  'tools page promotes multi-game availability')
forbidText('public/sitemap.xml', /<loc>[^<]*\/(?:games\/|tools\/ow2|download)/i,
  'sitemap promotes a dormant or unreleased surface')
forbidText('public/sitemap.xml', /<loc>[^<]*\/blog\/(?!r6-)[^<]+<\/loc>/i,
  'sitemap promotes a non-R6 blog')
forbidText('public/blog/index.html', otherGames, 'blog index promotes a non-R6 product')
forbidText('public/feed.xml', otherGames, 'RSS feed promotes a non-R6 product')

for (const path of ['src/components/Navbar.jsx', 'src/components/WelcomeModal.jsx']) {
  requireText(path, /DESKTOP_APP_RELEASED/, 'desktop link is missing the release gate')
}

if (errors.length) {
  console.error(`Product-truth check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('Product-truth check passed (R6-only active surfaces; desktop release-gated)')
