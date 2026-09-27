// Record this browser's attribution on the signed-in player's timeline.
//
// Posts pending events one at a time and remembers what was recorded. A
// failure stops the run and leaves the rest pending for the next signed-in
// page load (writes are idempotent server-side, so a retry is harmless).

import { eventKey, pendingEvents } from './events.js'

export async function syncAttribution({ state, synced = new Set(), post, markSynced = () => {} }) {
  const pending = pendingEvents(state, synced)
  const done = []
  let status = 'ok'
  for (const event of pending) {
    let result
    try {
      result = await post(event)
    } catch {
      status = 'failed'
      break
    }
    // playerData.js returns null when the player-data API is not configured.
    if (result === null || result === undefined) {
      status = 'not_configured'
      break
    }
    done.push(eventKey(event))
  }
  if (done.length) markSynced(done)
  return { status, posted: done.length, remaining: pending.length - done.length }
}
