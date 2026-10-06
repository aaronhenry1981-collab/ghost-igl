#!/usr/bin/env node
// Post-build: bundle src/analytics-static.js into dist/assets (content-hashed,
// so the long asset cache is safe) and add it to the static pages that should
// report to Heycatch. Runs after the R6 prune, on the final dist/ tree.
//
// Which pages: the public content and marketing pages a visitor reads before
// the app (guides, blog, compare, author, coaching, climb, tools, countdown,
// 404). Never the app shells (main.jsx already runs Heycatch there), never a
// page whose URL can carry a booking token or confirmation details
// (/booking/…, /coaching/booked/), and never an admin page.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const MARKER = 'data-recon-analytics'

const INCLUDE = [/^guides\//, /^blog\//, /^compare\//, /^author\//, /^coaching\/index\.html$/, /^climb\//, /^tools\//, /^countdown\//, /^404\.html$/]
const EXCLUDE = [/^_shell\//, /^admin\//, /^booking\//, /^coaching\/booked\//]

/** True when the page at this dist-relative path (forward slashes) gets the script. */
export function wantsStaticAnalytics(relPath) {
  if (EXCLUDE.some((re) => re.test(relPath))) return false
  return INCLUDE.some((re) => re.test(relPath))
}

/** The page with the analytics module tag added once before </body>. */
export function withAnalyticsTag(html, src) {
  if (html.includes(MARKER)) return html
  const tag = `<script type="module" src="${src}" ${MARKER}></script>`
  return html.includes('</body>') ? html.replace('</body>', `  ${tag}\n</body>`) : `${html}\n${tag}\n`
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (name.endsWith('.html')) out.push(path)
  }
  return out
}

async function main() {
  const { build } = await import('vite')
  const result = await build({
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    publicDir: false,
    build: {
      outDir: DIST,
      emptyOutDir: false,
      copyPublicDir: false,
      modulePreload: false,
      rollupOptions: {
        input: join(ROOT, 'src', 'analytics-static.js'),
        output: { entryFileNames: 'assets/analytics-static-[hash].js', chunkFileNames: 'assets/analytics-static-[hash].js' },
      },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output || [])
  const entry = outputs.find((o) => o.type === 'chunk' && o.isEntry)
  if (!entry) throw new Error('static analytics bundle produced no entry chunk')
  const src = `/${entry.fileName}`

  let tagged = 0
  for (const file of walk(DIST)) {
    const rel = relative(DIST, file).split(sep).join('/')
    if (!wantsStaticAnalytics(rel)) continue
    const html = readFileSync(file, 'utf8')
    const next = withAnalyticsTag(html, src)
    if (next !== html) {
      writeFileSync(file, next, 'utf8')
      tagged += 1
    }
  }
  console.log(`✓ Static analytics ${src} added to ${tagged} static pages`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
