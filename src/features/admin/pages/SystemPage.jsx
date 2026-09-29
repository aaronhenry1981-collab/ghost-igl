import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AuditLog from '../../../components/admin/AuditLog'
import { useAdminData } from '../AdminData'
import { adminSend } from '../adminFetch'
import { Badge, Field, Icon, Notice, PageHeader, Panel } from '../ui'

export default function SystemPage() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash === '#audit') document.getElementById('audit')?.scrollIntoView({ block: 'start' })
  }, [location.hash])

  return (
    <>
      <PageHeader
        title="System"
        description="Keep the membership table in step with Stripe, and review every audited admin action."
        actions={<a className="ax-btn ax-btn--sm" href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer"><Icon name="external" /> Stripe dashboard</a>}
      />
      <Reconciliation />
      <AuditLog id="audit" />
    </>
  )
}

// Reconcile is preview-first (audit P0-4): the preview is read-only; an
// apply sends that preview's id plus the typed phrase and writes only the
// billing fields of the previewed rows.
function Reconciliation() {
  const { reload } = useAdminData()
  const [preview, setPreview] = useState(null)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  async function runPreview() {
    setBusy(true)
    setStatus(null)
    setConfirm('')
    try {
      setPreview(await adminSend('/admin/backfill', 'POST', { mode: 'preview' }))
    } catch (err) {
      setStatus({ tone: 'danger', text: `Preview failed: ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  async function apply() {
    if (!preview) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await adminSend('/admin/backfill', 'POST', { mode: 'apply', previewId: preview.previewId, confirm })
      setStatus({ tone: 'ok', text: `Reconciled: ${res.applied} applied, ${res.conflicts} skipped because the row changed, ${res.failed} failed. Every row is in the audit log.` })
      setPreview(null)
      setConfirm('')
      await reload()
    } catch (err) {
      setStatus({ tone: 'danger', text: `Apply refused: ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  const counts = preview?.counts
  return (
    <Panel
      title="Stripe reconciliation"
      description="Use only when the membership table is missing or mislabelling a Stripe subscription. It never charges, reprices or cancels anyone. The preview is read-only; applying changes only plan, status, period end and subscription ID, never touches complimentary rows, and logs every row."
      actions={<button type="button" className="ax-btn ax-btn--sm" onClick={runPreview} disabled={busy}>{busy && !preview ? 'Working…' : preview ? 'Preview again' : 'Preview reconciliation'}</button>}
    >
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}
      {!preview ? (
        <p className="ax-help">No preview loaded. A preview lists every change before anything is written.</p>
      ) : (
        <>
          <div className="ax-badges" style={{ marginBottom: 12 }}>
            <span className="ax-muted" style={{ fontSize: '0.78rem' }}>Preview <span className="ax-mono">{preview.previewId}</span></span>
            <Badge tone="info">{counts.updates} update{counts.updates === 1 ? '' : 's'}</Badge>
            <Badge tone="info">{counts.creates} new row{counts.creates === 1 ? '' : 's'}</Badge>
            <Badge tone={counts.revocations ? 'danger' : 'muted'}>{counts.revocations} remove access</Badge>
            <Badge tone="muted">{counts.unchanged} unchanged</Badge>
            <Badge tone={counts.skipped ? 'warning' : 'muted'}>{counts.skipped} skipped for safety</Badge>
          </div>
          {preview.changes.length > 0 && (
            <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 6, marginBottom: 12 }}>
              <table className="ax-table">
                <thead><tr><th scope="col">Stripe customer</th><th scope="col">Change</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
                <tbody>
                  {preview.changes.map((c) => (
                    <tr key={c.stripe_customer_id}>
                      <td className="ax-mono">{c.stripe_customer_id}</td>
                      <td>{c.action === 'create' ? 'New row' : (c.fields || []).join(', ')}{c.revokesAccess && <> <Badge tone="danger">Removes access</Badge></>}</td>
                      <td>{c.before ? `${c.before.plan || '—'} · ${c.before.status || '—'}` : '—'}</td>
                      <td>{`${c.after.plan} · ${c.after.status}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.skipped.length > 0 && (
            <p className="ax-help" style={{ marginBottom: 12 }}>Skipped: {preview.skipped.map((s) => `${s.stripe_customer_id} (${s.reason.replace(/_/g, ' ')})`).join('; ')}</p>
          )}
          {preview.changes.length > 0 ? (
            <div className="ax-form-grid" style={{ maxWidth: 640 }}>
              <Field label={<>Type <code>{preview.confirmPhrase}</code> to apply exactly this preview</>}>
                <input className="ax-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} />
              </Field>
              <div className="ax-btn-row">
                <button type="button" className="ax-btn ax-btn--primary" onClick={apply} disabled={busy || confirm !== preview.confirmPhrase}>{busy ? 'Applying…' : 'Apply'}</button>
                <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setPreview(null)} disabled={busy}>Discard preview</button>
              </div>
            </div>
          ) : <Notice tone="ok">Nothing to change. The membership table matches Stripe.</Notice>}
        </>
      )}
    </Panel>
  )
}
