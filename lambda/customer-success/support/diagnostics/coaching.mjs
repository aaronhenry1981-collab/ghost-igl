// Coaching provider: the `credits#<email>` row and booking rows in
// recon6-bookings (via PR #24 assembleOne), plus live-coach session counts.
//
// Booking behaviour this relies on (lambda/booking/index.mjs): the coaching
// membership SETS the credit balance on each paid cycle; a package purchase
// adds its remaining sessions as credits; a single paid session creates no
// credits row by design.

import { dateOnly, fact, inference, panel, sourceData, sourceStatus } from './shared.mjs'

export function coachingEvidence({ bookingData = null, email = '', billing = null } = {}) {
  const e = String(email || '').toLowerCase()
  const rows = Array.isArray(bookingData?.bookings) ? bookingData.bookings : []
  const mine = rows.filter((row) => String(row?.customer?.email || '').toLowerCase() === e)
  const creditsRow = bookingData?.credits || null
  const paidPackages = mine.filter((row) => row?.payment?.status === 'paid' && /package/i.test(String(row.coachingType || row.type || row.sessionType || '')))
  const membership = Boolean(billing && billing.hasAccess && (billing.plan === 'champion' || billing.paidPlan === 'champion'))
  return {
    credits: creditsRow && Number.isFinite(Number(creditsRow.credits)) ? Math.max(0, Number(creditsRow.credits)) : null,
    creditsRowPresent: Boolean(creditsRow),
    creditsUpdatedAt: creditsRow?.updatedAt || null,
    bookings: mine.map((row) => ({ id: String(row.slotId || ''), status: String(row.status || ''), payment: row.payment?.status || null, type: row.coachingType || null })),
    paidPackages: paidPackages.length,
    membership,
    purchaseWithoutCredits: !creditsRow && (paidPackages.length > 0 || membership),
  }
}

export async function coachingProvider({ one, facts }) {
  const status = sourceStatus(one, 'bookings')
  if (status !== 'ok') {
    return panel('coaching', 'Coaching', status, {
      facts: [fact('Coaching bookings', status === 'unavailable' ? 'could not be read right now' : 'not connected', 'recon6-bookings', null, 'player')],
    })
  }
  const ev = coachingEvidence({ bookingData: sourceData(one, 'bookings'), email: facts?.identity?.email, billing: facts?.billing })
  const c = facts?.activity?.coaching || {}
  const out = [
    fact('Coaching credits', ev.creditsRowPresent ? String(ev.credits ?? 0) : 'none on record', 'recon6-bookings credits row', ev.creditsUpdatedAt, 'player'),
    fact('Upcoming sessions', String((c.upcoming || []).length), 'recon6-bookings', null, 'player'),
  ]
  if (c.upcoming?.[0]?.startsAt) out.push(fact('Next session', dateOnly(c.upcoming[0].startsAt), 'recon6-bookings', null, 'player'))
  out.push(
    fact('Completed sessions', String(c.completedCount ?? 0), 'recon6-bookings', c.lastCompletedAt),
    fact('Booking rows', ev.bookings.length ? ev.bookings.map((b) => `${b.status}/${b.payment || 'n/a'}${b.type ? `/${b.type}` : ''}`).join(', ') : 'none', 'recon6-bookings'),
    fact('Coaching included in plan', `${facts?.usage?.coachingSessionsIncluded ?? 0} per month`, 'domain/plans.mjs COACHING_SESSIONS_PER_MONTH'),
  )
  const liveStatus = sourceStatus(one, 'coaching')
  if (liveStatus === 'ok' && c.liveSessions !== undefined) out.push(fact('Live coach sessions', String(c.liveSessions ?? 0), 'coaching events', c.lastLiveSessionAt))
  if (ev.bookings.length) out.push(fact('Booking slot ids', ev.bookings.map((b) => b.id).join(', '), 'recon6-bookings', null, 'engineering'))
  const infs = []
  const recon = []
  if (ev.purchaseWithoutCredits) {
    infs.push(inference('Coaching purchase without a credits row', ev.membership ? 'membership active, no credits row' : `${ev.paidPackages} paid package booking(s), no credits row`,
      'the booking service writes credits#<email> when a membership cycle or package is paid', 0.6))
    recon.push('Check the booking payment and the credits row; credit changes are made in the booking system by a person, then noted on the case.')
  }
  const nothing = !ev.creditsRowPresent && !ev.bookings.length && !(c.liveSessions > 0)
  return panel('coaching', 'Coaching', nothing ? 'not_recorded' : ev.purchaseWithoutCredits ? 'degraded' : 'ok', {
    facts: out,
    inferences: infs,
    recon,
    signals: { coachingCredits: ev.creditsRowPresent ? ev.credits : null, coachingCreditsKnown: true, coachingMember: ev.membership },
    context: { coaching: ev },
  })
}
