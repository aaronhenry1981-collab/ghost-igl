// recon6-coaching-sync — Phase 1 sync spine (Part A).
//
// One Cognito login → one profile → every surface reads/writes the same data.
// The desktop coach (Part B, igl-coach-ps5 session's lane) batch-posts
// CoachingEvents here; the /progress dashboard reads the aggregates. The
// (aiSuggestion vs coachAction vs outcome) triple per event is the training
// corpus that later proves the AI can run a rank band solo.
//
// Routes (existing HTTP API, user-JWT auth in-Lambda — house pattern):
//   POST /me/coaching-events   {events:[CoachingEvent...]}  ≤500/batch
//   GET  /me/coaching-history  session-level summaries
//   GET  /me/coaching-profile  aggregates: deaths by map/op, ai-vs-coach, trend
//
// CoachingEvent (validated loosely — the corpus schema evolves):
//   { sessionId, ts, phase, gameState{map,siteId,side,operatorId,timeLeftSec,
//     teamScore,enemyScore,lifeState}, aiSuggestion{line,confidence},
//     coachAction{spokenLine}, outcome{roundResult?,died?,tradedWithin?} }

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { aggregateProgressEvidence, sanitizeProgressEvidence } from './progress-evidence.mjs'

const REGION = process.env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const TABLE = process.env.EVENTS_TABLE || 'recon6-coaching-events'
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const MAX_BATCH_EVENTS = 100
const MAX_BODY_BYTES = 256 * 1024
const MAX_EVENT_BYTES = 8 * 1024
const DAILY_EVENT_LIMIT = 5000
const RETENTION_DAYS = 90

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_rvLy8WLQB',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '5bpa1cteenctoue24v4e245re8',
})

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}
const resp = (code, obj) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(obj) })

async function requireUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const user = await verifier.verify(token)
    return user.email_verified === true ? user : null
  } catch { return null }
}

async function requirePaidAccess(user) {
  if ((user?.['cognito:groups'] || []).includes('admins')) return true
  const email = String(user?.email || '').trim().toLowerCase()
  if (!email) return false
  const r = await ddb.send(new QueryCommand({
    TableName: SUBSCRIPTIONS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }))
  return (r.Items || []).some((row) =>
    ['active', 'trialing'].includes(row.status) &&
    ['pro', 'elite', 'champion'].includes(row.plan) &&
    Number.isFinite(Date.parse(row.current_period_end || '')) &&
    Date.parse(row.current_period_end) > Date.now()
  )
}

async function queryRecent(userId) {
  const r = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'userId = :u',
    FilterExpression: 'attribute_exists(sessionId)',
    ExpressionAttributeValues: { ':u': userId },
    ScanIndexForward: false,
    Limit: 2000,
  }))
  return r.Items || []
}

function boundedJson(value, depth = 0) {
  if (value == null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') return value.slice(0, 1000)
  if (depth >= 6) return null
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => boundedJson(v, depth + 1))
  if (typeof value === 'object') {
    const out = {}
    for (const [key, child] of Object.entries(value).slice(0, 40)) {
      const cleanKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60)
      if (cleanKey) out[cleanKey] = boundedJson(child, depth + 1)
    }
    return out
  }
  return null
}

async function reserveDailyQuota(userId, count) {
  const day = new Date().toISOString().slice(0, 10)
  const ttl = Math.ceil((Date.now() + 2 * 86400000) / 1000)
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId, sk: `quota#${day}` },
    ConditionExpression: 'attribute_not_exists(#count) OR #count <= :remaining',
    UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :inc, recordType = :type, ttl = :ttl',
    ExpressionAttributeNames: { '#count': 'count' },
    ExpressionAttributeValues: {
      ':remaining': DAILY_EVENT_LIMIT - count,
      ':zero': 0,
      ':inc': count,
      ':type': 'daily-quota',
      ':ttl': ttl,
    },
  }))
}

function sessionSummaries(items) {
  const bySession = {}
  for (const e of items) {
    const s = (bySession[e.sessionId] = bySession[e.sessionId] || {
      sessionId: e.sessionId, firstTs: e.ts, lastTs: e.ts, events: 0,
      maps: new Set(), deaths: 0, roundsWon: 0, roundsLost: 0,
      result: null, rpDelta: null, dominantCause: null,
    })
    s.events++
    if (e.ts < s.firstTs) s.firstTs = e.ts
    if (e.ts > s.lastTs) s.lastTs = e.ts
    if (e.gameState?.map) s.maps.add(e.gameState.map)
    if (e.outcome?.died) s.deaths++
    if (e.outcome?.roundResult === 'won') s.roundsWon++
    if (e.outcome?.roundResult === 'lost') s.roundsLost++
    // The match-end report is authoritative for result/RP and names the leak.
    // A session here is one coached match, so last report wins (there's one).
    if (e.report) {
      if (e.report.result) s.result = e.report.result
      if (e.report.rpDelta != null) s.rpDelta = e.report.rpDelta
      if (e.report.mechanics?.dominant) s.dominantCause = e.report.mechanics.dominant
    }
  }
  return Object.values(bySession)
    .map((s) => ({ ...s, maps: [...s.maps] }))
    .sort((a, b) => (a.firstTs < b.firstTs ? 1 : -1))
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || 'GET'
  const path = event.rawPath || ''
  if (method === 'OPTIONS') return resp(200, {})

  const user = await requireUser(event)
  if (!user) return resp(401, { error: 'sign in required' })
  if (!(await requirePaidAccess(user))) return resp(403, { error: 'active paid membership required' })
  const userId = user.sub

  try {
    if (method === 'POST' && path.endsWith('/me/coaching-events')) {
      if (Buffer.byteLength(event.body || '', 'utf8') > MAX_BODY_BYTES) return resp(413, { error: 'request too large' })
      let body = {}
      try { body = JSON.parse(event.body || '{}') } catch { return resp(400, { error: 'bad json' }) }
      if (!Array.isArray(body.events) || body.events.length > MAX_BATCH_EVENTS) {
        return resp(400, { error: `send 1-${MAX_BATCH_EVENTS} events per request` })
      }
      const events = body.events
      if (!events.length) return resp(400, { error: 'no events' })
      const puts = []
      for (const e of events) {
        if (!e || !e.sessionId || !e.ts) continue
        const clean = boundedJson(e)
        if (Buffer.byteLength(JSON.stringify(clean), 'utf8') > MAX_EVENT_BYTES) {
          return resp(413, { error: 'one or more events are too large' })
        }
        puts.push({
          PutRequest: {
            Item: {
              userId,
              sk: `${String(e.sessionId).slice(0, 60)}#${String(e.ts).slice(0, 40)}`,
              sessionId: String(e.sessionId).slice(0, 60),
              ts: String(e.ts).slice(0, 40),
              phase: String(clean.phase || '').slice(0, 30),
              gameState: clean.gameState || {},
              aiSuggestion: clean.aiSuggestion || null,
              coachAction: clean.coachAction || null,
              outcome: clean.outcome || null,
              progressEvidence: sanitizeProgressEvidence(clean.progressEvidence),
              training: clean.training && typeof clean.training === 'object' ? clean.training : null,
              // b98 mechanics report (present on match-end events): dominant
              // death cause, the drill prescribed, recurring-habit count,
              // rounds, result, RP. The dashboard reads this structured shape.
              report: clean.report || null,
              receivedAt: new Date().toISOString(),
              ttl: Math.ceil((Date.now() + RETENTION_DAYS * 86400000) / 1000),
            },
          },
        })
      }
      if (!puts.length) return resp(400, { error: 'no valid events' })
      try { await reserveDailyQuota(userId, puts.length) } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') return resp(429, { error: 'daily coaching event limit reached' })
        throw err
      }
      // BatchWrite in chunks of 25 with one retry pass on unprocessed items.
      let written = 0
      for (let i = 0; i < puts.length; i += 25) {
        let chunk = puts.slice(i, i + 25)
        for (let attempt = 0; attempt < 2 && chunk.length; attempt++) {
          const r = await ddb.send(new BatchWriteCommand({ RequestItems: { [TABLE]: chunk } }))
          const un = r.UnprocessedItems?.[TABLE] || []
          written += chunk.length - un.length
          chunk = un
        }
      }
      return resp(200, { written, received: events.length })
    }

    if (method === 'GET' && path.endsWith('/me/coaching-history')) {
      const items = await queryRecent(userId)
      return resp(200, { sessions: sessionSummaries(items) })
    }

    if (method === 'GET' && path.endsWith('/me/coaching-profile')) {
      const items = await queryRecent(userId)
      const sessions = sessionSummaries(items)
      const progressEvidence = aggregateProgressEvidence(items)
      const deathsByMap = {}, deathsByOp = {}, deathsByCause = {}
      const operatorPerformance = { attack: {}, defense: {} }
      const reports = []
      const trainingSessions = []
      let aiPairs = 0, aiCoachAgree = 0
      for (const e of items) {
        if (e.training?.lessonId) trainingSessions.push(e.training)
        const roundResult = e.outcome?.roundResult
        const side = e.gameState?.side
        const operator = String(e.gameState?.operatorId || '').trim()
        if ((side === 'attack' || side === 'defense') && operator && (roundResult === 'won' || roundResult === 'lost')) {
          const current = operatorPerformance[side][operator] || { rounds: 0, wins: 0, losses: 0 }
          current.rounds += 1
          if (roundResult === 'won') current.wins += 1
          else current.losses += 1
          operatorPerformance[side][operator] = current
        }
        if (e.outcome?.died) {
          const m = e.gameState?.map || 'unknown'
          const o = e.gameState?.operatorId || 'unknown'
          deathsByMap[m] = (deathsByMap[m] || 0) + 1
          deathsByOp[o] = (deathsByOp[o] || 0) + 1
          // Per-death cause (set by the coach's classifier) → the leak tally
          // that drives the mechanics report on /progress.
          const c = e.outcome?.cause
          if (c && c !== 'other') deathsByCause[c] = (deathsByCause[c] || 0) + 1
        }
        // Match-end mechanics reports, kept in time order for latest + trend.
        if (e.report?.mechanics?.dominant) reports.push({ ts: e.ts, ...e.report })
        if (e.aiSuggestion?.line && e.coachAction?.spokenLine) {
          aiPairs++
          const a = e.aiSuggestion.line.toLowerCase(), c = e.coachAction.spokenLine.toLowerCase()
          // Word-overlap proxy for "AI would have made the same call" — the
          // corpus metric that eventually justifies solo-AI rank bands.
          const aw = new Set(a.split(/\W+/).filter((w) => w.length > 3))
          const cw = new Set(c.split(/\W+/).filter((w) => w.length > 3))
          let inter = 0; aw.forEach((w) => { if (cw.has(w)) inter++ })
          if (inter / Math.max(1, Math.min(aw.size, cw.size)) > 0.5) aiCoachAgree++
        }
      }
      const recent = sessions.slice(0, 10).reverse()
      // Rank the leaks and pull the latest match's mechanics verdict. The
      // recurring leak = the dominant cause appearing across the most recent
      // matches — the entrenched-habit signal the coach speaks, made durable.
      reports.sort((a, b) => (a.ts < b.ts ? -1 : 1))
      const latest = reports[reports.length - 1] || null
      const topLeaks = Object.entries(deathsByCause).sort((a, b) => b[1] - a[1]).map(([cause, n]) => ({ cause, n }))
      const dominantTally = {}
      for (const r of reports.slice(-5)) dominantTally[r.mechanics.dominant] = (dominantTally[r.mechanics.dominant] || 0) + 1
      const recurringLeak = Object.entries(dominantTally).sort((a, b) => b[1] - a[1])[0] || null
      return resp(200, {
        totals: {
          sessions: sessions.length,
          events: items.length,
          deaths: Object.values(deathsByMap).reduce((a, b) => a + b, 0),
        },
        deathsByMap, deathsByOperator: deathsByOp, deathsByCause, topLeaks, operatorPerformance,
        // The mechanics coach, surfaced for the dashboard:
        mechanics: {
          latest: latest && {
            dominant: latest.mechanics.dominant,
            kind: latest.mechanics.kind || null,
            drill: latest.mechanics.drill || null,
            recurring: latest.mechanics.recurring || 0,
            result: latest.result || null,
            rpDelta: latest.rpDelta ?? null,
            date: latest.ts,
          },
          recurringLeak: recurringLeak ? { cause: recurringLeak[0], matches: recurringLeak[1] } : null,
        },
        progressEvidence: { skills: progressEvidence.skills, recent: progressEvidence.recent },
        trainingSessions: trainingSessions.slice(-40),
        observedRank: progressEvidence.observedRank,
        aiShadow: { pairs: aiPairs, agreements: aiCoachAgree },
        deathTrend: recent.map((s) => ({ sessionId: s.sessionId, date: s.firstTs, deaths: s.deaths })),
      })
    }

    return resp(404, { error: 'unknown route' })
  } catch (err) {
    console.error('coaching-sync error:', err)
    return resp(500, { error: 'internal' })
  }
}
