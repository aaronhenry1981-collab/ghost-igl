import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bucketCounts, normalizeBuckets } from '../supportLogic.mjs'
import { HELP_SECTIONS } from '../helpText.mjs'
import { isNotEnabled } from '../supportApi'
import { HELP_CENTER_UI_ENABLED } from '../supportFlags'
import { useSupportResource } from '../useSupportResource'
import { SectionLabel, Skeleton } from '../ui/bits'
import GetHelp from './GetHelp'
import MySupport from './MySupport'
import CaseTimeline from './CaseTimeline'
import '../support.css'

const SUPPORT_EMAIL = 'support@r6coaching.com'

// /support and /support/cases/:caseNumber. `api` is the player's own client
// (null when the customer-success API is not configured on this deployment).
export default function SupportPage({ api, paths, signedIn, authLoading = false, caseNumber = null, initialText = '', initialTab = null, initialCategory = null, source = null, banner = null }) {
  if (authLoading) return <div className="sp"><Skeleton lines={4} label="Loading Player Command…" /></div>
  if (!signedIn) return <div className="sp">{banner}<SignedOutGate paths={paths} caseNumber={caseNumber} /></div>
  if (!api) return <div className="sp">{banner}<NotLive paths={paths} /></div>
  if (caseNumber) return <div className="sp">{banner}<CaseTimeline key={caseNumber} api={api} caseNumber={caseNumber} paths={paths} /></div>
  return <div className="sp">{banner}<Command api={api} paths={paths} initialText={initialText} initialTab={initialTab} initialCategory={initialCategory} source={source} /></div>
}

function Command({ api, paths, initialText, initialTab, initialCategory, source }) {
  const list = useSupportResource(api, 'listCases')
  const buckets = normalizeBuckets(list.data)
  const counts = bucketCounts(buckets)
  const [tabChoice, setTabChoice] = useState(initialTab)
  // Default to "Waiting on me" when something needs the player.
  const tab = tabChoice || (counts.waiting_on_me ? 'waiting_on_me' : 'open')

  if (list.status === 'error' && isNotEnabled(list.error)) return <NotLive paths={paths} />

  function jumpToWaiting() {
    setTabChoice('waiting_on_me')
    document.getElementById('sp-mysupport')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => document.getElementById('sp-buckets-tab-waiting_on_me')?.focus(), 350)
  }

  return (
    <>
      <header className="sp-hero">
        <p className="sp-eyebrow"><span className="sp-live-dot" aria-hidden="true" />Player Command · comms open</p>
        <h1 className="sp-h1">Tell us what broke. We run the checks.</h1>
        <p className="sp-sub">Recon already sees your plan, linked accounts and recent data, so you won&apos;t explain anything twice.</p>
        {counts.waiting_on_me > 0 && (
          <button type="button" className="sp-alert" onClick={jumpToWaiting}>
            <span className="sp-alert-count">{counts.waiting_on_me}</span>
            {counts.waiting_on_me === 1 ? 'case needs your reply' : 'cases need your reply'}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </header>

      <div className="sp-grid">
        <section className="sp-panel sp-panel-primary" aria-labelledby="sp-gethelp-label">
          <SectionLabel index="01" id="sp-gethelp-label">Get help</SectionLabel>
          <GetHelp api={api} paths={paths} initialText={initialText} initialCategory={initialCategory} source={source} onCreated={() => { setTabChoice('open'); list.reload() }} />
        </section>
        <section className="sp-panel" id="sp-mysupport" aria-labelledby="sp-mysupport-label">
          <SectionLabel index="02" id="sp-mysupport-label">My support</SectionLabel>
          <MySupport state={list} buckets={buckets} tab={tab} onTab={setTabChoice} paths={paths} />
        </section>
      </div>

      {HELP_CENTER_UI_ENABLED && (
        <nav className="sp-quickhelp" aria-label="Help Center shortcuts">
          <span className="sp-hud-label">Fix it yourself</span>
          <ul>
            {HELP_SECTIONS.map((s) => <li key={s.id}><Link to={paths.help({ section: s.id })}>{s.title}</Link></li>)}
          </ul>
        </nav>
      )}
    </>
  )
}

function SignedOutGate({ paths, caseNumber }) {
  const redirect = caseNumber ? `/support/cases/${caseNumber}` : '/support'
  return (
    <section className="sp-gate">
      <p className="sp-eyebrow"><span className="sp-live-dot is-off" aria-hidden="true" />Player Command</p>
      <h1 className="sp-h1">Sign in to open a case</h1>
      <p className="sp-sub">Signed in, Recon checks your plan, linked accounts and recent data for you, and every reply lands in one place.</p>
      <div className="sp-row">
        <Link to={paths.signIn(redirect)} className="btn btn-primary">Sign in</Link>
        {HELP_CENTER_UI_ENABLED
          ? <Link to={paths.help()} className="btn btn-ghost">Browse the Help Center</Link>
          : <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-ghost">Email support</a>}
      </div>
      <div className="sp-gate-help">
        {HELP_CENTER_UI_ENABLED && (
          <>
            <p className="sp-hud-label">Common fixes, no sign-in needed</p>
            <ul className="sp-gate-links">
              {HELP_SECTIONS.map((s) => (
                <li key={s.id}>
                  <Link to={paths.help({ section: s.id })}>
                    <strong>{s.title}</strong>
                    <span>{s.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="sp-muted sp-small">Can&apos;t sign in at all? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
      </div>
    </section>
  )
}

function NotLive({ paths }) {
  return (
    <section className="sp-gate">
      <p className="sp-eyebrow"><span className="sp-live-dot is-off" aria-hidden="true" />Player Command</p>
      <h1 className="sp-h1">In-app support isn&apos;t switched on yet</h1>
      <p className="sp-sub">Until it is, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on your account and a person reads it.</p>
      <div className="sp-row">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary">Email support</a>
        {HELP_CENTER_UI_ENABLED && <Link to={paths.help()} className="btn btn-ghost">Help Center</Link>}
      </div>
    </section>
  )
}
