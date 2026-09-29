import { useMemo, useState } from 'react'
import { useAdminData, useAdminResource } from '../../features/admin/AdminData'
import { AUDIT_ACTIONS, auditDetailLines, auditLabel, auditTone, timeAgo } from '../../features/admin/auditFormat.mjs'
import { foldText, paginate } from '../../features/admin/memberDirectory.mjs'
import { formatDateTime } from '../../features/admin/memberFormat.mjs'
import { Badge, Icon, Pagination, Panel, Skeleton, StateView } from '../../features/admin/ui'

// Admin audit log: the latest 100 audited admin actions (comp grants and
// revokes, name edits, reconciliation, console removals) from the
// ghost-igl-audit-log table via GET /admin/audit.
export default function AuditLog({ id }) {
  const { nowMs } = useAdminData()
  const audit = useAdminResource('/admin/audit')
  const [action, setAction] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const events = useMemo(() => audit.data?.events || [], [audit.data])

  const actions = useMemo(() => [...new Set(events.map((e) => e.action).filter(Boolean))].sort(), [events])
  const filtered = useMemo(() => {
    const tokens = foldText(q).split(' ').filter(Boolean)
    return events.filter((e) => (action === 'all' || e.action === action) &&
      tokens.every((t) => foldText(`${e.target || ''} ${e.actor || ''} ${auditLabel(e.action)}`).includes(t)))
  }, [events, action, q])
  const view = paginate(filtered, page, 25)

  return (
    <Panel
      id={id}
      title="Audit log"
      description="The latest 100 audited admin actions. Full history is kept in DynamoDB with point-in-time recovery."
      actions={<button type="button" className="ax-btn ax-btn--sm" onClick={audit.reload} disabled={audit.status === 'loading' || audit.status === 'refreshing'}><Icon name="refresh" /> Refresh</button>}
      bodyClassName="is-flush"
    >
      <div className="ax-toolbar">
        <div className="ax-search">
          <Icon name="search" />
          <label className="ax-sr" htmlFor="ax-audit-q">Search the audit log</label>
          <input id="ax-audit-q" type="search" className="ax-input" placeholder="Search member or admin email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <label className="ax-sr" htmlFor="ax-audit-action">Action</label>
        <select id="ax-audit-action" className="ax-select" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}>
          <option value="all">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{AUDIT_ACTIONS[a]?.label || a}</option>)}
        </select>
      </div>

      {audit.status === 'loading' ? <Skeleton rows={5} />
        : audit.status === 'error' ? <StateView kind="error" title="The audit log could not be loaded" onRetry={audit.reload}>{audit.error}</StateView>
          : events.length === 0 ? <StateView kind="empty" title="No admin actions recorded yet" />
            : filtered.length === 0 ? <StateView kind="empty" title="No actions match">Clear the search or pick another action.</StateView>
              : (
                <>
                  <div className="ax-table-wrap">
                    <table className="ax-table">
                      <thead><tr><th scope="col">When</th><th scope="col">Action</th><th scope="col">Member</th><th scope="col" className="ax-hide-lg">By</th><th scope="col">Details</th></tr></thead>
                      <tbody>
                        {view.items.map((e) => (
                          <tr key={e.id}>
                            <td className="ax-num" style={{ whiteSpace: 'nowrap' }}>{timeAgo(e.timestamp, nowMs)}<small>{formatDateTime(e.timestamp)}</small></td>
                            <td><Badge tone={auditTone(e.action)}>{auditLabel(e.action)}</Badge></td>
                            <td style={{ overflowWrap: 'anywhere' }}>{e.target || '—'}</td>
                            <td className="ax-hide-lg" style={{ overflowWrap: 'anywhere' }}>{e.actor || 'system'}</td>
                            <td style={{ maxWidth: 360 }}>{auditDetailLines(e.details).slice(0, 4).map((line) => <small key={line} style={{ marginTop: 0, overflowWrap: 'anywhere' }}>{line}</small>)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination {...view} onPage={setPage} label="actions" />
                </>
              )}
    </Panel>
  )
}
