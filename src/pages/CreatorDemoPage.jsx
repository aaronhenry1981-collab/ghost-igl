import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MAPS from '../data/maps'
import PUBLIC_STRATS from '../data/public-strats.generated'
import TacticalRoundPlan from '../components/strats/TacticalRoundPlan'
import { COASTLINE_HOOKAH_GAMEPLAY as GAMEPLAY_FRAMES } from '../data/gameplay-visuals'
import './StratsPage.css'
import './CreatorDemoPage.css'

const DEMO_MAP_ID = 'bank'
const DEMO_SITE_ID = 'ceo'
export default function CreatorDemoPage() {
  const [side, setSide] = useState('attack')
  const [shareState, setShareState] = useState('idle')
  const map = useMemo(() => MAPS.find((item) => item.id === DEMO_MAP_ID), [])
  const site = map?.sites.find((item) => item.id === DEMO_SITE_ID)
  const strat = PUBLIC_STRATS[DEMO_MAP_ID]?.[DEMO_SITE_ID]?.[side]

  useEffect(() => {
    document.title = '60-Second Strategy Demo | Recon 6'
  }, [])

  async function shareDemo() {
    const url = `${window.location.origin}/creator-demo`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Recon 6 strategy demo', text: 'See a full R6 round plan in 60 seconds.', url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      setShareState('done')
      window.setTimeout(() => setShareState('idle'), 2500)
    } catch (error) {
      if (error?.name !== 'AbortError') setShareState('error')
    }
  }

  if (!map || !site || !strat) return null

  return (
    <main className="creator-demo">
      <section className="creator-demo-hero" aria-labelledby="creator-demo-title">
        <img src="/creator-demo-hero-v1.webp" alt="An original cinematic esports squad reviewing a tactical route together" />
        <div className="creator-demo-hero-shade" />
        <div className="creator-demo-hero-copy">
          <span className="creator-demo-eyebrow">RECON 6 · CREATOR DEMO</span>
          <h1 id="creator-demo-title">One round. One job. Thirty seconds.</h1>
          <p>Pick the site and side. Recon 6 turns a wall of strategy text into a route your squad can run immediately.</p>
          <div className="creator-demo-actions">
            <a href="#live-demo" className="creator-demo-primary">Run the demo</a>
            <button type="button" onClick={shareDemo}>{shareState === 'done' ? 'Link ready ✓' : 'Share this demo'}</button>
          </div>
          <small>No account required · Original tactical artwork · Strategy schematic, not an exact floor plan</small>
        </div>
      </section>

      <section id="live-demo" className="creator-demo-stage" aria-labelledby="creator-demo-stage-title">
        <div className="creator-demo-stage-heading">
          <div>
            <span>LIVE PRODUCT PROOF</span>
            <h2 id="creator-demo-stage-title">Bank · CEO Office / Executive Lounge</h2>
            <p>Switch sides and the entire job changes without losing the map or site.</p>
          </div>
          <div className="creator-demo-toggle" aria-label="Choose side">
            <button type="button" className={side === 'attack' ? 'is-active' : ''} onClick={() => setSide('attack')}>Attack</button>
            <button type="button" className={side === 'defense' ? 'is-active is-defense' : ''} onClick={() => setSide('defense')}>Defense</button>
          </div>
        </div>

        <TacticalRoundPlan
          strat={strat}
          side={side}
          mapId={map.id}
          mapName={map.name}
          siteName={site.name}
        />
      </section>

      <section className="creator-demo-gameplay" aria-labelledby="creator-gameplay-title">
        <div className="creator-demo-gameplay-heading">
          <div>
            <span>REAL PLAYER FOOTAGE</span>
            <h2 id="creator-gameplay-title">The screenshot should teach the decision.</h2>
          </div>
          <p>These are frames from an actual Recon 6 gameplay session on Coastline—not staged renders. The short note tells the player what matters in the picture.</p>
        </div>
        <div className="creator-demo-gameplay-grid">
          {GAMEPLAY_FRAMES.map((frame, index) => (
            <figure key={frame.src}>
              <div className="creator-demo-gameplay-image">
                <img src={frame.src} alt={frame.alt} loading="lazy" />
                <b>{String(index + 1).padStart(2, '0')}</b>
              </div>
              <figcaption>
                <strong>{frame.label}</strong>
                <span>{frame.copy}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="creator-demo-proof" aria-labelledby="creator-proof-title">
        <div className="creator-demo-proof-copy">
          <span>WHY THIS IS DIFFERENT</span>
          <h2 id="creator-proof-title">The player sees what to do—not another database to study.</h2>
        </div>
        <ol>
          <li><b>1</b><div><strong>Lock the context</strong><span>Map, site, side, squad size, and role stay together.</span></div></li>
          <li><b>2</b><div><strong>Show the route</strong><span>Named priority zones connect the plan to the callouts.</span></div></li>
          <li><b>3</b><div><strong>Assign the job</strong><span>Every step has an operator owner and one clear outcome.</span></div></li>
        </ol>
      </section>

      <section className="creator-demo-close">
        <span>READY FOR A REAL MATCH?</span>
        <h2>Start with the strategy. Improve with your own rounds.</h2>
        <p>Use the full strategy library, upload screenshots for a VOD breakdown, or book a human coaching session backed by the same system.</p>
        <div className="creator-demo-actions creator-demo-close-actions">
          <Link to="/auth?mode=signup" className="creator-demo-primary">Start free</Link>
          <a href="/coaching/index.html#book">Book first session · $20</a>
        </div>
      </section>
    </main>
  )
}
