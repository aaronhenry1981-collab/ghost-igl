#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const feedUrl = new URL('../public/feed.xml', import.meta.url)
const datesByGuid = xml => new Map([...xml.matchAll(/<item>[\s\S]*?<guid[^>]*>(.*?)<\/guid>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)].map(m => [m[1], m[2]]))
const before = datesByGuid(readFileSync(feedUrl, 'utf8'))
execFileSync(process.execPath, ['scripts/generate-rss-feed.mjs'], { stdio: 'inherit' })
const after = datesByGuid(readFileSync(feedUrl, 'utf8'))
const changed = [...before].filter(([guid, date]) => after.has(guid) && after.get(guid) !== date)
if (changed.length) {
  console.error(`RSS regeneration changed ${changed.length} existing publication date(s)`) 
  process.exit(1)
}
console.log('RSS publication dates remain stable across regeneration')
