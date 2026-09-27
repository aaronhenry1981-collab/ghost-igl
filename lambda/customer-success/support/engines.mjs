// Engine loader for the support service.
//
// The engines (classification, diagnostics, copilot, Help Center search,
// proactive rules, inbound-email decisions) live in their own modules and
// are written separately. The service never imports them directly: it takes
// them through `engines`, and routes/support.mjs passes
// `ctx.supportEngines || await import('./engines.mjs')`.
//
// A module that is not present yet is replaced by a minimal stub that
// returns `status: 'not_available'`, so the core and its tests run either
// way. A module that IS present but fails to import is a real error and is
// NOT swallowed. `ENGINE_STATUS` says which engines are real.
//
// This production module never exports `helpPreview`: draft Help Center
// articles are served ONLY when a dev-only engines override sets
// `helpPreview: true` (scripts/support/generate-fixtures.mjs). The service
// refuses drafts otherwise, whatever an engine returns.

import { existsSync } from 'node:fs'

async function load(relative) {
  const url = new URL(relative, import.meta.url)
  if (!existsSync(url)) return null
  return import(url.href)
}

function pick(mod, name, stub) {
  const fn = mod?.[name] ?? mod?.default?.[name]
  return typeof fn === 'function' ? { fn, real: true } : { fn: stub, real: false }
}

const NOT_AVAILABLE = 'not_available'

const stubs = {
  classifyIssue: () => ({ status: NOT_AVAILABLE, category: 'other', subcategory: null, intent: null, confidence: 0, questions: [] }),
  // Optional: routing defaults per category (team, priority, severity).
  categoryInfo: () => null,
  buildDiagnostics: ({ view = 'player' } = {}) => ({ status: NOT_AVAILABLE, view, panels: [], signals: {} }),
  buildCopilot: () => ({ status: NOT_AVAILABLE }),
  searchHelp: () => ({ status: NOT_AVAILABLE, articles: [] }),
  listArticles: () => ({ status: NOT_AVAILABLE, articles: [] }),
  getArticle: () => null,
  // Case trends -> Help Center PROPOSALS (never published).
  proposeArticles: () => [],
  evaluateProactive: () => ({ status: NOT_AVAILABLE, findings: [] }),
  // Safe default: an undecidable email goes to human review, never a case.
  decideInboundEmail: () => ({ action: 'unmatched', reason: 'email_engine_not_available' }),
}

const [classify, diagnostics, copilot, help, proactive, email] = await Promise.all([
  load('./classify.mjs'),
  load('./diagnostics/index.mjs'),
  load('./copilot.mjs'),
  load('./help/search.mjs'),
  load('./proactive.mjs'),
  load('./email.mjs'),
])

const picked = {
  classifyIssue: pick(classify, 'classifyIssue', stubs.classifyIssue),
  categoryInfo: pick(classify, 'categoryInfo', stubs.categoryInfo),
  buildDiagnostics: pick(diagnostics, 'buildDiagnostics', stubs.buildDiagnostics),
  buildCopilot: pick(copilot, 'buildCopilot', stubs.buildCopilot),
  searchHelp: pick(help, 'searchHelp', stubs.searchHelp),
  listArticles: pick(help, 'listArticles', stubs.listArticles),
  getArticle: pick(help, 'getArticle', stubs.getArticle),
  proposeArticles: pick(help, 'proposeArticlesFromCases', stubs.proposeArticles),
  evaluateProactive: pick(proactive, 'evaluateProactive', stubs.evaluateProactive),
  decideInboundEmail: pick(email, 'decideInboundEmail', stubs.decideInboundEmail),
}

export const classifyIssue = picked.classifyIssue.fn
export const categoryInfo = picked.categoryInfo.fn
export const buildDiagnostics = picked.buildDiagnostics.fn
export const buildCopilot = picked.buildCopilot.fn
export const searchHelp = picked.searchHelp.fn
export const listArticles = picked.listArticles.fn
export const getArticle = picked.getArticle.fn
export const proposeArticles = picked.proposeArticles.fn
export const evaluateProactive = picked.evaluateProactive.fn
export const decideInboundEmail = picked.decideInboundEmail.fn

export const ENGINE_STATUS = Object.freeze(Object.fromEntries(Object.entries(picked).map(([k, v]) => [k, v.real ? 'loaded' : NOT_AVAILABLE])))
export const ENGINE_STUBS = Object.freeze(stubs)
