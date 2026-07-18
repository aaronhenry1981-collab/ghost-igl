#!/usr/bin/env node
// Generates an RSS 2.0 feed at public/feed.xml listing the most recent
// guides + announcements. Aggregators (Feedly, NewsBlur, gaming-tool sites)
// pick up RSS feeds and auto-publish entries â€” every pickup is a backlink.
//
// Cost: zero. Effort: zero ongoing (regenerate on each deploy).
// Tradeoff: small. Backlink yield: meaningful over months.

import { writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE = 'https://r6coaching.com'
const FEED_TITLE = 'Recon 6 â€” R6 Siege Strategy Updates'
const FEED_DESC = 'Latest map guides, operator analysis, and ranked strategy from Recon 6.'

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function rfc822(d) {
  return new Date(d).toUTCString()
}

const items = []
const now = new Date()
const feedPath = join(ROOT, 'public', 'feed.xml')
const existingDates = new Map()
try {
  const oldFeed = readFileSync(feedPath, 'utf8')
  for (const match of oldFeed.matchAll(/<item>[\s\S]*?<guid[^>]*>(.*?)<\/guid>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)) {
    existingDates.set(match[1], match[2])
  }
} catch {
  // First generation has no previous feed to preserve.
}

function publicationDate(guid, sourceDate) {
  if (sourceDate) return rfc822(`${sourceDate}T00:00:00Z`)
  return existingDates.get(guid) || rfc822(now)
}

// Per-map guides as feed items
for (const map of MAPS) {
  if (map.comingSoon) continue
  if (!STRATS[map.id]) continue
  items.push({
    title: `${map.name} Strategy Guide â€” Ranked Loadouts, Callouts, Bans`,
    link: `${SITE}/guides/${map.id}.html`,
    guid: `${SITE}/guides/${map.id}.html`,
    description: `Complete strategy guide for ${map.name} â€” operator picks, callouts, utility usage, and ban recommendations for every bombsite. Updated for current ranked meta.`,
    pubDate: publicationDate(`${SITE}/guides/${map.id}.html`),
    category: 'Strategy Guides',
  })
}

// Operator guides as feed items (top 20 by appearance count)
const operatorAppearances = {}
for (const mapId of Object.keys(STRATS)) {
  for (const siteId of Object.keys(STRATS[mapId])) {
    for (const side of ['attack', 'defense']) {
      for (const op of STRATS[mapId][siteId][side]?.operators || []) {
        operatorAppearances[op.name] = (operatorAppearances[op.name] || 0) + 1
      }
    }
  }
}
const topOperators = Object.entries(operatorAppearances)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([name]) => name)

for (const opName of topOperators) {
  const slug = opName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  items.push({
    title: `${opName} Operator Guide â€” Where to Play`,
    link: `${SITE}/guides/operators/${slug}.html`,
    guid: `${SITE}/guides/operators/${slug}.html`,
    description: `Complete ${opName} guide for Rainbow Six Siege: every site where ${opName} is picked, role, and priority. Recon 6's tactical reference.`,
    pubDate: publicationDate(`${SITE}/guides/operators/${slug}.html`),
    category: 'Operators',
  })
}

// Blog posts as feed items (added 2026-07-06 â€” the feed predated the blog and
// never picked it up). Sourced from the generated HTML in public/blog/ so this
// stays in sync with whatever the blog generator produced this build (the
// generate:all chain runs generate:blog before generate:rss).
try {
  const blogDir = join(ROOT, 'public', 'blog')
  for (const f of readdirSync(blogDir)) {
    if (!f.endsWith('.html') || f === 'index.html') continue
    const html = readFileSync(join(blogDir, f), 'utf8')
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1]
    const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1]
    const published = (html.match(/"datePublished":"(\d{4}-\d{2}-\d{2})"/) || [])[1]
    if (!title) continue
    items.push({
      title,
      link: `${SITE}/blog/${f}`,
      guid: `${SITE}/blog/${f}`,
      description: desc || title,
      pubDate: publicationDate(`${SITE}/blog/${f}`, published),
      category: 'Blog',
    })
  }
} catch (e) {
  console.warn('blog feed items skipped:', e.message)
}

const itemsXml = items.map(i => `    <item>
      <title>${escape(i.title)}</title>
      <link>${escape(i.link)}</link>
      <guid isPermaLink="true">${escape(i.guid)}</guid>
      <description>${escape(i.description)}</description>
      <pubDate>${i.pubDate}</pubDate>
      <category>${escape(i.category)}</category>
    </item>`).join('\n')

const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(FEED_TITLE)}</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escape(FEED_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
    <generator>Recon 6 static-feed-gen</generator>
${itemsXml}
  </channel>
</rss>
`

writeFileSync(feedPath, feed)
console.log(`âœ“ Generated feed.xml with ${items.length} items`)
