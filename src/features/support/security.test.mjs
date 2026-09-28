// SEC-13 (security review): the player timeline's client-side second lock.
// The server marks every player-visible event `visibility: 'public'`; the
// client renders an event only when it carries that mark AND an allowlisted
// kind, so a server regression that drops `visibility` from a staff event
// can never render it to a player.

import test from 'node:test'
import assert from 'node:assert/strict'
import { playerTimeline } from './supportLogic.mjs'

const at = '2026-09-01T00:00:00Z'

test('SEC-13 playerTimeline renders only events marked public with an allowlisted kind', () => {
  const events = [
    { id: 1, kind: 'note_private', body: 'NOTE', at },
    { id: 2, kind: 'message_staff', visibility: 'staff', body: 'STAFF', at },
    { id: 3, kind: 'escalation', body: 'HANDOFF', at },
    { id: 4, kind: 'action_request', body: 'AR', at },
    // Shapes the server stores as staff events; a projection bug that drops
    // `visibility` must not make them render.
    { id: 5, kind: 'system', body: 'PROACTIVE EVIDENCE (staff system event)', at },
    { id: 6, kind: 'email_in', body: 'UNVERIFIED EMAIL assigned from unmatched', at },
    { id: 7, kind: 'message_staff', body: 'no visibility field', at },
    { id: 8, kind: 'message_staff', visibility: 'PUBLIC', body: 'wrong case', at },
    { id: 9, kind: 'note_private', visibility: 'public', body: 'staff kind marked public', at },
    { id: 10, kind: 'message_staff', visibility: 'public', body: 'reply', at },
    { id: 11, kind: 'message_player', visibility: 'public', body: 'mine', at },
    { id: 12, kind: 'system', visibility: 'public', body: 'A new case was opened', at },
  ]
  assert.deepEqual(playerTimeline(events).map((e) => e.id), [10, 11, 12])
})
