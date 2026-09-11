// recon6-climb-progress — cross-device progress for the /climb pipeline.
//
// The static /climb page stored progress in localStorage only; its "cloud"
// path depended on a window.storage bridge that never existed, so signed-in
// users lost their climb across devices. This gives it a real backend: a
// signed-in user's Cognito id token authenticates a per-user GET/PUT of the
// progress blob. Isolated function/table — nothing to do with billing.
//
// Routes (HTTP API u0k402df6j):
//   GET /me/climb-progress   -> { progress, updatedAt }
//   PUT /me/climb-progress   body { progress: {...} } -> { ok:true }

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

const REGION = process.env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const lambda = new LambdaClient({ region: REGION })
const TABLE = process.env.CLIMB_TABLE || 'recon6-climb-progress'
const PLAYER_DATA_INGEST_FUNCTION = process.env.PLAYER_DATA_INGEST_FUNCTION || ''

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '5bpa1cteenctoue24v4e245re8',
})

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
}
const resp = (code, obj) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(obj) })

async function userFrom(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try { return await verifier.verify(token) } catch (err) { console.warn('jwt verify failed:', err.name); return null }
}

async function publishClimbProgress(user, progress, capturedAt) {
  if (!PLAYER_DATA_INGEST_FUNCTION || !user?.sub) return
  try {
    await lambda.send(new InvokeCommand({
      FunctionName: PLAYER_DATA_INGEST_FUNCTION,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({
        source: 'recon.player-data-provider',
        detail: {
          action: 'ingest_bundle',
          producer: 'climb-progress',
          owner_user_id: user.sub,
          owner_email: user.email || null,
          snapshots: [{
            snapshot_id: `climb-${Date.now()}`,
            snapshot_type: 'road_to_champion_progress',
            fields: { road_to_champion_progress: progress },
            source: 'manual',
            captured_at: capturedAt,
            confidence: 0.5,
            verification: 'player_reported',
            visibility: 'private',
          }],
          events: [{
            event_type: 'road_to_champion_progress_updated',
            occurred_at: capturedAt,
            source: 'manual',
            visibility: 'private',
            data: {
              fields: Object.keys(progress).slice(0, 30),
            },
          }],
        },
      })),
    }))
  } catch (err) {
    // The climb table stays authoritative for its current-state UI. Player
    // history projection is best-effort so it never breaks a user's save.
    console.error('climb player-data publish failed:', err?.name || err?.message || 'unknown')
  }
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || 'GET'
  if (method === 'OPTIONS') return resp(200, {})

  const user = await userFrom(event)
  if (!user) return resp(401, { error: 'sign in required' })
  const sub = user.sub

  try {
    if (method === 'GET') {
      const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { sub } }))
      return resp(200, { progress: r.Item?.progress ?? null, updatedAt: r.Item?.updatedAt ?? null })
    }
    if (method === 'PUT') {
      let body = {}
      try { body = event.body ? JSON.parse(event.body) : {} } catch { return resp(400, { error: 'bad json' }) }
      const progress = body.progress
      if (typeof progress !== 'object' || progress === null || Array.isArray(progress)) return resp(400, { error: 'progress object required' })
      if (JSON.stringify(progress).length > 20000) return resp(413, { error: 'progress too large' })
      const updatedAt = new Date().toISOString()
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: { sub, progress, email: user.email || null, updatedAt },
      }))
      await publishClimbProgress(user, progress, updatedAt)
      return resp(200, { ok: true })
    }
    return resp(404, { error: 'unknown route' })
  } catch (err) {
    console.error('climb-progress error:', err)
    return resp(500, { error: 'internal' })
  }
}
