// DEV PREVIEW ONLY: an in-memory transport that answers the support API with
// responses the REAL backend produced. scripts/support/generate-fixtures.mjs
// runs lambda/customer-success (createApp + routes/support.mjs + the real
// engine modules) in memory over fictional data and writes ./generated/*.json;
// this file serves those snapshots, so the preview can only show shapes the
// backend returns (docs/player-success/API-CONTRACT.md).
//
// Interactive in-tab mutations (reply, CSAT, status, assign…) change only this
// in-memory copy, in the backend's own shapes. Nothing leaves the tab.
// Timestamps are shifted so "3h ago" in the snapshot reads "3h ago" now.
//
// Scenarios: default · empty · loading (never resolves) · error (503) ·
// not_enabled (404 with the flag off).
import meta from './generated/meta.json'
import playerSnap from './generated/player.json'
import staffSnap from './generated/staff.json'
import helpSnap from './generated/help.json'
import errorsSnap from './generated/errors.json'
import { BUCKETS, bucketForStatus, staffTransitions } from '../supportLogic.mjs'
import { queryTerms, rankArticles } from '../helpText.mjs'

const ISO_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/g
const DATE_RE = /"(\d{4}-\d{2}-\d{2})"/g
const DAY = 86400000

// Shift every timestamp by `delta` ms (date-only values by whole days).
function rebase(value, delta) {
  const days = Math.round(delta / DAY)
  const text = JSON.stringify(value)
    .replace(ISO_RE, (m) => new Date(Date.parse(m) + delta).toISOString())
    .replace(DATE_RE, (m, d) => `"${new Date(Date.parse(`${d}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)}"`)
  return JSON.parse(text)
}

const clone = (v) => JSON.parse(JSON.stringify(v))

// Errors look exactly like the live transport's: status, code, detail = body.
function fail(status, body) {
  const err = new Error(body?.error || `Request failed (${status})`)
  err.status = status
  err.code = body?.code || null
  err.detail = body
  return err
}

const SUMMARY_KEYS = ['caseNumber', 'subject', 'category', 'status', 'bucket', 'bucketLabel', 'waitingOn', 'csat', 'createdAt', 'updatedAt']
const bucketLabel = (id) => BUCKETS.find((b) => b.id === id)?.label || 'Open'
const subjectFrom = (text) => {
  const first = String(text || '').split(/\r?\n/).find((l) => l.trim()) || ''
  return first.length > 120 ? `${first.slice(0, 119)}…` : first.trim()
}

function sampleFor(samples, text) {
  const exact = samples.find((s) => s.text.trim().toLowerCase() === String(text || '').trim().toLowerCase())
  if (exact) return exact.response
  const words = new Set(queryTerms(text))
  let best = samples[0]
  let bestScore = -1
  for (const s of samples) {
    const score = queryTerms(s.text).filter((w) => words.has(w)).length
    if (score > bestScore) { best = s; bestScore = score }
  }
  return best.response
}

export function createFixtureTransport({ scenario = 'default', latency = 180, now = Date.now() } = {}) {
  const delta = now - Date.parse(meta.generatedAt)
  const empty = scenario === 'empty'
  const P = rebase(playerSnap, delta)
  const S = rebase(staffSnap, delta)
  const H = rebase(helpSnap, delta)
  const me = S.cases[Object.keys(S.cases)[0]]?.me || 'staff@example.test'

  const playerCases = new Map(empty ? [] : Object.entries(P.cases))
  const staffCases = new Map(empty ? [] : Object.entries(S.cases))
  const incidents = empty ? [] : S.incidents.list.incidents
  const incidentDetail = new Map(empty ? [] : Object.entries(S.incidents.detail))
  const unmatched = empty ? [] : S.unmatched.items
  const idempotency = new Map()
  let seq = 0
  const nextId = (prefix) => `${prefix}_preview${String((seq += 1)).padStart(6, '0')}`
  const at = () => new Date().toISOString()
  let counter = Math.max(0, ...[...playerCases.keys(), ...staffCases.keys()].map((n) => Number(n.slice(3)) || 0))
  const nextCaseNumber = () => `R6-${String((counter += 1)).padStart(6, '0')}`

  // ---- player helpers ----------------------------------------------------------------
  const summaryOf = (c) => Object.fromEntries(SUMMARY_KEYS.map((k) => [k, c[k] ?? null]))
  const setPlayerStatus = (c, status) => {
    c.status = status
    c.bucket = bucketForStatus(status)
    c.bucketLabel = bucketLabel(c.bucket)
    c.waitingOn = status === 'waiting_on_player' ? 'you' : ['resolved', 'closed'].includes(status) ? null : 'recon'
    c.actions = { canMessage: true, canConfirmResolved: status === 'resolved', canReopen: status === 'resolved', canRate: ['resolved', 'closed'].includes(status) && Boolean(c.resolution) && !c.csat }
    c.updatedAt = at()
  }
  const playerEvent = (c, e) => {
    // Same shape as the API: every player event is marked public.
    const ev = { id: nextId('ev'), visibility: 'public', at: at(), author: 'you', body: null, ...e }
    c.timeline.push(ev)
    c.updatedAt = ev.at
    return ev
  }
  const findPlayerCase = (n) => {
    const c = playerCases.get(n)
    if (!c) throw fail(404, { error: 'case not found' })
    return c
  }
  function newPlayerCase(text, category, linkedFrom = null) {
    const template = P.created.desktop_client.case
    const c = {
      ...clone(template),
      caseNumber: nextCaseNumber(),
      subject: subjectFrom(text),
      description: text,
      category: category || 'other',
      subcategory: null,
      source: 'portal',
      csat: null,
      resolution: null,
      resolvedAt: null,
      closedAt: null,
      reopenCount: 0,
      linkedFromCaseNumber: linkedFrom,
      linkedCaseNumbers: [],
      attachments: [],
      createdAt: at(),
      timeline: [],
    }
    setPlayerStatus(c, 'new')
    playerEvent(c, { kind: 'message_player', body: text })
    playerCases.set(c.caseNumber, c)
    return c
  }

  // ---- staff helpers -----------------------------------------------------------------
  const staffCase = (n) => {
    const d = staffCases.get(n)
    if (!d) throw fail(404, { error: 'case not found' })
    return d
  }
  const staffEvent = (d, kind, fields = {}) => {
    const ev = { eventId: nextId('ev'), caseNumber: d.case.caseNumber, kind, visibility: 'staff', actor: { kind: 'staff', id: me }, body: null, data: null, at: at(), visibleToPlayer: false, ...fields }
    d.timeline.push(ev)
    return ev
  }
  const audit = (d, action, detail) => d.audit.push({ id: nextId('au'), at: at(), actor: me, action, detail: { caseNumber: d.case.caseNumber, ...detail } })
  const touch = (d) => {
    d.case.version = (d.case.version || 0) + 1
    d.case.updatedAt = at()
  }
  const setStaffStatus = (d, to) => {
    const from = d.case.status
    d.case.status = to
    d.case.waitingOn = to === 'waiting_on_player' ? 'player' : to === 'waiting_on_provider' ? 'provider' : ['resolved', 'closed'].includes(to) ? null : 'recon'
    d.case.allowedTransitions = staffTransitions(to)
    staffEvent(d, 'status_change', { visibility: 'public', visibleToPlayer: true, data: { from, to } })
    audit(d, 'support.case.status', { from, to })
  }
  const checkVersion = (d, body) => {
    if (body?.version !== undefined && body.version !== d.case.version) throw fail(409, errorsSnap.versionConflict)
  }

  function route(method, url, body = {}) {
    const p = url.pathname
    let m

    // ---- Player ------------------------------------------------------------------------
    if (method === 'POST' && p === '/cs/me/support/triage') {
      if (String(body.text || '').trim().length < 3) throw fail(400, { error: 'text is required' })
      return clone(sampleFor(P.triage.samples, body.text))
    }
    if (method === 'POST' && p === '/cs/me/support/cases') {
      if (body.clientRequestId && idempotency.has(body.clientRequestId)) return { replayed: true, case: clone(idempotency.get(body.clientRequestId)) }
      const text = String(body.text || '').trim()
      if (text.length < 3) throw fail(400, errorsSnap.validation)
      const c = newPlayerCase(text, body.category)
      if (body.clientRequestId) idempotency.set(body.clientRequestId, c)
      return { replayed: false, case: clone(c) }
    }
    if (method === 'GET' && p === '/cs/me/support/cases') {
      const buckets = Object.fromEntries(BUCKETS.map((b) => [b.id, []]))
      const list = [...playerCases.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      for (const c of list) buckets[bucketForStatus(c.status)].push(summaryOf(c))
      return { buckets, labels: Object.fromEntries(BUCKETS.map((b) => [b.id, b.label])), total: list.length }
    }
    if ((m = p.match(/^\/cs\/me\/support\/cases\/([^/]+)$/)) && method === 'GET') {
      return findPlayerCase(decodeURIComponent(m[1]))
    }
    if ((m = p.match(/^\/cs\/me\/support\/cases\/([^/]+)\/(messages|attachments|resolve-confirm|reopen|csat)$/)) && method === 'POST') {
      const c = findPlayerCase(decodeURIComponent(m[1]))
      const action = m[2]
      if (action === 'attachments') return clone(P.mutations.attachment)
      if (action === 'messages') {
        const text = String(body.text || '').trim()
        if (!text) throw fail(400, { error: 'text is required' })
        if (c.status === 'closed') {
          const linked = newPlayerCase(text, c.category, c.caseNumber)
          c.linkedCaseNumbers = [...(c.linkedCaseNumbers || []), linked.caseNumber]
          playerEvent(c, { kind: 'system', author: 'Recon 6', body: `A new case ${linked.caseNumber} was opened from a reply to this closed case.` })
          return { replayed: false, caseNumber: c.caseNumber, linkedCaseNumber: linked.caseNumber, status: c.status, linkedCase: clone(linked) }
        }
        const ev = playerEvent(c, { kind: 'message_player', body: text })
        const to = c.status === 'waiting_on_player' ? 'in_progress' : c.status === 'resolved' ? 'reopened' : null
        if (to) {
          setPlayerStatus(c, to)
          playerEvent(c, { kind: 'status_change', author: 'Recon 6', status: to })
        }
        return { replayed: false, caseNumber: c.caseNumber, eventId: ev.id, status: c.status, linkedCaseNumber: null }
      }
      if (action === 'resolve-confirm') {
        if (c.status !== 'resolved') throw fail(409, { error: `a player cannot move a case from ${c.status} to closed`, code: 'transition_refused' })
        setPlayerStatus(c, 'closed')
        c.closedAt = at()
        playerEvent(c, { kind: 'status_change', status: 'closed' })
        return clone(c)
      }
      if (action === 'reopen') {
        if (c.status === 'closed') {
          if (!String(body.text || '').trim()) throw fail(400, { error: 'this case is closed; tell us what is still wrong and we will open a new linked case', code: 'closed_needs_text' })
          const linked = newPlayerCase(String(body.text).trim(), c.category, c.caseNumber)
          return { reopened: false, linkedCaseNumber: linked.caseNumber, case: clone(linked) }
        }
        if (c.status !== 'resolved') throw fail(409, { error: `a player cannot move a case from ${c.status} to reopened`, code: 'transition_refused' })
        setPlayerStatus(c, 'reopened')
        c.reopenCount = (c.reopenCount || 0) + 1
        playerEvent(c, { kind: 'status_change', status: 'reopened' })
        if (body.text) playerEvent(c, { kind: 'message_player', body: String(body.text) })
        return { reopened: true, linkedCaseNumber: null, case: clone(c) }
      }
      if (action === 'csat') {
        if (!['resolved', 'closed'].includes(c.status) || !c.resolution) throw fail(409, { error: 'you can rate a case once it is resolved', code: 'not_resolved' })
        if (c.csat) throw fail(409, { error: 'you already rated this case', code: 'already_rated' })
        c.csat = { rating: body.rating, at: at() }
        c.actions = { ...c.actions, canRate: false }
        playerEvent(c, { kind: 'csat', rating: body.rating, body: body.comment || null })
        return { ok: true, rating: body.rating }
      }
    }

    // ---- Help Center (public) -------------------------------------------------------------
    if (method === 'GET' && p === '/cs/help/articles') {
      // The empty state (a deployment with nothing reviewed yet) stays previewable.
      if (empty) return { ...clone(H.production.list), articles: [] }
      const q = String(url.searchParams.get('q') || '').trim()
      if (!q) return clone(H.list)
      const known = Object.entries(H.search).find(([k]) => k.toLowerCase() === q.toLowerCase())
      if (known) return clone(known[1])
      const ranked = rankArticles(Object.values(H.articles), q).slice(0, 10)
      return { q, articles: ranked.map(({ slug, title, summary, category, status }) => ({ slug, title, summary, category, status })), status: 'ok', preview: true }
    }
    if ((m = p.match(/^\/cs\/help\/articles\/([^/]+)$/)) && method === 'GET') {
      const a = empty ? null : H.articles[decodeURIComponent(m[1])]
      if (!a) throw fail(404, { error: 'article not found' })
      return clone(a)
    }

    // ---- Staff ----------------------------------------------------------------------------------
    if (method === 'GET' && p === '/cs/admin/support/queue') {
      const view = url.searchParams.get('view') || 'unassigned'
      const snap = S.queue[view] || S.queue.unassigned
      if (empty) return { ...clone(snap), cases: [], counts: Object.fromEntries(Object.keys(snap.counts).map((k) => [k, 0])) }
      const cases = snap.cases.map((row) => {
        const live = staffCases.get(row.caseNumber)?.case
        return live ? { ...row, status: live.status, assignee: live.assignee, team: live.team, waitingOn: live.waitingOn, incidentId: live.refs?.incidentId || null, updatedAt: live.updatedAt } : row
      })
      return { ...clone(snap), cases }
    }
    if ((m = p.match(/^\/cs\/admin\/support\/cases\/([^/]+)$/)) && method === 'GET') {
      return clone(staffCase(decodeURIComponent(m[1])))
    }
    if ((m = p.match(/^\/cs\/admin\/support\/cases\/([^/]+)\/([a-z-]+)$/)) && method === 'POST') {
      const d = staffCase(decodeURIComponent(m[1]))
      const action = m[2]
      checkVersion(d, body)
      if (action === 'messages') {
        const ev = staffEvent(d, 'message_staff', { visibility: 'public', visibleToPlayer: true, body: String(body.text || ''), data: { delivery: 'case_timeline_only' } })
        if (body.thenStatus && body.thenStatus !== d.case.status) setStaffStatus(d, body.thenStatus)
        touch(d)
        audit(d, 'support.case.reply', { eventId: ev.eventId })
        return { ok: true, eventId: ev.eventId, status: d.case.status, delivery: 'case_timeline_only' }
      }
      if (action === 'notes') {
        const ev = staffEvent(d, 'note_private', { body: String(body.text || '') })
        audit(d, 'support.case.note', { eventId: ev.eventId })
        return { ok: true, eventId: ev.eventId }
      }
      if (action === 'status') {
        if (!staffTransitions(d.case.status).includes(body.status)) throw fail(409, { error: `a staff cannot move a case from ${d.case.status} to ${body.status}`, code: 'transition_refused' })
        setStaffStatus(d, body.status)
        touch(d)
        return clone(d.case)
      }
      if (action === 'assign') {
        const assignee = body.assignee === 'me' ? me : body.assignee ?? d.case.assignee
        staffEvent(d, 'assignment', { data: { fromAssignee: d.case.assignee, toAssignee: assignee } })
        d.case.assignee = assignee
        touch(d)
        audit(d, 'support.case.assign', { assignee })
        return clone(d.case)
      }
      if (action === 'escalate') {
        const handoff = { team: body.team, reason: body.reason, by: me, at: at(), caseNumber: d.case.caseNumber, text: `${d.case.caseNumber} escalated to ${body.team}: ${body.reason}\n(Dev preview: the server builds the full hand-off from the case record.)` }
        if (d.case.status !== 'escalated') setStaffStatus(d, 'escalated')
        d.case.team = body.team
        d.case.escalation = { team: body.team, at: handoff.at, by: me, reason: body.reason, handoff }
        staffEvent(d, 'escalation', { body: handoff.text, data: { team: body.team } })
        touch(d)
        audit(d, 'support.case.escalate', { team: body.team })
        return { case: clone(d.case), handoff }
      }
      if (action === 'link-incident') {
        const inc = incidents.find((i) => i.incidentId === body.incidentId)
        if (!inc) throw fail(404, { error: 'incident not found' })
        d.case.refs = { ...(d.case.refs || {}), incidentId: inc.incidentId }
        d.incident = clone(inc)
        staffEvent(d, 'incident_link', { data: { incidentId: inc.incidentId } })
        touch(d)
        audit(d, 'support.case.link_incident', { incidentId: inc.incidentId })
        return clone(d.case)
      }
      if (action === 'resolve') {
        if (!String(body.summary || '').trim()) throw fail(400, { error: 'summary is required' })
        const from = d.case.status
        d.case.status = 'resolved'
        d.case.waitingOn = null
        d.case.allowedTransitions = staffTransitions('resolved')
        d.case.resolution = { summary: body.summary, code: body.code, at: at(), by: me }
        d.case.learning = body.learning || null
        staffEvent(d, 'status_change', { visibility: 'public', visibleToPlayer: true, body: body.summary, data: { from, to: 'resolved' } })
        touch(d)
        audit(d, 'support.case.resolve', { code: body.code })
        return { case: clone(d.case), kbProposal: null }
      }
      if (action === 'action-requests') {
        const template = S.writes.actionRequest
        const r = { requestId: nextId('ar'), caseNumber: d.case.caseNumber, kind: body.kind, reason: body.reason, requiredVerification: body.kind === template.kind ? template.requiredVerification : 'A lead authorizes it; a person does it in the authoritative system.', status: 'requested', history: [{ at: at(), status: 'requested', by: me }], executesInSupport: false, createdAt: at() }
        d.actionRequests.push(r)
        audit(d, 'support.action_request.create', { requestId: r.requestId, kind: r.kind })
        return clone(r)
      }
      throw fail(404, { error: 'not found' })
    }
    if (method === 'GET' && p === '/cs/admin/support/incidents') return { incidents: clone(incidents) }
    if ((m = p.match(/^\/cs\/admin\/support\/incidents\/([^/]+)$/)) && method === 'GET') {
      const d = incidentDetail.get(decodeURIComponent(m[1]))
      if (!d) throw fail(404, { error: 'incident not found' })
      return clone(d)
    }
    if ((m = p.match(/^\/cs\/admin\/support\/incidents\/([^/]+)\/timeline$/)) && method === 'POST') {
      const d = incidentDetail.get(decodeURIComponent(m[1]))
      if (!d) throw fail(404, { error: 'incident not found' })
      const ev = { eventId: nextId('iev'), incidentId: d.incident.incidentId, kind: body.kind || 'note', body: String(body.text || ''), data: null, by: me, at: at() }
      d.timeline.push(ev)
      d.incident.updatedAt = ev.at
      return clone(ev)
    }
    if (method === 'GET' && p === '/cs/admin/support/metrics') return clone(empty ? S.metrics.empty : S.metrics.data)
    if (method === 'GET' && p === '/cs/admin/support/email/unmatched') return { items: clone(unmatched.filter((i) => i.status === 'open')) }
    if ((m = p.match(/^\/cs\/admin\/support\/email\/unmatched\/([^/]+)\/assign$/)) && method === 'POST') {
      const item = unmatched.find((u) => u.id === decodeURIComponent(m[1]))
      if (!item) throw fail(404, { error: 'unmatched email not found' })
      if (item.status !== 'open') throw fail(409, { error: 'this email was already handled' })
      const d = staffCase(body.caseNumber)
      item.status = 'assigned'
      const ev = staffEvent(d, 'email_in', { body: item.text, data: { assignedFromUnmatched: item.id, senderVerified: item.senderVerified, subject: item.subject } })
      audit(d, 'support.email.assign_unmatched', { id: item.id })
      return { ok: true, caseNumber: d.case.caseNumber, eventId: ev.eventId }
    }
    if (method === 'GET' && p === '/cs/admin/support/kb/proposals') return clone(S.kbProposals)
    throw fail(404, { error: 'not found' })
  }

  return {
    mode: 'fixture',
    configured: true,
    scenario,
    async request(method, path, { body, signal } = {}) {
      if (scenario === 'loading') return new Promise(() => {})
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, latency)
        signal?.addEventListener?.('abort', () => { clearTimeout(timer); reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })) }, { once: true })
      })
      if (scenario === 'error') throw fail(503, { error: 'service unavailable' })
      if (scenario === 'not_enabled') throw fail(404, clone(errorsSnap.notEnabled))
      const result = route(method, new URL(path, 'http://fixture.invalid'), body || {})
      return JSON.parse(JSON.stringify(result))
    },
  }
}

// For the dev index: the scenario cases and incidents the snapshots contain.
export const FIXTURE_INDEX = Object.freeze({
  playerCases: playerSnap.scenarioCases,
  staffScenarioCases: staffSnap.scenarioCases,
  incidents: staffSnap.incidents.list.incidents.map((i) => ({ id: i.incidentId, title: i.title, status: i.status })),
  articles: helpSnap.list.articles.map((a) => a.slug),
})
