// In-product feedback (player) and feedback / reviews / referrals (admin).
//
// Duplicate prevention: one response per moment occurrence (conditional put
// on FB#m#<momentKey>); a moment can only be answered while it is due or on
// screen; answered or dismissed moments are never prompted again.
// Reviews: permission is captured in the answer; approving a review only
// records the decision and returns a draft. Publishing stays manual.

import { contactKeyFor } from '../lib/ids.mjs'
import { ITEM_TYPES, pkFor } from '../data/items.mjs'
import { assembleDirectory } from '../data/assemble.mjs'
import { buildFacts } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { buildPlayerSummary } from '../domain/playerRecord.mjs'
import { analyzeFeedback, MOMENT_BY_ID, selectFeedbackPrompt, SNOOZE_DAYS, validateAnswers } from '../domain/feedback.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'

const MOMENT_KEY = /^[a-z0-9_]{3,30}#[A-Za-z0-9:.T_-]{1,40}$/
const KEY = /^pl_[a-f0-9]{20}$/

export function feedbackRoutes({ ctx, requireUser, requireAdmin }) {
  const feedbackOn = () => ctx.config.features.feedback === true

  function promptSk(momentKey) {
    return `${ITEM_TYPES.PROMPT}#${momentKey}`
  }

  async function currentPrompt(identity) {
    const { facts, lifecycle } = await ctx.factsFor(identity)
    return { facts, prompt: selectFeedbackPrompt(facts, lifecycle, { now: ctx.now() }) }
  }

  async function setPrompt(contactKey, email, momentKey, patch) {
    const existing = await ctx.store.get(pkFor(contactKey), promptSk(momentKey))
    const at = new Date(ctx.now()).toISOString()
    await ctx.store.put({
      ...(existing || {}),
      pk: pkFor(contactKey),
      sk: promptSk(momentKey),
      type: ITEM_TYPES.PROMPT,
      contactKey,
      email,
      momentKey,
      momentId: momentKey.split('#')[0],
      ...patch,
      updatedAt: at,
    })
  }

  function parseMomentKey(raw) {
    const key = String(raw || '')
    if (!MOMENT_KEY.test(key) || !MOMENT_BY_ID[key.split('#')[0]]) throw new HttpError(400, 'invalid momentKey')
    return key
  }

  async function allowedMoment(identity, momentKey) {
    const contactKey = contactKeyFor(identity.email)
    const existing = await ctx.store.get(pkFor(contactKey), promptSk(momentKey))
    if (existing && ['answered', 'dismissed'].includes(existing.status)) throw new HttpError(409, 'this question was already answered')
    if (existing?.status === 'shown' || existing?.status === 'snoozed') return { contactKey, existing }
    const { prompt } = await currentPrompt(identity)
    if (prompt?.momentKey !== momentKey) throw new HttpError(409, 'this question is not open right now')
    return { contactKey, existing }
  }

  const routes = [
    {
      method: 'POST',
      path: '/cs/me/feedback/seen',
      handler: async (req) => {
        const me = await requireUser(req)
        if (!feedbackOn()) throw new HttpError(404, 'feedback is not enabled')
        const momentKey = parseMomentKey(parseJsonBody(req.rawBody, { maxBytes: 512 }).momentKey)
        const { contactKey, existing } = await allowedMoment(me, momentKey)
        if (!existing || existing.status !== 'shown') {
          await setPrompt(contactKey, me.email, momentKey, { status: 'shown', shownAt: existing?.shownAt || new Date(ctx.now()).toISOString(), snoozeCount: existing?.snoozeCount || 0 })
        }
        return json(200, { ok: true })
      },
    },
    {
      method: 'POST',
      path: '/cs/me/feedback',
      handler: async (req) => {
        const me = await requireUser(req)
        if (!feedbackOn()) throw new HttpError(404, 'feedback is not enabled')
        const body = parseJsonBody(req.rawBody, { maxBytes: 8 * 1024 })
        const momentKey = parseMomentKey(body.momentKey)
        const { contactKey } = await allowedMoment(me, momentKey)
        const momentId = momentKey.split('#')[0]
        const check = validateAnswers(momentId, body.answers)
        if (!check.ok) throw new HttpError(400, check.error)
        const at = new Date(ctx.now()).toISOString()
        const feedbackId = `fb_${Date.parse(at).toString(36)}${Math.random().toString(36).slice(2, 7)}`
        try {
          await ctx.store.put({
            pk: pkFor(contactKey),
            sk: `${ITEM_TYPES.FEEDBACK}#m#${momentKey}`,
            type: ITEM_TYPES.FEEDBACK,
            contactKey,
            email: me.email,
            feedbackId,
            moment: momentId,
            momentKey,
            answers: check.answers,
            status: 'open',
            createdAt: at,
            gsi1pk: ITEM_TYPES.FEEDBACK,
            gsi1sk: `${at}#${contactKey}`,
          }, { ifNotExists: true })
        } catch (err) {
          if (err?.name === 'ConditionalCheckFailedException') throw new HttpError(409, 'this question was already answered')
          throw err
        }
        await setPrompt(contactKey, me.email, momentKey, { status: 'answered', answeredAt: at })
        return json(201, { ok: true, feedbackId })
      },
    },
    {
      method: 'POST',
      path: '/cs/me/feedback/dismiss',
      handler: async (req) => {
        const me = await requireUser(req)
        if (!feedbackOn()) throw new HttpError(404, 'feedback is not enabled')
        const body = parseJsonBody(req.rawBody, { maxBytes: 512 })
        const momentKey = parseMomentKey(body.momentKey)
        const action = body.action === 'snooze' ? 'snooze' : 'dismiss'
        const { contactKey, existing } = await allowedMoment(me, momentKey)
        const snoozes = existing?.snoozeCount || 0
        if (action === 'snooze' && snoozes < 1) {
          await setPrompt(contactKey, me.email, momentKey, { status: 'snoozed', snoozeCount: snoozes + 1, snoozedUntil: new Date(ctx.now() + SNOOZE_DAYS * 86400000).toISOString(), shownAt: existing?.shownAt || new Date(ctx.now()).toISOString() })
          return json(200, { ok: true, status: 'snoozed' })
        }
        await setPrompt(contactKey, me.email, momentKey, { status: 'dismissed', dismissedAt: new Date(ctx.now()).toISOString(), shownAt: existing?.shownAt || new Date(ctx.now()).toISOString() })
        return json(200, { ok: true, status: 'dismissed' })
      },
    },

    // ---- admin ------------------------------------------------------------------
    {
      method: 'GET',
      path: '/cs/admin/feedback',
      handler: async (req) => {
        await requireAdmin(req)
        const items = await ctx.store.listByType(ITEM_TYPES.FEEDBACK, { limit: 1000 })
        const names = await playerNames()
        const responses = items.map((f) => ({
          feedbackId: f.feedbackId,
          player: { key: f.contactKey, name: names.get(f.contactKey)?.name || f.email, planLabel: names.get(f.contactKey)?.planLabel || null },
          moment: f.moment,
          answers: f.answers,
          status: f.status,
          resolvedAt: f.resolvedAt || null,
          resolutionNote: f.resolutionNote || null,
          reviewDecision: f.reviewDecision || null,
          createdAt: f.createdAt,
        }))
        return json(200, { ...analyzeFeedback(responses), list: responses })
      },
    },
    {
      method: 'POST',
      path: '/cs/admin/feedback/resolve',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        const body = parseJsonBody(req.rawBody, { maxBytes: 2048 })
        const item = await findFeedback(body.player, body.feedbackId)
        const at = new Date(ctx.now()).toISOString()
        await ctx.store.update(item.pk, item.sk, { status: 'resolved', resolvedAt: at, resolvedBy: admin.email, resolutionNote: String(body.note || '').trim().slice(0, 1000) || null })
        await audit(item.contactKey, 'feedback.resolve', admin.email, { feedbackId: item.feedbackId })
        return json(200, { ok: true })
      },
    },
    {
      method: 'GET',
      path: '/cs/admin/reviews',
      handler: async (req) => {
        await requireAdmin(req)
        const [items, names, referrals, testimonials] = await Promise.all([
          ctx.store.listByType(ITEM_TYPES.FEEDBACK, { limit: 1000 }),
          playerNames(),
          ctx.tables.scanReferrals().then((rows) => ({ status: 'ok', rows })).catch((err) => ({ status: err?.name === 'NotConnectedError' ? 'not_connected' : 'unavailable', rows: [] })),
          ctx.tables.listTestimonials().then((rows) => ({ status: 'ok', rows })).catch((err) => ({ status: err?.name === 'NotConnectedError' ? 'not_connected' : 'unavailable', rows: [] })),
        ])
        const candidates = items
          .filter((f) => f.answers?.review?.mayRequest || f.answers?.review?.mayPublishQuote)
          .map((f) => ({
            feedbackId: f.feedbackId,
            player: { key: f.contactKey, name: names.get(f.contactKey)?.name || f.email, planLabel: names.get(f.contactKey)?.planLabel || null, rank: names.get(f.contactKey)?.rank || null },
            moment: f.moment,
            review: f.answers.review,
            helpful: f.answers.helpful ?? null,
            nps: f.answers.nps ?? null,
            decision: f.reviewDecision || null,
            createdAt: f.createdAt,
          }))
        const byReferrer = new Map()
        for (const r of referrals.rows) {
          const k = String(r.referrer_email || '').toLowerCase()
          const entry = byReferrer.get(k) || { referrer: k, total: 0, pending: 0, active: 0, churned: 0 }
          entry.total += 1
          if (r.status === 'pending') entry.pending += 1
          else if (r.status === 'active') entry.active += 1
          else if (r.status === 'churned' || r.status === 'refunded') entry.churned += 1
          byReferrer.set(k, entry)
        }
        return json(200, {
          candidates,
          referrals: { status: referrals.status, total: referrals.rows.length, referrers: [...byReferrer.values()].sort((a, b) => b.total - a.total) },
          testimonials: { status: testimonials.status, published: testimonials.rows.length },
          notes: [
            'Approving a review records the decision and gives you a draft. Publishing stays manual in Admin → Content → Testimonials.',
            'Only quotes the player explicitly allowed us to publish can be approved; never add a tier badge that is not backed by a paid subscription.',
          ],
        })
      },
    },
    {
      method: 'POST',
      path: '/cs/admin/reviews/decision',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        const body = parseJsonBody(req.rawBody, { maxBytes: 2048 })
        const decision = body.decision === 'approve' ? 'approve' : body.decision === 'decline' ? 'decline' : null
        if (!decision) throw new HttpError(400, 'decision must be approve or decline')
        const item = await findFeedback(body.player, body.feedbackId)
        if (item.reviewDecision) throw new HttpError(409, 'this review was already decided')
        const review = item.answers?.review
        if (decision === 'approve' && !review?.mayPublishQuote) throw new HttpError(409, 'the player did not give permission to publish a quote')
        const at = new Date(ctx.now()).toISOString()
        const reviewDecision = { decision, at, actor: admin.email, note: String(body.note || '').trim().slice(0, 500) || null }
        await ctx.store.update(item.pk, item.sk, { reviewDecision })
        await audit(item.contactKey, `review.${decision}`, admin.email, { feedbackId: item.feedbackId })
        const names = await playerNames()
        return json(200, {
          ok: true,
          reviewDecision,
          testimonialDraft: decision === 'approve'
            ? { name: review.displayName || 'Recon 6 player', text: review.quote, rank: names.get(item.contactKey)?.rank || null, tier: null }
            : null,
        })
      },
    },
  ]

  async function findFeedback(player, feedbackId) {
    if (!KEY.test(String(player || ''))) throw new HttpError(400, 'invalid player key')
    const items = await ctx.store.listContact(pkFor(player))
    const item = items.find((i) => i.type === ITEM_TYPES.FEEDBACK && i.feedbackId === feedbackId)
    if (!item) throw new HttpError(404, 'feedback not found')
    return item
  }

  async function audit(contactKey, action, actor, detail) {
    const at = new Date(ctx.now()).toISOString()
    await ctx.store.put({ pk: pkFor(contactKey), sk: `${ITEM_TYPES.AUDIT}#${at}#${action}`, type: ITEM_TYPES.AUDIT, contactKey, action, actor, at, detail, gsi1pk: ITEM_TYPES.AUDIT, gsi1sk: `${at}#${contactKey}` })
  }

  async function playerNames() {
    const now = ctx.now()
    const dir = await assembleDirectory({ tables: ctx.tables, store: null, log: ctx.log })
    const map = new Map()
    for (const contact of dir.contacts) {
      const facts = buildFacts({ now, catalog: ctx.catalog, config: ctx.config, identity: contact.identity, sources: contact.sources })
      const summary = buildPlayerSummary(contact, facts, deriveLifecycle(facts, now))
      map.set(contact.contactKey, { name: summary.name || summary.displayName || summary.email, planLabel: summary.planLabel, rank: summary.rank })
    }
    return map
  }

  async function homeHook({ identity, facts, lifecycle }) {
    if (!feedbackOn()) return {}
    return { feedbackPrompt: selectFeedbackPrompt(facts, lifecycle, { now: ctx.now() }) }
  }

  return { routes, homeHook }
}
