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

function sanitize(raw) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32)
}

export function captureRefSource() {
  try {
    let ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref) {
      const hash = window.location.hash || ''
      const qIdx = hash.indexOf('?')
      if (qIdx !== -1) ref = new URLSearchParams(hash.slice(qIdx)).get('ref')
    }
    const clean = sanitize(ref)
    if (!clean) return
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, clean)
  } catch { /* storage blocked — lose attribution, never break the app */ }
}

export function getRefSource() {
  try { return localStorage.getItem(KEY) || null } catch { return null }
}

export function clearRefSource() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
