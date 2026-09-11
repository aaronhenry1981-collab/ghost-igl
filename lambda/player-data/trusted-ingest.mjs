import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import crypto from 'node:crypto'
import {
  assertNoCredentialFields,
  computeFreshness,
  reconPlayerIdFor,
  selectCanonicalObservation,
  validateFieldName,
  validateProvenance,
} from './core.mjs'
import { providerDescriptor } from './providers.mjs'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const PLAYER_STORE_TABLE = process.env.PLAYER_STORE_TABLE || 'recon-player-store'
const PLAYER_IDENTITIES_TABLE = process.env.PLAYER_IDENTITIES_TABLE || 'recon-player-identities'
const PLAYER_SNAPSHOTS_TABLE = process.env.PLAYER_SNAPSHOTS_TABLE || 'recon-player-snapshots'
const PLAYER_OBSERVATIONS_TABLE = process.env.PLAYER_OBSERVATIONS_TABLE || 'recon-player-observations'
const PLAYER_EVENTS_TABLE = process.env.PLAYER_EVENTS_TABLE || 'recon-player-events'
const PROVIDER_HEALTH_TABLE = process.env.PROVIDER_HEALTH_TABLE || 'recon-player-provider-health'

const IDENTITY_PROVIDERS = new Set(['ubisoft', 'trn', 'psn', 'xbox'])
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/
const HEALTH_STATUSES = new Set(['healthy', 'degraded', 'down', 'rate_limited', 'schema_changed', 'auth_failed'])

function isConditionalFailure(err) {
  return err?.name === 'ConditionalCheckFailedException'
}

function sizeOf(value) {
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8') }
  catch { return Number.POSITIVE_INFINITY }
}

function hash(value, length = 40) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, length)
}

function normalizeFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('fields must be an object')
  assertNoCredentialFields(fields, 'fields')
  const entries = Object.entries(fields)
  if (!entries.length || entries.length > 100) throw new Error('snapshot must contain 1-100 fields')
  const out = {}
  for (const [rawName, value] of entries) {
    const name = validateFieldName(rawName)
    if (value === undefined) continue
    if (sizeOf(value) > 20_000) throw new Error(`${name} is too large`)
    out[name] = value
  }
  if (!Object.keys(out).length) throw new Error('snapshot has no usable fields')
  return out
}

async function ensurePlayer(detail) {
  const ownerUserId = String(detail.owner_user_id || '').trim()
  if (!ownerUserId) throw new Error('owner_user_id is required')
  const reconPlayerId = reconPlayerIdFor(ownerUserId)
  const now = new Date().toISOString()
  const existing = await ddb.send(new GetCommand({
    TableName: PLAYER_STORE_TABLE,
    Key: { recon_player_id: reconPlayerId },
  }))
  if (existing.Item) return existing.Item

  const item = {
    recon_player_id: reconPlayerId,
    owner_user_id: ownerUserId,
    owner_email: detail.owner_email ? String(detail.owner_email).trim().toLowerCase() : null,
    display_name: null,
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
      Item: item,
      ConditionExpression: 'attribute_not_exists(recon_player_id)',
    }))
    return item
  } catch (err) {
    if (!isConditionalFailure(err)) throw err
    const raced = await ddb.send(new GetCommand({ TableName: PLAYER_STORE_TABLE, Key: { recon_player_id: reconPlayerId } }))
    if (!raced.Item) throw new Error('player creation race could not be resolved')
    return raced.Item
  }
}

async function canonicalizeField(reconPlayerId, fieldName) {
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYER_OBSERVATIONS_TABLE,
    IndexName: 'player-field-index',
    KeyConditionExpression: 'field_key = :fieldKey',
    ExpressionAttributeValues: { ':fieldKey': `${reconPlayerId}#${fieldName}` },
    ScanIndexForward: false,
    Limit: 100,
  }))
  const canonical = selectCanonicalObservation(result.Items || [], fieldName)
  if (!canonical) return null

  const value = {
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
    UpdateExpression: 'SET canonical.#field = :value, updated_at = :now',
    ExpressionAttributeNames: { '#field': fieldName },
    ExpressionAttributeValues: { ':value': value, ':now': new Date().toISOString() },
  }))
  return value
}

async function persistSnapshot(reconPlayerId, input) {
  assertNoCredentialFields(input, 'snapshot')
  const fields = normalizeFields(input.fields)
  const provenance = validateProvenance(input)
  const snapshotId = String(input.snapshot_id || crypto.randomUUID()).slice(0, 100)
  const snapshotType = validateFieldName(input.snapshot_type || 'provider_snapshot')
  const deletionClass = ['replay', 'vod', 'desktop', 'coach'].includes(provenance.source)
    ? 'derived_user_data'
    : 'user_data'
  const item = {
    recon_player_id: reconPlayerId,
    snapshot_key: `${provenance.captured_at}#${snapshotId}`,
    snapshot_id: snapshotId,
    snapshot_type: snapshotType,
    fields,
    ...provenance,
    notes: input.notes ? String(input.notes).slice(0, 1000) : null,
    producer: input.producer ? String(input.producer).slice(0, 80) : null,
    data_owner: 'user',
    deletion_class: deletionClass,
    retention_policy: 'delete_or_anonymize_on_account_request',
    created_at: new Date().toISOString(),
  }

  try {
    await ddb.send(new PutCommand({
      TableName: PLAYER_SNAPSHOTS_TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(snapshot_key)',
    }))
  } catch (err) {
    if (!isConditionalFailure(err)) throw err
  }

  for (const [fieldName, value] of Object.entries(fields)) {
    const observation = {
      recon_player_id: reconPlayerId,
      observation_key: `${fieldName}#${provenance.captured_at}#${provenance.source}#${snapshotId}`,
      observation_id: `${snapshotId}:${fieldName}`,
      field_key: `${reconPlayerId}#${fieldName}`,
      field_name: fieldName,
      value,
      ...provenance,
      freshness_state: computeFreshness(provenance),
      snapshot_id: snapshotId,
      producer: item.producer,
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
      if (!isConditionalFailure(err)) throw err
    }
  }

  const canonical = {}
  for (const fieldName of Object.keys(fields)) canonical[fieldName] = await canonicalizeField(reconPlayerId, fieldName)
  return { snapshot_id: snapshotId, canonical }
}

async function persistEvent(reconPlayerId, input) {
  assertNoCredentialFields(input, 'event')
  const eventType = String(input.event_type || '').trim().toLowerCase()
  if (!EVENT_TYPE_PATTERN.test(eventType)) throw new Error('invalid event_type')
  const occurredAt = new Date(input.occurred_at || Date.now()).toISOString()
  const eventId = String(input.event_id || crypto.randomUUID()).slice(0, 100)
  const data = input.data && typeof input.data === 'object' && !Array.isArray(input.data) ? input.data : {}
  if (sizeOf(data) > 20_000) throw new Error('event data is too large')

  const item = {
    recon_player_id: reconPlayerId,
    event_key: `${occurredAt}#${eventId}`,
    event_id: eventId,
    event_type: eventType,
    occurred_at: occurredAt,
    source: String(input.source || 'recon_system').slice(0, 60),
    visibility: String(input.visibility || 'private').slice(0, 40),
    producer: input.producer ? String(input.producer).slice(0, 80) : null,
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
    if (!isConditionalFailure(err)) throw err
  }
  return eventId
}

async function persistIdentity(reconPlayerId, input) {
  assertNoCredentialFields(input, 'identity')
  const provider = String(input.provider || '').trim().toLowerCase()
  if (!IDENTITY_PROVIDERS.has(provider)) throw new Error('unsupported identity provider')
  const externalId = String(input.external_id || '').trim()
  const username = input.username == null ? null : String(input.username).trim().slice(0, 100)
  if (!externalId || externalId.length > 500) throw new Error('invalid external_id')

  const externalKey = `${provider}#${hash(externalId.trim().toLowerCase())}`
  const collision = await ddb.send(new QueryCommand({
    TableName: PLAYER_IDENTITIES_TABLE,
    IndexName: 'external-identity-index',
    KeyConditionExpression: 'external_key = :key',
    ExpressionAttributeValues: { ':key': externalKey },
    Limit: 2,
  }))
  const otherOwner = (collision.Items || []).find((item) => item.recon_player_id !== reconPlayerId)
  if (otherOwner) throw new Error('external identity is already linked to another player')

  const existing = await ddb.send(new GetCommand({
    TableName: PLAYER_IDENTITIES_TABLE,
    Key: { recon_player_id: reconPlayerId, identity_key: externalKey },
  }))
  const history = Array.isArray(existing.Item?.username_history) ? [...existing.Item.username_history] : []
  if (existing.Item?.username && existing.Item.username !== username && !history.includes(existing.Item.username)) history.push(existing.Item.username)
  if (username && !history.includes(username)) history.push(username)
  const now = new Date().toISOString()

  await ddb.send(new PutCommand({
    TableName: PLAYER_IDENTITIES_TABLE,
    Item: {
      recon_player_id: reconPlayerId,
      identity_key: externalKey,
      external_key: externalKey,
      provider,
      external_id: externalId,
      username,
      username_history: history.slice(-25),
      verified: input.verified !== false,
      verification: String(input.verification || 'verified_external').slice(0, 40),
      source: input.source ? String(input.source).slice(0, 60) : provider,
      data_owner: 'user',
      deletion_class: 'linked_identity',
      retention_policy: 'delete_or_anonymize_on_account_request',
      linked_at: existing.Item?.linked_at || now,
      updated_at: now,
    },
  }))
  return externalKey
}

async function persistHealth(input, producer) {
  assertNoCredentialFields(input, 'provider_health')
  const provider = String(input.provider || '').trim().toLowerCase()
  if (!providerDescriptor(provider)) throw new Error('unsupported health provider')
  const status = String(input.status || '').trim().toLowerCase()
  if (!HEALTH_STATUSES.has(status)) throw new Error('invalid provider health status')
  const observedAt = new Date(input.observed_at || Date.now()).toISOString()
  const latencyMs = input.latency_ms == null ? null : Number(input.latency_ms)
  if (latencyMs != null && (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > 300_000)) throw new Error('invalid latency_ms')
  await ddb.send(new PutCommand({
    TableName: PROVIDER_HEALTH_TABLE,
    Item: {
      provider,
      observed_at: observedAt,
      status,
      latency_ms: latencyMs,
      error_code: input.error_code ? String(input.error_code).slice(0, 100) : null,
      schema_version: input.schema_version ? String(input.schema_version).slice(0, 100) : null,
      producer: producer ? String(producer).slice(0, 80) : null,
    },
  }))
}

export async function handler(event) {
  if (event?.source !== 'recon.player-data-provider' || event?.detail?.action !== 'ingest_bundle') {
    throw new Error('unsupported trusted ingestion event')
  }

  const detail = event.detail
  assertNoCredentialFields(detail, 'detail')
  const snapshots = Array.isArray(detail.snapshots) ? detail.snapshots.slice(0, 20) : []
  const events = Array.isArray(detail.events) ? detail.events.slice(0, 100) : []
  const identities = Array.isArray(detail.identities) ? detail.identities.slice(0, 20) : []
  const health = Array.isArray(detail.provider_health) ? detail.provider_health.slice(0, 20) : []
  if (snapshots.length + events.length + identities.length + health.length === 0) throw new Error('trusted ingestion bundle is empty')

  const player = await ensurePlayer(detail)
  const result = { recon_player_id: player.recon_player_id, snapshots: 0, events: 0, identities: 0, provider_health: 0 }

  for (const identity of identities) {
    await persistIdentity(player.recon_player_id, identity)
    result.identities++
  }
  for (const snapshot of snapshots) {
    await persistSnapshot(player.recon_player_id, { ...snapshot, producer: detail.producer || snapshot.producer })
    result.snapshots++
  }
  for (const timelineEvent of events) {
    await persistEvent(player.recon_player_id, { ...timelineEvent, producer: detail.producer || timelineEvent.producer })
    result.events++
  }
  for (const providerHealth of health) {
    await persistHealth(providerHealth, detail.producer)
    result.provider_health++
  }

  return { ok: true, ...result }
}
