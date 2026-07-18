function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function resolveSite(sites, requestedSite) {
  if (!requestedSite || !Array.isArray(sites)) return null
  const wanted = normalize(requestedSite)
  return sites.find((site) => normalize(site.id) === wanted || normalize(site.name) === wanted) || null
}

// The selected site is serialized independently and never character-truncated.
// This prevents later sites in a map's array from disappearing behind a map-
// level prompt budget (the previous behavior).
export function buildMapContext(map, requestedSite) {
  const selectedSite = resolveSite(map?.sites, requestedSite)
  if (!selectedSite) return JSON.stringify(map, null, 2).slice(0, 2400)

  return [
    `SELECTED SITE (authoritative, complete):\n${JSON.stringify(selectedSite, null, 2)}`,
    `MAP SUPPORTING CONTEXT:\n${JSON.stringify({
      name: map.name,
      other_sites: (map.sites || []).filter((site) => site.id !== selectedSite.id).map(({ id, name, floor }) => ({ id, name, floor })),
      bans: map.bans || null,
    }, null, 2).slice(0, 1800)}`,
  ].join('\n')
}

const phases = new Set(['prep', 'action', 'post-plant', 'post-round', 'mid-fight', 'rotating', 'unknown'])

export function validateAnalysis(value, expectedImages) {
  const errors = []
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['result must be an object']
  if (value.error === 'wrong_game' && typeof value.message === 'string') return []
  if (!value.session || typeof value.session.headline !== 'string') errors.push('session.headline must be a string')
  if (!Number.isInteger(value.session?.score) || value.session.score < 0 || value.session.score > 100) errors.push('session.score must be an integer from 0 to 100')
  if (value.session?.image_count !== expectedImages) errors.push(`session.image_count must equal ${expectedImages}`)
  if (!Array.isArray(value.per_image) || value.per_image.length !== expectedImages) {
    errors.push(`per_image must contain exactly ${expectedImages} items`)
  } else {
    value.per_image.forEach((item, index) => {
      if (item?.image_index !== index) errors.push(`per_image[${index}].image_index must equal ${index}`)
      if (!phases.has(item?.detected?.round_phase)) errors.push(`per_image[${index}].detected.round_phase is invalid`)
      for (const key of ['what_went_wrong', 'what_went_right', 'specific_advice']) {
        if (!Array.isArray(item?.[key])) errors.push(`per_image[${index}].${key} must be an array`)
      }
      if (typeof item?.what_happened !== 'string') errors.push(`per_image[${index}].what_happened must be a string`)
    })
  }
  if (!Array.isArray(value.patterns?.recurring_weaknesses) || !Array.isArray(value.patterns?.standout_strengths)) errors.push('patterns arrays are required')
  if (!Array.isArray(value.practice_plan?.this_week)) errors.push('practice_plan.this_week must be an array')
  return errors
}

export function buildRefundUpdate(sub, isTrial, tableName, now = new Date().toISOString()) {
  const counter = isTrial ? 'vod_lifetime_used' : 'vod_sessions_used'
  return {
    TableName: tableName,
    Key: { stripe_customer_id: sub.stripe_customer_id },
    UpdateExpression: `SET ${counter} = ${counter} - :one, vod_updated_at = :now`,
    ConditionExpression: `attribute_exists(${counter}) AND ${counter} > :zero`,
    ExpressionAttributeValues: { ':one': 1, ':zero': 0, ':now': now },
  }
}
