// Desktop client provider. Activation and installed version are NOT recorded
// server-side, so this panel can only report what the web product records
// (live-coach page opens, if activity tracking is on) and ask for the rest.

import { dateOnly, fact, panel } from './shared.mjs'

export async function desktopProvider({ facts }) {
  const live = facts?.activity?.liveCoach || null
  const out = [
    fact('Desktop client activation', 'not recorded', 'no server-side activation record exists', null, 'player'),
    fact('Installed version', 'not recorded', 'no server-side version record exists', null, 'player'),
  ]
  if (live) out.push(fact('Live coach page opens (web beacon)', `${live.total} total, last ${dateOnly(live.lastAt) || 'never'}`, 'recon-customer-success activity', live.lastAt))
  return panel('desktop', 'Desktop client', 'not_recorded', {
    facts: out,
    user: ['Tell us the app version you installed and whether you use PC capture or a console capture card.'],
    recon: ['Ask for version and capture setup; there is no server record to check.'],
    signals: { desktopVersionKnown: false },
  })
}
