import { createHash } from 'node:crypto'
const sortKey = /^OBS#\d{12}#[a-zA-Z0-9_-]{8,100}$/
const binding = subject => createHash('sha256').update(subject).digest('hex')
const invalid = () => Object.assign(new Error('This history page is not valid for the current account. Reload recent history.'), { status: 400, code: 'HISTORY_CURSOR' })
// Navigation only, never authorization: every query still constructs PK from
// the verified principal. No token, secret or caller-supplied PK is accepted.
export function encodeHistoryCursor(subject, key) {
  if (key?.PK !== `USER#${subject}` || typeof key?.SK !== 'string' || !sortKey.test(key.SK)) throw new Error('Unexpected owned history pagination key')
  return Buffer.from(JSON.stringify({ v: 1, who: binding(subject), sk: key.SK })).toString('base64url')
}
export function decodeHistoryCursor(subject, cursor) {
  if (cursor === undefined || cursor === null || cursor === '') return undefined
  if (typeof cursor !== 'string' || !/^[a-zA-Z0-9_-]{1,400}$/.test(cursor)) throw invalid()
  let value
  try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) } catch { throw invalid() }
  if (!value || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'sk,v,who' || value.v !== 1 || value.who !== binding(subject) || typeof value.sk !== 'string' || !sortKey.test(value.sk)) throw invalid()
  return { PK: `USER#${subject}`, SK: value.sk }
}
