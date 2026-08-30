function firstText(values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || null
}

export function buildVodCoachingEvent(analysis, context = {}, options = {}) {
  const session = analysis?.session || {}
  const firstImage = analysis?.per_image?.[0] || {}
  const detected = firstImage.detected || {}
  const dominant = firstText([
    ...(analysis?.patterns?.recurring_weaknesses || []),
    ...(firstImage.what_went_wrong || []),
    session.headline,
  ])
  const drill = firstText(analysis?.practice_plan?.this_week || [])
  const now = options.now || new Date().toISOString()
  const sessionId = options.sessionId || `vod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  return {
    sessionId,
    ts: now,
    phase: 'round-review',
    gameState: {
      map: firstText([session.detected_map, detected.map, context.map]),
      siteId: firstText([detected.site, context.site]),
      side: firstText([session.detected_side, detected.side, context.side]),
      operatorId: firstText([detected.character, detected.operator, context.character, context.operator]),
    },
    report: {
      source: 'round-review',
      mechanics: {
        dominant,
        drill,
      },
      score: Number.isFinite(session.score) ? session.score : null,
      imageCount: Number.isFinite(session.image_count) ? session.image_count : null,
    },
  }
}
