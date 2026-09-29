import { useState, useEffect, useCallback } from 'react'
import { adminFetch, adminSend } from '../../features/admin/adminFetch'
import { Field, Icon, Notice, Panel, Skeleton, StateView } from '../../features/admin/ui'

// Coaching scheduler admin — edit availability windows, session length,
// buffers, and blackout dates without touching code. Backend: recon6-booking
// Lambda (GET/PUT /admin/availability). Slots regenerate from this config on
// every public /booking/slots call, so edits are live immediately.

// The fields this editor owns; everything else is left as saved.
const EDITED_FIELDS = ['session_minutes', 'buffer_minutes', 'booking_horizon_days', 'min_notice_hours', 'windows', 'blackouts']

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AvailabilityEditor({ onSaved }) {
  const [config, setConfig] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [blackoutInput, setBlackoutInput] = useState('')

  const load = useCallback(async () => {
    try {
      const a = await adminFetch('/admin/availability')
      setConfig(a.config)
      setLoadError(null)
      setDirty(false)
    } catch (err) {
      setLoadError(err.message)
    }
  }, [])
  // Mount-time fetch of admin config — same pattern as the other admin panels.
  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    setStatus(null)
    try {
      // Merge onto the latest saved config: one-off windows and time off are
      // edited on the calendar, and a stale copy here must not erase them.
      const latest = (await adminFetch('/admin/availability')).config || {}
      const mine = Object.fromEntries(EDITED_FIELDS.map((k) => [k, config[k]]))
      const r = await adminSend('/admin/availability', 'PUT', { config: { ...latest, ...mine } })
      setConfig(r.config)
      setDirty(false)
      onSaved?.()
      setStatus({ tone: 'ok', text: 'Saved. The public booking page uses it immediately.' })
    } catch (err) {
      setStatus({ tone: 'danger', text: `Save failed: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (!config) {
    return (
      <Panel title="Weekly availability">
        {loadError ? <StateView kind="error" title="Availability could not be loaded" onRetry={load}>{loadError}</StateView> : <Skeleton rows={4} />}
      </Panel>
    )
  }

  const setField = (k, v) => { setConfig({ ...config, [k]: v }); setDirty(true) }
  const setWindow = (i, k, v) => setField('windows', config.windows.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const numberField = (key, label, hint) => (
    <Field label={label} hint={hint}>
      <input className="ax-input ax-num" type="number" min="0" value={config[key]} onChange={(e) => setField(key, Number(e.target.value))} />
    </Field>
  )

  return (
    <Panel
      title="Weekly availability"
      description={<>Recurring bookable hours in <strong className="ax-strong">{config.timezone}</strong>. Customers see slots in their own time zone. A slot can never be double-booked.</>}
      actions={
        <button type="button" className={`ax-btn ax-btn--sm${dirty ? ' ax-btn--primary' : ''}`} onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save availability' : 'Saved'}
        </button>
      }
    >
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}

      <p className="ax-subhead">Session rules</p>
      <div className="ax-form-grid">
        {numberField('session_minutes', 'Session length (minutes)')}
        {numberField('buffer_minutes', 'Buffer between sessions (minutes)')}
        {numberField('booking_horizon_days', 'Bookable ahead (days)')}
        {numberField('min_notice_hours', 'Minimum notice (hours)')}
      </div>

      <p className="ax-subhead" style={{ marginTop: 22 }}>Weekly windows</p>
      {config.windows.length === 0 && <p className="ax-help" style={{ marginBottom: 8 }}>No weekly windows. Customers can only book one-off windows opened on the calendar.</p>}
      {config.windows.map((w, i) => (
        <div key={i} className="ax-window-row">
          <select className="ax-select" aria-label="Day" value={w.dow} onChange={(e) => setWindow(i, 'dow', Number(e.target.value))}>
            {DOW.map((d, di) => <option key={d} value={di}>{d}</option>)}
          </select>
          <input className="ax-input" type="time" aria-label="Start" value={w.start} onChange={(e) => setWindow(i, 'start', e.target.value)} />
          <span aria-hidden="true">to</span>
          <input className="ax-input" type="time" aria-label="End" value={w.end} onChange={(e) => setWindow(i, 'end', e.target.value)} />
          <button type="button" className="ax-icon-btn" aria-label={`Remove ${DOW[w.dow]} window`} onClick={() => setField('windows', config.windows.filter((_, j) => j !== i))}><Icon name="close" /></button>
        </div>
      ))}
      <button type="button" className="ax-btn ax-btn--sm" onClick={() => setField('windows', [...config.windows, { dow: 1, start: '18:00', end: '22:00' }])}>Add window</button>

      <p className="ax-subhead" style={{ marginTop: 22 }}>Blackout dates</p>
      <div className="ax-chip-list" style={{ marginBottom: 10 }}>
        {config.blackouts.length === 0 && <span className="ax-help">No blackout dates.</span>}
        {config.blackouts.map((d) => (
          <span key={d} className="ax-chip">
            {d}
            <button type="button" className="ax-icon-btn" aria-label={`Remove blackout ${d}`} onClick={() => setField('blackouts', config.blackouts.filter((x) => x !== d))}><Icon name="close" size={12} /></button>
          </span>
        ))}
      </div>
      <div className="ax-btn-row">
        <input className="ax-input" style={{ maxWidth: 200 }} type="date" aria-label="Blackout date" value={blackoutInput} onChange={(e) => setBlackoutInput(e.target.value)} />
        <button type="button" className="ax-btn ax-btn--sm" disabled={!blackoutInput || config.blackouts.includes(blackoutInput)} onClick={() => { setField('blackouts', [...config.blackouts, blackoutInput]); setBlackoutInput('') }}>
          Block date
        </button>
      </div>
      {dirty && <p className="ax-help" style={{ marginTop: 14 }}>Unsaved changes. Save to update the public booking page.</p>}
    </Panel>
  )
}
