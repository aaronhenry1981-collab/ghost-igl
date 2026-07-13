// Renders the new session-shaped VOD analysis response (per_image, patterns,
// practice_plan, operator_feedback). Replaces the old single-image
// AnalysisResults for new sessions, but old AnalysisResults stays around for
// the demo screenshot fallback.

function ScoreBadge({ score }) {
  let color = '#7ee2a4', bg = 'rgba(80,200,120,0.15)', border = '#50c878'
  if (score < 60) { color = '#ff8a8a'; bg = 'rgba(255,90,90,0.15)'; border = '#ff5a5a' }
  else if (score < 75) { color = '#ffc97a'; bg = 'rgba(255,180,80,0.15)'; border = '#ffb450' }
  return (
    <div style={{
      display: 'inline-block',
      padding: '4px 14px',
      fontSize: '0.85rem',
      fontWeight: 700,
      color, background: bg, border: `1px solid ${border}`,
      borderRadius: 999,
    }}>
      Score: {score}/100
    </div>
  )
}

function DetectedPills({ detected }) {
  if (!detected) return null
  const pills = []
  if (detected.map) pills.push({ label: detected.map, kind: 'map' })
  if (detected.site) pills.push({ label: detected.site, kind: 'site' })
  if (detected.side) pills.push({ label: detected.side, kind: detected.side })
  // Accept both legacy `operator` and new game-aware `character` field.
  const char = detected.character || detected.operator
  if (char) pills.push({ label: char, kind: 'op' })
  if (detected.round_phase && detected.round_phase !== 'unknown') pills.push({ label: detected.round_phase, kind: 'phase' })
  if (pills.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {pills.map((p, i) => {
        const colors = {
          attack: { bg: 'rgba(255,138,80,0.15)', fg: '#ffa67a' },
          defense: { bg: 'rgba(80,180,255,0.15)', fg: '#7aaaff' },
          map: { bg: 'rgba(0,229,255,0.12)', fg: '#7eddee' },
          site: { bg: 'rgba(255,155,92,0.12)', fg: '#ffb88c' },
          op: { bg: 'rgba(180,140,255,0.12)', fg: '#c0a8f0' },
          phase: { bg: 'rgba(180,180,180,0.12)', fg: '#bbb' },
        }
        const c = colors[p.kind] || colors.phase
        return (
          <span key={i} style={{
            padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.04em', borderRadius: 999, color: c.fg, background: c.bg,
          }}>{p.label}</span>
        )
      })}
    </div>
  )
}

function BulletList({ items, color = '#e6e9ef', emptyMessage = null }) {
  if (!items || items.length === 0) {
    return emptyMessage ? <p style={{ color: 'rgba(230,233,239,0.5)', fontStyle: 'italic' }}>{emptyMessage}</p> : null
  }
  return (
    <ul style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }}>
      {items.map((item, i) => <li key={i} style={{ color, marginBottom: 4 }}>{item}</li>)}
    </ul>
  )
}

export default function SessionResults({ analysis }) {
  if (!analysis) return null

  // Backward-compat: detect the old single-image shape and convert it
  // into a synthetic session shape for rendering.
  if (analysis.score != null && analysis.overview && !analysis.per_image) {
    return <SingleImageFallback analysis={analysis} />
  }

  const session = analysis.session || {}
  const perImage = analysis.per_image || []
  const patterns = analysis.patterns || {}
  const practicePlan = analysis.practice_plan || {}
  // Accept both legacy `operator_feedback` and new `character_feedback`.
  const opFeedback = analysis.character_feedback || analysis.operator_feedback || null

  return (
    <div className="vod-results">
      {/* Headline / session summary */}
      <section className="vod-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Session Analysis</h2>
          {session.score != null && <ScoreBadge score={session.score} />}
        </div>
        <p style={{ fontSize: '1.05rem', marginTop: '0.5rem' }}>{session.headline}</p>
        {(session.detected_map || session.detected_side) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {session.detected_map && (
              <span style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)' }}>
                Detected: <strong>{session.detected_map}</strong>
                {session.detected_side ? ` (${session.detected_side})` : ''} · {session.image_count} {session.image_count === 1 ? 'image' : 'images'}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Per-image breakdowns */}
      {perImage.length > 0 && (
        <section className="vod-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Per-image breakdown</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {perImage.map((img, i) => (
              <details key={i} className="vod-image-card" open={i === 0} style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 6 }}>
                  Image {(img.image_index ?? i) + 1} — {img.what_happened || 'tap to expand'}
                </summary>
                <DetectedPills detected={img.detected} />
                {img.what_went_wrong?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong style={{ color: '#ff8a8a', fontSize: '0.85rem' }}>What went wrong</strong>
                    <BulletList items={img.what_went_wrong} />
                  </div>
                )}
                {img.what_went_right?.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: '#7ee2a4', fontSize: '0.85rem' }}>What went right</strong>
                    <BulletList items={img.what_went_right} />
                  </div>
                )}
                {img.specific_advice?.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: '#00e5ff', fontSize: '0.85rem' }}>Specific advice</strong>
                    <BulletList items={img.specific_advice} />
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Recurring patterns + standout strengths */}
      {(patterns.recurring_weaknesses?.length > 0 || patterns.standout_strengths?.length > 0) && (
        <section className="vod-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Patterns across all images</h3>
          {patterns.recurring_weaknesses?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#ff8a8a' }}>Recurring weaknesses</strong>
              <BulletList items={patterns.recurring_weaknesses} />
            </div>
          )}
          {patterns.standout_strengths?.length > 0 && (
            <div>
              <strong style={{ color: '#7ee2a4' }}>Standout strengths</strong>
              <BulletList items={patterns.standout_strengths} />
            </div>
          )}
        </section>
      )}

      {/* Practice plan */}
      {practicePlan.this_week?.length > 0 && (
        <section className="vod-section" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          background: 'rgba(255,155,92,0.06)',
          border: '1px solid rgba(255,155,92,0.3)',
          borderRadius: 12,
        }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#ff9b5c' }}>📋 Your practice plan this week</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)', margin: '0 0 0.75rem' }}>
            Based on the patterns above. Spend 10-15 minutes per drill before your next ranked session.
          </p>
          <BulletList items={practicePlan.this_week} />
        </section>
      )}

      {/* Operator-specific feedback */}
      {opFeedback && (
        <section className="vod-section" style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(180,140,255,0.06)',
          border: '1px solid rgba(180,140,255,0.3)',
          borderRadius: 12,
        }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#c0a8f0' }}>🎯 Operator-specific feedback</h3>
          <p style={{ margin: 0 }}>{opFeedback}</p>
        </section>
      )}

      {analysis.tier === 'pro' && (
        <p style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.55)', textAlign: 'center', marginTop: '1.5rem' }}>
          Want a deeper review? <a href="/account">Upgrade to Champion</a> for full-round 10-screenshot sessions, accountability for the picks you made, and a weekly drill list built from your own clips.
        </p>
      )}
    </div>
  )
}

// Backward-compat renderer for the old single-image response shape.
function SingleImageFallback({ analysis }) {
  const synthetic = {
    session: {
      headline: analysis.overview,
      score: analysis.score,
      detected_map: analysis.detected?.map,
      detected_side: analysis.detected?.side,
      image_count: 1,
    },
    per_image: [{
      image_index: 0,
      detected: analysis.detected,
      what_happened: analysis.overview,
      what_went_wrong: analysis.improvements || [],
      what_went_right: analysis.strengths || [],
      specific_advice: [
        analysis.positioning && `Positioning: ${analysis.positioning}`,
        analysis.crosshair && `Crosshair: ${analysis.crosshair}`,
        analysis.utility && `Utility: ${analysis.utility}`,
      ].filter(Boolean),
    }],
    patterns: {},
    practice_plan: {},
  }
  return <SessionResults analysis={synthetic} />
}
