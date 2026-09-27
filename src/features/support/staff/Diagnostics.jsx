import { Ago, Chip, Dot, InferenceTag, NotRecorded, ProviderStatus } from '../ui/bits'

const isNotRecorded = (v) => v === null || v === undefined || v === '' || v === 'not recorded'

// Staff diagnostics panels: { id, title, status, facts: [{ label, value,
// source, at }], inferences: [{ label, value, basis, confidence }],
// actions: { user, recon } }. Facts carry source + time; inferences are
// labelled with the rule that produced them. "not recorded" means the source
// does not record it: we say so instead of inventing telemetry (§2.2, §7).
export function DiagnosticsPanels({ panels = [], observedAt = null }) {
  if (!panels.length) return <p className="sp-muted">No diagnostics for this case.</p>
  return (
    <div className="sc-diag">
      {panels.map((p) => (
        <section key={p.id} className={`sc-diag-card sc-diag-${p.status}`} aria-label={`${p.title || p.id} diagnostics`}>
          <header className="sc-diag-head">
            <Dot status={p.status} />
            <h3>{p.title || p.id}</h3>
            <ProviderStatus status={p.status} />
            {observedAt && <span className="sp-muted sp-small">checked <Ago at={observedAt} /></span>}
          </header>
          {p.status === 'unavailable' && <p className="sp-note sp-note-danger">This source could not be read. Other panels are unaffected.</p>}
          {(p.facts || []).length > 0 && (
            <ul className="sc-facts">
              {p.facts.map((f, i) => (
                <li key={`${f.label}-${i}`}>
                  <span className="sc-fact-label">{f.label}</span>
                  <span className="sc-fact-value">{isNotRecorded(f.value) ? <NotRecorded /> : String(f.value)}</span>
                  <span className="sc-fact-src">{f.source || 'unknown source'}{f.at ? <> · <Ago at={f.at} /></> : ''}</span>
                </li>
              ))}
            </ul>
          )}
          {(p.inferences || []).map((inf, i) => (
            <div key={`${inf.label}-${i}`} className="sc-inference">
              <InferenceTag confidence={inf.confidence} />
              <p><strong>{inf.label}:</strong> {String(inf.value)}</p>
              {inf.basis && <p className="sp-muted sp-small">Basis: {inf.basis}</p>}
            </div>
          ))}
          {(p.actions?.recon || []).length > 0 && (
            <ul className="sc-recon-actions">
              {p.actions.recon.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

const BINDING = { bound: ['ok', 'Bound'], partial: ['warning', 'Partly bound'], unbound: ['danger', 'Not bound'], mismatch: ['danger', 'Different login'], no_rows: ['muted', 'No rows'] }

// Operator view (§7.2): diagnostics.context.entitlement from the service
// (diagnostics/entitlement.mjs entitlementView). Read-only. There is
// deliberately no repair button: the only action is a request that a
// lead/admin must authorize. Stripe references arrive masked for roles
// without billing access (refsMasked).
export function EntitlementView({ ent, onRequestAction, canRequest = true }) {
  if (!ent) return <p className="sp-muted">Entitlement view unavailable (membership record could not be read).</p>
  const [bTone, bLabel] = BINDING[ent.identityBinding?.state] || ['muted', 'Unknown']
  const r = ent.reconState || {}
  return (
    <div className="sc-ent">
      {ent.mismatchSuspected ? (
        <div className="sc-ent-flag" role="note">
          <Chip tone="danger">Mismatch suspected</Chip>
          <ul className="sc-mini">
            {(ent.mismatches || []).map((m) => (
              <li key={m.ruleId}><span className="sc-wrap"><strong>{m.detail}</strong> <span className="sp-muted sp-small">(rule {m.ruleId}: {m.rule})</span></span></li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="sc-ent-ok"><Chip tone="ok">No mismatch</Chip> No entitlement rule fired for these rows.</p>
      )}
      <div className="sc-ent-grid">
        <div className="sc-ent-col">
          <p className="sc-subhead">Billing references{ent.refsMasked ? ' (masked)' : ''}</p>
          {(ent.stripeRefs || []).length ? (
            <ul className="sc-mini sc-refs">
              {ent.stripeRefs.map((ref, i) => (
                <li key={i}>
                  <span className="sp-mono sc-wrap">{[ref.customerId, ref.subscriptionId || 'no subscription id'].join(' / ')}</span>
                  <span className="sp-muted sp-small sc-line">{ref.ledgerPlan || '—'} · {ref.ledgerStatus || '—'}{ref.currentPeriodEnd ? <> · paid through <Ago at={ref.currentPeriodEnd} /></> : ''}{ref.identityBound ? ' · bound' : ' · not bound'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="sp-muted sp-small">No subscription rows.</p>}
          <dl className="sc-dl">
            <dt>Product / tier</dt><dd>{ent.product?.planLabel || '—'}{ent.product?.priceName && ent.product.priceName !== ent.product.planLabel ? ` · ${ent.product.priceName}` : ''}</dd>
            <dt>Stripe-reported</dt>
            <dd>{ent.stripeReportedState === 'not_checked' ? <span className="sp-notrec" title={ent.stripeReportedNote}>Not checked</span> : ent.stripeReportedState}</dd>
          </dl>
        </div>
        <div className="sc-ent-col">
          <p className="sc-subhead">Recon</p>
          <dl className="sc-dl">
            <dt>Entitlement</dt><dd><strong>{r.planLabel || r.plan || '—'}</strong> · {r.hasAccess ? 'access granted' : 'no access'}</dd>
            <dt>State</dt><dd className="sp-mono">{r.status || '—'}{r.stale ? ` (stale: ${r.staleReason || 'yes'})` : ''}</dd>
            <dt>Resolved by</dt><dd className="sp-mono">{r.resolver || '—'}</dd>
            <dt>Identity binding</dt><dd><Chip tone={bTone}>{bLabel}</Chip><span className="sp-muted sp-small sc-line">{ent.identityBinding ? `${ent.identityBinding.rowsBound}/${ent.identityBinding.rowsTotal} rows carry the login` : ''}</span></dd>
            <dt>Last check</dt><dd>{isNotRecorded(ent.lastCheck?.stateFetchedAt) ? <NotRecorded /> : <Ago at={ent.lastCheck.stateFetchedAt} />}</dd>
          </dl>
        </div>
      </div>
      <div className="sc-ent-actions">
        {canRequest && <button type="button" className="btn btn-outline btn-sm" onClick={onRequestAction}>Request action (needs authorization)</button>}
        <span className="sp-muted sp-small">{ent.note || "Support can't change billing or access. A lead authorizes; the change happens in the billing system."}</span>
      </div>
    </div>
  )
}

const FRESH_TONE = { fresh: 'ok', aging: 'info', stale: 'warning', unknown: 'muted' }
const SOURCE_LABEL = { ubisoft: 'Ubisoft', psn: 'PlayStation', xbox: 'Xbox', trn: 'Tracker (TRN)', replay: 'Replays', vod: 'VOD reviews', desktop: 'Desktop app' }

function Flag({ on, label }) {
  if (on === null || on === undefined) return <NotRecorded />
  return on ? <Chip tone="warning">{label}</Chip> : <span className="sp-muted">No</span>
}

// Connection health per source (§7.3): diagnostics.context.connections =
// [{ source, linked, lastSuccessAt, observedAt, lastAttemptAt (never
// recorded per player), errorClass, freshness, retryEligible,
// userActionRequired, reconActionRequired, notes[] }].
export function ConnectionHealth({ rows = [] }) {
  if (!rows.length) return <p className="sp-muted">Connection history was not available for this player.</p>
  return (
    <div className="crm-table-wrap sc-table-wrap">
      <table className="crm-table crm-table-compact sc-health">
        <caption className="sp-visually-hidden">Connection health per source</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Linked</th>
            <th scope="col">Last success</th>
            <th scope="col">Last attempt</th>
            <th scope="col">Error class</th>
            <th scope="col">Freshness</th>
            <th scope="col">Retry</th>
            <th scope="col">Player action</th>
            <th scope="col">Recon action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source}>
              <th scope="row" data-label="Source">
                <strong>{SOURCE_LABEL[r.source] || r.source}</strong>
                {(r.notes || []).filter((n) => !/^lastAttemptAt/.test(n)).map((n) => <span key={n} className="sp-muted sp-small sc-line">{n}</span>)}
              </th>
              <td data-label="Linked">{r.linked === null || r.linked === undefined ? <span className="sp-muted">n/a</span> : r.linked ? <Chip tone="ok">Linked</Chip> : <Chip tone="muted">No</Chip>}</td>
              <td data-label="Last success">{r.lastSuccessAt ? <Ago at={r.lastSuccessAt} /> : <NotRecorded>None</NotRecorded>}</td>
              <td data-label="Last attempt">{r.lastAttemptAt ? <Ago at={r.lastAttemptAt} /> : <NotRecorded>Not recorded per player</NotRecorded>}</td>
              <td data-label="Error class">{r.errorClass ? <span className="sp-mono">{r.errorClass}</span> : <span className="sp-muted">None recorded</span>}</td>
              <td data-label="Freshness"><Chip tone={FRESH_TONE[r.freshness] || 'muted'}>{r.freshness || 'unknown'}</Chip></td>
              <td data-label="Retry">{r.retryEligible ? <Chip tone="info">Eligible</Chip> : <span className="sp-muted">No</span>}</td>
              <td data-label="Player action"><Flag on={r.userActionRequired} label="Required" /></td>
              <td data-label="Recon action"><Flag on={r.reconActionRequired} label="Required" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
