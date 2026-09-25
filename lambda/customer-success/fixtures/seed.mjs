// Seed a customer-success store from a fixture world (activity beacons and
// feedback that, in production, live in the customer-success table).
// `withConversations` adds fictional message threads for the dev preview.

import { contactKeyFor } from '../lib/ids.mjs'
import { activityItem, messageItem, pkFor, ITEM_TYPES } from '../data/items.mjs'

export function storeSeedFromWorld(world, { withConversations = false } = {}) {
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
  if (withConversations) items.push(...conversationSeed(world.now))
  return items
}

function conversationSeed(now) {
  const at = (days) => new Date(now - days * 86400000).toISOString()
  const msg = (email, fields) => messageItem({ contactKey: contactKeyFor(email), email, ...fields })
  const maya = 'quiet.anchor@example.test'
  const jordan = 'fading.roamer@example.test'
  return [
    msg(maya, { direction: 'outbound', channel: 'in_app', subject: 'Welcome to Recon 6', body: 'Hey Maya, good to have you. Start with one round plan for the site you play most, then tick your first Road to Champion habit.', at: at(6), author: 'admin:coach.admin@example.test', status: 'delivered', messageId: 'seed-m1' }),
    { ...msg(maya, { direction: 'inbound', channel: 'in_app', body: 'Thanks! Which Bank site should I learn first as an anchor?', at: at(1.2), author: 'player', messageId: 'seed-m2' }), readByAdminAt: at(1), answeredAt: at(0.6) },
    msg(maya, { direction: 'outbound', channel: 'in_app', body: 'CEO defense. It teaches the stairs, the skylight and when to rotate to Executive Lounge.', at: at(0.6), author: 'admin:coach.admin@example.test', status: 'delivery_disabled', messageId: 'seed-m3' }),
    msg(jordan, { direction: 'inbound', channel: 'in_app', body: 'Can you look at my Kafe attack? I keep dying before we even plant.', at: at(2), author: 'player', messageId: 'seed-m4' }),
  ]
}
