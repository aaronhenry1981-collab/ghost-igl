const CONFIRMED_STATUSES = new Set(['confirmed', 'comped'])

export function isActiveCheckoutHold(booking, nowMs) {
  if (booking?.status !== 'held' || !Number.isFinite(nowMs) || nowMs <= 0) return false
  const expiresMs = Date.parse(booking.heldUntil || '')
  return Number.isFinite(expiresMs) && expiresMs > nowMs
}

export function isCalendarBookingVisible(booking, nowMs) {
  if (!booking?.start || booking.status === 'cancelled') return false
  if (booking.status === 'held') return isActiveCheckoutHold(booking, nowMs)
  return true
}

export function isConfirmedSession(booking) {
  return CONFIRMED_STATUSES.has(booking?.status)
}

export function bookingEventTitle(booking, nowMs) {
  if (isActiveCheckoutHold(booking, nowMs)) {
    const identity = booking.customer?.name || booking.customer?.email
    return identity
      ? `${identity} · checkout not paid`
      : 'Checkout hold · identity pending'
  }

  const identity = booking?.customer?.name || booking?.customer?.email || 'Confirmed session'
  const type = String(booking?.sessionType || '').trim()
  return type ? `${identity} · ${type}` : identity
}

export function bookingStatusLabel(booking, nowMs) {
  if (booking?.status === 'held') {
    return isActiveCheckoutHold(booking, nowMs)
      ? 'Checkout hold — not confirmed'
      : 'Expired checkout hold'
  }
  if (booking?.status === 'confirmed') return 'Confirmed session'
  if (booking?.status === 'comped') return 'Comped session'
  if (booking?.status === 'completed') return 'Completed session'
  return String(booking?.status || 'Unknown').replaceAll('_', ' ')
}

export function confirmedUpcomingSessions(bookings, nowMs, limit = 3) {
  return (bookings || [])
    .filter((booking) => isConfirmedSession(booking) && Date.parse(booking.start) >= nowMs)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, limit)
}
