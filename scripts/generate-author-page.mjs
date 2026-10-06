#!/usr/bin/env node
// public/author/aaron/index.html: the author page every article byline links
// to. Bio facts are the ones already published in the press kit (PressPage);
// the article list is read from the generated guides and blog posts, so it
// runs after those generators in generate:all.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTICLE_CSS, AUTHOR_NAME, AUTHOR_PATH, AUTHOR_SAME_AS, SITE_URL, authorSchema, footerHtml, navHtml,
} from './lib/article-seo.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const OUT = join(PUBLIC, 'author', 'aaron', 'index.html')

const escape = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Title of a published page, from its <h1> (falls back to <title>).
function pageTitle(file) {
  const html = readFileSync(file, 'utf8')
  if (/name="robots" content="noindex/.test(html)) return null
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const raw = h1 ? h1[1] : (html.match(/<title>([^<]*)<\/title>/) || [])[1]
  return raw ? raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim() : null
}

function listDir(rel, test) {
  const dir = join(PUBLIC, rel)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html' && test(f))
    .sort()
    .map((f) => ({ url: `/${rel}/${f}`, title: pageTitle(join(dir, f)) }))
    .filter((p) => p.title)
}

const groups = [
  { heading: 'Rank-up guides and season breakdowns', items: listDir('blog', (f) => f.startsWith('r6-') && !f.startsWith('r6-operator-') || f.startsWith('hardstuck-')) },
  { heading: 'Operator deep dives', items: listDir('blog', (f) => f.startsWith('r6-operator-')) },
  { heading: 'Map guides', items: listDir('guides', () => true) },
  { heading: 'Operator guides', items: listDir('guides/operators', () => true) },
  { heading: 'Comparisons', items: listDir('compare', () => true) },
]
const total = groups.reduce((n, g) => n + g.items.length, 0)

const title = `${AUTHOR_NAME}, Founder of Recon 6 — Author Page`
const description = `${AUTHOR_NAME} founded Recon 6, the Rainbow Six Siege coaching tool, and publishes its guides. His bio, how the guides are made, and all ${total} articles.`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: `${SITE_URL}${AUTHOR_PATH}`,
  name: title,
  mainEntity: { ...authorSchema(), description: 'Founder and sole engineer of Recon 6, a Rainbow Six Siege coaching tool. Based in Texas, USA.' },
}

const body = `
    <nav class="breadcrumb"><a href="/">Recon 6</a> › <span>Authors</span> › <span>${escape(AUTHOR_NAME)}</span></nav>
    <article>
      <h1>${escape(AUTHOR_NAME)}</h1>
      <p class="byline">Founder of Recon 6 · Texas, USA</p>
      <p>${escape(AUTHOR_NAME)} founded Recon 6 in 2025 after recording his own ranked Rainbow Six Siege matches to find the patterns behind repeated round losses. Those notes became a coaching tool built around decisions a player can test in the next match.</p>
      <p>He is Recon 6's founder and sole engineer: he builds the website and the Recon 6 Command desktop coach, publishes the guides below, and runs the live 1:1 coaching sessions. More about the company is on the <a href="${SITE_URL}/about">About page</a>.</p>

      <h2>How these guides are made</h2>
      <p>The map, site and operator guides are built from Recon 6's strat library, the same data the app uses, with site names that follow Ubisoft's official map list. The blog posts are drafted with AI assistance from that library and published by ${escape(AUTHOR_NAME)}. Every guide links the official Ubisoft pages it should agree with. If something doesn't match your game, <a href="${SITE_URL}/about#contact">tell us</a> and it gets fixed or withdrawn.</p>

      <h2>Where to find him</h2>
      <ul>
        ${AUTHOR_SAME_AS.map((url) => `<li><a href="${escape(url)}" rel="me noopener">${escape(url.replace(/^https?:\/\//, ''))}</a></li>`).join('\n        ')}
        <li><a href="https://www.tiktok.com/@recon6coach" rel="noopener">Recon 6 on TikTok</a></li>
        <li><a href="https://discord.gg/namGQqs3jb" rel="noopener">Recon 6 Discord</a></li>
      </ul>

      <h2>Articles by ${escape(AUTHOR_NAME)} (${total})</h2>
      ${groups.filter((g) => g.items.length).map((g) => `
      <h3>${escape(g.heading)}</h3>
      <ul class="author-articles">${g.items.map((p) => `<li><a href="${escape(p.url)}">${escape(p.title)}</a></li>`).join('')}</ul>`).join('\n')}
    </article>`

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${SITE_URL}${AUTHOR_PATH}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#121211" />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${SITE_URL}${AUTHOR_PATH}" />
  <meta property="og:image" content="${SITE_URL}/og-image.png" />
  <meta property="og:site_name" content="Recon 6" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #121211; color: #ebe4d7; line-height: 1.7; }
    a { color: #f07430; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; }
    .brand span { color: #f07430; }
    .nav-links a { margin-left: 18px; color: rgba(235,228,215,0.85); font-size: 0.9rem; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 2.1rem; margin: 0 0 4px; }
    h2 { font-size: 1.35rem; margin: 30px 0 10px; }
    h3 { font-size: 1.05rem; margin: 22px 0 8px; color: #fad6c2; }
    .breadcrumb { font-size: 0.85rem; color: rgba(235,228,215,0.6); margin-bottom: 12px; }
    .author-articles { columns: 2; column-gap: 28px; padding-left: 18px; font-size: 0.92rem; }
    .author-articles li { break-inside: avoid; margin-bottom: 4px; }
    .footer-strip { max-width: 760px; margin: 40px auto; padding: 0 24px; color: rgba(235,228,215,0.5); font-size: 0.82rem; text-align: center; }${ARTICLE_CSS}
    @media (max-width: 600px) { main { padding: 20px 16px 40px; } .author-articles { columns: 1; } }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    ${body}
  </main>
  ${footerHtml()}
</body>
</html>
`

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, html, 'utf8')
console.log(`✓ Generated author page (${total} articles) at public/author/aaron/`)
