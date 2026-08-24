import { useState } from 'react'
import { OP_ROSTER } from '../data/op-roster'
import { saveRoster } from '../utils/squadRosterStorage'
import './SquadRoster.css'

// Your saved teammates. Add someone once, tick what they actually play, and from
// then on they are a name in a dropdown instead of a gamertag you retype every
// session — and their picks come from their real pool rather than "best still
// open", which is all we could offer for anyone who was not Jackson.
//
// Stored per-device. Gamertags are public in every lobby, but they are still
// other people's handles, so nothing here leaves the browser and nothing is
// collected for anyone you have not deliberately added.

export default function SquadRoster({ roster, setRoster, onClose }) {
  const [adding, setAdding] = useState('')
  const [editing, setEditing] = useState(null)
  const [side, setSide] = useState('defense')

  const add = () => {
    const name = adding.trim()
    if (!name) return
    if (roster.some((p) => p.name.toLowerCase() === name.toLowerCase())) { setAdding(''); return }
    setRoster((prev) => {
      const next = [...prev, { name, attack: [], defense: [] }]
      saveRoster(next)
      return next
    })
    setAdding(''); setEditing(name)
  }
  const remove = (name) => {
    setRoster((prev) => {
      const next = prev.filter((p) => p.name !== name)
      saveRoster(next)
      return next
    })
    if (editing === name) setEditing(null)
  }
  // Functional update, not a closure over `roster`. Ticking three operators
  // quickly had all three reads see the same stale list, so only the last one
  // survived — a real bug for anyone who clicks faster than React re-renders.
  const toggleOp = (name, op) => {
    setRoster((prev) => {
      const next = prev.map((p) => {
        if (p.name !== name) return p
        const cur = p[side] || []
        return { ...p, [side]: cur.includes(op) ? cur.filter((o) => o !== op) : [...cur, op] }
      })
      saveRoster(next)
      return next
    })
  }

  const who = roster.find((p) => p.name === editing)

  return (
    <div className="sr">
      <div className="sr-head">
        <strong>Your squad</strong>
        <span>Add someone once. Tick what they play and their picks stop being guesses.</span>
        <button className="sr-close" onClick={onClose}>done</button>
      </div>

      <div className="sr-add">
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          placeholder="Gamertag — PSN, Xbox or Ubisoft"
          spellCheck={false}
          autoComplete="off"
        />
        <button onClick={add} disabled={!adding.trim()}>Add</button>
      </div>

      {roster.length === 0 ? (
        <p className="sr-empty">
          Nobody saved yet. Anyone you add here can be dropped into a seat, and if you tick their
          operators the setup assigns them something they actually own.
        </p>
      ) : (
        <ul className="sr-list">
          {roster.map((p) => (
            <li key={p.name} className={editing === p.name ? 'on' : ''}>
              <button className="sr-name" onClick={() => setEditing(editing === p.name ? null : p.name)}>
                {p.name}
                <span className="sr-count">
                  {p.attack.length || p.defense.length
                    ? `${p.attack.length} atk · ${p.defense.length} def`
                    : 'no operators set'}
                </span>
              </button>
              <button className="sr-del" onClick={() => remove(p.name)} title="remove">×</button>
            </li>
          ))}
        </ul>
      )}

      {who && (
        <div className="sr-ops">
          <div className="sr-ops-head">
            <span>What does <b>{who.name}</b> play?</span>
            <div className="sr-sides">
              <button className={side === 'attack' ? 'on' : ''} onClick={() => setSide('attack')}>Attack</button>
              <button className={side === 'defense' ? 'on' : ''} onClick={() => setSide('defense')}>Defense</button>
            </div>
          </div>
          <div className="sr-chips">
            {[...(OP_ROSTER[side] || [])].sort().map((op) => (
              <button
                key={op}
                className={`sr-chip${(who[side] || []).includes(op) ? ' on' : ''}`}
                onClick={() => toggleOp(who.name, op)}
              >{op}</button>
            ))}
          </div>
          <p className="sr-hint">
            Leave it empty and they still get a seat — just the best pick still open, marked as a
            guess. Tick even three or four and it becomes a real recommendation.
          </p>
        </div>
      )}
    </div>
  )
}
