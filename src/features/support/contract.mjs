// What the support UI reads from each API response, as key paths checked
// against snapshots of the real backend (fixtures/generated/*.json, written
// by scripts/support/generate-fixtures.mjs). Pure data + a tiny checker; no
// React. Tests: src/features/support/contract.test.mjs (committed snapshots)
// and scripts/support/contract.test.mjs (a fresh in-memory backend run).
//
// Path grammar: "a.b.c" walks objects; "a[].b" means every element of array
// `a` (and at least one element must exist across the checked responses);
// "a.*" means every value of object `a`. A key may be null, never missing.
// When a UI component starts reading a new field, add it here.

const CASE_SUMMARY = ['caseNumber', 'subject', 'category', 'status', 'bucket', 'csat', 'createdAt', 'updatedAt']
const PANEL = ['id', 'title', 'status', 'facts[].label', 'facts[].value', 'facts[].source', 'facts[].at', 'inferences', 'actions.user']

export const UI_CONTRACT = Object.freeze([
  {
    name: 'POST /cs/me/support/triage',
    select: (s) => s.player.triage.samples.map((x) => x.response),
    paths: ['suggestedCategory', 'confidence', 'intent', 'questions[].id', 'questions[].prompt', 'questions[].why', 'diagnosticsPreview.panels', ...PANEL.map((p) => `diagnosticsPreview.panels[].${p}`), 'helpArticles[].slug', 'helpArticles[].title'],
  },
  {
    name: 'POST /cs/me/support/cases',
    select: (s) => Object.values(s.player.created),
    paths: ['replayed', ...CASE_SUMMARY.map((p) => `case.${p}`)],
  },
  {
    name: 'GET /cs/me/support/cases',
    select: (s) => [s.player.list],
    paths: ['buckets.open', 'buckets.waiting_on_recon', 'buckets.waiting_on_me', 'buckets.resolved', 'buckets.closed', ...CASE_SUMMARY.map((p) => `buckets.waiting_on_me[].${p}`), 'buckets.closed[].csat.rating', 'total'],
  },
  {
    name: 'GET /cs/me/support/cases/{caseNumber}',
    select: (s) => Object.values(s.player.cases),
    paths: [
      ...CASE_SUMMARY, 'description', 'resolution', 'linkedFromCaseNumber', 'linkedCaseNumbers',
      'actions.canMessage', 'actions.canConfirmResolved', 'actions.canReopen', 'actions.canRate',
      'timeline[].id', 'timeline[].kind', 'timeline[].visibility', 'timeline[].at', 'timeline[].author', 'timeline[].body',
      'attachments', 'uploads.enabled', 'uploads.reason',
      'diagnostics.panels', ...PANEL.map((p) => `diagnostics.panels[].${p}`),
    ],
  },
  { name: 'POST …/messages (player)', select: (s) => [s.player.mutations.message], paths: ['eventId', 'status', 'linkedCaseNumber'] },
  { name: 'POST …/messages on a closed case', select: (s) => [s.player.mutations.messageOnClosed], paths: ['linkedCaseNumber', 'linkedCase.caseNumber'] },
  { name: 'POST …/csat', select: (s) => [s.player.mutations.csat], paths: ['ok', 'rating'] },
  { name: 'POST …/resolve-confirm', select: (s) => [s.player.mutations.confirmResolved], paths: ['status', 'caseNumber'] },
  { name: 'POST …/reopen', select: (s) => [s.player.mutations.reopen], paths: ['reopened', 'linkedCaseNumber', 'case.status'] },
  { name: 'POST …/attachments', select: (s) => [s.player.mutations.attachment], paths: ['status'] },
  {
    name: 'GET /cs/admin/support/queue',
    select: (s) => Object.values(s.staff.queue),
    paths: [
      'view', 'me', 'counts.unassigned', 'counts.mine', 'counts.at_risk', 'counts.all_open',
      'cases[].caseNumber', 'cases[].subject', 'cases[].category', 'cases[].status', 'cases[].priority', 'cases[].severity',
      'cases[].assignee', 'cases[].waitingOn', 'cases[].incidentId', 'cases[].source', 'cases[].updatedAt',
      'cases[].player.key', 'cases[].player.handle', 'cases[].player.planLabel', 'cases[].sla.state',
    ],
  },
  {
    name: 'GET /cs/admin/support/cases/{caseNumber}',
    select: (s) => Object.values(s.staff.cases),
    paths: [
      'me',
      'case.caseNumber', 'case.subject', 'case.status', 'case.priority', 'case.severity', 'case.category', 'case.source',
      'case.waitingOn', 'case.team', 'case.assignee', 'case.refs.incidentId', 'case.version', 'case.contactKey',
      'case.createdAt', 'case.updatedAt', 'case.slaState.state', 'case.allowedTransitions',
      'timeline[].eventId', 'timeline[].kind', 'timeline[].actor.kind', 'timeline[].actor.id', 'timeline[].body', 'timeline[].data', 'timeline[].at', 'timeline[].visibleToPlayer',
      'attachments', 'uploads.enabled', 'uploads.reason',
      'audit[].id', 'audit[].at', 'audit[].actor', 'audit[].action', 'audit[].detail',
      'actionRequests', 'previousCases', 'incident',
      'player360.status', 'player360.summary.key', 'player360.summary.email', 'player360.summary.displayName', 'player360.summary.plan',
      'player360.summary.planLabel', 'player360.summary.hasAccess', 'player360.summary.billingStatus', 'player360.summary.health',
      'player360.summary.healthLabel', 'player360.summary.reasons', 'player360.summary.createdAt', 'player360.summary.lastSeenAt',
      'player360.summary.stageLabel', 'player360.summary.activation.done', 'player360.summary.activation.total',
      'player360.summary.vod.used', 'player360.summary.coaching', 'player360.summary.activity.activeDays14', 'player360.summary.platform', 'player360.summary.rank',
      'diagnostics.observedAt', 'diagnostics.panels', ...PANEL.map((p) => `diagnostics.panels[].${p}`), 'diagnostics.panels[].actions.recon',
      'diagnostics.context.entitlement.mismatchSuspected', 'diagnostics.context.entitlement.mismatches', 'diagnostics.context.entitlement.stripeRefs',
      'diagnostics.context.entitlement.refsMasked', 'diagnostics.context.entitlement.stripeReportedState', 'diagnostics.context.entitlement.product.planLabel',
      'diagnostics.context.entitlement.reconState.status', 'diagnostics.context.entitlement.reconState.hasAccess', 'diagnostics.context.entitlement.reconState.planLabel',
      'diagnostics.context.entitlement.reconState.resolver', 'diagnostics.context.entitlement.identityBinding.state', 'diagnostics.context.entitlement.lastCheck.stateFetchedAt',
      'diagnostics.context.entitlement.note',
      'diagnostics.context.connections[].source', 'diagnostics.context.connections[].linked', 'diagnostics.context.connections[].lastSuccessAt',
      'diagnostics.context.connections[].lastAttemptAt', 'diagnostics.context.connections[].errorClass', 'diagnostics.context.connections[].freshness',
      'diagnostics.context.connections[].retryEligible', 'diagnostics.context.connections[].userActionRequired', 'diagnostics.context.connections[].reconActionRequired',
      'diagnostics.context.connections[].notes',
      'copilot.model', 'copilot.summary.text', 'copilot.summary.kind', 'copilot.category.value', 'copilot.severity.value',
      'copilot.likelyRootCause.text', 'copilot.likelyRootCause.basis', 'copilot.likelyRootCause.confidence',
      'copilot.suggestedSteps[].text', 'copilot.suggestedSteps[].kind', 'copilot.draftReply.text', 'copilot.helpArticles',
      'copilot.related.cases', 'copilot.related.incidents', 'copilot.suggestedEscalation', 'copilot.playerContext', 'copilot.recentChanges', 'copilot.disclaimers',
      'permissions.case\\.reply', 'permissions.case\\.status', 'permissions.case\\.assign', 'permissions.case\\.escalate',
      'permissions.case\\.link_incident', 'permissions.case\\.resolve', 'permissions.action\\.request', 'permissions.action\\.request\\.billing',
    ],
  },
  {
    name: 'actionRequests[] on a staff case',
    select: (s) => [s.staff.cases[s.staff.scenarioCases.entitlementMismatch]],
    paths: ['actionRequests[].requestId', 'actionRequests[].kind', 'actionRequests[].status', 'actionRequests[].requiredVerification', 'actionRequests[].history[].status', 'actionRequests[].history[].by', 'actionRequests[].history[].at'],
  },
  {
    name: 'incident on a linked staff case',
    select: (s) => [s.staff.cases[s.staff.scenarioCases.vodFailure]],
    paths: ['incident.incidentId', 'incident.title', 'incident.status'],
  },
  { name: 'POST …/status | …/assign | …/link-incident (staff)', select: (s) => [s.staff.writes.status, s.staff.writes.assign, s.staff.writes.linkIncident], paths: ['caseNumber', 'status', 'version', 'allowedTransitions', 'assignee'] },
  { name: 'POST …/escalate', select: (s) => [s.staff.writes.escalate], paths: ['case.status', 'case.version', 'handoff.text', 'handoff.team'] },
  { name: 'POST …/resolve', select: (s) => [s.staff.writes.resolve], paths: ['case.status', 'case.version', 'kbProposal'] },
  { name: 'POST …/messages (staff)', select: (s) => [s.staff.writes.reply], paths: ['ok', 'eventId', 'status', 'delivery'] },
  { name: 'POST …/notes', select: (s) => [s.staff.writes.note], paths: ['ok', 'eventId'] },
  { name: 'POST …/action-requests', select: (s) => [s.staff.writes.actionRequest], paths: ['requestId', 'kind', 'status', 'requiredVerification', 'history'] },
  {
    name: 'GET /cs/admin/support/incidents',
    select: (s) => [s.staff.incidents.list],
    paths: ['incidents[].incidentId', 'incidents[].title', 'incidents[].service', 'incidents[].status', 'incidents[].severity', 'incidents[].affectedCount', 'incidents[].linkedCaseCount', 'incidents[].updatedAt'],
  },
  {
    name: 'GET /cs/admin/support/incidents/{id}',
    select: (s) => Object.values(s.staff.incidents.detail),
    paths: ['incident.title', 'incident.status', 'incident.severity', 'incident.service', 'incident.owner', 'incident.affectedCount', 'incident.workaround', 'incident.internalNotes', 'incident.customerUpdate', 'timeline[].eventId', 'timeline[].kind', 'timeline[].body', 'timeline[].by', 'timeline[].at', 'linkedCases[].caseNumber', 'linkedCases[].status', 'linkedCases[].priority', 'linkedCases[].createdAt'],
  },
  {
    name: 'GET /cs/admin/support/metrics',
    select: (s) => [s.staff.metrics.data, s.staff.metrics.empty],
    paths: ['open.total', 'created', 'awaitingFirstResponse', 'firstResponse', 'resolution', 'reopen.rate', 'reopen.resolved', 'reopen.reopened', 'csat.positiveShare', 'csat.responses', 'csat.eligible', 'volumePerActiveMember', 'activeMembers', 'repeatUsers.count', 'repeatUsers.contacts', 'incidents.count', 'incidents.linkedCases', 'aging.buckets.lt_1d', 'aging.buckets.gt_14d', 'categories', 'rootCauses', 'issueCounts.entitlement', 'issueCounts.provider', 'issueCounts.vod', 'issueCounts.coaching', 'basis'],
  },
  {
    name: 'GET /cs/admin/support/metrics (with data)',
    select: (s) => [s.staff.metrics.data],
    paths: ['firstResponse.medianMs', 'firstResponse.p90Ms', 'firstResponse.count', 'resolution.medianMs', 'resolution.p90Ms', 'resolution.count'],
  },
  {
    name: 'GET /cs/admin/support/email/unmatched',
    select: (s) => [s.staff.unmatched],
    paths: ['items[].id', 'items[].senderEmail', 'items[].senderVerified', 'items[].subject', 'items[].text', 'items[].reason', 'items[].suggestedCaseNumber', 'items[].receivedAt'],
  },
  { name: 'POST …/email/unmatched/{id}/assign', select: (s) => [s.staff.writes.unmatchedAssign], paths: ['ok', 'caseNumber', 'eventId'] },
  {
    name: 'GET /cs/help/articles',
    select: (s) => [s.help.list, ...Object.values(s.help.search)],
    paths: ['q', 'status', 'articles[].slug', 'articles[].title', 'articles[].summary', 'articles[].category', 'articles[].status'],
  },
  {
    name: 'GET /cs/help/articles/{slug}',
    select: (s) => Object.values(s.help.articles),
    paths: ['slug', 'title', 'category', 'summary', 'body', 'status', 'reviewedBy', 'sources'],
  },
  { name: 'error bodies', select: (s) => Object.values(s.errors), paths: ['error'] },
  { name: '409 version_conflict', select: (s) => [s.errors.versionConflict], paths: ['error', 'code'] },
])

// Values the UI branches on, beyond key presence.
export const UI_VALUES = Object.freeze([
  { name: 'flag off is the catch-all 404 body (isNotEnabled)', check: (s) => s.errors.notEnabled.error === 'not found' },
  { name: 'a missing case is NOT the flag-off body', check: (s) => s.errors.otherPlayersCase.error !== 'not found' },
  { name: '409 carries code version_conflict', check: (s) => s.errors.versionConflict.code === 'version_conflict' },
  { name: 'empty metrics: medians and rates are null, counts are 0', check: (s) => s.staff.metrics.empty.firstResponse === null && s.staff.metrics.empty.resolution === null && s.staff.metrics.empty.reopen.rate === null && s.staff.metrics.empty.csat.positiveShare === null && s.staff.metrics.empty.open.total === 0 },
  { name: 'uploads are off (attachment storage not provisioned)', check: (s) => Object.values(s.player.cases).every((c) => c.uploads.enabled === false) && s.player.mutations.attachment.status === 'upload_disabled' },
  { name: 'player timelines contain only player-visible kinds', check: (s) => Object.values(s.player.cases).every((c) => c.timeline.every((e) => ['message_player', 'message_staff', 'status_change', 'csat', 'attachment', 'system'].includes(e.kind))) },
  // The client renders a player event only when it is marked public (playerTimeline second lock).
  { name: 'every player timeline event is marked visibility public', check: (s) => Object.values(s.player.cases).every((c) => c.timeline.length > 0 && c.timeline.every((e) => e.visibility === 'public')) },
  { name: 'production help serves no drafts', check: (s) => s.help.production.list.articles.every((a) => a.status === 'reviewed') && s.help.production.list.preview === undefined },
  { name: 'preview help is marked preview', check: (s) => s.help.list.preview === true },
  { name: 'agents see masked billing references', check: (s) => !JSON.stringify(s.staff.billingCaseAsAgent).includes('cus_FIXTURESUPD1234') && JSON.stringify(s.staff.cases[s.staff.scenarioCases.billing]).includes('cus_FIXTURESUPD1234') },
])

function segments(path) {
  return path.split(/(?<!\\)\./).map((p) => p.replace(/\\\./g, '.'))
}

// Returns { ok, missing: [], vacuous: bool } for one value and one path.
function walk(value, parts, trail, out) {
  if (!parts.length) return
  const [head, ...rest] = parts
  if (head === '*') {
    if (!value || typeof value !== 'object') { out.missing.push(`${trail}.* (not an object)`); return }
    for (const [k, v] of Object.entries(value)) walk(v, rest, `${trail}.${k}`, out)
    return
  }
  const isArray = head.endsWith('[]')
  const key = isArray ? head.slice(0, -2) : head
  if (!value || typeof value !== 'object' || !(key in value)) { out.missing.push(`${trail ? `${trail}.` : ''}${key}`); return }
  const next = value[key]
  if (isArray) {
    if (!Array.isArray(next)) { out.missing.push(`${trail ? `${trail}.` : ''}${key} (not an array)`); return }
    if (next.length) out.nonEmpty = true
    next.forEach((item, i) => walk(item, rest, `${trail ? `${trail}.` : ''}${key}[${i}]`, out))
    return
  }
  if (rest.length && (next === null || next === undefined)) {
    // A null parent is only acceptable when the path ends there.
    out.missing.push(`${trail ? `${trail}.` : ''}${key} (null, but the UI reads ${rest.join('.')})`)
    return
  }
  walk(next, rest, `${trail ? `${trail}.` : ''}${key}`, out)
}

// Checks every UI_CONTRACT entry against a snapshot bundle
// { meta, player, staff, help, errors }. Returns a list of problems.
export function checkContract(bundle) {
  const problems = []
  for (const spec of UI_CONTRACT) {
    let values
    try {
      values = spec.select(bundle)
    } catch (err) {
      problems.push(`${spec.name}: snapshot missing (${err.message})`)
      continue
    }
    if (!Array.isArray(values) || !values.length || values.some((v) => !v || typeof v !== 'object')) {
      problems.push(`${spec.name}: no response snapshot`)
      continue
    }
    for (const path of spec.paths) {
      const out = { missing: [], nonEmpty: false }
      for (const v of values) walk(v, segments(path), '', out)
      if (out.missing.length) problems.push(`${spec.name}: ${path} -> missing ${out.missing.slice(0, 3).join(', ')}`)
      else if (path.includes('[]') && !out.nonEmpty) problems.push(`${spec.name}: ${path} -> every array was empty; the snapshot does not exercise it`)
    }
  }
  for (const v of UI_VALUES) {
    let ok = false
    try {
      ok = v.check(bundle) === true
    } catch {
      ok = false
    }
    if (!ok) problems.push(`value: ${v.name}`)
  }
  return problems
}
