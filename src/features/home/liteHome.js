// Lite-mode home: the same rules the customer-success Lambda runs, fed from
// the account API (/me via useAuth), Road to Champion progress, the
// player-data record, and this device's recent round plans.
import { buildFacts } from '../../../lambda/customer-success/domain/facts.mjs'
import { buildHomeView } from '../../../lambda/customer-success/domain/home.mjs'

const settled = (result) => (result === undefined ? { status: 'not_connected', data: null } : result)

export function buildLiteHomeView({ user, isAdmin, plan, profile, profileComplete, vodUsage, account, recents, climb, player, now = Date.now() }) {
  const me = account
    ? {
      plan,
      sub_status: account.sub_status,
      current_period_end: account.current_period_end,
      stripe_customer_id: account.stripe_customer_id,
      tier_scope: account.tier_scope,
      vod_usage: vodUsage,
      profile,
      profile_complete: profileComplete,
    }
    : null

  const facts = buildFacts({
    now,
    config: { features: { messaging: false, feedback: false } },
    identity: { email: user?.email, isAdmin, signedIn: true },
    sources: {
      me: me ? { status: 'ok', data: me } : { status: 'unavailable', data: null },
      climb: settled(climb),
      player: settled(player),
      local: { status: 'ok', data: { recents: Array.isArray(recents) ? recents : [] } },
    },
  })
  return buildHomeView(facts, { mode: 'lite' })
}
