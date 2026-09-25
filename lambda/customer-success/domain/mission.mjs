// Today's Mission and the four questions the home answers:
//   What should I do next?      -> mission (exactly one primary action)
//   What am I improving?        -> focus
//   What evidence supports it?  -> evidence (dated, sourced facts only)
//   Where am I stuck?           -> stuck
//   How do I get help?          -> help
//
// Rules are ordered; the first that matches wins. Every mission lists the
// facts that triggered it so the player (and Aaron) can see why it was chosen.

import { toMs } from './facts.mjs'
import { hasPlan, PLAN_LABEL } from './plans.mjs'

const DAY = 86400000

function fmtDay(iso) {
  const ms = toMs(iso)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function sourceLabel(source, verification) {
  if (verification === 'player_reported' || source === 'manual') return 'you reported'
  if (source === 'vod') return 'VOD review'
  if (source === 'coach' || source === 'desktop') return 'coached match'
  if (source === 'trn') return 'Tracker Network (unofficial)'
  if (source === 'ubisoft') return 'Ubisoft'
  return source || 'Recon record'
}

export const MISSION_RULES = Object.freeze([
  'fix_payment',
  'confirm_renewal',
  'upcoming_session',
  'complete_profile',
  'apply_vod_fix',
  'first_round_plan',
  'first_vod',
  'book_included_session',
  'continue_climb',
  'start_climb',
  'continue_round_plan',
  'prep_next_match',
])

export function deriveMission(facts, now = facts.now || Date.now()) {
  const b = facts.billing
  const planName = PLAN_LABEL[b.lastPaidPlan || b.plan] || 'membership'
  const vod = facts.usage.vod
  const climb = facts.activity.roadToChampion
  const coaching = facts.activity.coaching
  const recents = facts.activity.strategy.recents || []

  // 1. Money/access problems first: nothing else matters if they are locked out.
  if (b.available && b.status === 'payment_failed') {
    return {
      id: 'fix_payment',
      kind: 'account',
      title: 'Update your payment method',
      body: `Your last ${planName} payment didn't go through, so ${planName} features are paused. Update your card to turn them back on.`,
      cta: b.canManageBilling ? { label: 'Update payment method', action: 'billing_portal' } : { label: 'Message support', action: 'message_support' },
      evidence: [`Billing record: payment ${b.paymentIssue}${b.currentPeriodEnd ? ` (period ends ${fmtDay(b.currentPeriodEnd)})` : ''}`],
    }
  }
  if (b.available && b.status === 'renewal_unconfirmed') {
    return {
      id: 'confirm_renewal',
      kind: 'account',
      title: "We couldn't confirm your renewal",
      body: 'Your paid-through date has passed and we have no renewal on record. If you were charged, message us and we will restore access the same day.',
      cta: { label: 'Message support', action: 'message_support' },
      evidence: [`Paid through ${fmtDay(b.currentPeriodEnd) || 'an earlier date'}; no renewal recorded since`],
    }
  }

  // 2. Time-bound: a coaching session in the next 72 hours.
  const nextSession = coaching?.upcoming?.[0]
  if (nextSession && toMs(nextSession.startsAt) - now < 3 * DAY) {
    return {
      id: 'upcoming_session',
      kind: 'coaching',
      title: `Prep for your coaching session ${fmtDay(nextSession.startsAt)}`,
      body: 'Bring one round you want fixed. A VOD screenshot or the map and site you keep losing on is enough.',
      cta: facts.activity.vod.reviewsKnown || !hasPlan(b.plan, 'pro') ? { label: 'Pick the round to review', to: '/strats' } : { label: 'Upload the round', to: '/vod' },
      evidence: [`Session booked for ${new Date(toMs(nextSession.startsAt)).toISOString().replace('T', ' ').slice(0, 16)} UTC`],
      startsAt: nextSession.startsAt,
    }
  }

  // 3. Profile: every plan is tailored to platform and rank.
  if (facts.account.profileComplete === false) {
    return {
      id: 'complete_profile',
      kind: 'setup',
      title: 'Finish your player profile',
      body: 'Two minutes: name, gamertag and platform. Round plans and Road to Champion use it to fit how you play.',
      cta: { label: 'Finish profile', action: 'open_profile' },
      evidence: ['Profile is missing required fields'],
    }
  }

  // 4. Fresh evidence to act on: a VOD review in the last 7 days.
  const vodAt = toMs(facts.activity.vod.lastAt)
  const weakness = facts.skill.vodWeaknesses[0] || facts.skill.vodHeadline?.value || null
  if (Number.isFinite(vodAt) && now - vodAt < 7 * DAY && weakness) {
    return {
      id: 'apply_vod_fix',
      kind: 'practice',
      title: 'Drill the fix from your last VOD review',
      body: `Your review flagged: ${weakness}. Play your next three rounds with that one fix in mind.`,
      cta: { label: 'Review the plan', to: '/vod' },
      evidence: [`VOD review ${fmtDay(facts.activity.vod.lastAt)}${facts.skill.lastVodMap ? ` on ${facts.skill.lastVodMap}` : ''}`],
    }
  }

  // 5. Activation gaps.
  if (facts.activity.strategy.total === 0 && facts.activity.usageEvidence !== 'partial') {
    return {
      id: 'first_round_plan',
      kind: 'activation',
      title: 'Build your first round plan',
      body: 'Pick the map, bombsite and side you play next. You get one job, the utility order and the callouts. It takes about 30 seconds.',
      cta: { label: 'Choose a site', to: '/strats' },
      evidence: [facts.activity.usageEvidence === 'this_device' ? 'No round plans opened on this device yet' : 'No round plans opened yet'],
    }
  }
  if (hasPlan(b.plan, 'pro') && b.hasAccess && !facts.identity.isAdmin && vod && !facts.activity.vod.reviewsKnown && (vod.remaining ?? 1) > 0) {
    return {
      id: 'first_vod',
      kind: 'activation',
      title: 'Get your first VOD review',
      body: 'Upload screenshots from one round you lost. You get the mistake that cost it and one drill to fix it.',
      cta: { label: 'Upload a round', to: '/vod' },
      evidence: [vod.limit ? `${vod.remaining} of ${vod.limit} reviews left this period` : 'VOD review is included in your plan'],
    }
  }
  const credits = coaching?.credits
  if (!facts.identity.isAdmin && ((b.plan === 'champion' && coaching && coaching.bookedThisMonth === 0) || (Number.isFinite(credits) && credits > 0 && !coaching?.upcoming?.length))) {
    return {
      id: 'book_included_session',
      kind: 'coaching',
      title: 'Book your coaching session',
      body: b.plan === 'champion'
        ? 'Champion includes two live 1:1 sessions with Aaron each month. Book one while you still have them.'
        : `You have ${credits} session credit${credits === 1 ? '' : 's'} ready to use.`,
      cta: { label: 'Book a session', href: '/coaching/index.html#book' },
      evidence: [b.plan === 'champion' ? 'No session booked in the last 30 days' : `${credits} unused credit${credits === 1 ? '' : 's'}`],
    }
  }

  // 6. Ongoing improvement.
  if (climb?.currentTier?.nextTask) {
    return {
      id: 'continue_climb',
      kind: 'practice',
      title: climb.currentTier.nextTask,
      body: `Your next Road to Champion step in ${climb.currentTier.rank}: ${climb.currentTier.theme}. Tick it off once it is habit.`,
      cta: { label: 'Open Road to Champion', href: '/climb/' },
      evidence: [`${climb.currentTier.done} of ${climb.currentTier.total} ${climb.currentTier.rank} steps done`, climb.updatedAt ? `Last updated ${fmtDay(climb.updatedAt)}` : null].filter(Boolean),
    }
  }
  if (facts.sources.roadToChampion === 'ok' && !climb) {
    return {
      id: 'start_climb',
      kind: 'practice',
      title: `Start Road to Champion${facts.identity.rank ? ` at ${String(facts.identity.rank).split(' ')[0]}` : ''}`,
      body: 'Five habits per rank that get players out of it. Start at your tier and tick them off as they stick.',
      cta: { label: 'Open Road to Champion', href: '/climb/' },
      evidence: ['Road to Champion not started'],
    }
  }
  const last = recents[0]
  if (last?.mapId && last?.siteId) {
    return {
      id: 'continue_round_plan',
      kind: 'practice',
      title: 'Pick up your last round plan',
      body: 'Open the plan you used last, lock one job, and take it into your next match.',
      cta: { label: 'Open the plan', to: `/strats/${last.mapId}/${last.siteId}${last.side ? `/${last.side}` : ''}` },
      evidence: ['Most recent round plan on this device'],
      continueRef: { mapId: last.mapId, siteId: last.siteId, side: last.side || null },
    }
  }
  return {
    id: 'prep_next_match',
    kind: 'practice',
    title: 'Prep your next match in 90 seconds',
    body: 'Bans, picks, roles and the round plan on one screen before you queue.',
    cta: { label: 'Open match prep', to: '/match-prep' },
    evidence: ['Nothing urgent. Keep the routine going.'],
  }
}

// What am I improving? Prefer evidence from reviews and coaching, then the
// checklist, then the stated goal. Returns null when nothing is known.
export function deriveFocus(facts) {
  const s = facts.skill
  if (s.coachingWeakness?.value) {
    return {
      title: String(s.coachingWeakness.value),
      detail: s.coachingDrill?.value ? `Drill: ${s.coachingDrill.value}` : null,
      source: sourceLabel(s.coachingWeakness.source, s.coachingWeakness.verification),
      asOf: s.coachingWeakness.capturedAt,
    }
  }
  if (s.vodWeaknesses.length) {
    return {
      title: String(s.vodWeaknesses[0]),
      detail: s.vodPracticePlan?.value ? String(Array.isArray(s.vodPracticePlan.value) ? s.vodPracticePlan.value[0] : s.vodPracticePlan.value) : null,
      source: 'VOD review',
      asOf: facts.activity.vod.lastAt,
    }
  }
  const climb = facts.activity.roadToChampion
  if (climb?.currentTier) {
    return {
      title: climb.currentTier.theme,
      detail: climb.currentTier.nextTask ? `Next habit: ${climb.currentTier.nextTask}` : null,
      source: 'Road to Champion',
      asOf: climb.updatedAt,
    }
  }
  if (facts.identity.rank && facts.identity.goalRank) {
    return {
      title: `${facts.identity.rank} to ${facts.identity.goalRank}`,
      detail: 'Start Road to Champion to break that gap into habits.',
      source: 'your profile',
      asOf: null,
    }
  }
  return null
}

// Dated, sourced facts only. Nothing here is inferred.
export function deriveEvidence(facts) {
  const items = []
  const vod = facts.activity.vod
  if (vod.lastAt) {
    items.push({ kind: 'vod', label: `VOD review${vod.lastMap ? ` on ${vod.lastMap}` : ''}`, at: vod.lastAt, source: 'VOD review' })
  }
  const coaching = facts.activity.coaching
  if (coaching?.lastCompletedAt) {
    items.push({ kind: 'coaching', label: 'Coaching session completed', at: coaching.lastCompletedAt, source: 'Coaching bookings' })
  }
  const climb = facts.activity.roadToChampion
  if (climb) {
    items.push({ kind: 'climb', label: `Road to Champion: ${climb.tasksDone} of ${climb.tasksTotal} habits checked`, at: climb.updatedAt, source: 'Road to Champion' })
  }
  const rank = facts.skill.rank
  if (rank?.value) {
    items.push({ kind: 'rank', label: `Rank: ${rank.value}`, at: rank.capturedAt, source: sourceLabel(rank.source, rank.verification) })
  } else if (facts.identity.rank) {
    items.push({ kind: 'rank', label: `Rank: ${facts.identity.rank}`, at: null, source: 'you reported' })
  }
  if (facts.activity.strategy.count7) {
    items.push({ kind: 'strategy', label: `${facts.activity.strategy.count7} round plan${facts.activity.strategy.count7 === 1 ? '' : 's'} opened this week`, at: facts.activity.strategy.lastAt, source: 'Recon activity' })
  }
  return items.sort((a, b) => (toMs(b.at) || 0) - (toMs(a.at) || 0))
}

export function deriveStuck(facts, now = facts.now || Date.now()) {
  const out = []
  const b = facts.billing
  if (b.available && b.status === 'payment_failed') out.push({ id: 'payment', label: 'Payment failed, so paid features are paused.' })
  const vod = facts.usage.vod
  if (vod && !vod.unlimited && vod.limit && vod.remaining === 0) {
    out.push({ id: 'vod_limit', label: `All ${vod.limit} VOD reviews used${vod.periodEnd ? `; resets ${fmtDay(vod.periodEnd)}` : ''}.` })
  }
  const climb = facts.activity.roadToChampion
  const climbAge = toMs(climb?.updatedAt)
  if (climb?.currentTier && !climb.allComplete && Number.isFinite(climbAge) && now - climbAge > 21 * DAY) {
    out.push({ id: 'climb_stalled', label: `No Road to Champion progress since ${fmtDay(climb.updatedAt)} (${climb.currentTier.rank}: ${climb.currentTier.done}/${climb.currentTier.total}).` })
  }
  if (facts.skill.vodWeaknesses.length > 1) {
    out.push({ id: 'recurring', label: `The same mistake keeps showing up: ${facts.skill.vodWeaknesses[0]}.` })
  }
  return out
}

export function deriveHelp(facts) {
  const plan = facts.billing.plan
  const options = []
  if (facts.config.features.messaging) {
    options.push({ id: 'message', label: 'Message Recon 6', detail: 'Questions, bugs or billing. Aaron reads every message.', cta: { label: 'Send a message', action: 'message_support' } })
  }
  options.push(plan === 'champion'
    ? { id: 'coaching', label: 'Book a live session', detail: 'Two 1:1 sessions with Aaron are included each month.', cta: { label: 'Book a session', href: '/coaching/index.html#book' } }
    : { id: 'coaching', label: 'Book a 1:1 session', detail: 'First session $20. Aaron reviews your rounds with you.', cta: { label: 'See coaching', href: '/coaching/index.html' } })
  options.push({ id: 'email', label: 'Email support', detail: 'support@r6coaching.com', cta: { label: 'Email us', href: 'mailto:support@r6coaching.com' } })
  return options
}
