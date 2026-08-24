import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SeasonCountdown from '../components/SeasonCountdown'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { WORKBOOK_AMOUNT } from '../config/stripe'
import { TIERS, RANKS } from '../data/ranks'
import { CURRENT_R6_SEASON, UPCOMING_R6_SEASON } from '../data/r6-season'
import './BeginnerGuidePage.css'

const WORKBOOK_PRICE = `$${WORKBOOK_AMOUNT.toFixed(2)}`

const CONTENTS = [
  ['Round basics', 'What wins a round, attack vs. defense, prep phase, the defuser, time, and why information matters.'],
  ['Role finder', 'Entry, support, flex, anchor, and roamer prompts that help a new player pick a useful job.'],
  ['First operators', 'A small starter pool and a worksheet for learning one attacker and one defender at a time.'],
  ['Map learning', 'Room-name, bomb-site, default-plan, and danger-lane worksheets instead of a wall of memorization.'],
  ['Rank roadmap', 'All 40 current Ranked 3.0 divisions from Copper V through Champion I, with evidence goals for every tier.'],
  ['30-day plan', 'Short drills, match review pages, weekly scorecards, and a next-match mission so practice stays focused.'],
]

const PHASES = [
  { days: 'Days 1–7', title: 'Survive with information', focus: 'Crosshair height, drone before entry, sound, and one safe defender position.' },
  { days: 'Days 8–14', title: 'Do one job well', focus: 'Choose a role, learn a two-operator pool, and spend utility before taking a low-information fight.' },
  { days: 'Days 15–21', title: 'Learn one map deeply', focus: 'Four bomb sites, two routes, key callouts, a default attack, and a default defense.' },
  { days: 'Days 22–30', title: 'Review and repeat', focus: 'Tag the round-losing mistake, choose one correction, and prove it across several matches.' },
]

export default function BeginnerGuidePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [checkoutState, setCheckoutState] = useState('idle')
  const [deliveryState, setDeliveryState] = useState('idle')
  const [purchaseError, setPurchaseError] = useState('')
  const autoCheckoutStarted = useRef(false)
  const autoDeliveryStarted = useRef(false)
  const purchaseIntent = searchParams.get('purchase') === 'workbook'
  const purchaseResult = searchParams.get('workbook')
  const checkoutSessionId = searchParams.get('session_id') || ''

  useEffect(() => {
    const previous = document.title
    document.title = 'Rainbow Six Siege Beginner Workbook | Recon 6'
    return () => { document.title = previous }
  }, [])

  const signInForPurchase = useCallback((redirectPath) => {
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(redirectPath)}`)
  }, [navigate])

  const beginCheckout = useCallback(async () => {
    if (authLoading || checkoutState === 'loading') return
    if (!user) {
      signInForPurchase('/beginner-guide?purchase=workbook')
      return
    }
    setCheckoutState('loading')
    setPurchaseError('')
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Please sign in again to continue.')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const response = await fetch(`${API_URL}/me/workbook-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'siege-starter-workbook' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is temporarily unavailable.')
      window.location.assign(data.url)
    } catch (error) {
      setCheckoutState('error')
      setPurchaseError(error.message || 'Checkout failed. Please retry.')
    }
  }, [authLoading, checkoutState, signInForPurchase, user])

  const downloadPurchasedBundle = useCallback(async () => {
    if (!checkoutSessionId || deliveryState === 'loading') return
    if (!user) {
      signInForPurchase(`/beginner-guide?workbook=success&session_id=${encodeURIComponent(checkoutSessionId)}`)
      return
    }
    setDeliveryState('loading')
    setPurchaseError('')
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Please sign in again to download your purchase.')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const response = await fetch(`${API_URL}/me/workbook-download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: checkoutSessionId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) throw new Error(data.error || 'Your download could not be prepared.')
      setDeliveryState('ready')
      window.location.assign(data.url)
    } catch (error) {
      setDeliveryState('error')
      setPurchaseError(error.message || 'Download failed. Please retry.')
    }
  }, [checkoutSessionId, deliveryState, signInForPurchase, user])

  useEffect(() => {
    if (!purchaseIntent || authLoading || !user || autoCheckoutStarted.current) return
    autoCheckoutStarted.current = true
    beginCheckout()
  }, [authLoading, beginCheckout, purchaseIntent, user])

  useEffect(() => {
    if (purchaseResult !== 'success' || !checkoutSessionId || authLoading || autoDeliveryStarted.current) return
    autoDeliveryStarted.current = true
    downloadPurchasedBundle()
  }, [authLoading, checkoutSessionId, downloadPurchasedBundle, purchaseResult])

  return (
    <div className="beginner-guide-page">
      <section className="beginner-guide-hero">
        <div className="beginner-guide-copy">
          <span className="beginner-guide-kicker">For brand-new Rainbow Six Siege players</span>
          <h1>Learn the round before you chase the rank.</h1>
          <p>
            The Siege Starter Field Workbook turns the first confusing month into a simple routine:
            learn one idea, play it, review one round, and carry one correction forward.
          </p>
          <div className="beginner-guide-actions">
            <button className="btn btn-primary btn-lg" type="button" onClick={beginCheckout} disabled={checkoutState === 'loading'}>
              {checkoutState === 'loading' ? 'Opening secure checkout…' : `Get the full workbook · ${WORKBOOK_PRICE}`}
            </button>
            <a className="btn btn-outline btn-lg" href="/downloads/recon6-siege-starter-sample.pdf" download>
              Download the free sample
            </a>
          </div>
          <p className="beginner-guide-purchase-note">One-time payment · fillable + print-friendly PDFs · instant private download</p>
          <div className="beginner-guide-facts">
            <span><strong>64</strong> workbook pages</span>
            <span><strong>357</strong> fillable fields</span>
            <span><strong>30</strong> practice days</span>
          </div>
        </div>

        <div className="workbook-mockup" aria-label="Siege Starter Field Workbook cover preview">
          <div className="workbook-grid" aria-hidden="true" />
          <span className="workbook-brand">Recon 6 Coaching</span>
          <strong>Siege<br />Starter</strong>
          <span className="workbook-title">Field Workbook</span>
          <p>From your first round to Ranked 3.0</p>
          <div className="workbook-mark" aria-hidden="true"><i /><i /><i /></div>
          <small>Unofficial · Independent · Player-first</small>
        </div>
      </section>

      {(purchaseResult === 'success' || purchaseResult === 'cancelled' || purchaseError) && (
        <section className={`beginner-guide-purchase-status ${purchaseResult === 'success' ? 'is-success' : ''}`} aria-live="polite">
          {purchaseResult === 'success' ? (
            <>
              <div>
                <span className="beginner-guide-kicker">Payment received</span>
                <h2>Your workbook bundle is ready.</h2>
                <p>The download is being prepared automatically. It includes the fillable and print-friendly 64-page editions.</p>
              </div>
              <button className="btn btn-primary" type="button" onClick={downloadPurchasedBundle} disabled={deliveryState === 'loading'}>
                {deliveryState === 'loading' ? 'Verifying purchase…' : deliveryState === 'ready' ? 'Download again' : 'Download my workbook'}
              </button>
            </>
          ) : purchaseResult === 'cancelled' ? (
            <>
              <div>
                <span className="beginner-guide-kicker">Checkout cancelled</span>
                <h2>You were not charged.</h2>
                <p>Your free sample is still available, or you can reopen checkout whenever you are ready.</p>
              </div>
              <button className="btn btn-outline" type="button" onClick={beginCheckout}>Try checkout again</button>
            </>
          ) : null}
          {purchaseError && <p className="beginner-guide-purchase-error" role="alert">{purchaseError}</p>}
        </section>
      )}

      <section className="beginner-guide-section beginner-guide-intro">
        <div>
          <span className="beginner-guide-kicker">A workbook, not an encyclopedia</span>
          <h2>Enough guidance to start playing with purpose.</h2>
        </div>
        <p>
          New players do not need every operator, every angle, and every site on day one. They need a small operator pool,
          a repeatable round routine, and a way to notice why they died. The workbook supplies those prompts without pretending
          a printed page can replace live map updates.
        </p>
      </section>

      <section className="beginner-guide-upcoming" aria-labelledby="beginner-upcoming-heading">
        <div>
          <span className="beginner-guide-kicker">Upcoming · not live</span>
          <h2 id="beginner-upcoming-heading">The book already accounts for {UPCOMING_R6_SEASON.code}—without teaching future stats as current facts.</h2>
        </div>
        <div>
          <p>
            Ubisoft launches {UPCOMING_R6_SEASON.name} on {UPCOMING_R6_SEASON.launchDateLabel}. Noor, Legend Division, Villa changes,
            3v3, and the announced balance pass are tracked separately while {CURRENT_R6_SEASON.code} remains live.
          </p>
          <SeasonCountdown variant="banner" />
          <a href={UPCOMING_R6_SEASON.designerNotesUrl} target="_blank" rel="noopener noreferrer">Read the official Designer’s Notes →</a>
        </div>
      </section>

      <section className="beginner-guide-section">
        <div className="beginner-guide-section-head">
          <span className="beginner-guide-kicker">Inside the workbook</span>
          <h2>Six pieces that turn random matches into practice.</h2>
        </div>
        <div className="beginner-guide-contents">
          {CONTENTS.map(([title, copy], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="beginner-guide-section beginner-rank-section">
        <div className="beginner-guide-section-head">
          <span className="beginner-guide-kicker">Current Ranked 3.0 ladder</span>
          <h2>Copper V through Champion I—every division shown.</h2>
          <p>Current as of {CURRENT_R6_SEASON.verifiedOn}. The workbook explains what to practice at each stage without promising a rank result.</p>
        </div>
        <div className="beginner-rank-grid" aria-label="Rainbow Six Ranked 3.0 divisions">
          {TIERS.map((tier) => (
            <div className={`beginner-rank-tier rank-${tier.toLowerCase()}`} key={tier}>
              <strong>{tier}</strong>
              <div>{RANKS.filter((rank) => rank.tier === tier).map((rank) => <span key={rank.label}>{rank.label.replace(`${tier} `, '')}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="beginner-guide-section">
        <div className="beginner-guide-section-head">
          <span className="beginner-guide-kicker">30-day path</span>
          <h2>One manageable focus each week.</h2>
        </div>
        <div className="beginner-guide-phases">
          {PHASES.map((phase) => (
            <article key={phase.days}>
              <span>{phase.days}</span>
              <h3>{phase.title}</h3>
              <p>{phase.focus}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="beginner-guide-section beginner-guide-pair">
        <div className="beginner-guide-pair-card">
          <span className="beginner-guide-kicker">Want a person beside the workbook?</span>
          <h2>Use the first session to build your personal starting plan.</h2>
          <p>Aaron can review your settings, role fit, one real match, and the exact habit you should track first.</p>
          <a href="/coaching/index.html#book" className="btn btn-primary">Book the $20 first session</a>
        </div>
        <div className="beginner-guide-delivery-card">
          <span className="beginner-guide-kicker">Immediate digital delivery</span>
          <h2>Type in it or print it.</h2>
          <ul>
            <li>Fillable PDF with 357 interactive fields and checkboxes</li>
            <li>Clean print-friendly PDF for handwriting and binders</li>
            <li>64 pages covering first rounds, roles, maps, all 40 divisions, and a 30-day plan</li>
            <li>Private download tied to the email on your Recon 6 account</li>
          </ul>
          <button className="btn btn-outline" type="button" onClick={beginCheckout} disabled={checkoutState === 'loading'}>
            {checkoutState === 'loading' ? 'Opening checkout…' : `Buy once · ${WORKBOOK_PRICE}`}
          </button>
          <small>Personal-use digital license. See the <Link to="/terms">digital-product terms</Link>.</small>
        </div>
      </section>

      <section className="beginner-guide-disclaimer">
        <p>
          Recon 6 is an independent, fan-made coaching service and is not affiliated with or endorsed by Ubisoft.
          Rainbow Six and Rainbow Six Siege are trademarks of Ubisoft Entertainment. Strategies are coaching recommendations,
          not official Ubisoft instructions. <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
        </p>
      </section>
    </div>
  )
}
