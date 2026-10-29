import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import vm from 'node:vm'
import { buildMapContext, validateAnalysis } from './coach-contract.mjs'
import { GROUNDING_RULES, requireGroundedAnalysis } from './grounding.mjs'
import { buildVodCoachingEvent } from '../../src/api/vodEvidence.js'
import { context, groundedStill } from './fixtures/coastline-still.mjs'

const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const api = readFileSync(new URL('../../src/api/vodApi.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end))

for (const rejected of [false, true]) test(`offline upload → prompt → validation → persistence (${rejected ? 'reject' : 'accept'})`, async () => {
  const writes = [], publishes = [], syncs = [], invocations = []
  let reservations = 0
  const candidate = groundedStill()
  if (rejected) candidate.per_image[0].what_happened = 'You moved through the doorway.'
  // Optional exact approved JPEG is read locally only; no real endpoint exists.
  const bytes = process.env.RECON_APPROVED_FRAME ? readFileSync(process.env.RECON_APPROVED_FRAME) : Buffer.from('offline-image-fixture')
  if (process.env.RECON_APPROVED_FRAME) assert.equal(createHash('sha256').update(bytes).digest('hex'), '9bf57a8d9fe6a36f1c0e85fd199ddbad000953efb76d3733a566c3360ef778bc')
  class PutCommand { constructor(input) { this.input = input } }
  const backend = vm.createContext({
    REVIEW_REQUEST_BUDGET_MS: 24000, MODEL_ID: 'offline', GROUNDING_RULES, buildMapContext, validateAnalysis, requireGroundedAnalysis,
    GAME_DISPLAY: { r6: { name: 'Rainbow Six Siege', short: 'R6', character_noun: 'operator' } },
    CONTEXTS_BY_GAME: { r6: { maps: { coastline: { name: 'Coastline', sites: [{ id: 'theater-penthouse', name: 'Theater / Penthouse' }] } } } },
    invokeModel: async input => { invocations.push(input); return JSON.stringify(candidate) }, parseModelJson: JSON.parse,
    buildHeaders: () => ({}), console: { error() {} },
    verifier: { verify: async () => ({ email: 'offline@example.test', email_verified: true, sub: 'offline', 'cognito:groups': ['admins'] }) },
    VOD_AI_ENABLED: true, VOD_ADMIN_DAILY_LIMIT: 3, ELITE_MAX_IMAGES: 10, MAX_IMAGE_BYTES: 5000000,
    reserveAdminUsage: async () => { reservations++ }, PutCommand,
    ddb: { send: async command => { writes.push(command.input) } },
    publishVodPlayerData: async (...args) => { publishes.push(args) }, process: { env: {} }, createHash, randomUUID,
  })
  vm.runInContext(extract('const RESPONSE_SCHEMA =', 'function compactFields('), backend)
  vm.runInContext(extract('async function callBedrock(', 'async function callRankSnapshot('), backend)
  vm.runInContext(extract('export async function handler(', 'async function getActiveSub(').replace('export ', ''), backend)
  class FileReader {
    readAsDataURL(file) { this.result = `data:${file.type};base64,${file.bytes.toString('base64')}`; this.onload() }
  }
  const frontend = vm.createContext({
    AbortController, setTimeout, clearTimeout,
    FileReader, API_URL: 'https://offline.invalid', getCurrentUser: () => ({}), getSession: async () => ({ getIdToken: () => ({ decodePayload: () => ({ sub: 'offline' }) }) }), getIdToken: () => 'offline', buildVodCoachingEvent,
    fetch: async (url, request) => {
      if (url.endsWith('/me/coaching-events')) { syncs.push(JSON.parse(request.body)); return { ok: true, json: async () => ({ written: 1, received: 1 }) } }
      const response = await backend.handler({ headers: request.headers, body: request.body })
      return { ok: response.statusCode === 200, status: response.statusCode, json: async () => JSON.parse(response.body) }
    },
  })
  vm.runInContext(api, frontend)
  const run = frontend.analyzeSessionApi([{ type: 'image/jpeg', bytes }], { ...context, game_id: 'r6' })
  if (rejected) {
    await assert.rejects(run, error => error.code === 'analysis_not_grounded' && error.status === 422)
    assert.equal(writes.length + publishes.length + syncs.length, 0)
  } else {
    const result = await run
    assert.equal(result.session.score, null); assert.equal(result.roadmap_sync, 'saved')
    assert.equal(writes.length, 1); assert.equal(publishes.length, 1); assert.equal(syncs.length, 1)
    assert.deepEqual(JSON.parse(writes[0].Item.user_context), context)
    assert.equal(writes[0].Item.analysis.context_provenance, 'user_context')
    assert.equal(syncs[0].events[0].gameState.siteId, context.site)
    assert.equal(syncs[0].events[0].report.score, null)
  }
  assert.equal(reservations, 1); assert.equal(invocations.length, 1)
  const image = invocations[0].messages[0].content.find(item => item.type === 'image')
  assert.equal(image.source.data, bytes.toString('base64')); assert.equal(image.source.media_type, 'image/jpeg')
  const hints = invocations[0].messages[0].content.at(-1).text
  assert.ok(hints.includes(context.map)); assert.ok(hints.includes(context.site))
  assert.match(invocations[0].system, /REFERENCE MATERIAL ONLY/)
  assert.match(invocations[0].system, /Theater \/ Penthouse/)
})
