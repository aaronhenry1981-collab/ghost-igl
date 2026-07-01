import { useEffect } from 'react'

const SHORTCUTS = [
  { keys: ['/'], desc: 'Focus the strat search' },
  { keys: ['A'], desc: 'Switch to Attack side' },
  { keys: ['D'], desc: 'Switch to Defense side' },
  { keys: ['1', '2', '3', '4'], desc: 'Jump to the Nth bomb site' },
  { keys: ['B'], desc: 'Toggle Quick Brief mode' },
  { keys: ['S'], desc: 'Share / copy link to this strat' },
  { keys: ['Esc'], desc: 'Go back one level' },
  { keys: ['?'], desc: 'Show this cheat sheet' },
]

export default function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
        <button onClick={onClose} className="shortcuts-close" aria-label="Close">×</button>
        <h2>Keyboard shortcuts</h2>
        <p className="shortcuts-sub">Power through strat lookup without touching the mouse.</p>
        <div className="shortcuts-list">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="shortcuts-row">
              <div className="shortcuts-keys">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="shortcuts-sep">/</span>}
                    <kbd>{k}</kbd>
                  </span>
                ))}
              </div>
              <div className="shortcuts-desc">{s.desc}</div>
            </div>
          ))}
        </div>
        <p className="shortcuts-hint">
          Shortcuts work on <strong>/strats</strong> (except <kbd>/</kbd> which focuses search on the map list).
        </p>
      </div>
    </div>
  )
}
