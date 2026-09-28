import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryLabel, PRIORITY_LABEL, priorityTone, QUEUE_VIEWS, rowKeyIndex, SEVERITY_LABEL, SLA_LABEL, SLA_TONE, slaState, staffStatusLabel } from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Chip, EmptyState, RoundInterrupted, Skeleton } from '../ui/bits'
import { TabPanel, Tabs } from '../ui/Tabs'

const EMPTY = {
  unassigned: 'Every open case has an owner.',
  mine: 'Nothing assigned to you.',
  critical: 'No high or critical cases.',
  at_risk: 'Nothing overdue or at risk.',
  incidents: 'No cases linked to incidents.',
  all_open: 'No open cases.',
}

// Unified queue. Views map 1:1 to GET /cs/admin/support/queue?view=, which
// returns { view, me, cases: [row], counts }; a row carries player {key,
// handle, planLabel} and sla {state, ...} (internal clocks, staff only).
// Keyboard: ←/→ switch views; ↑/↓ or j/k move between cases; Enter opens.
export default function SupportQueue({ client, view, onView, to }) {
  const res = useSupportResource(client, 'queue', view)
  const rowRefs = useRef([])
  const navigate = useNavigate()
  const items = res.data?.cases || []
  const counts = res.data?.counts || {}
  const tabs = QUEUE_VIEWS.map((v) => ({ ...v, count: counts[v.id] }))

  function onKeyDown(e) {
    if (!['ArrowDown', 'ArrowUp', 'j', 'k', 'Home', 'End'].includes(e.key)) return
    if (e.target.closest('input, textarea, select')) return
    const current = rowRefs.current.findIndex((el) => el === document.activeElement)
    const next = rowKeyIndex(current, e.key, items.length)
    if (next < 0 || next === current) return
    e.preventDefault()
    rowRefs.current[next]?.focus()
  }

  return (
    <div className="sc-queue">
      <Tabs
        tabs={tabs}
        value={view}
        onChange={onView}
        label="Queue views"
        idBase="sc-views"
        className="sp-tabs sc-views"
        renderTab={(t) => (
          <>
            <span className="sp-tab-label">{t.label}</span>
            {t.count !== undefined && <span className="sp-tab-count">{t.count}</span>}
          </>
        )}
      />
      <TabPanel idBase="sc-views" activeId={view} className="sc-queue-panel">
        <p className="sp-muted sp-small sc-kbd-hint">↑↓ or j/k to move · Enter to open</p>
        {res.status === 'loading' && <Skeleton lines={5} label="Loading queue…" />}
        {res.status === 'error' && <RoundInterrupted message={errorMessage(res.error, "Couldn't load the queue.")} onRetry={res.reload} />}
        {res.status === 'ready' && (items.length === 0 ? (
          <EmptyState title="Queue clear">{EMPTY[view] || 'No cases in this view.'}</EmptyState>
        ) : (
          <div className="crm-table-wrap sc-table-wrap" onKeyDown={onKeyDown}>
            <table className="crm-table crm-table-compact sc-qtable">
              <caption className="sp-visually-hidden">{QUEUE_VIEWS.find((v) => v.id === view)?.label} cases</caption>
              <thead>
                <tr>
                  <th scope="col">Case</th>
                  <th scope="col">Pri / sev</th>
                  <th scope="col">Area</th>
                  <th scope="col">Status</th>
                  <th scope="col">Owner</th>
                  <th scope="col">SLA</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => {
                  const sla = slaState(c.sla)
                  return (
                    <tr key={c.caseNumber} className={`sc-qrow${sla === 'overdue' ? ' is-overdue' : ''}`} onClick={(e) => { if (!e.target.closest('a')) navigate(to(`cases/${c.caseNumber}`)) }}>
                      <th scope="row" data-label="Case">
                        <Link ref={(el) => { rowRefs.current[i] = el }} to={to(`cases/${c.caseNumber}`)} className="sc-qlink">
                          <span className="sp-case-no">{c.caseNumber}</span>
                          <span className="sc-qsubject">{c.subject}</span>
                        </Link>
                        <span className="sp-muted sp-small sc-line sc-wrap">{[c.player?.handle || 'Player', c.player?.planLabel, c.source === 'proactive' ? 'flagged by Recon' : c.source === 'email' ? 'by email' : null, c.incidentId ? 'incident linked' : null].filter(Boolean).join(' · ')}</span>
                      </th>
                      <td data-label="Pri / sev"><Chip tone={priorityTone(c.priority)}>{PRIORITY_LABEL[c.priority] || '—'}</Chip> <span className="sp-muted sp-small">{SEVERITY_LABEL[c.severity] || ''}</span></td>
                      <td data-label="Area">{categoryLabel(c.category)}</td>
                      <td data-label="Status">{staffStatusLabel(c.status)}{c.waitingOn && c.waitingOn !== 'recon' && <span className="sp-muted sp-small sc-line">on {c.waitingOn}</span>}</td>
                      <td data-label="Owner">{c.assignee ? <span className="sc-wrap">{c.assignee === res.data.me ? 'You' : c.assignee}</span> : <Chip tone="warning">None</Chip>}</td>
                      <td data-label="SLA">{sla ? <Chip tone={SLA_TONE[sla]}>{SLA_LABEL[sla]}</Chip> : <span className="sp-muted">—</span>}</td>
                      <td data-label="Updated"><Ago at={c.updatedAt} fallback="—" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </TabPanel>
    </div>
  )
}
