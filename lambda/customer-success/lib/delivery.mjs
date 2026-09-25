// Outbound delivery adapter. DISABLED BY DEFAULT.
//
//   disabled  every outbound message is rendered and recorded with status
//             "delivery_disabled"; nothing reaches any player (production
//             default until Aaron approves turning delivery on)
//   in_app    in-app messages are written to the player's Recon thread;
//             email is still NOT sent
//
// There is intentionally no email transport in this module. Sending email
// requires a separate, reviewed change that adds one; misconfiguring this
// adapter cannot send an email.

import { messageItem } from '../data/items.mjs'

export const DELIVERY_MODES = Object.freeze(['disabled', 'in_app'])

export function createDelivery({ mode = 'disabled', store, clock = () => Date.now() } = {}) {
  const effective = DELIVERY_MODES.includes(mode) ? mode : 'disabled'
  return {
    mode: effective,
    emailEnabled: false,
    async deliver({ contactKey, email, channel, subject, body, workflowId = null, outreachKey = null, author = 'system' }) {
      if (channel === 'email') {
        return { status: 'delivery_disabled', statusReason: effective === 'disabled' ? 'delivery_disabled' : 'email_not_enabled', messageId: null }
      }
      if (effective !== 'in_app') return { status: 'delivery_disabled', statusReason: 'delivery_disabled', messageId: null }
      const at = new Date(clock()).toISOString()
      const item = messageItem({ contactKey, email, direction: 'outbound', channel: 'in_app', subject, body, at, author, workflowId, outreachKey, status: 'delivered' })
      await store.put(item, { ifNotExists: true })
      return { status: 'delivered', statusReason: null, messageId: item.messageId }
    },
  }
}
