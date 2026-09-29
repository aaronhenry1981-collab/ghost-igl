// The privacy-request register (DynamoDB recon-privacy-requests), operator
// side. Rows are created automatically for email to support@ (lambda/
// mail-forward/privacy-intake.mjs, same row shape) or by hand with `log`; the
// daily privacy-deadlines job reminds staff until each row is closed here.
//
// Completion rules (what a finished export / deletion may close):
//   export            closes export and access requests; on an export+deletion
//                     request it only records the export part
//   verified deletion closes deletion requests; on an export+deletion request
//                     it records the deletion part and closes the request only
//                     once the export part is also done
//   unspecified       never closed automatically: read the request and set its
//                     kind (`privacy-request.mjs kind`)
// A deletion counts only when every targeted record was re-read and found
// gone (apply.mjs verifyDeletionPlan), never on "no errors" alone.
import { createHash } from 'node:crypto'
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export const REGISTER_TABLE = 'recon-privacy-requests'
export const DEADLINE_DAYS = 30
export const KINDS = ['deletion', 'export', 'access', 'export+deletion', 'unspecified']
export const OUTCOMES = ['completed', 'rejected', 'not_a_request', 'test']
const DAY = 86400000

export const emailHash = (email) => createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex').slice(0, 24)

/** A manually logged request (arrived by another channel). */
export function manualRow({ email, kind, receivedAt, note }) {
  if (!KINDS.includes(kind)) throw new Error(`--kind must be one of ${KINDS.join(', ')}`)
  const received = new Date(receivedAt)
  if (Number.isNaN(received.getTime())) throw new Error('--received must be an ISO date (when the request arrived)')
  const lower = String(email).trim().toLowerCase()
  const id = `PR-${received.toISOString().slice(0, 10).replace(/-/g, '')}-${createHash('sha256').update(`${lower}|${received.toISOString()}`).digest('hex').slice(0, 6)}`
  return {
    request_id: id, status: 'open', kind, source: 'manual',
    received_at: received.toISOString(), due_at: new Date(received.getTime() + DEADLINE_DAYS * DAY).toISOString(),
    email: lower, email_hash: emailHash(lower), ...(note ? { note: String(note).slice(0, 500) } : {}),
  }
}

/**
 * What a finished action does to this person's open requests.
 *   action 'export' | 'delete'; for 'delete', `verified` must be true (every
 *   targeted record re-read and gone) or nothing is updated.
 * Returns { updates: [{ requestId, part, close }], untouched: [{ requestId, kind, why }] }.
 */
export function completionPlan(rows, email, action, { verified = false } = {}) {
  const h = emailHash(email)
  const mine = rows.filter((r) => r.status === 'open' && r.email_hash === h)
  const updates = []
  const untouched = []
  for (const r of mine) {
    const kind = r.kind || 'unspecified'
    if (action === 'export') {
      if (kind === 'export' || kind === 'access') updates.push({ requestId: r.request_id, part: 'export', close: true })
      else if (kind === 'export+deletion') updates.push({ requestId: r.request_id, part: 'export', close: Boolean(r.deletion_completed_at) })
      else untouched.push({ requestId: r.request_id, kind, why: kind === 'deletion' ? 'a deletion request is not completed by an export' : 'unspecified: set its kind first' })
    } else if (action === 'delete') {
      if (!verified) { untouched.push({ requestId: r.request_id, kind, why: 'deletion not verified' }); continue }
      if (kind === 'deletion') updates.push({ requestId: r.request_id, part: 'deletion', close: true })
      else if (kind === 'export+deletion') updates.push({ requestId: r.request_id, part: 'deletion', close: Boolean(r.export_completed_at) })
      else untouched.push({ requestId: r.request_id, kind, why: kind === 'unspecified' ? 'unspecified: set its kind first' : `a ${kind} request is not completed by a deletion` })
    }
  }
  return { updates, untouched }
}

/** Open export+deletion requests whose export is not done yet (deleting first would make the export impossible). */
export const exportStillOwed = (rows, email) => rows.filter((r) => r.status === 'open' && r.email_hash === emailHash(email) && r.kind === 'export+deletion' && !r.export_completed_at)

export const daysLeft = (row, now = Date.now()) => Math.floor((Date.parse(row.due_at) - now) / DAY)

export function createRegister(ddb) {
  const closeFields = (outcome, note, actor, at) => ({ ':s': outcome === 'completed' ? 'completed' : 'closed', ':o': outcome, ':t': at, ':a': actor || 'privacy-tool', ':n': String(note || '').slice(0, 500) })
  return {
    async all() {
      const rows = []
      let ExclusiveStartKey
      do {
        const r = await ddb.send(new ScanCommand({ TableName: REGISTER_TABLE, ExclusiveStartKey, ConsistentRead: true }))
        rows.push(...(r.Items || []))
        ExclusiveStartKey = r.LastEvaluatedKey
      } while (ExclusiveStartKey)
      return rows
    },
    async add(row) {
      await ddb.send(new PutCommand({ TableName: REGISTER_TABLE, Item: row, ConditionExpression: 'attribute_not_exists(request_id)' }))
      return row
    },
    // Record one finished part; close the request if the plan says so. The
    // closed row stays as the record, keyed by hash: the address is removed.
    async complete({ requestId, part, close }, { note, actor }) {
      const at = new Date().toISOString()
      const partField = part === 'export' ? 'export_completed_at' : 'deletion_completed_at'
      await ddb.send(new UpdateCommand({
        TableName: REGISTER_TABLE, Key: { request_id: requestId },
        UpdateExpression: close
          ? `SET ${partField} = :t, #s = :s, outcome = :o, closed_at = :t, closed_by = :a, close_note = :n REMOVE email`
          : `SET ${partField} = :t, ${part}_note = :n`,
        ConditionExpression: '#s = :open',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: close ? { ...closeFields('completed', note, actor, at), ':open': 'open' } : { ':t': at, ':n': String(note || '').slice(0, 500), ':open': 'open' },
      }))
    },
    async setKind(requestId, kind) {
      if (!KINDS.includes(kind)) throw new Error(`--kind must be one of ${KINDS.join(', ')}`)
      await ddb.send(new UpdateCommand({
        TableName: REGISTER_TABLE, Key: { request_id: requestId },
        UpdateExpression: 'SET kind = :k', ConditionExpression: '#s = :open',
        ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':k': kind, ':open': 'open' },
      }))
    },
    async close(requestId, { outcome, note, actor }) {
      if (!OUTCOMES.includes(outcome)) throw new Error(`--outcome must be one of ${OUTCOMES.join(', ')}`)
      await ddb.send(new UpdateCommand({
        TableName: REGISTER_TABLE, Key: { request_id: requestId },
        UpdateExpression: 'SET #s = :s, outcome = :o, closed_at = :t, closed_by = :a, close_note = :n REMOVE email',
        ConditionExpression: '#s = :open',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ...closeFields(outcome, note, actor, new Date().toISOString()), ':open': 'open' },
      }))
    },
  }
}
