// Feature-usage provider (staff view): activity beacons recorded by the
// customer-success table (PR #24). Before server-side tracking began, a
// missing signal means "not recorded", not "never used".

import { dateOnly, fact, inference, panel, sourceStatus } from './shared.mjs'

export async function usageProvider({ one, facts }) {
  const status = sourceStatus(one, 'cs')
  if (!facts || status === 'unavailable') return panel('usage', 'Feature usage', 'unavailable', { facts: [fact('Feature usage', 'could not be read', 'recon-customer-success')] })
  if (status === 'not_connected') return panel('usage', 'Feature usage', 'not_connected', { facts: [fact('Feature usage', 'not connected in this deployment', 'recon-customer-success')] })
  const a = facts.activity
  const any = a.strategy.total || a.matchPrep.total || a.liveCoach.total || a.roadToChampion?.tasksDone || a.vod.reviewsKnown
  const out = [
    fact('Round plans opened', `${a.strategy.total} total, ${a.strategy.count7} in 7 days, last ${dateOnly(a.strategy.lastAt) || 'never'}`, 'activity beacons', a.strategy.lastAt),
    fact('Match prep opened', `${a.matchPrep.total} total, ${a.matchPrep.count7} in 7 days`, 'activity beacons', a.matchPrep.lastAt),
    fact('Live coach page opened', `${a.liveCoach.total} total`, 'activity beacons', a.liveCoach.lastAt),
    fact('Road to Champion', a.roadToChampion ? `${a.roadToChampion.tasksDone ?? 0}/${a.roadToChampionTasksTotal} tasks` : 'could not be read', 'climb progress', a.roadToChampion?.updatedAt),
    fact('Active days', `${a.activeDays7} in 7 days, ${a.activeDays14} in 14, ${a.activeDays30} in 30`, 'all recorded activity', a.lastActiveAt),
    fact('Usage evidence level', a.usageEvidence, 'config.activityTrackingSince'),
  ]
  const infs = []
  if (a.usageEvidence === 'partial') infs.push(inference('Usage may be under-counted', 'partial evidence', 'server-side activity tracking start date is not configured, so missing signals are "not recorded"', 0.6))
  return panel('usage', 'Feature usage', any ? 'ok' : 'not_recorded', {
    facts: out,
    inferences: infs,
    signals: { activeDays14: a.activeDays14, hasCoreAction: a.hasCoreAction, lastActiveAt: a.lastActiveAt },
  })
}
