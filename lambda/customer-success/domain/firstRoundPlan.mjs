import { hasPlan } from './plans.mjs'

// Existing public sample: the route selects its map, site and side, while the
// strategy page retains its normal access gates and view-event measurement.
export function firstRoundPlanCta(plan) {
  return hasPlan(plan, 'pro')
    ? { label: 'Choose a site', to: '/strats' }
    : { label: 'Open the free Bank defense plan', to: '/strats/bank/ceo/defense' }
}
