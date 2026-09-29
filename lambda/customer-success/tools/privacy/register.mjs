// The privacy-request register (DynamoDB recon-privacy-requests), operator
// side. Rows are created automatically for email to support@ (lambda/
// mail-forward/privacy-intake.mjs, same row shape) or by hand with `log`; the
// daily privacy-deadlines job reminds staff until each row is closed here.
import { createHash } from 'node:crypto'
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export const REGISTER_TABLE = 'recon-privacy-requests'
export const DEADLINE_DAYS = 30
export const KINDS = ['deletion', 'export', 'access', 'unspecified']
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

/** Open requests a finished export / deletion satisfies. */
export function satisfiedBy(rows, email, action) {
  const h = emailHash(email)
  const kinds = action === 'delete' ? ['deletion', 'unspecified'] : ['export', 'access', 'unspecified']
  return rows.filter((r) => r.status === 'open' && r.email_hash === h && kinds.includes(r.kind || 'unspecified'))
}

export const daysLeft = (row, now = Date.now()) => Math.floor((Date.parse(row.due_at) - now) / DAY)

export function createRegister(ddb) {
  return {
    async all() {
      const rows = []
      let ExclusiveStartKey
      do {
        const r = await ddb.send(new ScanCommand({ TableName: REGISTER_TABLE, ExclusiveStartKey }))
        rows.push(...(r.Items || []))
        ExclusiveStartKey = r.LastEvaluatedKey
      } while (ExclusiveStartKey)
      return rows
    },
    async add(row) {
      await ddb.send(new PutCommand({ TableName: REGISTER_TABLE, Item: row, ConditionExpression: 'attribute_not_exists(request_id)' }))
      return row
    },
    async close(requestId, { outcome, note, actor }) {
      if (!OUTCOMES.includes(outcome)) throw new Error(`--outcome must be one of ${OUTCOMES.join(', ')}`)
      await ddb.send(new UpdateCommand({
        TableName: REGISTER_TABLE, Key: { request_id: requestId },
        // The closed row stays as the record of the request, keyed by hash:
        // the plain address is no longer needed once it is handled.
        UpdateExpression: 'SET #s = :s, outcome = :o, closed_at = :t, closed_by = :a, close_note = :n REMOVE email',
        ConditionExpression: '#s = :open',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': outcome === 'completed' ? 'completed' : 'closed', ':o': outcome, ':t': new Date().toISOString(), ':a': actor || 'privacy-tool', ':n': String(note || '').slice(0, 500), ':open': 'open' },
      }))
    },
  }
}
