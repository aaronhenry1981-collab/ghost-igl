import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import crypto from 'node:crypto'
import {
  PROVIDER_IDS,
  assertNoCredentialFields,
  computeFreshness,
  reconPlayerIdFor,
  selectCanonicalObservation,
  validateFieldName,
  validateProvenance,
} from './core.mjs'
import { listProviderDescriptors, providerDescriptor } from './providers.mjs'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
const PLAYER_STORE_TABLE = process.env.PLAYER_STORE_TABLE || 'recon-player-store'
const PLAYER_IDENTITIES_TABLE = process.env.PLAYER_IDENTITIES_TABLE || 'recon-player-identities'
const PLAYER_SNAPSHOTS_TABLE = process.env.PLAYER_SNAPSHOTS_TABLE || 'recon-player-snapshots'
const PLAYER_OBSERVATIONS_TABLE = process.env.PLAYER_OBSERVATIONS_TABLE || 'recon-player-observations'
const PLAYER_EVENTS_TABLE = process.env.PLAYER_EVENTS_TABLE || 'recon-player-events'
const PROVIDER_HEALTH_TABLE = process.env.PROVIDER_HEALTH_TABLE || 'recon-player-provider-health'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

const ALLOWED_ORIGINS = new Set([
  'https://r6coaching.com',
  'https://www.r6coaching.com',
  'http://localhost:5173',
])
const IDENTITY_PROVIDERS = new Set(['ubisoft', 'trn', 'psn', 'xbox'])
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/
const MAX_EXPORT_LIMIT = 250

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

function headersFor(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || ''
  const headers = {
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  }
  if (ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function json(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) }
}

function parseBody(raw) {
  let body
  try {
    body = JSON.parse(raw || '{}')
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Request body must be an object')
  assertNoCredentialFields(body)
  return body
}

function isAdminPayload(payload) {
  const groups = payload?.['cognito:groups'] || []
  return Array.isArray(groups) && groups.includes('admins')
}

async function authenticate(event) {
  const authHeader = event?.headers?.authorization || event?.headers?.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new HttpError(401, 'No token')

  let payload
  try {
    payload = await verifier.verify(token)
  } catch (err) {
    console.error('Player data token verification failed:', err?.message || 'unknown')
    throw new HttpError(401, 'Invalid token')
  }

  const ownerUserId = String(payload?.sub || '').trim()
  const email = String(payload?.email || '').trim().toLowerCase()
  if (!ownerUserId || !email) throw new HttpError(400, 'Identity token is missing required claims')

  return {
    payload,
    ownerUserId,
    email,
    isAdmin: isAdminPayload(payload),
    reconPlayerId: reconPlayerIdFor(ownerUserId),
  }
}

function isConditionalFailure(err) {
  return err?.name === 'ConditionalCheckFailedException'
}

function externalIdentityKey(provider, externalId) {
  const digest = crypto.createHash('sha256').update(String(externalId).trim().toLowerCase()).digest('hex').slice(0, 40)
  return `${provider}#${digest}`
}

function stableJsonSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function normalizeFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new HttpError(400, 'fields must be an object')
  const entries = Object.entries(fields)
  if (!entries.length) throw new HttpError(400, 'At least one player data field is required')
  if (entries.length > 100) throw new HttpError(400, 'A snapshot may contain at most 100 fields')
  assertNoCredentialFields(fields, 'fields')

  const normalized = {}
  for (const [rawField, value] of entries) {
    const field = validateFieldName(rawField)
    if (value === undefined) continue
    if (stableJsonSize(value) > 20_000) throw new HttpError(400, `${field} is too large`)
    normalized[field] = value
  }
  if (!Object.keys(normalized).length) throw new HttpError(400, 'At least one usable player data field is required')
  return normalized
}

function profileBaselineFields(profile) {
  if (!profile) return {}
  const fields = {}
  const copyIfPresent = (target, value) => {
    if (value !== undefined && value !== null && value !== '') fields[target] = value
  }

  copyIfPresent('display_name', profile.display_name)
  copyIfPresent('platform', profile.platform)
  copyIfPresent('region', profile.region)
  copyIfPresent('main_role', profile.main_role)
  copyIfPresent('active_game_id', profile.active_game_id)

  let gameProfiles = {}
  try {
    gameProfiles = profile.game_profiles_json ? JSON.parse(profile.game_profiles_json) : {}
  } catch {
    gameProfiles = {}
  }

  const r6 = gameProfiles?.r6 || {}
  copyIfPresent('rank', r6.rank)
  copyIfPresent('goal_rank', r6.goal_rank)
  copyIfPresent('main_role', r6.main_role)
  copyIfPresent('ubisoft_username', r6.ubisoft_username)
  copyIfPresent('squad_size', r6.squad_size)
  return fields
}

async function getLegacyProfile(email) {
  const result = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
  return result.Item || null
}

async function ensurePlayer(auth) {
  const now = new Date().toISOString()
  let result = await ddb.send(new GetCommand({
    TableName: PLAYER_STORE_TABLE,
    Key: { recon_player_id: auth.reconPlayerId },
  }))
  let player = result.Item || null

  if (!player) {
    const legacyProfile = await getLegacyProfile(auth.email)
    const displayName = legacyProfile?.display_name || null
    const created = {
      recon_player_id: auth.reconPlayerId,
      owner_user_id: auth.ownerUserId,
      owner_email: auth.email,
      display_name: displayName,
      canonical: {},
      privacy_default: 'private',
      data_owner: 'user',
      deletion_class: 'user_account_data',
      retention_policy: 'delete_or_anonymize_on_account_request',
      baseline_version: 0,
      created_at: now,
      updated_at: now,
    }
    try {
      await ddb.send(new PutCommand({
        TableName: PLAYER_STORE_TABLE,
        Item: created,
        ConditionExpression: 'attribute_not_exists(recon_player_id)',
      }))
      player = created
    } catch (err) {
      if (!isConditionalFailure(err)) throw err
      result = await ddb.send(new GetCommand({ TableName: PLAYER_STORE_TABLE, Key: { recon_player_id: auth.reconPlayerId } }))
      player = result.Item
    }
  }

  if (!player) throw new Error('Player record could not be resolved')
  if (player.owner_user_id !== auth.ownerUserId) throw new HttpError(403, 'Player ownership mismatch')

  if (player.owner_email !== auth.email) {
    await ddb.send(new UpdateCommand({
      TableName: PLAYER_STORE_TABLE,
      Key: { recon_player_id: auth.reconPlayerId },
      UpdateExpression: 'SET owner_email = :email, updated_at = :now',
      ExpressionAttributeValues: { ':email': auth.email, ':now': now },
    }))
    player = { ...player, owner_email: auth.email, updated_at: now }
  }

  if ((player.baseline_version || 0) < 1) {
    const profile = await getLegacyProfile(auth.email)
    await ensureBaseline(player, profile)
    const refreshed = await ddb.send(new GetCommand({ TableName: PLAYER_STORE_TABLE, Key: { recon_player_id: auth.reconPlayerId } }))
    player = refreshed.Item || player
  }

  return player
}

async function ensureBaseline(player, legacyProfile) {
  const capturedAt = legacyProfile?.updated_at || legacyProfile?.created_at || player.created_at || new Date().toISOString()
  const fields = profileBaselineFields(legacyProfile)

  await putEventInternal(player.recon_player_id, {
    event_id: 'joined-recon-v1',
    event_type: 'joined_recon',
    occurred_at: player.created_at || capturedAt,
    source: 'recon_system',
    visibility: 'private',
    data: { baseline_version: 1 },
  }, true)

  if (Object.keys(fields).length) {
    await putSnapshotInternal(player.recon_player_id, {
      snapshot_id: 'profile-baseline-v1',
      snapshot_type: 'onboarding_baseline',
      fields,
      source: 'manual',
      captured_at: capturedAt,
      season: null,
      confidence: 0.45,
      verification: 'player_reported',
      visibility: 'private',
      notes: 'Migrated from the existing Recon profile during player-data bootstrap.',
    }, true)
  }

  await ddb.send(new UpdateCommand({
    TableName: PLAYER_STORE_TABLE,
    Key: { recon_player_id: player.recon_player_id },
    UpdateExpression: 'SET baseline_version = :version, updated_at = :now',
    ExpressionAttributeValues: { ':version': 1, ':now': new Date().toISOString() },
  }))
}

async function canonicalizeField(reconPlayerId, fieldName) {
  const fieldKey = `${reconPlayerId}#${fieldName}`
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYER_OBSERVATIONS_TABLE,
    IndexName: 'player-field-index',
    KeyConditionExpression: 'field_key = :fieldKey',
    ExpressionAttributeValues: { ':fieldKey': fieldKey },
    ScanIndexForward: false,
    Limit: 100,
  }))
  const canonical = selectCanonicalObservation(result.Items || [], fieldName)
  if (!canonical) return null

  const canonicalValue = {
    value: canonical.value,
    source: canonical.source,
    captured_at: canonical.captured_at,
    season: canonical.season || null,
    confidence: canonical.confidence,
    verification: canonical.verification,
    freshness_state: computeFreshness(canonical),
    visibility: canonical.visibility,
    observation_id: canonical.observation_id,
  }

  await ddb.send(new UpdateCommand({
    TableName: PLAYER_STORE_TABLE,
    Key: { recon_player_id: reconPlayerId },
    UpdateExpression: 'SET canonical.#field = :canonical, updated_at = :now',
    ExpressionAttributeNames: { '#field': fieldName },
    ExpressionAttributeValues: { ':canonical': canonicalValue, ':now': new Date().toISOString() },
  }))
  return canonicalValue
}

async function putSnapshotInternal(reconPlayerId, input, idempotent = false) {
  const fields = normalizeFields(input.fields)
  const provenance = validateProvenance(input)
  const snapshotId = String(input.snapshot_id || crypto.randomUUID()).slice(0, 100)
  const snapshotType = validateFieldName(input.snapshot_type || 'player_snapshot')
  const snapshotKey = `${provenance.captured_at}#${snapshotId}`
  const deletionClass = ['replay', 'vod', 'desktop', 'coach'].includes(provenance.source)
    ? 'derived_user_data'
    : 'user_data'

  const snapshot = {
    recon_player_id: reconPlayerId,
    snapshot_key: snapshotKey,
    snapshot_id: snapshotId,
    snapshot_type: snapshotType,
    fields,
    ...provenance,
    notes: input.notes ? String(input.notes).slice(0, 1000) : null,
    data_owner: 'user',
    deletion_class: deletionClass,
    retention_policy: 'delete_or_anonymize_on_account_request',
    created_at: new Date().toISOString(),
  }

  try {
    await ddb.send(new PutCommand({
      TableName: PLAYER_SNAPSHOTS_TABLE,
      Item: snapshot,
      ConditionExpression: 'attribute_not_exists(snapshot_key)',
    }))
  } catch (err) {
    if (!(idempotent && isConditionalFailure(err))) throw err
  }

  for (const [fieldName, value] of Object.entries(fields)) {
    const observationId = `${snapshotId}:${fieldName}`
    const observation = {
      recon_player_id: reconPlayerId,
      observation_key: `${fieldName}#${provenance.captured_at}#${provenance.source}#${snapshotId}`,
      observation_id: observationId,
      field_key: `${reconPlayerId}#${fieldName}`,
      field_name: fieldName,
      value,
      ...provenance,
      freshness_state: computeFreshness(provenance),
      snapshot_id: snapshotId,
      data_owner: 'user',
      deletion_class: deletionClass,
      retention_policy: 'delete_or_anonymize_on_account_request',
      created_at: new Date().toISOString(),
    }
    try {
      await ddb.send(new PutCommand({
        TableName: PLAYER_OBSERVATIONS_TABLE,
        Item: observation,
        ConditionExpression: 'attribute_not_exists(observation_key)',
      }))
    } catch (err) {
      if (!(idempotent && isConditionalFailure(err))) throw err
    }
  }

  const canonical = {}
  for (const fieldName of Object.keys(fields)) {
    canonical[fieldName] = await canonicalizeField(reconPlayerId, fieldName)
  }
  return { snapshot, canonical }
}

async function putEventInternal(reconPlayerId, input, idempotent = false) {
  assertNoCredentialFields(input, 'event')
  const eventType = String(input.event_type || '').trim().toLowerCase()
  if (!EVENT_TYPE_PATTERN.test(eventType)) throw new HttpError(400, 'Invalid event_type')
  const occurred = new Date(input.occurred_at || Date.now())
  if (Number.isNaN(occurred.getTime())) throw new HttpError(400, 'Invalid occurred_at')
  const occurredAt = occurred.toISOString()
  const eventId = String(input.event_id || crypto.randomUUID()).slice(0, 100)
  const data = input.data && typeof input.data === 'object' && !Array.isArray(input.data) ? input.data : {}
  if (stableJsonSize(data) > 20_000) throw new HttpError(400, 'Event data is too large')

  const item = {
    recon_player_id: reconPlayerId,
    event_key: `${occurredAt}#${eventId}`,
    event_id: eventId,
    event_type: eventType,
    occurred_at: occurredAt,
    source: String(input.source || 'manual').slice(0, 60),
    visibility: String(input.visibility || 'private').slice(0, 40),
    data,
    data_owner: 'user',
    deletion_class: 'user_event_data',
    retention_policy: 'delete_or_anonymize_on_account_request',
    created_at: new Date().toISOString(),
  }

  try {
    await ddb.send(new PutCommand({
      TableName: PLAYER_EVENTS_TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(event_key)',
    }))
  } catch (err) {
    if (!(idempotent && isConditionalFailure(err))) throw err
  }
  return item
}

async function getPlayerBundle(auth) {
  const player = await ensurePlayer(auth)
  const [identityResult, eventResult] = await Promise.all([
    ddb.send(new QueryCommand({
      TableName: PLAYER_IDENTITIES_TABLE,
      KeyConditionExpression: 'recon_player_id = :id',
      ExpressionAttributeValues: { ':id': player.recon_player_id },
    })),
    ddb.send(new QueryCommand({
      TableName: PLAYER_EVENTS_TABLE,
      KeyConditionExpression: 'recon_player_id = :id',
      ExpressionAttributeValues: { ':id': player.recon_player_id },
      ScanIndexForward: false,
      Limit: 20,
    })),
  ])

  return {
    player,
    canonical: player.canonical || {},
    identities: (identityResult.Items || []).map((item) => ({
      provider: item.provider,
      external_id: item.external_id,
      username: item.username || null,
      username_history: item.username_history || [],
      verification: item.verification,
      verified: item.verified === true,
      linked_at: item.linked_at,
      updated_at: item.updated_at,
    })),
    recent_events: eventResult.Items || [],
    providers: listProviderDescriptors(),
  }
}

async function linkIdentity(auth, body) {
  const player = await ensurePlayer(auth)
  const provider = String(body.provider || '').trim().toLowerCase()
  if (!IDENTITY_PROVIDERS.has(provider)) throw new HttpError(400, 'Unsupported identity provider')
  const descriptor = providerDescriptor(provider)
  if (!descriptor) throw new HttpError(400, 'Unknown identity provider')

  const externalId = String(body.external_id || '').trim()
  const username = body.username == null ? null : String(body.username).trim()
  if (!externalId || externalId.length > 500) throw new HttpError(400, 'external_id is required and must be 500 characters or fewer')
  if (username && username.length > 100) throw new HttpError(400, 'username must be 100 characters or fewer')

  const externalKey = externalIdentityKey(provider, externalId)
  const collision = await ddb.send(new QueryCommand({
    TableName: PLAYER_IDENTITIES_TABLE,
    IndexName: 'external-identity-index',
    KeyConditionExpression: 'external_key = :key',
    ExpressionAttributeValues: { ':key': externalKey },
    Limit: 2,
  }))
  const otherOwner = (collision.Items || []).find((item) => item.recon_player_id !== player.recon_player_id)
  if (otherOwner) throw new HttpError(409, 'That external identity is already linked to another Recon player')

  const identityKey = externalKey
  const existingResult = await ddb.send(new GetCommand({
    TableName: PLAYER_IDENTITIES_TABLE,
    Key: { recon_player_id: player.recon_player_id, identity_key: identityKey },
  }))
  const existing = existingResult.Item || null
  const history = Array.isArray(existing?.username_history) ? [...existing.username_history] : []
  if (existing?.username && existing.username !== username && !history.includes(existing.username)) history.push(existing.username)
  if (username && !history.includes(username)) history.push(username)

  const now = new Date().toISOString()
  const item = {
    recon_player_id: player.recon_player_id,
    identity_key: identityKey,
    external_key: externalKey,
    provider,
    external_id: externalId,
    username,
    username_history: history.slice(-25),
    verified: auth.isAdmin ? body.verified === true : false,
    verification: auth.isAdmin && body.verified === true ? 'verified_external' : 'player_reported',
    data_owner: 'user',
    deletion_class: 'linked_identity',
    retention_policy: 'delete_or_anonymize_on_account_request',
    linked_at: existing?.linked_at || now,
    updated_at: now,
  }

  await ddb.send(new PutCommand({ TableName: PLAYER_IDENTITIES_TABLE, Item: item }))
  await putEventInternal(player.recon_player_id, {
    event_type: 'identity_linked',
    source: auth.isAdmin ? provider : 'manual',
    visibility: 'private',
    data: { provider, verified: item.verified },
  })
  return item
}

function requestedProvenance(auth, body) {
  const source = String(body.source || 'manual').trim().toLowerCase()
  if (!PROVIDER_IDS.includes(source)) throw new HttpError(400, 'Unsupported source')
  if (!auth.isAdmin && source !== 'manual') {
    throw new HttpError(403, 'Verified provider observations must be ingested by a trusted Recon service')
  }

  const input = {
    ...body,
    source,
    verification: auth.isAdmin ? (body.verification || 'unverified') : 'player_reported',
    confidence: auth.isAdmin ? body.confidence : (body.confidence ?? 0.45),
    visibility: body.visibility || 'private',
  }
  return validateProvenance(input)
}

async function ingestUserSnapshot(auth, body) {
  const player = await ensurePlayer(auth)
  const provenance = requestedProvenance(auth, body)
  const result = await putSnapshotInternal(player.recon_player_id, {
    ...body,
    ...provenance,
    fields: body.fields,
  })
  return result
}

async function trustedIngestSnapshot(detail) {
  assertNoCredentialFields(detail, 'detail')
  const reconPlayerId = String(detail.recon_player_id || '').trim()
  if (!reconPlayerId) throw new Error('Trusted ingestion requires recon_player_id')
  const player = await ddb.send(new GetCommand({ TableName: PLAYER_STORE_TABLE, Key: { recon_player_id: reconPlayerId } }))
  if (!player.Item) throw new Error('Trusted ingestion target does not exist')
  const source = String(detail.source || '').trim().toLowerCase()
  if (!PROVIDER_IDS.includes(source) || source === 'manual') throw new Error('Trusted ingestion requires a non-manual provider source')
  return putSnapshotInternal(reconPlayerId, detail)
}

async function getHistory(auth, query) {
  const player = await ensurePlayer(auth)
  const fieldName = validateFieldName(query?.field || '')
  const requestedLimit = Math.max(1, Math.min(100, Number(query?.limit || 50)))
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYER_OBSERVATIONS_TABLE,
    IndexName: 'player-field-index',
    KeyConditionExpression: 'field_key = :key',
    ExpressionAttributeValues: { ':key': `${player.recon_player_id}#${fieldName}` },
    ScanIndexForward: false,
    Limit: requestedLimit,
  }))
  const observations = (result.Items || []).map((item) => ({ ...item, freshness_state: computeFreshness(item) }))
  return {
    field: fieldName,
    canonical: selectCanonicalObservation(observations, fieldName),
    observations,
  }
}

async function getTimeline(auth, query) {
  const player = await ensurePlayer(auth)
  const limit = Math.max(1, Math.min(100, Number(query?.limit || 50)))
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYER_EVENTS_TABLE,
    KeyConditionExpression: 'recon_player_id = :id',
    ExpressionAttributeValues: { ':id': player.recon_player_id },
    ScanIndexForward: false,
    Limit: limit,
  }))
  return { events: result.Items || [] }
}

function encodeCursor(key) {
  if (!key) return null
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url')
}

function decodeCursor(cursor) {
  if (!cursor) return undefined
  try {
    const decoded = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'))
    return decoded && typeof decoded === 'object' ? decoded : undefined
  } catch {
    throw new HttpError(400, 'Invalid export cursor')
  }
}

async function exportSection(auth, query) {
  const player = await ensurePlayer(auth)
  const section = String(query?.section || 'profile').toLowerCase()
  const limit = Math.max(1, Math.min(MAX_EXPORT_LIMIT, Number(query?.limit || 100)))
  const cursor = decodeCursor(query?.cursor)

  if (section === 'profile') return { section, items: [player], next_cursor: null }

  const sections = {
    identities: { table: PLAYER_IDENTITIES_TABLE, key: 'recon_player_id' },
    snapshots: { table: PLAYER_SNAPSHOTS_TABLE, key: 'recon_player_id' },
    observations: { table: PLAYER_OBSERVATIONS_TABLE, key: 'recon_player_id' },
    events: { table: PLAYER_EVENTS_TABLE, key: 'recon_player_id' },
  }
  const config = sections[section]
  if (!config) throw new HttpError(400, 'section must be profile, identities, snapshots, observations, or events')

  const result = await ddb.send(new QueryCommand({
    TableName: config.table,
    KeyConditionExpression: `${config.key} = :id`,
    ExpressionAttributeValues: { ':id': player.recon_player_id },
    ExclusiveStartKey: cursor,
    Limit: limit,
  }))
  return {
    section,
    items: result.Items || [],
    next_cursor: encodeCursor(result.LastEvaluatedKey),
  }
}

async function writeProviderHealth(auth, body) {
  if (!auth.isAdmin) throw new HttpError(403, 'Admin access required')
  const provider = String(body.provider || '').trim().toLowerCase()
  if (!providerDescriptor(provider)) throw new HttpError(400, 'Unsupported provider')
  const status = String(body.status || '').trim().toLowerCase()
  const allowedStatuses = new Set(['healthy', 'degraded', 'down', 'rate_limited', 'schema_changed', 'auth_failed'])
  if (!allowedStatuses.has(status)) throw new HttpError(400, 'Invalid provider health status')
  const observedAt = new Date(body.observed_at || Date.now()).toISOString()
  const latencyMs = body.latency_ms == null ? null : Number(body.latency_ms)
  if (latencyMs != null && (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > 300_000)) {
    throw new HttpError(400, 'Invalid latency_ms')
  }

  const item = {
    provider,
    observed_at: observedAt,
    status,
    latency_ms: latencyMs,
    error_code: body.error_code ? String(body.error_code).slice(0, 100) : null,
    schema_version: body.schema_version ? String(body.schema_version).slice(0, 100) : null,
    checked_by: auth.ownerUserId,
  }
  await ddb.send(new PutCommand({ TableName: PROVIDER_HEALTH_TABLE, Item: item }))
  return item
}

async function createUserEvent(auth, body) {
  const player = await ensurePlayer(auth)
  // A caller-supplied event_id makes the write idempotent: repeating the same
  // event (same occurred_at + event_id) returns it instead of failing, so
  // clients can safely retry (see src/lib/attribution/events.js).
  return putEventInternal(player.recon_player_id, {
    ...body,
    source: auth.isAdmin ? (body.source || 'coach') : 'manual',
    visibility: body.visibility || 'private',
  }, Boolean(body?.event_id))
}

export async function handler(event) {
  // Trusted provider/replay/VOD ingestion can invoke the Lambda directly with
  // IAM permission. It is intentionally not exposed as an unauthenticated HTTP
  // route, so normal users cannot forge official/verified provenance.
  if (!event?.requestContext?.http && event?.source === 'recon.player-data' && event?.detail?.action === 'ingest_snapshot') {
    return trustedIngestSnapshot(event.detail)
  }

  const headers = headersFor(event)
  const method = event?.requestContext?.http?.method || ''
  const path = event?.requestContext?.http?.path || event?.rawPath || ''
  if (method === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  try {
    const auth = await authenticate(event)

    if (method === 'GET' && path.endsWith('/player-data/me')) {
      return json(200, await getPlayerBundle(auth), headers)
    }
    if (method === 'POST' && path.endsWith('/player-data/identities')) {
      return json(200, { identity: await linkIdentity(auth, parseBody(event.body)) }, headers)
    }
    if (method === 'POST' && path.endsWith('/player-data/snapshots')) {
      return json(201, await ingestUserSnapshot(auth, parseBody(event.body)), headers)
    }
    if (method === 'GET' && path.endsWith('/player-data/history')) {
      return json(200, await getHistory(auth, event.queryStringParameters), headers)
    }
    if (method === 'POST' && path.endsWith('/player-data/events')) {
      return json(201, { event: await createUserEvent(auth, parseBody(event.body)) }, headers)
    }
    if (method === 'GET' && path.endsWith('/player-data/timeline')) {
      return json(200, await getTimeline(auth, event.queryStringParameters), headers)
    }
    if (method === 'GET' && path.endsWith('/player-data/export')) {
      return json(200, await exportSection(auth, event.queryStringParameters), headers)
    }
    if (method === 'GET' && path.endsWith('/player-data/providers')) {
      return json(200, { providers: listProviderDescriptors() }, headers)
    }
    if (method === 'POST' && path.endsWith('/player-data/provider-health')) {
      return json(201, { health: await writeProviderHealth(auth, parseBody(event.body)) }, headers)
    }

    return json(404, { error: `Unknown route: ${method} ${path}` }, headers)
  } catch (err) {
    const statusCode = err instanceof HttpError ? err.statusCode : 500
    if (statusCode >= 500) console.error('Player data route error:', err)
    return json(statusCode, { error: statusCode >= 500 ? 'Internal error' : err.message }, headers)
  }
}
