// Channel attribution — captures ?ref=<source> from inbound URLs so signups
// can be traced back to the channel that drove them (twitter, reddit, youtube,
// a specific creator code, etc.). First-touch wins: once a source is stored we
// never overwrite it, so a user who arrives via Twitter and later returns via
// Google still counts for Twitter.
//
// Works with both URL shapes the site sees:
//   r6coaching.com/?ref=twitter#/        (query before the hash)
//   r6coaching.com/?ref=twitter        (query inside the hash route)
//
// Distinct from the friend-referral system (recon:ref cookie + referral codes)
// — this is channel-level marketing attribution, stored on the profile's
// existing referral_source field via PUT /me.

const KEY = 'recon:src'
const CAMPAIGN_KEY = 'recon:campaign'

function sanitize(raw) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32)
}

export function setCampaignAttribution({ source, medium = '', campaign = '', content = '' }) {
  try {
    const cleanSource = sanitize(source)
    if (!cleanSource) return
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, cleanSource)

    const existing = getCampaignAttribution()
    if (existing && existing.source && existing.source !== 'direct') return
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify({
      source: cleanSource,
      medium: sanitize(medium),
      campaign: sanitize(campaign),
      content: sanitize(content),
    }))
  } catch { /* storage blocked — attribution never blocks navigation */ }
}

export function captureRefSource() {
  try {
    let query = new URLSearchParams(window.location.search)
    let ref = query.get('ref') || query.get('utm_source')
    if (!ref || !query.get('utm_campaign')) {
      const hash = window.location.hash || ''
      const qIdx = hash.indexOf('?')
      if (qIdx !== -1) {
        const hashQuery = new URLSearchParams(hash.slice(qIdx))
        ref ||= hashQuery.get('ref') || hashQuery.get('utm_source')
        query = new URLSearchParams([...query, ...hashQuery])
      }
    }
    if (!ref && document.referrer) {
      const hostname = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (hostname.includes('tiktok.com')) ref = 'tiktok'
      else if (hostname.includes('youtube.com') || hostname === 'youtu.be') ref = 'youtube'
      else if (hostname.includes('reddit.com')) ref = 'reddit'
      else if (hostname.includes('google.')) ref = 'google'
      else if (hostname.includes('discord.com') || hostname.includes('discord.gg')) ref = 'discord'
    }
    const clean = sanitize(ref)
    if (clean) {
      setCampaignAttribution({
        source: clean,
        medium: query.get('utm_medium'),
        campaign: query.get('utm_campaign'),
        content: query.get('utm_content'),
      })
    }
  } catch { /* storage blocked — lose attribution, never break the app */ }
}

export function getRefSource() {
  try { return localStorage.getItem(KEY) || null } catch { return null }
}

export function getCampaignAttribution() {
  try {
    const saved = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || 'null')
    return saved && typeof saved === 'object' ? saved : null
  } catch {
    return null
  }
}

export function clearRefSource() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
