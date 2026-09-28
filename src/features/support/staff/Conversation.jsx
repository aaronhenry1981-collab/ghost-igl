import { forwardRef, useId } from 'react'
import { detectSensitive, MESSAGE_MAX, sensitiveWarning, staffEventView, staffStatusLabel, teamLabel } from '../supportLogic.mjs'
import { Ago } from '../ui/bits'

const LABEL = {
  message_player: 'Player',
  email_in: 'Player (email)',
  message_staff: 'Public reply',
  note_private: 'Private note',
  status_change: 'Status',
  assignment: 'Assignment',
  escalation: 'Escalation',
  incident_link: 'Incident',
  csat: 'CSAT',
  attachment: 'Attachment',
  system: 'System',
  action_request: 'Action request',
}
const QUIET = new Set(['status_change', 'assignment', 'incident_link', 'system', 'escalation', 'csat', 'attachment', 'action_request'])

function eventText(e) {
  if (e.kind === 'status_change') return `${e.from ? `${staffStatusLabel(e.from)} → ` : ''}${staffStatusLabel(e.to)}${e.data?.rule ? ` (${String(e.data.rule).replace(/_/g, ' ')})` : ''}${e.text ? ` · ${e.text}` : ''}`
  if (e.kind === 'csat') return `Rating: ${String(e.rating)}${e.text ? ` · “${e.text}”` : ''}`
  if (e.kind === 'assignment') return e.data?.toAssignee ? `Assigned to ${e.data.toAssignee}` : e.data?.toTeam ? `Team: ${teamLabel(e.data.toTeam)}` : 'Unassigned'
  if (e.kind === 'incident_link') return 'Linked to an incident'
  if (e.kind === 'attachment') return `File: ${e.data?.name || 'attachment'}`
  if (e.kind === 'action_request') return `${String(e.actionKind || 'action').replace(/_/g, ' ')} · ${String(e.actionStatus || 'requested').replace(/_/g, ' ')}${e.reason ? ` · ${e.reason}` : ''}`
  if (e.kind === 'escalation' && e.team) return `To ${teamLabel(e.team)}${e.text ? `\n${e.text}` : ''}`
  return e.text
}

// Stored case events ({ eventId, kind, visibility, actor, body, data, at,
// visibleToPlayer }), oldest first. Staff-only events are marked.
export function StaffTimeline({ events = [] }) {
  const sorted = events.map(staffEventView).sort((a, b) => (Date.parse(a.at || '') || 0) - (Date.parse(b.at || '') || 0))
  return (
    <ol className="sc-tl">
      {sorted.map((e) => {
        const text = eventText(e)
        return (
          <li key={e.id} className={`sc-tl-item sc-tl-${e.kind}${QUIET.has(e.kind) ? ' is-quiet' : ''}`}>
            <div className="sc-tl-meta">
              <span className={`sc-tl-kind sc-tl-kind-${e.kind}`}>{e.kind === 'note_private' ? 'Private note · staff only' : LABEL[e.kind] || e.kind}</span>
              <span className="sp-muted sp-small sc-wrap">{e.author}</span>
              {!e.visibleToPlayer && e.kind !== 'note_private' && <span className="sc-staffonly">staff only</span>}
              <span className="sp-muted sp-small"><Ago at={e.at} fallback="" /></span>
            </div>
            {text && <p className="sc-tl-text">{text}</p>}
            {e.assignedFromUnmatched && <p className="sp-muted sp-small">Attached by hand from email review{e.data?.senderVerified === false ? ' · sender NOT verified' : ''}</p>}
          </li>
        )
      })}
    </ol>
  )
}

// Public reply vs private note: different colour, label, border and button
// text so nobody sends a note to a player by accident.
export const Composer = forwardRef(function Composer({ mode, onMode, text, onText, onSubmit, busy, disabledReason, canReply = true, canNote = true }, ref) {
  const ids = { text: useId(), hint: useId() }
  const isPrivate = mode === 'note' || !canReply
  const warn = !isPrivate ? sensitiveWarning(detectSensitive(text)) : null
  if (!canReply && !canNote) return <p className="sp-muted sp-small">Your role can read this case but not write to it.</p>
  return (
    <form className={`sc-composer${isPrivate ? ' is-private' : ' is-public'}`} onSubmit={(e) => { e.preventDefault(); onSubmit() }} noValidate>
      <fieldset className="sc-mode">
        <legend className="sp-visually-hidden">Message type</legend>
        {canReply && (
          <label className={`sc-mode-opt${!isPrivate ? ' is-on' : ''}`}>
            <input type="radio" className="sp-visually-hidden" name={`${ids.text}-mode`} checked={!isPrivate} onChange={() => onMode('reply')} />
            Reply to player
          </label>
        )}
        {canNote && (
          <label className={`sc-mode-opt sc-mode-private${isPrivate ? ' is-on' : ''}`}>
            <input type="radio" className="sp-visually-hidden" name={`${ids.text}-mode`} checked={isPrivate} onChange={() => onMode('note')} />
            Private note
          </label>
        )}
      </fieldset>
      <label htmlFor={ids.text} className="sp-visually-hidden">{isPrivate ? 'Private note (staff only)' : 'Public reply to the player'}</label>
      <p id={ids.hint} className={`sc-composer-hint${isPrivate ? ' is-private' : ''}`}>
        {isPrivate ? 'Staff only. Never shown to the player.' : 'The player sees this in their case timeline. Email replies are off.'}
      </p>
      <textarea ref={ref} id={ids.text} className="sp-textarea sc-composer-text" rows={5} maxLength={MESSAGE_MAX} value={text} onChange={(e) => onText(e.target.value)} aria-describedby={ids.hint} placeholder={isPrivate ? 'What the next person should know…' : 'Write the reply…'} />
      {warn && <p className="sp-note sp-note-danger" role="alert">{warn}</p>}
      <div className="sc-composer-actions">
        {disabledReason && <span className="sp-muted sp-small">{disabledReason}</span>}
        <button type="submit" className={isPrivate ? 'btn btn-ghost btn-sm sc-btn-private' : 'btn btn-primary btn-sm'} disabled={busy || !text.trim() || Boolean(disabledReason)}>
          {busy ? 'Saving…' : isPrivate ? 'Save private note' : 'Send reply to player'}
        </button>
      </div>
    </form>
  )
})
