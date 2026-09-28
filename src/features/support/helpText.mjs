// Pure Help Center helpers: job-based sections, query terms, search-term
// highlighting, a tiny safe article-body parser (no HTML injection: the
// renderer maps these blocks to React elements), and the local ranking the
// dev fixture uses for queries the generated snapshots do not cover (the
// server ranks with BM25). Tested in helpText.test.mjs.

// Job-based sections. Articles carry a backend `category` (the case
// vocabulary); the section is derived from it here (presentation only).
// `category` is what "Ask about ..." pre-selects in Get Help.
export const HELP_SECTIONS = Object.freeze([
  { id: 'connect', title: 'Connect accounts', blurb: 'In-game ID, platform and the sources Recon reads.', category: 'ubisoft_connection', categories: ['ubisoft_connection', 'psn_connection', 'xbox_connection', 'trn_data'] },
  { id: 'vod', title: 'VOD & replays', blurb: 'Uploads, stuck reviews and what a review covers.', category: 'vod_analysis', categories: ['vod_upload', 'vod_analysis', 'ai_result', 'replay_upload'] },
  { id: 'rank', title: 'Rank & stats', blurb: 'Why a rank looks off and how your history is kept.', category: 'rank_stat_discrepancy', categories: ['rank_stat_discrepancy', 'historical_data'] },
  { id: 'access', title: 'Membership & access', blurb: 'Plan features that look locked or missing.', category: 'access_entitlement', categories: ['access_entitlement', 'subscription'] },
  { id: 'billing', title: 'Billing', blurb: 'Charges, receipts and managing your plan.', category: 'billing_question', categories: ['billing_question', 'cancellation'] },
  { id: 'account', title: 'Signing in', blurb: 'Passwords, confirmation codes and your login email.', category: 'account_login', categories: ['account_login', 'email_verification'] },
  { id: 'coaching', title: 'Coaching credits', blurb: 'Sessions, credits and booking.', category: 'coaching_credits', categories: ['coaching_credits', 'coaching_session'] },
  { id: 'desktop', title: 'Desktop app', blurb: 'Install, activation and capture setup.', category: 'desktop_client', categories: ['desktop_client'] },
])

export function sectionById(id) {
  return HELP_SECTIONS.find((s) => s.id === id) || null
}

export function sectionForCategory(category) {
  return HELP_SECTIONS.find((s) => s.categories.includes(category)) || null
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'be', 'but', 'can', 'cant', 'did', 'do', 'does', 'doesnt', 'dont', 'for', 'from', 'how',
  'i', 'im', 'in', 'is', 'isnt', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'so', 'the', 'this', 'to', 'was', 'what',
  'when', 'why', 'with', 'wont', 'you', 'your',
])

export function queryTerms(q = '') {
  const out = []
  for (const raw of String(q).toLowerCase().replace(/['’]/g, '').split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOPWORDS.has(raw) || out.includes(raw)) continue
    out.push(raw)
  }
  return out
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Split `text` into [{text, match}] where match marks words that start with a
// query term (case-insensitive). Concatenating the parts returns the input.
export function highlightSegments(text = '', q = '') {
  const s = String(text)
  const terms = queryTerms(q)
  if (!s || !terms.length) return s ? [{ text: s, match: false }] : []
  const re = new RegExp(`\\b(${terms.map(escapeRe).sort((a, b) => b.length - a.length).join('|')})[a-z0-9]*`, 'gi')
  const out = []
  let last = 0
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), match: false })
    out.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last), match: false })
  return out
}

// ---- Article body -----------------------------------------------------------------
// Supported: "## h2", "### h3", "- item", "1. item", "> note", blank-line
// paragraphs; inline **bold**, `code`, [label](/internal-path). External or
// javascript: links render as plain text on purpose.

export function parseInline(text = '') {
  const out = []
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  const s = String(text)
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ type: 'text', text: s.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ type: 'strong', text: m[1] })
    else if (m[2] !== undefined) out.push({ type: 'code', text: m[2] })
    else {
      const href = m[4]
      const internal = /^\/(?!\/)[A-Za-z0-9/_\-#?=&.]*$/.test(href)
      out.push(internal ? { type: 'link', text: m[3], href } : { type: 'text', text: m[3] })
    }
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ type: 'text', text: s.slice(last) })
  return out
}

export function parseArticleBody(md = '') {
  const blocks = []
  let para = []
  let list = null
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', inline: parseInline(para.join(' ')) })
    para = []
  }
  const flushList = () => {
    if (list) blocks.push(list)
    list = null
  }
  for (const rawLine of String(md).replace(/\r\n?/g, '\n').split('\n')) {
    const lineText = rawLine.trim()
    if (!lineText) { flushPara(); flushList(); continue }
    let m
    if ((m = lineText.match(/^(#{2,3})\s+(.*)$/))) {
      flushPara(); flushList()
      blocks.push({ type: m[1].length === 2 ? 'h2' : 'h3', inline: parseInline(m[2]) })
    } else if ((m = lineText.match(/^[-*]\s+(.*)$/))) {
      flushPara()
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } }
      list.items.push(parseInline(m[1]))
    } else if ((m = lineText.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara()
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } }
      list.items.push(parseInline(m[1]))
    } else if ((m = lineText.match(/^>\s?(.*)$/))) {
      flushPara(); flushList()
      blocks.push({ type: 'note', inline: parseInline(m[1]) })
    } else {
      flushList()
      para.push(lineText)
    }
  }
  flushPara(); flushList()
  return blocks
}

// ---- Local ranking (fixture only; production ranks server-side) ---------------------

const SYNONYMS = Object.freeze({
  locked: ['access', 'missing', 'paywall'],
  access: ['locked', 'plan'],
  charged: ['billing', 'charge', 'payment'],
  charge: ['billing', 'payment'],
  refund: ['billing'],
  mmr: ['rank'],
  elo: ['rank'],
  stats: ['rank', 'tracker'],
  vod: ['review', 'replay'],
  replay: ['vod'],
  stuck: ['failed', 'processing'],
  psn: ['playstation', 'platform'],
  xbox: ['platform'],
  ubisoft: ['platform', 'id'],
  install: ['desktop', 'client'],
  app: ['desktop', 'client'],
  coach: ['coaching', 'session'],
  session: ['coaching'],
})

function expandTerms(terms) {
  const out = new Map()
  for (const t of terms) {
    out.set(t, Math.max(out.get(t) || 0, 1))
    for (const s of SYNONYMS[t] || []) out.set(s, Math.max(out.get(s) || 0, 0.5))
  }
  return out
}

function countHits(hay, term) {
  if (!hay) return 0
  const re = new RegExp(`\\b${escapeRe(term)}`, 'g')
  return (hay.match(re) || []).length
}

export function rankArticles(articles = [], q = '') {
  const terms = queryTerms(q)
  if (!terms.length) return articles.slice()
  const weighted = expandTerms(terms)
  const scored = []
  for (const a of articles) {
    const title = String(a.title || '').toLowerCase()
    const summary = String(a.summary || '').toLowerCase()
    const body = String(a.body || '').toLowerCase()
    const tags = [...(a.keywords || []), ...(a.tags || [])].join(' ').toLowerCase()
    let score = 0
    for (const [term, w] of weighted) {
      score += w * (3 * countHits(title, term) + 2 * countHits(summary, term) + 2 * countHits(tags, term) + Math.min(3, countHits(body, term)) * 0.5)
    }
    if (score > 0) scored.push({ a, score })
  }
  scored.sort((x, y) => y.score - x.score || String(x.a.title).localeCompare(String(y.a.title)))
  return scored.map((s) => s.a)
}

export function groupBySection(articles = []) {
  const map = Object.fromEntries(HELP_SECTIONS.map((s) => [s.id, []]))
  const other = []
  for (const a of articles) (map[a.section || sectionForCategory(a.category)?.id] || other).push(a)
  return { sections: HELP_SECTIONS.map((s) => ({ ...s, articles: map[s.id] })), other }
}

export function isReviewed(article) {
  return article?.status === 'reviewed'
}
