export const COASTLINE_HOOKAH_GAMEPLAY = [
  {
    src: '/creator-gameplay-coastline-hookah.webp',
    alt: 'First-person gameplay view holding the doorway between Hookah Lounge and the adjacent room on Coastline',
    label: 'HOLD THE SWING',
    copy: 'Keep hard cover beside you while your crosshair owns the doorway. Do not drift into the middle of the room.',
  },
  {
    src: '/creator-gameplay-coastline-stairs.webp',
    alt: 'First-person gameplay view approaching the stairs below Billiards Lounge on Coastline',
    label: 'CLEAR THE TOP',
    copy: 'Take the stairs one angle at a time. Clear the landing before exposing yourself to the Billiards doorway.',
  },
  {
    src: '/creator-gameplay-coastline-cover.webp',
    alt: 'First-person gameplay view using cover near the Billiards Lounge doorway on Coastline',
    label: 'PLAY THE COVER',
    copy: 'Use the structure to shrink the fight. Hold the doorway without giving two lanes a clean shot at you.',
  },
]

const GAMEPLAY_VISUALS = {
  coastline: {
    'hookah-billiards': {
      source: 'Real player footage · Coastline',
      note: 'Use these views to recognize the decision points. The round plan above remains the source of truth for your assigned job.',
      frames: COASTLINE_HOOKAH_GAMEPLAY,
    },
  },
}

export function getGameplayVisuals(mapId, siteId) {
  return GAMEPLAY_VISUALS[mapId]?.[siteId] || null
}

export default GAMEPLAY_VISUALS
