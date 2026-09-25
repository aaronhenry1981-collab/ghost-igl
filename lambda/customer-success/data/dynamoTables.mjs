// DynamoDB + Cognito implementation of the read-only `tables` interface.
//
// READ-ONLY by design: this service never writes to the subscriptions,
// profiles, bookings, climb, coaching, player-data, referrals or crm-log
// tables. (The single exception, suppression mirroring into crm-log, lives in
// dynamoStore.mjs and is behind its own flag.)
//
// Clients are injected so this module can be exercised with fake `send()`.

import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ListUsersCommand, ListUsersInGroupCommand } from '@aws-sdk/client-cognito-identity-provider'
import { NotConnectedError } from './assemble.mjs'
import { normalizeEmail } from '../domain/facts.mjs'

const MAX_SCAN_PAGES = 40

async function scanAll(ddb, input) {
  const items = []
  let ExclusiveStartKey
  let pages = 0
  do {
    const page = await ddb.send(new ScanCommand({ ...input, ExclusiveStartKey }))
    items.push(...(page.Items || []))
    ExclusiveStartKey = page.LastEvaluatedKey
    pages += 1
  } while (ExclusiveStartKey && pages < MAX_SCAN_PAGES)
  if (ExclusiveStartKey) throw new Error(`scan of ${input.TableName} exceeded ${MAX_SCAN_PAGES} pages`)
  return items
}

async function queryAll(ddb, input, maxPages = 10) {
  const items = []
  let ExclusiveStartKey
  let pages = 0
  do {
    const page = await ddb.send(new QueryCommand({ ...input, ExclusiveStartKey }))
    items.push(...(page.Items || []))
    ExclusiveStartKey = page.LastEvaluatedKey
    pages += 1
  } while (ExclusiveStartKey && pages < maxPages)
  return items
}

function attr(user, name) {
  return (user.Attributes || user.UserAttributes || []).find((a) => a.Name === name)?.Value || null
}

function mapCognitoUser(user, admins) {
  const sub = attr(user, 'sub')
  return {
    email: attr(user, 'email'),
    sub,
    status: user.UserStatus || null,
    enabled: user.Enabled !== false,
    createdAt: user.UserCreateDate ? new Date(user.UserCreateDate).toISOString() : null,
    groups: sub && admins.has(sub) ? ['admins'] : [],
  }
}

// Cognito filter strings are quoted; refuse anything that could break out.
export function cognitoEmailFilter(email) {
  const value = String(email || '')
  if (!value || /["\\\n\r]/.test(value) || value.length > 254) throw new Error('invalid email for Cognito filter')
  return `email = "${value}"`
}

export function createDynamoTables({ ddb, cognito, userPoolId, names = {}, adminGroup = 'admins' }) {
  const need = (key) => {
    const name = names[key]
    if (!name) throw new NotConnectedError(key)
    return name
  }

  async function adminSubs() {
    if (!cognito || !userPoolId) return new Set()
    const subs = new Set()
    let NextToken
    do {
      const page = await cognito.send(new ListUsersInGroupCommand({ UserPoolId: userPoolId, GroupName: adminGroup, NextToken, Limit: 60 }))
      for (const u of page.Users || []) {
        const sub = attr(u, 'sub')
        if (sub) subs.add(sub)
      }
      NextToken = page.NextToken
    } while (NextToken)
    return subs
  }

  return {
    async listCognitoUsers() {
      if (!cognito || !userPoolId) throw new NotConnectedError('cognito')
      const admins = await adminSubs()
      const users = []
      let PaginationToken
      do {
        const page = await cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, Limit: 60, PaginationToken }))
        users.push(...(page.Users || []).map((u) => mapCognitoUser(u, admins)))
        PaginationToken = page.PaginationToken
      } while (PaginationToken)
      return users
    },
    async getCognitoUserByEmail(email) {
      if (!cognito || !userPoolId) throw new NotConnectedError('cognito')
      const normalized = normalizeEmail(email)
      const page = await cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, Filter: cognitoEmailFilter(normalized), Limit: 5 }))
      const admins = await adminSubs()
      const users = (page.Users || []).map((u) => mapCognitoUser(u, admins))
      return users.find((u) => u.email === normalized) || users[0] || null
    },
    async subscriptionsByEmail(email) {
      return queryAll(ddb, {
        TableName: need('subscriptions'),
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': normalizeEmail(email) },
      })
    },
    async scanSubscriptions() {
      return scanAll(ddb, { TableName: need('subscriptions') })
    },
    async getProfile(email) {
      const r = await ddb.send(new GetCommand({ TableName: need('profiles'), Key: { email: normalizeEmail(email) } }))
      return r.Item || null
    },
    async scanProfiles() {
      return scanAll(ddb, { TableName: need('profiles') })
    },
    async getClimb(sub) {
      if (!sub) return null
      const r = await ddb.send(new GetCommand({ TableName: need('climb'), Key: { sub } }))
      return r.Item || null
    },
    async scanClimb() {
      return scanAll(ddb, { TableName: need('climb') })
    },
    // Booking rows are keyed by slot time, not by customer. The table is small
    // (tens of rows); a GSI on customer email is a documented follow-up.
    async scanBookings() {
      return scanAll(ddb, { TableName: need('bookings') })
    },
    async coachingSummary(sub) {
      if (!sub) return null
      const rows = await queryAll(ddb, {
        TableName: need('coachingEvents'),
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': sub },
        ProjectionExpression: 'sessionId, ts',
      }, 5)
      if (!rows.length) return { sessions: 0, lastSessionAt: null }
      const last = rows.map((r) => r.ts).filter(Boolean).sort().pop() || null
      return { sessions: new Set(rows.map((r) => r.sessionId)).size, lastSessionAt: last }
    },
    async getPlayerRecord(reconPlayerId) {
      const r = await ddb.send(new GetCommand({ TableName: need('playerStore'), Key: { recon_player_id: reconPlayerId } }))
      return r.Item || null
    },
    async scanPlayerRecords() {
      return scanAll(ddb, { TableName: need('playerStore'), ProjectionExpression: 'recon_player_id, owner_email, owner_user_id, canonical, created_at' })
    },
    async playerEvents(reconPlayerId, limit = 50) {
      const r = await ddb.send(new QueryCommand({
        TableName: need('playerEvents'),
        KeyConditionExpression: 'recon_player_id = :id',
        ExpressionAttributeValues: { ':id': reconPlayerId },
        ScanIndexForward: false,
        Limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      }))
      return r.Items || []
    },
    async referralsFor(email) {
      const e = normalizeEmail(email)
      const table = need('referrals')
      const [asReferrer, referred] = await Promise.all([
        queryAll(ddb, { TableName: table, KeyConditionExpression: 'referrer_email = :e', ExpressionAttributeValues: { ':e': e } }, 3),
        queryAll(ddb, { TableName: table, IndexName: 'referred-email-index', KeyConditionExpression: 'referred_email = :e', ExpressionAttributeValues: { ':e': e } }, 1),
      ])
      return { asReferrer, referredBy: referred[0] || null }
    },
    async scanReferrals() {
      return scanAll(ddb, { TableName: need('referrals') })
    },
    async getCrmLog(email) {
      const r = await ddb.send(new GetCommand({ TableName: need('crmLog'), Key: { email: normalizeEmail(email) } }))
      return r.Item || null
    },
    async scanCrmLog() {
      return scanAll(ddb, { TableName: need('crmLog') })
    },
    async listTestimonials() {
      const rows = await scanAll(ddb, { TableName: need('testimonials') })
      return rows.filter((row) => row.id !== '__demo_video__')
    },
  }
}
