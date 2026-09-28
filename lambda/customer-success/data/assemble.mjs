// Read every source for one player (or all players) and hand back
// `{ identity, sources }` for buildFacts(). Each source is read independently:
// one failing table marks only that source `unavailable`.

import { normalizeEmail } from '../domain/facts.mjs'
import { pkFor, csSourceFromItems } from './items.mjs'
import { contactKeyFor, reconPlayerIdFor } from '../lib/ids.mjs'

export class NotConnectedError extends Error {
  constructor(source) {
    super(`${source} is not connected in this deployment`)
    this.name = 'NotConnectedError'
  }
}

async function read(name, fn, log) {
  try {
    return { status: 'ok', data: await fn() }
  } catch (err) {
    if (err?.name === 'NotConnectedError') return { status: 'not_connected', data: null }
    log?.warn?.('cs_source_unavailable', { source: name, error: err?.name || 'Error' })
    return { status: 'unavailable', data: null }
  }
}

const LIVE_PAID_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

function hasLivePaidRelationship(rows) {
  return Array.isArray(rows) && rows.some((row) => LIVE_PAID_STATUSES.has(row?.status))
}

async function eachLimit(list, limit, fn) {
  let next = 0
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (next < list.length) {
      const item = list[next]
      next += 1
      await fn(item)
    }
  })
  await Promise.all(workers)
}

function bookingData(rows, email) {
  const all = Array.isArray(rows) ? rows : []
  const credits = all.find((row) => row.slotId === `credits#${email}`) || null
  return { bookings: all.filter((row) => !String(row.slotId || '').startsWith('credits#')), credits }
}

// Customer (self) or admin detail view of a single contact.
// `knownCognitoUsers` (from the directory) covers legacy mixed-case logins:
// the pool is case-sensitive, so an exact lookup of the lowercased email can
// miss a user that does exist.
export async function assembleOne({ tables, store, email, sub = null, signedIn = false, isAdmin = false, withCognito = false, knownCognitoUsers = [], log }) {
  const normalized = normalizeEmail(email)
  const contactKey = contactKeyFor(normalized)
  let cognitoUser = null
  const account = withCognito
    ? await read('cognito', async () => {
      cognitoUser = await tables.getCognitoUserByEmail(normalized)
      if (!cognitoUser && Array.isArray(knownCognitoUsers) && knownCognitoUsers.length) cognitoUser = knownCognitoUsers[0]
      return cognitoUser
    }, log)
    : signedIn ? { status: 'ok', data: { status: 'CONFIRMED', enabled: true, createdAt: null } } : { status: 'not_connected', data: null }
  const resolvedSub = sub || cognitoUser?.sub || null
  const reconPlayerId = resolvedSub ? reconPlayerIdFor(resolvedSub) : null

  const [profile, billing, climb, bookings, coaching, player, referrals, legacyCrm, cs] = await Promise.all([
    read('profiles', () => tables.getProfile(normalized), log),
    read('subscriptions', () => tables.subscriptionsByEmail(normalized), log),
    resolvedSub ? read('climb', () => tables.getClimb(resolvedSub), log) : Promise.resolve({ status: 'ok', data: null }),
    read('bookings', async () => bookingData(await tables.scanBookings(), normalized), log),
    resolvedSub ? read('coaching', () => tables.coachingSummary(resolvedSub), log) : Promise.resolve({ status: 'ok', data: null }),
    reconPlayerId
      ? read('player', async () => {
        const [record, events] = await Promise.all([tables.getPlayerRecord(reconPlayerId), tables.playerEvents(reconPlayerId, 50)])
        return { record, events }
      }, log)
      : Promise.resolve({ status: 'ok', data: { record: null, events: [] } }),
    read('referrals', () => tables.referralsFor(normalized), log),
    read('legacyCrm', () => tables.getCrmLog(normalized), log),
    store ? read('cs', async () => csSourceFromItems(await store.listContact(pkFor(contactKey))), log) : Promise.resolve({ status: 'not_connected', data: null }),
  ])

  return {
    contactKey,
    identity: { email: normalized, reconPlayerId, isAdmin, signedIn },
    sources: { account, profile, billing, climb, bookings, coaching, player, referrals, legacyCrm, cs },
    cognitoUser,
  }
}

// Every known contact, joined on normalized email, from one pass over each
// table. Duplicate Stripe rows for an email stay on ONE player.
export async function assembleDirectory({ tables, store, log }) {
  const [cognito, subs, profiles, climb, bookings, players, referrals, crm, csItems] = await Promise.all([
    read('cognito', () => tables.listCognitoUsers(), log),
    read('subscriptions', () => tables.scanSubscriptions(), log),
    read('profiles', () => tables.scanProfiles(), log),
    read('climb', () => tables.scanClimb(), log),
    read('bookings', () => tables.scanBookings(), log),
    read('player', () => tables.scanPlayerRecords(), log),
    read('referrals', () => tables.scanReferrals(), log),
    read('legacyCrm', () => tables.scanCrmLog(), log),
    store ? read('cs', () => store.listAll(), log) : Promise.resolve({ status: 'not_connected', data: null }),
  ])

  const contacts = new Map()
  const touch = (email) => {
    const e = normalizeEmail(email)
    if (!e) return null
    if (!contacts.has(e)) contacts.set(e, { email: e, cognito: [], subs: [], profile: null, climb: null, playerRecord: null, referrals: { asReferrer: [], referredBy: null }, crm: null, cs: [] })
    return contacts.get(e)
  }

  for (const user of cognito.data || []) touch(user.email)?.cognito.push(user)
  for (const row of subs.data || []) touch(row.email)?.subs.push(row)
  for (const row of profiles.data || []) {
    const c = touch(row.email)
    if (c) c.profile = row
  }
  const subToEmail = new Map()
  for (const c of contacts.values()) for (const u of c.cognito) if (u.sub) subToEmail.set(u.sub, c.email)
  for (const row of climb.data || []) {
    const email = row.email || subToEmail.get(row.sub)
    const c = email ? contacts.get(normalizeEmail(email)) : null
    if (c) c.climb = row
  }
  for (const row of players.data || []) {
    const c = row.owner_email ? contacts.get(normalizeEmail(row.owner_email)) : null
    if (c) c.playerRecord = row
  }
  for (const row of referrals.data || []) {
    const referrer = contacts.get(normalizeEmail(row.referrer_email))
    if (referrer) referrer.referrals.asReferrer.push(row)
    const referred = contacts.get(normalizeEmail(row.referred_email))
    if (referred) referred.referrals.referredBy = row
  }
  for (const row of crm.data || []) {
    const c = contacts.get(normalizeEmail(row.email))
    if (c) c.crm = row
  }
  const csByPk = new Map()
  for (const item of csItems.data || []) {
    if (!csByPk.has(item.pk)) csByPk.set(item.pk, [])
    csByPk.get(item.pk).push(item)
  }

  const statusOf = (src) => ({ status: src.status })
  const out = []
  for (const c of contacts.values()) {
    // Prefer the Cognito user whose email is already lowercase (the pool is
    // case-sensitive; legacy mixed-case accounts exist).
    const user = c.cognito.find((u) => u.email === c.email) || c.cognito[0] || null
    const contactKey = contactKeyFor(c.email)
    const reconPlayerId = user?.sub ? reconPlayerIdFor(user.sub) : c.playerRecord?.recon_player_id || null
    const isAdmin = Array.isArray(user?.groups) && user.groups.includes('admins')
    const bookingRows = bookings.status === 'ok' ? bookingData(bookings.data, c.email) : null
    out.push({
      contactKey,
      email: c.email,
      sub: user?.sub || null,
      cognitoUsers: c.cognito,
      identity: { email: c.email, reconPlayerId, isAdmin, signedIn: false },
      sources: {
        account: cognito.status === 'ok' ? { status: 'ok', data: user } : statusOf(cognito),
        profile: profiles.status === 'ok' ? { status: 'ok', data: c.profile } : statusOf(profiles),
        billing: subs.status === 'ok' ? { status: 'ok', data: c.subs } : statusOf(subs),
        climb: climb.status === 'ok' ? { status: 'ok', data: c.climb } : statusOf(climb),
        bookings: bookings.status === 'ok' ? { status: 'ok', data: bookingRows } : statusOf(bookings),
        // Player events and live-coach history are per-player queries. The
        // list loads them only for players with a live paid relationship
        // (below); everyone else uses the canonical record only.
        player: players.status === 'ok' ? { status: 'ok', data: { record: c.playerRecord, events: [] } } : statusOf(players),
        referrals: referrals.status === 'ok' ? { status: 'ok', data: c.referrals } : statusOf(referrals),
        legacyCrm: crm.status === 'ok' ? { status: 'ok', data: c.crm } : statusOf(crm),
        cs: csItems.status === 'ok' ? { status: 'ok', data: csSourceFromItems(csByPk.get(pkFor(contactKey)) || []) } : statusOf(csItems),
      },
    })
  }

  // At-risk and usage rules for paying players depend on desktop / live-coach
  // activity. Load it for them (a small set) so the list and the player record
  // agree; otherwise a queue item shown in the list could not be decided.
  await eachLimit(out.filter((entry) => hasLivePaidRelationship(entry.sources.billing.data)), 6, async (entry) => {
    const [player, coaching] = await Promise.all([
      entry.identity.reconPlayerId && players.status === 'ok'
        ? read('player', async () => ({ record: entry.sources.player.data?.record || null, events: await tables.playerEvents(entry.identity.reconPlayerId, 50) }), log)
        : Promise.resolve(entry.sources.player),
      entry.sub ? read('coaching', () => tables.coachingSummary(entry.sub), log) : Promise.resolve({ status: 'ok', data: null }),
    ])
    entry.sources.player = player
    entry.sources.coaching = coaching
  })

  return {
    contacts: out,
    sourceStatus: {
      cognito: cognito.status,
      subscriptions: subs.status,
      profiles: profiles.status,
      climb: climb.status,
      bookings: bookings.status,
      player: players.status,
      referrals: referrals.status,
      legacyCrm: crm.status,
      cs: csItems.status,
    },
  }
}
