#!/usr/bin/env node
// LOCAL DEVELOPMENT ONLY: runs the production customer-success API code
// (lambda/customer-success/app.mjs) over fictional fixture data, so the
// player home and CRM can be previewed and screenshotted without AWS,
// Cognito, Stripe or any real customer record.
//
//   node scripts/cs-dev-server.mjs            # http://127.0.0.1:8787
//   Authorization: Bearer dev:<scenario>      # e.g. dev:paying_active
//   Authorization: Bearer dev:admin           # fictional admin
//
// Binds to 127.0.0.1 only. Outbound delivery is disabled (nothing is sent).

import http from 'node:http'
import { createApp } from '../lambda/customer-success/app.mjs'
import { buildFixtureWorld } from '../lambda/customer-success/fixtures/world.mjs'
import { storeSeedFromWorld } from '../lambda/customer-success/fixtures/seed.mjs'
import { createMemoryTables } from '../lambda/customer-success/data/memoryTables.mjs'
import { createMemoryStore } from '../lambda/customer-success/data/memoryStore.mjs'
import { routeModules } from '../lambda/customer-success/routes/index.mjs'

if (process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  console.error('cs-dev-server is for local development only.')
  process.exit(1)
}

const PORT = Number(process.env.CS_DEV_PORT || 8787)
const now = Date.now()
const world = buildFixtureWorld(now)
const tables = createMemoryTables(world)
const store = createMemoryStore(storeSeedFromWorld(world))

const identities = new Map(Object.entries(world.scenarios).map(([key, s]) => [key, { email: s.email, sub: s.sub, isAdmin: false }]))
identities.set('admin', { email: 'coach.admin@example.test', sub: 'sub-fixture-admin', isAdmin: true })

const handle = createApp({
  tables,
  store,
  authenticate: async (req) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    return token.startsWith('dev:') ? identities.get(token.slice(4)) || null : null
  },
  config: {
    features: { messaging: true, feedback: true },
    activityTrackingSince: new Date(now - 30 * 86400000).toISOString(),
    allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  },
  extraRoutes: routeModules,
  log: { warn: (...a) => console.warn(...a), error: (...a) => console.error(...a), info: () => {} },
})

const server = http.createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const event = {
    rawPath: url.pathname,
    queryStringParameters: Object.fromEntries(url.searchParams),
    requestContext: { http: { method: req.method }, requestId: `dev-${Date.now()}` },
    headers: req.headers,
    body: chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined,
  }
  const out = await handle(event)
  res.writeHead(out.statusCode, out.headers)
  res.end(out.body)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`customer-success dev server (fictional data) on http://127.0.0.1:${PORT}`)
  console.log(`scenarios: ${[...identities.keys()].join(', ')}`)
})
