// ghost-igl-mail-forward — support@r6coaching.com → Aaron's inbox.
//
// SES receipt rule stores the raw message in S3, then invokes this. We rewrite
// the envelope and re-send through SES:
//
//   From:     RECON6 Support <support@r6coaching.com>   (a domain we own, so
//             SPF/DKIM/DMARC pass — the original sender's From never would)
//   Reply-To: the original sender                       (so hitting Reply in
//             Gmail answers the customer, not AWS)
//   To:       FORWARD_TO
//
// The original DKIM-Signature and auth headers are stripped: they sign a body
// we're about to re-envelope, so leaving them guarantees a fail. SES re-signs
// with r6coaching.com's DKIM on the way out.
//
// Runtime nodejs20.x bundles AWS SDK v3 — this Lambda ships with no
// dependencies and no node_modules.

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { REGISTER_TABLE, classifyPrivacyRequest, plainText, registerItem } from './privacy-intake.mjs'
import { runPrivacyDeadlines } from './privacy-deadlines.mjs'

const REGION = process.env.AWS_REGION || 'us-east-1'
const s3 = new S3Client({ region: REGION })
const ses = new SESv2Client({ region: REGION })
const ddb = new DynamoDBClient({ region: REGION })

// Privacy requests are logged to the register with a due date before the
// forward goes out (privacy-intake.mjs). The forwarded subject is tagged so
// the request is visible in the inbox too. Never throws: a register failure
// is tagged loudly on the forward instead.
async function logPrivacyRequest(item) {
  try {
    await ddb.send(new PutItemCommand({
      TableName: REGISTER_TABLE,
      Item: Object.fromEntries(Object.entries(item).map(([k, v]) => [k, { S: String(v) }])),
      ConditionExpression: 'attribute_not_exists(request_id)',
    }))
    console.log('privacy_request_logged', JSON.stringify({ requestId: item.request_id, kind: item.kind, dueAt: item.due_at }))
    return true
  } catch (err) {
    if (err?.name === 'ConditionalCheckFailedException') return true // SES redelivery
    console.error('PRIVACY REQUEST NOT LOGGED', JSON.stringify({ requestId: item.request_id, error: err?.name }))
    return false
  }
}

const BUCKET = process.env.MAIL_BUCKET
const PREFIX = process.env.MAIL_PREFIX || 'support/'
const FROM = process.env.FROM_ADDRESS || 'RECON6 Support <support@r6coaching.com>'
// SES is still in sandbox: the destination MUST be a verified identity or the
// send is rejected. aaron@ironfrontdigital.com is verified (and is his Gmail,
// via Google Workspace). Add the personal address once production access lands.
const FORWARD_TO = (process.env.FORWARD_TO || 'aaron@ironfrontdigital.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/** Headers we must not carry across a re-envelope. */
const STRIP = new Set([
  'dkim-signature',
  'domainkey-signature',
  'authentication-results',
  'received-spf',
  'return-path',
  'sender',
  'from',
  'reply-to',
  'to',
  'cc',
  'bcc',
  'message-id'
])

function splitRaw(raw) {
  const i = raw.indexOf('\r\n\r\n')
  if (i !== -1) return [raw.slice(0, i), raw.slice(i + 4)]
  const j = raw.indexOf('\n\n')
  if (j !== -1) return [raw.slice(0, j), raw.slice(j + 2)]
  return [raw, '']
}

/** Unfold RFC-5322 continuation lines into whole headers. */
function parseHeaders(block) {
  const out = []
  for (const line of block.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += '\n' + line
    else if (line.trim()) out.push(line)
  }
  return out
}

const nameOf = (h) => h.slice(0, h.indexOf(':')).trim().toLowerCase()

// Plain objects from DynamoDB attribute values (no dependencies shipped).
function plain(av) {
  if (!av || typeof av !== 'object') return av
  if ('S' in av) return av.S
  if ('N' in av) return Number(av.N)
  if ('BOOL' in av) return av.BOOL
  if ('NULL' in av) return null
  if ('M' in av) return Object.fromEntries(Object.entries(av.M).map(([k, v]) => [k, plain(v)]))
  if ('L' in av) return av.L.map(plain)
  return undefined
}

async function scanPlain(TableName) {
  const rows = []
  let ExclusiveStartKey
  do {
    const r = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey }))
    for (const item of r.Items || []) rows.push(Object.fromEntries(Object.entries(item).map(([k, v]) => [k, plain(v)])))
    ExclusiveStartKey = r.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return rows
}

// Daily reminder (EventBridge recon6-privacy-deadlines-daily). Recipients come
// from the rule's input so no address lives in code or Lambda env.
async function privacyDeadlinesJob(event) {
  const notify = (Array.isArray(event.notify) ? event.notify : []).map((s) => String(s).trim()).filter((s) => s.includes('@'))
  const summary = await runPrivacyDeadlines({
    scan: scanPlain,
    mode: event.mode === 'preview' || !notify.length ? 'preview' : 'send',
    subjectPrefix: event.test ? '[TEST] ' : '',
    send: (subject, text) => ses.send(new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: notify },
      Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } },
    })),
  })
  console.log('privacy_deadlines', JSON.stringify({ ...summary, requests: summary.requests.length }))
  return summary
}

export async function handler(event) {
  // Direct invocations only: SES always delivers Records.
  if (!event?.Records && event?.job === 'privacy-deadlines') return privacyDeadlinesJob(event)
  const record = event?.Records?.[0]
  const messageId = record?.ses?.mail?.messageId
  if (!messageId) {
    console.error('no SES messageId on event')
    return { disposition: 'CONTINUE' }
  }

  const key = `${PREFIX}${messageId}`
  let raw
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    raw = await obj.Body.transformToString('utf-8')
  } catch (err) {
    console.error(`could not read s3://${BUCKET}/${key}:`, err.name)
    return { disposition: 'CONTINUE' }
  }

  const [headBlock, body] = splitRaw(raw)
  const headers = parseHeaders(headBlock)

  const originalFrom =
    headers.find((h) => nameOf(h) === 'from')?.slice(5).trim() || 'unknown sender'
  const originalTo = headers.find((h) => nameOf(h) === 'to')?.slice(3).trim() || ''
  const subject = headers.find((h) => nameOf(h) === 'subject')?.slice(8).trim() || '(no subject)'

  let kept = headers.filter((h) => !STRIP.has(nameOf(h)))

  const privacy = classifyPrivacyRequest(subject, plainText(headBlock, body))
  let privacyId = null
  if (privacy.isRequest) {
    const item = registerItem({ messageId, from: originalFrom, subject, kind: privacy.kind, receivedAt: record?.ses?.mail?.timestamp })
    const logged = await logPrivacyRequest(item)
    privacyId = item.request_id
    const tag = logged
      ? `[Privacy request ${item.request_id}, ${item.kind}, due ${item.due_at.slice(0, 10)}]`
      : '[Privacy request - NOT LOGGED, log it by hand: privacy-request.mjs log]'
    kept = [...kept.filter((h) => nameOf(h) !== 'subject'), `Subject: ${tag} ${subject}`]
  }

  const rebuilt = [
    `From: ${FROM}`,
    `Reply-To: ${originalFrom}`,
    `To: ${FORWARD_TO.join(', ')}`,
    `X-Original-From: ${originalFrom}`,
    `X-Original-To: ${originalTo}`,
    ...kept
  ].join('\r\n')

  const message = `${rebuilt}\r\n\r\n${body}`

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: FORWARD_TO },
        Content: { Raw: { Data: Buffer.from(message, 'utf-8') } }
      })
    )
    // No addresses or subjects in the log (it is kept, and it is personal
    // data): the message id finds the stored mail if needed.
    console.log('forwarded', JSON.stringify({ messageId, senderDomain: (originalFrom.match(/@([^>\s]+)/) || [])[1] || null, privacyRequest: privacyId }))
  } catch (err) {
    // Sandbox rejections land here. Log loudly; never throw, or SES bounces
    // the sender and the customer sees a failure.
    console.error(`FORWARD FAILED (${err.name}): ${err.message}`)
  }

  return { disposition: 'CONTINUE' }
}
