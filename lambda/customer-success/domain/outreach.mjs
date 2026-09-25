// Behaviour-triggered, consent-aware outreach. Pure rules only: this module
// decides WHETHER a message is eligible and renders it. Delivery is a
// separate adapter that is DISABLED by default (see lib/delivery.mjs).
//
// Consent classes
//   service       account access and billing; blocked only by do-not-contact
//   relationship  onboarding, check-ins, feedback; blocked by opt-out or DNC
//   marketing     win-back, referral asks; needs an explicit opt-in
//
// Safety rails (all enforced here, all tested)
//   - do-not-contact and suppression block everything
//   - frequency caps across Recon AND the existing daily CRM job's sends
//   - a quiet period while the player has an open conversation
//   - idempotency: one record per workflow occurrence (workflow + instance)
//   - workflows owned by the existing CRM job are shown, never re-sent

import { toMs } from './facts.mjs'
import { selectFeedbackPrompt } from './feedback.mjs'

const DAY = 86400000

export const CONSENT_DEFAULTS = Object.freeze({ marketing: 'unknown', relationship: 'subscribed', doNotContact: false })

export const FREQUENCY = Object.freeze({
  minHoursBetween: 72,
  max30Days: 4,
  quietAfterInboundHours: 72,
})

const PREFS_LINK = 'https://r6coaching.com/dashboard#contact-preferences'

function first(facts) {
  return facts.identity.firstName || facts.identity.displayName || 'there'
}

// Templates stay short, specific and honest (see CLAUDE.md voice rules):
// no emojis in billing/access messages, no promises of unreleased features.
export const WORKFLOWS = Object.freeze([
  {
    id: 'welcome',
    name: 'Welcome',
    category: 'relationship',
    owner: 'legacy_crm',
    description: 'Sent by the existing daily CRM job to new confirmed accounts. Shown here; never re-sent.',
  },
  {
    id: 'win_back',
    name: 'Win-back',
    category: 'marketing',
    owner: 'legacy_crm',
    description: 'Sent by the existing daily CRM job only with marketing consent. Shown here; never re-sent.',
  },
  {
    id: 'activation_nudge',
    name: 'Activation nudge',
    category: 'relationship',
    approval: 'auto',
    channel: 'in_app',
    maxSends: 2,
    cooldownDays: 7,
    description: 'Signed in, started setup, not activated after 3 days.',
    trigger: (f, l, now) => {
      const age = (now - toMs(f.account.createdAt)) / DAY
      if (!(l.stage === 'activating' && age >= 3 && age <= 30)) return null
      return { instance: age < 10 ? 'n1' : 'n2', reason: 'Started setup but has not activated' }
    },
    render: (f) => ({
      subject: 'One round plan, then you are set up',
      body: `Hey ${first(f)}, you are one step from getting real use out of Recon 6. Pick the map and site you play next and open the round plan: one job, the utility order, the callouts. It takes about 30 seconds.\n\nhttps://r6coaching.com/strats`,
    }),
  },
  {
    id: 'paid_not_logged_in',
    name: 'Paid, never signed in',
    category: 'service',
    approval: 'auto',
    channel: 'email',
    maxSends: 2,
    cooldownDays: 4,
    description: 'Paying for 2+ days with a working login but no sign-in recorded.',
    trigger: (f, l) => (l.risks.some((r) => r.code === 'paid_never_logged_in') ? { instance: `p${String(f.billing.currentPeriodEnd).slice(0, 10)}`, reason: 'Paying but never signed in' } : null),
    render: (f) => ({
      subject: `Your ${f.billing.planLabel} membership is ready`,
      body: `Hi ${first(f)}, your ${f.billing.planLabel} membership is active but you have not signed in yet. Sign in with this email address to get started: https://r6coaching.com/auth\n\nIf the sign-in email never arrived or the link expired, reply to this message and we will sort it out.`,
    }),
  },
  {
    id: 'account_help',
    name: 'Account access help',
    category: 'service',
    approval: 'required',
    channel: 'email',
    maxSends: 3,
    cooldownDays: 2,
    description: 'Approved from the action queue for paying players who cannot sign in.',
    fromQueue: ['paid_no_account', 'account_setup_incomplete'],
    render: (f) => ({
      subject: 'Getting you into Recon 6',
      body: `Hi ${first(f)}, you are paying for ${f.billing.planLabel || 'a membership'} but your login is not finished, so you cannot open what you bought. We have sent a fresh sign-in invite to this address. Use the temporary password in it, then set your own.\n\nIf it does not arrive in a few minutes, check spam or reply here and we will fix it the same day.`,
    }),
  },
  {
    id: 'payment_reminder',
    name: 'Card update reminder',
    category: 'service',
    approval: 'required',
    channel: 'email',
    maxSends: 2,
    cooldownDays: 3,
    description: 'Approved from the action queue when a payment keeps failing.',
    fromQueue: ['payment_failed_persistent'],
    render: (f) => ({
      subject: 'Your Recon 6 payment did not go through',
      body: `Hi ${first(f)}, your last payment did not go through, so your paid features are paused. Update your card from your account page and they come straight back: https://r6coaching.com/account\n\nIf you meant to cancel, no action is needed.`,
    }),
  },
  {
    id: 'unused_paid_features',
    name: 'What you paid for',
    category: 'relationship',
    approval: 'auto',
    channel: 'in_app',
    maxSends: 1,
    cooldownDays: 30,
    description: 'Activated paying player not using the features that define their plan.',
    trigger: (f, l) => (l.risks.some((r) => r.code === 'unused_paid_features') ? { instance: `${f.billing.plan}-${String(f.billing.currentPeriodEnd).slice(0, 7)}`, reason: 'Paying for features they are not using' } : null),
    render: (f) => ({
      subject: `Getting the most out of ${f.billing.planLabel}`,
      body: f.billing.plan === 'champion'
        ? `Hey ${first(f)}, Champion includes two live 1:1 sessions with Aaron each month and you have not booked one yet. Bring one round you keep losing and we will fix it together: https://r6coaching.com/coaching/index.html#book`
        : `Hey ${first(f)}, your plan includes VOD reviews and you have not used one yet. Upload screenshots from one lost round and you get the mistake that cost it plus one drill: https://r6coaching.com/vod`,
    }),
  },
  {
    id: 'vod_followup',
    name: 'VOD review follow-up',
    category: 'relationship',
    approval: 'auto',
    channel: 'in_app',
    maxSends: 1,
    cooldownDays: 14,
    description: 'One to three days after a VOD review: apply one fix.',
    trigger: (f, _l, now) => {
      const at = toMs(f.activity.vod.lastAt)
      if (!Number.isFinite(at)) return null
      const days = (now - at) / DAY
      return days >= 1 && days <= 3 ? { instance: String(f.activity.vod.lastAt).slice(0, 10), reason: 'VOD review 1-3 days ago' } : null
    },
    render: (f) => ({
      subject: 'Did the fix hold up?',
      body: `Hey ${first(f)}, your last VOD review flagged ${f.skill.vodWeaknesses[0] ? `"${f.skill.vodWeaknesses[0]}"` : 'one main mistake'}. Play three rounds with only that fix in mind, then upload the next one and compare.`,
    }),
  },
  {
    id: 'coaching_followup',
    name: 'Coaching session follow-up',
    category: 'relationship',
    approval: 'required',
    channel: 'email',
    // One recap per session (Champion includes two a month).
    cooldownDays: 2,
    description: 'Personal recap after a coaching session. Appears in the action queue; Aaron fills in the focus and approves each one.',
    fromQueue: ['coaching_followup'],
    render: (f) => ({
      subject: 'Your session recap',
      body: `Hey ${first(f)}, thanks for the session. The one thing to drill before next time: [Aaron adds the focus from the session]. Reply here with how the next few matches go.`,
    }),
  },
  {
    id: 'at_risk_checkin',
    name: 'At-risk check-in',
    category: 'relationship',
    approval: 'required',
    channel: 'email',
    maxSends: 1,
    cooldownDays: 21,
    description: 'Approved from the action queue for paying players who have gone quiet.',
    fromQueue: ['at_risk_checkin'],
    render: (f) => ({
      subject: 'Quick check-in',
      body: `Hey ${first(f)}, it has been a couple of weeks since you were last in Recon 6. What is getting in the way: time, a map that keeps beating you, or something in the app? Reply with one line and I will point you at the fastest fix.\n\nAaron`,
    }),
  },
  {
    id: 'feedback_reply',
    name: 'Feedback reply',
    category: 'service',
    approval: 'required',
    channel: 'in_app',
    maxSends: 1,
    cooldownDays: 1,
    description: 'Approved from the action queue to answer unhappy feedback.',
    fromQueue: ['negative_feedback'],
    render: (f) => ({
      subject: 'About your feedback',
      body: `Hey ${first(f)}, thanks for telling us straight. [Aaron adds what is changing or asks one follow-up question.]`,
    }),
  },
  {
    id: 'dormant_reengage',
    name: 'Dormant player',
    category: 'marketing',
    approval: 'auto',
    channel: 'email',
    maxSends: 1,
    cooldownDays: 60,
    description: 'Activated free player gone 30+ days. Marketing consent required.',
    trigger: (f, l) => (l.health === 'dormant' && !f.billing.isPaidMember ? { instance: String(f.activity.lastActiveAt || f.account.createdAt).slice(0, 7), reason: 'No activity for 30+ days' } : null),
    render: (f) => ({
      subject: 'Your Road to Champion checklist is where you left it',
      body: `Hey ${first(f)}, your progress is saved. When you are back in ranked, open your next habit and take one round plan in with you: https://r6coaching.com/climb/`,
    }),
  },
  {
    id: 'feedback_email_fallback',
    name: 'Feedback by email',
    category: 'relationship',
    approval: 'auto',
    channel: 'email',
    maxSends: 3,
    cooldownDays: 21,
    description: 'A feedback moment is due but the player has not opened the app for 5+ days, so the in-product prompt cannot reach them.',
    trigger: (f, l, now) => {
      if (f.billing.status === 'cancelling' || f.billing.status === 'payment_failed') return null
      const seen = toMs(f.account.lastSeenAt)
      if (!Number.isFinite(seen) || now - seen < 5 * DAY) return null
      const prompt = selectFeedbackPrompt(f, l, { now })
      return prompt ? { instance: prompt.momentKey, reason: `${prompt.title} (not seen in-app for 5+ days)` } : null
    },
    render: (f) => ({
      subject: 'Two quick questions about Recon 6',
      body: `Hey ${first(f)}, is Recon 6 helping? Answer two quick questions the next time you open your home page: https://r6coaching.com/dashboard\n\nOr just reply to this email with one line. Aaron reads every answer.`,
    }),
  },
  {
    id: 'cancellation_feedback',
    name: 'Cancellation feedback',
    category: 'relationship',
    approval: 'auto',
    channel: 'in_app',
    maxSends: 1,
    cooldownDays: 90,
    description: 'Cancellation scheduled or subscription just ended: ask why, once.',
    trigger: (f, _l, now) => (f.billing.status === 'cancelling' || (f.billing.churned && Math.abs(now - toMs(f.billing.currentPeriodEnd)) < 14 * DAY)
      ? { instance: String(f.billing.currentPeriodEnd).slice(0, 10), reason: f.billing.status === 'cancelling' ? 'Cancellation scheduled' : 'Subscription ended' }
      : null),
    render: (f) => ({
      subject: 'What should we have done better?',
      body: `Hey ${first(f)}, one question and you are done: what made you cancel? One line is plenty, and it goes straight to Aaron.`,
    }),
  },
])

export const WORKFLOW_BY_ID = Object.freeze(Object.fromEntries(WORKFLOWS.map((w) => [w.id, w])))

export function workflowForQueueType(type) {
  return WORKFLOWS.find((w) => (w.fromQueue || []).includes(type)) || null
}

export function effectiveConsent(consentItem) {
  const c = { ...CONSENT_DEFAULTS, ...(consentItem || {}) }
  return {
    marketing: ['opted_in', 'opted_out'].includes(c.marketing) ? c.marketing : 'unknown',
    relationship: c.relationship === 'opted_out' ? 'opted_out' : 'subscribed',
    doNotContact: c.doNotContact === true,
    suppressedReason: c.suppressedReason || null,
    updatedAt: c.updatedAt || null,
  }
}

// What the player may see about their own preferences. The admin's
// do-not-contact reason is internal (it lives in the audit log) and is never
// returned to the player.
export function playerConsentView(consentItem) {
  const c = effectiveConsent(consentItem)
  return { marketing: c.marketing, relationship: c.relationship, doNotContact: c.doNotContact, updatedAt: c.updatedAt }
}

// Outreach that reached (or is about to reach) the player. Records made while
// delivery was switched off reached nobody, so they do not use up caps or
// one-shot workflows.
export const COUNTED_SEND_STATUSES = Object.freeze(['approved', 'delivered', 'sent'])

// Previous sends from BOTH systems count toward the caps.
export function sendHistory(facts) {
  const sends = []
  for (const o of facts.cs.outreach || []) {
    if (COUNTED_SEND_STATUSES.includes(o.status)) sends.push({ at: o.updatedAt || o.createdAt, workflowId: o.workflowId, category: o.category })
  }
  const legacy = facts.legacyOutreach || {}
  if (legacy.welcome_sent_at) sends.push({ at: legacy.welcome_sent_at, workflowId: 'welcome', category: 'relationship' })
  if (legacy.winback_sent_at) sends.push({ at: legacy.winback_sent_at, workflowId: 'win_back', category: 'marketing' })
  return sends.filter((s) => Number.isFinite(toMs(s.at)))
}

// Decide whether one workflow may reach this player now. Returns the reason
// when blocked so the CRM can show exactly why nothing went out.
export function checkEligibility(workflow, facts, { now = Date.now(), instance = null } = {}) {
  if (workflow.owner === 'legacy_crm') return { ok: false, reason: 'owned_by_existing_crm_job' }
  // Fail closed: consent, do-not-contact and send history live in the
  // customer-success store. If it could not be read, defaults would ignore an
  // opt-out, so nothing goes out.
  if (facts.sources?.cs !== 'ok') return { ok: false, reason: 'contact_state_unavailable' }
  if (workflow.category === 'marketing' && facts.sources?.legacyOutreach === 'unavailable') return { ok: false, reason: 'contact_state_unavailable' }
  const consent = effectiveConsent(facts.cs.consent)
  if (consent.doNotContact) return { ok: false, reason: 'do_not_contact' }
  // Suppression recorded by the existing daily CRM job (bounces, complaints,
  // unsubscribes, or a do-not-contact this service mirrored there).
  const legacy = facts.legacyOutreach || {}
  if (legacy.marketing_suppressed_at && legacy.marketing_suppressed_reason === 'do_not_contact' && workflow.category !== 'service') return { ok: false, reason: 'do_not_contact' }
  if (workflow.category === 'marketing' && legacy.marketing_suppressed_at) return { ok: false, reason: 'suppressed_in_existing_crm' }
  if (workflow.category === 'relationship' && consent.relationship === 'opted_out') return { ok: false, reason: 'opted_out' }
  if (workflow.category === 'marketing' && consent.marketing !== 'opted_in') return { ok: false, reason: consent.marketing === 'opted_out' ? 'opted_out' : 'no_marketing_consent' }
  if (workflow.channel === 'email' && !facts.identity.email) return { ok: false, reason: 'no_email' }
  if (facts.identity.isAdmin) return { ok: false, reason: 'admin_account' }

  const mine = (facts.cs.outreach || []).filter((o) => o.workflowId === workflow.id)
  if (instance && mine.some((o) => o.instanceKey === instance)) return { ok: false, reason: 'already_recorded' }
  const sentHere = mine.filter((o) => COUNTED_SEND_STATUSES.includes(o.status))
  if (workflow.maxSends && sentHere.length >= workflow.maxSends) return { ok: false, reason: 'max_sends_reached' }
  const lastHere = Math.max(0, ...sentHere.map((o) => toMs(o.updatedAt || o.createdAt)).filter(Number.isFinite))
  if (workflow.cooldownDays && lastHere && now - lastHere < workflow.cooldownDays * DAY) return { ok: false, reason: 'workflow_cooldown' }

  if (workflow.category !== 'service') {
    const lastInbound = Math.max(0, ...facts.cs.messages.filter((m) => m.direction === 'inbound').map((m) => toMs(m.createdAt)).filter(Number.isFinite))
    if (lastInbound && now - lastInbound < FREQUENCY.quietAfterInboundHours * 3600000) return { ok: false, reason: 'open_conversation' }
    const history = sendHistory(facts).filter((s) => s.category !== 'service').map((s) => toMs(s.at))
    const recent = history.filter((ms) => now - ms < FREQUENCY.minHoursBetween * 3600000)
    if (recent.length) return { ok: false, reason: 'frequency_cap_72h' }
    if (history.filter((ms) => now - ms < 30 * DAY).length >= FREQUENCY.max30Days) return { ok: false, reason: 'frequency_cap_30d' }
  }
  return { ok: true, reason: null }
}

// Every automatic workflow's verdict for one player, for the CRM and the
// scheduled run. Workflows that need a person's approval never run here: they
// come from the action queue, where the approval happens.
export function evaluateOutreach(facts, lifecycle, { now = Date.now() } = {}) {
  const out = []
  for (const workflow of WORKFLOWS) {
    if (!workflow.trigger || workflow.approval === 'required') continue
    const hit = workflow.trigger(facts, lifecycle, now)
    if (!hit) continue
    const eligibility = checkEligibility(workflow, facts, { now, instance: hit.instance })
    out.push({
      workflowId: workflow.id,
      workflowName: workflow.name,
      category: workflow.category,
      channel: workflow.channel,
      approval: workflow.approval,
      instanceKey: hit.instance,
      triggerReason: hit.reason,
      eligible: eligibility.ok,
      blockedBy: eligibility.reason,
      message: workflow.render(facts),
    })
  }
  return out
}

export const OUTREACH_STATUSES = Object.freeze([
  'pending_approval', // waiting for a person
  'approved', // a person approved; delivery pending
  'delivery_disabled', // rendered and recorded; delivery is switched off, nothing sent
  'delivered', // in-app message visible to the player (in_app mode only)
  'sent', // reserved for a future, separately approved email adapter
  'failed', // delivery attempted and failed; shown with the error
  'suppressed', // blocked by consent/DNC/caps at send time
  'cancelled', // facts changed before sending
])

export const CONSENT_PREFS_LINK = PREFS_LINK

// Personal templates carry "[Aaron adds ...]" placeholders. A message that
// still contains one can never be approved or delivered.
export const PLACEHOLDER = /\[[^\]]*(?:Aaron|adds|TODO)[^\]]*\]/i

// A message that starts with one of these words is a request to stop.
export const STOP_PATTERN = /^\s*(stop|unsubscribe|remove me|opt out)\b/i

export function validateMessage(message, { maxSubject = 140, maxBody = 2000, allowPlaceholders = false } = {}) {
  const subject = String(message?.subject ?? '').trim()
  const body = String(message?.body ?? '').trim()
  if (!body) return { ok: false, error: 'message body is required' }
  if (subject.length > maxSubject) return { ok: false, error: `subject must be ${maxSubject} characters or fewer` }
  if (body.length > maxBody) return { ok: false, error: `message must be ${maxBody} characters or fewer` }
  if (!allowPlaceholders && (PLACEHOLDER.test(subject) || PLACEHOLDER.test(body))) return { ok: false, error: 'replace the [placeholder] text before approving' }
  return { ok: true, subject, body }
}
