#!/usr/bin/env node
// Post-build: one copy of dist/index.html per app route, each with that
// route's own title, description, canonical URL and robots rule
// (src/config/routeMeta.js). The CloudFront router (aws/cloudfront-site-router.js)
// serves /_shell/<route>.html for the route, so a crawler that never runs
// JavaScript still sees a distinct, correct head. The app boots the same way
// from every shell.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allRoutePaths, metaForPath, SITE_URL } from '../src/config/routeMeta.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const template = readFileSync(join(DIST, 'index.html'), 'utf8')

const attr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const text = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`index.html is missing ${label}; the shell would keep the home page's head`)
  return html.replace(pattern, replacement)
}

export function shellFor(meta) {
  const description = meta.description || metaForPath('/').description
  let html = template
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${text(meta.title)}</title>`, '<title>')
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${attr(description)}" />`, 'meta description')
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${attr(meta.title)}" />`, 'og:title')
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${attr(description)}" />`, 'og:description')
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${attr(meta.canonical)}" />`, 'og:url')
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${attr(meta.title)}" />`, 'twitter:title')
  html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${attr(description)}" />`, 'twitter:description')
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${attr(meta.canonical)}" />`, 'canonical')
  html = replaceOnce(html, /<meta name="robots" content="[^"]*"\s*\/?>/,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`, 'robots')
  // The home page's FAQ answers belong to the home page only.
  html = html.replace(/<!-- FAQ schema[\s\S]*?<\/script>\s*/, '')
  return html
}

function write(relative, html) {
  const out = join(DIST, '_shell', relative)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html, 'utf8')
}

const paths = allRoutePaths()
for (const path of paths) write(`${path.slice(1)}.html`, shellFor(metaForPath(path)))
// Open-ended routes (/r/:code, /admin/*, /help/:slug …) share one unindexed shell.
write('app.html', shellFor({ title: 'Recon 6', canonical: `${SITE_URL}/`, noindex: true }))
console.log(`✓ Wrote ${paths.length + 1} route shells to dist/_shell/`)
