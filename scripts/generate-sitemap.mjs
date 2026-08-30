#!/usr/bin/env node
// Generates the public, R6-only sitemap from the current Rainbow Six content.
// Search engines should never be invited to products that are not currently sold.

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'sitemap.xml')
const SITE = 'https://r6coaching.com'
const today = new Date().toISOString().slice(0, 10)

const STATIC_URLS = [
  { loc: '/', freq: 'weekly', pri: 1.0 },
  { loc: '/auth', freq: 'monthly', pri: 0.6 },
  { loc: '/dashboard', freq: 'monthly', pri: 0.7 },
  { loc: '/strats', freq: 'weekly', pri: 0.9 },
  { loc: '/match-prep', freq: 'weekly', pri: 0.85 },
  { loc: '/loadouts', freq: 'weekly', pri: 0.85 },
  { loc: '/operators', freq: 'weekly', pri: 0.9 },
  { loc: '/meta', freq: 'weekly', pri: 0.8 },
  { loc: '/vod', freq: 'monthly', pri: 0.8 },
  { loc: '/download', freq: 'monthly', pri: 0.7 },
  { loc: '/changelog', freq: 'weekly', pri: 0.5 },
  { loc: '/live', freq: 'weekly', pri: 0.9 },
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

function urlEntry({ loc, freq, pri }) {
  return `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri.toFixed(1)}</priority>\n  </url>`
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
console.log(`✓ Generated R6-only sitemap with ${urls.length} URLs`)
