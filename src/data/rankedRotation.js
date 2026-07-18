// Ranked rotation is operational data, not a permanent property of a map.
// Keep the effective date and the primary-source announcement beside the IDs
// so stale pool flags are easy to detect and update after each Ubisoft patch.
export const RANKED_ROTATION = Object.freeze({
  effectiveDate: '2026-07-16',
  verifiedDate: '2026-07-18',
  season: 'Y11S2 Operation System Override (mid-season)',
  sourceUrl: 'https://news.ubisoft.com/en-us/article/6Cs9lXypzDo1pQSE43KDH4/rainbow-six-siege-operation-system-override-midseason-update-everything-you-need-to-know',
  added: Object.freeze(['kanal', 'villa', 'theme-park']),
  removed: Object.freeze(['coastline', 'outback', 'emerald-plains']),
  mapIds: Object.freeze([
    'bank', 'border', 'chalet', 'clubhouse', 'consulate', 'kafe', 'kanal',
    'lair', 'nighthaven', 'oregon', 'skyscraper', 'theme-park', 'villa',
    'calypso-casino',
  ]),
})

const RANKED_IDS = new Set(RANKED_ROTATION.mapIds)

export function isRankedMap(mapId) {
  return RANKED_IDS.has(mapId)
}
