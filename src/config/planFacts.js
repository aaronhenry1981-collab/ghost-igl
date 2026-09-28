// The plan facts public pages quote, each read from its source of truth
// (docs/GROWTH-UX-OPERATING-STANDARD.md, section 3):
//   - plan names: config/memberships.js
//   - monthly prices: config/stripe.js (checkout charges the matching price
//     IDs server-side)
//   - which maps are free: the `freeSample` flag in data/maps.js
//   - AI review allowances and screenshots per review: enforced in
//     lambda/vod/index.mjs; planFacts.test.mjs fails if these drift.
// Trials: the deployed checkout grants none, so no trial fact exists here.
import MAPS from '../data/maps.js'
import { PLAN_LABEL } from './memberships.js'
import { CHAMPION_CURRENT_AMOUNT, ELITE_CURRENT_AMOUNT, PRO_CURRENT_AMOUNT } from './stripe.js'

export const FREE_MAPS = Object.freeze(MAPS.filter((map) => map.freeSample && !map.comingSoon))
export const MAP_COUNT = MAPS.filter((map) => !map.comingSoon).length

export const PLAN_FACTS = Object.freeze({
  free: Object.freeze({
    key: 'free',
    label: PLAN_LABEL.free,
    monthlyUsd: 0,
  }),
  pro: Object.freeze({
    key: 'pro',
    label: PLAN_LABEL.pro,
    monthlyUsd: PRO_CURRENT_AMOUNT,
    aiReviewsPerMonth: 20,
    screenshotsPerReview: 5,
  }),
  elite: Object.freeze({
    key: 'elite',
    label: PLAN_LABEL.elite,
    monthlyUsd: ELITE_CURRENT_AMOUNT,
    aiReviewsPerMonth: 60,
    screenshotsPerReview: 10,
  }),
  champion: Object.freeze({
    key: 'champion',
    label: PLAN_LABEL.champion,
    monthlyUsd: CHAMPION_CURRENT_AMOUNT,
    aiReviewsPerMonth: 75,
    screenshotsPerReview: 10,
    liveSessionsPerMonth: 2,
  }),
})
