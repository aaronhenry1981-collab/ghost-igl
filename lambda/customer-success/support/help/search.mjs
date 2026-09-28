// Help Center search (ARCHITECTURE §13): local natural-language ranking.
//
// Field-weighted BM25 (title > keywords > summary > body) with gamer synonyms
// and an intent/category boost from the deterministic classifier. Reviewed
// articles only by default; drafts appear only with `includeDrafts`.
// proposeArticlesFromCases() turns case trends into PROPOSALS; nothing here
// publishes or edits an article.

import { createHash } from 'node:crypto'
import { ARTICLES } from './articles.mjs'
import { categoryInfo, classifyIssue, normalizeText } from '../classify.mjs'

const FIELDS = Object.freeze({ title: 3, keywords: 2.5, summary: 1.5, body: 1 })
const K1 = 1.2
const B = 0.75

const STOPWORDS = new Set('a an and are as at be but by can do does for from get got has have how i if in into is it its me my no of on or so that the their them then there this to up was we what when where which who why will with you your im'.split(' '))

// Phrase and token synonyms (query side). Keys are normalized text.
const PHRASES = [
  [/\bubi ?connect\b|\buplay\b/g, ' ubisoft '],
  [/\bk ?\/ ?d\b/g, ' kd '],
  [/\blog ?in\b|\bsign ?in\b/g, ' login '],
  [/\bxbox live\b|\bxbl\b/g, ' xbox '],
  [/\bplay ?station\b|\bps[45]\b/g, ' psn '],
  [/\b1 ?(on|:) ?1\b|\bone on one\b/g, ' coaching session '],
  [/\bcharged twice\b|\bdouble charged?\b/g, ' charged charge billing '],
  [/\b\.?rec files?\b/g, ' replay '],
]
const SYNONYMS = {
  ubi: ['ubisoft'],
  psn: ['playstation', 'psn'],
  gamertag: ['xbox', 'gamertag'],
  vod: ['vod', 'review', 'screenshots'],
  vods: ['vod', 'review'],
  clip: ['vod', 'video'],
  screenshot: ['screenshots', 'vod'],
  sub: ['subscription', 'plan'],
  membership: ['subscription', 'plan'],
  tier: ['plan'],
  elo: ['rank', 'mmr'],
  mmr: ['rank', 'mmr'],
  rp: ['rank'],
  stat: ['stats'],
  kd: ['kd', 'stats'],
  trn: ['tracker'],
  replays: ['replay'],
  overlay: ['desktop', 'app'],
  app: ['app', 'desktop'],
  credit: ['credits'],
  lesson: ['coaching', 'session'],
  refund: ['billing', 'refund'],
  charge: ['billing', 'charge'],
  card: ['billing', 'card', 'payment'],
  pw: ['password'],
  code: ['code', 'confirmation'],
  verify: ['confirmation', 'code'],
  history: ['history', 'snapshots'],
  export: ['export', 'data'],
}

function stem(token) {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3)
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith('es') && !token.endsWith('ses')) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

export function tokenize(text) {
  return normalizeText(text).split(' ').map((t) => t.replace(/^[./:]+|[./:]+$/g, '')).filter((t) => t && !STOPWORDS.has(t)).map(stem)
}

function expandQuery(query) {
  let norm = ` ${normalizeText(query)} `
  for (const [re, replacement] of PHRASES) norm = norm.replace(re, replacement)
  const out = []
  for (const raw of norm.split(' ').filter(Boolean)) {
    if (STOPWORDS.has(raw)) continue
    out.push(stem(raw))
    for (const syn of SYNONYMS[raw] || []) out.push(stem(syn))
  }
  return [...new Set(out)]
}

function fieldText(article, field) {
  return field === 'keywords' ? (article.keywords || []).join(' ') : String(article[field] || '')
}

function buildIndex(docs) {
  const stats = {}
  const indexed = docs.map((doc) => {
    const fields = {}
    for (const field of Object.keys(FIELDS)) {
      const tokens = tokenize(fieldText(doc, field))
      const tf = new Map()
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
      fields[field] = { tf, len: tokens.length }
      stats[field] = stats[field] || { total: 0 }
      stats[field].total += tokens.length
    }
    return { doc, fields }
  })
  for (const field of Object.keys(FIELDS)) stats[field].avg = docs.length ? stats[field].total / docs.length : 0
  const df = new Map()
  for (const entry of indexed) {
    const seen = new Set()
    for (const field of Object.keys(FIELDS)) for (const t of entry.fields[field].tf.keys()) seen.add(t)
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1)
  }
  return { indexed, stats, df, n: docs.length }
}

function bm25(index, entry, terms) {
  let score = 0
  for (const term of terms) {
    const df = index.df.get(term) || 0
    if (!df) continue
    const idf = Math.log(1 + (index.n - df + 0.5) / (df + 0.5))
    for (const [field, weight] of Object.entries(FIELDS)) {
      const f = entry.fields[field]
      const tf = f.tf.get(term) || 0
      if (!tf) continue
      const avg = index.stats[field].avg || 1
      score += weight * idf * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * f.len) / avg)))
    }
  }
  return score
}

function visible(article, includeDrafts) {
  return includeDrafts ? article.status === 'draft' || article.status === 'reviewed' : article.status === 'reviewed'
}

// Also accepts the service's single-object form: searchHelp({ q, limit, category, intent }).
export function searchHelp(query, options = {}) {
  if (query && typeof query === 'object') {
    options = { ...query, ...options }
    query = query.q ?? query.query ?? ''
  }
  const { includeDrafts = false, limit = 5, category = null, intent = null, articles = ARTICLES } = options || {}
  const docs = (Array.isArray(articles) ? articles : []).filter((a) => visible(a, includeDrafts) && (!category || a.category === category))
  const terms = expandQuery(query)
  if (!docs.length || !terms.length) return []
  const index = buildIndex(docs)
  const cls = classifyIssue(query)
  const scored = index.indexed.map((entry) => {
    let score = bm25(index, entry, terms)
    if (score > 0 && cls.category !== 'other' && cls.confidence >= 0.3 && entry.doc.category === cls.category) score *= 1.4
    if (score > 0 && Array.isArray(entry.doc.intents) && entry.doc.intents.includes(intent || cls.intent)) score *= 1.1
    return { entry, score }
  }).filter((s) => s.score > 0)
  scored.sort((a, b) => b.score - a.score || a.entry.doc.slug.localeCompare(b.entry.doc.slug))
  return scored.slice(0, Math.max(1, Math.min(20, Number(limit) || 5))).map(({ entry, score }) => ({
    slug: entry.doc.slug,
    title: entry.doc.title,
    summary: entry.doc.summary,
    category: entry.doc.category,
    status: entry.doc.status,
    score: Math.round(score * 1000) / 1000,
  }))
}

// The Help Center home: every visible article as a summary (no body), in a
// stable order (category, then title). Reviewed only unless includeDrafts.
export function listArticles(options = {}) {
  const { includeDrafts = false, category = null, articles = ARTICLES } = options || {}
  return (Array.isArray(articles) ? articles : [])
    .filter((a) => visible(a, includeDrafts) && (!category || a.category === category))
    .map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, category: a.category, status: a.status }))
    .sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.title).localeCompare(String(b.title)))
}

// Also accepts getArticle({ slug, includeDrafts }).
export function getArticle(slug, options = {}) {
  if (slug && typeof slug === 'object') {
    options = { ...slug, ...options }
    slug = slug.slug
  }
  const { includeDrafts = false, articles = ARTICLES } = options || {}
  const article = (Array.isArray(articles) ? articles : []).find((a) => a.slug === slug)
  if (!article || !visible(article, includeDrafts)) return null
  return JSON.parse(JSON.stringify(article))
}

// Case trends -> proposals (never published). A category qualifies when staff
// flagged a documentation gap on a resolved case, or when 3+ cases share it.
export function proposeArticlesFromCases(cases, { articles = ARTICLES, minCases = 3 } = {}) {
  const groups = new Map()
  for (const c of Array.isArray(cases) ? cases : []) {
    if (!c?.category) continue
    if (!groups.has(c.category)) groups.set(c.category, [])
    groups.get(c.category).push(c)
  }
  const proposals = []
  for (const [category, list] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
    const docGaps = list.filter((c) => c.learning?.docGap === true)
    if (!docGaps.length && list.length < minCases) continue
    const existing = (articles || []).find((a) => a.category === category) || null
    const rootCauses = {}
    for (const c of list) if (c.rootCause) rootCauses[c.rootCause] = (rootCauses[c.rootCause] || 0) + 1
    const ids = list.map((c) => c.caseId || c.caseNumber || '').sort().join(',')
    proposals.push({
      proposalId: `KBP-${category}-${createHash('sha256').update(ids).digest('hex').slice(0, 10)}`,
      kind: existing ? 'update_article' : 'new_article',
      category,
      slug: existing?.slug || null,
      title: existing ? `Update "${existing.title}"` : `New article: ${categoryInfo(category).label}`,
      evidence: {
        kind: 'fact',
        caseCount: list.length,
        docGapCount: docGaps.length,
        caseNumbers: list.map((c) => c.caseNumber).filter(Boolean).slice(0, 5),
        topRootCauses: Object.entries(rootCauses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cause, count]) => ({ cause, count })),
      },
      status: 'proposed',
      publish: false,
      note: 'Proposal only. A person writes the change and the owner reviews it before anything is served.',
    })
  }
  return proposals
}
