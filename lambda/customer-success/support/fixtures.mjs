// Fictional support fixtures for tests: the PR #24 fixture world plus
// player-data history (snapshots, identity links, provider health) and a few
// support-specific scenarios. Every person and handle is invented; addresses
// use reserved test domains.

import { buildFixtureWorld } from '../fixtures/world.mjs'
import { createMemoryTables } from '../data/memoryTables.mjs'
import { createPlanCatalog } from '../domain/plans.mjs'
import { reconPlayerIdFor } from '../lib/ids.mjs'
import { buildFacts } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { assembleOne } from '../data/assemble.mjs'

const DAY = 86400000
const HOUR = 3600000

// A fixed clock (mid-season, outside any season-start window).
export const FIXED_NOW = Date.parse('2026-10-14T15:00:00.000Z')

export function buildSupportWorld(now = FIXED_NOW) {
  const world = buildFixtureWorld(now)
  const at = (ms) => new Date(now - ms).toISOString()
  const vex = world.scenarios.paying_active
  const declined = world.scenarios.payment_failed

  world.playerSnapshots = [
    { recon_player_id: vex.reconPlayerId, snapshot_key: `${at(30 * 60000)}#snap-vex-ubi-2`, snapshot_id: 'snap-vex-ubi-2', snapshot_type: 'rank_snapshot', source: 'ubisoft', captured_at: at(30 * 60000), created_at: at(29 * 60000), season: 'Y11S3', verification: 'verified_external', fields: { rank: 'Gold I' }, notes: 'internal note should never be projected' },
    { recon_player_id: vex.reconPlayerId, snapshot_key: `${at(20 * DAY)}#snap-vex-ubi-1`, snapshot_id: 'snap-vex-ubi-1', snapshot_type: 'rank_snapshot', source: 'ubisoft', captured_at: at(20 * DAY), created_at: at(20 * DAY), season: 'Y11S3', verification: 'verified_external', fields: { rank: 'Silver I' } },
    { recon_player_id: vex.reconPlayerId, snapshot_key: `${at(3 * DAY)}#snap-vex-trn-1`, snapshot_id: 'snap-vex-trn-1', snapshot_type: 'stat_snapshot', source: 'trn', captured_at: at(3 * DAY), created_at: at(3 * DAY), season: 'Y11S3', verification: 'verified_external', fields: { kd: 1.04 } },
    { recon_player_id: vex.reconPlayerId, snapshot_key: `${at(2 * DAY)}#vod-1`, snapshot_id: 'vod-1', snapshot_type: 'vod_analysis', source: 'vod', captured_at: at(2 * DAY), created_at: at(2 * DAY), verification: 'ai_derived', fields: { last_vod_map: 'Clubhouse' } },
    { recon_player_id: declined.reconPlayerId, snapshot_key: `${at(5 * HOUR)}#snap-dec-psn`, snapshot_id: 'snap-dec-psn', snapshot_type: 'rank_snapshot', source: 'psn', captured_at: at(5 * HOUR), created_at: at(5 * HOUR), season: 'Y11S3', verification: 'verified_external', fields: { rank: 'Gold III' } },
  ]
  world.playerIdentities = [
    { recon_player_id: vex.reconPlayerId, identity_key: 'ubisoft#fixture-ubi-1', provider: 'ubisoft', external_id: 'fixture-ubi-1', username: 'VerticalVexFixture', verification: 'verified_external', verified: true, linked_at: at(40 * DAY), updated_at: at(40 * DAY) },
    { recon_player_id: vex.reconPlayerId, identity_key: 'trn#fixture-trn-1', provider: 'trn', external_id: 'fixture-trn-1', verification: 'player_reported', verified: false, linked_at: at(30 * DAY), updated_at: at(30 * DAY) },
    { recon_player_id: declined.reconPlayerId, identity_key: 'psn#fixture-psn-1', provider: 'psn', external_id: 'fixture-psn-1', verification: 'player_reported', verified: false, linked_at: at(90 * DAY), updated_at: at(90 * DAY) },
  ]
  world.providerHealth = [
    { provider: 'ubisoft', observed_at: at(10 * 60000), status: 'healthy', latency_ms: 220, checked_by: 'sub-fixture-admin' },
    { provider: 'trn', observed_at: at(15 * 60000), status: 'healthy', latency_ms: 310, checked_by: 'sub-fixture-admin' },
    { provider: 'psn', observed_at: at(5 * 60000), status: 'down', error_code: 'upstream_5xx', checked_by: 'sub-fixture-admin' },
  ]
  // Stripe-billed rows carry a subscription id and identity binding where
  // production would have them; the payment-failed row stays unbound.
  for (const row of world.subscriptions) {
    if (row.email === vex.email) Object.assign(row, { stripe_subscription_id: 'sub_FIXTUREVEX0003', cognito_sub: vex.sub })
    if (row.email === 'fading.roamer@example.test') Object.assign(row, { stripe_subscription_id: 'sub_FIXTUREROAM006', cognito_sub: 'sub-fixture-0006' })
  }
  return world
}

export function supportCtx(world, { failures = {}, now = FIXED_NOW } = {}) {
  const tables = createMemoryTables(world, { failures })
  const catalog = createPlanCatalog()
  const config = { features: {}, activityTrackingSince: null }
  return {
    tables,
    store: null,
    catalog,
    config,
    log: { warn() {}, info() {} },
    now: () => now,
    async factsFor(identity, { withCognito = false, signedIn = true } = {}) {
      const one = await assembleOne({ tables, store: null, email: identity.email, sub: identity.sub || null, signedIn, isAdmin: identity.isAdmin === true, withCognito, log: this.log })
      const facts = buildFacts({ now, catalog, config, identity: { ...one.identity, signedIn }, sources: one.sources })
      return { facts, one, lifecycle: deriveLifecycle(facts) }
    },
  }
}

export function playerIdentity(world, key) {
  const s = world.scenarios[key]
  return { email: s.email, sub: s.sub, isAdmin: false, signedIn: true, reconPlayerId: s.sub ? reconPlayerIdFor(s.sub) : null }
}
