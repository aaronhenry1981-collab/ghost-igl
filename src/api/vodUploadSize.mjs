// Base64 images are carried inside JSON through API Gateway to synchronous
// Lambda (6 MiB invocation limit). Leave room for the event envelope/escaping.
export const MAX_VOD_REQUEST_BYTES = 4 * 1024 * 1024
const MAX_EVENT_BODY_BYTES = 5 * 1024 * 1024

function sizeError() {
  return Object.assign(new Error('These screenshots exceed the combined review size limit (4 MiB encoded). Choose fewer or smaller screenshots. No review started; no review allowance was used.'), {
    code: 'screenshot_batch_too_large', allowance_consumed: false,
  })
}

export function buildVodRequestBody(images, context = {}) {
  const body = { images }
  if (context.game_id) body.game_id = context.game_id
  if (context.analysis_type) body.analysis_type = context.analysis_type
  const cleanContext = {}
  for (const field of ['map', 'side', 'operator', 'character', 'site']) {
    if (context[field]) cleanContext[field] = context[field]
  }
  if (Object.keys(cleanContext).length > 0) body.context = cleanContext
  return body
}

// Estimate without reading a single image: base64 has exactly 4*ceil(n/3)
// ASCII bytes. JSON metadata includes UTF-8 and escape overhead, not filenames.
export function preflightVodUpload(files, context = {}) {
  const body = buildVodRequestBody(files.map(file => ({ base64: '', media_type: file.type || 'image/png' })), context)
  const metadata = JSON.stringify(body)
  let bytes = new TextEncoder().encode(metadata).byteLength
  // API Gateway carries the request as an event.body string. Account for its
  // second layer of JSON escaping too, leaving at least 1 MiB for other fields.
  let eventBytes = new TextEncoder().encode(JSON.stringify(metadata)).byteLength
  for (const file of files) {
    if (!Number.isSafeInteger(file.size) || file.size < 0) {
      throw Object.assign(new Error('Could not check a screenshot size. Choose the screenshots again. No review started; no review allowance was used.'), {
        code: 'screenshot_size_unavailable', allowance_consumed: false,
      })
    }
    bytes += 4 * Math.ceil(file.size / 3)
    eventBytes += 4 * Math.ceil(file.size / 3)
    if (bytes > MAX_VOD_REQUEST_BYTES || eventBytes > MAX_EVENT_BODY_BYTES) throw sizeError()
  }
  if (bytes > MAX_VOD_REQUEST_BYTES || eventBytes > MAX_EVENT_BODY_BYTES) throw sizeError()
  return body
}

// Recheck the actual serialized payload before fetch. This also protects
// against unexpected FileReader output or metadata changing during encoding.
export function serializeVodRequest(body) {
  const serialized = JSON.stringify(body)
  if (new TextEncoder().encode(serialized).byteLength > MAX_VOD_REQUEST_BYTES ||
      new TextEncoder().encode(JSON.stringify(serialized)).byteLength > MAX_EVENT_BODY_BYTES) throw sizeError()
  return serialized
}
