export const COASTLINE_HOOKAH_DEFENSE_GAMEPLAY = [
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

export const COASTLINE_HOOKAH_ATTACK_GAMEPLAY = [
  {
    src: '/creator-gameplay-coastline-attack-drone.webp',
    alt: 'Drone view checking the interior route toward the Coastline Hookah Lounge and Billiards site',
    label: 'DRONE THE ROUTE',
    copy: 'Use the drone to clear the next room and identify the first threat. Do not spend your life to discover what your utility can show safely.',
  },
  {
    src: '/creator-gameplay-coastline-attack-entry.webp',
    alt: 'Attacker controlling a rooftop rappel above the Coastline Hookah Lounge and Billiards site',
    label: 'CONTROL THE ENTRY',
    copy: 'Use the roof and rappel to choose your fight. Move only after the drone or a teammate confirms the space you are entering.',
  },
  {
    src: '/creator-gameplay-coastline-attack-cutoff.webp',
    alt: 'Attacker holding a focused interior angle during a Coastline Hookah Lounge and Billiards take',
    label: 'HOLD THE CUTOFF',
    copy: 'Once your team starts the take, own one rotation instead of chasing every sound. A stable cutoff protects the plant and punishes the retake.',
  },
]

export const COASTLINE_HOOKAH_GAMEPLAY = COASTLINE_HOOKAH_DEFENSE_GAMEPLAY

const GAMEPLAY_VISUALS = {
  coastline: {
    'hookah-billiards': {
      attack: {
        title: 'Recognize the three attack decisions',
        source: 'Real player match replay · Coastline attack',
        note: 'See the round as a sequence: gather information, control the entry, then hold the cutoff that protects the finish.',
        frames: COASTLINE_HOOKAH_ATTACK_GAMEPLAY,
      },
      defense: {
        title: 'Recognize the three defense decisions',
        source: 'Real player match replay · Coastline defense',
        note: 'Use these views to recognize the defensive decision points. The round plan above remains the source of truth for your assigned job.',
        frames: COASTLINE_HOOKAH_DEFENSE_GAMEPLAY,
      },
    },
  },
}

export function getGameplayVisuals(mapId, siteId, side) {
  return GAMEPLAY_VISUALS[mapId]?.[siteId]?.[side] || null
}

export default GAMEPLAY_VISUALS
