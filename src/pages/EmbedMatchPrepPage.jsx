import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import MAPS from '../data/maps'
import STRATS from '../data/strats'
import BANS from '../data/bans'
import './EmbedMatchPrepPage.css'

// Embeddable Match Prep widget — designed for iframe embedding on other
// R6 content sites. Strips ALL site chrome (no navbar, no footer, no
// auth gates, no founding banner). Renders only the per-map cheatsheet
// content in a compact, white-label-ish container.
//
// Embed snippet for content creators (lives in the widget's "Get embed
// code" UI further down on the public page):
//
//   <iframe
//     src="https://r6coaching.com/#/embed/match-prep/bank"
//     width="100%" height="600" frameborder="0"
//     title="R6 Bank match prep — Recon 6">
//   </iframe>
//
// Every embed = a permanent backlink + a footer credit pointing back to
// the live site. The whole point is to be useful enough that R6 sites
// WANT to embed it, generating organic inbound links.

export default function EmbedMatchPrepPage() {
  const { mapId } = useParams()
  const map = useMemo(() => MAPS.find((m) => m.id === mapId), [mapId])
  const bans = BANS[mapId]

  // Embed pages must NOT include site-wide chrome. The Layout component
  // would normally render the navbar/footer around us — but this route
  // is registered OUTSIDE the Layout wrapper in main.jsx, so we get a
  // bare-document render. Defensive cleanup: hide any global elements
  // that somehow leaked through (rare in this stack but worth the
  // safety belt since the page is meant for cross-site iframing).
  useEffect(() => {
    document.body.classList.add('embed-body')
    return () => document.body.classList.remove('embed-body')
  }, [])

  if (!map || !STRATS[mapId]) {
    return (
      <div className="embed-page">
        <div className="embed-err">
          <strong>Map not found:</strong> {mapId}
          <div className="embed-err-sub">
            Embed URLs follow <code>/embed/match-prep/&lt;map-id&gt;</code> — see the full map list at{' '}
            <a href="https://r6coaching.com/#/match-prep" target="_blank" rel="noreferrer noopener">r6coaching.com</a>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="embed-page">
      <header className="embed-header">
        <div>
          <span className="embed-eyebrow">R6 MATCH PREP</span>
          <h1>{map.name}</h1>
        </div>
        <div className="embed-meta">{map.sites.length} sites · Ranked pool</div>
      </header>

      {bans && (bans.attack?.length > 0 || bans.defense?.length > 0) && (
        <section className="embed-section">
          <h2>Ban targets</h2>
          <div className="embed-bans-grid">
            <div>
              <div className="embed-bans-label attack">Ban from attack</div>
              {bans.attack?.map((b) => (
                <div key={`atk-${b.name}`} className="embed-ban">
                  <strong>{b.name}</strong>
                  <span>{b.reason.split('.')[0]}.</span>
                </div>
              ))}
            </div>
            <div>
              <div className="embed-bans-label defense">Ban from defense</div>
              {bans.defense?.map((b) => (
                <div key={`def-${b.name}`} className="embed-ban">
                  <strong>{b.name}</strong>
                  <span>{b.reason.split('.')[0]}.</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="embed-section">
        <h2>Site-by-site quick read</h2>
        <div className="embed-sites">
          {map.sites.map((site) => {
            const s = STRATS[mapId]?.[site.id]
            if (!s) return null
            const attackOps = s.attack?.operators?.slice(0, 5).map((o) => o.name).join(', ')
            const defenseOps = s.defense?.operators?.slice(0, 5).map((o) => o.name).join(', ')
            const callouts = (s.attack?.callouts || s.defense?.callouts || []).slice(0, 6)
            return (
              <article key={site.id} className="embed-site">
                <header>
                  <h3>{site.name}</h3>
                  {site.floor && <span>{site.floor}</span>}
                </header>
                {attackOps && (
                  <div className="embed-site-row">
                    <span className="embed-site-label atk">ATK</span>
                    <span>{attackOps}</span>
                  </div>
                )}
                {defenseOps && (
                  <div className="embed-site-row">
                    <span className="embed-site-label def">DEF</span>
                    <span>{defenseOps}</span>
                  </div>
                )}
                {callouts.length > 0 && (
                  <div className="embed-site-callouts">{callouts.join(' · ')}</div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <footer className="embed-foot">
        Powered by{' '}
        <a href={`https://r6coaching.com/#/match-prep/${mapId}`} target="_blank" rel="noreferrer noopener">
          <strong>Recon 6</strong> — AI-powered R6 coaching
        </a>
        {' · '}
        <a href={`https://r6coaching.com/#/live`} target="_blank" rel="noreferrer noopener">
          In-match walkthrough →
        </a>
      </footer>
    </div>
  )
}
