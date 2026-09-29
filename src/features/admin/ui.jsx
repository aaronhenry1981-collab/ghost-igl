import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Admin design-system primitives. Styles live in admin.css (ax-*).

export function PageHeader({ eyebrow, title, description, actions, crumbs, meta, docTitle }) {
  const tabTitle = docTitle || (typeof title === 'string' ? title : '')
  useEffect(() => {
    document.title = tabTitle ? `${tabTitle} · Recon 6 Admin` : 'Recon 6 Admin'
  }, [tabTitle])
  return (
    <header className="ax-page-header">
      <div className="ax-page-header__text">
        {crumbs?.length > 0 && (
          <nav className="ax-crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c) => (
                <li key={c.label}>{c.to ? <Link to={c.to} state={c.state}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="ax-eyebrow">{eyebrow}</p>}
        <h1 className="ax-page-title">{title}</h1>
        {description && <p className="ax-page-desc">{description}</p>}
        {meta && <div className="ax-page-meta">{meta}</div>}
      </div>
      {actions && <div className="ax-page-actions">{actions}</div>}
    </header>
  )
}

export function Panel({ title, description, actions, children, id, tone, className = '', bodyClassName = '' }) {
  const headingId = useId()
  return (
    <section className={`ax-panel${tone ? ` ax-panel--${tone}` : ''} ${className}`.trim()} id={id} aria-labelledby={title ? headingId : undefined}>
      {(title || actions) && (
        <div className="ax-panel__head">
          <div className="ax-panel__titles">
            {title && <h2 id={headingId} className="ax-panel__title">{title}</h2>}
            {description && <p className="ax-panel__desc">{description}</p>}
          </div>
          {actions && <div className="ax-panel__actions">{actions}</div>}
        </div>
      )}
      <div className={`ax-panel__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  )
}

/** Loading / error / empty placeholder with an optional retry. */
export function StateView({ kind = 'loading', title, children, onRetry, compact = false }) {
  const role = kind === 'error' ? 'alert' : 'status'
  return (
    <div className={`ax-state ax-state--${kind}${compact ? ' ax-state--compact' : ''}`} role={role}>
      {kind === 'loading' && <span className="ax-spinner" aria-hidden="true" />}
      <div>
        {title && <p className="ax-state__title">{title}</p>}
        {children && <div className="ax-state__body">{children}</div>}
        {onRetry && <button type="button" className="ax-btn ax-btn--sm" onClick={onRetry}>Try again</button>}
      </div>
    </div>
  )
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="ax-skeleton" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <span key={i} style={{ width: `${92 - (i % 3) * 14}%` }} />)}
    </div>
  )
}

export function Notice({ tone = 'info', title, children, onDismiss, actions }) {
  return (
    <div className={`ax-notice ax-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className="ax-notice__text">
        {title && <strong>{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {actions}
      {onDismiss && <button type="button" className="ax-icon-btn" aria-label="Dismiss" onClick={onDismiss}><Icon name="close" /></button>}
    </div>
  )
}

export function Badge({ tone = 'muted', children, title }) {
  return <span className={`ax-badge ax-badge--${tone}`} title={title}>{children}</span>
}

export function KeyValues({ items, columns = 1 }) {
  return (
    <dl className={`ax-kv${columns > 1 ? ' ax-kv--cols' : ''}`}>
      {items.filter(Boolean).map((it) => (
        <div key={it.label} className="ax-kv__row">
          <dt>{it.label}</dt>
          <dd>{it.value ?? <span className="ax-muted">—</span>}{it.hint && <small>{it.hint}</small>}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Pagination({ page, pages, from, to, total, pageSize, sizes, onPage, onSize, label = 'members' }) {
  return (
    <div className="ax-pagination">
      <p className="ax-pagination__range" aria-live="polite">{total ? `${from}–${to} of ${total} ${label}` : `0 ${label}`}</p>
      <div className="ax-pagination__controls">
        {sizes && onSize && (
          <label className="ax-inline-field">
            <span>Rows</span>
            <select className="ax-select ax-select--sm" value={pageSize} onChange={(e) => onSize(Number(e.target.value))}>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
        <button type="button" className="ax-btn ax-btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevron-left" /> Previous
        </button>
        <span className="ax-pagination__page">Page {page} of {pages}</span>
        <button type="button" className="ax-btn ax-btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  )
}

export function CopyButton({ value, label = 'Copy', copiedLabel = 'Copied', className = 'ax-btn ax-btn--sm ax-btn--ghost' }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return undefined
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])
  return (
    <button type="button" className={className} onClick={() => { navigator.clipboard?.writeText(value).then(() => setCopied(true)).catch(() => {}) }}>
      <Icon name={copied ? 'check' : 'copy'} /> {copied ? copiedLabel : label}
    </button>
  )
}

/** Right-hand sheet for record details and forms. Esc and the backdrop close it. */
export function Drawer({ title, subtitle, onClose, children, footer }) {
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    ref.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [onClose])
  return (
    <div className="ax-drawer-layer">
      <button type="button" className="ax-drawer-backdrop" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className="ax-drawer" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="ax-drawer__head">
          <div>
            <h2 className="ax-drawer__title">{title}</h2>
            {subtitle && <p className="ax-drawer__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="ax-icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="ax-drawer__body">{children}</div>
        {footer && <div className="ax-drawer__foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`ax-field ${className}`.trim()}>
      <span className="ax-field__label">{label}</span>
      {children}
      {hint && !error && <small className="ax-field__hint">{hint}</small>}
      {error && <small className="ax-field__error">{error}</small>}
    </label>
  )
}

const ICONS = {
  overview: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  members: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  coaching: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  crm: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l2 2 3-3',
  support: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5',
  growth: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  content: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6',
  system: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM9 12l2 2 4-4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6L6 18M6 6l12 12',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  check: 'M20 6L9 17l-5-5',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  site: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
}

export function Icon({ name, size = 16 }) {
  const d = ICONS[name]
  if (!d) return null
  return (
    <svg className="ax-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}
