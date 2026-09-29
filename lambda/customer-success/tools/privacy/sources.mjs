// Read-only collectors for one person's data across Recon's stores, used by
// tools/privacy-request.mjs (data export and deletion requests). Every
// function only READS. Each record comes back with the table and primary key
// needed to delete or anonymise it later.
import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { AdminListGroupsForUserCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider'
import { createHash } from 'node:crypto'

export const TABLES = Object.freeze({
  profiles: 'ghost-igl-profiles',
  subscriptions: 'ghost-igl-subscriptions',
  crmLog: 'ghost-igl-crm-log',
  referrals: 'ghost-igl-referrals',
  climb: 'recon6-climb-progress',
  coachingEvents: 'recon6-coaching-events',
  bookings: 'recon6-bookings',
  reviewArchive: 'recon6-review-archive',
  customerSuccess: 'recon-customer-success',
  playerStore: 'recon-player-store',
  playerEvents: 'recon-player-events',
  playerSnapshots: 'recon-player-snapshots',
  playerIdentities: 'recon-player-identities',
})

// Primary key attribute names per table (used to build delete keys).
export const KEYS = Object.freeze({
  [TABLES.profiles]: ['email'],
  [TABLES.subscriptions]: ['stripe_customer_id'],
  [TABLES.crmLog]: ['email'],
  [TABLES.referrals]: ['referrer_email', 'referred_email'],
  [TABLES.climb]: ['sub'],
  [TABLES.coachingEvents]: ['userId', 'sk'],
  [TABLES.bookings]: ['slotId'],
  [TABLES.reviewArchive]: ['review_id'],
  [TABLES.customerSuccess]: ['pk', 'sk'],
  [TABLES.playerStore]: ['recon_player_id'],
  [TABLES.playerEvents]: ['recon_player_id', 'event_key'],
  [TABLES.playerSnapshots]: ['recon_player_id', 'snapshot_key'],
  [TABLES.playerIdentities]: ['recon_player_id', 'identity_key'],
})

export const AUDIT_TABLE = 'ghost-igl-audit-log'

// The VOD review archive stores this instead of the email (lambda/vod).
export const reviewArchiveHash = (email) => createHash('sha256').update(String(email || '')).digest('hex').slice(0, 24)

async function pageAll(ddb, Command, input) {
  const items = []
  let ExclusiveStartKey
  do {
    const r = await ddb.send(new Command({ ...input, ExclusiveStartKey }))
    items.push(...(r.Items || []))
    ExclusiveStartKey = r.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return items
}

export function createSources({ ddb, cognito, userPoolId }) {
  return {
    async cognitoUser(email) {
      const r = await cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, Filter: `email = "${email.replace(/"/g, '')}"`, Limit: 10 }))
      const users = r.Users || []
      const out = []
      for (const u of users) {
        const attrs = Object.fromEntries((u.Attributes || []).map((a) => [a.Name, a.Value]))
        const g = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: userPoolId, Username: u.Username }))
        out.push({ username: u.Username, sub: attrs.sub, email: attrs.email, status: u.UserStatus, created: u.UserCreateDate, groups: (g.Groups || []).map((x) => x.GroupName), attributes: attrs })
      }
      return out
    },
    async profile(email) {
      const r = await ddb.send(new GetCommand({ TableName: TABLES.profiles, Key: { email } }))
      return r.Item ? [r.Item] : []
    },
    subscriptions: (email) => pageAll(ddb, QueryCommand, { TableName: TABLES.subscriptions, IndexName: 'email-index', KeyConditionExpression: 'email = :e', ExpressionAttributeValues: { ':e': email } }),
    async crmLog(email) {
      const r = await ddb.send(new GetCommand({ TableName: TABLES.crmLog, Key: { email } }))
      return r.Item ? [r.Item] : []
    },
    async referrals(email) {
      const asReferrer = await pageAll(ddb, QueryCommand, { TableName: TABLES.referrals, KeyConditionExpression: 'referrer_email = :e', ExpressionAttributeValues: { ':e': email } })
      const asReferred = await pageAll(ddb, ScanCommand, { TableName: TABLES.referrals, FilterExpression: 'referred_email = :e', ExpressionAttributeValues: { ':e': email } })
      const seen = new Set()
      return [...asReferrer, ...asReferred].filter((i) => { const k = `${i.referrer_email}|${i.referred_email}`; if (seen.has(k)) return false; seen.add(k); return true })
    },
    async climb(sub) {
      if (!sub) return []
      const r = await ddb.send(new GetCommand({ TableName: TABLES.climb, Key: { sub } }))
      return r.Item ? [r.Item] : []
    },
    coachingEvents: (sub) => (sub ? pageAll(ddb, QueryCommand, { TableName: TABLES.coachingEvents, KeyConditionExpression: 'userId = :u', ExpressionAttributeValues: { ':u': sub } }) : []),
    // Booking slots keep the customer as a nested `customer` map; credit rows
    // (slotId = creditKey(email)) carry a top-level `email`.
    bookings: (email) => pageAll(ddb, ScanCommand, { TableName: TABLES.bookings, FilterExpression: 'customer.email = :e OR email = :e', ExpressionAttributeValues: { ':e': email } }),
    reviewArchive: (email) => pageAll(ddb, ScanCommand, { TableName: TABLES.reviewArchive, FilterExpression: 'email_hash = :h', ExpressionAttributeValues: { ':h': reviewArchiveHash(email) } }),
    async customerSuccess(contactKey) {
      const own = await pageAll(ddb, QueryCommand, { TableName: TABLES.customerSuccess, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `C#${contactKey}` } })
      // Pointer/marker items outside the contact partition that name the key
      // (case-number and case-id pointers, proactive-care markers).
      const refs = await pageAll(ddb, ScanCommand, { TableName: TABLES.customerSuccess, FilterExpression: 'contactKey = :k AND pk <> :pk', ExpressionAttributeValues: { ':k': contactKey, ':pk': `C#${contactKey}` } })
      return [...own, ...refs]
    },
    // Cognito subs recorded by the admin console's "Delete user" (audit
    // action user.delete, details.cognito_sub), so data keyed by the sub can
    // still be found after the Cognito account is gone.
    async deletedAccountSubs(email) {
      const items = await pageAll(ddb, ScanCommand, { TableName: AUDIT_TABLE, FilterExpression: '#a = :a AND #t = :t', ExpressionAttributeNames: { '#a': 'action', '#t': 'target' }, ExpressionAttributeValues: { ':a': 'user.delete', ':t': email } })
      return [...new Set(items.map((i) => i.details?.cognito_sub).filter(Boolean))]
    },
    // Console deletions and completed privacy purges, for the worklist.
    async deletionAudit() {
      return pageAll(ddb, ScanCommand, { TableName: AUDIT_TABLE, FilterExpression: '#a IN (:d, :p)', ExpressionAttributeNames: { '#a': 'action' }, ExpressionAttributeValues: { ':d': 'user.delete', ':p': 'privacy.delete' } })
    },
    async playerData(reconPlayerId) {
      if (!reconPlayerId) return { store: [], events: [], snapshots: [], identities: [] }
      const q = (TableName) => pageAll(ddb, QueryCommand, { TableName, KeyConditionExpression: 'recon_player_id = :r', ExpressionAttributeValues: { ':r': reconPlayerId } })
      return { store: await q(TABLES.playerStore), events: await q(TABLES.playerEvents), snapshots: await q(TABLES.playerSnapshots), identities: await q(TABLES.playerIdentities) }
    },
  }
}
