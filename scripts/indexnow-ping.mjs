#!/usr/bin/env node
// Submits all sitemap URLs to IndexNow — accepted by Bing, Yandex, Naver,
// Seznam, and others. Result: those engines crawl + index our pages within
// hours instead of days. Google doesn't accept IndexNow but it doesn't hurt.
//
// Run after each deploy. Cost: free, no auth. Quota: ~10,000 URLs per day.
//
// Output:
//   - One POST per IndexNow endpoint with full URL list
//   - Console summary of which engines accepted
//
// Run: node scripts/indexnow-ping.mjs
//
// Verification: IndexNow checks that <key>.txt is reachable at the site root
// before accepting a ping. The key file is in public/ and gets deployed.

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const HOST = 'r6coaching.com'
const KEY = readFileSync(join(ROOT, 'public', '.indexnow-key'), 'utf8').trim()
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`

// IndexNow endpoints. POSTing to ANY of them shares the ping with all
// participating engines, so one POST is enough. Multiple kept here for
// redundancy in case one is briefly down.
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
]

// Pull URL list from sitemap.xml
const sitemapXml = readFileSync(join(ROOT, 'public', 'sitemap.xml'), 'utf8')
const urlList = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
console.log(`Submitting ${urlList.length} URLs to IndexNow...`)

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
}

let successes = 0
let failures = []
for (const endpoint of ENDPOINTS) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    const text = await res.text().catch(() => '')
    if (res.ok || res.status === 202) {
      console.log(`  ✓ ${endpoint} — ${res.status} ${res.statusText}`)
      successes++
    } else {
      console.log(`  ✗ ${endpoint} — ${res.status} ${res.statusText} ${text.slice(0, 100)}`)
      failures.push({ endpoint, status: res.status, text })
    }
  } catch (err) {
    console.log(`  ✗ ${endpoint} — ${err.message}`)
    failures.push({ endpoint, error: err.message })
  }
}

console.log('')
console.log(`Submitted to ${successes} of ${ENDPOINTS.length} IndexNow endpoints.`)
if (successes === 0) {
  console.error('All endpoints failed. Verify the key file is reachable at:', KEY_LOCATION)
  process.exit(1)
}
