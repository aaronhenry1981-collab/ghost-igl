// Normalise raw source records into one "facts" object with provenance.
//
// Every downstream rule (lifecycle, health, mission, activation, CRM queue)
// reads ONLY these facts. Each source carries an availability status:
//   ok            - read succeeded (data may still be empty)
//   unavailable   - read failed; do not treat as "none"
//   not_connected - this deployment does not have the source (yet)
// A rule that needs an unavailable source must say "unknown", never guess.
//
// Pure module: runs in the Lambda and in the browser (lite mode).

import { CLIMB_TASK_TOTAL, summarizeRoadToChampion } from './roadToChampion.mjs'
import { COACHING_SESSIONS_PER_MONTH, computeVodUsage, normalizePlan, pickBestSub, resolveBilling } from './plans.mjs'

export const SOURCE_STATUS = Object.freeze({ OK: 'ok', UNAVAILABLE: 'unavailable', NOT_CONNECTED: 'not_connected' })

const DAY = 86400000

export function toMs(value) {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
  return Date.parse(value)
}

export function isoOrNull(value) {
  const ms = toMs(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function source(sources, name) {
  const entry = sources?.[name]
  if (!entry || typeof entry !== 'object') return { status: SOURCE_STATUS.NOT_CONNECTED, data: null }
  const status = Object.values(SOURCE_STATUS).includes(entry.status) ? entry.status : SOURCE_STATUS.UNAVAILABLE
  return { status, data: status === SOURCE_STATUS.OK ? entry.data ?? null : null }
}

function parseGameProfiles(profile) {
  if (!profile) return {}
  if (profile.game_profiles && typeof profile.game_profiles === 'object') return profile.game_profiles
  if (typeof profile.game_profiles_json === 'string') {
    try {
      const parsed = JSON.parse(profile.game_profiles_json)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

// Production `profile_complete`: first + last name, display name and platform.
export function isProfileComplete(profile) {
  if (!profile) return false
  return Boolean(profile.first_name && profile.last_name && profile.display_name && profile.platform)
}

function pickCanonical(record, field) {
  const entry = record?.canonical?.[field]
  if (!entry || entry.value === undefined || entry.value === null || entry.value === '') return null
  return {
    value: entry.value,
    source: entry.source || null,
    capturedAt: isoOrNull(entry.captured_at),
    verification: entry.verification || null,
  }
}

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && item !== '')
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

// Map /me (production subscription Lambda) onto the ledger-derived shape so
// lite mode and full mode feed identical rules.
//
// Relies on the production /me contract: `plan` is production's effectivePlan
// (a legacy $29/$39 Elite price reports "elite", not the ledger's old
// "champion" label) and is "free" whenever the row does not grant access, so
// a past-due member's plan is unknown here and copy must not name one.
export function billingFromMe(me, { isAdmin = false } = {}) {
  if (!me) return resolveBilling(null, { available: false, isAdmin })
  const plan = isAdmin ? 'champion' : normalizePlan(me.plan)
  const subStatus = String(me.sub_status || 'none')
  const hasAccess = isAdmin || plan !== 'free'
  const endMs = toMs(me.current_period_end)
  const customerId = String(me.stripe_customer_id || '')
  const stripeBilled = customerId.startsWith('cus_')
  // Admin-granted rows are keyed comp_<email> / admin_<email>, never cus_.
  const granted = /^(comp_|admin_)/.test(customerId)
  let status
  if (isAdmin) status = 'admin'
  else if (hasAccess && me.vod_usage?.is_trial) status = 'trialing'
  else if (hasAccess && granted) status = 'comp'
  else if (hasAccess && subStatus === 'trialing') status = 'trialing'
  else if (hasAccess) status = 'active'
  else if (subStatus === 'past_due' || subStatus === 'unpaid' || subStatus === 'incomplete') status = 'payment_failed'
  else if (subStatus === 'expired') status = 'comp_expired'
  // Stripe says active/trialing but production does not honour the row: the
  // paid-through date passed or was never recorded.
  else if (subStatus === 'active' || subStatus === 'trialing') status = 'renewal_unconfirmed'
  else if (subStatus === 'canceled' || subStatus === 'cancelled') status = 'ended'
  else status = 'none'
  const labels = { free: 'Basic', pro: 'Pro', elite: 'Elite', champion: 'Champion' }
  const isPaidMember = hasAccess && !isAdmin && stripeBilled && status !== 'comp'
  return {
    available: true,
    source: 'account_api',
    asOf: null,
    plan,
    planLabel: isAdmin ? 'CEO' : labels[plan],
    status,
    rowStatus: subStatus,
    hasAccess,
    isComp: status === 'comp',
    isTrial: status === 'trialing',
    isPaidMember,
    isPaying: isPaidMember && status === 'active',
    paidPlan: isPaidMember ? plan : null,
    paidAmount: null,
    paidInterval: null,
    alsoPaying: null,
    paymentIssueRows: status === 'payment_failed' ? 1 : 0,
    currentPeriodEnd: isoOrNull(me.current_period_end),
    cancelAtPeriodEnd: false,
    paymentIssue: status === 'payment_failed' ? subStatus : null,
    paymentIssueSince: null,
    paymentIssueSinceBasis: null,
    stale: status === 'renewal_unconfirmed',
    staleReason: status === 'renewal_unconfirmed' ? (Number.isFinite(endMs) ? 'period_end_passed' : 'missing_period_end') : null,
    tierScope: me.tier_scope === 'single' ? 'single' : 'all_access',
    priceId: null,
    amount: null,
    interval: null,
    everPaid: status !== 'none' && status !== 'comp_expired',
    churned: status === 'ended',
    lastPaidPlan: hasAccess ? plan : null,
    rowCount: null,
    liveRowCount: null,
    duplicateLiveRows: false,
    stripeCustomerId: String(me.stripe_customer_id || '').startsWith('cus_') ? me.stripe_customer_id : null,
    canManageBilling: String(me.stripe_customer_id || '').startsWith('cus_'),
  }
}

function summarizeBookings(bookingData, email, now) {
  const bookings = Array.isArray(bookingData?.bookings) ? bookingData.bookings : []
  const mine = bookings.filter((row) => normalizeEmail(row?.customer?.email) === email && !String(row.slotId || '').startsWith('credits#'))
  const sessions = mine.map((row) => {
    const slot = String(row.slotId || '').split('#')[0]
    const startsAtMs = toMs(slot)
    const status = String(row.status || '').toLowerCase()
    return {
      id: String(row.slotId || ''),
      startsAt: isoOrNull(startsAtMs),
      startsAtMs,
      status,
      type: row.coachingType || null,
      label: row.sessionType || null,
      paid: row.payment?.status || null,
    }
  }).filter((session) => Number.isFinite(session.startsAtMs))
  const live = sessions.filter((s) => s.status === 'confirmed' || s.status === 'comped')
  const upcoming = live.filter((s) => s.startsAtMs > now).sort((a, b) => a.startsAtMs - b.startsAtMs)
  const completed = sessions.filter((s) => s.status === 'completed' || ((s.status === 'confirmed' || s.status === 'comped') && s.startsAtMs <= now))
    .sort((a, b) => b.startsAtMs - a.startsAtMs)
  const credits = bookingData?.credits && Number.isFinite(Number(bookingData.credits.credits))
    ? Math.max(0, Number(bookingData.credits.credits))
    : null
  return {
    upcoming: upcoming.map(({ startsAtMs, ...rest }) => rest),
    completedCount: completed.length,
    lastCompletedAt: completed[0]?.startsAt || null,
    lastCompleted: completed[0] ? { id: completed[0].id, startsAt: completed[0].startsAt, type: completed[0].type } : null,
    total: sessions.length,
    credits,
    bookedThisMonth: sessions.filter((s) => s.status !== 'cancelled' && s.startsAtMs > now - 30 * DAY).length,
  }
}

function summarizeActivity(activityItems, now) {
  const items = Array.isArray(activityItems) ? activityItems : []
  const byType = {}
  for (const item of items) {
    const at = toMs(item.at || item.occurred_at || item.created_at)
    if (!Number.isFinite(at)) continue
    const type = String(item.type || '')
    const bucket = byType[type] || (byType[type] = { count7: 0, count30: 0, total: 0, lastAt: 0, last: null, times: [] })
    bucket.total += 1
    bucket.times.push(at)
    if (at > now - 7 * DAY) bucket.count7 += 1
    if (at > now - 30 * DAY) bucket.count30 += 1
    if (at > bucket.lastAt) {
      bucket.lastAt = at
      bucket.last = item
    }
  }
  return byType
}

function eventsOfType(events, type) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => event?.event_type === type)
    .map((event) => ({ ...event, atMs: toMs(event.occurred_at) }))
    .filter((event) => Number.isFinite(event.atMs))
    .sort((a, b) => b.atMs - a.atMs)
}

function distinctDays(timestamps, now, days) {
  const cutoff = now - days * DAY
  return new Set(timestamps.filter((ms) => Number.isFinite(ms) && ms > cutoff && ms <= now + DAY).map((ms) => new Date(ms).toISOString().slice(0, 10))).size
}

export function buildFacts(input = {}) {
  const now = Number.isFinite(input.now) ? input.now : Date.now()
  const config = input.config || {}
  const identity = input.identity || {}
  const email = normalizeEmail(identity.email)
  const isAdmin = identity.isAdmin === true
  const sources = input.sources || {}

  const account = source(sources, 'account')
  const profileSrc = source(sources, 'profile')
  const billingSrc = source(sources, 'billing')
  const meSrc = source(sources, 'me')
  const climbSrc = source(sources, 'climb')
  const bookingsSrc = source(sources, 'bookings')
  const coachingSrc = source(sources, 'coaching')
  const playerSrc = source(sources, 'player')
  const referralsSrc = source(sources, 'referrals')
  const legacySrc = source(sources, 'legacyCrm')
  const csSrc = source(sources, 'cs')
  const localSrc = source(sources, 'local')

  // ---- identity & profile ------------------------------------------------
  const profile = profileSrc.status === 'ok' ? profileSrc.data : meSrc.status === 'ok' ? meSrc.data?.profile || null : null
  const profileKnown = profileSrc.status === 'ok' || meSrc.status === 'ok'
  const games = parseGameProfiles(profile)
  const r6 = games?.r6 && typeof games.r6 === 'object' ? games.r6 : {}
  const displayName = profile?.display_name || profile?.gamer_id || null
  const firstName = profile?.first_name || null

  // ---- billing ------------------------------------------------------------
  let billing
  let subscriptionRow = null
  if (billingSrc.status === 'ok') {
    const rows = Array.isArray(billingSrc.data) ? billingSrc.data : []
    billing = resolveBilling(rows, { catalog: input.catalog, now, isAdmin })
    subscriptionRow = pickBestSub(rows, { catalog: input.catalog, now })
    billing.canManageBilling = Boolean(billing.stripeCustomerId && String(billing.stripeCustomerId).startsWith('cus_'))
  } else if (meSrc.status === 'ok') {
    billing = billingFromMe(meSrc.data, { isAdmin })
  } else {
    billing = resolveBilling(null, { available: false, isAdmin })
  }

  // ---- usage ---------------------------------------------------------------
  let vodUsage = null
  if (billing.available && billing.plan && billing.plan !== 'free') {
    if (billingSrc.status === 'ok') {
      vodUsage = computeVodUsage(subscriptionRow, billing.plan, billing.tierScope, { now, limits: config.vodLimits, isAdmin })
    } else if (meSrc.data?.vod_usage) {
      const v = meSrc.data.vod_usage
      vodUsage = {
        used: Number(v.used || 0),
        limit: v.limit ?? null,
        remaining: v.remaining ?? null,
        isTrial: v.is_trial === true,
        periodEnd: v.period_end || null,
        unlimited: v.unlimited === true,
      }
    }
  }

  // ---- account / access ------------------------------------------------------
  // A customer reading their own home is, by definition, signed in with a
  // confirmed account; admins get the Cognito status from ListUsers.
  let accountStatus = 'unknown'
  if (account.status === 'ok') {
    const cognito = account.data
    if (!cognito) accountStatus = 'no_account'
    else if (cognito.enabled === false) accountStatus = 'disabled'
    else if (cognito.status === 'CONFIRMED' || cognito.status === 'EXTERNAL_PROVIDER') accountStatus = 'ok'
    else if (cognito.status === 'FORCE_CHANGE_PASSWORD') accountStatus = 'force_change_password'
    else if (cognito.status === 'UNCONFIRMED') accountStatus = 'unconfirmed'
    else if (cognito.status === 'RESET_REQUIRED') accountStatus = 'reset_required'
    else accountStatus = String(cognito.status || 'unknown').toLowerCase()
  } else if (identity.signedIn) {
    accountStatus = 'ok'
  }
  const lastSeenAt = isoOrNull(profile?.last_seen_at)
  const accountCreatedAt = isoOrNull(account.data?.createdAt) || isoOrNull(profile?.created_at)

  // ---- product activity -------------------------------------------------------
  const player = playerSrc.data || {}
  const playerEvents = Array.isArray(player.events) ? player.events : []
  const record = player.record || null

  const vodEvents = eventsOfType(playerEvents, 'vod_reviewed')
  const coachingEvents = eventsOfType(playerEvents, 'coaching_session_completed')
  const csData = csSrc.data || {}
  const activity = summarizeActivity(csData.activity, now)
  const localRecents = Array.isArray(localSrc.data?.recents) ? localSrc.data.recents : []

  const vodSessionsUsed = vodUsage ? Number(vodUsage.used || 0) : 0
  const vodReviewsKnown = vodEvents.length > 0 || vodSessionsUsed > 0 || Number(subscriptionRow?.vod_lifetime_used || 0) > 0
  const lastVodAt = vodEvents[0] ? new Date(vodEvents[0].atMs).toISOString() : isoOrNull(subscriptionRow?.vod_updated_at)

  const climbData = climbSrc.data
  const climb = climbSrc.status === 'ok'
    ? summarizeRoadToChampion(climbData?.progress, { updatedAt: isoOrNull(climbData?.updatedAt), playerRank: r6.rank || null })
    : null

  const bookings = bookingsSrc.status === 'ok' ? summarizeBookings(bookingsSrc.data, email, now) : null
  const coaching = coachingSrc.status === 'ok' ? coachingSrc.data || null : null

  const stratActivity = activity.strat_viewed || null
  const prepActivity = activity.match_prep_opened || null
  const liveActivity = activity.live_coach_opened || null
  const lastStratAtLocal = localRecents.map((r) => toMs(r.at || r.viewedAt || r.ts)).filter(Number.isFinite).sort((a, b) => b - a)[0]
  const lastStratAt = Math.max(stratActivity?.lastAt || 0, lastStratAtLocal || 0) || null

  // Core value actions: things a player does to get better with Recon.
  const coreActionTimes = [
    ...vodEvents.map((e) => e.atMs),
    ...coachingEvents.map((e) => e.atMs),
    toMs(climb?.updatedAt),
    lastStratAt,
    prepActivity?.lastAt || NaN,
    liveActivity?.lastAt || NaN,
    toMs(lastVodAt),
    toMs(bookings?.lastCompletedAt),
    toMs(coaching?.lastSessionAt),
  ].filter(Number.isFinite)

  const anyActivityTimes = [
    ...coreActionTimes,
    toMs(lastSeenAt),
    ...Object.values(activity).flatMap((bucket) => bucket.times),
    ...playerEvents.map((event) => toMs(event.occurred_at)),
    ...(Array.isArray(csData.messages) ? csData.messages.filter((m) => m.direction === 'inbound').map((m) => toMs(m.createdAt)) : []),
  ].filter(Number.isFinite)

  const hasStrategyActivity = Boolean(stratActivity?.total || localRecents.length)
  const hasCoreAction = Boolean(
    vodReviewsKnown ||
    coachingEvents.length ||
    (bookings && bookings.completedCount) ||
    (climb && climb.tasksDone > 0) ||
    hasStrategyActivity ||
    prepActivity?.total ||
    liveActivity?.total ||
    (coaching && coaching.sessions > 0),
  )

  // Server-side activity recording began at a known date. Before it, a
  // missing strategy/match-prep signal means "not recorded", not "never".
  const trackingSinceMs = toMs(config.activityTrackingSince)
  const usageEvidence = Number.isFinite(trackingSinceMs) && csSrc.status === 'ok' ? 'recorded' : localSrc.status === 'ok' ? 'this_device' : 'partial'

  // ---- skill gaps from the player-data spine (provenance preserved) ----------
  const skill = {
    vodWeaknesses: asList(pickCanonical(record, 'vod_recurring_weaknesses')?.value).slice(0, 3),
    vodPracticePlan: pickCanonical(record, 'vod_practice_plan'),
    vodHeadline: pickCanonical(record, 'last_vod_headline'),
    lastVodMap: pickCanonical(record, 'last_vod_map')?.value || vodEvents[0]?.data?.detected_map || null,
    coachingWeakness: pickCanonical(record, 'identified_weakness'),
    coachingDrill: pickCanonical(record, 'recommended_drill'),
    rank: pickCanonical(record, 'rank'),
  }

  // ---- customer-success owned state ------------------------------------------
  const messages = Array.isArray(csData.messages) ? csData.messages : []
  const feedback = Array.isArray(csData.feedback) ? csData.feedback : []
  const consent = csData.consent || null

  const facts = {
    generatedAt: new Date(now).toISOString(),
    now,
    identity: {
      email,
      reconPlayerId: identity.reconPlayerId || record?.recon_player_id || null,
      isAdmin,
      firstName,
      lastName: profile?.last_name || null,
      displayName,
      platform: profile?.platform || null,
      region: profile?.region || profile?.preferred_server || null,
      discord: profile?.discord_username || profile?.discord_handle || null,
      rank: r6.rank || null,
      goalRank: r6.goal_rank || null,
      mainRole: r6.main_role || profile?.main_role || null,
      ubisoftUsername: r6.ubisoft_username || null,
      referralSource: profile?.referral_source || null,
      referralCode: profile?.referral_code || null,
      referredBy: profile?.referred_by || null,
    },
    account: {
      status: accountStatus,
      createdAt: accountCreatedAt,
      lastSeenAt,
      hasProfileRow: profileKnown ? Boolean(profile) : null,
      profileComplete: profileKnown ? isProfileComplete(profile) : null,
      hasRankGoal: Boolean(r6.rank && r6.goal_rank),
    },
    billing,
    usage: {
      vod: vodUsage,
      coachingSessionsIncluded: billing.plan ? COACHING_SESSIONS_PER_MONTH[billing.plan] || 0 : 0,
      aiCredits: Number(profile?.ai_usage_credits || 0) || 0,
    },
    activity: {
      vod: { reviewsKnown: vodReviewsKnown, lastAt: lastVodAt, count30: vodEvents.filter((e) => e.atMs > now - 30 * DAY).length, lastMap: skill.lastVodMap },
      coaching: bookings
        ? { ...bookings, liveSessions: coaching?.sessions ?? null, lastLiveSessionAt: coaching?.lastSessionAt ?? null }
        : coaching ? { liveSessions: coaching.sessions ?? null, lastLiveSessionAt: coaching.lastSessionAt ?? null } : null,
      roadToChampion: climb,
      roadToChampionTasksTotal: CLIMB_TASK_TOTAL,
      strategy: { total: stratActivity?.total || localRecents.length || 0, count7: stratActivity?.count7 || 0, lastAt: lastStratAt ? new Date(lastStratAt).toISOString() : null, recents: localRecents.slice(0, 5), lastServer: stratActivity?.last || null },
      matchPrep: { total: prepActivity?.total || 0, count7: prepActivity?.count7 || 0, lastAt: prepActivity?.lastAt ? new Date(prepActivity.lastAt).toISOString() : null },
      liveCoach: { total: liveActivity?.total || 0, count7: liveActivity?.count7 || 0, lastAt: liveActivity?.lastAt ? new Date(liveActivity.lastAt).toISOString() : null },
      hasCoreAction,
      lastCoreActionAt: coreActionTimes.length ? new Date(Math.max(...coreActionTimes)).toISOString() : null,
      lastActiveAt: anyActivityTimes.length ? new Date(Math.max(...anyActivityTimes)).toISOString() : null,
      activeDays7: distinctDays(anyActivityTimes, now, 7),
      activeDays14: distinctDays(anyActivityTimes, now, 14),
      activeDays30: distinctDays(anyActivityTimes, now, 30),
      coreActions14: coreActionTimes.filter((ms) => ms > now - 14 * DAY).length,
      usageEvidence,
    },
    skill,
    referrals: referralsSrc.status === 'ok' ? referralsSrc.data : null,
    legacyOutreach: legacySrc.status === 'ok' ? legacySrc.data : null,
    cs: {
      consent,
      messages,
      unreadForPlayer: messages.filter((m) => m.direction === 'outbound' && m.channel === 'in_app' && !m.readByPlayerAt).length,
      unreadForAdmin: messages.filter((m) => m.direction === 'inbound' && !m.readByAdminAt).length,
      feedback,
      prompts: Array.isArray(csData.prompts) ? csData.prompts : [],
      outreach: Array.isArray(csData.outreach) ? csData.outreach : [],
      decisions: Array.isArray(csData.decisions) ? csData.decisions : [],
    },
    sources: {
      account: account.status,
      profile: profileSrc.status === 'ok' ? 'ok' : meSrc.status === 'ok' ? 'ok' : profileSrc.status,
      billing: billingSrc.status === 'ok' ? 'ok' : meSrc.status === 'ok' ? 'ok' : billingSrc.status,
      roadToChampion: climbSrc.status,
      bookings: bookingsSrc.status,
      coaching: coachingSrc.status,
      player: playerSrc.status,
      referrals: referralsSrc.status,
      legacyOutreach: legacySrc.status,
      cs: csSrc.status,
      local: localSrc.status,
    },
    config: {
      features: { ...(config.features || {}) },
    },
  }
  return facts
}
