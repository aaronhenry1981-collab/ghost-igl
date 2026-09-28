import { useState } from 'react'
import CrmPlayers from './CrmPlayers'
import { useCrmResource } from './useCrmResource'
import { ErrorState, Kpi, Loading, Panel } from './crmUi'
import { fmtMoney } from './crmFormat'

// Ledger truth (webhook records) plus an on-demand live Stripe check through
// the existing admin endpoint. Partial Stripe failures are shown as such:
// cash totals become "unavailable", subscription truth is kept.
function LiveStripe({ api }) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  if (!api.liveStripe) {
    return <p className="crm-muted">Live Stripe check is not available in this environment (fictional preview data).</p>
  }
  async function run() {
    setState({ status: 'loading', data: null, error: null })
    try {
      setState({ status: 'ready', data: await api.liveStripe(), error: null })
    } catch (error) {
      setState({ status: 'error', data: null, error })
    }
  }
  const s = state.data?.summary
  return (
    <div className="crm-stack">
      <p className="crm-muted">Reads live Stripe through the existing admin API. It makes several Stripe calls, so it runs only when you ask.</p>
      <button type="button" className="btn btn-outline btn-sm" onClick={run} disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Checking Stripe…' : 'Run live Stripe check'}
      </button>
      {state.status === 'error' && <ErrorState error={state.error} onRetry={run} />}
      {s && (
        <>
          {state.data.billing_warning && <p className="crm-warn" role="status">{state.data.billing_warning}</p>}
          <div className="crm-kpis">
            <Kpi label="Source" value={state.data.billing_source === 'stripe' ? 'Live Stripe' : 'Ledger fallback'} />
            <Kpi label="MRR" value={fmtMoney(s.mrr_dollars)} />
            <Kpi label="Paying" value={s.paying_active ?? 'unavailable'} />
            <Kpi label="Trialing" value={s.trialing ?? 'unavailable'} />
            <Kpi label="Ending (cancel scheduled)" value={s.ending ?? 'unavailable'} />
            <Kpi label="Collected, 30 days" value={fmtMoney(s.collected_30d_dollars)} detail={s.stripe_cash_verified === false ? 'Cash totals unavailable' : null} />
          </div>
          {Array.isArray(s.stripe_data_warnings) && s.stripe_data_warnings.length > 0 && (
            <ul className="crm-notes">{s.stripe_data_warnings.map((w) => <li key={`${w.operation}-${w.reason}`}>{w.operation}: {w.reason}</li>)}</ul>
          )}
        </>
      )}
    </div>
  )
}

export default function CrmBilling({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/overview')
  return (
    <div className="crm-stack">
      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} />}
      {status === 'ready' && (
        <div className="crm-kpis">
          <Kpi label="Ledger MRR" value={fmtMoney(data.ledgerMrr)} detail="Charged subscriptions only; trials and comps excluded" />
          <Kpi label="Paying: Pro / Elite / Champion" value={`${data.payingByPlan.pro} / ${data.payingByPlan.elite} / ${data.payingByPlan.champion}`} />
          <Kpi label="Stripe trials, not yet charged" value={data.billing.stripeTrials ?? 0} />
          <Kpi label="Failed payments" value={data.billing.paymentFailed} />
          <Kpi label="Renewals not recorded" value={data.billing.renewalUnconfirmed} />
          <Kpi label="Duplicate live subscriptions" value={data.billing.duplicates} />
          <Kpi label="Paying while comped" value={data.billing.compAndPaying ?? 0} />
          <Kpi label="Churned, 30 days" value={data.billing.churned30} />
        </div>
      )}
      <Panel title="Live Stripe check">
        <LiveStripe api={api} />
      </Panel>
      <CrmPlayers api={api} basePath={basePath} variant="billing" />
    </div>
  )
}
