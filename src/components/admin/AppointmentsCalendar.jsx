import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

// Appointments — the real coaching calendar. Bookings render as colour-coded
// events, availability windows as green background shading, one-off time-off as
// red. Drag an empty range to open a one-off bookable window; click a booking
// for the detail drawer (reschedule / cancel / complete / comp + private notes
// + the channel it came from). Everything reads/writes the recon6-booking
// Lambda. Times render in the coach's configured timezone (Aaron's local).

async function authedFetch(path, opts = {}) {
  const user = getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const session = await getSession(user)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

// status → colour. Solid confirmed, amber held, blue comped, green completed.
const STATUS_COLOR = {
  confirmed: '#2f9e6b',
  comped: '#3b82f6',
  completed: '#6b7280',
  held: '#d9871f',
}

const two = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`
// Weekday of a plain calendar date (tz-independent): noon-UTC avoids edges.
const dowOf = (dateStr) => new Date(`${dateStr}T12:00:00Z`).getUTCDay()

function timeUntil(iso, nowMs) {
  const ms = Date.parse(iso) - nowMs
  if (ms < 0) return 'now'
  const h = Math.floor(ms / 3600000)
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))} min`
  if (h < 48) return `${h}h`
  return `${Math.round(h / 24)}d`
}

export default function AppointmentsCalendar() {
  const [config, setConfig] = useState(null)
  const [bookings, setBookings] = useState([])
  const [range, setRange] = useState(null) // {start: Date, end: Date} of the visible view
  const [selected, setSelected] = useState(null) // booking in the drawer
  const [status, setStatus] = useState('')
  const [webcal, setWebcal] = useState(null)
  const [comp, setComp] = useState(null) // {slotId, name, email} for the comp form
  const [openSlots, setOpenSlots] = useState([])
  const calRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        authedFetch('/admin/availability'),
        authedFetch('/admin/bookings?all=1'),
      ])
      setConfig(a.config)
      setBookings(b.bookings || [])
    } catch (err) {
      setStatus(`Load failed: ${err.message}`)
    }
  }, [])

  // Mount-time fetch — same pattern as the other admin panels.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Clock in state (Date.now() only inside the effect, never during render) so
  // "upcoming" and time-until stay pure and refresh each minute.
  const [nowMs, setNowMs] = useState(0)
  useEffect(() => {
    const tick = () => setNowMs(Date.now())
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  // Open slots (for reschedule / comp pickers) — refreshed lazily.
  const loadOpenSlots = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/booking/slots`).then((x) => x.json())
      setOpenSlots(r.slots || [])
    } catch { /* non-fatal */ }
  }, [])

  const tz = config?.timezone || 'America/New_York'
  const sessionMin = config?.session_minutes || 60

  const fmtInTz = useCallback((iso, opts) =>
    new Intl.DateTimeFormat(undefined, { timeZone: tz, ...opts }).format(new Date(iso)), [tz])

  // ---- events: bookings (coloured) + availability/time-off backgrounds ----
  const events = useMemo(() => {
    if (!config) return []
    const evs = []

    for (const b of bookings) {
      if (!b.start || b.status === 'cancelled') continue // freed slots aren't on the calendar
      const end = new Date(Date.parse(b.start) + sessionMin * 60000).toISOString()
      evs.push({
        id: b.slotId,
        title: `${b.customer?.name || 'Session'} · ${b.sessionType || ''}`.trim(),
        start: b.start,
        end,
        backgroundColor: STATUS_COLOR[b.status] || '#2f9e6b',
        borderColor: STATUS_COLOR[b.status] || '#2f9e6b',
        extendedProps: { booking: b },
      })
    }

    // Availability + time-off backgrounds across the visible range.
    if (range) {
      const cursor = new Date(range.start)
      while (cursor < range.end) {
        const date = ymd(cursor)
        const dow = dowOf(date)
        const blacked = (config.blackouts || []).includes(date)
        if (!blacked) {
          for (const w of config.windows || []) {
            if (w.dow === dow) evs.push(bg(`${date}T${w.start}:00`, `${date}T${w.end}:00`, 'rgba(47,158,107,0.12)'))
          }
          for (const o of config.oneoffs || []) {
            if (o.date === date) evs.push(bg(`${date}T${o.start}:00`, `${date}T${o.end}:00`, 'rgba(47,158,107,0.18)'))
          }
        }
        for (const t of config.timeoff || []) {
          if (t.date === date) evs.push(bg(`${date}T${t.start}:00`, `${date}T${t.end}:00`, 'rgba(220,80,80,0.16)'))
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
    }
    return evs
  }, [config, bookings, range, sessionMin])

  const upcoming = useMemo(() =>
    bookings
      .filter((b) => ['confirmed', 'comped'].includes(b.status) && Date.parse(b.start) >= nowMs)
      .sort((a, c) => a.start.localeCompare(c.start))
      .slice(0, 3), [bookings, nowMs])

  if (!config) {
    return (
      <section className="admin-section">
        <div className="admin-section-header"><h2>Appointments</h2></div>
        <p className="admin-footnote">{status || 'Loading calendar…'}</p>
      </section>
    )
  }

  // ---- drag-to-paint: an empty selection opens a one-off availability window
  async function onSelect(info) {
    // FullCalendar gives Dates; format the wall-clock in the coach tz.
    const parts = (d) => {
      const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
      const g = (t) => p.find((x) => x.type === t).value
      return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` }
    }
    const s = parts(info.start), e = parts(info.end)
    if (s.date !== e.date) { setStatus('Keep a one-off window within a single day.'); return }
    const oneoffs = [...(config.oneoffs || []), { date: s.date, start: s.time, end: e.time }]
    await saveConfig({ ...config, oneoffs })
    setStatus(`Opened ${s.date} ${s.time}–${e.time} for booking.`)
    calRef.current?.getApi().unselect()
  }

  async function saveConfig(next) {
    try {
      const r = await authedFetch('/admin/availability', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: next }),
      })
      setConfig(r.config)
    } catch (err) { setStatus(`Save failed: ${err.message}`) }
  }

  async function action(body, okMsg) {
    setStatus('Working…')
    try {
      await authedFetch('/admin/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setStatus(okMsg)
      setSelected(null); setComp(null)
      await load()
    } catch (err) { setStatus(`Failed: ${err.message}`) }
  }

  async function showWebcal() {
    try { const r = await authedFetch('/admin/calendar-url'); setWebcal(r) }
    catch (err) { setStatus(`Feed URL failed: ${err.message}`) }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-header"><h2>Appointments</h2></div>
      <p className="admin-footnote">
        Times in <strong>{tz}</strong>. Drag an empty range to open a one-off bookable window; click a booking to manage it.
        Green = open · coloured blocks = booked · red = time off.
      </p>

      {/* Upcoming strip */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 14px' }}>
        {upcoming.length === 0 ? (
          <span className="admin-footnote">No upcoming sessions.</span>
        ) : upcoming.map((b) => (
          <button key={b.slotId} type="button" onClick={() => setSelected(b)}
            style={{ textAlign: 'left', background: '#141a2b', border: '1px solid #2a3550', borderRadius: 10, padding: '8px 12px', color: '#dce3ea', cursor: 'pointer' }}>
            <div style={{ fontWeight: 700 }}>{b.customer?.name || 'Session'} <span style={{ color: '#7ee2a4', fontSize: '.8rem' }}>in {timeUntil(b.start, nowMs)}</span></div>
            <div style={{ fontSize: '.82rem', color: '#8b98ab' }}>{fmtInTz(b.start, { weekday: 'short', hour: 'numeric', minute: '2-digit' })} · {b.sessionType}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" className="btn" onClick={() => { loadOpenSlots(); setComp({ slotId: '', name: '', email: '' }) }}>+ Comp a session</button>
        <button type="button" className="btn" onClick={showWebcal}>📲 Subscribe on my phone</button>
      </div>
      {webcal?.url && (
        <p className="admin-footnote" style={{ marginBottom: 10 }}>
          Add this to Apple/Google Calendar once and every booking appears automatically:<br />
          <a href={webcal.url}>{webcal.url}</a>
        </p>
      )}

      <div className="appointments-calendar" style={{ background: '#0d1320', borderRadius: 12, padding: 8 }}>
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          timeZone={tz}
          height="auto"
          nowIndicator
          selectable
          selectMirror
          slotMinTime="08:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          events={events}
          select={onSelect}
          eventClick={(info) => {
            const b = info.event.extendedProps.booking
            if (b) setSelected(b)
          }}
          datesSet={(arg) => setRange({ start: arg.start, end: arg.end })}
        />
      </div>

      {status && <p className="admin-footnote" style={{ marginTop: 10, color: status.includes('ailed') ? '#ff6b6b' : '#7ee2a4' }}>{status}</p>}

      {/* Comp form */}
      {comp && (
        <Drawer title="Comp a session (free, confirmed)" onClose={() => setComp(null)}>
          <label className="fld">Open slot
            <select value={comp.slotId} onChange={(e) => setComp({ ...comp, slotId: e.target.value })}>
              <option value="">— pick an open slot —</option>
              {openSlots.map((s) => <option key={s} value={s}>{fmtInTz(s, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</option>)}
            </select>
          </label>
          <label className="fld">Name<input value={comp.name} onChange={(e) => setComp({ ...comp, name: e.target.value })} /></label>
          <label className="fld">Email<input value={comp.email} onChange={(e) => setComp({ ...comp, email: e.target.value })} /></label>
          <button type="button" className="btn btn-primary" disabled={!comp.slotId || !comp.name || !comp.email}
            onClick={() => action({ action: 'comp', slotId: comp.slotId, name: comp.name, email: comp.email }, 'Comped — customer emailed.')}>
            Create comped booking
          </button>
        </Drawer>
      )}

      {/* Booking detail drawer */}
      {selected && (
        <BookingDrawer
          booking={selected}
          tz={tz}
          openSlots={openSlots}
          loadOpenSlots={loadOpenSlots}
          fmtInTz={fmtInTz}
          onClose={() => setSelected(null)}
          onAction={action}
        />
      )}
    </section>
  )
}

function bg(start, end, color) {
  return { start, end, display: 'background', backgroundColor: color, groupId: 'availability' }
}

function Drawer({ title, children, onClose }) {
  return (
    <div role="dialog" aria-label={title}
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 94vw)', background: '#0f1626', borderLeft: '1px solid #2a3550', boxShadow: '-8px 0 24px rgba(0,0,0,.4)', padding: 20, overflowY: 'auto', zIndex: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b98ab', fontSize: '1.4rem', cursor: 'pointer' }} aria-label="Close">×</button>
      </div>
      <style>{`.fld{display:block;margin:10px 0;font-size:.82rem;color:#8b98ab}.fld input,.fld select,.fld textarea{display:block;width:100%;margin-top:4px;background:#0d1320;color:#dce3ea;border:1px solid #2a3550;border-radius:8px;padding:8px 10px;font-size:.95rem}.drawer-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.drawer-actions .btn{flex:1;min-width:120px}`}</style>
      {children}
    </div>
  )
}

function BookingDrawer({ booking: b, tz, openSlots, loadOpenSlots, fmtInTz, onClose, onAction }) {
  const [notes, setNotes] = useState(b.notes || '')
  const [newSlot, setNewSlot] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const src = b.referral_source || 'direct'

  return (
    <Drawer title={b.customer?.name || 'Booking'} onClose={onClose}>
      <div style={{ fontSize: '.9rem', lineHeight: 1.7 }}>
        <div><strong>{fmtInTz(b.start, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong> ({tz})</div>
        <div>Status: <span style={{ textTransform: 'capitalize' }}>{b.status}</span> · {b.sessionType}</div>
        <div>Payment: {b.payment?.status || (b.status === 'comped' ? 'comped' : '—')}{b.payment?.stripe_id ? <> · <a href={`https://dashboard.stripe.com/payments/${b.payment.stripe_id}`} target="_blank" rel="noopener noreferrer">Stripe</a></> : null}</div>
        <div style={{ margin: '6px 0' }}>
          Source: <span style={{ background: '#1c2740', border: '1px solid #2a3550', borderRadius: 999, padding: '2px 10px', fontWeight: 700, color: src === 'direct' ? '#8b98ab' : '#7ee2a4' }}>{src}</span>
        </div>
        {b.customer?.email && <div>✉ {b.customer.email}</div>}
        {b.customer?.discord && <div>💬 {b.customer.discord}</div>}
        {b.customer?.rank_goal && <div>🎯 {b.customer.rank_goal}</div>}
        {b.customer?.notes && <div style={{ color: '#8b98ab', marginTop: 6 }}>“{b.customer.notes}”</div>}
      </div>

      <label className="fld" style={{ marginTop: 14 }}>Private notes (only you see these)
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="button" className="btn" onClick={() => onAction({ action: 'notes', slotId: b.slotId, notes }, 'Notes saved.')}>Save notes</button>

      {rescheduling ? (
        <div style={{ marginTop: 14 }}>
          <label className="fld">Move to open slot
            <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
              <option value="">— pick a new slot —</option>
              {openSlots.map((s) => <option key={s} value={s}>{fmtInTz(s, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</option>)}
            </select>
          </label>
          <div className="drawer-actions">
            <button type="button" className="btn btn-primary" disabled={!newSlot}
              onClick={() => onAction({ action: 'reschedule', slotId: b.slotId, newSlotId: newSlot }, 'Rescheduled — customer emailed.')}>Confirm move</button>
            <button type="button" className="btn" onClick={() => setRescheduling(false)}>Back</button>
          </div>
        </div>
      ) : (
        <div className="drawer-actions">
          <button type="button" className="btn" onClick={() => { loadOpenSlots(); setRescheduling(true) }}>Reschedule</button>
          <button type="button" className="btn" onClick={() => onAction({ action: 'complete', slotId: b.slotId }, 'Marked complete.')}>Mark complete</button>
          <button type="button" className="btn" style={{ color: '#ff6b6b', borderColor: '#5a2530' }}
            onClick={() => { if (window.confirm('Cancel this booking and free the slot? The customer is emailed.')) onAction({ action: 'cancel', slotId: b.slotId }, 'Cancelled — slot freed, customer emailed.') }}>Cancel</button>
        </div>
      )}
    </Drawer>
  )
}
