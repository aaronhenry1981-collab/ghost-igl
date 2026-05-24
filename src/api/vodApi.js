import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const comma = String(result).indexOf(',')
      resolve(comma >= 0 ? String(result).slice(comma + 1) : String(result))
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

// Backward-compat single-image API. Calls the new multi-image endpoint with
// a single-element images array — old UI keeps working unchanged.
export async function analyzeScreenshotApi(file, context = {}) {
  return analyzeSessionApi([file], context)
}

// Multi-image session analysis. Accepts 1-10 files + optional context hints
// (game_id, map, side, operator/character) and returns the session-shaped
// response.
//
// context shape: {
//   game_id?: 'r6' | 'cs2' | 'valorant' | 'ow2' | 'apex' | 'mvr' | 'halo' |
//             'finals' | 'cod' | 'fn' | 'rl',  // defaults server-side to 'r6'
//   map?: 'bank',
//   side?: 'attack',
//   operator?: 'Thermite',  // or 'character' — server accepts both
// }
export async function analyzeSessionApi(files, context = {}) {
  if (!API_URL) throw new Error('API not configured')
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('At least one screenshot is required')
  }
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) {
    const err = new Error('Please sign in to use VOD analysis.')
    err.code = 'not_authenticated'
    throw err
  }
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)

  // Encode all images in parallel
  const images = await Promise.all(
    files.map(async (file) => ({
      base64: await fileToBase64(file),
      media_type: file.type || 'image/png',
    }))
  )

  const body = { images }
  // game_id rides at the top level so the Lambda doesn't have to dig into
  // context to route. Default to r6 server-side if missing.
  if (context.game_id) body.game_id = context.game_id

  // Only include context fields the user actually set — empty strings would
  // confuse the AI into thinking the user specified empty values.
  const cleanContext = {}
  if (context.map) cleanContext.map = context.map
  if (context.side) cleanContext.side = context.side
  if (context.operator) cleanContext.operator = context.operator
  if (context.character) cleanContext.character = context.character
  if (context.site) cleanContext.site = context.site
  if (Object.keys(cleanContext).length > 0) body.context = cleanContext

  const res = await fetch(`${API_URL}/vod/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const err = new Error(errBody.message || errBody.error || `Analysis failed (${res.status})`)
    err.code = errBody.error
    err.status = res.status
    // Surface usage-cap fields from 429s so the UI can show "12/20 used, resets in 4 days"
    // without a second fetch.
    if (errBody.error === 'usage_limit_exceeded') {
      err.used = errBody.used
      err.limit = errBody.limit
      err.is_trial = errBody.is_trial
      err.period_end = errBody.period_end
      err.upgrade_url = errBody.upgrade_url
    }
    throw err
  }

  return res.json()
}
