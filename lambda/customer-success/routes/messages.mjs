// Conversations and contact preferences.
//
// Read state is split: `readByPlayerAt` changes ONLY when the player reads
// their own thread (identity from their token); an admin reading a thread
// sets `readByAdminAt` only. Admin views can never mark a player's messages
// read.
//
// Players see: their own messages + outbound messages that were actually
// delivered. Outbound messages recorded while delivery is disabled are
// visible to admins as "not delivered" and never to the player.

import { contactKeyFor } from '../lib/ids.mjs'
import { consentItem, ITEM_TYPES, messageItem, pkFor, csSourceFromItems } from '../data/items.mjs'
import { effectiveConsent, STOP_PATTERN, validateMessage } from '../domain/outreach.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'

const MAX_INBOUND_PER_DAY = 10
const KEY = /^pl_[a-f0-9]{20}$/

function playerVisible(m) {
  return m.direction === 'inbound' || (m.channel === 'in_app' && m.status === 'delivered')
}

function publicMessage(m) {
  return {
    id: m.messageId,
    direction: m.direction,
    channel: m.channel,
    subject: m.subject || null,
    body: m.body,
    at: m.createdAt,
    author: m.direction === 'inbound' ? 'you' : 'Recon 6',
    read: m.direction === 'outbound' ? Boolean(m.readByPlayerAt) : true,
  }
}

export function messageRoutes({ ctx, requireUser, requireAdmin }) {
  const messagingOn = () => ctx.config.features.messaging === true

  async function contactItems(contactKey) {
    return ctx.store.listContact(pkFor(contactKey))
  }

  async function updateConsent({ contactKey, email, patch, actor }) {
    const previous = await ctx.store.get(pkFor(contactKey), ITEM_TYPES.CONSENT)
    const at = new Date(ctx.now()).toISOString()
    const next = consentItem({ contactKey, email, previous, patch, at, actor })
    await ctx.store.put(next, { expectVersion: previous?.version ?? 0 })
    const suppressing = next.relationship === 'opted_out' || next.marketing === 'opted_out' || next.doNotContact
    if (suppressing && ctx.legacy?.mirrorSuppression) {
      try {
        await ctx.legacy.mirrorSuppression(email, at, next.doNotContact ? 'do_not_contact' : 'player_opt_out')
      } catch (err) {
        ctx.log.warn?.('legacy_suppression_mirror_failed', { error: err?.name })
      }
    }
    return next
  }

  const routes = [
    // ---- customer ---------------------------------------------------------------
    {
      method: 'GET',
      path: '/cs/me/messages',
      handler: async (req) => {
        const me = await requireUser(req)
        if (!messagingOn()) throw new HttpError(404, 'messaging is not enabled')
        const items = await contactItems(contactKeyFor(me.email))
        const messages = csSourceFromItems(items).messages.filter(playerVisible).map(publicMessage)
        return json(200, { messages, unread: messages.filter((m) => !m.read).length })
      },
    },
    {
      method: 'POST',
      path: '/cs/me/messages',
      handler: async (req) => {
        const me = await requireUser(req)
        if (!messagingOn()) throw new HttpError(404, 'messaging is not enabled')
        const body = parseJsonBody(req.rawBody, { maxBytes: 6 * 1024 })
        const check = validateMessage({ subject: body.subject || null, body: body.body }, { allowPlaceholders: true })
        if (!check.ok) throw new HttpError(400, check.error)
        const contactKey = contactKeyFor(me.email)
        const now = ctx.now()
        const items = await contactItems(contactKey)
        const today = csSourceFromItems(items).messages.filter((m) => m.direction === 'inbound' && now - Date.parse(m.createdAt) < 86400000)
        if (today.length >= MAX_INBOUND_PER_DAY) throw new HttpError(429, 'message limit reached for today; email support@r6coaching.com if it is urgent')
        const at = new Date(now).toISOString()
        const item = messageItem({ contactKey, email: me.email, direction: 'inbound', channel: 'in_app', subject: check.subject || null, body: check.body, at, author: 'player' })
        await ctx.store.put(item, { ifNotExists: true })
        let suppressed = false
        if (STOP_PATTERN.test(check.body)) {
          await updateConsent({ contactKey, email: me.email, patch: { relationship: 'opted_out', marketing: 'opted_out', suppressedReason: 'player_stop_message' }, actor: 'player' })
          suppressed = true
        }
        return json(201, { ok: true, id: item.messageId, suppressed })
      },
    },
    {
      method: 'POST',
      path: '/cs/me/messages/read',
      handler: async (req) => {
        // Only the player themself: identity comes from their own token and
        // there is no way to name another contact.
        const me = await requireUser(req)
        if (!messagingOn()) throw new HttpError(404, 'messaging is not enabled')
        const contactKey = contactKeyFor(me.email)
        const at = new Date(ctx.now()).toISOString()
        const unread = csSourceFromItems(await contactItems(contactKey)).messages.filter((m) => playerVisible(m) && m.direction === 'outbound' && !m.readByPlayerAt)
        for (const m of unread) await ctx.store.update(m.pk, m.sk, { readByPlayerAt: at })
        return json(200, { ok: true, marked: unread.length })
      },
    },
    {
      method: 'GET',
      path: '/cs/me/contact-preferences',
      handler: async (req) => {
        const me = await requireUser(req)
        const item = await ctx.store.get(pkFor(contactKeyFor(me.email)), ITEM_TYPES.CONSENT)
        return json(200, effectiveConsent(item))
      },
    },
    {
      method: 'PUT',
      path: '/cs/me/contact-preferences',
      handler: async (req) => {
        const me = await requireUser(req)
        const body = parseJsonBody(req.rawBody, { maxBytes: 1024 })
        const patch = {}
        if (body.marketing !== undefined) {
          if (!['opted_in', 'opted_out'].includes(body.marketing)) throw new HttpError(400, 'marketing must be opted_in or opted_out')
          patch.marketing = body.marketing
        }
        if (body.relationship !== undefined) {
          if (!['subscribed', 'opted_out'].includes(body.relationship)) throw new HttpError(400, 'relationship must be subscribed or opted_out')
          patch.relationship = body.relationship
        }
        if (!Object.keys(patch).length) throw new HttpError(400, 'nothing to update')
        try {
          const next = await updateConsent({ contactKey: contactKeyFor(me.email), email: me.email, patch, actor: 'player' })
          return json(200, effectiveConsent(next))
        } catch (err) {
          if (err?.name === 'ConditionalCheckFailedException') throw new HttpError(409, 'preferences changed at the same time; try again')
          throw err
        }
      },
    },

    // ---- admin ------------------------------------------------------------------
    {
      method: 'GET',
      path: '/cs/admin/conversations',
      handler: async (req) => {
        await requireAdmin(req)
        const recent = await ctx.store.listByType(ITEM_TYPES.MESSAGE, { limit: 1000 })
        const threads = new Map()
        for (const m of recent) {
          const t = threads.get(m.contactKey) || { key: m.contactKey, email: m.email, lastAt: m.createdAt, lastPreview: m.bodyPreview, lastDirection: m.direction, unreadForAdmin: 0, waitingSince: null, count: 0, undelivered: 0 }
          t.count += 1
          if (m.createdAt > t.lastAt) Object.assign(t, { lastAt: m.createdAt, lastPreview: m.bodyPreview, lastDirection: m.direction })
          if (m.direction === 'inbound' && !m.readByAdminAt) t.unreadForAdmin += 1
          if (m.direction === 'inbound' && !m.answeredAt && (!t.waitingSince || m.createdAt < t.waitingSince)) t.waitingSince = m.createdAt
          if (m.direction === 'outbound' && m.status === 'delivery_disabled') t.undelivered += 1
          threads.set(m.contactKey, t)
        }
        const list = [...threads.values()].sort((a, b) => (b.unreadForAdmin - a.unreadForAdmin) || String(b.lastAt).localeCompare(String(a.lastAt)))
        return json(200, { threads: list, deliveryMode: ctx.delivery?.mode || 'disabled' })
      },
    },
    {
      method: 'GET',
      path: '/cs/admin/conversations/{key}',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        if (!KEY.test(req.params.key)) throw new HttpError(400, 'invalid player key')
        const items = await contactItems(req.params.key)
        const cs = csSourceFromItems(items)
        const at = new Date(ctx.now()).toISOString()
        // Admin-side read marker only. Never touches readByPlayerAt.
        for (const m of cs.messages.filter((x) => x.direction === 'inbound' && !x.readByAdminAt)) {
          await ctx.store.update(m.pk, m.sk, { readByAdminAt: at, readByAdmin: admin.email })
        }
        return json(200, {
          key: req.params.key,
          email: cs.messages[0]?.email || null,
          messages: cs.messages.map((m) => ({ ...publicMessage(m), author: m.direction === 'inbound' ? 'player' : m.author, status: m.status, visibleToPlayer: playerVisible(m), readByPlayerAt: m.readByPlayerAt || null, answeredAt: m.answeredAt || null })),
          consent: effectiveConsent(cs.consent),
          deliveryMode: ctx.delivery?.mode || 'disabled',
        })
      },
    },
    {
      method: 'POST',
      path: '/cs/admin/conversations/{key}/reply',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        if (!KEY.test(req.params.key)) throw new HttpError(400, 'invalid player key')
        const body = parseJsonBody(req.rawBody, { maxBytes: 8 * 1024 })
        const channel = body.channel === 'email' ? 'email' : 'in_app'
        const check = validateMessage({ subject: body.subject || null, body: body.body })
        if (!check.ok) throw new HttpError(400, check.error)
        const items = await contactItems(req.params.key)
        const cs = csSourceFromItems(items)
        const email = cs.messages[0]?.email || body.email || null
        if (!email) throw new HttpError(404, 'no conversation for this player')
        if (contactKeyFor(email) !== req.params.key) throw new HttpError(400, 'player key mismatch')
        const consent = effectiveConsent(cs.consent)
        if (consent.doNotContact) throw new HttpError(409, 'this player is marked do-not-contact')
        const delivery = ctx.delivery
        const result = await delivery.deliver({ contactKey: req.params.key, email, channel, subject: check.subject, body: check.body, author: `admin:${admin.email}` })
        const at = new Date(ctx.now()).toISOString()
        if (result.status !== 'delivered') {
          // Record the reply so the thread and audit are complete even though
          // nothing reached the player.
          await ctx.store.put(messageItem({ contactKey: req.params.key, email, direction: 'outbound', channel, subject: check.subject, body: check.body, at, author: `admin:${admin.email}`, status: result.status }))
        }
        for (const m of cs.messages.filter((x) => x.direction === 'inbound' && !x.answeredAt)) {
          await ctx.store.update(m.pk, m.sk, { answeredAt: at, answeredBy: admin.email })
        }
        return json(201, { ok: true, status: result.status, statusReason: result.statusReason })
      },
    },
    {
      method: 'PUT',
      path: '/cs/admin/players/{key}/contact',
      handler: async (req) => {
        const admin = await requireAdmin(req)
        if (!KEY.test(req.params.key)) throw new HttpError(400, 'invalid player key')
        const body = parseJsonBody(req.rawBody, { maxBytes: 1024 })
        if (typeof body.doNotContact !== 'boolean') throw new HttpError(400, 'doNotContact must be true or false')
        const email = String(body.email || '').trim().toLowerCase()
        if (!email || contactKeyFor(email) !== req.params.key) throw new HttpError(400, 'email does not match this player')
        const reason = String(body.reason || '').trim().slice(0, 300) || null
        const next = await updateConsent({ contactKey: req.params.key, email, patch: { doNotContact: body.doNotContact, suppressedReason: body.doNotContact ? reason || 'admin_do_not_contact' : null }, actor: `admin:${admin.email}` })
        const at = new Date(ctx.now()).toISOString()
        await ctx.store.put({ pk: pkFor(req.params.key), sk: `${ITEM_TYPES.AUDIT}#${at}#contact`, type: ITEM_TYPES.AUDIT, contactKey: req.params.key, action: body.doNotContact ? 'contact.dnc_on' : 'contact.dnc_off', actor: admin.email, at, detail: { reason }, gsi1pk: ITEM_TYPES.AUDIT, gsi1sk: `${at}#${req.params.key}` })
        return json(200, effectiveConsent(next))
      },
    },
  ]

  // Home: unread messages summary (only what the player can actually see).
  async function homeHook({ identity }) {
    if (!messagingOn()) return {}
    const cs = csSourceFromItems(await contactItems(contactKeyFor(identity.email)))
    const visible = cs.messages.filter(playerVisible)
    const unread = visible.filter((m) => m.direction === 'outbound' && !m.readByPlayerAt)
    const latest = visible[visible.length - 1]
    return { messages: { enabled: true, unread: unread.length, total: visible.length, latest: latest ? publicMessage(latest) : null } }
  }

  return { routes, homeHook }
}
