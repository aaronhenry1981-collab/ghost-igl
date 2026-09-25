// Activation checklist: only steps the player can genuinely do today on their
// current plan. Steps that depend on a source we could not read are returned
// with `done: null` so the UI can say "we couldn't check" instead of lying.

import { hasPlan } from './plans.mjs'

export const ACTIVATION_STEP_IDS = Object.freeze(['profile', 'rank_goal', 'round_plan', 'road_to_champion', 'vod', 'coaching'])

export function deriveActivation(facts) {
  const plan = facts.billing.plan || 'free'
  const steps = []

  steps.push({
    id: 'profile',
    label: 'Finish your player profile',
    detail: 'Name, gamertag and platform, so plans fit how you play.',
    done: facts.account.profileComplete,
    cta: { label: 'Finish profile', action: 'open_profile' },
  })

  steps.push({
    id: 'rank_goal',
    label: 'Set your rank and goal',
    detail: 'Road to Champion starts at your tier and tracks the gap to your goal.',
    done: facts.sources.profile === 'ok' ? facts.account.hasRankGoal : null,
    cta: { label: 'Add rank and goal', action: 'set_rank_goal' },
  })

  steps.push({
    id: 'round_plan',
    label: 'Open your first round plan',
    detail: 'Pick a map, site and side. One plan, one job, into the round.',
    done: facts.activity.strategy.total > 0 ? true : facts.activity.usageEvidence === 'partial' ? null : false,
    cta: { label: 'Choose a site', to: '/strats' },
  })

  steps.push({
    id: 'road_to_champion',
    label: 'Start Road to Champion',
    detail: 'A checklist for your tier: the habits that get players out of it.',
    done: facts.sources.roadToChampion === 'ok' ? Boolean(facts.activity.roadToChampion?.tasksDone) : null,
    cta: { label: 'Open Road to Champion', href: '/climb/' },
  })

  if (hasPlan(plan, 'pro') && !facts.identity.isAdmin) {
    steps.push({
      id: 'vod',
      label: 'Get your first VOD review',
      detail: 'Upload screenshots from one round and get the mistake that cost it.',
      done: facts.activity.vod.reviewsKnown,
      cta: { label: 'Upload a round', to: '/vod' },
    })
  }

  const credits = facts.activity.coaching?.credits
  if ((plan === 'champion' || (Number.isFinite(credits) && credits > 0)) && !facts.identity.isAdmin) {
    steps.push({
      id: 'coaching',
      label: 'Book your coaching session',
      detail: plan === 'champion' ? 'Two live 1:1 sessions with Aaron are included every month.' : `You have ${credits} session credit${credits === 1 ? '' : 's'} ready to use.`,
      done: facts.sources.bookings === 'ok' ? (facts.activity.coaching?.total || 0) > 0 : null,
      cta: { label: 'Book a session', href: '/coaching/index.html#book' },
    })
  }

  const known = steps.filter((step) => step.done !== null)
  const done = known.filter((step) => step.done === true).length
  return {
    steps,
    done,
    total: steps.length,
    unknown: steps.length - known.length,
    complete: known.length === steps.length && done === steps.length,
  }
}
