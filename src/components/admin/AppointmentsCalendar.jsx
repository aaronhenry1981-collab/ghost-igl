import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'
import {
  bookingEventTitle,
  bookingStatusLabel,
  confirmedUpcomingSessions,
  isActiveCheckoutHold,
  isCalendarBookingVisible,
} from '../../lib/bookingDisplay'

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
  const [selectedSlotId, setSelectedSlotId] = useState(null) // booking drawer follows refreshed server data
  const [showCalendar, setShowCalendar] = useState(false)
  const [sendingCheckinSlotId, setSendingCheckinSlotId] = useState(null)
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
      if (!isCalendarBookingVisible(b, nowMs)) continue
      const end = new Date(Date.parse(b.start) + sessionMin * 60000).toISOString()
      evs.push({
        id: b.slotId,
        title: bookingEventTitle(b, nowMs),
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
  }, [config, bookings, range, sessionMin, nowMs])

  const upcoming = useMemo(() => confirmedUpcomingSessions(bookings, nowMs, 50), [bookings, nowMs])
  const activeHolds = useMemo(() =>
    bookings.filter((booking) => isActiveCheckoutHold(booking, nowMs)), [bookings, nowMs])
  const selected = useMemo(() =>
    bookings.find((booking) => booking.slotId === selectedSlotId) || null,
  [bookings, selectedSlotId])

  // A visitor's identity is attached only after they submit the booking form.
  // While a checkout hold is active, refresh so the admin drawer updates by
  // itself when payment begins or finishes.
  useEffect(() => {
    if (activeHolds.length === 0) return undefined
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [activeHolds.length, load])

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

  async function action(body, okMsg, { keepOpen = false } = {}) {
    setStatus('Working…')
    try {
      await authedFetch('/admin/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setStatus(okMsg)
      if (!keepOpen) {
        setSelectedSlotId(null)
        setComp(null)
      }
      await load()
      return true
    } catch (err) { setStatus(`Failed: ${err.message}`) }
    return false
  }

  async function sendCheckin(booking) {
    setSendingCheckinSlotId(booking.slotId)
    try {
      await action(
        { action: 'checkin', slotId: booking.slotId },
        `Check-in emailed to ${booking.customer?.name || booking.customer?.email || 'the customer'}.`,
        { keepOpen: true },
      )
    } finally {
      setSendingCheckinSlotId(null)
    }
  }

  async function showWebcal() {
    try { const r = await authedFetch('/admin/calendar-url'); setWebcal(r) }
    catch (err) { setStatus(`Feed URL failed: ${err.message}`) }
  }

  return (
    <section className="admin-section">
      <style>{`
        .appointment-list{display:grid;gap:10px;margin:12px 0 16px}
        .appointment-row{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(220px,1.35fr) minmax(170px,.75fr) auto;gap:18px;align-items:center;background:#101725;border:1px solid #27334a;border-radius:12px;padding:14px 16px}
        .appointment-row__date{color:#72ddf7;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .appointment-row__time{color:#f4f7fb;font-size:1.25rem;font-weight:800;margin-top:2px}
        .appointment-row__name{color:#f4f7fb;font-size:1rem;font-weight:800}
        .appointment-row__contact,.appointment-row__meta{color:#9aa8ba;font-size:.82rem;line-height:1.45;overflow-wrap:anywhere}
        .appointment-row__actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
        .appointment-empty{background:#101725;border:1px dashed #31405a;border-radius:12px;color:#9aa8ba;padding:20px;text-align:center}
        @media(max-width:900px){.appointment-row{grid-template-columns:1fr 1fr}.appointment-row__actions{justify-content:flex-start}}
        @media(max-width:620px){.appointment-row{grid-template-columns:1fr}.appointment-row__actions{justify-content:stretch}.appointment-row__actions .btn{flex:1}}
      `}</style>
      <div className="admin-section-header"><h2>Upcoming appointments</h2></div>
      <p className="admin-footnote">
        Confirmed sessions in <strong>{tz}</strong>. Date, time, customer, and contact actions are kept together.
      </p>

      <div className="appointment-list" role="list" aria-label="Upcoming coaching appointments">
        {upcoming.length === 0 ? (
          <div className="appointment-empty">No confirmed upcoming sessions.</div>
        ) : upcoming.map((b) => (
          <AppointmentRow
            key={b.slotId}
            booking={b}
            fmtInTz={fmtInTz}
            nowMs={nowMs}
            sending={sendingCheckinSlotId === b.slotId}
            onManage={() => setSelectedSlotId(b.slotId)}
            onCheckin={() => sendCheckin(b)}
          />
        ))}
      </div>
      {activeHolds.length > 0 && (
        <p className="admin-footnote" style={{ color: '#e5ad58', marginBottom: 12 }}>
          {activeHolds.length} checkout {activeHolds.length === 1 ? 'hold is' : 'holds are'} waiting for payment. {activeHolds.length === 1 ? 'It is' : 'They are'} not an appointment yet.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" className="btn" aria-expanded={showCalendar} onClick={() => setShowCalendar((open) => !open)}>
          {showCalendar ? 'Hide calendar & availability' : 'Manage calendar & availability'}
        </button>
      </div>
      {showCalendar && (
        <div style={{ marginTop: 12 }}>
          <p className="admin-footnote">
            Drag an empty range to open a one-off bookable window; click a booking to manage it.
            Green = open · amber = checkout hold · other coloured blocks = sessions · red = time off.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className="btn" onClick={() => { loadOpenSlots(); setComp({ slotId: '', name: '', email: '' }) }}>+ Comp a session</button>
            <button type="button" className="btn" onClick={showWebcal}>Subscribe on my phone</button>
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
                if (b) setSelectedSlotId(b.slotId)
              }}
              datesSet={(arg) => setRange({ start: arg.start, end: arg.end })}
            />
          </div>
        </div>
      )}

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
          nowMs={nowMs}
          onClose={() => setSelectedSlotId(null)}
          onAction={action}
          sendingCheckin={sendingCheckinSlotId === selected.slotId}
          onCheckin={() => sendCheckin(selected)}
        />
      )}
    </section>
  )
}

function AppointmentRow({ booking: b, fmtInTz, nowMs, sending, onManage, onCheckin }) {
  const lastCheckinMs = Date.parse(b.lastCheckinAt || '')
  const coolingDown = Number.isFinite(lastCheckinMs) && nowMs - lastCheckinMs < 5 * 60000
  const identity = b.customer?.name || b.customer?.email || 'Customer'

  return (
    <article className="appointment-row" role="listitem">
      <div>
        <div className="appointment-row__date">{fmtInTz(b.start, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div className="appointment-row__time">{fmtInTz(b.start, { hour: 'numeric', minute: '2-digit' })}</div>
        <div className="appointment-row__meta">in {timeUntil(b.start, nowMs)}</div>
      </div>
      <div>
        <div className="appointment-row__name">{identity}</div>
        <div className="appointment-row__contact">{b.customer?.email || 'No email recorded'}</div>
        {b.customer?.discord && <div className="appointment-row__contact">Discord: {b.customer.discord}</div>}
      </div>
      <div>
        <div className="appointment-row__meta"><strong>{b.sessionType || 'Coaching session'}</strong></div>
        <div className="appointment-row__meta">{bookingStatusLabel(b, nowMs)}</div>
        {b.lastCheckinAt && (
          <div className="appointment-row__meta">Check-in sent {fmtInTz(b.lastCheckinAt, { hour: 'numeric', minute: '2-digit' })}</div>
        )}
      </div>
      <div className="appointment-row__actions">
        <button type="button" className="btn" onClick={onManage}>Manage</button>
        <button type="button" className="btn btn-primary" onClick={onCheckin} disabled={sending || coolingDown || !b.customer?.email}>
          {sending ? 'Sending…' : coolingDown ? 'Check-in sent' : 'Send check-in'}
        </button>
      </div>
    </article>
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

function BookingDrawer({ booking: b, tz, openSlots, loadOpenSlots, fmtInTz, nowMs, onClose, onAction, sendingCheckin, onCheckin }) {
  const [notes, setNotes] = useState(b.notes || '')
  const [newSlot, setNewSlot] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const src = b.referral_source || 'direct'
  const isHold = b.status === 'held'
  const activeHold = isActiveCheckoutHold(b, nowMs)
  const identity = b.customer?.name || b.customer?.email

  return (
    <Drawer title={identity || (isHold ? 'Checkout hold' : 'Booking')} onClose={onClose}>
      <div style={{ fontSize: '.9rem', lineHeight: 1.7 }}>
        <div><strong>{fmtInTz(b.start, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong> ({tz})</div>
        <div>Status: <strong>{bookingStatusLabel(b, nowMs)}</strong></div>
        <div>Session type: {b.sessionType || 'Not selected yet'}</div>
        <div>Payment: {isHold ? 'Not paid' : (b.payment?.status || (b.status === 'comped' ? 'comped' : '—'))}{b.payment?.stripe_id ? <> · <a href={`https://dashboard.stripe.com/payments/${b.payment.stripe_id}`} target="_blank" rel="noopener noreferrer">Stripe</a></> : null}</div>
        {isHold && (
          <div style={{ color: activeHold ? '#e5ad58' : '#8b98ab', margin: '6px 0' }}>
            {activeHold
              ? <>Expires {fmtInTz(b.heldUntil, { hour: 'numeric', minute: '2-digit', second: '2-digit' })} — this is not a session unless checkout finishes.</>
              : <>This checkout hold expired and is not a session.</>}
          </div>
        )}
        <div style={{ margin: '6px 0' }}>
          Source: <span style={{ background: '#1c2740', border: '1px solid #2a3550', borderRadius: 999, padding: '2px 10px', fontWeight: 700, color: src === 'direct' ? '#8b98ab' : '#7ee2a4' }}>{src}</span>
        </div>
        <div>Customer: <strong>{identity || 'Identity not entered yet'}</strong></div>
        {!identity && isHold && <div style={{ color: '#8b98ab' }}>The visitor selected this time but has not submitted the booking form.</div>}
        {b.customer?.email && b.customer.email !== identity && <div>Email: {b.customer.email}</div>}
        {b.customer?.discord && <div>Discord: {b.customer.discord}</div>}
        {b.customer?.rank_goal && <div>Rank goal: {b.customer.rank_goal}</div>}
        {b.customer?.notes && <div style={{ color: '#8b98ab', marginTop: 6 }}>“{b.customer.notes}”</div>}
        <div style={{ color: '#66758a', marginTop: 6, fontSize: '.78rem' }}>Reference: {b.slotId}</div>
      </div>

      <label className="fld" style={{ marginTop: 14 }}>Private notes (only you see these)
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="button" className="btn" onClick={() => onAction({ action: 'notes', slotId: b.slotId, notes }, 'Notes saved.')}>Save notes</button>

      {!isHold && b.customer?.email && (
        <button type="button" className="btn btn-primary" style={{ marginTop: 10 }} disabled={sendingCheckin} onClick={onCheckin}>
          {sendingCheckin ? 'Sending check-in…' : 'Send “Are you online?” check-in'}
        </button>
      )}

      {isHold ? (
        <p className="admin-footnote" style={{ marginTop: 14, color: '#e5ad58' }}>
          Session controls stay locked until payment confirms the booking. An unfinished hold releases automatically.
        </p>
      ) : rescheduling ? (
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
