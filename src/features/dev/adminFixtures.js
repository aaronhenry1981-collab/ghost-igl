// DEV ONLY: fictional data for the /__dev/admin preview. Every person here is
// invented (example.test / examplemail.test addresses). Installed as a fetch
// shim that answers API calls only while the page is under /__dev/admin.
import { API_URL } from '../../lib/cognito'
import { setAdminTokenSource } from '../admin/adminFetch'

const NOW = Date.now()
const DAY = 86400000
const iso = (offsetMs) => new Date(NOW + offsetMs).toISOString()

const PRICES = { pro: 1200, elite: 7000, champion: 3900 }
let seq = 0
function member(o) {
  seq += 1
  const id = String(seq).padStart(4, '0')
  const plan = o.plan || 'free'
  const state = o.billing_state || (plan === 'free' ? 'free' : 'paid')
  const paidLike = ['paid', 'trialing', 'payment_issue', 'ending'].includes(state)
  return {
    username: o.noAccount ? null : `fx-${id}-7d1c-4a8e`,
    email: o.email,
    cognito_status: o.noAccount ? 'NO_ACCOUNT' : (o.cognito_status || 'CONFIRMED'),
    orphan: Boolean(o.noAccount),
    created_at: iso(-(o.joinedDaysAgo ?? seq * 3) * DAY),
    plan,
    sub_status: o.sub_status || (state === 'paid' ? 'active' : state === 'trialing' ? 'trialing' : state === 'payment_issue' ? 'past_due' : state === 'canceled' ? 'canceled' : state === 'ending' ? 'active' : 'none'),
    billing_state: state,
    is_comp: state === 'comp',
    price_amount_cents: paidLike ? PRICES[plan] || 0 : 0,
    next_billing_at: paidLike || state === 'comp' ? iso((o.renewInDays ?? 12) * DAY) : null,
    current_period_end: paidLike || state === 'comp' ? iso((o.renewInDays ?? 12) * DAY) : null,
    will_renew: state === 'paid' || state === 'trialing',
    has_collected_payment: state === 'paid' || state === 'payment_issue' || state === 'ending' || state === 'canceled',
    live_subscription_count: o.liveSubs ?? (paidLike ? 1 : 0),
    stripe_customer_count: o.customers ?? (plan !== 'free' || state === 'canceled' ? 1 : 0),
    billing_alerts: o.alerts || [],
    stripe_customer_id: plan !== 'free' || state === 'canceled' ? `cus_FIXTURE${id}` : null,
    stripe_subscription_id: paidLike ? `sub_FIXTURE${id}` : null,
    first_name: o.first || null,
    last_name: o.last || null,
    name_source: o.first || o.last ? (o.nameSource || 'cognito') : null,
    name_updated_at: o.first || o.last ? iso(-2 * DAY) : null,
    name_review: o.review || null,
    display_name: o.gamer || null,
    platform: o.platform || 'PC',
    region: o.region || 'NA East',
    discord_username: o.discord || null,
    r6_ubisoft_username: o.ubisoft || null,
    r6_rank: o.rank || null,
    r6_goal_rank: o.goal || null,
    r6_main_role: o.role || null,
    last_seen_at: o.seenMinutesAgo == null ? null : iso(-o.seenMinutesAgo * 60000),
    referral_source: o.source || null,
  }
}

export const FIXTURE_MEMBERS = [
  member({ first: 'Maximiliano Alejandro', last: 'Fernández-Castellanos', email: 'maximiliano.fernandez-castellanos.ranked.grind@examplemail.test', plan: 'champion', gamer: 'MaxFC', ubisoft: 'MaxFC.R6', rank: 'Emerald II', goal: 'Diamond', role: 'Entry', seenMinutesAgo: 4, source: 'tiktok', discord: 'maxfc', joinedDaysAgo: 40 }),
  member({ first: 'Siobhán', last: "O'Neill-Park", email: 'siobhan.oneill@example.test', plan: 'elite', billing_state: 'trialing', renewInDays: 5, seenMinutesAgo: 90, source: 'youtube', joinedDaysAgo: 2 }),
  member({ first: 'Jordan', last: 'Reyes', email: 'jordan.reyes@example.test', plan: 'pro', seenMinutesAgo: 60 * 26, rank: 'Gold I', goal: 'Platinum', role: 'Support', joinedDaysAgo: 18 }),
  member({ first: 'Cher', email: 'cher.single.name@example.test', nameSource: 'member', seenMinutesAgo: 60 * 24 * 9, joinedDaysAgo: 30 }),
  member({ email: 'xx.slayer.xx@example.test', gamer: 'xXSlayerXx', plan: 'pro', review: [{ source: 'stripe', value: 'Slayer', reason: 'one word: a single name or a handle' }], seenMinutesAgo: 60 * 5, joinedDaysAgo: 11 }),
  member({ email: 'paid.before.signup@example.test', plan: 'pro', noAccount: true, joinedDaysAgo: 6 }),
  member({ first: 'Priya', last: 'Raghunathan-Venkatesan', email: 'priya.raghunathan-venkatesan@examplemail.test', plan: 'elite', billing_state: 'payment_issue', alerts: ['payment_issue'], seenMinutesAgo: 60 * 50, joinedDaysAgo: 70 }),
  member({ first: 'Tomás', last: 'Nguyen', email: 'tomas.nguyen@example.test', plan: 'pro', billing_state: 'ending', renewInDays: 8, seenMinutesAgo: 60 * 24 * 3, joinedDaysAgo: 95 }),
  member({ first: 'Aleksandra', last: 'Wiśniewska-Kowalczyk', email: 'aleksandra.creator@example.test', plan: 'champion', billing_state: 'comp', renewInDays: 60, seenMinutesAgo: 30, source: 'creator', joinedDaysAgo: 14 }),
  member({ first: 'Kai', last: 'Andersen', email: 'kai.andersen@example.test', plan: 'pro', liveSubs: 2, customers: 2, alerts: ['multiple_live_subscriptions', 'multiple_stripe_customers'], seenMinutesAgo: 60 * 3, joinedDaysAgo: 9 }),
  member({ first: 'Mei-Ling', last: 'Zhou', email: 'meiling.zhou@example.test', plan: 'pro', billing_state: 'canceled', seenMinutesAgo: 60 * 24 * 40, joinedDaysAgo: 120 }),
  member({ first: 'Oluwaseun', last: 'Adebayo-Johnson', email: 'oluwaseun.adebayo-johnson@example.test', cognito_status: 'UNCONFIRMED', joinedDaysAgo: 1 }),
  ...[
    ['Ava', 'Thompson'], ['Liam', 'Okafor'], ['Noah', 'Schmidt'], ['Emma', 'Laurent'], ['Lucas', 'Pereira Costa'], ['Mia', 'Kowalski'],
    ['Ethan', 'Brooks'], ['Isla', 'MacLeod'], ['Mateo', 'Rossi'], ['Zara', 'Haddad'], ['Leo', 'Fischer'], ['Nora', 'Lindqvist'],
    ['Hiro', 'Tanaka'], ['Freya', 'Nilsen'], ['Omar', 'El-Amin'], ['Chloé', 'Dubois'], ['Ivan', 'Petrov'], ['Sofia', 'Marino'],
  ].map(([first, last], i) => member({
    first, last,
    email: `${first.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')}.${last.toLowerCase().replace(/\s+/g, '')}@example.test`,
    plan: i % 5 === 0 ? 'pro' : 'free',
    seenMinutesAgo: i % 4 === 0 ? null : (i + 1) * 170,
    joinedDaysAgo: 20 + i * 4,
  })),
  member({ email: 'no.name.yet@example.test', joinedDaysAgo: 45 }),
]

function summaryOf(members) {
  const paid = members.filter((m) => ['paid', 'payment_issue', 'ending'].includes(m.billing_state))
  const trials = members.filter((m) => m.billing_state === 'trialing')
  const active = (plan) => paid.filter((m) => m.plan === plan).length
  const dollars = (list) => (list.reduce((n, m) => n + m.price_amount_cents, 0) / 100).toFixed(2)
  return {
    mrr_dollars: dollars(paid.filter((m) => m.billing_state === 'paid')),
    paying_active: paid.length,
    trialing: trials.length,
    trials_expected_to_convert: trials.length,
    trial_mrr_dollars: dollars(trials),
    ending: members.filter((m) => m.billing_state === 'ending').length,
    pro_active: active('pro'),
    elite_active: active('elite'),
    champion_active: active('champion'),
    comp_active: members.filter((m) => m.is_comp).length,
    collected_30d_dollars: dollars(paid),
    refunds_30d_dollars: '0.00',
  }
}

const at = (days, hour) => { const d = new Date(NOW + days * DAY); d.setHours(hour, 0, 0, 0); return d.toISOString() }
const BOOKINGS = [
  { slotId: 'fx-slot-1', start: at(1, 19), status: 'confirmed', sessionType: 'VOD review (60 min)', customer: { name: 'Maximiliano Alejandro Fernández-Castellanos', email: FIXTURE_MEMBERS[0].email, discord: 'maxfc', rank_goal: 'Diamond' }, payment: { status: 'paid' }, referral_source: 'tiktok' },
  { slotId: 'fx-slot-2', start: at(2, 20), status: 'confirmed', type: 'included', sessionType: 'Included Champion session', customer: { name: 'Jordan Reyes', email: 'jordan.reyes@example.test' }, payment: { status: 'included' }, referral_source: 'direct' },
  { slotId: 'fx-slot-3', start: at(4, 18), status: 'comped', sessionType: 'Live coaching (60 min)', customer: { name: 'Aleksandra Wiśniewska-Kowalczyk', email: 'aleksandra.creator@example.test' }, referral_source: 'creator' },
  { slotId: 'fx-slot-4', start: at(-6, 19), status: 'completed', sessionType: 'VOD review (60 min)', customer: { name: 'Maximiliano Alejandro Fernández-Castellanos', email: FIXTURE_MEMBERS[0].email }, payment: { status: 'paid' }, referral_source: 'tiktok' },
]
let AVAILABILITY = {
  timezone: 'America/New_York', session_minutes: 60, buffer_minutes: 15, booking_horizon_days: 21, min_notice_hours: 12,
  windows: [{ dow: 2, start: '18:00', end: '22:00' }, { dow: 4, start: '18:00', end: '22:00' }, { dow: 6, start: '12:00', end: '17:00' }],
  blackouts: [], oneoffs: [], timeoff: [],
}
const AUDIT = [
  { id: 'fx-a1', timestamp: iso(-2 * 3600000), action: 'user.name.update', actor: 'owner@example.test', target: 'jordan.reyes@example.test', details: { before: { first_name: null, last_name: null }, after: { first_name: 'Jordan', last_name: 'Reyes' } } },
  { id: 'fx-a2', timestamp: iso(-14 * DAY), action: 'comp.grant', actor: 'owner@example.test', target: 'aleksandra.creator@example.test', details: { plan: 'champion', days: 90, note: 'Creator trial' } },
  { id: 'fx-a3', timestamp: iso(-3 * DAY), action: 'reconcile.preview', actor: 'owner@example.test', target: 'stripe', details: { updates: 0, creates: 0 } },
  { id: 'fx-a4', timestamp: iso(-20 * DAY), action: 'comp.revoke', actor: 'owner@example.test', target: 'ivan.petrov@example.test', details: { reason: 'Converted to paid' } },
]
let ANNOUNCEMENTS = [{ id: 'fx-an1', title: 'Coaching calendar maintenance', message: 'Booking is paused for 20 minutes tonight while the calendar updates.', level: 'maintenance', created_at: iso(-DAY), expires_at: iso(DAY) }]
const COMPS = [{ email: 'aleksandra.creator@example.test', plan: 'champion', status: 'active', raw_status: 'active', days_remaining: 60, current_period_end: iso(60 * DAY), comp_note: 'Creator trial', stripe_customer_id: 'comp_fx1' }]

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function answer(path, method, body) {
  const [route, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  if (route === '/admin/users') return json({ users: FIXTURE_MEMBERS, summary: summaryOf(FIXTURE_MEMBERS), billing_source: 'stripe', billing_warning: null })
  if (route === '/admin/bookings') return json({ bookings: BOOKINGS })
  if (route === '/admin/availability') {
    if (method === 'PUT') AVAILABILITY = { ...AVAILABILITY, ...(body?.config || {}) }
    return json({ config: AVAILABILITY })
  }
  if (route === '/admin/audit') {
    const t = (params.get('target') || '').toLowerCase()
    return json({ events: AUDIT.filter((e) => !t || e.target === t) })
  }
  if (route === '/admin/users/name' && method === 'POST') {
    const m = FIXTURE_MEMBERS.find((x) => x.email === String(body?.email || '').toLowerCase())
    if (!m) return json({ error: 'Not found' }, 404)
    if (String(body.first_name || '').includes('@') || String(body.last_name || '').includes('@')) return json({ error: 'First name looks like an email address' }, 400)
    Object.assign(m, { first_name: body.first_name?.trim() || null, last_name: body.last_name?.trim() || null, name_source: 'admin', name_updated_at: new Date().toISOString(), name_review: null })
    AUDIT.unshift({ id: `fx-a${AUDIT.length + 10}`, timestamp: new Date().toISOString(), action: 'user.name.update', actor: 'owner@example.test', target: m.email, details: { after: { first_name: m.first_name, last_name: m.last_name } } })
    return json({ ok: true, email: m.email, first_name: m.first_name, last_name: m.last_name, name_source: 'admin', name_updated_at: m.name_updated_at, name_review: null })
  }
  if (route === '/admin/comps') return json({ comps: COMPS })
  if (route === '/admin/announcements') {
    if (method === 'POST') ANNOUNCEMENTS = [{ id: `fx-an${ANNOUNCEMENTS.length + 2}`, created_at: new Date().toISOString(), ...body }, ...ANNOUNCEMENTS]
    return json({ announcements: ANNOUNCEMENTS })
  }
  if (route.startsWith('/admin/announcements/') && method === 'DELETE') {
    ANNOUNCEMENTS = ANNOUNCEMENTS.filter((a) => a.id !== decodeURIComponent(route.split('/').pop()))
    return json({ ok: true })
  }
  if (route === '/admin/calendar-url') return json({ url: 'webcal://calendar.example.test/fixture.ics' })
  if (route === '/booking/slots') return json({ slots: [at(3, 18), at(3, 19), at(5, 20)] })
  if (route === '/testimonials') return json({ testimonials: [] })
  if (route === '/demo-video') return json({ video: null })
  if (route === '/admin/backfill') return json({ previewId: 'fx-preview', counts: { updates: 0, creates: 0, revocations: 0, unchanged: 14, skipped: 0 }, changes: [], skipped: [], confirmPhrase: 'APPLY fx-preview' })
  return json({ ok: true })
}

let installed = false
export function installAdminFixtures() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const realFetch = window.fetch.bind(window)
  const active = () => window.location.pathname.startsWith('/__dev/admin')
  setAdminTokenSource(() => (active() ? 'dev-fixture' : null))
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    if (active() && url.startsWith(API_URL)) {
      const method = (init.method || 'GET').toUpperCase()
      let body = null
      try { body = init.body ? JSON.parse(init.body) : null } catch { body = null }
      await new Promise((r) => setTimeout(r, 120))
      return answer(url.slice(API_URL.length), method, body)
    }
    return realFetch(input, init)
  }
}
