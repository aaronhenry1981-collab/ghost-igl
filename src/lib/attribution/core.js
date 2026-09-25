// Acquisition attribution: pure rules (no browser globals), shared by the
// browser capture and tests.
//
// Principles
//   - Keep the raw value for auditing (utm_source=chatgpt.com stays
//     "chatgpt.com") and add a readable, normalised source ("ChatGPT").
//   - Say how we know: every touch carries `evidence` (utm_tag, referrer,
//     ref_code, referral_code, legacy_first_touch, none). A ChatGPT UTM tag is
//     reported as a "ChatGPT-tagged visit", never as proof that ChatGPT
//     independently recommended Recon.
//   - First touch is never overwritten. Last touch follows the last
//     non-direct visit (a later direct visit does not erase it).
//   - Collect only what attribution needs: hostnames (never full referrer
//     URLs), landing paths (never query strings), no emails, no click IDs.

export const ATTRIBUTION_VERSION = 1
export const MAX_TOUCHES = 10
const MAX_VALUE = 100
const DEDUPE_WINDOW_MS = 30 * 60 * 1000

export const CHANNELS = Object.freeze({
  ai_search: 'AI search',
  search: 'Search',
  social_video: 'Short video',
  social: 'Social',
  community: 'Community',
  email: 'Email',
  paid: 'Paid',
  creator: 'Creator code',
  referral: 'Friend referral',
  website: 'Other website',
  direct: 'Direct',
})

// id, label, channel, utm aliases, referrer domains (suffix match)
export const KNOWN_SOURCES = Object.freeze([
  { id: 'chatgpt', label: 'ChatGPT', channel: 'ai_search', utm: ['chatgpt.com', 'chatgpt', 'chat.openai.com', 'openai'], domains: ['chatgpt.com', 'chat.openai.com'] },
  { id: 'perplexity', label: 'Perplexity', channel: 'ai_search', utm: ['perplexity', 'perplexity.ai'], domains: ['perplexity.ai'] },
  { id: 'gemini', label: 'Gemini', channel: 'ai_search', utm: ['gemini', 'gemini.google.com'], domains: ['gemini.google.com'] },
  { id: 'copilot', label: 'Microsoft Copilot', channel: 'ai_search', utm: ['copilot', 'copilot.microsoft.com'], domains: ['copilot.microsoft.com'] },
  { id: 'claude', label: 'Claude', channel: 'ai_search', utm: ['claude', 'claude.ai'], domains: ['claude.ai'] },
  { id: 'google', label: 'Google', channel: 'search', utm: ['google', 'google.com'], domains: ['google.com', 'google.co.uk', 'google.ca', 'google.com.au', 'google.de', 'google.fr', 'google.es', 'google.com.br', 'google.co.in'] },
  { id: 'bing', label: 'Bing', channel: 'search', utm: ['bing', 'bing.com'], domains: ['bing.com'] },
  { id: 'duckduckgo', label: 'DuckDuckGo', channel: 'search', utm: ['duckduckgo'], domains: ['duckduckgo.com'] },
  { id: 'tiktok', label: 'TikTok', channel: 'social_video', utm: ['tiktok', 'tiktok.com', 'tt'], domains: ['tiktok.com'] },
  { id: 'youtube', label: 'YouTube', channel: 'social_video', utm: ['youtube', 'youtube.com', 'yt', 'youtube_shorts', 'shorts'], domains: ['youtube.com', 'youtu.be'] },
  { id: 'instagram', label: 'Instagram', channel: 'social_video', utm: ['instagram', 'ig', 'instagram.com'], domains: ['instagram.com'] },
  { id: 'twitch', label: 'Twitch', channel: 'social_video', utm: ['twitch', 'twitch.tv'], domains: ['twitch.tv'] },
  { id: 'reddit', label: 'Reddit', channel: 'community', utm: ['reddit', 'reddit.com'], domains: ['reddit.com'] },
  { id: 'discord', label: 'Discord', channel: 'community', utm: ['discord', 'discord.gg', 'discord.com'], domains: ['discord.com', 'discord.gg', 'discordapp.com'] },
  { id: 'x', label: 'X (Twitter)', channel: 'social', utm: ['twitter', 'x', 'x.com', 'twitter.com'], domains: ['twitter.com', 'x.com', 't.co'] },
  { id: 'facebook', label: 'Facebook', channel: 'social', utm: ['facebook', 'fb', 'facebook.com'], domains: ['facebook.com', 'fb.com', 'l.facebook.com'] },
  { id: 'email', label: 'Email', channel: 'email', utm: ['email', 'newsletter', 'crm'], domains: [] },
])

const PAID_MEDIUMS = new Set(['cpc', 'ppc', 'paid', 'paid_social', 'paidsocial', 'ads', 'ad', 'display', 'sponsored'])

// ---- sanitising --------------------------------------------------------------

// Keep a raw value readable for auditing, but never store secrets or emails.
export function cleanRaw(value) {
  if (value === null || value === undefined) return null
  // eslint-disable-next-line no-control-regex
  const text = String(value).replace(/[\u0000-\u001f\u007f<>"'`]/g, '').trim().slice(0, MAX_VALUE)
  if (!text) return null
  if (text.includes('@')) return '[redacted]'
  return text
}

export function slug(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return text || null
}

export function hostnameOf(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.replace(/^www\./, '').replace(/^m\./, '')
  } catch {
    return null
  }
}

function domainMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`)
}

export function sourceFromUtm(raw) {
  const value = String(raw || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
  if (!value) return null
  return KNOWN_SOURCES.find((s) => s.utm.includes(value) || s.domains.some((d) => value === d)) || null
}

export function sourceFromDomain(host) {
  if (!host) return null
  return KNOWN_SOURCES.find((s) => s.domains.some((d) => domainMatches(host, d))) || null
}

// ---- reading a URL -----------------------------------------------------------

// Merge query parameters from before and inside the hash (both shapes occur).
export function readParams(search = '', hash = '') {
  const params = new URLSearchParams(search || '')
  const qIdx = String(hash || '').indexOf('?')
  if (qIdx !== -1) {
    for (const [k, v] of new URLSearchParams(hash.slice(qIdx))) if (!params.has(k)) params.set(k, v)
  }
  return params
}

// Build one touch from where the visitor landed. `siteHost` stops internal
// navigation from being mistaken for a referral.
export function touchFromLocation({ search = '', hash = '', pathname = '/', referrer = '', siteHost = 'r6coaching.com', now = Date.now() } = {}) {
  const params = readParams(search, hash)
  const utmSource = cleanRaw(params.get('utm_source'))
  const ref = cleanRaw(params.get('ref'))
  const referralMatch = /^\/r\/([A-Za-z0-9_-]{3,32})\/?$/.exec(pathname || '')
  const referralCode = referralMatch ? referralMatch[1].toUpperCase() : null
  const referrerHost = hostnameOf(referrer)
  const external = referrerHost && !domainMatches(referrerHost, String(siteHost).replace(/^www\./, '')) ? referrerHost : null

  const medium = cleanRaw(params.get('utm_medium'))
  const base = {
    v: ATTRIBUTION_VERSION,
    at: new Date(now).toISOString(),
    medium,
    campaign: cleanRaw(params.get('utm_campaign')),
    content: cleanRaw(params.get('utm_content')),
    term: cleanRaw(params.get('utm_term')),
    contentId: cleanRaw(params.get('cid') || params.get('content_id') || params.get('utm_content')),
    ref: ref ? slug(ref) : null,
    referralCode,
    referrerDomain: external,
    landingPath: String(pathname || '/').split('?')[0].slice(0, 200) || '/',
  }

  let known = null
  let source
  let sourceRaw = null
  let evidence
  let channel
  if (utmSource) {
    known = sourceFromUtm(utmSource)
    sourceRaw = utmSource
    source = known ? known.id : slug(utmSource) || 'unknown'
    evidence = 'utm_tag'
  } else if (ref) {
    known = sourceFromUtm(ref)
    sourceRaw = ref
    source = known ? known.id : `creator:${slug(ref)}`
    evidence = 'ref_code'
  } else if (referralCode) {
    source = 'friend_referral'
    evidence = 'referral_code'
    channel = 'referral'
  } else if (external) {
    known = sourceFromDomain(external)
    sourceRaw = external
    source = known ? known.id : external
    evidence = 'referrer'
  } else {
    source = 'direct'
    evidence = 'none'
    channel = 'direct'
  }

  if (!channel) {
    if (medium && PAID_MEDIUMS.has(medium.toLowerCase())) channel = 'paid'
    else if (known) channel = known.channel
    else if (evidence === 'ref_code') channel = 'creator'
    else if (evidence === 'referrer') channel = 'website'
    else channel = medium && medium.toLowerCase() === 'email' ? 'email' : 'website'
  }

  const label = known ? known.label : source === 'direct' ? 'Direct / unknown' : source === 'friend_referral' ? 'Friend referral' : source.startsWith('creator:') ? `Creator ${source.slice(8)}` : source
  return { ...base, source, sourceLabel: label, sourceRaw, channel, evidence }
}

// Plain-language description for reports. Never overclaims.
export function describeTouch(touch) {
  if (!touch) return 'Unknown'
  switch (touch.evidence) {
    case 'utm_tag': return `${touch.sourceLabel}-tagged visit (utm_source=${touch.sourceRaw})`
    case 'referrer': return `Visit from ${touch.referrerDomain || touch.sourceRaw} (referrer)`
    case 'ref_code': return touch.channel === 'creator' ? `Creator code "${touch.ref}"` : `${touch.sourceLabel} link code (ref=${touch.sourceRaw})`
    case 'referral_code': return `Friend referral (code ${touch.referralCode})`
    case 'legacy_first_touch': return `Recorded by the older tracker as "${touch.sourceRaw}"`
    default: return 'Direct or unknown'
  }
}

function sameTouch(a, b) {
  return a && b && a.source === b.source && a.campaign === b.campaign && a.content === b.content && a.referralCode === b.referralCode
}

// Fold a new touch into stored attribution state.
export function mergeTouch(state, touch, { now = Date.now() } = {}) {
  const prev = state && state.v === ATTRIBUTION_VERSION ? state : null
  const at = new Date(now).toISOString()
  if (!prev) {
    return {
      v: ATTRIBUTION_VERSION,
      firstTouch: touch,
      lastTouch: touch,
      touches: touch.evidence === 'none' ? [] : [touch],
      landingPath: touch.landingPath,
      visits: 1,
      firstSeenAt: at,
      lastSeenAt: at,
    }
  }
  const next = { ...prev, visits: (prev.visits || 0) + 1, lastSeenAt: at }
  if (touch.evidence === 'none') return next // direct visit: history only
  const last = prev.touches?.[prev.touches.length - 1]
  const recentDuplicate = sameTouch(last, touch) && Date.parse(touch.at) - Date.parse(last.at) < DEDUPE_WINDOW_MS
  if (!recentDuplicate) next.touches = [...(prev.touches || []), touch].slice(-MAX_TOUCHES)
  next.lastTouch = touch
  // First touch stays as it was. If the very first visit was direct and this
  // is the first real source, keep the direct first touch (history) and
  // expose the first non-direct touch separately.
  if (!prev.firstNonDirectTouch && prev.firstTouch?.evidence === 'none') next.firstNonDirectTouch = touch
  return next
}

// Seed state from the older single-value tracker (localStorage recon:src) so
// historical first-touch facts are preserved, never replaced.
export function seedFromLegacy(legacyValue, { now = Date.now() } = {}) {
  const raw = cleanRaw(legacyValue)
  if (!raw) return null
  const known = sourceFromUtm(raw) || (raw === 'chatgptcom' ? KNOWN_SOURCES[0] : null)
  const touch = {
    v: ATTRIBUTION_VERSION,
    at: null,
    source: known ? known.id : slug(raw) || 'unknown',
    sourceLabel: known ? known.label : raw,
    sourceRaw: raw,
    channel: known ? known.channel : 'website',
    evidence: 'legacy_first_touch',
    medium: null,
    campaign: null,
    content: null,
    term: null,
    contentId: null,
    ref: null,
    referralCode: null,
    referrerDomain: null,
    landingPath: null,
  }
  return { v: ATTRIBUTION_VERSION, firstTouch: touch, lastTouch: touch, touches: [touch], landingPath: null, visits: 0, firstSeenAt: new Date(now).toISOString(), lastSeenAt: new Date(now).toISOString(), seededFromLegacy: true }
}

// Snapshot attached to a funnel event (signup, checkout, booking...).
export function attributionSnapshot(state) {
  if (!state) return null
  const pick = (t) => (t ? { source: t.source, sourceLabel: t.sourceLabel, sourceRaw: t.sourceRaw, channel: t.channel, evidence: t.evidence, medium: t.medium, campaign: t.campaign, content: t.content, term: t.term, contentId: t.contentId, ref: t.ref, referralCode: t.referralCode, referrerDomain: t.referrerDomain, landingPath: t.landingPath, at: t.at } : null)
  return {
    firstTouch: pick(state.firstTouch),
    firstNonDirectTouch: pick(state.firstNonDirectTouch || null),
    lastTouch: pick(state.lastTouch),
    landingPath: state.landingPath || null,
    visits: state.visits || 0,
  }
}

// The legacy tracker's value (a short slug) for backwards compatibility with
// profile.referral_source. Keeps dots so chatgpt.com is not mangled.
export function legacySourceValue(touch) {
  if (!touch || touch.evidence === 'none') return null
  if (touch.evidence === 'referral_code') return 'friend-referral'
  return String(touch.source).replace(/^creator:/, '').slice(0, 32)
}
