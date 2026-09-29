import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminData } from '../AdminData'
import {
  NAME_FILTERS, PAGE_SIZES, PLAN_FILTERS, SORTS, STATUS_FILTERS,
  accountIdOf, emailsOnly, filterMembers, fullNameOf, membersCsv, nameStatusOf, paginate, sortMembers,
} from '../memberDirectory.mjs'
import { PLAN_LABELS, accountStateLabel, billingLabel, formatDate, formatLastSeen, formatMoney } from '../memberFormat.mjs'
import { effectiveAccessPlan } from '../../../lib/adminBillingHealth.mjs'
import { Badge, Icon, Notice, PageHeader, Pagination, Panel, Skeleton, StateView } from '../ui'

const PLAN_TONE = { free: 'muted', pro: 'info', elite: 'bone', champion: 'accent' }
const DEFAULTS = { q: '', status: 'all', plan: 'all', name: 'all', sort: 'joined', page: '1', size: '25' }

// Filters, sort and page live in the URL: shareable, and restored when you
// come back from a member record (which links back with the same query).
function useListState() {
  const [params, setParams] = useSearchParams()
  const get = (k) => params.get(k) ?? DEFAULTS[k]
  const state = { q: get('q'), status: get('status'), plan: get('plan'), name: get('name'), sort: get('sort'), page: Number(get('page')) || 1, size: Number(get('size')) || 25 }
  const update = (patch, { resetPage = true } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries({ ...patch, ...(resetPage && !('page' in patch) ? { page: '1' } : {}) })) {
        if (v == null || String(v) === DEFAULTS[k]) next.delete(k)
        else next.set(k, String(v))
      }
      return next
    }, { replace: true })
  }
  return [state, update]
}

function MemberName({ member, to, state }) {
  const name = fullNameOf(member)
  const status = nameStatusOf(member)
  return (
    <div className="ax-person">
      {to
        ? <Link to={to} state={state} className={`ax-person__name${name ? '' : ' is-none'}`}>{name || 'No name on file'}</Link>
        : <span className={`ax-person__name${name ? '' : ' is-none'}`}>{name || 'No name on file'}</span>}
      <span className="ax-person__email">{member.email || 'No email'}</span>
      {status === 'review' && <span><Badge tone="warning">Name to review</Badge></span>}
    </div>
  )
}

function PlanBadges({ member }) {
  const plan = effectiveAccessPlan(member)
  return (
    <span className="ax-badges">
      <Badge tone={PLAN_TONE[plan] || 'muted'}>{PLAN_LABELS[plan] || plan}</Badge>
      {member.is_comp && <Badge tone="info" title="Complimentary access; excluded from revenue">Comp</Badge>}
      {member.cognito_status === 'NO_ACCOUNT' && <Badge tone="warning">No site account</Badge>}
    </span>
  )
}

function alertText(u) {
  if (!Array.isArray(u.billing_alerts) || u.billing_alerts.length === 0) return null
  if (Number(u.live_subscription_count) > 1) return `${u.live_subscription_count} live subscriptions`
  if (Number(u.stripe_customer_count) > 1) return `${u.stripe_customer_count} Stripe customers`
  return 'Review billing'
}

export default function MembersPage() {
  const { users, status, error, reload, nowMs, base } = useAdminData()
  const [list, update] = useListState()
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(null)
  const [draft, setDraft] = useState(list.q)
  const focusId = location.state?.focus || null
  const focusRef = useRef(null)

  // Keep the search box in step with the URL (back/forward, clear filters).
  const [lastQ, setLastQ] = useState(list.q)
  if (lastQ !== list.q) {
    setLastQ(list.q)
    setDraft(list.q)
  }

  const { q, status: statusFilter, plan, name, sort } = list
  const filtered = useMemo(() => sortMembers(filterMembers(users, { q, status: statusFilter, plan, name }), sort), [users, q, statusFilter, plan, name, sort])
  const page = paginate(filtered, list.page, list.size)
  const filtersActive = list.q || list.status !== 'all' || list.plan !== 'all' || list.name !== 'all'
  const backState = { from: location.search }

  // Returning from a record: bring that member into view.
  useEffect(() => {
    if (focusId && focusRef.current) focusRef.current.scrollIntoView({ block: 'center' })
  }, [focusId, status])

  useEffect(() => {
    if (!notice) return undefined
    const id = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(id)
  }, [notice])

  function onSearch(value) {
    setDraft(value)
    update({ q: value })
  }

  function exportCsv() {
    const blob = new Blob([membersCsv(filtered)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recon6-members-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setNotice(`Exported ${filtered.length} member${filtered.length === 1 ? '' : 's'} with names and email.`)
  }

  function copyEmails() {
    const text = emailsOnly(filtered)
    const count = text ? text.split(', ').length : 0
    navigator.clipboard?.writeText(text)
      .then(() => setNotice(`Copied ${count} email address${count === 1 ? '' : 'es'}.`))
      .catch(() => setNotice('Copy failed: the browser blocked clipboard access.'))
  }

  const recordLink = (u) => `${base}/members/${encodeURIComponent(accountIdOf(u))}`

  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone with a Recon 6 account or a Recon 6 Stripe subscription. Search by first name, last name, full name or email."
        meta={status !== 'loading' && <span className="ax-muted ax-num">{users.length} member{users.length === 1 ? '' : 's'}</span>}
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--sm" onClick={copyEmails} disabled={!filtered.length}><Icon name="copy" /> Copy emails</button>
            <button type="button" className="ax-btn ax-btn--sm" onClick={exportCsv} disabled={!filtered.length}><Icon name="download" /> Export CSV</button>
            <button type="button" className="ax-btn ax-btn--sm" onClick={reload} disabled={status === 'loading' || status === 'refreshing'}><Icon name="refresh" /> {status === 'refreshing' ? 'Refreshing…' : 'Refresh'}</button>
          </>
        }
      />

      {notice && <Notice tone="ok" onDismiss={() => setNotice(null)}>{notice}</Notice>}
      {status === 'error' && users.length > 0 && <Notice tone="danger" title="Refresh failed.">Showing the last loaded data. {error}</Notice>}

      <Panel bodyClassName="is-flush" className="ax-members">
        <div className="ax-toolbar" role="search">
          <div className="ax-search">
            <Icon name="search" />
            <label htmlFor="ax-member-search" className="ax-sr">Search members</label>
            <input id="ax-member-search" type="search" className="ax-input" placeholder="Search name or email" value={draft} onChange={(e) => onSearch(e.target.value)} autoComplete="off" spellCheck={false} />
            {draft && <button type="button" className="ax-icon-btn ax-search__clear" aria-label="Clear search" onClick={() => onSearch('')}><Icon name="close" /></button>}
          </div>
          <label className="ax-sr" htmlFor="ax-f-status">Billing status</label>
          <select id="ax-f-status" className="ax-select" value={list.status} onChange={(e) => update({ status: e.target.value })}>
            {STATUS_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <label className="ax-sr" htmlFor="ax-f-plan">Plan</label>
          <select id="ax-f-plan" className="ax-select" value={list.plan} onChange={(e) => update({ plan: e.target.value })}>
            {PLAN_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <label className="ax-sr" htmlFor="ax-f-name">Name</label>
          <select id="ax-f-name" className="ax-select" value={list.name} onChange={(e) => update({ name: e.target.value })}>
            {NAME_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <label className="ax-sr" htmlFor="ax-f-sort">Sort</label>
          <select id="ax-f-sort" className="ax-select" value={list.sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
          </select>
        </div>

        {status !== 'loading' && users.length > 0 && filtersActive && (
          <div className="ax-toolbar__summary">
            <span aria-live="polite">
              {filtersActive ? `${filtered.length} of ${users.length} members match` : `${users.length} members`}
            </span>
            {filtersActive && <button type="button" className="ax-btn ax-btn--sm ax-btn--ghost" onClick={() => { setDraft(''); update({ q: '', status: 'all', plan: 'all', name: 'all' }) }}>Clear filters</button>}
          </div>
        )}

        {status === 'loading' ? <Skeleton rows={8} />
          : status === 'error' && users.length === 0 ? <StateView kind="error" title="Members could not be loaded" onRetry={reload}>{error}</StateView>
            : users.length === 0 ? <StateView kind="empty" title="No members yet">Members appear here after they sign up or subscribe.</StateView>
              : filtered.length === 0 ? <StateView kind="empty" title="No members match these filters">Check the spelling, search part of a name or email, or clear the filters.</StateView>
                : (
                  <>
                    <div className="ax-desktop-table ax-table-wrap">
                      <table className="ax-table">
                        <thead>
                          <tr>
                            <th scope="col">Member</th>
                            <th scope="col">Access</th>
                            <th scope="col">Billing</th>
                            <th scope="col" className="ax-hide-lg">Account</th>
                            <th scope="col">Last active</th>
                            <th scope="col" className="ax-hide-lg">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {page.items.map((u) => {
                            const id = accountIdOf(u)
                            const billing = billingLabel(u)
                            const account = accountStateLabel(u)
                            const seen = formatLastSeen(u.last_seen_at, nowMs)
                            const alert = alertText(u)
                            const isFocus = focusId === id
                            return (
                              <tr
                                key={id}
                                ref={isFocus ? focusRef : undefined}
                                className={`is-link${isFocus ? ' is-focus' : ''}`}
                                onClick={(e) => { if (!e.target.closest('a,button')) navigate(recordLink(u), { state: backState }) }}
                              >
                                <td><MemberName member={u} to={recordLink(u)} state={backState} /></td>
                                <td><PlanBadges member={u} />{alert && <small style={{ color: 'var(--ax-danger)' }}>{alert}</small>}</td>
                                <td>
                                  <Badge tone={billing.tone}>{billing.title}</Badge>
                                  <small>{u.will_renew ? `${formatMoney(u.price_amount_cents)} on ${formatDate(u.next_billing_at)}` : billing.detail}</small>
                                </td>
                                <td className="ax-hide-lg"><Badge tone={account.tone}>{account.title}</Badge></td>
                                <td className="ax-num ax-nowrap">{seen.isActive && <span className="ax-dot" aria-hidden="true" />}{seen.label}</td>
                                <td className="ax-hide-lg ax-num ax-nowrap">{formatDate(u.created_at)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <ul className="ax-cards" aria-label="Members">
                      {page.items.map((u) => {
                        const id = accountIdOf(u)
                        const billing = billingLabel(u)
                        const seen = formatLastSeen(u.last_seen_at, nowMs)
                        return (
                          <li key={id}>
                            <Link to={recordLink(u)} state={backState} className={`ax-card${focusId === id ? ' is-focus' : ''}`}>
                              <div className="ax-card__top">
                                <MemberName member={u} />
                                <Icon name="chevron-right" />
                              </div>
                              <div className="ax-card__badges">
                                <PlanBadges member={u} />
                                <Badge tone={billing.tone}>{billing.title}</Badge>
                              </div>
                              <p className="ax-card__meta">{billing.detail} · {u.last_seen_at ? `Active ${seen.label.toLowerCase()}` : 'No recorded activity'}</p>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>

                    <Pagination {...page} sizes={PAGE_SIZES} onPage={(p) => { update({ page: p }, { resetPage: false }); window.scrollTo(0, 0) }} onSize={(s) => update({ size: s })} />
                  </>
                )}
      </Panel>

      <p className="ax-help">
        <strong className="ax-strong">Paid</strong> means Stripe has an active paid subscription. <strong className="ax-strong">Trial</strong> means nothing has been collected yet. <strong className="ax-strong">Ending</strong> means Stripe will not charge again. Plan changes and cancellations happen in Stripe so proration is applied correctly.
      </p>
    </>
  )
}
