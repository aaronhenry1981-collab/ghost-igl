// The hand-tuned R6 sample review shown by /vod?demo=1 and excerpted on the
// home page ("Sample review" in the features section). It is a sample,
// labelled as one wherever it appears; it is not a member's review.
export const R6_DEMO_ANALYSIS = {
  session: {
    headline:
      'Solid setup on Bank 2F CEO Office but a predictable head-glitch angle and unused utility cost you the round.',
    score: 72,
    detected_map: 'Bank',
    detected_side: 'defense',
    image_count: 1,
  },
  per_image: [
    {
      image_index: 0,
      detected: { map: 'Bank', site: '2F CEO Office', side: 'defense', character: 'Smoke', round_phase: 'action' },
      what_happened: 'Smoke holding CEO doorway from the standard head-glitch spot during the action phase.',
      what_went_wrong: [
        'Crosshair on the door frame, not pre-aimed head height into Executive Lounge.',
        'Smoke canister visible on HUD but undeployed — wasted on a defensive round with no plant pressure yet.',
        'Position is droneable: Iana/Flores attackers will see your exact angle.',
      ],
      what_went_right: ['Anchored the bomb site instead of roaming early.'],
      specific_advice: [
        'Step two paces back behind the desk to break the head-glitch and force attackers deeper.',
        'Pre-aim chest height through the Executive Lounge shared wall.',
        'Save Smoke canister for plant denial — don\'t throw early for pressure.',
        'Ask Maestro to drop an Evil Eye covering Executive Lounge so you\'re not double-anchoring.',
      ],
    },
  ],
  patterns: {
    recurring_weaknesses: [
      'Holding head-glitch angles attackers can pre-drone',
      'Crosshair drifting to floor between peeks',
    ],
    standout_strengths: ['Smoke canister kept in reserve for plant denial'],
  },
  practice_plan: {
    this_week: [
      'Aim Training: pre-aim head height on every doorway entry — 10 minutes/day',
      'Custom Map: anchor Bank 2F CEO from 3 alternate spots, find one with cover',
      'Map Awareness: review one match VOD and identify every droneable angle you held',
    ],
  },
  character_feedback:
    'Smoke is meant to be a plant-denial anchor — your gas canisters are your value, not your ADS. Hold from positions that survive long enough to throw gas at the plant. Don\'t peek for frags.',
}

export default R6_DEMO_ANALYSIS
