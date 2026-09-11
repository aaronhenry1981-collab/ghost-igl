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
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

const REGION = process.env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const lambda = new LambdaClient({ region: REGION })
const TABLE = process.env.EVENTS_TABLE || 'recon6-coaching-events'
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
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}
const resp = (code, obj) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(obj) })

async function requireUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try { return await verifier.verify(token) } catch { return null }
}

function compactFields(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && value !== ''))
}

function safeId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9._:-]/g, '-').slice(0, 80)
}

async function publishPlayerDataBundle(user, bundle) {
  if (!PLAYER_DATA_INGEST_FUNCTION || !user?.sub) return
  try {
    await lambda.send(new InvokeCommand({
      FunctionName: PLAYER_DATA_INGEST_FUNCTION,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({
        source: 'recon.player-data-provider',
        detail: {
          action: 'ingest_bundle',
          producer: 'coaching-sync',
          owner_user_id: user.sub,
          owner_email: user.email || null,
          ...bundle,
        },
      })),
    }))
  } catch (err) {
    // Coaching sync remains the source-of-truth for its own corpus even if the
    // historical intelligence projection is temporarily unavailable.
    console.error('coaching player-data publish failed:', err?.name || err?.message || 'unknown')
  }
}

function playerDataFromReports(events) {
  const snapshots = []
  const timeline = []
  const reports = (events || []).filter((e) => e?.report && e?.sessionId && e?.ts).slice(0, 10)

  for (const e of reports) {
    const capturedAt = new Date(e.ts).toString() === 'Invalid Date' ? new Date().toISOString() : new Date(e.ts).toISOString()
    const sessionId = safeId(e.sessionId)
    const tsId = safeId(capturedAt)
    const report = e.report || {}
    const mechanics = report.mechanics || {}
    const factual = compactFields({
      last_match_result: report.result,
      last_match_rp_delta: report.rpDelta,
      last_coached_map: e.gameState?.map,
      last_coached_site: e.gameState?.siteId,
      last_coached_side: e.gameState?.side,
      last_coached_operator: e.gameState?.operatorId,
    })

    if (Object.keys(factual).length) {
      snapshots.push({
        snapshot_id: `coaching-match-${sessionId}-${tsId}`.slice(0, 100),
        snapshot_type: 'coaching_match_observation',
        fields: factual,
        source: 'desktop',
        captured_at: capturedAt,
        confidence: 0.85,
        verification: 'client_observed',
        visibility: 'private',
      })
    }

    const coachingInsight = compactFields({
      identified_weakness: mechanics.dominant,
      recommended_drill: mechanics.drill,
      recurring_mistake_count: mechanics.recurring,
    })
    if (Object.keys(coachingInsight).length) {
      snapshots.push({
        snapshot_id: `coaching-insight-${sessionId}-${tsId}`.slice(0, 100),
        snapshot_type: 'coaching_insight',
        fields: coachingInsight,
        source: 'coach',
        captured_at: capturedAt,
        confidence: 0.75,
        verification: 'ai_derived',
        visibility: 'coach',
      })
    }

    timeline.push({
      event_id: `coaching-completed-${sessionId}-${tsId}`.slice(0, 100),
      event_type: 'coaching_session_completed',
      occurred_at: capturedAt,
      source: 'coach',
      visibility: 'private',
      data: compactFields({
        session_id: e.sessionId,
        result: report.result,
        rp_delta: report.rpDelta,
        map: e.gameState?.map,
        operator: e.gameState?.operatorId,
        dominant_weakness: mechanics.dominant,
      }),
    })
  }

  return { snapshots, events: timeline }
}

async function queryAll(userId) {
  const items = []
  let key
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ExclusiveStartKey: key,
    }))
    items.push(...(r.Items || []))
    key = r.LastEvaluatedKey
  } while (key)
  return items
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
  const userId = user.sub

  try {
    if (method === 'POST' && path.endsWith('/me/coaching-events')) {
      let body = {}
      try { body = JSON.parse(event.body || '{}') } catch { return resp(400, { error: 'bad json' }) }
      const events = Array.isArray(body.events) ? body.events.slice(0, 500) : []
      if (!events.length) return resp(400, { error: 'no events' })
      const puts = []
      for (const e of events) {
        if (!e || !e.sessionId || !e.ts) continue
        puts.push({
          PutRequest: {
            Item: {
              userId,
              sk: `${String(e.sessionId).slice(0, 60)}#${String(e.ts).slice(0, 40)}`,
              sessionId: String(e.sessionId).slice(0, 60),
              ts: String(e.ts).slice(0, 40),
              phase: String(e.phase || '').slice(0, 30),
              gameState: e.gameState || {},
              aiSuggestion: e.aiSuggestion || null,
              coachAction: e.coachAction || null,
              outcome: e.outcome || null,
              // b98 mechanics report (present on match-end events): dominant
              // death cause, the drill prescribed, recurring-habit count,
              // rounds, result, RP. The dashboard reads this structured shape.
              report: e.report || null,
              receivedAt: new Date().toISOString(),
            },
          },
        })
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

      // Project match-end outcomes into the durable Recon player timeline.
      // This is intentionally best-effort and never changes the success of the
      // existing coaching event sync path.
      const playerData = playerDataFromReports(events)
      if (playerData.snapshots.length || playerData.events.length) {
        await publishPlayerDataBundle(user, playerData)
      }

      return resp(200, { written, received: events.length })
    }

    if (method === 'GET' && path.endsWith('/me/coaching-history')) {
      const items = await queryAll(userId)
      return resp(200, { sessions: sessionSummaries(items) })
    }

    if (method === 'GET' && path.endsWith('/me/coaching-profile')) {
      const items = await queryAll(userId)
      const sessions = sessionSummaries(items)
      const deathsByMap = {}, deathsByOp = {}, deathsByCause = {}
      const reports = []
      let aiPairs = 0, aiCoachAgree = 0
      for (const e of items) {
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
        deathsByMap, deathsByOperator: deathsByOp, deathsByCause, topLeaks,
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
