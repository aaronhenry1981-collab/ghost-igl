import { useEffect, useId, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Modal dialog with a real focus trap: focus moves in on open, Tab/Shift+Tab
// cycle inside, Escape closes, and focus returns to the opener on close.
export function Dialog({ open, title, onClose, children, footer = null, wide = false }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()

  // Keep the latest onClose without re-running the trap (which would steal
  // focus back to the first field on every parent render).
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const node = ref.current
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE)
    first?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current?.(); return }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!items.length) { e.preventDefault(); return }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="sp-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div ref={ref} className={`sp-dialog${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="sp-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="sp-icon-btn" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="sp-dialog-body">{children}</div>
        {footer && <footer className="sp-dialog-foot">{footer}</footer>}
      </div>
    </div>
  )
}
