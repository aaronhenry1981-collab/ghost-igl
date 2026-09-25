// Admin (CRM) routes. Every route requires the Cognito "admins" group.
//
// "View as player" is GET /cs/admin/players/{key}/home-preview: it builds the
// player's home projection and performs NO writes, so an admin looking at a
// player's view can never mark their messages read, dismiss their prompts or
// touch any customer state.

import { buildFacts, normalizeEmail } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { buildHomeView } from '../domain/home.mjs'
import { buildPlayerRecord, buildPlayerSummary } from '../domain/playerRecord.mjs'
import { buildQueue, DECISIONS, queueItemsFor } from '../domain/actionQueue.mjs'
import { buildOverview } from '../domain/overview.mjs'
import { buildTimeline } from '../domain/timeline.mjs'
import { assembleDirectory, assembleOne } from '../data/assemble.mjs'
import { ITEM_TYPES, pkFor } from '../data/items.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'

const KEY = /^pl_[a-f0-9]{20}$/
const ITEM_KEY = /^[a-z_]{3,40}:pl_[a-f0-9]{20}:[A-Za-z0-9_.:#@+-]{1,120}$/

export function adminRoutes({ ctx, requireAdmin }) {
  let cache = null

  async function directory() {
    const ttl = ctx.config.directoryCacheMs ?? 20000
    const now = ctx.now()
    if (cache && ttl > 0 && now - cache.at < ttl) return cache.value
    const dir = await assembleDirectory({ tables: ctx.tables, store: ctx.store, log: ctx.log })
    const entries = dir.contacts.map((contact) => {
      const facts = buildFacts({ now, catalog: ctx.catalog, config: ctx.config, identity: contact.identity, sources: contact.sources })
      const lifecycle = deriveLifecycle(facts, now)
      return { contact, facts, lifecycle, summary: buildPlayerSummary(contact, facts, lifecycle) }
    })
    const value = { entries, sourceStatus: dir.sourceStatus, now }
    cache = { at: now, value }
    return value
  }

  function invalidate() {
    cache = null
  }

  async function findEntry(key) {
    if (!KEY.test(String(key || ''))) throw new HttpError(400, 'invalid player key')
    const dir = await directory()
    const entry = dir.entries.find((e) => e.contact.contactKey === key)
    if (!entry) throw new HttpError(404, 'player not found')
    return entry
  }

  async function detail(entry) {
    const now = ctx.now()
    const one = await assembleOne({ tables: ctx.tables, store: ctx.store, email: entry.contact.email, withCognito: true, log: ctx.log })
    const facts = buildFacts({ now, catalog: ctx.catalog, config: ctx.config, identity: one.identity, sources: one.sources })
    return { one, facts, lifecycle: deriveLifecycle(facts, now) }
  }

  const matches = (summary, q) => {
    if (!q) return true
    const needle = q.toLowerCase()
    return [summary.email, summary.name, summary.displayName].some((v) => String(v || '').toLowerCase().includes(needle))
  }

  const VIEWS = {
    all: () => true,
    onboarding: (s) => ['signed_up', 'activating'].includes(s.stage) || (s.hasAccess && !s.activation.complete),
    activity: () => true,
    billing: (s) => s.plan !== 'free' || ['churned', 'at_risk'].includes(s.stage),
  }

  return {
    routes: [
      {
        method: 'GET',
        path: '/cs/admin/overview',
        handler: async (req) => {
          await requireAdmin(req)
          const dir = await directory()
          const queue = buildQueue(dir.entries, dir.now)
          return json(200, buildOverview(dir.entries, { now: dir.now, queue, sourceStatus: dir.sourceStatus }))
        },
      },
      {
        method: 'GET',
        path: '/cs/admin/players',
        handler: async (req) => {
          await requireAdmin(req)
          const dir = await directory()
          const q = String(req.query.q || '').trim().slice(0, 100)
          const view = VIEWS[req.query.view] ? req.query.view : 'all'
          let players = dir.entries.filter((e) => !e.facts.identity.isAdmin).map((e) => e.summary)
          players = players.filter(VIEWS[view]).filter((s) => matches(s, q))
          for (const [param, field] of [['stage', 'stage'], ['health', 'health'], ['plan', 'plan']]) {
            if (req.query[param]) players = players.filter((s) => s[field] === req.query[param])
          }
          const sort = view === 'activity' ? 'lastActiveAt' : 'createdAt'
          players.sort((a, b) => String(b[sort] || '').localeCompare(String(a[sort] || '')))
          return json(200, { players, total: players.length, view, sourceStatus: dir.sourceStatus })
        },
      },
      {
        method: 'GET',
        path: '/cs/admin/players/{key}',
        handler: async (req) => {
          await requireAdmin(req)
          const entry = await findEntry(req.params.key)
          const { one, facts, lifecycle } = await detail(entry)
          const rows = one.sources.billing.status === 'ok' ? one.sources.billing.data || [] : []
          const bookings = (one.sources.bookings.data?.bookings || [])
            .filter((b) => normalizeEmail(b?.customer?.email) === entry.contact.email)
            .map((b) => ({ slotId: b.slotId, status: b.status, type: b.coachingType || null, label: b.sessionType || null, payment: b.payment?.status || null, createdAt: b.createdAt || null }))
          const timeline = buildTimeline({
            facts,
            rows,
            cognito: one.cognitoUser,
            profile: one.sources.profile.data,
            bookings,
            playerEvents: one.sources.player.data?.events || [],
            legacy: one.sources.legacyCrm.data,
            cs: one.sources.cs.data,
          })
          const homePreview = buildHomeView(facts, { mode: 'preview' })
          homePreview.lifecycle = null
          const record = buildPlayerRecord(entry.contact, facts, lifecycle, { rows, cognitoUsers: entry.contact.cognitoUsers, timeline, homePreview, bookings })
          record.queue = queueItemsFor(record.summary, facts, lifecycle, ctx.now()).filter((i) => !facts.cs.decisions.some((d) => d.itemKey === i.key))
          return json(200, record)
        },
      },
      {
        method: 'GET',
        path: '/cs/admin/players/{key}/home-preview',
        handler: async (req) => {
          await requireAdmin(req)
          const entry = await findEntry(req.params.key)
          const { facts } = await detail(entry)
          const view = buildHomeView(facts, { mode: 'preview' })
          view.lifecycle = null
          return json(200, view)
        },
      },
      {
        method: 'GET',
        path: '/cs/admin/queue',
        handler: async (req) => {
          await requireAdmin(req)
          const dir = await directory()
          return json(200, buildQueue(dir.entries, dir.now))
        },
      },
      {
        method: 'POST',
        path: '/cs/admin/queue/decision',
        handler: async (req) => {
          const admin = await requireAdmin(req)
          const body = parseJsonBody(req.rawBody, { maxBytes: 4096 })
          const itemKey = String(body.itemKey || '')
          const decision = String(body.decision || '')
          const note = body.note === undefined || body.note === null ? null : String(body.note).trim().slice(0, 1000) || null
          if (!ITEM_KEY.test(itemKey)) throw new HttpError(400, 'invalid itemKey')
          if (!DECISIONS.includes(decision)) throw new HttpError(400, `decision must be one of ${DECISIONS.join(', ')}`)
          const contactKey = itemKey.split(':')[1]
          const entry = await findEntry(contactKey)
          // The item must exist right now; decisions can't be written for
          // made-up keys or for issues that already resolved themselves.
          const { facts, lifecycle } = await detail(entry)
          const item = queueItemsFor(entry.summary, facts, lifecycle, ctx.now()).find((i) => i.key === itemKey)
          if (!item) throw new HttpError(404, 'queue item no longer exists (it may have resolved)')
          if (!item.controls.includes(decision)) throw new HttpError(400, `"${decision}" is not available for this item`)
          const decidedAt = new Date(ctx.now()).toISOString()
          const record = {
            pk: pkFor(contactKey),
            sk: `${ITEM_TYPES.DECISION}#${itemKey}`,
            type: ITEM_TYPES.DECISION,
            contactKey,
            email: entry.contact.email,
            itemKey,
            itemType: item.type,
            itemTitle: item.title,
            decision,
            note,
            actor: admin.email,
            decidedAt,
            gsi1pk: ITEM_TYPES.DECISION,
            gsi1sk: `${decidedAt}#${contactKey}`,
          }
          try {
            await ctx.store.put(record, { ifNotExists: true })
          } catch (err) {
            if (err?.name === 'ConditionalCheckFailedException') throw new HttpError(409, 'this item was already decided')
            throw err
          }
          await ctx.store.put({
            pk: pkFor(contactKey),
            sk: `${ITEM_TYPES.AUDIT}#${decidedAt}#${itemKey}`,
            type: ITEM_TYPES.AUDIT,
            contactKey,
            action: `queue.${decision}`,
            actor: admin.email,
            at: decidedAt,
            detail: { itemKey, itemType: item.type, note },
            gsi1pk: ITEM_TYPES.AUDIT,
            gsi1sk: `${decidedAt}#${contactKey}`,
          })
          const effects = []
          for (const hook of ctx.decisionHooks || []) effects.push(...((await hook({ admin, item, decision, note, entry, facts })) || []))
          invalidate()
          return json(200, { ok: true, decision: { itemKey, decision, decidedAt, actor: admin.email }, effects })
        },
      },
    ],
  }
}
