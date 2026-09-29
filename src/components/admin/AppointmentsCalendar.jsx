import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { adminFetch, adminSend, publicFetch } from '../../features/admin/adminFetch'
import { Badge, Drawer, Field, Icon, KeyValues, Notice, Panel, Skeleton, StateView } from '../../features/admin/ui'
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

// status → colour. Solid confirmed, amber held, blue comped, grey completed.
const STATUS_COLOR = {
  confirmed: '#4fae7c',
  comped: '#6f96c8',
  completed: '#8a8377',
  held: '#d9a441',
}
const OPEN_BG = 'rgba(79,174,124,0.14)'
const ONEOFF_BG = 'rgba(79,174,124,0.22)'
const TIMEOFF_BG = 'rgba(239,122,112,0.18)'

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

const SLOT_FMT = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }

export default function AppointmentsCalendar({ reloadSignal = 0 }) {
  const [config, setConfig] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [range, setRange] = useState(null) // {start: Date, end: Date} of the visible view
  const [selectedSlotId, setSelectedSlotId] = useState(null) // booking drawer follows refreshed server data
  const [sendingCheckinSlotId, setSendingCheckinSlotId] = useState(null)
  const [status, setStatus] = useState(null) // { tone, text }
  const [webcal, setWebcal] = useState(null)
  const [comp, setComp] = useState(null) // {slotId, name, email} for the comp form
  const [openSlots, setOpenSlots] = useState([])
  const [narrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches)
  const calRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        adminFetch('/admin/availability'),
        adminFetch('/admin/bookings?all=1'),
      ])
      setConfig(a.config)
      setBookings(b.bookings || [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
    }
  }, [])

  // Mount-time fetch (and again when the availability editor saves).
  useEffect(() => { load() }, [load, reloadSignal])

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
      const r = await publicFetch('/booking/slots')
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
        backgroundColor: STATUS_COLOR[b.status] || STATUS_COLOR.confirmed,
        borderColor: STATUS_COLOR[b.status] || STATUS_COLOR.confirmed,
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
            if (w.dow === dow) evs.push(bg(`${date}T${w.start}:00`, `${date}T${w.end}:00`, OPEN_BG))
          }
          for (const o of config.oneoffs || []) {
            if (o.date === date) evs.push(bg(`${date}T${o.start}:00`, `${date}T${o.end}:00`, ONEOFF_BG))
          }
        }
        for (const t of config.timeoff || []) {
          if (t.date === date) evs.push(bg(`${date}T${t.start}:00`, `${date}T${t.end}:00`, TIMEOFF_BG))
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

  const closeDrawer = useCallback(() => setSelectedSlotId(null), [])
  const closeComp = useCallback(() => setComp(null), [])

  if (!config) {
    return (
      <Panel title="Upcoming sessions">
        {loadError
          ? <StateView kind="error" title="The coaching calendar could not be loaded" onRetry={load}>{loadError}</StateView>
          : <Skeleton rows={4} />}
      </Panel>
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
    if (s.date !== e.date) { setStatus({ tone: 'warning', text: 'Keep a one-off window within a single day.' }); return }
    if (await addOneoff({ date: s.date, start: s.time, end: e.time })) setStatus({ tone: 'ok', text: `Opened ${s.date} ${s.time}–${e.time} for booking.` })
    calRef.current?.getApi().unselect()
  }

  // Append to the LATEST saved config so weekly-window edits made in the
  // availability editor are never overwritten by this screen's copy.
  async function addOneoff(window) {
    try {
      const latest = (await adminFetch('/admin/availability')).config || config
      const r = await adminSend('/admin/availability', 'PUT', { config: { ...latest, oneoffs: [...(latest.oneoffs || []), window] } })
      setConfig(r.config)
      return true
    } catch (err) {
      setStatus({ tone: 'danger', text: `Save failed: ${err.message}` })
      return false
    }
  }

  async function action(body, okMsg, { keepOpen = false } = {}) {
    setStatus({ tone: 'info', text: 'Working…' })
    try {
      await adminSend('/admin/booking', 'POST', body)
      setStatus({ tone: 'ok', text: okMsg })
      if (!keepOpen) {
        setSelectedSlotId(null)
        setComp(null)
      }
      await load()
      return true
    } catch (err) { setStatus({ tone: 'danger', text: `Failed: ${err.message}` }) }
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
    try { setWebcal(await adminFetch('/admin/calendar-url')) }
    catch (err) { setStatus({ tone: 'danger', text: `Calendar feed link failed: ${err.message}` }) }
  }

  return (
    <>
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}

      <Panel
        title="Upcoming sessions"
        description={<>Confirmed sessions, shown in <strong className="ax-strong">{tz}</strong>.</>}
        bodyClassName="is-flush"
        actions={<button type="button" className="ax-btn ax-btn--sm" onClick={load}><Icon name="refresh" /> Refresh</button>}
      >
        {activeHolds.length > 0 && (
          <div style={{ padding: '12px 20px 0' }}>
            <Notice tone="warning">
              {activeHolds.length} checkout {activeHolds.length === 1 ? 'hold is' : 'holds are'} waiting for payment. {activeHolds.length === 1 ? 'It is' : 'They are'} not an appointment yet.
            </Notice>
          </div>
        )}
        {upcoming.length === 0 ? (
          <StateView kind="empty" title="No confirmed upcoming sessions">New bookings appear here as soon as payment confirms.</StateView>
        ) : (
          <div role="list" aria-label="Upcoming coaching sessions">
            {upcoming.map((b) => (
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
        )}
      </Panel>

      <Panel
        title="Calendar"
        description="Drag across an empty time to open a one-off bookable window. Select a booking to manage it."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--sm" onClick={() => { loadOpenSlots(); setComp({ slotId: '', name: '', email: '' }) }}>Comp a session</button>
            <button type="button" className="ax-btn ax-btn--sm" onClick={showWebcal}>Calendar feed for your phone</button>
          </>
        }
      >
        {webcal?.url && (
          <Notice tone="info" title="Calendar feed" onDismiss={() => setWebcal(null)}>
            Add this link to Apple or Google Calendar once and every booking appears automatically: <a className="ax-link" href={webcal.url}>{webcal.url}</a>
          </Notice>
        )}
        <div className="ax-legend" style={{ marginBottom: 12 }}>
          <span><i style={{ background: OPEN_BG, border: '1px solid rgba(79,174,124,.5)' }} /> Open for booking</span>
          <span><i style={{ background: STATUS_COLOR.confirmed }} /> Confirmed</span>
          <span><i style={{ background: STATUS_COLOR.comped }} /> Comped</span>
          <span><i style={{ background: STATUS_COLOR.held }} /> Checkout hold</span>
          <span><i style={{ background: STATUS_COLOR.completed }} /> Completed</span>
          <span><i style={{ background: TIMEOFF_BG, border: '1px solid rgba(239,122,112,.5)' }} /> Time off</span>
        </div>
        <div className="ax-calendar">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={narrow ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: narrow ? 'timeGridDay,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay' }}
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
      </Panel>

      {comp && (
        <Drawer
          title="Comp a session"
          subtitle="Creates a free, confirmed booking and emails the customer."
          onClose={closeComp}
          footer={
            <button type="button" className="ax-btn ax-btn--primary" disabled={!comp.slotId || !comp.name || !comp.email}
              onClick={() => action({ action: 'comp', slotId: comp.slotId, name: comp.name, email: comp.email }, 'Comped. The customer was emailed.')}>
              Create comped booking
            </button>
          }
        >
          <div className="ax-form-stack">
            <Field label="Open slot">
              <select className="ax-select" value={comp.slotId} onChange={(e) => setComp({ ...comp, slotId: e.target.value })}>
                <option value="">Pick an open slot</option>
                {openSlots.map((s) => <option key={s} value={s}>{fmtInTz(s, SLOT_FMT)}</option>)}
              </select>
            </Field>
            <Field label="Customer name"><input className="ax-input" value={comp.name} onChange={(e) => setComp({ ...comp, name: e.target.value })} /></Field>
            <Field label="Customer email"><input className="ax-input" type="email" value={comp.email} onChange={(e) => setComp({ ...comp, email: e.target.value })} /></Field>
          </div>
        </Drawer>
      )}

      {selected && (
        <BookingDrawer
          key={selected.slotId}
          booking={selected}
          tz={tz}
          openSlots={openSlots}
          loadOpenSlots={loadOpenSlots}
          fmtInTz={fmtInTz}
          nowMs={nowMs}
          onClose={closeDrawer}
          onAction={action}
          sendingCheckin={sendingCheckinSlotId === selected.slotId}
          onCheckin={() => sendCheckin(selected)}
        />
      )}
    </>
  )
}

function AppointmentRow({ booking: b, fmtInTz, nowMs, sending, onManage, onCheckin }) {
  const lastCheckinMs = Date.parse(b.lastCheckinAt || '')
  const coolingDown = Number.isFinite(lastCheckinMs) && nowMs - lastCheckinMs < 5 * 60000
  const identity = b.customer?.name || b.customer?.email || 'Customer'

  return (
    <article className="ax-appt" role="listitem">
      <div>
        <p className="ax-appt__date">{fmtInTz(b.start, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <p className="ax-appt__time">{fmtInTz(b.start, { hour: 'numeric', minute: '2-digit' })}</p>
        <p className="ax-muted" style={{ fontSize: '0.75rem' }}>in {timeUntil(b.start, nowMs)}</p>
      </div>
      <div className="ax-person">
        <span className="ax-person__name">{identity}</span>
        <span className="ax-person__email">{b.customer?.email || 'No email recorded'}</span>
        {b.customer?.discord && <span className="ax-person__email">Discord: {b.customer.discord}</span>}
      </div>
      <div>
        <p className="ax-strong" style={{ fontSize: '0.8125rem' }}>{b.sessionType || 'Coaching session'}</p>
        <p className="ax-muted" style={{ fontSize: '0.78rem' }}>{bookingStatusLabel(b, nowMs)}</p>
        {b.lastCheckinAt && <p className="ax-muted" style={{ fontSize: '0.75rem' }}>Check-in sent {fmtInTz(b.lastCheckinAt, { hour: 'numeric', minute: '2-digit' })}</p>}
      </div>
      <div className="ax-appt__actions">
        <button type="button" className="ax-btn ax-btn--sm" onClick={onManage}>Manage</button>
        <button type="button" className="ax-btn ax-btn--sm ax-btn--primary" onClick={onCheckin} disabled={sending || coolingDown || !b.customer?.email}>
          {sending ? 'Sending…' : coolingDown ? 'Check-in sent' : 'Send check-in'}
        </button>
      </div>
    </article>
  )
}

function bg(start, end, color) {
  return { start, end, display: 'background', backgroundColor: color, groupId: 'availability' }
}

function BookingDrawer({ booking: b, tz, openSlots, loadOpenSlots, fmtInTz, nowMs, onClose, onAction, sendingCheckin, onCheckin }) {
  const [notes, setNotes] = useState(b.notes || '')
  const [newSlot, setNewSlot] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const src = b.referral_source || 'direct'
  const isHold = b.status === 'held'
  const activeHold = isActiveCheckoutHold(b, nowMs)
  const identity = b.customer?.name || b.customer?.email
  const paymentText = isHold ? 'Not paid' : (b.payment?.status || (b.status === 'comped' ? 'Comped' : null))

  const footer = isHold ? null : rescheduling ? (
    <>
      <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" disabled={!newSlot}
        onClick={() => onAction({ action: 'reschedule', slotId: b.slotId, newSlotId: newSlot }, 'Rescheduled. The customer was emailed.')}>Confirm move</button>
      <button type="button" className="ax-btn ax-btn--sm" onClick={() => setRescheduling(false)}>Back</button>
    </>
  ) : (
    <>
      <button type="button" className="ax-btn ax-btn--sm" onClick={() => { loadOpenSlots(); setRescheduling(true) }}>Reschedule</button>
      <button type="button" className="ax-btn ax-btn--sm" onClick={() => onAction({ action: 'complete', slotId: b.slotId }, 'Marked complete.')}>Mark complete</button>
      <button type="button" className="ax-btn ax-btn--sm ax-btn--danger"
        onClick={() => { if (window.confirm('Cancel this booking and free the slot? The customer is emailed.')) onAction({ action: 'cancel', slotId: b.slotId }, 'Cancelled. The slot is free and the customer was emailed.') }}>Cancel booking</button>
    </>
  )

  return (
    <Drawer title={identity || (isHold ? 'Checkout hold' : 'Booking')} subtitle={`${fmtInTz(b.start, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} (${tz})`} onClose={onClose} footer={footer}>
      {isHold && (
        <Notice tone="warning">
          {activeHold
            ? <>Expires {fmtInTz(b.heldUntil, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}. This is not a session unless checkout finishes.</>
            : <>This checkout hold expired and is not a session.</>}
        </Notice>
      )}
      <KeyValues items={[
        { label: 'Status', value: <Badge tone={isHold ? 'warning' : b.status === 'completed' ? 'muted' : 'ok'}>{bookingStatusLabel(b, nowMs)}</Badge> },
        { label: 'Session type', value: b.sessionType || 'Not selected yet' },
        { label: 'Payment', value: paymentText, hint: b.payment?.stripe_id ? <a className="ax-link" href={`https://dashboard.stripe.com/payments/${b.payment.stripe_id}`} target="_blank" rel="noopener noreferrer">Open payment in Stripe <Icon name="external" size={12} /></a> : null },
        { label: 'Came from', value: <Badge tone={src === 'direct' ? 'muted' : 'ok'}>{src}</Badge> },
        { label: 'Customer', value: identity || 'Identity not entered yet', hint: !identity && isHold ? 'The visitor picked this time but has not submitted the booking form.' : null },
        b.customer?.email && b.customer.email !== identity ? { label: 'Email', value: b.customer.email } : null,
        b.customer?.discord ? { label: 'Discord', value: b.customer.discord } : null,
        b.customer?.rank_goal ? { label: 'Rank goal', value: b.customer.rank_goal } : null,
        b.customer?.notes ? { label: 'Customer note', value: `“${b.customer.notes}”` } : null,
        { label: 'Reference', value: <span className="ax-mono">{b.slotId}</span> },
      ]} />

      <hr className="ax-divider" />
      <div className="ax-form-stack">
        <Field label="Private notes" hint="Only admins see these.">
          <textarea className="ax-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="ax-btn-row">
          <button type="button" className="ax-btn ax-btn--sm" onClick={() => onAction({ action: 'notes', slotId: b.slotId, notes }, 'Notes saved.', { keepOpen: true })}>Save notes</button>
          {!isHold && b.customer?.email && (
            <button type="button" className="ax-btn ax-btn--sm ax-btn--primary" disabled={sendingCheckin} onClick={onCheckin}>
              {sendingCheckin ? 'Sending check-in…' : 'Send “Are you online?” check-in'}
            </button>
          )}
        </div>
        {isHold && <p className="ax-help">Session controls stay locked until payment confirms the booking. An unfinished hold releases automatically.</p>}
        {!isHold && rescheduling && (
          <Field label="Move to open slot">
            <select className="ax-select" value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
              <option value="">Pick a new slot</option>
              {openSlots.map((s) => <option key={s} value={s}>{fmtInTz(s, SLOT_FMT)}</option>)}
            </select>
          </Field>
        )}
      </div>
    </Drawer>
  )
}
