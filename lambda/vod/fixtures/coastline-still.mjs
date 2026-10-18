// Hand-authored expected response, not a retained model output or live acceptance.
// Approved image SHA256: 9bf57a8d9fe6a36f1c0e85fd199ddbad000953efb76d3733a566c3360ef778bc
export const context = { map: 'coastline', site: 'theater-penthouse' }
export const groundedStill = () => ({
  session: { headline: 'The still shows a doorway and a visible HUD.', score: null, detected_map: 'coastline', detected_side: null, image_count: 1 },
  per_image: [{
    image_index: 0,
    detected: { map: 'coastline', site: 'theater-penthouse', side: null, character: null, round_phase: 'unknown' },
    observations: ['The HUD shows 100 health and 26/125 ammunition.', 'The timer reads 8:52.', 'A B objective marker reads 2 m; DEFUSE and DROP prompts are visible.', 'An instructional caption says to aim through the doorway and clear angles.'],
    uncertainties: ['Post-plant status cannot be determined from this frame.', 'Recurring habits cannot be established from a single image.', 'The caption does not establish player movement; off-screen utility and outcomes are unknown.'],
    what_happened: 'The first-person view faces a doorway.',
    what_went_wrong: [], what_went_right: [],
    specific_advice: ['If practicing this doorway, check the visible angles before advancing.'],
  }],
  patterns: { recurring_weaknesses: [], standout_strengths: [] },
  practice_plan: { this_week: ['Practice clearing the doorway in a custom session; this still does not demonstrate the movement sequence.'] },
  character_feedback: null,
})
