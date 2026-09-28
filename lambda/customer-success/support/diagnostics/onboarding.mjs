// Onboarding / activation provider (staff view): PR #24 lifecycle + activation.

import { deriveActivation } from '../../domain/activation.mjs'
import { deriveLifecycle } from '../../domain/lifecycle.mjs'
import { fact, inference, panel } from './shared.mjs'

export async function onboardingProvider({ facts, lifecycle }) {
  if (!facts) return panel('onboarding', 'Onboarding and activation', 'unavailable', { facts: [fact('Onboarding', 'could not be read', 'player record')] })
  const life = lifecycle || deriveLifecycle(facts)
  const activation = deriveActivation(facts)
  const out = [
    fact('Lifecycle stage', `${life.stageLabel}: ${life.stageReasons.join('; ') || 'no reasons recorded'}`, 'domain/lifecycle.mjs over player facts'),
    fact('Health', `${life.healthLabel}${life.healthReasons.length ? `: ${life.healthReasons.slice(0, 2).join('; ')}` : ''}`, 'domain/lifecycle.mjs'),
    fact('Activation checklist', `${activation.done}/${activation.total} steps`, 'domain/activation.mjs'),
    fact('Open steps', activation.steps.filter((s) => s.done === false).map((s) => s.id).join(', ') || 'none', 'domain/activation.mjs'),
  ]
  const unknownSteps = activation.steps.filter((s) => s.done === null).map((s) => s.id)
  if (unknownSteps.length) out.push(fact('Steps not checkable', unknownSteps.join(', '), 'source unavailable or not recorded'))
  const infs = []
  const stalled = life.risks.filter((r) => ['not_activated_7d', 'paid_never_logged_in', 'account_setup_incomplete'].includes(r.code))
  for (const r of stalled) infs.push(inference('Onboarding stalled', r.code, r.reason, 0.7))
  const nothingRecorded = facts.account.hasProfileRow === false && !facts.activity.hasCoreAction && !facts.activity.lastActiveAt
  return panel('onboarding', 'Onboarding and activation', nothingRecorded ? 'not_recorded' : 'ok', {
    facts: out,
    inferences: infs,
    recon: stalled.length ? ['Offer a first-win walkthrough; this is a success case, not a bug.'] : [],
    signals: { lifecycleStage: life.stage, health: life.health, activated: life.activated, onboardingStalled: stalled.length > 0 },
  })
}
