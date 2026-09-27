// DEV ONLY: index of support preview screens. Every screen is served from
// snapshots of the real backend (fixtures/generated, fictional data).
import { FIXTURE_INDEX } from '../fixtures/transport'

const c = FIXTURE_INDEX.staffScenarioCases
const psnIncident = FIXTURE_INDEX.incidents.find((i) => i.status === 'identified') || FIXTURE_INDEX.incidents[0]
const player = FIXTURE_INDEX.playerCases

export const SUPPORT_DEV_CASES = Object.freeze({
  waitingOnMe: player.waitingOnMe,
  resolved: player.resolved,
  closed: player.closed,
  vodFailure: c.vodFailure,
  entitlementMismatch: c.entitlementMismatch,
  rankDiscrepancy: c.rankDiscrepancy,
  billing: c.billing,
  incident: psnIncident?.id || null,
  article: FIXTURE_INDEX.articles.includes('why-rank-or-stats-look-different') ? 'why-rank-or-stats-look-different' : FIXTURE_INDEX.articles[0],
})

const k = SUPPORT_DEV_CASES
export const SUPPORT_DEV_LINKS = Object.freeze([
  { group: 'Player Command', label: 'Get Help + My Support (default)', to: '/__dev/support' },
  { group: 'Player Command', label: 'Get Help with triage suggestion', to: '/__dev/support?as=triage' },
  { group: 'Player Command', label: 'Waiting on me bucket', to: '/__dev/support?as=waiting_on_me' },
  { group: 'Player Command', label: 'Resolved bucket', to: '/__dev/support?as=resolved' },
  { group: 'Player Command', label: 'Empty (new player)', to: '/__dev/support?as=empty' },
  { group: 'Player Command', label: 'Loading', to: '/__dev/support?as=loading' },
  { group: 'Player Command', label: 'Error', to: '/__dev/support?as=error' },
  { group: 'Player Command', label: 'Signed out gate', to: '/__dev/support?as=signed_out' },
  { group: 'Player Command', label: 'Support not enabled (flag off)', to: '/__dev/support?as=not_enabled' },
  { group: 'Case timeline', label: `Waiting on me (${k.waitingOnMe})`, to: `/__dev/support/cases/${k.waitingOnMe}` },
  { group: 'Case timeline', label: `Resolved + CSAT (${k.resolved})`, to: `/__dev/support/cases/${k.resolved}` },
  { group: 'Case timeline', label: `Closed, rated (${k.closed})`, to: `/__dev/support/cases/${k.closed}` },
  { group: 'Case timeline', label: `Escalated, email reply (${k.vodFailure})`, to: `/__dev/support/cases/${k.vodFailure}` },
  { group: 'Help Center', label: 'Help Center (DRAFT articles, preview only)', to: '/__dev/help' },
  { group: 'Help Center', label: 'Search: "rank wrong"', to: '/__dev/help?q=rank%20wrong' },
  { group: 'Help Center', label: 'Article', to: `/__dev/help/${k.article}` },
  { group: 'Help Center', label: 'Empty (production, in review)', to: '/__dev/help?as=empty' },
  { group: 'Command Center', label: 'Queue', to: '/__dev/crm/support' },
  { group: 'Command Center', label: 'Queue: overdue / at risk', to: '/__dev/crm/support?view=at_risk' },
  { group: 'Command Center', label: 'Queue: empty', to: '/__dev/crm/support?as=empty' },
  { group: 'Command Center', label: 'Queue: loading', to: '/__dev/crm/support?as=loading' },
  { group: 'Command Center', label: 'Queue: error', to: '/__dev/crm/support?as=error' },
  { group: 'Command Center', label: `Entitlement mismatch (${k.entitlementMismatch})`, to: `/__dev/crm/support/cases/${k.entitlementMismatch}` },
  { group: 'Command Center', label: `VOD failure, not-recorded gaps (${k.vodFailure})`, to: `/__dev/crm/support/cases/${k.vodFailure}` },
  { group: 'Command Center', label: `Rank discrepancy (${k.rankDiscrepancy})`, to: `/__dev/crm/support/cases/${k.rankDiscrepancy}` },
  { group: 'Command Center', label: `Billing question (${k.billing})`, to: `/__dev/crm/support/cases/${k.billing}` },
  { group: 'Command Center', label: 'Incidents', to: '/__dev/crm/support/incidents' },
  { group: 'Command Center', label: `Incident detail (${k.incident})`, to: `/__dev/crm/support/incidents/${k.incident}` },
  { group: 'Command Center', label: 'Metrics', to: '/__dev/crm/support/metrics' },
  { group: 'Command Center', label: 'Metrics: no data yet', to: '/__dev/crm/support/metrics?as=empty' },
  { group: 'Command Center', label: 'Uncertain email in review', to: '/__dev/crm/support/email' },
])

const TRANSPORT_SCENARIOS = new Set(['empty', 'loading', 'error', 'not_enabled'])

export function transportScenario(as) {
  return TRANSPORT_SCENARIOS.has(as) ? as : 'default'
}

export const TRIAGE_SAMPLE = 'Paid for Pro yesterday but Match Prep still says upgrade and the strats are locked'
