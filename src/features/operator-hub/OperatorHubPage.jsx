import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { API_URL, getIdToken, getSession } from '../../lib/cognito'
import { analyticsStarted } from '../../lib/analyticsScope.mjs'
import {
  fetchOperatorHub, filterOperators, formatCheckedDate, HUB_PATH, hubAuthHref, hubPathFor, operatorRecommendations,
} from './operatorHub.mjs'
import './OperatorHubPage.css'

const SIDES = [['all', 'All'], ['attack', 'Attack'], ['defense', 'Defense']]
const sideLabel = (side) => side === 'attack' ? 'Attack' : 'Defense'
const sitePath = (site) => `/strats/${site.mapId}/${site.siteId}/${site.side}`
const iconLetters = (name) => {
  const words = name.trim().split(/\s+/)
  return words.length > 1 ? words.slice(0, 2).map(word => word[0]).join('') : name.slice(0, 2)
}

function Header({ scope }) {
  return (
    <header className="oh-header">
      <div>
        <p className="oh-eyebrow">Recon 6 / Member playbook</p>
        <h1>Operator Hub</h1>
        <p className="oh-intro">Find your pick. Know what job it does and what to do first.</p>
      </div>
      {scope && <a className="oh-patch" href={scope.patchUrl}>
        <strong>{scope.patch}</strong>
        <span>Roster checked <time dateTime={scope.verifiedOn}>{formatCheckedDate(scope.verifiedOn)}</time></span>
      </a>}
    </header>
  )
}

function SignInPanel({ slug, code, onSignIn }) {
  return (
    <section className="oh-state">
      <h2>{code === 'verify' ? 'Verify your email to open the hub' : 'Sign in to open the hub'}</h2>
      <p>{code === 'verify'
        ? 'Use the verification email for your Recon 6 account, then sign in again.'
        : 'Operator Hub is available to members with a free or paid Recon 6 account.'}</p>
      <div className="oh-actions">
        <Link className="oh-primary" to={hubAuthHref(slug)} onClick={onSignIn}>Sign in</Link>
        {code !== 'verify' && <Link className="oh-secondary" to={hubAuthHref(slug, true)}>Create a free account</Link>}
      </div>
    </section>
  )
}

function Status({ children }) {
  return <div role="status" className="oh-state oh-muted">{children}</div>
}

function OperatorMark({ operator }) {
  return <span className="oh-mark" data-side={operator.side} aria-hidden="true">{iconLetters(operator.name).toUpperCase()}</span>
}

function Roster({ operators, query, setQuery, side, setSide }) {
  const filtered = useMemo(() => filterOperators(operators, side, query), [operators, side, query])
  const counts = useMemo(() => ({
    all: operators.length,
    attack: operators.filter((item) => item.side === 'attack').length,
    defense: operators.filter((item) => item.side === 'defense').length,
  }), [operators])
  const heading = useRef(null)
  useHubHeading(heading)
  return (
    <>
      <h2 className="oh-section-title" tabIndex={-1} ref={heading}>Operator roster</h2>
      <div className="oh-controls">
        <label className="oh-search">
          <span>Search operators</span>
          <input type="search" placeholder="Name, role or gadget" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="oh-filters" role="group" aria-label="Filter by side">
          {SIDES.map(([value, label]) => <button
            key={value} type="button" aria-pressed={side === value} onClick={() => setSide(value)}
          >{label} <span>{counts[value]}</span></button>)}
        </div>
      </div>
      <p className="oh-result-count" role="status">{filtered.length} of {counts.all} operators</p>
      {filtered.length ? (
        <ul className="oh-grid">
          {filtered.map((op) => <li key={op.slug}>
            <Link className="oh-roster-card" data-side={op.side} to={hubPathFor(op.slug)}>
              <OperatorMark operator={op} />
              <span className="oh-card-copy">
                <strong>{op.name}</strong>
                <span>{op.role}</span>
                <small>{sideLabel(op.side)}</small>
              </span>
              <span className="oh-card-arrow" aria-hidden="true">›</span>
            </Link>
          </li>)}
        </ul>
      ) : <div className="oh-state">
        <h3>No operators match</h3>
        <p>Try another name, choose All, or clear both filters.</p>
        <button className="oh-secondary" type="button" onClick={() => { setQuery(''); setSide('all') }}>Clear filters</button>
      </div>}
    </>
  )
}

function useHubHeading(ref) {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [ref])
}

const LOADOUT_FIELDS = [
  ['primary', 'Primary'], ['secondary', 'Secondary'], ['gadget', 'Unique gadget'],
  ['secondaryGadget', 'Secondary gadget'],
]

function Loadout({ operator, setupFit }) {
  const { loadout } = operator
  return <section className="oh-box">
    <h3>Recommended loadout</h3>
    {!loadout ? <p className="oh-explanation"><strong>Setup approach</strong>{setupFit}</p> : <>
      <p className="oh-muted">Recon 6 setup, not an official recommendation. Check the in-game equipment screen before a match.</p>
      <dl className="oh-kit">
        {LOADOUT_FIELDS.filter(([key]) => loadout[key]).map(([key, label]) => (
          <div key={key}><dt>{label}</dt><dd>{loadout[key]}</dd></div>
        ))}
      </dl>
      <p className="oh-explanation"><strong>Why this setup</strong>{loadout.rationale}</p>
      {loadout.alternates?.length > 0 && <p className="oh-explanation">
        <strong>Alternates</strong>{loadout.alternates.join(' · ')}
      </p>}
    </>}
    <a className="oh-text-link" href={operator.officialUrl}>Ubisoft operator profile <span aria-hidden="true">↗</span></a>
  </section>
}

function OperatorDetail({ operator }) {
  const { siteFit, setupFit } = operatorRecommendations(operator)
  const heading = useRef(null)
  useHubHeading(heading)
  return (
    <div className="oh-detail">
      <Link to={HUB_PATH} className="oh-back">← All operators</Link>
      <div className="oh-profile">
        <OperatorMark operator={operator} />
        <div><p className="oh-eyebrow">{sideLabel(operator.side)} / {operator.role}</p>
          <h2 tabIndex={-1} ref={heading}>{operator.name}</h2>
          <p>{operator.gadget}</p>
        </div>
      </div>
      <div className="oh-detail-grid">
        <section className="oh-box">
          <h3>How to play</h3>
          {!siteFit && <p className="oh-explanation"><strong>When to pick</strong>{operator.when}</p>}
          <p className="oh-explanation"><strong>What to do first</strong>{operator.how}</p>
          {operator.teamFit && <p className="oh-explanation"><strong>Team fit</strong>{operator.teamFit}</p>}
          {operator.counterplay && <p className="oh-explanation"><strong>Watch for</strong>{operator.counterplay}</p>}
        </section>
        <Loadout operator={operator} setupFit={setupFit} />
        <section className="oh-box oh-sites">
          <h3>Recommended maps &amp; sites</h3>
          {operator.sites.length ? <>
            <p className="oh-muted">Examples from existing Recon 6 site plans on the checked Ranked rotation. They describe the operator’s job in the plan, not win rates or a fresh playtest.</p>
            <ul className="oh-site-list">{operator.sites.map((site) => (
              <li key={`${site.mapId}/${site.siteId}`}>
                <a href={sitePath(site)}>
                  <span><strong>{site.mapName}</strong><span>{site.siteName}</span></span>
                  <span className="oh-site-fit"><strong>{site.priority === 'essential' ? 'Core pick' : 'Plan recommendation'}</strong><span>{site.role} · {sideLabel(site.side)}</span></span>
                </a>
              </li>
            ))}</ul>
          </> : <p className="oh-explanation"><strong>Site fit</strong>{siteFit}</p>}
        </section>
      </div>
    </div>
  )
}

function MemberOperatorHub({ user, slug, signOut }) {
  const [result, setResult] = useState(null)
  const [failed, setFailed] = useState(null)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [side, setSide] = useState('all')
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    // Discard an in-flight or displayed response before a history snapshot.
    // Reload on persisted restoration and on Cognito changes from another tab.
    function onHide() {
      controller.abort()
      flushSync(() => setResult(null))
    }
    function onShow(event) {
      if (event.persisted) window.location.reload()
    }
    function onStorage(event) {
      if (event.key === null || (event.key.startsWith('CognitoIdentityServiceProvider.') &&
        (event.key.endsWith('.LastAuthUser') || Boolean(event.oldValue && !event.newValue)))) {
        onHide()
        window.location.reload()
      }
    }
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    window.addEventListener('storage', onStorage)
    ;(async () => {
      let session
      try { session = await getSession(user.cognitoUser) } catch { throw Object.assign(new Error(), { code: 'session' }) }
      if (signal.aborted) return
      if (session?.getIdToken()?.decodePayload()?.sub !== user.id) {
        throw Object.assign(new Error(), { code: 'session' })
      }
      const body = await fetchOperatorHub({ apiBase: API_URL, token: getIdToken(session), signal })
      if (!signal.aborted) setResult(body)
    })().catch((error) => {
      if (!signal.aborted) setFailed(error?.code || 'unavailable')
    })
    return () => {
      controller.abort()
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
      window.removeEventListener('storage', onStorage)
    }
  }, [user, retry])

  const operator = result?.operators.find((item) => item.slug === slug)
  return (
    <>
      <Header scope={result?.scope} />
      {failed === 'session' || failed === 'verify' ? <SignInPanel slug={slug} code={failed} onSignIn={signOut} />
        : failed ? <section className="oh-state">
          <h2>Couldn’t load the Operator Hub</h2>
          <p>Try again in a moment.</p>
          <button type="button" className="oh-primary" onClick={() => { setFailed(null); setRetry((n) => n + 1) }}>Try again</button>
        </section>
        : !result ? <Status>Loading the operator roster…</Status>
        : !slug ? <Roster operators={result.operators} query={query} setQuery={setQuery} side={side} setSide={setSide} />
        : operator ? <OperatorDetail key={operator.slug} operator={operator} />
        : <section className="oh-state">
          <h2>Operator not found</h2>
          <p>That operator isn’t listed under this link.</p>
          <Link className="oh-primary" to={HUB_PATH}>Open the roster</Link>
        </section>}
      {result && !failed && <p className="oh-footer-note">
        Recon 6 is independent of Ubisoft. <a href={result.scope.rosterUrl}>Official roster</a>
      </p>}
    </>
  )
}

export default function OperatorHubPage() {
  const { user, loading, signOut } = useAuth()
  const { slug } = useParams()
  const needsPrivateReload = analyticsStarted()
  useEffect(() => {
    if (needsPrivateReload) window.location.replace(hubPathFor(slug))
  }, [needsPrivateReload, slug])
  const signedIn = user?.id && !loading
  return <div className="oh-page">
    {loading || needsPrivateReload ? <><Header /><Status>Checking your session…</Status></>
      : signedIn ? <MemberOperatorHub key={user.id} user={user} slug={slug} signOut={signOut} />
      : <><Header /><SignInPanel slug={slug} /></>}
  </div>
}
