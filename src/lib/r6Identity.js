const PLATFORM_ALIASES = new Map([
  ['ps5', 'psn'],
  ['psn', 'psn'],
  ['playstation', 'psn'],
  ['playstation5', 'psn'],
  ['sony', 'psn'],
  ['xbox', 'xbl'],
  ['xboxlive', 'xbl'],
  ['xbl', 'xbl'],
  ['pc', 'ubi'],
  ['windows', 'ubi'],
  ['ubi', 'ubi'],
  ['ubisoft', 'ubi'],
  ['ubisoftconnect', 'ubi'],
])

function cleanHandle(value) {
  const handle = String(value || '').trim()
  return handle && handle.length <= 100 ? handle : ''
}

function gameProfiles(profile) {
  if (profile?.game_profiles && typeof profile.game_profiles === 'object') return profile.game_profiles
  try {
    const parsed = JSON.parse(profile?.game_profiles_json || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function normalizeR6Platform(value) {
  const key = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  return PLATFORM_ALIASES.get(key) || null
}

export function resolveR6TrackerIdentity(profile) {
  const r6 = gameProfiles(profile).r6 || {}
  const trackerHandle = cleanHandle(r6.tracker_handle || r6.tracker_username)
  const trackerPlatform = normalizeR6Platform(r6.tracker_platform || r6.platform || profile?.platform)
  if (trackerHandle && trackerPlatform) {
    return { handle: trackerHandle, platform: trackerPlatform, source: 'tracker-profile' }
  }

  const gamerId = cleanHandle(profile?.gamer_id)
  const accountPlatform = normalizeR6Platform(profile?.platform || r6.platform)
  if (gamerId && accountPlatform) {
    return { handle: gamerId, platform: accountPlatform, source: 'account-gamer-id' }
  }

  const ubisoftUsername = cleanHandle(r6.ubisoft_username)
  if (ubisoftUsername) {
    return { handle: ubisoftUsername, platform: 'ubi', source: 'ubisoft-username' }
  }

  // display_name is intentionally not a fallback. It is a friendly name in
  // account setup and may not be a public PSN/Xbox/Ubisoft identifier.
  return null
}

export function r6TrackerProfileUrl(identity) {
  if (!identity?.handle || !normalizeR6Platform(identity.platform)) return null
  const platform = normalizeR6Platform(identity.platform)
  return `https://r6.tracker.network/r6siege/profile/${platform}/${encodeURIComponent(identity.handle)}/overview`
}

export function describeRankEvidence(snapshot, identity, now = Date.now()) {
  if (!snapshot?.rank) return { verified: false, stale: true, identityMatch: null }
  const verifiedAt = snapshot.confirmed_at || snapshot.observed_at || snapshot.captured_at || null
  const timestamp = Date.parse(verifiedAt || '')
  const ageHours = Number.isFinite(timestamp) ? Math.max(0, (Number(now) - timestamp) / 3_600_000) : null
  const recordedHandle = cleanHandle(snapshot.player_handle)
  const recordedPlatform = normalizeR6Platform(snapshot.platform)
  const identityMatch = recordedHandle && recordedPlatform && identity
    ? recordedHandle.toLowerCase() === identity.handle.toLowerCase() && recordedPlatform === identity.platform
    : null
  return {
    verified: true,
    // Evidence is current only when it is recent and bound to the exact
    // account identity. Older snapshots that predate identity binding must be
    // re-confirmed instead of being silently applied to another player.
    stale: ageHours == null || ageHours > 24 || identityMatch !== true,
    ageHours,
    verifiedAt,
    identityMatch,
    source: snapshot.source || 'user-confirmed-screenshot',
  }
}
