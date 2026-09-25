// In-memory implementation of the read-only `tables` interface, backed by a
// fixture world. Used by tests and the local dev server. The DynamoDB
// implementation (dynamoTables.mjs) exposes the same methods.

import { normalizeEmail } from '../domain/facts.mjs'

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

export function createMemoryTables(world, { failures = {} } = {}) {
  const fail = (name) => {
    if (failures[name]) throw new Error(`${name} unavailable (simulated)`)
  }
  const byEmail = (rows, email) => rows.filter((row) => normalizeEmail(row.email) === normalizeEmail(email))

  return {
    async listCognitoUsers() {
      fail('cognito')
      return clone(world.cognitoUsers)
    },
    async getCognitoUserByEmail(email) {
      fail('cognito')
      return clone(world.cognitoUsers.find((u) => normalizeEmail(u.email) === normalizeEmail(email)) || null)
    },
    async subscriptionsByEmail(email) {
      fail('subscriptions')
      return clone(byEmail(world.subscriptions, email))
    },
    async scanSubscriptions() {
      fail('subscriptions')
      return clone(world.subscriptions)
    },
    async getProfile(email) {
      fail('profiles')
      return clone(world.profiles.find((p) => normalizeEmail(p.email) === normalizeEmail(email)) || null)
    },
    async scanProfiles() {
      fail('profiles')
      return clone(world.profiles)
    },
    async getClimb(sub) {
      fail('climb')
      if (!sub) return null
      return clone(world.climb.find((row) => row.sub === sub) || null)
    },
    async scanClimb() {
      fail('climb')
      return clone(world.climb)
    },
    async scanBookings() {
      fail('bookings')
      return clone(world.bookings)
    },
    async coachingSummary(sub) {
      fail('coaching')
      const events = world.coachingEvents.filter((row) => row.userId === sub)
      if (!events.length) return { sessions: 0, lastSessionAt: null }
      const sessions = new Set(events.map((row) => row.sessionId))
      const last = events.map((row) => row.ts).sort().pop()
      return { sessions: sessions.size, lastSessionAt: last || null }
    },
    async getPlayerRecord(reconPlayerId) {
      fail('player')
      return clone(world.playerRecords.find((row) => row.recon_player_id === reconPlayerId) || null)
    },
    async scanPlayerRecords() {
      fail('player')
      return clone(world.playerRecords)
    },
    async playerEvents(reconPlayerId, limit = 50) {
      fail('player')
      return clone(world.playerEvents.filter((row) => row.recon_player_id === reconPlayerId).sort((a, b) => String(b.event_key).localeCompare(String(a.event_key))).slice(0, limit))
    },
    async referralsFor(email) {
      fail('referrals')
      const e = normalizeEmail(email)
      return {
        asReferrer: clone(world.referrals.filter((row) => normalizeEmail(row.referrer_email) === e)),
        referredBy: clone(world.referrals.find((row) => normalizeEmail(row.referred_email) === e) || null),
      }
    },
    async scanReferrals() {
      fail('referrals')
      return clone(world.referrals)
    },
    async getCrmLog(email) {
      fail('legacyCrm')
      return clone(world.crmLog.find((row) => normalizeEmail(row.email) === normalizeEmail(email)) || null)
    },
    async scanCrmLog() {
      fail('legacyCrm')
      return clone(world.crmLog)
    },
    async listTestimonials() {
      fail('testimonials')
      return clone(world.testimonials)
    },
  }
}
