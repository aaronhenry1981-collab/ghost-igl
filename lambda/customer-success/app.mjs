// Recon 6 customer-success API: the SDK-free application core.
//
// createApp() receives every dependency (tables, store, authenticate, clock,
// config) so tests and the local dev server run the exact production code
// against in-memory data. index.mjs wires the AWS implementations.

import { buildFacts } from './domain/facts.mjs'
import { buildHomeView } from './domain/home.mjs'
import { deriveLifecycle } from './domain/lifecycle.mjs'
import { createPlanCatalog } from './domain/plans.mjs'
import { assembleOne } from './data/assemble.mjs'
import { ACTIVITY_TYPES, activityItem } from './data/items.mjs'
import { contactKeyFor } from './lib/ids.mjs'
import { createDelivery } from './lib/delivery.mjs'
import { DEFAULT_ALLOWED_ORIGINS, HttpError, corsHeaders, json, matchPath, parseJsonBody, requestOf } from './lib/http.mjs'

const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/
const SIDES = new Set(['attack', 'defense'])

export function defaultConfig(overrides = {}) {
  return {
    features: { messaging: false, feedback: false, liveCoachApp: false, ...(overrides.features || {}) },
    activityTrackingSince: overrides.activityTrackingSince || null,
    vodLimits: overrides.vodLimits,
    allowedOrigins: overrides.allowedOrigins || DEFAULT_ALLOWED_ORIGINS,
    directoryCacheMs: overrides.directoryCacheMs,
    // Outbound delivery: 'disabled' unless explicitly set to 'in_app'.
    deliveryMode: overrides.deliveryMode === 'in_app' ? 'in_app' : 'disabled',
  }
}

function sanitizeActivity(body) {
  const type = String(body.type || '')
  if (!ACTIVITY_TYPES.includes(type)) throw new HttpError(400, 'unknown activity type')
  let ref = null
  if (body.ref !== undefined && body.ref !== null) {
    if (typeof body.ref !== 'object') throw new HttpError(400, 'ref must be an object')
    const mapId = body.ref.mapId === undefined ? null : String(body.ref.mapId)
    const siteId = body.ref.siteId === undefined ? null : String(body.ref.siteId)
    const side = body.ref.side === undefined ? null : String(body.ref.side)
    if (mapId !== null && !SLUG.test(mapId)) throw new HttpError(400, 'invalid mapId')
    if (siteId !== null && !SLUG.test(siteId)) throw new HttpError(400, 'invalid siteId')
    if (side !== null && !SIDES.has(side)) throw new HttpError(400, 'invalid side')
    ref = { mapId, siteId, side }
  }
  return { type, ref }
}

export function createApp(deps) {
  const {
    tables,
    store,
    authenticate,
    clock = () => Date.now(),
    config: rawConfig = {},
    catalog = createPlanCatalog(),
    log = console,
    extraRoutes = [],
    legacy = null,
  } = deps
  const config = defaultConfig(rawConfig)
  const delivery = deps.delivery || createDelivery({ mode: config.deliveryMode, store, clock })

  // ---- shared helpers exposed to route modules --------------------------------
  const ctx = {
    tables,
    store,
    config,
    catalog,
    log,
    delivery,
    legacy,
    decisionHooks: [],
    decisionPrechecks: [],
    now: () => clock(),
    async factsFor(identity, { withCognito = false, signedIn = true } = {}) {
      const one = await assembleOne({ tables, store, email: identity.email, sub: identity.sub || null, signedIn, isAdmin: identity.isAdmin === true, withCognito, log })
      const facts = buildFacts({ now: clock(), catalog, config, identity: { ...one.identity, signedIn }, sources: one.sources })
      return { facts, one, lifecycle: deriveLifecycle(facts) }
    },
  }

  async function requireUser(req) {
    const identity = await authenticate(req)
    if (!identity?.email) throw new HttpError(401, 'sign in required')
    return identity
  }

  async function requireAdmin(req) {
    const identity = await requireUser(req)
    if (!identity.isAdmin) throw new HttpError(403, 'admin access required')
    return identity
  }

  // Later phases register extra routes and home hooks (messages, feedback...).
  const homeHooks = []

  // ---- customer routes -----------------------------------------------------------
  const routes = [
    {
      method: 'GET',
      path: '/cs/health',
      handler: async () => json(200, { ok: true, service: 'recon-customer-success' }),
    },
    {
      method: 'GET',
      path: '/cs/me/home',
      handler: async (req) => {
        const identity = await requireUser(req)
        const { facts, lifecycle } = await ctx.factsFor(identity)
        const extras = {}
        for (const hook of homeHooks) Object.assign(extras, await hook({ identity, facts, lifecycle, req }))
        const view = buildHomeView(facts, { mode: 'full', ...extras })
        // Internal lifecycle labels are never sent to the customer.
        view.lifecycle = null
        return json(200, view)
      },
    },
    {
      method: 'POST',
      path: '/cs/me/activity',
      handler: async (req) => {
        const identity = await requireUser(req)
        const { type, ref } = sanitizeActivity(parseJsonBody(req.rawBody, { maxBytes: 2048 }))
        const at = new Date(clock()).toISOString()
        // One record per player, type and day (the latest place wins), so a
        // player can never grow the table faster than 3 small records a day.
        await store.put(activityItem({ contactKey: contactKeyFor(identity.email), email: identity.email, type, ref, at }))
        return json(202, { ok: true })
      },
    },
  ]

  for (const module of extraRoutes) {
    const registered = module({ ctx, requireUser, requireAdmin })
    routes.push(...(registered.routes || []))
    if (registered.homeHook) homeHooks.push(registered.homeHook)
    if (registered.decisionHook) ctx.decisionHooks.push(registered.decisionHook)
    if (registered.decisionPrecheck) ctx.decisionPrechecks.push(registered.decisionPrecheck)
  }

  return async function handle(event) {
    const req = requestOf(event)
    const cors = corsHeaders(req.headers.origin, config.allowedOrigins)
    if (req.method === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }
    try {
      for (const route of routes) {
        if (route.method !== req.method) continue
        const params = matchPath(route.path, req.path)
        if (!params) continue
        const res = await route.handler({ ...req, params })
        return { ...res, headers: { ...cors, ...res.headers } }
      }
      return json(404, { error: 'not found' }, cors)
    } catch (err) {
      if (err instanceof HttpError) return json(err.statusCode, { error: err.message, ...(err.code ? { code: err.code } : {}) }, cors)
      log.error?.('cs_unhandled_error', { path: req.path, method: req.method, requestId: req.requestId, error: err?.name || 'Error', message: err?.message })
      return json(500, { error: 'internal error', requestId: req.requestId }, cors)
    }
  }
}
