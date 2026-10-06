#!/usr/bin/env node
// Generates the public, R6-only sitemap from the current Rainbow Six content.
// Search engines should never be invited to products that are not currently sold.
//
// lastmod is the date a page's content last changed, not the build date.
// scripts/sitemap-lastmod.json keeps a hash of each page's source; a build
// only moves a page's date when that hash changes. A page seen for the first
// time takes the last commit date of its source (today if it is uncommitted).

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'
import { metaForPath } from '../src/config/routeMeta.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'sitemap.xml')
const MANIFEST = join(ROOT, 'scripts', 'sitemap-lastmod.json')
const SITE = 'https://r6coaching.com'
const today = new Date().toISOString().slice(0, 10)

const STATIC_URLS = [
  { loc: '/', freq: 'weekly', pri: 1.0 },
  { loc: '/pricing', freq: 'weekly', pri: 0.9 },
  { loc: '/strats', freq: 'weekly', pri: 0.9 },
  { loc: '/match-prep', freq: 'weekly', pri: 0.85 },
  { loc: '/loadouts', freq: 'weekly', pri: 0.85 },
  { loc: '/operators', freq: 'weekly', pri: 0.9 },
  { loc: '/meta', freq: 'weekly', pri: 0.8 },
  { loc: '/vod', freq: 'monthly', pri: 0.8 },
  { loc: '/download', freq: 'monthly', pri: 0.7 },
  { loc: '/changelog', freq: 'weekly', pri: 0.5 },
  { loc: '/live', freq: 'weekly', pri: 0.9 },
  { loc: '/about', freq: 'monthly', pri: 0.6 },
  { loc: '/press', freq: 'monthly', pri: 0.6 },
  { loc: '/creator-demo', freq: 'monthly', pri: 0.9 },
  { loc: '/tools/r6-tier-list', freq: 'weekly', pri: 0.85 },
  { loc: '/terms', freq: 'yearly', pri: 0.3 },
  { loc: '/privacy', freq: 'yearly', pri: 0.3 },
  { loc: '/refund', freq: 'yearly', pri: 0.3 },
  { loc: '/guides/', freq: 'weekly', pri: 0.9 },
  { loc: '/guides/operators/', freq: 'weekly', pri: 0.9 },
  { loc: '/guides/bans/', freq: 'weekly', pri: 0.8 },
  { loc: '/blog/', freq: 'weekly', pri: 0.85 },
  { loc: '/countdown/', freq: 'weekly', pri: 0.85 },
  { loc: '/coaching/index.html', freq: 'weekly', pri: 0.95 },
  { loc: '/climb/', freq: 'weekly', pri: 0.9 },
  { loc: '/tools/', freq: 'weekly', pri: 0.85 },
]

// The source files behind each app route (static pages are their own source).
const APP_SOURCES = {
  '/': ['index.html', 'src/pages/LandingPage.jsx', 'src/components/PricingSection.jsx'],
  '/pricing': ['src/pages/PricingPage.jsx', 'src/components/PricingSection.jsx'],
  '/strats': ['src/pages/StratsPage.jsx'],
  '/match-prep': ['src/pages/MatchPrepPage.jsx'],
  '/loadouts': ['src/pages/LoadoutsPage.jsx'],
  '/operators': ['src/pages/OperatorsPage.jsx'],
  '/meta': ['src/pages/MetaPage.jsx'],
  '/vod': ['src/pages/VodPage.jsx'],
  '/download': ['src/pages/DownloadPage.jsx'],
  '/changelog': ['src/pages/ChangelogPage.jsx', 'src/data/changelog.js'],
  '/live': ['src/pages/LiveCoachPage.jsx'],
  '/about': ['src/pages/AboutPage.jsx'],
  '/press': ['src/pages/PressPage.jsx'],
  '/creator-demo': ['src/pages/CreatorDemoPage.jsx'],
  '/tools/r6-tier-list': ['src/pages/R6TierListPage.jsx'],
  '/terms': ['src/pages/TermsPage.jsx'],
  '/privacy': ['src/pages/PrivacyPage.jsx'],
  '/refund': ['src/pages/RefundPage.jsx'],
}

function sourcesFor(loc) {
  if (APP_SOURCES[loc]) return APP_SOURCES[loc]
  if (loc.endsWith('/')) return [`public${loc}index.html`]
  return [`public${loc}`]
}

// Pages the build regenerates are dated by their generator and its data, not
// by the committed copy of the output (which can lag the live site).
const STRAT_DATA = ['src/data/maps.js', 'src/data/strats.js', 'scripts/generate-content-boundaries.mjs']
function datingInputs(loc) {
  if (loc.startsWith('/guides/bans/')) return ['scripts/generate-ban-guides.mjs', 'src/data/bans.js', ...STRAT_DATA]
  if (loc.startsWith('/guides/operators/')) return ['scripts/generate-operator-guides.mjs', ...STRAT_DATA]
  if (loc.startsWith('/guides/')) return ['scripts/generate-guides.mjs', ...STRAT_DATA]
  if (loc.startsWith('/blog/r6-operator-')) return sourcesFor(loc)
  if (loc.startsWith('/blog/')) return ['scripts/generate-blog-posts.mjs']
  if (loc === '/countdown/') return ['scripts/generate-countdown.mjs', 'src/config/season.js']
  if (loc === '/tools/') return ['scripts/generate-tools-page.mjs']
  if (loc === '/coaching/index.html') return ['scripts/generate-coaching-page.mjs', 'src/data/ranks.js']
  return sourcesFor(loc)
}

// Dates and times inside a page are not a content change.
const normalize = (text) => text
  .replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?/g, '')
  .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b/g, '')

function hashOf(loc, files) {
  const h = createHash('sha256')
  h.update(JSON.stringify(metaForPath(loc) || {}))
  for (const file of files) {
    const path = join(ROOT, file)
    h.update(file)
    h.update(existsSync(path) ? normalize(readFileSync(path, 'utf8')) : 'missing')
  }
  return h.digest('hex').slice(0, 16)
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

// First sighting: the last commit that touched the sources, or today when
// any of them has uncommitted changes (or there is no git history).
function firstSeenDate(files) {
  if (git(['status', '--porcelain', '--', ...files])) return today
  const dates = files.map((file) => git(['log', '-1', '--format=%cs', '--', file])).filter(Boolean)
  return dates.length ? dates.sort().at(-1) : today
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const nextManifest = {}

function urlEntry({ loc, freq, pri }) {
  const files = sourcesFor(loc)
  const hash = hashOf(loc, files)
  const known = manifest[loc]
  const lastmod = known && known.hash === hash ? known.lastmod : known ? today : firstSeenDate(datingInputs(loc))
  nextManifest[loc] = { hash, lastmod }
  return `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri.toFixed(1)}</priority>\n  </url>`
}

const urls = STATIC_URLS.map(urlEntry)
const operatorSet = new Set()

for (const map of MAPS) {
  if (map.comingSoon || !STRATS[map.id]) continue
  urls.push(urlEntry({ loc: `/guides/${map.id}.html`, freq: 'monthly', pri: 0.8 }))
  urls.push(urlEntry({ loc: `/guides/bans/${map.id}.html`, freq: 'monthly', pri: 0.7 }))

  for (const site of map.sites) {
    if (!STRATS[map.id]?.[site.id]) continue
    urls.push(urlEntry({ loc: `/guides/${map.id}/${site.id}.html`, freq: 'monthly', pri: 0.7 }))
    for (const side of ['attack', 'defense']) {
      for (const operator of STRATS[map.id][site.id]?.[side]?.operators || []) operatorSet.add(operator.name)
    }
  }
}

for (const name of [...operatorSet].sort()) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  urls.push(urlEntry({ loc: `/guides/operators/${slug}.html`, freq: 'monthly', pri: 0.7 }))
}

const R6_BLOG_SLUGS = [
  'r6-copper-to-bronze', 'r6-bronze-to-silver', 'r6-silver-to-gold',
  'r6-gold-to-platinum', 'r6-platinum-to-emerald', 'r6-emerald-to-diamond',
  'r6-diamond-to-champion',
  'r6-operator-ace', 'r6-operator-alibi', 'r6-operator-aruni', 'r6-operator-ash', 'r6-operator-azami',
  'r6-operator-bandit', 'r6-operator-buck', 'r6-operator-capitao', 'r6-operator-castle', 'r6-operator-caveira',
  'r6-operator-doc', 'r6-operator-dokkaebi', 'r6-operator-echo', 'r6-operator-ela', 'r6-operator-finka',
  'r6-operator-flores', 'r6-operator-fuze', 'r6-operator-glaz', 'r6-operator-goyo', 'r6-operator-gridlock',
  'r6-operator-hibana', 'r6-operator-iana', 'r6-operator-jager', 'r6-operator-kaid', 'r6-operator-kali',
  'r6-operator-lesion', 'r6-operator-lion', 'r6-operator-maestro', 'r6-operator-maverick', 'r6-operator-melusi',
  'r6-operator-mira', 'r6-operator-mozzie', 'r6-operator-mute', 'r6-operator-nomad', 'r6-operator-pulse',
  'r6-operator-sledge', 'r6-operator-smoke', 'r6-operator-thatcher', 'r6-operator-thermite', 'r6-operator-thunderbird',
  'r6-operator-twitch', 'r6-operator-valkyrie', 'r6-operator-vigil', 'r6-operator-wamai', 'r6-operator-ying',
  'r6-operator-zero', 'r6-operator-zofia',
]
for (const slug of R6_BLOG_SLUGS) urls.push(urlEntry({ loc: `/blog/${slug}.html`, freq: 'monthly', pri: 0.7 }))

const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
writeFileSync(OUT, body, 'utf8')
const sorted = Object.fromEntries(Object.keys(nextManifest).sort().map((k) => [k, nextManifest[k]]))
writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
const changed = Object.keys(nextManifest).filter((k) => manifest[k]?.hash !== nextManifest[k].hash).length
console.log(`✓ Generated R6-only sitemap with ${urls.length} URLs (${changed} changed since the last build)`)
