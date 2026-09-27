// Replay provider. Recon has NO replay (.rec) upload system today; this panel
// says so honestly instead of implying a missing record.

import { fact, panel } from './shared.mjs'

export async function replayProvider() {
  return panel('replay', 'Match replays', 'not_available', {
    facts: [fact('Replay upload', 'not available in Recon today', 'product (no replay upload system exists)', null, 'player')],
    user: ['For an AI review, upload screenshots from the round on the VOD review page instead.'],
    recon: ['Replay requests are feature requests; tag the case and do not open an engineering bug.'],
    signals: { replaySupported: false },
  })
}
