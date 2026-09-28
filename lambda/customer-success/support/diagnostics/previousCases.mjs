// Previous-cases provider (staff view): the player's own earlier cases,
// passed in by the caller (already scoped to this contact).

import { dateOnly, fact, inference, panel } from './shared.mjs'

const OPEN = new Set(['new', 'triaged', 'in_progress', 'waiting_on_player', 'waiting_on_provider', 'escalated', 'reopened'])

export async function previousCasesProvider({ cases, category = null, currentCaseId = null }) {
  if (!Array.isArray(cases)) return panel('previousCases', 'Previous cases', 'unavailable', { facts: [fact('Previous cases', 'could not be read', 'C#<contactKey> CASE#')] })
  const list = cases.filter((c) => c && c.caseId !== currentCaseId)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  if (!list.length) return panel('previousCases', 'Previous cases', 'ok', { facts: [fact('Previous cases', 'none', 'C#<contactKey> CASE#')], signals: { previousCaseCount: 0 } })
  const out = [fact('Previous cases', `${list.length} (${list.filter((c) => OPEN.has(c.status)).length} open)`, 'C#<contactKey> CASE#')]
  for (const c of list.slice(0, 5)) out.push(fact(c.caseNumber || 'case', `${c.category || 'other'} · ${c.status} · opened ${dateOnly(c.createdAt) || '?'}${c.rootCause ? ` · root cause ${c.rootCause}` : ''}`, 'C#<contactKey> CASE#', c.createdAt))
  const same = category ? list.filter((c) => c.category === category) : []
  const infs = same.length ? [inference('Repeat issue', `${same.length} earlier case(s) in the same category`, 'category match on this player\'s cases', 0.6)] : []
  return panel('previousCases', 'Previous cases', 'ok', { facts: out, inferences: infs, signals: { previousCaseCount: list.length, repeatCategoryCount: same.length } })
}
