// Fictional support data for tests, local development and screenshots.
//
// Every player and staff member here is invented. Addresses use the reserved
// example.test domain; handles are neutral (FixturePlayerA...). Stripe-shaped
// ids are fake (FIXTURE...). The seeded cases cover every category and every
// status, with events of every kind and incidents in every state.
//
// supportApp() wires the production app core (createApp + route modules) to
// PR #24's fictional world plus this one, with in-memory tables that record
// every call so tests can prove the tables are never written.

import { createApp, defaultConfig } from '../../app.mjs'
import { assembleOne } from '../../data/assemble.mjs'
import { buildFacts } from '../../domain/facts.mjs'
import { deriveLifecycle } from '../../domain/lifecycle.mjs'
import { createPlanCatalog } from '../../domain/plans.mjs'
import { createSupportService } from '../service.mjs'
import { buildFixtureWorld } from '../../fixtures/world.mjs'
import { buildSupportWorld } from '../fixtures.mjs'
import { storeSeedFromWorld } from '../../fixtures/seed.mjs'
import { createMemoryTables } from '../../data/memoryTables.mjs'
import { createMemoryStore } from '../../data/memoryStore.mjs'
import { contactKeyFor } from '../../lib/ids.mjs'
import { routeModules } from '../../routes/index.mjs'
import { createSupportRoutes, supportRoutes } from '../../routes/support.mjs'
import { STATUSES, waitingOnFor } from '../workflow.mjs'
import { initialSla } from '../sla.mjs'
import { newIncident } from '../incidents.mjs'
import {
  CATEGORIES,
  CATEGORY_DEFAULTS,
  actionRequestEvent,
  caseEventItem,
  caseItem,
  caseNumberItem,
  counterItem,
  formatCaseNumber,
  incidentEventItem,
  incidentItem,
} from '../items.mjs'

export const SUPPORT_NOW = Date.parse('2026-09-25T15:00:00.000Z')
const DAY = 86400000

export const PLAYERS = Object.freeze({
  a: Object.freeze({ key: 'a', email: 'fixture.player.a@example.test', sub: 'sub-support-000a', handle: 'FixturePlayerA' }),
  b: Object.freeze({ key: 'b', email: 'fixture.player.b@example.test', sub: 'sub-support-000b', handle: 'FixturePlayerB' }),
  c: Object.freeze({ key: 'c', email: 'fixture.player.c@example.test', sub: 'sub-support-000c', handle: 'FixturePlayerC' }),
  // Paying player with a Stripe-shaped (fake) subscription row.
  d: Object.freeze({ key: 'd', email: 'fixture.player.d@example.test', sub: 'sub-support-000d', handle: 'FixturePlayerD' }),
})

export const STAFF = Object.freeze({
  agent: Object.freeze({ email: 'support.agent@example.test', sub: 'sub-staff-agent', groups: ['support-agent'] }),
  billing: Object.freeze({ email: 'support.billing@example.test', sub: 'sub-staff-billing', groups: ['support-billing'] }),
  engineering: Object.freeze({ email: 'support.engineer@example.test', sub: 'sub-staff-eng', groups: ['support-engineering'] }),
  lead: Object.freeze({ email: 'support.lead@example.test', sub: 'sub-staff-lead', groups: ['support-lead'] }),
  admin: Object.freeze({ email: 'support.admin@example.test', sub: 'sub-staff-admin', groups: ['admins'] }),
})

export const FAKE_STRIPE = Object.freeze({ customer: 'cus_FIXTURESUPD1234', subscription: 'sub_FIXTURESUPD5678' })

export function identityOf(who) {
  if (PLAYERS[who]) return { email: PLAYERS[who].email, sub: PLAYERS[who].sub, groups: [], isAdmin: false }
  if (STAFF[who]) return { email: STAFF[who].email, sub: STAFF[who].sub, groups: [...STAFF[who].groups], isAdmin: STAFF[who].groups.includes('admins') }
  throw new Error(`unknown fixture identity ${who}`)
}

// Adds the support players to a PR #24 fixture world (in place).
export function addSupportPlayers(world, now = SUPPORT_NOW) {
  const at = (days) => new Date(now - days * DAY).toISOString()
  for (const p of Object.values(PLAYERS)) {
    world.cognitoUsers.push({ email: p.email, sub: p.sub, status: 'CONFIRMED', enabled: true, createdAt: at(60) })
    world.profiles.push({ email: p.email, first_name: 'Fixture', last_name: 'Player', display_name: p.handle, platform: 'pc', created_at: at(60), last_seen_at: at(1) })
  }
  world.subscriptions.push({
    stripe_customer_id: FAKE_STRIPE.customer,
    stripe_subscription_id: FAKE_STRIPE.subscription,
    email: PLAYERS.d.email,
    plan: 'pro',
    price_id: 'price_1TLEtrJNddvjgWcg9iTWJoLS',
    status: 'active',
    tier_scope: 'single',
    current_period_end: new Date(now + 20 * DAY).toISOString(),
    created_at: at(40),
    updated_at: at(10),
  })
  return world
}

// ---- seeded cases: every category, every status ---------------------------------------

const OWNER_CYCLE = ['a', 'b', 'c']
const SOURCE_FOR = (i) => (i === 5 ? 'email' : i === 11 ? 'staff' : 'portal')

export function buildSupportCaseWorld(now = SUPPORT_NOW) {
  const iso = (ms) => new Date(ms).toISOString()
  const items = []
  const cases = {}
  const caseByCategory = {}

  // Incidents in every status.
  const incidentSpecs = [
    { id: 'inc_fixture0001', title: 'VOD reviews stuck in processing', service: 'vod_processing', status: 'investigating', severity: 'sev2' },
    { id: 'inc_fixture0002', title: 'Ubisoft link refresh failing', service: 'identity_ubisoft', status: 'identified', severity: 'sev3' },
    { id: 'inc_fixture0003', title: 'Sign-in code emails delayed', service: 'auth', status: 'monitoring', severity: 'sev3' },
    { id: 'inc_fixture0004', title: 'Paid access not applied after checkout', service: 'payment_access', status: 'resolved', severity: 'sev2' },
  ]
  const incidents = incidentSpecs.map((spec, i) => {
    const at = iso(now - (10 - i) * DAY)
    const incident = newIncident({ incidentId: spec.id, input: { title: spec.title, service: spec.service, status: spec.status, severity: spec.severity, workaround: i === 0 ? 'Upload again after the incident clears.' : undefined }, at, by: STAFF.lead.email })
    items.push(incidentItem(incident))
    items.push(incidentEventItem({ incidentId: spec.id, kind: 'update', body: 'Incident opened', data: { status: spec.status }, at, by: STAFF.lead.email }))
    return incident
  })

  CATEGORIES.forEach((category, i) => {
    const n = i + 1
    const caseNumber = formatCaseNumber(n)
    const ownerKey = OWNER_CYCLE[i % OWNER_CYCLE.length]
    const owner = PLAYERS[ownerKey]
    const contactKey = contactKeyFor(owner.email)
    const status = STATUSES[i % STATUSES.length]
    const source = i === 17 ? 'proactive' : SOURCE_FOR(i)
    const createdMs = now - (30 - i) * DAY
    const createdAt = iso(createdMs)
    const [team, priority, severity] = CATEGORY_DEFAULTS[category]
    const record = caseItem({
      caseId: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
      caseNumber,
      contactKey,
      email: owner.email,
      category,
      source,
      subject: `Fixture case about ${category.replace(/_/g, ' ')}`,
      description: `Fixture description for ${category}. Nothing here is real.`,
      priority,
      severity,
      team,
      sla: initialSla(priority, createdAt),
      playerVisible: source !== 'proactive',
      createdBy: source === 'proactive' ? 'system:proactive' : source === 'staff' ? STAFF.agent.email : 'player',
      at: createdAt,
    })
    const touched = iso(createdMs + DAY)
    const c = { ...record, status, waitingOn: waitingOnFor(status), updatedAt: touched, gsi1sk: `${touched}#${contactKey}` }
    if (['resolved', 'closed'].includes(status)) {
      c.resolvedAt = touched
      c.resolutionCount = 1
      c.resolution = { summary: 'Fixture resolution summary.', code: 'answered', at: touched, by: STAFF.agent.email }
      c.rootCause = 'fixture_root_cause'
      c.learning = { productArea: 'fixtures', avoidable: false, docGap: false, onboardingGap: false, bug: false, featureRequest: false }
    }
    if (status === 'closed') c.closedAt = iso(createdMs + 2 * DAY)
    if (status === 'reopened') {
      c.reopenedAt = touched
      c.reopenCount = 1
      c.resolutionCount = 1
    }
    if (status !== 'new') c.sla = { ...c.sla, firstResponseAt: iso(createdMs + 3600000), nextResponseDueAt: null }
    if (i % 4 === 1) c.assignee = STAFF.agent.email
    if (status === 'escalated') c.escalation = { team: 'vod_ai', at: touched, by: STAFF.agent.email, reason: 'Fixture escalation', handoff: { text: 'Fixture handoff' } }
    if (category === 'vod_analysis') c.refs = { ...c.refs, incidentId: 'inc_fixture0001' }
    items.push(c, caseNumberItem({ caseNumber, contactKey, caseId: c.caseId, at: createdAt }))

    const ev = (kind, fields = {}) => items.push(caseEventItem({ caseRecord: c, kind, at: fields.at || createdAt, actor: fields.actor || { kind: 'player', id: owner.email }, visibility: fields.visibility || 'public', body: fields.body ?? null, data: fields.data ?? null }))
    if (source === 'proactive') ev('system', { actor: { kind: 'system', id: 'system' }, visibility: 'staff', body: c.description })
    else if (source === 'email') ev('email_in', { body: c.description })
    else ev('message_player', { body: c.description })
    if (status !== 'new') {
      ev('message_staff', { at: iso(createdMs + 3600000), actor: { kind: 'staff', id: STAFF.agent.email }, body: 'Fixture reply from support.' })
      ev('status_change', { at: iso(createdMs + 3600000), actor: { kind: 'staff', id: STAFF.agent.email }, data: { from: 'new', to: status } })
      ev('note_private', { at: iso(createdMs + 3600000), actor: { kind: 'staff', id: STAFF.agent.email }, visibility: 'staff', body: 'PRIVATE_FIXTURE_NOTE' })
    }
    if (c.assignee) ev('assignment', { actor: { kind: 'staff', id: STAFF.agent.email }, data: { toAssignee: c.assignee } })
    if (status === 'escalated') ev('escalation', { actor: { kind: 'staff', id: STAFF.agent.email }, body: 'Fixture handoff', data: { team: 'vod_ai' } })
    if (c.refs.incidentId) ev('incident_link', { actor: { kind: 'staff', id: STAFF.agent.email }, data: { incidentId: c.refs.incidentId } })
    if (status === 'closed') ev('csat', { at: c.closedAt, data: { rating: 5, forResolution: 1 } })
    if (i === 2) ev('attachment', { data: { attId: 'att_fixture01', name: 'screenshot.png' } })
    if (category === 'access_entitlement') {
      items.push(actionRequestEvent({ caseRecord: c, requestId: 'ar_00000000f1f1f1f1', actionKind: 'entitlement_repair', reason: 'Fixture: paid but locked out', requiredVerification: 'Fixture verification', actor: { kind: 'staff', id: STAFF.billing.email }, at: touched }))
    }
    cases[`${category}`] = caseNumber
    caseByCategory[category] = { caseNumber, owner: ownerKey, status }
  })
  if (Object.keys(cases).length !== CATEGORIES.length) throw new Error('fixture: a category has no case')

  items.push(counterItem({ value: CATEGORIES.length, version: 1, at: iso(now - DAY) }))
  return { now, items, cases, caseByCategory, incidents }
}

// ---- engine stubs ---------------------------------------------------------------------------

export const STAFF_ONLY_MARKER = 'STAFF_ONLY_DIAGNOSTIC'
export const COPILOT_MARKER = 'COPILOT_ADVISORY_TEXT'

// Simple deterministic stand-ins for the engine modules, with call logs.
export function stubEngines(overrides = {}) {
  const calls = { classifyIssue: [], categoryInfo: [], buildDiagnostics: [], buildCopilot: [], searchHelp: [], getArticle: [], evaluateProactive: [], decideInboundEmail: [] }
  const KEYWORDS = [
    [/charged|refund|invoice/, 'billing_question', 'broken'],
    [/locked|paid but|no access/, 'access_entitlement', 'broken'],
    [/vod|review stuck/, 'vod_analysis', 'broken'],
    [/ubisoft/, 'ubisoft_connection', 'broken'],
    [/coach|session/, 'coaching_session', 'how_to'],
    [/crash|broken|error/, 'bug', 'broken'],
    [/how do i|where is/, 'other', 'how_to'],
    [/not improving|no results/, 'other', 'value'],
  ]
  const engines = {
    classifyIssue(textIn, opts) {
      calls.classifyIssue.push({ text: textIn, opts })
      const t = String(textIn || '').toLowerCase()
      const hit = KEYWORDS.find(([re]) => re.test(t))
      return {
        category: hit ? hit[1] : 'other',
        subcategory: null,
        intent: hit ? hit[2] : 'how_to',
        confidence: hit ? 0.8 : 0.2,
        questions: [{ id: 'which_email', prompt: 'Which email do you sign in with?', why: 'Lookup.' }],
      }
    },
    categoryInfo(category) {
      calls.categoryInfo.push(category)
      return null
    },
    buildDiagnostics(input) {
      calls.buildDiagnostics.push(input)
      const staff = input.view === 'staff'
      return {
        view: input.view,
        observedAt: new Date(input.now).toISOString(),
        signals: { signedIn: true },
        panels: [
          {
            id: 'entitlement',
            title: 'Membership and access',
            status: 'degraded',
            facts: [
              { label: 'Plan', value: 'Pro', source: 'Your membership', at: null, ...(staff ? {} : { vis: 'player' }) },
              // A misbehaving engine leaking a staff fact into a player view:
              // the service's own projection must drop it.
              { label: 'Stripe customer', value: FAKE_STRIPE.customer, source: 'subscriptions', at: null, vis: staff ? undefined : 'billing' },
              ...(staff ? [{ label: 'Internal', value: STAFF_ONLY_MARKER, source: 'rules', at: null }] : []),
            ],
            inferences: staff ? [{ label: 'Mismatch suspected', value: true, basis: 'fixture rule', confidence: 0.7 }] : [],
            actions: { user: ['Sign out and back in'], recon: staff ? ['Compare the Stripe row'] : ['LEAKED_RECON_ACTION'] },
          },
        ],
        context: staff ? { note: STAFF_ONLY_MARKER } : { note: 'LEAKED_CONTEXT' },
      }
    },
    buildCopilot(input) {
      calls.buildCopilot.push(input)
      return {
        summary: { kind: 'inference', text: `${COPILOT_MARKER}: player reports ${input.caseRecord.category}` },
        draftReply: `${COPILOT_MARKER} draft`,
        // Output that "asks" for writes: the service must never act on it.
        suggestedActions: [{ kind: 'refund', execute: true }, { kind: 'entitlement_repair', execute: true }],
      }
    },
    // searchHelp(query, { limit, category }) -> articles[]
    searchHelp(query, opts) {
      calls.searchHelp.push({ query, opts })
      return [{ slug: 'reset-password', title: 'Reset your password', status: 'reviewed' }, { slug: 'unreviewed-draft', title: 'Draft', status: 'draft' }]
    },
    // getArticle(slug) -> article | null
    getArticle(slug) {
      calls.getArticle.push(slug)
      if (slug === 'reset-password') return { slug: 'reset-password', title: 'Reset your password', status: 'reviewed', body: 'Use the forgot password link.' }
      if (slug === 'unreviewed-draft') return { slug: 'unreviewed-draft', title: 'Draft', status: 'draft', body: 'Not reviewed.' }
      return null
    },
    // evaluateProactive({ contacts, now, existingMarkers, providerHealth }) -> findings[]
    evaluateProactive(input) {
      calls.evaluateProactive.push(input)
      return []
    },
    // decideInboundEmail({ raw, verdicts, lookups, now, providerMessageId }) -> { outcome, ... }
    decideInboundEmail(input) {
      calls.decideInboundEmail.push(input)
      return { outcome: 'rejected', reason: 'stub' }
    },
    ...overrides,
  }
  return { engines, calls }
}

// ---- app harness ------------------------------------------------------------------------------

// The fictional world both harnesses run on. `playerData: true` uses the
// context-engine world (support/fixtures.mjs): player-data snapshots,
// identity links, provider health and bound subscription rows, so the
// connections / rank diagnostics have history to read. `extendWorld(world)`
// may add rows (tests); it runs before the tables are built.
function harnessWorld({ now, playerData = false, extendWorld = null }) {
  const world = addSupportPlayers(playerData ? buildSupportWorld(now) : buildFixtureWorld(now), now)
  if (typeof extendWorld === 'function') extendWorld(world)
  return world
}

const TABLE_READS = /^(get|list|scan|subscriptionsByEmail|coachingSummary|playerEvents|referralsFor|playerSnapshots|playerIdentities|providerHealth)/

// Records every table call; the tables interface is read-only by contract.
function recordingTables(tables) {
  const calls = []
  const proxy = new Proxy(tables, {
    get(target, prop) {
      const value = target[prop]
      if (typeof value !== 'function') return value
      return (...args) => {
        calls.push({ method: String(prop), write: !TABLE_READS.test(String(prop)) })
        return value.apply(target, args)
      }
    },
  })
  return { proxy, calls }
}

// Service-level harness: the same ctx shape createApp builds (store, tables,
// config, catalog, factsFor), without HTTP.
export function supportServiceHarness({ engines = null, config = {}, seedCases = true, storeWrap = null, playerData = false, extendWorld = null } = {}) {
  const world = harnessWorld({ now: SUPPORT_NOW, playerData, extendWorld })
  const worldSnapshot = JSON.stringify(world)
  const support = buildSupportCaseWorld(SUPPORT_NOW)
  const { proxy: tables, calls: tableCalls } = recordingTables(createMemoryTables(world))
  let store = createMemoryStore([...storeSeedFromWorld(world), ...(seedCases ? support.items : [])])
  if (storeWrap) store = storeWrap(store)
  const clockRef = { now: SUPPORT_NOW }
  const cfg = defaultConfig({ features: { support: true }, ...config })
  const catalog = createPlanCatalog()
  const ctx = {
    tables,
    store,
    config: cfg,
    catalog,
    log: { warn() {}, error() {}, info() {} },
    now: () => clockRef.now,
    async factsFor(identity, { withCognito = false, signedIn = true } = {}) {
      const one = await assembleOne({ tables, store, email: identity.email, sub: identity.sub || null, signedIn, isAdmin: identity.isAdmin === true, withCognito })
      const facts = buildFacts({ now: clockRef.now, catalog, config: cfg, identity: { ...one.identity, signedIn }, sources: one.sources })
      return { facts, one, lifecycle: deriveLifecycle(facts) }
    },
  }
  const stub = engines ? { engines, calls: null } : stubEngines()
  const service = createSupportService({ ctx, now: () => clockRef.now, keyFor: contactKeyFor, engines: stub.engines })
  return { service, store, ctx, world, support, clockRef, tableCalls, engineCalls: stub.calls, tablesUnchanged: () => JSON.stringify(world) === worldSnapshot }
}

export function supportApp({ engines = null, config = {}, clock = null, seedCases = true, supportFlag = true, storeWrap = null, playerData = false, extendWorld = null } = {}) {
  const now = SUPPORT_NOW
  const world = harnessWorld({ now, playerData, extendWorld })
  const worldSnapshot = JSON.stringify(world)
  const support = buildSupportCaseWorld(now)
  const baseTables = createMemoryTables(world)
  const { proxy: tables, calls: tableCalls } = recordingTables(baseTables)
  let store = createMemoryStore([...storeSeedFromWorld(world), ...(seedCases ? support.items : [])])
  if (storeWrap) store = storeWrap(store)
  const stub = engines ? { engines, calls: null } : stubEngines()
  const tokens = new Map()
  for (const who of [...Object.keys(PLAYERS), ...Object.keys(STAFF)]) tokens.set(`tok-${who}`, identityOf(who))
  for (const [key, s] of Object.entries(world.scenarios)) tokens.set(`tok-scn-${key}`, { email: s.email, sub: s.sub, groups: [], isAdmin: false })
  const authenticate = async (req) => tokens.get(String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')) || null
  const clockRef = { now }
  const modules = [...routeModules.filter((m) => m !== supportRoutes), createSupportRoutes({ engines: stub.engines })]
  const handle = createApp({
    tables,
    store,
    authenticate,
    clock: clock || (() => clockRef.now),
    config: {
      features: { messaging: true, feedback: true, support: supportFlag },
      activityTrackingSince: '2026-09-01T00:00:00.000Z',
      directoryCacheMs: 0,
      ...config,
    },
    extraRoutes: modules,
    log: { warn() {}, error() {}, info() {} },
  })
  const call = (method, path, { who, body, origin = 'https://r6coaching.com' } = {}) => handle({
    rawPath: path.split('?')[0],
    queryStringParameters: path.includes('?') ? Object.fromEntries(new URLSearchParams(path.split('?')[1])) : undefined,
    requestContext: { http: { method }, requestId: 'req-support-test' },
    headers: { origin, ...(who ? { authorization: `Bearer tok-${who}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }).then((res) => ({ ...res, json: res.body ? JSON.parse(res.body) : null }))
  return {
    call,
    store,
    world,
    support,
    tableCalls,
    engineCalls: stub.calls,
    clockRef,
    tablesUnchanged: () => JSON.stringify(world) === worldSnapshot,
  }
}
