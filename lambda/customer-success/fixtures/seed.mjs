// Seed a customer-success store from a fixture world (activity beacons and
// feedback that, in production, live in the customer-success table).

import { contactKeyFor } from '../lib/ids.mjs'
import { activityItem, pkFor, ITEM_TYPES } from '../data/items.mjs'

export function storeSeedFromWorld(world) {
  const items = []
  for (const row of world.activity || []) {
    items.push(activityItem({ contactKey: contactKeyFor(row.email), email: row.email, type: row.type, ref: row.ref || null, at: row.at }))
  }
  for (const row of world.feedback || []) {
    const contactKey = contactKeyFor(row.email)
    items.push({
      pk: pkFor(contactKey),
      sk: `${ITEM_TYPES.FEEDBACK}#${row.createdAt}#${row.feedbackId}`,
      type: ITEM_TYPES.FEEDBACK,
      contactKey,
      email: row.email,
      feedbackId: row.feedbackId,
      moment: row.moment,
      momentKey: `${row.moment}`,
      answers: row.answers,
      status: row.status || 'open',
      createdAt: row.createdAt,
      gsi1pk: ITEM_TYPES.FEEDBACK,
      gsi1sk: `${row.createdAt}#${contactKey}`,
    })
  }
  return items
}
