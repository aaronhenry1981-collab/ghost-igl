import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAdminData } from './AdminData'
import { attentionItems } from './memberDirectory.mjs'
import { Icon } from './ui'
import './admin.css'

// Persistent admin frame: top bar (monogram, signed-in admin, back to the
// public site), grouped sidebar navigation on desktop, the same navigation
// in an off-canvas drawer on tablet and phone, and one centered content
// container every admin screen renders into.
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { id: 'overview', label: 'Overview', path: '', icon: 'overview' },
      { id: 'members', label: 'Members', path: '/members', icon: 'members' },
      { id: 'coaching', label: 'Coaching', path: '/coaching', icon: 'coaching' },
    ],
  },
  {
    label: 'Customer success',
    items: [
      { id: 'crm', label: 'Customer success', path: '/crm', icon: 'crm' },
      { id: 'support', label: 'Support', path: '/crm/support', icon: 'support' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'growth', label: 'Growth', path: '/growth', icon: 'growth' },
      { id: 'content', label: 'Site content', path: '/content', icon: 'content' },
    ],
  },
  {
    label: 'Administration',
    items: [{ id: 'system', label: 'System', path: '/system', icon: 'system' }],
  },
]

function activeSection(base, pathname) {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname
  if (rest.startsWith('/crm/support')) return 'support'
  if (rest.startsWith('/crm')) return 'crm'
  const first = rest.split('/').filter(Boolean)[0]
  return first || 'overview'
}

export default function AdminShell({ children }) {
  const { base, viewer, preview, users, status } = useAdminData()
  const location = useLocation()
  const current = activeSection(base, location.pathname)
  const [navOpen, setNavOpen] = useState(false)
  const drawerRef = useRef(null)
  const menuRef = useRef(null)

  const attention = useMemo(() => attentionItems(users), [users])
  const memberAlerts = attention.reduce((n, a) => n + a.count, 0)
  const memberAlertTone = attention.some((a) => a.tone === 'danger' && a.count > 0) ? 'danger' : 'warning'

  // Close the drawer on navigation.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (navOpen) setNavOpen(false)
  }

  useEffect(() => {
    if (!navOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.querySelector('a')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false)
        menuRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  const nav = (
    <nav className="ax-nav" aria-label="Admin sections">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="ax-nav__group">
          <p className="ax-nav__label">{group.label}</p>
          <ul>
            {group.items.map((item) => {
              const isCurrent = current === item.id
              return (
                <li key={item.id}>
                  <NavLink
                    to={`${base}${item.path}`}
                    end={item.path === ''}
                    className={() => `ax-nav__link${isCurrent ? ' is-active' : ''}`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    <Icon name={item.icon} />
                    <span className="ax-nav__text">{item.label}</span>
                    {item.id === 'members' && status !== 'loading' && memberAlerts > 0 && (
                      <span className={`ax-nav__count ax-nav__count--${memberAlertTone}`} title={`${memberAlerts} member billing item${memberAlerts === 1 ? '' : 's'} need attention`}>{memberAlerts}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="ax">
      <a className="ax-skip" href="#ax-main">Skip to content</a>
      <header className="ax-topbar">
        <div className="ax-topbar__start">
          <button
            ref={menuRef}
            type="button"
            className="ax-icon-btn ax-topbar__menu"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            aria-controls="ax-drawer-nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            <Icon name={navOpen ? 'close' : 'menu'} size={20} />
          </button>
          <Link to={base} className="ax-brand" aria-label="Recon 6 admin overview">
            <img src="/logo-mark.svg" alt="" className="ax-brand__mark" width="44" height="22" />
            <img src="/logo-wordmark.svg" alt="Recon 6" className="ax-brand__word" width="92" height="13" />
            <span className="ax-brand__divider" aria-hidden="true" />
            <span className="ax-brand__area">Admin</span>
          </Link>
          {preview && <span className="ax-env" title="Fictional preview data"><span className="ax-env__long">Fictional preview data</span><span className="ax-env__short">Fictional data</span></span>}
        </div>
        <div className="ax-topbar__end">
          <a href="/" className="ax-btn ax-btn--ghost ax-btn--sm ax-topbar__site"><Icon name="site" /> <span>View site</span></a>
          {viewer?.email && (
            <span className="ax-viewer" title={`Signed in as ${viewer.email}`}>
              <span className="ax-viewer__avatar" aria-hidden="true">{viewer.email.slice(0, 1).toUpperCase()}</span>
              <span className="ax-viewer__email">{viewer.email}</span>
            </span>
          )}
        </div>
      </header>

      <div className="ax-frame">
        <aside className="ax-sidebar">{nav}</aside>
        <div
          id="ax-drawer-nav"
          className={`ax-navdrawer${navOpen ? ' is-open' : ''}`}
          ref={drawerRef}
          hidden={!navOpen}
        >
          <button type="button" className="ax-navdrawer__scrim" aria-label="Close navigation" tabIndex={-1} onClick={() => setNavOpen(false)} />
          <div className="ax-navdrawer__panel">{nav}</div>
        </div>
        <main id="ax-main" className="ax-main" tabIndex={-1}>
          <div className="ax-container">{children}</div>
        </main>
      </div>
    </div>
  )
}
