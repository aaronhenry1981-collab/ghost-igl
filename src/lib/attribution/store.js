// Browser storage for acquisition attribution.
//
//   recon:attr:v1       attribution state (first touch, last touch, history)
//   recon:attr:sync:v1  which attribution events each signed-in player on this
//                       browser has already recorded (event keys only)
//
// captureAttribution() runs once per page load, before the router normalises
// the URL and BEFORE the older tracker (refSource.js) writes this visit into
// `recon:src`, so a `recon:src` value found here is genuinely historical and is
// kept as the first touch instead of being overwritten.
//
// Nothing here throws: blocked storage or odd URLs lose attribution, never the
// page.

import { ATTRIBUTION_VERSION, attributionSnapshot, mergeTouch, readParams, seedFromLegacy, touchFromLocation } from './core.js'

export const STORE_KEY = 'recon:attr:v1'
export const SYNC_KEY = 'recon:attr:sync:v1'
const LEGACY_KEY = 'recon:src'
const MAX_SYNC_KEYS = 60
const MAX_SYNC_USERS = 5

function storageOf(win = globalThis.window) {
  try {
    return win?.localStorage || null
  } catch {
    return null
  }
}

function getItem(storage, key) {
  try {
    return storage ? storage.getItem(key) : null
  } catch {
    return null
  }
}

function setItem(storage, key, value) {
  try {
    if (storage) storage.setItem(key, JSON.stringify(value))
  } catch { /* storage full or blocked */ }
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// The older tracker's sanitiser (src/lib/refSource.js), used only to recognise
// a legacy value that was written from this very URL.
function legacySanitize(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32)
}

export function readAttribution(storage = storageOf()) {
  const state = parseJson(getItem(storage, STORE_KEY))
  return state && state.v === ATTRIBUTION_VERSION && state.firstTouch ? state : null
}

export function captureAttribution({ win = globalThis.window, now = Date.now() } = {}) {
  try {
    if (!win?.location) return null
    const storage = storageOf(win)
    const { search = '', hash = '', pathname = '/', hostname = 'r6coaching.com' } = win.location
    const touch = touchFromLocation({ search, hash, pathname, referrer: win.document?.referrer || '', siteHost: hostname, now })
    let state = readAttribution(storage)
    if (!state) {
      // First run of this tracker in this browser: keep what the older
      // tracker recorded as the historical first touch.
      const legacy = getItem(storage, LEGACY_KEY)
      const params = readParams(search, hash)
      const fromThisUrl = legacySanitize(params.get('ref') || params.get('utm_source'))
      if (legacy && legacy !== fromThisUrl) state = seedFromLegacy(legacy, { now })
    }
    const next = mergeTouch(state, touch, { now })
    setItem(storage, STORE_KEY, next)
    return next
  } catch {
    return null
  }
}

// Short, stable, non-reversible key for a signed-in user on this browser
// (FNV-1a). Only used to remember which events were already recorded.
export function userKeyFor(userId) {
  let h = 0x811c9dc5
  const text = `recon-attr:${userId}`
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function readSynced(userKey, storage = storageOf()) {
  const log = parseJson(getItem(storage, SYNC_KEY)) || {}
  return new Set(Array.isArray(log[userKey]) ? log[userKey] : [])
}

export function markSynced(userKey, keys, storage = storageOf()) {
  const log = parseJson(getItem(storage, SYNC_KEY)) || {}
  const merged = [...new Set([...(Array.isArray(log[userKey]) ? log[userKey] : []), ...keys])].slice(-MAX_SYNC_KEYS)
  const next = { ...log, [userKey]: merged }
  const users = Object.keys(next)
  for (const old of users.slice(0, Math.max(0, users.length - MAX_SYNC_USERS))) delete next[old]
  setItem(storage, SYNC_KEY, next)
}

// Plausible custom properties: where this browser first came from (first
// non-direct source), how, and where it landed. Never personal data.
export function attributionProps(state = readAttribution()) {
  const snap = attributionSnapshot(state)
  if (!snap) return {}
  const first = snap.firstNonDirectTouch || snap.firstTouch
  const props = {
    source: first?.source,
    channel: first?.channel,
    medium: first?.medium,
    campaign: first?.campaign,
    content: first?.content,
    last_source: snap.lastTouch?.source,
    landing: snap.landingPath,
  }
  return Object.fromEntries(Object.entries(props).filter(([, value]) => typeof value === 'string' && value !== ''))
}
