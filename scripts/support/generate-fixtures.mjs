#!/usr/bin/env node
// Player Success & Support: contract snapshots for the frontend.
//
// Runs the REAL customer-success backend in memory (createApp + the support
// routes + the real engine modules) over the fictional fixture world, drives
// a scripted scenario through HTTP exactly as the UI would, and writes every
// response the screens read to src/features/support/fixtures/generated/*.json.
// The dev-preview fixture transport serves these files, so the preview can
// only show shapes the backend actually returns.
//
//   node scripts/support/generate-fixtures.mjs          write the snapshots
//   node scripts/support/generate-fixtures.mjs --check  exit 1 if they drifted
//
// Nothing here touches AWS, Stripe, email or the network. Every person,
// address and id is fictional (example.test / example.org, FIXTURE ids).
// Draft Help Center articles are visible ONLY through `previewEngines`
// below (helpPreview), never through the production route.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createApp } from '../../lambda/customer-success/app.mjs'
import { createMemoryTables } from '../../lambda/customer-success/data/memoryTables.mjs'
import { createMemoryStore } from '../../lambda/customer-success/data/memoryStore.mjs'
import { storeSeedFromWorld } from '../../lambda/customer-success/fixtures/seed.mjs'
import { contactKeyFor } from '../../lambda/customer-success/lib/ids.mjs'
import { routeModules } from '../../lambda/customer-success/routes/index.mjs'
import { createSupportRoutes, supportRoutes } from '../../lambda/customer-success/routes/support.mjs'
import { createSupportService } from '../../lambda/customer-success/support/service.mjs'
import * as realEngines from '../../lambda/customer-success/support/engines.mjs'
import { caseTokenFor } from '../../lambda/customer-success/support/email.mjs'
import { buildSupportWorld } from '../../lambda/customer-success/support/fixtures.mjs'
import { PLAYERS, STAFF, SUPPORT_NOW, addSupportPlayers, identityOf } from '../../lambda/customer-success/support/fixtures/world.mjs'
import { UI_CONTRACT } from '../../src/features/support/contract.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const OUT_DIR = join(HERE, '..', '..', 'src', 'features', 'support', 'fixtures', 'generated')
export const FILES = Object.freeze(['meta', 'player', 'staff', 'help', 'errors'])
export const CONTRACT_DOC = join(HERE, '..', '..', 'docs', 'player-success', 'API-CONTRACT.md')
const DOC_BEGIN = '<!-- BEGIN GENERATED SHAPES (scripts/support/generate-fixtures.mjs) -->'
const DOC_END = '<!-- END GENERATED SHAPES -->'

const MIN = 60000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

// Fictional HMAC key for plus-address threading in this in-memory run only.
const TOKEN_KEY = ['fixture', 'preview', 'plus', 'address', 'key', '0123456789abcdef'].join('-')
const PASS = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }
const FAIL = { spf: 'FAIL', dkim: 'FAIL', dmarc: 'FAIL' }

// DEV-ONLY engines override: the one place drafts are allowed (helpPreview).
// The production engines module (engines.mjs) never sets helpPreview.
export const previewEngines = Object.freeze({
  ...realEngines,
  helpPreview: true,
  listArticles: (o = {}) => realEngines.listArticles({ ...o, includeDrafts: true }),
  searchHelp: (q, o = {}) => realEngines.searchHelp(q, { ...o, includeDrafts: true }),
  getArticle: (s, o = {}) => realEngines.getArticle(s, { ...o, includeDrafts: true }),
})

const quiet = { warn() {}, error() {}, info() {} }

// ---- in-memory backend ------------------------------------------------------------------

function buildWorld(now) {
  const world = addSupportPlayers(buildSupportWorld(now), now)
  // A paid coaching package with no credits row (coaching case + proactive rule).
  world.bookings.push({ slotId: new Date(now - 2 * DAY).toISOString(), status: 'confirmed', customer: { email: PLAYERS.b.email, name: 'Fixture' }, coachingType: 'package', payment: { status: 'paid' } })
  return world
}

export function createHarness({ engines = previewEngines, support = {}, featureSupport = true } = {}) {
  const clockRef = { now: SUPPORT_NOW }
  const world = buildWorld(SUPPORT_NOW)
  const tables = createMemoryTables(world)
  const store = createMemoryStore(storeSeedFromWorld(world))
  const tokens = new Map()
  for (const who of [...Object.keys(PLAYERS), ...Object.keys(STAFF)]) tokens.set(who, identityOf(who))
  for (const [key, s] of Object.entries(world.scenarios)) tokens.set(`scn-${key}`, { email: s.email, sub: s.sub, groups: [], isAdmin: false })
  let captured = null
  const captureCtx = ({ ctx }) => {
    captured = ctx
    return { routes: [] }
  }
  const handle = createApp({
    tables,
    store,
    authenticate: async (req) => tokens.get(String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')) || null,
    clock: () => clockRef.now,
    config: {
      features: { support: featureSupport },
      activityTrackingSince: '2026-09-01T00:00:00.000Z',
      directoryCacheMs: 0,
      support: { emailTokenSecret: TOKEN_KEY, ...support },
    },
    extraRoutes: [...routeModules.filter((m) => m !== supportRoutes), createSupportRoutes({ engines }), captureCtx],
    log: quiet,
  })
  // Same ctx and store as the HTTP routes: used only for inbound email,
  // which has no HTTP route (it arrives through the mail receipt path).
  const service = createSupportService({ ctx: captured, now: () => clockRef.now, keyFor: contactKeyFor, engines })

  async function call(method, path, { who = null, body, expect = null } = {}) {
    const [rawPath, query = ''] = path.split('?')
    const res = await handle({
      rawPath,
      queryStringParameters: query ? Object.fromEntries(new URLSearchParams(query)) : undefined,
      requestContext: { http: { method }, requestId: 'req-fixture' },
      headers: { origin: 'https://r6coaching.com', ...(who ? { authorization: `Bearer ${who}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = res.body ? JSON.parse(res.body) : null
    const ok = expect === null ? res.statusCode < 400 : res.statusCode === expect
    if (!ok) throw new Error(`fixture scenario: ${method} ${path} as ${who} -> ${res.statusCode} ${res.body}`)
    return json
  }

  const at = (msAgo) => {
    clockRef.now = SUPPORT_NOW - msAgo
  }
  return { call, service, store, world, clockRef, at }
}

function mail({ from, to = 'support@r6coaching.com', id, subject, body, extraHeaders = [] }) {
  return [
    `From: Fixture Sender <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: <${id}@mail.example.test>`,
    ...extraHeaders,
    'Date: Thu, 24 Sep 2026 14:00:00 +0000',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')
}

let rid = 0
const clientId = () => `fixture-req-${String((rid += 1)).padStart(6, '0')}`

// ---- the scenario ------------------------------------------------------------------------

const VEX = 'scn-paying_active' // the signed-in player in the dev preview
const ADMIN = 'admin' // the staff viewer in the dev preview (CRM is admin-gated)

export async function buildSnapshots() {
  rid = 0
  const h = createHarness()
  const { call, at } = h
  const mutations = {}
  const staffWrites = {}

  // Incidents (lead).
  at(8 * DAY)
  const incAuth = await call('POST', '/cs/admin/support/incidents', { who: 'lead', body: { title: 'Sign-in code emails arriving late', service: 'auth', severity: 'sev3', status: 'investigating' } })
  at(7 * DAY)
  await call('PATCH', `/cs/admin/support/incidents/${incAuth.incidentId}`, { who: 'lead', body: { status: 'resolved', workaround: 'Request a new code from the sign-in page and check spam.' } })
  at(5 * DAY)
  const incPsn = await call('POST', '/cs/admin/support/incidents', { who: 'lead', body: { title: 'PlayStation rank refresh failing', service: 'identity_psn', severity: 'sev2', status: 'investigating', owner: STAFF.lead.email } })
  at(4 * DAY)
  await call('PATCH', `/cs/admin/support/incidents/${incPsn.incidentId}`, { who: 'lead', body: { status: 'identified', internalNotes: 'Provider health shows PSN down with upstream 5xx. Snapshots for PSN players stopped refreshing.' } })
  staffWrites.incidentTimeline = await call('POST', `/cs/admin/support/incidents/${incPsn.incidentId}/timeline`, { who: 'lead', body: { kind: 'customer_update_draft', text: 'PlayStation rank updates are not coming through for some players right now. Your matches and progress are safe. If your rank looks old, you can confirm it from the Progress page.' } })
  at(21 * HOUR)
  const incVod = await call('POST', '/cs/admin/support/incidents', { who: 'lead', body: { title: 'VOD reviews not saved after upload', service: 'vod_processing', severity: 'sev2', status: 'investigating', workaround: 'Try again with PNG or JPG screenshots from one round.' } })
  at(20 * HOUR)
  await call('POST', `/cs/admin/support/incidents/${incVod.incidentId}/timeline`, { who: 'lead', body: { kind: 'note', text: 'Two reports: usage counter moved with no vod_reviewed event. No job records exist to confirm.' } })

  // ---- the preview player's own cases (VerticalVex fixture) ----------------------------
  // 1. closed + rated (how-to).
  at(19 * DAY)
  const closedCase = (await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'Moved from PC to PlayStation. Where do I change my platform so my stats follow?', category: 'ubisoft_connection', clientRequestId: clientId() } })).case.caseNumber
  at(18 * DAY)
  await call('POST', `/cs/admin/support/cases/${closedCase}/status`, { who: 'agent', body: { status: 'in_progress' } })
  await call('POST', `/cs/admin/support/cases/${closedCase}/messages`, { who: 'agent', body: { text: 'Open your Account page and change the platform and in-game name fields. New stats follow your next data sync.' } })
  await call('POST', `/cs/admin/support/cases/${closedCase}/resolve`, { who: 'agent', body: { summary: 'Explained where the platform and in-game name fields live.', code: 'answered', learning: { productArea: 'profile', docGap: false } } })
  at(17 * DAY)
  mutations.csat = await call('POST', `/cs/me/support/cases/${closedCase}/csat`, { who: VEX, body: { rating: 'up' } })
  at(12 * DAY)
  mutations.confirmResolved = await call('POST', `/cs/me/support/cases/${closedCase}/resolve-confirm`, { who: VEX })

  // 2. resolved, CSAT not asked yet.
  at(3 * DAY)
  const resolvedCase = (await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'Match Prep page was blank on my phone after the update.', category: 'bug', clientRequestId: clientId() } })).case.caseNumber
  at(2 * DAY)
  await call('POST', `/cs/admin/support/cases/${resolvedCase}/status`, { who: ADMIN, body: { status: 'in_progress' } })
  at(22 * HOUR)
  await call('POST', `/cs/admin/support/cases/${resolvedCase}/messages`, { who: ADMIN, body: { text: 'Thanks for the report. A page update was stuck in your browser cache. Reloading the page loads the current version.' } })
  await call('POST', `/cs/admin/support/cases/${resolvedCase}/resolve`, { who: ADMIN, body: { summary: 'Stale cached bundle on mobile Safari; reload fixed it.', code: 'fixed', rootCause: 'stale_cache', learning: { productArea: 'match_prep', bug: true } } })

  // 3. waiting on the player (rank question).
  at(26 * HOUR)
  const waitingCase = (await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'Road to Champion shows Silver I but in game I have been Gold I since Saturday.', category: 'rank_stat_discrepancy', clientRequestId: clientId() } })).case.caseNumber
  at(3 * HOUR)
  await call('POST', `/cs/admin/support/cases/${waitingCase}/status`, { who: ADMIN, body: { status: 'in_progress' } })
  await call('POST', `/cs/admin/support/cases/${waitingCase}/assign`, { who: ADMIN, body: { assignee: 'me' } })
  await call('POST', `/cs/admin/support/cases/${waitingCase}/messages`, { who: ADMIN, body: { text: 'Our newest Ubisoft snapshot for you says Gold I, so the Road to Champion card may be reading an older value. Which page shows Silver I: the Road to Champion card, or the Progress page?', thenStatus: 'waiting_on_player' } })

  // 4. VOD failure: escalated to VOD/AI, linked to the VOD incident, email reply.
  at(20 * HOUR)
  const vodCreated = await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'Uploaded 5 screenshots for a VOD review. It loaded for ages, went back to the upload screen, and my review count still went up.', category: 'vod_analysis', answers: { vod_when: 'last night around 22:00' }, clientRequestId: clientId() } })
  const vodCase = vodCreated.case.caseNumber
  at(19 * HOUR)
  await call('POST', `/cs/admin/support/cases/${vodCase}/status`, { who: 'agent', body: { status: 'triaged' } })
  staffWrites.note = await call('POST', `/cs/admin/support/cases/${vodCase}/notes`, { who: 'agent', body: { text: 'Usage counter shows 7 used, only 2 completed review records this period. No job ids exist to check.', clientRequestId: clientId() } })
  at(6 * HOUR)
  const vodDetail = await call('GET', `/cs/admin/support/cases/${vodCase}`, { who: ADMIN })
  staffWrites.linkIncident = await call('POST', `/cs/admin/support/cases/${vodCase}/link-incident`, { who: ADMIN, body: { incidentId: incVod.incidentId, version: vodDetail.case.version } })
  staffWrites.escalate = await call('POST', `/cs/admin/support/cases/${vodCase}/escalate`, { who: ADMIN, body: { team: 'vod_ai', reason: 'Counted uses without completed reviews; needs a log check around the upload time.' } })
  at(5 * HOUR)
  staffWrites.reply = await call('POST', `/cs/admin/support/cases/${vodCase}/messages`, { who: ADMIN, body: { text: 'We can see your review count moved but no finished review was saved. That points to our side, not yours. The VOD team is checking the logs for that upload, and we will update this case.', clientRequestId: clientId() } })
  at(4 * HOUR)
  const vodRef = await h.store.get('SUP#CASENO', vodCase)
  const vodToken = caseTokenFor(vodRef.caseId, TOKEN_KEY)
  const attached = await h.service.ingestInboundEmail({ raw: mail({ from: 'vertical.vex@example.test', to: `Recon 6 Support <support+${vodToken}@r6coaching.com>`, id: 'fixture-vex-reply-1', subject: `Re: ${vodCase}`, body: 'It was the Clubhouse round from about 22:00. Same thing happened once before last week.' }), verdicts: PASS })
  if (attached.status !== 'attached') throw new Error(`fixture scenario: email reply did not attach (${JSON.stringify(attached)})`)

  // 5. new, opened through triage (desktop client).
  at(25 * MIN)
  const triageDesktop = await call('POST', '/cs/me/support/triage', { who: VEX, body: { text: 'The desktop client does not list my capture card, OBS sees it fine.' } })
  at(20 * MIN)
  const newCase = await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'The desktop client does not list my capture card, OBS sees it fine.', category: triageDesktop.suggestedCategory, answers: { capture_mode: 'capture card' }, clientRequestId: clientId() } })

  // ---- other players (staff-side scenarios) -----------------------------------------------
  // Entitlement mismatch: renewal not recorded after the paid-through date.
  at(6 * HOUR)
  const entCase = (await call('POST', '/cs/me/support/cases', { who: 'scn-paying_renewal_stale', body: { text: 'Paid for Pro this month but everything still says upgrade and the strats are locked. Same email as always.', category: 'access_entitlement', clientRequestId: clientId() } })).case.caseNumber
  at(5 * HOUR)
  await call('POST', `/cs/admin/support/cases/${entCase}/status`, { who: 'billing', body: { status: 'in_progress' } })
  await call('POST', `/cs/admin/support/cases/${entCase}/notes`, { who: 'billing', body: { text: 'Row says active but paid through 3 days ago; no renewal recorded. Do not touch Stripe from here.' } })
  at(4 * HOUR)
  await call('POST', `/cs/admin/support/cases/${entCase}/messages`, { who: 'billing', body: { text: 'Thanks. We can see your Pro membership record and we are checking why the renewal did not show up. You do not need to pay again while we look.' } })
  at(3 * HOUR)
  staffWrites.actionRequest = await call('POST', `/cs/admin/support/cases/${entCase}/action-requests`, { who: 'billing', body: { kind: 'entitlement_repair', reason: 'Ledger shows the period ended 3 days ago with no renewal event; player reports a charge this month.' } })
  at(2 * HOUR)
  staffWrites.actionDecision = await call('POST', `/cs/admin/support/cases/${entCase}/action-requests/${staffWrites.actionRequest.requestId}/decision`, { who: 'lead', body: { decision: 'authorize', note: 'Verify the renewal in Stripe first.' } })
  staffWrites.assign = await call('POST', `/cs/admin/support/cases/${entCase}/assign`, { who: ADMIN, body: { assignee: 'me' } })

  // Rank discrepancy on PlayStation (provider down, linked to the PSN incident).
  at(30 * HOUR)
  const rankCase = (await call('POST', '/cs/me/support/cases', { who: 'scn-payment_failed', body: { text: 'Recon says Gold III but PlayStation shows Platinum since my placement games last week.', category: 'rank_stat_discrepancy', clientRequestId: clientId() } })).case.caseNumber
  at(6 * HOUR)
  const rankDetail = await call('GET', `/cs/admin/support/cases/${rankCase}`, { who: ADMIN })
  staffWrites.status = await call('POST', `/cs/admin/support/cases/${rankCase}/status`, { who: ADMIN, body: { status: 'triaged', version: rankDetail.case.version } })
  await call('POST', `/cs/admin/support/cases/${rankCase}/link-incident`, { who: ADMIN, body: { incidentId: incPsn.incidentId } })

  // Billing question (double charge).
  at(55 * MIN)
  const billingCase = (await call('POST', '/cs/me/support/cases', { who: 'd', body: { text: 'I think I was charged twice for Pro this month. Two identical charges on my card statement.', category: 'billing_question', subcategory: 'double_charge', clientRequestId: clientId() } })).case.caseNumber

  // Paid but locked (p1, at risk), and an overdue bug.
  at(50 * MIN)
  const atRiskCase = (await call('POST', '/cs/me/support/cases', { who: 'c', body: { text: 'Upgraded to Champion an hour ago but the full map pool is still locked.', category: 'access_entitlement', clientRequestId: clientId() } })).case.caseNumber
  at(30 * HOUR)
  const overdueCase = (await call('POST', '/cs/me/support/cases', { who: 'a', body: { text: 'The Road to Champion checklist will not save my ticks on my phone.', category: 'bug', clientRequestId: clientId() } })).case.caseNumber

  // Coaching package without credits: waiting on the booking provider, mine.
  at(26 * HOUR)
  const coachingCase = (await call('POST', '/cs/me/support/cases', { who: 'b', body: { text: 'Bought a coaching package two days ago but no credits are showing on my account.', category: 'coaching_credits', clientRequestId: clientId() } })).case.caseNumber
  at(8 * HOUR)
  await call('POST', `/cs/admin/support/cases/${coachingCase}/assign`, { who: ADMIN, body: { assignee: 'me' } })
  await call('POST', `/cs/admin/support/cases/${coachingCase}/status`, { who: ADMIN, body: { status: 'in_progress' } })
  await call('POST', `/cs/admin/support/cases/${coachingCase}/messages`, { who: ADMIN, body: { text: 'We can see the package booking and no credits on record yet. We are checking it with the booking system and will post here.', thenStatus: 'waiting_on_provider' } })

  // Inbound email that needs a person.
  at(50 * MIN)
  await h.service.ingestInboundEmail({ raw: mail({ from: 'vertical.vex@example.test', to: `support+${vodToken}@r6coaching.com`, id: 'fixture-unverified-1', subject: `Re: ${vodCase} still broken`, body: 'Still not working, can you check the account again?' }), verdicts: FAIL })
  at(3 * HOUR)
  await h.service.ingestInboundEmail({ raw: mail({ from: 'someone@example.org', id: 'fixture-stranger-1', subject: 'account help', body: 'I cannot sign in with my usual email and the reset code never shows up.' }), verdicts: PASS })
  at(24 * HOUR)
  await h.service.ingestInboundEmail({ raw: mail({ from: 'card.declined@example.test', to: `support+${vodToken}@r6coaching.com`, id: 'fixture-foreign-1', subject: 'screenshots', body: 'Here are the screens from the upload that failed.' }), verdicts: PASS })
  await h.service.ingestInboundEmail({ raw: mail({ from: 'vertical.vex@example.test', id: 'fixture-ooo-1', subject: 'Automatic reply', body: 'I am away until Monday.', extraHeaders: ['Auto-Submitted: auto-replied'] }), verdicts: PASS })

  // Proactive care: a dry run (lists what it would flag; creates nothing).
  at(1 * HOUR)
  const proactive = await call('POST', '/cs/admin/support/proactive/run?dryRun=1', { who: 'lead' })

  // ---- capture reads at "now" -----------------------------------------------------------------
  at(0)
  const playerCases = [newCase.case.caseNumber, waitingCase, vodCase, resolvedCase, closedCase]
  const player = {
    viewer: 'scn-paying_active',
    scenarioCases: { open: newCase.case.caseNumber, waitingOnMe: waitingCase, waitingOnRecon: vodCase, resolved: resolvedCase, closed: closedCase },
    triage: {
      samples: [
        { text: 'Paid for Pro yesterday but Match Prep still says upgrade and the strats are locked', response: await call('POST', '/cs/me/support/triage', { who: VEX, body: { text: 'Paid for Pro yesterday but Match Prep still says upgrade and the strats are locked' } }) },
        { text: 'VOD review spun forever and never finished', response: await call('POST', '/cs/me/support/triage', { who: VEX, body: { text: 'VOD review spun forever and never finished' } }) },
        { text: 'Rank on Road to Champion looks wrong', response: await call('POST', '/cs/me/support/triage', { who: VEX, body: { text: 'Rank on Road to Champion looks wrong' } }) },
        { text: 'The desktop client does not list my capture card, OBS sees it fine.', response: triageDesktop },
        { text: 'How do I change the email I sign in with?', response: await call('POST', '/cs/me/support/triage', { who: VEX, body: { text: 'How do I change the email I sign in with?' } }) },
      ],
    },
    created: {
      desktop_client: newCase,
      vod_analysis: vodCreated,
    },
    list: await call('GET', '/cs/me/support/cases', { who: VEX }),
    cases: {},
    mutations,
  }
  for (const cn of playerCases) player.cases[cn] = await call('GET', `/cs/me/support/cases/${cn}`, { who: VEX })

  const staff = { viewer: ADMIN, queue: {}, cases: {}, writes: staffWrites, incidents: { list: null, detail: {} } }
  const views = ['unassigned', 'mine', 'critical', 'billing', 'identity', 'vod', 'coaching', 'bugs', 'waiting', 'at_risk', 'incidents', 'all_open']
  for (const view of views) staff.queue[view] = await call('GET', `/cs/admin/support/queue?view=${view}`, { who: ADMIN })
  const staffCaseNumbers = new Set([...Object.values(staff.queue).flatMap((q) => q.cases.map((c) => c.caseNumber)), ...playerCases])
  for (const cn of [...staffCaseNumbers].sort()) staff.cases[cn] = await call('GET', `/cs/admin/support/cases/${cn}`, { who: ADMIN })
  staff.scenarioCases = { vodFailure: vodCase, entitlementMismatch: entCase, rankDiscrepancy: rankCase, billing: billingCase, atRisk: atRiskCase, overdue: overdueCase, coaching: coachingCase, waitingOnPlayer: waitingCase }
  // The same billing case as an agent: Stripe references are masked.
  staff.billingCaseAsAgent = await call('GET', `/cs/admin/support/cases/${billingCase}`, { who: 'agent' })
  staff.incidents.list = await call('GET', '/cs/admin/support/incidents', { who: ADMIN })
  for (const inc of staff.incidents.list.incidents) staff.incidents.detail[inc.incidentId] = await call('GET', `/cs/admin/support/incidents/${inc.incidentId}`, { who: ADMIN })
  staff.metrics = {
    data: await call('GET', '/cs/admin/support/metrics', { who: ADMIN }),
    empty: await call('GET', '/cs/admin/support/metrics', { who: 'lead' }).then(async () => {
      const blank = createHarness()
      return blank.call('GET', '/cs/admin/support/metrics', { who: ADMIN })
    }),
  }
  staff.unmatched = await call('GET', '/cs/admin/support/email/unmatched', { who: ADMIN })
  staff.kbProposals = await call('GET', '/cs/admin/support/kb/proposals', { who: ADMIN })
  staff.proactiveDryRun = proactive
  staff.autoCloseDryRun = await call('POST', '/cs/admin/support/maintenance/auto-close', { who: 'lead' })

  const help = { list: await call('GET', '/cs/help/articles'), search: {}, articles: {}, production: {} }
  for (const q of ['rank wrong', 'vod review stuck', 'charged twice', 'capture card']) help.search[q] = await call('GET', `/cs/help/articles?q=${encodeURIComponent(q)}`)
  for (const a of help.list.articles) help.articles[a.slug] = await call('GET', `/cs/help/articles/${a.slug}`)
  const prod = createHarness({ engines: realEngines })
  help.production.list = await prod.call('GET', '/cs/help/articles')
  help.production.article = await prod.call('GET', `/cs/help/articles/${help.list.articles[0].slug}`)
  help.production.articleNotFound = await prod.call('GET', '/cs/help/articles/does-not-exist', { expect: 404 })

  // ---- example mutations after the reads (their effects are not in the reads) -----------
  mutations.message = await call('POST', `/cs/me/support/cases/${waitingCase}/messages`, { who: VEX, body: { text: 'It is the Road to Champion card on my home page.', clientRequestId: clientId() } })
  mutations.messageOnClosed = await call('POST', `/cs/me/support/cases/${closedCase}/messages`, { who: VEX, body: { text: 'Stats stopped following after another platform switch.', clientRequestId: clientId() } })
  mutations.attachment = await call('POST', `/cs/me/support/cases/${vodCase}/attachments`, { who: VEX, body: { name: 'upload-error.png', mime: 'image/png', size: 204800 } })
  mutations.reopen = await call('POST', `/cs/me/support/cases/${resolvedCase}/reopen`, { who: VEX, body: { text: 'The page is blank again today.' } })
  staffWrites.resolve = await call('POST', `/cs/admin/support/cases/${overdueCase}/resolve`, { who: ADMIN, body: { summary: 'Explained that ticks save once the page finishes loading.', code: 'answered', learning: { docGap: true } } })
  staffWrites.unmatchedAssign = await call('POST', `/cs/admin/support/email/unmatched/${staff.unmatched.items.find((i) => i.suggestedCaseNumber).id}/assign`, { who: ADMIN, body: { caseNumber: vodCase } })

  const errors = {
    versionConflict: await (async () => {
      const cur = await call('GET', `/cs/admin/support/cases/${billingCase}`, { who: ADMIN })
      await call('POST', `/cs/admin/support/cases/${billingCase}/assign`, { who: ADMIN, body: { assignee: 'me', version: cur.case.version } })
      return call('POST', `/cs/admin/support/cases/${billingCase}/status`, { who: ADMIN, body: { status: 'triaged', version: cur.case.version }, expect: 409 })
    })(),
    otherPlayersCase: await call('GET', `/cs/me/support/cases/${billingCase}`, { who: VEX, expect: 404 }),
    staffRoleRequired: await call('GET', '/cs/admin/support/queue', { who: VEX, expect: 403 }),
    leadRoleRequired: await call('GET', '/cs/admin/support/metrics', { who: 'agent', expect: 403 }),
    signedOut: await call('GET', '/cs/me/support/cases', { expect: 401 }),
    validation: await call('POST', '/cs/me/support/cases', { who: VEX, body: { text: 'hi', clientRequestId: clientId() }, expect: 400 }),
    notEnabled: await createHarness({ featureSupport: false }).call('GET', '/cs/me/support/cases', { who: VEX, expect: 404 }),
  }

  const meta = {
    generatedAt: new Date(SUPPORT_NOW).toISOString(),
    source: 'scripts/support/generate-fixtures.mjs',
    backend: 'lambda/customer-success createApp + routes/support.mjs + support/engines.mjs (real modules), in memory',
    helpPreview: 'Draft articles are served only through the dev-only previewEngines override (helpPreview: true).',
    playerViewer: 'vertical.vex@example.test (fictional PR #24 scenario paying_active)',
    staffViewer: STAFF.admin.email,
    note: 'Fictional data only. Regenerate with: node scripts/support/generate-fixtures.mjs',
  }
  return normalizeIds({ meta, player, staff, help, errors })
}

// ---- deterministic ids -------------------------------------------------------------------
// Case ids, event ids and other random ids differ per run. Replace each
// distinct one (globally, so references stay consistent) with a stable
// sequential id in order of first appearance.
export function normalizeIds(bundle) {
  const text = JSON.stringify(bundle)
  const maps = new Map()
  const next = (kind, width, radix) => {
    const m = maps.get(kind) || new Map()
    maps.set(kind, m)
    return (token) => {
      if (!m.has(token)) m.set(token, (m.size + 1).toString(radix).padStart(width, '0'))
      return m.get(token)
    }
  }
  const uuid = next('uuid', 12, 10)
  const suffix = next('suffix', 14, 36)
  const hex16 = next('hex16', 16, 16)
  const out = text
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/g, (t) => `00000000-0000-4000-8000-${uuid(t)}`)
    .replace(/\b(ev|iev|au)_([0-9a-z]{6}[0-9a-f]{8})\b/g, (_, p, t) => `${p}_${suffix(t)}`)
    .replace(/\b(ar|inc|um|kbp|att)_([0-9a-f]{16})\b/g, (_, p, t) => `${p}_${hex16(`${p}:${t}`)}`)
  return JSON.parse(out)
}

// ---- response shapes for docs/player-success/API-CONTRACT.md --------------------------
// Merges every sampled response of an endpoint into one TypeScript-like
// shape: `?` = absent in some samples, `a | b` = seen with both types.
function shapeOf(value) {
  if (value === null) return { kind: 'prim', types: new Set(['null']) }
  if (Array.isArray(value)) return { kind: 'arr', of: value.reduce((acc, v) => mergeShape(acc, shapeOf(v)), null), empty: value.length === 0 }
  if (typeof value === 'object') {
    const fields = new Map()
    for (const [k, v] of Object.entries(value)) fields.set(k, { shape: shapeOf(v), seen: 1 })
    return { kind: 'obj', fields, count: 1 }
  }
  return { kind: 'prim', types: new Set([typeof value]) }
}

function mergeShape(a, b) {
  if (!a) return b
  if (!b) return a
  if (a.kind === 'obj' && b.kind === 'obj') {
    const fields = new Map()
    for (const k of new Set([...a.fields.keys(), ...b.fields.keys()])) {
      const x = a.fields.get(k)
      const y = b.fields.get(k)
      fields.set(k, { shape: mergeShape(x?.shape, y?.shape), seen: (x?.seen || 0) + (y?.seen || 0) })
    }
    return { kind: 'obj', fields, count: a.count + b.count }
  }
  if (a.kind === 'arr' && b.kind === 'arr') return { kind: 'arr', of: mergeShape(a.of, b.of), empty: a.empty && b.empty }
  if (a.kind === 'prim' && b.kind === 'prim') return { kind: 'prim', types: new Set([...a.types, ...b.types]) }
  // Mixed kinds (e.g. object | null): keep the structured one, note null.
  const structured = a.kind === 'prim' ? b : a
  const prim = a.kind === 'prim' ? a : b
  return { ...structured, alsoNull: [...prim.types].includes('null') || structured.alsoNull }
}

const KEY = /^[A-Za-z_$][\w$]*$/
function renderShape(shape, indent = '', depth = 0) {
  if (!shape) return 'unknown'
  const nullable = shape.alsoNull ? ' | null' : ''
  if (shape.kind === 'prim') return [...shape.types].sort().join(' | ')
  if (shape.kind === 'arr') return shape.of ? `Array<${renderShape(shape.of, indent, depth)}>${nullable}` : `[]${nullable}`
  if (depth >= 7) return `object${nullable}`
  const pad = `${indent}  `
  const lines = [...shape.fields.entries()].map(([k, f]) => `${pad}${KEY.test(k) ? k : JSON.stringify(k)}${f.seen < shape.count ? '?' : ''}: ${renderShape(f.shape, pad, depth + 1)}`)
  return lines.length ? `{\n${lines.join('\n')}\n${indent}}${nullable}` : `{}${nullable}`
}

export function renderContractShapes(bundle) {
  const out = [DOC_BEGIN, '', '_Generated from the snapshots of the real backend. Do not edit by hand; run `node scripts/support/generate-fixtures.mjs`._', '']
  for (const spec of UI_CONTRACT) {
    const samples = spec.select(bundle)
    const shape = samples.reduce((acc, v) => mergeShape(acc, shapeOf(v)), null)
    out.push(`### ${spec.name}`, '', `${samples.length} sampled response${samples.length === 1 ? '' : 's'}.`, '', '```ts', renderShape(shape), '```', '')
  }
  out.push(DOC_END)
  return out.join('\n')
}

// Replaces the generated block in API-CONTRACT.md (the prose around it is
// written by hand). Returns the new document text.
export function contractDocWith(bundle, current) {
  const block = renderContractShapes(bundle)
  const text = String(current || '').replace(/\r\n/g, '\n')
  const start = text.indexOf(DOC_BEGIN)
  const end = text.indexOf(DOC_END)
  if (start === -1 || end === -1) return `${text.trimEnd()}\n\n${block}\n`
  return `${text.slice(0, start)}${block}${text.slice(end + DOC_END.length)}`
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function main() {
  const check = process.argv.includes('--check')
  const snapshots = await buildSnapshots()
  let drift = 0
  if (!check) mkdirSync(OUT_DIR, { recursive: true })
  for (const name of FILES) {
    const file = join(OUT_DIR, `${name}.json`)
    const body = serialize(snapshots[name])
    if (check) {
      const current = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null
      if (current !== body) {
        drift += 1
        console.error(`drift: ${file}`)
      }
    } else {
      writeFileSync(file, body)
      console.log(`wrote ${file} (${Buffer.byteLength(body)} bytes)`)
    }
  }
  const doc = existsSync(CONTRACT_DOC) ? readFileSync(CONTRACT_DOC, 'utf8').replace(/\r\n/g, '\n') : ''
  const nextDoc = contractDocWith(snapshots, doc)
  if (check) {
    if (nextDoc !== doc) {
      drift += 1
      console.error(`drift: ${CONTRACT_DOC}`)
    }
  } else {
    writeFileSync(CONTRACT_DOC, nextDoc)
    console.log(`wrote ${CONTRACT_DOC} (generated shapes block)`)
  }
  if (check && drift) {
    console.error(`${drift} snapshot file(s) differ from the backend. Run: node scripts/support/generate-fixtures.mjs`)
    process.exit(1)
  }
  if (check) console.log('support fixture snapshots match the backend')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
