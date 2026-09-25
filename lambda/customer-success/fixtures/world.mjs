// Fictional Recon 6 data for tests, local development and screenshots.
//
// Every person here is invented. Addresses use the reserved `.test` TLD so
// nothing can ever be delivered to them. Rows mirror the real table shapes
// (subscriptions, profiles, climb progress, bookings, player-data, crm-log)
// so the same readers and rules run against them as against DynamoDB.

import { reconPlayerIdFor } from '../lib/ids.mjs'

const DAY = 86400000

const PRICE = {
  pro: 'price_1TLEtrJNddvjgWcg9iTWJoLS',
  elite: 'price_1TPtOYJNddvjgWcgfEWjzGnp',
  eliteLegacy: 'price_1TLEtsJNddvjgWcgYcmiNmW7',
  champion: 'price_1TzrjiJNddvjgWcgw1DYSf88',
}

export function buildFixtureWorld(now = Date.now()) {
  const at = (days) => new Date(now - days * DAY).toISOString()
  const ahead = (days) => new Date(now + days * DAY).toISOString()
  const gp = (r6) => JSON.stringify({ r6 })

  const people = [
    {
      key: 'new',
      email: 'rookie.recruit@example.test',
      sub: 'sub-fixture-0001',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(0.2) },
      profile: null,
      scenario: 'New customer: signed up today, nothing else yet',
    },
    {
      key: 'free_activated',
      email: 'quiet.anchor@example.test',
      sub: 'sub-fixture-0002',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(9) },
      profile: {
        email: 'quiet.anchor@example.test', first_name: 'Maya', last_name: 'Fixture', display_name: 'QuietAnchor', platform: 'ps5', region: 'na',
        game_profiles_json: gp({ rank: 'Silver II', goal_rank: 'Gold', main_role: 'anchor' }), created_at: at(9), last_seen_at: at(1), referral_code: 'QANCHOR1',
      },
      climb: { progress: { checks: { 'copper-0': true, 'copper-1': true, 'copper-2': true, 'copper-3': true, 'copper-4': true, 'silver-0': true, 'silver-1': true }, open: {} }, updatedAt: at(1) },
      activity: [
        { type: 'strat_viewed', at: at(1), ref: { mapId: 'clubhouse', siteId: 'bar-stock', side: 'defense' } },
        { type: 'strat_viewed', at: at(5), ref: { mapId: 'bank', siteId: 'ceo', side: 'defense' } },
        { type: 'match_prep_opened', at: at(1) },
      ],
      scenario: 'Activated free player: profile done, Road to Champion started, round plans used',
    },
    {
      key: 'paying_active',
      email: 'vertical.vex@example.test',
      sub: 'sub-fixture-0003',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(47) },
      profile: {
        email: 'vertical.vex@example.test', first_name: 'Theo', last_name: 'Sample', display_name: 'VerticalVex', platform: 'pc', region: 'eu',
        game_profiles_json: gp({ rank: 'Gold I', goal_rank: 'Platinum', main_role: 'support' }), created_at: at(47), last_seen_at: at(0.1),
      },
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0003A', email: 'vertical.vex@example.test', plan: 'champion', price_id: PRICE.elite, status: 'active', tier_scope: 'single', current_period_end: ahead(16), created_at: at(47), updated_at: at(14), vod_period_start_at: at(9), vod_sessions_used: 7, vod_updated_at: at(2) },
      ],
      climb: { progress: { checks: { 'gold-0': true, 'gold-1': true, 'gold-2': true }, open: {} }, updatedAt: at(4) },
      playerRecord: {
        canonical: {
          vod_recurring_weaknesses: { value: ['Peeking the same angle twice after getting spotted', 'Late rotations to the second site'], source: 'vod', captured_at: at(2), verification: 'system_derived' },
          vod_practice_plan: { value: ['Change angle after every trade or info call', 'Rotate on the first drone call, not the plant'], source: 'vod', captured_at: at(2), verification: 'system_derived' },
          last_vod_map: { value: 'Clubhouse', source: 'vod', captured_at: at(2) },
          rank: { value: 'Gold I', source: 'manual', captured_at: at(47), verification: 'player_reported' },
        },
      },
      playerEvents: [
        { event_type: 'vod_reviewed', occurred_at: at(2), data: { detected_map: 'Clubhouse', image_count: 4 } },
        { event_type: 'vod_reviewed', occurred_at: at(8), data: { detected_map: 'Bank', image_count: 5 } },
        { event_type: 'road_to_champion_progress_updated', occurred_at: at(4) },
      ],
      activity: [
        { type: 'strat_viewed', at: at(0.2), ref: { mapId: 'clubhouse', siteId: 'cash-cctv', side: 'attack' } },
        { type: 'strat_viewed', at: at(2), ref: { mapId: 'clubhouse', siteId: 'bar-stock', side: 'attack' } },
        { type: 'match_prep_opened', at: at(0.2) },
        { type: 'match_prep_opened', at: at(5) },
        { type: 'live_coach_opened', at: at(6) },
      ],
      scenario: 'Paying active player: Elite ($39), engaged, recent VOD review',
    },
    {
      key: 'paying_locked_out',
      email: 'locked.breacher@example.test',
      sub: null,
      cognito: { status: 'FORCE_CHANGE_PASSWORD', enabled: true, createdAt: at(4) },
      profile: null,
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0004A', email: 'locked.breacher@example.test', plan: 'pro', price_id: PRICE.pro, status: 'active', tier_scope: 'single', current_period_end: ahead(26), created_at: at(4), updated_at: at(4) },
      ],
      scenario: 'Paying player who cannot access the product: bought Pro 4 days ago, never finished first login',
    },
    {
      key: 'paying_renewal_stale',
      email: 'stale.renewal@example.test',
      sub: 'sub-fixture-0005',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(80) },
      profile: {
        email: 'stale.renewal@example.test', first_name: 'Rin', last_name: 'Example', display_name: 'StaleRenewal', platform: 'xbox',
        game_profiles_json: gp({ rank: 'Platinum III', goal_rank: 'Emerald' }), created_at: at(80), last_seen_at: at(1),
      },
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0005A', email: 'stale.renewal@example.test', plan: 'pro', price_id: PRICE.pro, status: 'active', tier_scope: 'single', current_period_end: at(3), created_at: at(80), updated_at: at(33) },
      ],
      activity: [{ type: 'strat_viewed', at: at(1), ref: { mapId: 'oregon', siteId: 'kids-dorms', side: 'defense' } }],
      scenario: 'Paying player locked out by the ledger: renewal not recorded after the paid-through date',
    },
    {
      key: 'at_risk',
      email: 'fading.roamer@example.test',
      sub: 'sub-fixture-0006',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(60) },
      profile: {
        email: 'fading.roamer@example.test', first_name: 'Jordan', last_name: 'Placeholder', display_name: 'FadingRoamer', platform: 'pc',
        game_profiles_json: gp({ rank: 'Emerald IV', goal_rank: 'Diamond', main_role: 'roamer' }), created_at: at(60), last_seen_at: at(22),
      },
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0006A', email: 'fading.roamer@example.test', plan: 'champion', price_id: PRICE.champion, status: 'active', tier_scope: 'single', current_period_end: ahead(8), created_at: at(52), updated_at: at(22) },
      ],
      bookings: [
        { slotId: at(40).replace(/\.\d{3}Z$/, '.000Z'), status: 'completed', customer: { email: 'Fading.Roamer@example.test', name: 'Jordan' }, coachingType: 'single', payment: { status: 'credit' } },
      ],
      climb: { progress: { checks: { 'emerald-0': true }, open: {} }, updatedAt: at(35) },
      activity: [{ type: 'strat_viewed', at: at(23), ref: { mapId: 'kafe', siteId: 'kitchen-bakery', side: 'attack' } }],
      feedback: [
        { feedbackId: 'fb-fixture-0006', moment: 'week_1', createdAt: at(24), status: 'open', answers: { helpful: 2, nps: 5, confusing: 'Could not tell which setup to run on Kafe with a duo.', missing: 'Duo-specific plans' } },
      ],
      scenario: 'At-risk player: Champion ($70), inactive 22 days, no session booked this month, unhappy feedback',
    },
    {
      key: 'payment_failed',
      email: 'card.declined@example.test',
      sub: 'sub-fixture-0007',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(120) },
      profile: {
        email: 'card.declined@example.test', first_name: 'Sam', last_name: 'Testcase', display_name: 'CardDeclined', platform: 'ps5',
        game_profiles_json: gp({ rank: 'Gold III', goal_rank: 'Platinum' }), created_at: at(120), last_seen_at: at(2),
      },
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0007A', email: 'card.declined@example.test', plan: 'champion', price_id: PRICE.eliteLegacy, status: 'past_due', tier_scope: 'single', current_period_end: ahead(2), created_at: at(120), updated_at: at(1) },
      ],
      activity: [{ type: 'strat_viewed', at: at(2), ref: { mapId: 'bank', siteId: 'basement', side: 'attack' } }],
      scenario: 'Failed payment on legacy $29 Elite (label still "champion")',
    },
    {
      key: 'churned',
      email: 'gone.gold@example.test',
      sub: 'sub-fixture-0008',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(150) },
      profile: {
        email: 'gone.gold@example.test', first_name: 'Ari', last_name: 'Mock', display_name: 'GoneGold', platform: 'pc',
        game_profiles_json: gp({ rank: 'Gold II', goal_rank: 'Platinum' }), created_at: at(150), last_seen_at: at(40),
      },
      subscriptions: [
        { stripe_customer_id: 'cus_FIXTURE0008A', email: 'gone.gold@example.test', plan: 'pro', price_id: PRICE.pro, status: 'canceled', tier_scope: 'single', current_period_end: at(20), created_at: at(150), updated_at: at(20) },
      ],
      crmLog: { email: 'gone.gold@example.test', welcome_sent_at: at(149) },
      scenario: 'Churned Pro subscriber, cancelled 20 days ago',
    },
    {
      key: 'dormant_free',
      email: 'dusty.drone@example.test',
      sub: 'sub-fixture-0009',
      cognito: { status: 'CONFIRMED', enabled: true, createdAt: at(70) },
      profile: {
        email: 'dusty.drone@example.test', first_name: 'Kai', last_name: 'Demo', display_name: 'DustyDrone', platform: 'xbox',
        game_profiles_json: gp({ rank: 'Bronze I', goal_rank: 'Silver' }), created_at: at(70), last_seen_at: at(45),
      },
      climb: { progress: { checks: { 'bronze-0': true }, open: {} }, updatedAt: at(46) },
      crmLog: { email: 'dusty.drone@example.test', welcome_sent_at: at(69) },
      scenario: 'Dormant free player: activated, then gone for 45 days',
    },
    {
      key: 'unconfirmed',
      email: 'never.confirmed@example.test',
      sub: null,
      cognito: { status: 'UNCONFIRMED', enabled: true, createdAt: at(3) },
      profile: null,
      crmLog: { email: 'never.confirmed@example.test', confirm_nudges: 1, confirm_nudge_at: at(2) },
      scenario: 'Signed up but never confirmed the email code',
    },
  ]

  const world = {
    now,
    cognitoUsers: [],
    subscriptions: [],
    profiles: [],
    climb: [],
    bookings: [],
    coachingEvents: [],
    playerRecords: [],
    playerEvents: [],
    referrals: [],
    crmLog: [],
    testimonials: [],
    activity: [],
    feedback: [],
    scenarios: {},
  }

  for (const person of people) {
    const rp = person.sub ? reconPlayerIdFor(person.sub) : null
    world.scenarios[person.key] = { email: person.email, sub: person.sub, reconPlayerId: rp, description: person.scenario }
    if (person.cognito) {
      world.cognitoUsers.push({ email: person.email, sub: person.sub, status: person.cognito.status, enabled: person.cognito.enabled, createdAt: person.cognito.createdAt })
    }
    if (person.profile) world.profiles.push(person.profile)
    for (const row of person.subscriptions || []) world.subscriptions.push(row)
    if (person.climb && person.sub) world.climb.push({ sub: person.sub, email: person.email, ...person.climb })
    for (const row of person.bookings || []) world.bookings.push(row)
    if (person.playerRecord && rp) world.playerRecords.push({ recon_player_id: rp, owner_user_id: person.sub, owner_email: person.email, ...person.playerRecord })
    for (const event of person.playerEvents || []) world.playerEvents.push({ recon_player_id: rp, event_key: `${event.occurred_at}#${event.event_type}`, ...event })
    if (person.crmLog) world.crmLog.push(person.crmLog)
    for (const item of person.activity || []) world.activity.push({ email: person.email, ...item })
    for (const item of person.feedback || []) world.feedback.push({ email: person.email, ...item })
  }

  // Admin account (excluded from customer metrics, used for admin screenshots).
  world.cognitoUsers.push({ email: 'coach.admin@example.test', sub: 'sub-fixture-admin', status: 'CONFIRMED', enabled: true, createdAt: at(200), groups: ['admins'] })
  world.profiles.push({ email: 'coach.admin@example.test', first_name: 'Coach', last_name: 'Admin', display_name: 'CoachAdmin', platform: 'pc', created_at: at(200), last_seen_at: at(0) })

  return world
}
