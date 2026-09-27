// Support Copilot (ARCHITECTURE §8): deterministic rules + templates.
//
// Every output item is tagged `kind: 'fact'` (read from a stored record, with
// its source) or `kind: 'inference'` (a rule's conclusion, with its basis and
// confidence). No chain-of-thought text, no model call, no write access: the
// copilot suggests steps; any billing/access/identity change is an action
// request a lead authorizes. Draft replies must pass checkDraftCopy().

import { categoryInfo, classifyIssue } from './classify.mjs'
import { findSecrets } from './diagnostics/shared.mjs'
import { searchHelp } from './help/search.mjs'

// ---- copy guard -------------------------------------------------------------------

const COPY_RULES = [
  { id: 'trial_wording', re: /\b(?:free\s+)?trials?\b/i },
  { id: 'coaching_price_forbidden', re: /\$\s?(?:75|140|195)\b/ },
  { id: 'coaching_free_intro', re: /\bfree\s+intro\b/i },
  { id: 'coaching_free', re: /\bfree\s+(?:coaching|sessions?|lessons?)\b/i },
  { id: 'coaching_first_free', re: /\bfirst\s+(?:coaching\s+)?session\s+(?:is\s+)?(?:free|on\s+us)\b/i },
  { id: 'refund_promise', re: /\b(?:we|i)(?:\s?'ll|\s+will|\s+can|\s+are\s+going\s+to|\s+have|\s+just)\s+(?:issue\s+(?:a|your)\s+|process\s+(?:a|your)\s+)?(?:refund|reimburse|credit)(?:ed)?\b/i },
  { id: 'refund_promise', re: /\b(?:refund|credit|reimbursement)s?\s+(?:has\s+been|have\s+been|is\s+being|will\s+be|was|is\s+on\s+its\s+way)\b/i },
  { id: 'benefit_promise', re: /\byou(?:\s?'ll|\s+will)\s+(?:get|receive|have|be\s+given)\s+(?:a\s+|your\s+|full\s+)?(?:refund|credits?|access|money\s+back|free|extra)\b/i },
  { id: 'access_promise', re: /\b(?:we|i)(?:\s?'ll|\s+will|\s+can|\s+are\s+going\s+to|\s+have)\s+(?:restore|reinstate|unlock|grant|extend|comp|upgrade|give\s+you)\b/i },
  { id: 'access_promise', re: /\b(?:access|account|membership|plan)\s+(?:is|has\s+been|will\s+be)\s+(?:restored|reinstated|unlocked|extended|upgraded)\b/i },
  { id: 'guarantee', re: /\bguarantee[ds]?\b|\bmoney[-\s]back\b/i },
  { id: 'time_promise', re: /\bwithin\s+(?:\d+|a|an|one|two|three|a\s+few|the\s+next)\b[^.!?]{0,20}\b(?:minutes?|hours?|hrs?|days?|business\s+days?|weeks?)\b/i },
  { id: 'time_promise', re: /\b\d+\s*(?:-|to)?\s*\d*\s*(?:hours?|hrs?|business\s+days?|working\s+days?)\b/i },
  { id: 'time_promise', re: /\b(?:by|before)\s+(?:tomorrow|tonight|end\s+of\s+(?:the\s+)?(?:day|week)|eod|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i },
  { id: 'time_promise', re: /\b(?:same[-\s]day|asap|right\s+away|immediately)\b/i },
  { id: 'sla_wording', re: /\bSLA\b|\bresponse\s+time\b/i },
]

export function checkDraftCopy(text) {
  const value = String(text ?? '')
  const violations = []
  for (const rule of COPY_RULES) {
    const m = rule.re.exec(value)
    if (m) violations.push({ rule: rule.id, match: m[0] })
  }
  for (const id of findSecrets(value)) violations.push({ rule: 'secret_like', match: id })
  return { ok: violations.length === 0, violations }
}

// ---- model adapter (OFF) --------------------------------------------------------------

// A model-backed copilot stays OFF until Aaron approves a written case per the
// frontier product standard:
//   cost        - per-case token estimate x monthly case volume, with a hard
//                 monthly cap and a kill switch (see the 2026 Bedrock bill);
//   risk        - player data leaves the deterministic path; prompt-injection
//                 from player text; drafts must still pass checkDraftCopy();
//   measurement - A/B against this deterministic copilot on staff edit
//                 distance, reopen rate and CSAT, over a fixed window;
//   rollback    - flip `support.copilotModel` off; the deterministic output is
//                 always computed first, so nothing depends on the model.
export function createModelAdapter(config = {}) {
  const enabled = config?.support?.copilotModel === true
  if (!enabled) throw new Error('Support copilot model adapter is disabled (config.support.copilotModel is off).')
  return Object.freeze({
    enabled: true,
    async summarize() {
      throw new Error('Support copilot model adapter is not wired: approve the cost/risk/measurement/rollback case first.')
    },
  })
}

// ---- helpers ----------------------------------------------------------------------------

const F = (text, source, at = null, extra = {}) => ({ kind: 'fact', text, source, at: at || null, ...extra })
const I = (text, basis, confidence = 0.5, extra = {}) => ({ kind: 'inference', text, basis, confidence, ...extra })

const BILLING_CATEGORIES = new Set(['subscription', 'access_entitlement', 'billing_question', 'cancellation'])
const VOD_CATEGORIES = new Set(['vod_upload', 'vod_analysis', 'ai_result'])
const DATA_CATEGORIES = new Set(['rank_stat_discrepancy', 'trn_data', 'historical_data', 'ubisoft_connection', 'psn_connection', 'xbox_connection'])
const DAY = 86400000

function panelOf(diagnostics, id) {
  return (diagnostics?.panels || []).find((p) => p.id === id) || null
}

function factValue(diagnostics, panelId, label) {
  return panelOf(diagnostics, panelId)?.facts?.find((f) => f.label === label) || null
}

function toMs(value) {
  const ms = Date.parse(value || '')
  return Number.isFinite(ms) ? ms : NaN
}

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

// ---- playbooks --------------------------------------------------------------------------

function billingPlaybook({ diagnostics, category, subcategory }) {
  const view = diagnostics?.context?.entitlement || null
  const signals = diagnostics?.signals || {}
  const steps = [I('Open the entitlement view: compare the Recon state with the subscription rows and identity binding.', 'billing/access playbook', 0.9)]
  let root = null
  if (view?.mismatches?.length) {
    const m = view.mismatches[0]
    root = I(`Mismatch suspected (${m.ruleId}): ${m.detail}`, `entitlement rule ${m.ruleId}`, 0.7)
    steps.push(I('Verify the subscription in Stripe (Stripe-reported state is "not checked" here).', 'no read-only Stripe port is configured', 0.9))
    steps.push(I('If a fix is needed, record an entitlement_repair action request for a lead to authorize; the billing system executes it.', 'Support never changes billing or access', 1, { requiresActionRequest: 'entitlement_repair' }))
  } else if (signals.billingStatus === 'payment_failed') {
    root = I('Last payment failed, so paid features are paused by design.', 'resolveBilling status payment_failed', 0.8)
    steps.push(I('Point the player to the billing portal to update their card; no Recon-side change is needed.', 'payment_failed playbook', 0.8))
  } else if (signals.billingStatus === 'renewal_unconfirmed') {
    root = I('Renewal not recorded after the paid-through date; the player may be paying but locked out.', 'resolveBilling status renewal_unconfirmed', 0.7)
    steps.push(I('Check the renewal in Stripe; if it renewed, record an entitlement_repair action request.', 'renewal_unconfirmed playbook', 0.8, { requiresActionRequest: 'entitlement_repair' }))
  }
  if (subcategory === 'double_charge' || subcategory === 'refund') {
    steps.push(I('Check invoice history in Stripe before replying; any refund is a refund action request for a lead to authorize.', 'refunds are never promised or executed by Support', 1, { requiresActionRequest: 'refund' }))
  }
  if (category === 'cancellation') {
    steps.push(I('The player can cancel in the billing portal; if they ask us to do it, record a cancellation action request.', 'cancellation playbook', 0.9, { requiresActionRequest: 'cancellation' }))
  }
  return { root, steps, escalation: view?.mismatches?.length || subcategory === 'double_charge' ? { team: 'billing', reason: root?.text || 'Billing check needed' } : null }
}

function vodPlaybook({ diagnostics }) {
  const ctx = diagnostics?.context?.vod || null
  const steps = [I('Compare counted uses with completed review records for this period (VOD panel).', 'VOD playbook', 0.9)]
  let root = null
  let escalation = null
  if (ctx?.unmatchedUsage > 0) {
    root = I(`${ctx.unmatchedUsage} counted use(s) without a completed review record: possible failed review.`, 'usage counter is reserved before the model call; failures are not stored', ctx.eventsTruncated ? 0.35 : 0.55)
    escalation = {
      team: 'vod_ai',
      reason: 'Possible failed VOD review',
      handoff: clean(`Period start ${ctx.periodStartAt || 'n/a'}; counted uses ${ctx.usage?.used ?? 'n/a'}; completed review records ${ctx.reviewRecordsInPeriod}; last completed review ${ctx.lastReviewAt || 'none'}. Not recorded: job/request ids, failure records, error messages. Ask the player for the on-screen message and time.`),
    }
  } else if (ctx?.usage && !ctx.usage.unlimited && ctx.usage.used >= ctx.usage.limit) {
    root = I('Monthly review allowance is used up.', 'usage counter at the plan limit', 0.7)
  }
  steps.push(I('Ask for the exact on-screen message and roughly when it happened; review attempts are not recorded.', 'no job ids or failure records exist', 0.9))
  return { root, steps, escalation }
}

function dataPlaybook({ diagnostics, category }) {
  const rank = diagnostics?.context?.rank || null
  const steps = []
  let root = null
  let escalation = null
  if (rank) {
    root = I(`Classification: ${rank.classification.value.replace(/_/g, ' ')}.`, rank.classification.basis, rank.classification.confidence)
    if (rank.latestProvider) steps.push(I(`Newest snapshot is from ${rank.latestProvider.source} (observed ${rank.latestProvider.observedAt}); compare with what the player sees in-game.`, 'rankDiscrepancyContext', 0.8))
    if (rank.seasonRollover?.suspected) steps.push(I('Check whether a season rollover reset ranks at the source.', rank.seasonRollover.basis, rank.seasonRollover.confidence))
    if (rank.classification.value === 'our_normalization') escalation = { team: 'player_data', reason: 'Recon may be selecting or displaying the value incorrectly', handoff: `Latest ${rank.latestProvider?.source} snapshot observed ${rank.latestProvider?.observedAt}; ${rank.history.snapshots} snapshot(s) on record.` }
  } else {
    steps.push(I('Connection history was not available; check the connections panel status before troubleshooting.', 'rank context missing', 0.6))
  }
  const failing = diagnostics?.signals?.globalProviderFailures || []
  if (failing.length) {
    root = I(`Provider-wide failure (${failing.join(', ')}); link to the incident.`, 'recon-player-provider-health', 0.7)
    escalation = null
  }
  if (/connection$/.test(category)) steps.push(I('Links are player-reported; no platform credentials are ever requested or stored.', 'player-data identity model', 1))
  return { root, steps, escalation }
}

function valuePlaybook({ diagnostics }) {
  const s = diagnostics?.signals || {}
  const evidence = []
  if (s.lifecycleStage) evidence.push(F(`Lifecycle stage: ${s.lifecycleStage}`, 'domain/lifecycle.mjs'))
  if (s.activeDays14 !== undefined) evidence.push(F(`Active on ${s.activeDays14} day(s) in the last 14`, 'activity records'))
  if (s.vodUsed !== undefined && s.vodUsed !== null) evidence.push(F(`VOD reviews used this period: ${s.vodUsed}${s.vodLimit ? ` of ${s.vodLimit}` : ''}`, 'usage counter'))
  const onboarding = panelOf(diagnostics, 'onboarding')
  const checklist = onboarding?.facts?.find((f) => f.label === 'Activation checklist')
  if (checklist) evidence.push(F(`Activation checklist: ${checklist.value}`, checklist.source))
  const steps = [
    I('Treat this as a success conversation, not a bug: review goals, what they use, and one focus for the next week.', 'value playbook', 0.9),
    ...evidence.map((e) => ({ ...e })),
  ]
  return {
    root: I(s.activated === false || s.onboardingStalled ? 'Player has not reached a first win with Recon yet.' : 'Results gap: usage exists but the player does not see progress.', 'onboarding/usage evidence', 0.5),
    steps,
    escalation: { team: 'coaching', reason: 'Coaching review of goals and usage', handoff: evidence.map((e) => e.text).join('; ') || 'No usage evidence recorded.' },
  }
}

function accountPlaybook({ diagnostics }) {
  const status = diagnostics?.signals?.accountStatus
  const steps = [I('Check the account panel: login status, profile row, mixed-case email.', 'account playbook', 0.9)]
  let root = null
  if (status && status !== 'ok') root = I(`Login status is ${status}.`, 'Cognito status', 0.8)
  const legacy = panelOf(diagnostics, 'account')?.inferences?.find((i) => /mixed-case/i.test(i.label))
  if (legacy) root = I('Legacy mixed-case login: the player may be typing a different case than the account.', legacy.basis, legacy.confidence)
  if (status === 'no_account' || status === 'disabled') steps.push(I('Account changes are an account_recovery action request.', 'Support never changes Cognito', 1, { requiresActionRequest: 'account_recovery' }))
  return { root, steps, escalation: null }
}

// ---- draft replies (must pass checkDraftCopy) -----------------------------------------

function draftFor({ category, subcategory, intent, diagnostics, questions, articles }) {
  const s = diagnostics?.signals || {}
  const ask = questions.length ? ` To narrow it down: ${questions.map((q) => q.prompt).join(' ')}` : ''
  const guide = articles[0] ? ` This guide covers the basics: ${articles[0].title}.` : ''
  if (category === 'safety_report') return 'Thanks for reporting this. It has gone to the person who handles safety reports, and we will follow up on this case. If you are in danger, contact your local emergency services.'
  if (intent === 'value') {
    const bits = []
    if (s.activeDays14 !== undefined) bits.push(`you have been active on ${s.activeDays14} of the last 14 days`)
    if (s.vodUsed !== undefined && s.vodUsed !== null) bits.push(`you have run ${s.vodUsed} VOD review${s.vodUsed === 1 ? '' : 's'} this period`)
    return clean(`Thanks for being straight with us. Looking at your account${bits.length ? `, ${bits.join(' and ')}` : ''}. Climbing comes from one focused fix at a time, so I have flagged this for a coaching look at your goals and what you have been using. Tell us your current rank and the part of your game you feel is holding you back.`)
  }
  if (intent === 'how_to') return clean(`Good question.${guide} Here is the short version for your account, and reply if anything is unclear.${ask}`)
  if (BILLING_CATEGORIES.has(category)) {
    if (s.billingStatus === 'payment_failed') return 'Thanks for reaching out. Your last payment did not go through, so paid features are paused. Updating your card in the billing portal turns them back on. If you cannot find the way in, tell us here.'
    return clean(`Thanks for flagging this. I can see your Recon account and the membership record on it, and I am checking that record against your login and payment.${subcategory === 'double_charge' ? ' I am also checking the charges you mentioned.' : ''} I will post what I find on this case.${ask}`)
  }
  if (VOD_CATEGORIES.has(category)) return clean(`Thanks for the details. I can see your review usage for this period. Review attempts that fail are not stored on our side, so I have passed this to the person who owns VOD review.${ask} For the best results, use clear PNG or JPG screenshots from one round, with the map and site picked before you upload.`)
  if (category === 'replay_upload') return 'Replay upload is not available in Recon today. For an AI review of a round, upload screenshots from it on the VOD review page.'
  if (category === 'desktop_client') return clean(`Thanks. We cannot see desktop app versions from our side.${ask}`)
  if (DATA_CATEGORIES.has(category)) {
    const rank = diagnostics?.context?.rank
    const newest = rank?.latestProvider ? ` The newest data we have is from ${rank.latestProvider.source}, observed ${String(rank.latestProvider.observedAt).slice(0, 10)}.` : ''
    const rollover = rank?.seasonRollover?.suspected ? ' A new season can reset or re-place ranks at the source, which may explain the difference.' : ''
    return clean(`Thanks. Recon keeps dated snapshots of your rank and stats from each source.${newest}${rollover} I am checking whether the difference is on the source side or in how Recon shows it.${ask}`)
  }
  if (category === 'coaching_credits' || category === 'coaching_session') return clean(`Thanks. I am checking your coaching bookings and the credits on record against your purchase, and I will post what I find on this case.${ask}`)
  if (category === 'account_login' || category === 'email_verification') return clean(`Thanks. I can see your account on our side, so no need to resend your details.${s.accountStatus === 'unconfirmed' ? ' Your email is not confirmed yet: request a new code from the sign-in page and check spam.' : ' Use Forgot password on the sign-in page to set a new password.'}${ask}`)
  return clean(`Thanks for the report. I have your account details here, so no need to resend them.${ask}`)
}

// ---- main ---------------------------------------------------------------------------------

export function buildCopilot({ caseRecord = {}, events = [], diagnostics = null, related = { cases: [], incidents: [] }, articles = [] } = {}) {
  const text = [caseRecord.subject, caseRecord.description].filter(Boolean).join('. ')
  const signals = diagnostics?.signals || {}
  const cls = classifyIssue(text, { signals })
  const categoryId = caseRecord.category || cls.category
  const info = categoryInfo(categoryId)
  const intent = caseRecord.intent || cls.intent
  const subcategory = caseRecord.subcategory || (categoryId === cls.category ? cls.subcategory : null)
  const nowMs = toMs(diagnostics?.observedAt) || toMs(caseRecord.updatedAt) || 0

  const helpArticles = (Array.isArray(articles) && articles.length ? articles : searchHelp(text, { limit: 3 }))
    .slice(0, 3).map((a) => ({ kind: 'inference', slug: a.slug, title: a.title, status: a.status || null, basis: 'help search ranking' }))

  // Facts and inferences from diagnostics.
  const facts = []
  const inferences = []
  for (const p of diagnostics?.panels || []) {
    for (const f of p.facts || []) facts.push({ kind: 'fact', panel: p.id, label: f.label, value: f.value, source: f.source, at: f.at || null })
    for (const i of p.inferences || []) inferences.push({ kind: 'inference', panel: p.id, label: i.label, value: i.value, basis: i.basis, confidence: i.confidence })
  }
  inferences.unshift({ kind: 'inference', panel: 'classification', label: 'Suggested category', value: cls.category, basis: `matched: ${cls.matched.join(', ') || 'none'}`, confidence: cls.confidence })

  // Playbook.
  let play
  if (intent === 'value') play = valuePlaybook({ diagnostics })
  else if (BILLING_CATEGORIES.has(categoryId)) play = billingPlaybook({ diagnostics, category: categoryId, subcategory })
  else if (VOD_CATEGORIES.has(categoryId)) play = vodPlaybook({ diagnostics })
  else if (DATA_CATEGORIES.has(categoryId)) play = dataPlaybook({ diagnostics, category: categoryId })
  else if (categoryId === 'account_login' || categoryId === 'email_verification') play = accountPlaybook({ diagnostics })
  else if (categoryId === 'safety_report') play = { root: null, steps: [I('Route to security now; do not ask the player to repeat details publicly.', 'safety playbook', 1)], escalation: { team: 'security', reason: 'Safety report', handoff: 'Safety report received; see case description.' } }
  else if (intent === 'how_to') play = { root: I('Player needs guidance, not a fix.', `intent ${intent}`, cls.confidence), steps: [I('Answer with the steps and link a reviewed help article if one exists.', 'how_to playbook', 0.9)], escalation: null }
  else play = { root: null, steps: [I('Ask only the unanswered questions, then reproduce.', 'default playbook', 0.7)], escalation: null }
  for (const p of diagnostics?.panels || []) for (const action of p.actions?.recon || []) play.steps.push(I(action, `${p.id} panel`, 0.7))

  const likelyRootCause = play.root || I('Undetermined from recorded data.', 'no rule matched the recorded data', 0.1)

  // Recent changes (facts only).
  const recentChanges = []
  for (const e of Array.isArray(events) ? events : []) {
    if (!['status_change', 'assignment', 'escalation', 'incident_link', 'system'].includes(e?.type)) continue
    const at = toMs(e.at || e.createdAt)
    if (nowMs && Number.isFinite(at) && at < nowMs - 14 * DAY) continue
    recentChanges.push(F(clean(`${e.type.replace(/_/g, ' ')}${e.from || e.to ? `: ${e.from || '?'} -> ${e.to || '?'}` : ''}${e.summary ? ` (${e.summary})` : ''}`), 'case timeline', e.at || e.createdAt))
  }
  for (const f of facts) {
    const at = toMs(f.at)
    if (nowMs && Number.isFinite(at) && at >= nowMs - 7 * DAY && ['entitlement', 'connections', 'vod', 'coaching'].includes(f.panel) && !/detail|id$/i.test(f.label)) recentChanges.push(F(`${f.label}: ${f.value}`, f.source, f.at))
  }

  const relatedOut = {
    cases: (related?.cases || []).slice(0, 5).map((c) => F(`${c.caseNumber || 'case'} · ${c.category || 'other'} · ${c.status}`, 'previous cases', c.createdAt)),
    incidents: (related?.incidents || []).slice(0, 5).map((i) => F(`${i.title || i.service} · ${i.status}${i.severity ? ` · ${i.severity}` : ''}`, 'incidents', i.updatedAt || i.createdAt, { incidentId: i.incidentId || null })),
  }

  // Severity.
  let severity
  if (caseRecord.severity) severity = { kind: 'fact', value: caseRecord.severity, source: 'case record' }
  else {
    let value = info.severity
    let basis = `default for ${info.id}`
    if (categoryId === 'access_entitlement' && signals.hasPaidRow) [value, basis] = ['sev2', 'paying member without access']
    if ((signals.globalProviderFailures || []).length && DATA_CATEGORIES.has(categoryId)) [value, basis] = ['sev3', 'provider-wide failure']
    severity = { kind: 'inference', value, basis, confidence: 0.6 }
  }

  const draftText = draftFor({ category: categoryId, subcategory, intent, diagnostics, questions: cls.category === categoryId ? cls.questions : [], articles: helpArticles })
  let guard = checkDraftCopy(draftText)
  let finalDraft = draftText
  if (!guard.ok) {
    finalDraft = 'Thanks for reaching out. I have your account details here and I am looking into this now. I will post what I find on this case.'
    guard = checkDraftCopy(finalDraft)
  }

  const playerContext = []
  if (signals.plan !== undefined) playerContext.push(F(`Plan: ${signals.plan || 'unknown'}; access ${signals.hasAccess ? 'granted' : 'not granted'}; billing status ${signals.billingStatus || 'unknown'}`, 'entitlement panel'))
  if (signals.accountStatus) playerContext.push(F(`Login status: ${signals.accountStatus}`, 'account panel'))
  if (signals.platform || (signals.linkedPlatforms || []).length) playerContext.push(F(`Platform: ${signals.platform || 'not set'}; linked: ${(signals.linkedPlatforms || []).join(', ') || 'none'}`, 'profile / connections panel'))
  if (signals.lifecycleStage) playerContext.push(F(`Lifecycle: ${signals.lifecycleStage} (${signals.health || 'health unknown'})`, 'onboarding panel'))
  if (signals.previousCaseCount) playerContext.push(F(`Previous cases: ${signals.previousCaseCount}`, 'previous cases panel'))

  const escalation = play.escalation ? { kind: 'inference', team: play.escalation.team, reason: play.escalation.reason, handoff: play.escalation.handoff || null, basis: 'playbook rule' } : null

  return {
    model: 'deterministic',
    summary: F(clean(`${caseRecord.caseNumber || 'New case'} · ${info.label} · ${caseRecord.status || 'new'}${caseRecord.createdAt ? ` · opened ${String(caseRecord.createdAt).slice(0, 10)}` : ''} · ${(events || []).filter((e) => e?.type === 'message_player').length} player message(s)`), 'case record', caseRecord.updatedAt || caseRecord.createdAt),
    playerContext,
    facts,
    inferences,
    category: caseRecord.category
      ? { kind: 'fact', value: categoryId, label: info.label, source: 'case record', suggested: cls.category !== categoryId ? { kind: 'inference', value: cls.category, confidence: cls.confidence } : null }
      : { kind: 'inference', value: categoryId, label: info.label, confidence: cls.confidence, basis: `matched: ${cls.matched.join(', ') || 'none'}` },
    intent: caseRecord.intent ? { kind: 'fact', value: intent, source: 'case record' } : { kind: 'inference', value: intent, basis: 'intent cue phrases', confidence: cls.confidence },
    severity,
    likelyRootCause,
    recentChanges: recentChanges.slice(0, 10),
    related: relatedOut,
    suggestedSteps: play.steps,
    draftReply: { kind: 'inference', text: finalDraft, guard, basis: `template for ${intent === 'value' ? 'value' : categoryId}` },
    helpArticles,
    suggestedEscalation: escalation,
    disclaimers: [
      'Deterministic rules and templates; no model was used.',
      'Inferences are rule outputs, not verified facts; check the cited source before acting.',
      'The copilot cannot change billing, access, identity or data. Changes need an action request authorized by a lead.',
      'Draft replies are suggestions; a person sends them.',
    ],
  }
}
