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

const REGION = process.env.AWS_REGION || 'us-east-1'
const s3 = new S3Client({ region: REGION })
const ses = new SESv2Client({ region: REGION })

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

export async function handler(event) {
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

  const kept = headers.filter((h) => !STRIP.has(nameOf(h)))
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
    console.log(`forwarded "${subject}" from ${originalFrom} → ${FORWARD_TO.join(', ')}`)
  } catch (err) {
    // Sandbox rejections land here. Log loudly; never throw, or SES bounces
    // the sender and the customer sees a failure.
    console.error(`FORWARD FAILED (${err.name}): ${err.message}`)
  }

  return { disposition: 'CONTINUE' }
}
