import { useState } from 'react'
import { describeTouch } from './core.js'
import { attributionProps, readAttribution } from './store.js'
import { pendingEvents } from './events.js'

// Development-only inspector (never in production bundles): shows what this
// browser recorded for the current visit, the Plausible properties every
// event will carry, and the events a signed-in player would record.
// Open any page with ?attr_debug=1 under `npm run dev`.

const S = {
  panel: { position: 'fixed', right: 16, bottom: 16, zIndex: 9999, width: 'min(440px, calc(100vw - 32px))', maxHeight: 'min(78vh, 720px)', overflow: 'auto', background: '#0d1117', color: '#e6edf3', border: '1px solid #3d4b5c', borderRadius: 8, padding: 16, font: '13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', boxShadow: '0 12px 32px rgba(0,0,0,.5)' },
  h: { margin: '0 0 8px', font: '700 14px/1.3 system-ui, sans-serif', color: '#ffffff' },
  sub: { margin: '14px 0 6px', font: '700 11px/1.3 system-ui, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', color: '#9fb0c3' },
  row: { margin: '2px 0' },
  key: { color: '#9fb0c3' },
  pre: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#c9d6e3' },
  btn: { float: 'right', background: 'transparent', color: '#e6edf3', border: '1px solid #5b6b7d', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', font: '12px system-ui, sans-serif' },
}

function Line({ label, value }) {
  return <p style={S.row}><span style={S.key}>{label}: </span>{value}</p>
}

export default function DevAttributionPanel() {
  const [open, setOpen] = useState(true)
  const state = readAttribution()
  if (!open) return null
  const props = attributionProps(state)
  const events = pendingEvents(state)
  return (
    <aside style={S.panel} aria-label="Attribution inspector (development only)">
      <button type="button" style={S.btn} onClick={() => setOpen(false)}>Close</button>
      <h2 style={S.h}>Attribution inspector · dev only</h2>
      {!state ? <p>No attribution stored (storage blocked?).</p> : (
        <>
          <Line label="First touch" value={describeTouch(state.firstTouch)} />
          {state.firstNonDirectTouch && <Line label="First real source" value={describeTouch(state.firstNonDirectTouch)} />}
          <Line label="Last touch" value={describeTouch(state.lastTouch)} />
          <Line label="Landing page" value={state.landingPath || 'unknown'} />
          <Line label="Visits" value={String(state.visits)} />
          {state.seededFromLegacy && <Line label="Note" value="first touch kept from the older tracker (recon:src)" />}
          <h3 style={S.sub}>Plausible properties on every event</h3>
          <pre style={S.pre}>{JSON.stringify(props, null, 2)}</pre>
          <h3 style={S.sub}>Recorded on sign-in (player-data events)</h3>
          <pre style={S.pre}>{events.map((e) => `${e.event_type}  ${e.event_id}  ${e.occurred_at}`).join('\n') || 'nothing pending'}</pre>
          <h3 style={S.sub}>Touch history</h3>
          <pre style={S.pre}>{(state.touches || []).map((t) => `${t.at || 'legacy'}  ${t.source} · ${t.channel} · ${t.evidence}${t.campaign ? ` · ${t.campaign}` : ''}`).join('\n') || 'no non-direct touches'}</pre>
        </>
      )}
    </aside>
  )
}
