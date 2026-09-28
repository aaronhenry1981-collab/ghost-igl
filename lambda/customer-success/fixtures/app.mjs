// Test harness: the production app core wired to the fictional fixture world
// with in-memory tables and fixed tokens. Shared by the test files (kept out
// of *.test.mjs so importing it never re-registers another file's tests).

import { createApp } from '../app.mjs'
import { buildFixtureWorld } from './world.mjs'
import { storeSeedFromWorld } from './seed.mjs'
import { createMemoryTables } from '../data/memoryTables.mjs'
import { createMemoryStore } from '../data/memoryStore.mjs'

export const FIXTURE_NOW = Date.parse('2026-09-25T15:00:00.000Z')

export function fixtureApp({ failures = {}, extraRoutes = [], config = {}, clock, mutate = null } = {}) {
  const world = buildFixtureWorld(FIXTURE_NOW)
  if (mutate) mutate(world)
  const tables = createMemoryTables(world, { failures })
  const store = createMemoryStore(storeSeedFromWorld(world))
  const tokens = new Map()
  for (const [key, s] of Object.entries(world.scenarios)) tokens.set(`tok-${key}`, { email: s.email, sub: s.sub, isAdmin: false })
  tokens.set('tok-admin', { email: 'coach.admin@example.test', sub: 'sub-fixture-admin', isAdmin: true })
  const authenticate = async (req) => tokens.get(String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')) || null
  const handle = createApp({
    tables,
    store,
    authenticate,
    clock: clock || (() => FIXTURE_NOW),
    config: { features: { messaging: true, feedback: true }, activityTrackingSince: '2026-09-01T00:00:00.000Z', ...config },
    extraRoutes,
    log: { warn() {}, error() {}, info() {} },
  })
  const call = (method, path, { token, body, origin = 'https://r6coaching.com' } = {}) => handle({
    rawPath: path.split('?')[0],
    queryStringParameters: path.includes('?') ? Object.fromEntries(new URLSearchParams(path.split('?')[1])) : undefined,
    requestContext: { http: { method }, requestId: 'req-test' },
    headers: { origin, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  return { world, store, tables, call }
}
