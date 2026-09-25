// Outreach engine routes and the action-queue approval hook.
//
// Nothing here sends email. Every record goes through the delivery adapter,
// which is disabled by default (status "delivery_disabled"). Runs are
// idempotent: the record key is workflow + occurrence, written with a
// conditional put, so a retried or overlapping run can never double-send.

import { buildFacts } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { checkEligibility, effectiveConsent, evaluateOutreach, validateMessage, WORKFLOW_BY_ID, WORKFLOWS, workflowForQueueType, FREQUENCY } from '../domain/outreach.mjs'
import { buildPlayerSummary } from '../domain/playerRecord.mjs'
import { assembleDirectory } from '../data/assemble.mjs'
import { ITEM_TYPES, outreachItem, pkFor } from '../data/items.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'

// Consent re-read at the moment of sending. Eligibility was computed from a
// snapshot; a player may have opted out (or an admin set do-not-contact)
// since then.
async function blockedAtSendTime(ctx, contactKey, workflow) {
  let item
  try {
    item = await ctx.store.get(pkFor(contactKey), ITEM_TYPES.CONSENT)
  } catch {
    return 'contact_state_unavailable'
  }
  const consent = effectiveConsent(item)
  if (consent.doNotContact) return 'do_not_contact'
  if (workflow.category === 'relationship' && consent.relationship === 'opted_out') return 'opted_out'
  if (workflow.category === 'marketing' && consent.marketing !== 'opted_in') return 'no_marketing_consent'
  return null
}

async function createAndDeliver(ctx, { contactKey, email, workflow, instanceKey, message, triggerReason, actor, queueItemKey = null, initialStatus = 'approved' }) {
  const at = new Date(ctx.now()).toISOString()
  const record = outreachItem({ contactKey, email, workflow, instanceKey, status: initialStatus, message, triggerReason, at, actor, queueItemKey })
  try {
    await ctx.store.put(record, { ifNotExists: true })
  } catch (err) {
    if (err?.name === 'ConditionalCheckFailedException') return { skipped: 'already_recorded', outreachKey: record.outreachKey }
    throw err
  }
  if (initialStatus === 'pending_approval') return { status: 'pending_approval', outreachKey: record.outreachKey }
  let result
  const blocked = await blockedAtSendTime(ctx, contactKey, workflow)
  if (blocked) result = { status: 'suppressed', statusReason: blocked }
  else {
    try {
      result = await ctx.delivery.deliver({ contactKey, email, channel: workflow.channel, subject: message.subject, body: message.body, workflowId: workflow.id, outreachKey: record.outreachKey, author: actor })
    } catch (err) {
      result = { status: 'failed', statusReason: err?.name || 'delivery_error' }
    }
  }
  const doneAt = new Date(ctx.now()).toISOString()
  await ctx.store.update(record.pk, record.sk, {
    status: result.status,
    statusReason: result.statusReason || null,
    updatedAt: doneAt,
    history: [...record.history, { at: doneAt, status: result.status, reason: result.statusReason || null, actor: 'delivery' }],
  })
  return { status: result.status, statusReason: result.statusReason || null, outreachKey: record.outreachKey }
}

export function outreachRoutes({ ctx, requireAdmin }) {
  async function evaluateAll() {
    const now = ctx.now()
    const dir = await assembleDirectory({ tables: ctx.tables, store: ctx.store, log: ctx.log })
    return dir.contacts.map((contact) => {
      const facts = buildFacts({ now, catalog: ctx.catalog, config: ctx.config, identity: contact.identity, sources: contact.sources })
      const lifecycle = deriveLifecycle(facts, now)
      return { contact, facts, lifecycle, summary: buildPlayerSummary(contact, facts, lifecycle), candidates: evaluateOutreach(facts, lifecycle, { now }) }
    })
  }

  const routes = [
    {
      method: 'GET',
      path: '/cs/admin/outreach',
      handler: async (req) => {
        await requireAdmin(req)
        const records = await ctx.store.listByType(ITEM_TYPES.OUTREACH, { limit: 500 })
        const byStatus = {}
        for (const r of records) byStatus[r.status] = (byStatus[r.status] || 0) + 1
        return json(200, {
          deliveryMode: ctx.delivery?.mode || 'disabled',
          emailEnabled: false,
          frequency: FREQUENCY,
          workflows: WORKFLOWS.map((w) => ({ id: w.id, name: w.name, category: w.category, channel: w.channel || null, approval: w.approval || null, owner: w.owner || 'customer_success', maxSends: w.maxSends || null, cooldownDays: w.cooldownDays || null, description: w.description })),
          records: records.map((r) => ({
            key: r.outreachKey,
            player: r.contactKey,
            email: r.email,
            workflowId: r.workflowId,
            workflowName: r.workflowName,
            category: r.category,
            channel: r.channel,
            status: r.status,
            statusReason: r.statusReason,
            subject: r.subject,
            body: r.body,
            triggerReason: r.triggerReason,
            actor: r.actor,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
          byStatus,
          failures: records.filter((r) => r.status === 'failed').length,
        })
      },
    },
    {
      method: 'POST',
      path: '/cs/admin/outreach/run',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        const body = parseJsonBody(req.rawBody, { maxBytes: 512 })
        const dryRun = body.dryRun !== false
        const evaluated = await evaluateAll()
        const plan = []
        for (const e of evaluated) {
          if (e.facts.identity.isAdmin) continue
          for (const c of e.candidates) {
            plan.push({ player: e.contact.contactKey, name: e.summary.name || e.summary.email, workflowId: c.workflowId, workflowName: c.workflowName, instanceKey: c.instanceKey, category: c.category, channel: c.channel, approval: c.approval, eligible: c.eligible, blockedBy: c.blockedBy, triggerReason: c.triggerReason, message: c.message })
          }
        }
        // Eligibility was computed once, before any writes, so it cannot see
        // what this run itself sends. Enforce the 72-hour cap inside the run:
        // at most one non-service message per player per run (the rest wait
        // for a later run, when the cap is re-checked from recorded sends).
        const perRun = new Set()
        const planned = []
        for (const item of plan) {
          if (item.eligible && item.category !== 'service' && perRun.has(item.player)) {
            planned.push({ ...item, eligible: false, blockedBy: 'frequency_cap_72h' })
            continue
          }
          if (item.eligible && item.category !== 'service') perRun.add(item.player)
          planned.push(item)
        }
        if (dryRun) return json(200, { dryRun: true, deliveryMode: ctx.delivery.mode, plan: planned })
        const results = []
        for (const item of planned.filter((p) => p.eligible)) {
          const e = evaluated.find((x) => x.contact.contactKey === item.player)
          const workflow = WORKFLOW_BY_ID[item.workflowId]
          const res = await createAndDeliver(ctx, {
            contactKey: item.player,
            email: e.contact.email,
            workflow,
            instanceKey: item.instanceKey,
            message: item.message,
            triggerReason: item.triggerReason,
            actor: `run:${admin.email}`,
          })
          results.push({ player: item.player, workflowId: item.workflowId, ...res })
        }
        return json(200, { dryRun: false, deliveryMode: ctx.delivery.mode, results, blocked: planned.filter((p) => !p.eligible).map(({ message: _m, ...rest }) => rest) })
      },
    },
  ]

  // Runs before the decision is written: an approval that could not produce
  // a valid, allowed message is refused with the reason.
  async function decisionPrecheck({ item, decision, message, facts }) {
    if (decision !== 'approve') return
    const workflow = workflowForQueueType(item.type)
    if (!workflow) return
    const eligibility = checkEligibility(workflow, facts, { now: ctx.now(), instance: item.key })
    if (!eligibility.ok) throw new HttpError(409, `cannot approve: ${eligibility.reason.replace(/_/g, ' ')}`, eligibility.reason)
    const check = validateMessage(message || workflow.render(facts))
    if (!check.ok) throw new HttpError(400, check.error, 'invalid_message')
  }

  // Approve on a queue item -> an outreach record for the matching workflow,
  // using the (possibly edited) draft the admin approved.
  async function decisionHook({ admin, item, decision, message, entry, facts }) {
    if (decision !== 'approve') return []
    const workflow = workflowForQueueType(item.type)
    if (!workflow) return []
    const check = validateMessage(message || workflow.render(facts))
    if (!check.ok) throw new HttpError(400, check.error)
    const res = await createAndDeliver(ctx, {
      contactKey: entry.contact.contactKey,
      email: entry.contact.email,
      workflow,
      instanceKey: item.key,
      message: { subject: check.subject, body: check.body },
      triggerReason: item.title,
      actor: `admin:${admin.email}`,
      queueItemKey: item.key,
    })
    return [{ outreach: res.status || res.skipped, outreachKey: res.outreachKey, statusReason: res.statusReason || null }]
  }

  return { routes, decisionHook, decisionPrecheck }
}
