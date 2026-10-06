// Shared pieces for the static articles (map, site, ban and operator guides,
// blog posts): the named author and his page, an honest note on how each
// piece is made, verified outside sources, title/description limits, real
// first-published dates, and one nav and footer for every static page.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://r6coaching.com'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Bump when the article templates change what readers see.
export const TEMPLATE_REVISED = '2026-10-06'

export const AUTHOR_PATH = '/author/aaron/'
export const AUTHOR_NAME = 'Aaron Henry'
export const AUTHOR_SAME_AS = ['https://youtube.com/@MrAaron8189', 'https://twitch.tv/splinter251981']

export function authorSchema() {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/about#aaron-henry`,
    name: AUTHOR_NAME,
    jobTitle: 'Founder, Recon 6',
    url: `${SITE_URL}${AUTHOR_PATH}`,
    sameAs: AUTHOR_SAME_AS,
  }
}

export function publisherSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Recon 6',
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon-512.png`, width: 512, height: 512 },
  }
}

// Article (or BlogPosting) with every property rich results require.
export function articleSchema({ type = 'Article', headline, description, url, datePublished, dateModified, image, section }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline,
    description,
    image: image ? [image] : [`${SITE_URL}/og-image.png`],
    author: authorSchema(),
    publisher: publisherSchema(),
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'en-US',
    ...(section ? { articleSection: section } : {}),
  }
}

// ---- dates ----------------------------------------------------------------
// The date a page was first committed (git), so a piece keeps the date it
// actually went live. Falls back when there is no history (shallow CI clone).
let firstAdded = null
function loadFirstAdded() {
  firstAdded = new Map()
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=__%cs', '--name-only', '--', 'public'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
    })
    let date = null
    for (const raw of out.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (line.startsWith('__')) { date = line.slice(2); continue }
      firstAdded.set(line, date) // newest first, so the last write is the first add
    }
  } catch { /* no git: every page uses its fallback */ }
}

export function firstPublished(absPath, fallback = TEMPLATE_REVISED) {
  if (!firstAdded) loadFirstAdded()
  const key = relative(ROOT, absPath).split('\\').join('/')
  return firstAdded.get(key) || fallback
}

export function humanDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return String(iso)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// ---- titles and descriptions ---------------------------------------------
function fit(candidates, min, max) {
  const list = candidates.filter(Boolean)
  return list.find((c) => c.length >= min && c.length <= max) || list.find((c) => c.length <= max) || list[list.length - 1]
}
export const fitTitle = (...candidates) => fit(candidates, 30, 60)
export const fitDescription = (...candidates) => fit(candidates, 110, 160)

// A long headline stays the H1; the <title> keeps its head, cut at a natural
// break (" — ", ": ", ", ") so it lands in 30-60 characters.
export function titleFromHeadline(headline, suffix = ' | Recon 6') {
  const base = String(headline).replace(/\s*\((?:[A-Z][a-z]+ )?\d{4}\)\s*$/, '')
  const cuts = []
  for (const sep of [' — ', ': ', ', ', ' - ']) {
    for (let i = base.indexOf(sep); i !== -1; i = base.indexOf(sep, i + 1)) cuts.push(base.slice(0, i))
  }
  cuts.sort((a, b) => b.length - a.length)
  return fitTitle(headline, base, ...cuts, ...cuts.map((c) => `${c}${suffix}`))
}

// Whole sentences up to 160 characters; a word-boundary cut only if that
// leaves under 110.
export function descriptionFrom(text) {
  const d = String(text).replace(/\s+/g, ' ').trim()
  if (d.length <= 160) return d
  let out = ''
  for (const sentence of d.match(/[^.!?]+[.!?]+(\s|$)/g) || []) {
    if ((out + sentence).trim().length > 160) break
    out += sentence
  }
  out = out.trim()
  if (out.length >= 110) return out
  const cut = d.slice(0, 157)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]+$/, '')}…`
}

// ---- outside sources --------------------------------------------------------
const REFS = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'reference-links.json'), 'utf8'))

export function operatorSources(name) {
  const r = REFS.operators[name] || {}
  return [
    r.ubisoft && { label: `Ubisoft: official ${name} operator page`, note: 'loadout, gadget and abilities', url: r.ubisoft },
    r.siegegg && { label: `SiegeGG: ${name} operator stats`, note: 'pick and ban rates in professional matches', url: r.siegegg },
  ].filter(Boolean)
}

export function mapSources(mapId, mapName) {
  const r = REFS.maps[mapId] || {}
  return [
    r.ubisoft && { label: `Ubisoft: official ${mapName} map page`, note: 'layout, floors and bomb sites', url: r.ubisoft },
    r.siegegg && { label: `SiegeGG: ${mapName} map stats`, note: 'how the map plays in professional matches', url: r.siegegg },
  ].filter(Boolean)
}

export function seasonSources() {
  const g = REFS.general
  return [
    g.ubisoftSeasonNotes && { label: "Ubisoft: this season's designer's notes", note: 'the official balance changes and the reasons for them', url: g.ubisoftSeasonNotes },
    g.ubisoftPatchNotes && { label: 'Ubisoft: Rainbow Six Siege patch notes', note: 'every official patch', url: g.ubisoftPatchNotes },
    g.siegeggOperators && { label: 'SiegeGG: operator stats', note: 'which operators professional teams pick and ban', url: g.siegeggOperators },
  ].filter(Boolean)
}

const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function sourcesHtml(sources, heading = 'Sources') {
  if (!sources.length) return ''
  return `
    <section class="sources" aria-labelledby="sources-heading">
      <h2 id="sources-heading">${escapeHtml(heading)}</h2>
      <ul>${sources.map((s) => `<li><a href="${escapeHtml(s.url)}" rel="noopener">${escapeHtml(s.label)}</a>${s.note ? ` <span>— ${escapeHtml(s.note)}</span>` : ''}</li>`).join('')}</ul>
      <p class="sources-note">Links checked ${escapeHtml(humanDate(REFS.verifiedOn))}. Ubisoft's pages are the authority if anything here disagrees.</p>
    </section>`
}

// ---- byline and how-it-was-made --------------------------------------------
const PROCESS = {
  guide: "Built from Recon 6's strat library, the same map, site and operator data the app uses. Site names follow Ubisoft's official map list. The strats are in beta; if a callout or setup doesn't match your game,",
  operatorGuide: "Built from Recon 6's strat library: every site where Recon 6's plans pick this operator. For loadout and gadget numbers, Ubisoft's official operator page is the authority. If something doesn't match your game,",
  aiPost: 'Drafted with AI assistance from Recon 6\'s strat library and notes, then published by Aaron Henry. Check gadget and season details against the official sources at the end. If something doesn\'t match your game,',
}

export function bylineHtml({ datePublished, dateModified, kind = 'guide' }) {
  const updated = dateModified && dateModified !== datePublished
    ? ` · Updated <time datetime="${escapeHtml(dateModified)}">${escapeHtml(humanDate(dateModified))}</time>` : ''
  return `
      <p class="byline">By <a href="${AUTHOR_PATH}" rel="author">${AUTHOR_NAME}</a>, founder of Recon 6 · Published <time datetime="${escapeHtml(datePublished)}">${escapeHtml(humanDate(datePublished))}</time>${updated}</p>
      <p class="process-note">${PROCESS[kind] || PROCESS.guide} <a href="/about#contact">tell us</a>.</p>`
}

export function figureHtml({ src, alt, caption }) {
  return `
      <figure class="article-figure">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="1200" height="630" loading="lazy" />
        ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
      </figure>`
}

// ---- chrome shared by every static page ------------------------------------
export function navHtml() {
  return `<nav class="nav">
    <a class="brand" href="${SITE_URL}/">RECON<span>6</span></a>
    <div class="nav-links">
      <a href="${SITE_URL}/blog/">Blog</a>
      <a href="${SITE_URL}/guides/">Map guides</a>
      <a href="${SITE_URL}/strats">Interactive strats</a>
      <a href="${SITE_URL}/pricing">Pricing</a>
    </div>
  </nav>`
}

export function footerHtml() {
  return `<div class="footer-strip">
    <p>&copy; Recon 6 — Rainbow Six Siege coaching, built by <a href="${AUTHOR_PATH}">${AUTHOR_NAME}</a>. Fan-made; not affiliated with Ubisoft.</p>
    <p><a href="${SITE_URL}/about">About</a> · <a href="${SITE_URL}/about#contact">Contact</a> · <a href="${SITE_URL}/pricing">Pricing</a> · <a href="${SITE_URL}/privacy">Privacy</a> · <a href="${SITE_URL}/terms">Terms</a></p>
  </div>`
}

export const ARTICLE_CSS = `
    .byline { color: rgba(235,228,215,0.75); font-size: 0.9rem; margin: 0 0 6px; }
    .process-note { color: rgba(235,228,215,0.6); font-size: 0.84rem; margin: 0 0 22px; }
    .article-figure { margin: 22px 0; }
    .article-figure img { width: 100%; height: auto; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: #1a1b1b; }
    .article-figure figcaption { font-size: 0.82rem; color: rgba(235,228,215,0.6); margin-top: 6px; }
    .sources { margin: 32px 0 0; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
    .sources ul { padding-left: 20px; }
    .sources li span { color: rgba(235,228,215,0.65); }
    .sources-note { font-size: 0.82rem; color: rgba(235,228,215,0.55); }
    .footer-strip p { margin: 4px 0; }`
