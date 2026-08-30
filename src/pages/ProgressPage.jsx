import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useAuth } from '../hooks/useAuth'
import { RANKS } from '../data/ranks'
import { analyzeRankSnapshotApi } from '../api/vodApi'
import MechanicsLab from '../components/MechanicsLab'
import { emptyMechanicsState, normalizeMechanicsState } from '../data/mechanicsLab'
import {
  ALL_PROGRESS_SKILLS,
  PROGRESS_TIERS,
  STATUS_COPY,
  evidenceStatus,
  findProgressSkill,
} from '../data/progressCurriculum'
import './ProgressPage.css'

const LOCAL_KEY = 'recon6-road-to-champion-v2'
const TRN_PLATFORM = { ps5: 'psn', psn: 'psn', xbox: 'xbl', xbl: 'xbl', pc: 'ubi', ubi: 'ubi' }

function trackerUrl(platform, ign) {
  const slug = TRN_PLATFORM[(platform || '').toLowerCase()]
  return slug && ign ? `https://r6.tracker.network/r6siege/profile/${slug}/${encodeURIComponent(ign)}/overview` : null
}

function normalizeRoadmap(value) {
  const source = value && typeof value === 'object' ? value : {}
  const checks = { ...(source.checks || {}) }
  // Old /climb keys were tier-index (gold-0). Translate them to stable IDs.
  // Action checks are retained for history but never count as gameplay proof.
  for (const tier of PROGRESS_TIERS) {
    tier.skills.forEach((skill, index) => {
      if (checks[`${tier.id}-${index}`] && checks[skill.id] == null) checks[skill.id] = true
    })
  }
  return {
    checks,
    focusId: source.focusId || null,
    selectedTierId: source.selectedTierId || null,
    // Older builds silently wrote Gold as a default. Treat a saved tier as an
    // override only when the user explicitly selected manual mode.
    rankMode: source.rankMode === 'manual' ? 'manual' : 'auto',
    mechanics: normalizeMechanicsState(source.mechanics),
  }
}

async function authedRequest(path, options = {}) {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) throw new Error('Not signed in')
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

function emptyRoadmap() {
  return { checks: {}, focusId: null, selectedTierId: null, rankMode: 'auto', mechanics: emptyMechanicsState() }
}

function localRoadmapKey(userId) {
  return `${LOCAL_KEY}:${String(userId || '')}`
}

function loadLocalRoadmap(userId) {
  if (!userId) return emptyRoadmap()
  try {
    const scopedKey = localRoadmapKey(userId)
    const parsed = JSON.parse(localStorage.getItem(scopedKey) || 'null')
    if (parsed && typeof parsed === 'object') return normalizeRoadmap(parsed)
    // Move the pre-account-scoping value into the first authenticated account
    // that upgrades. Remove the old keys only after the scoped write succeeds,
    // so another account on this browser cannot inherit them later.
    const unscoped = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
    const legacy = JSON.parse(localStorage.getItem('c2c-progress') || 'null')
    const migrated = unscoped && typeof unscoped === 'object'
      ? normalizeRoadmap(unscoped)
      : legacy?.checks
        ? normalizeRoadmap({ checks: legacy.checks, focusId: null, selectedTierId: 'gold' })
        : null
    if (migrated) {
      localStorage.setItem(scopedKey, JSON.stringify(migrated))
      localStorage.removeItem(LOCAL_KEY)
      localStorage.removeItem('c2c-progress')
      return migrated
    }
  } catch { /* a clean state is safer than a broken dashboard */ }
  return emptyRoadmap()
}

function tierForRank(label) {
  const found = RANKS.find((rank) => rank.label.toLowerCase() === String(label || '').toLowerCase())
  return found ? found.tier.toLowerCase() : null
}

function cap(text) {
  return String(text || '').replace(/^\w/, (char) => char.toUpperCase()).replaceAll('-', ' ')
}

function statusFor(skill, evidenceMap, roadmap) {
  return evidenceStatus(skill, evidenceMap?.[skill.id], !!roadmap.checks?.[skill.id])
}

function taskScore(skill, evidenceMap, roadmap) {
  const status = statusFor(skill, evidenceMap, roadmap)
  if (status === 'mastered' || status === 'confirmed') return 1
  if (status === 'building') return 0.5
  return 0
}

function tierCompletion(tier, evidenceMap, roadmap) {
  const score = tier.skills.reduce((total, skill) => total + taskScore(skill, evidenceMap, roadmap), 0)
  return Math.round((score / tier.skills.length) * 100)
}

function pickAutomaticFocus(selectedTier, evidenceMap, roadmap) {
  const ordered = [
    ...selectedTier.skills.filter((skill) => statusFor(skill, evidenceMap, roadmap) === 'needs-work'),
    ...selectedTier.skills.filter((skill) => statusFor(skill, evidenceMap, roadmap) === 'building'),
    ...selectedTier.skills.filter((skill) => ['not-started', 'not-observed'].includes(statusFor(skill, evidenceMap, roadmap))),
  ]
  return ordered[0] || selectedTier.skills[0]
}

function FocusCard({ skill, evidence, status, onChoose }) {
  if (!skill) return null
  const latest = evidence?.recent?.at(-1)
  return (
    <section className="progress-focus" aria-labelledby="focus-title">
      <div className="progress-eyebrow">Your next-match mission</div>
      <div className="progress-focus-grid">
        <div>
          <h2 id="focus-title">{skill.title}</h2>
          <p className="progress-focus-action">{skill.action}</p>
        </div>
        <span className={`progress-status progress-status--${status}`}>{STATUS_COPY[status]}</span>
      </div>
      <div className="progress-mission">
        <span>Do this</span>
        <strong>{skill.action}</strong>
      </div>
      <div className="progress-proof">
        <span>How it becomes proven</span>
        <p>{skill.proof}</p>
      </div>
      {latest?.evidence && (
        <div className={`progress-latest ${latest.result === 'missed' ? 'is-missed' : 'is-proved'}`}>
          <span>{latest.result === 'missed' ? 'Last gameplay warning' : 'Last gameplay proof'}</span>
          <p>{latest.evidence}</p>
        </div>
      )}
      <button type="button" className="btn btn-primary progress-focus-button" onClick={onChoose}>
        Keep this as my focus
      </button>
    </section>
  )
}

export default function ProgressPage() {
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, profile: account, refreshProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [roadmap, setRoadmap] = useState(emptyRoadmap)
  const [roadmapOwnerId, setRoadmapOwnerId] = useState(null)
  const [tab, setTab] = useState(searchParams.get('tab') === 'mechanics' ? 'mechanics' : 'focus')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveState, setSaveState] = useState('saved')
  const [rankFile, setRankFile] = useState(null)
  const [rankPreview, setRankPreview] = useState(null)
  const [rankImportState, setRankImportState] = useState('idle')
  const [rankSnapshot, setRankSnapshot] = useState(null)

  useEffect(() => {
    if (authLoading || !user) return
    const localRoadmap = loadLocalRoadmap(user.id)
    setRoadmap(localRoadmap)
    setRoadmapOwnerId(user.id)
    let cancelled = false
    ;(async () => {
      const [profileResult, historyResult, roadmapResult] = await Promise.allSettled([
        authedRequest('/me/coaching-profile'),
        authedRequest('/me/coaching-history'),
        authedRequest('/me/climb-progress'),
      ])
      if (cancelled) return
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
      if (historyResult.status === 'fulfilled') setSessions(historyResult.value.sessions || [])
      if (roadmapResult.status === 'fulfilled' && roadmapResult.value.progress) {
        const rawCloud = roadmapResult.value.progress
        const cloud = normalizeRoadmap(rawCloud)
        // Old /climb used copper-0 keys. Keep them while adding the new stable IDs.
        const localMechanicsTime = Date.parse(localRoadmap.mechanics?.updatedAt || '') || 0
        const cloudMechanicsTime = Date.parse(cloud.mechanics?.updatedAt || '') || 0
        const newestMechanics = rawCloud.mechanics && cloudMechanicsTime >= localMechanicsTime
          ? cloud.mechanics
          : localRoadmap.mechanics
        setRoadmap({
          ...localRoadmap,
          ...cloud,
          checks: { ...(localRoadmap.checks || {}), ...(cloud.checks || {}) },
          mechanics: newestMechanics,
        })
      }
      if (profileResult.status === 'rejected' && historyResult.status === 'rejected') {
        setError('Coach history is temporarily unavailable. Your training roadmap still works and remains saved on this device.')
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [authLoading, user])

  const evidenceMap = useMemo(() => profile?.progressEvidence?.skills || {}, [profile])
  const savedR6 = account?.game_profiles?.r6 || {}
  const confirmedRank = savedR6?.rank_snapshot?.rank || savedR6?.rank || null
  const automaticRank = profile?.observedRank || confirmedRank
  const observedTierId = tierForRank(automaticRank)
  const selectedTierId = roadmap.rankMode === 'manual'
    ? (roadmap.selectedTierId || 'gold')
    : (observedTierId || roadmap.selectedTierId || 'gold')
  const selectedTier = PROGRESS_TIERS.find((tier) => tier.id === selectedTierId) || PROGRESS_TIERS[3]
  const savedFocus = findProgressSkill(roadmap.focusId)
  const focus = savedFocus || pickAutomaticFocus(selectedTier, evidenceMap, roadmap)
  const focusEvidence = evidenceMap[focus?.id] || {}
  const focusStatus = focus ? statusFor(focus, evidenceMap, roadmap) : 'not-observed'

  const summary = useMemo(() => {
    const allStatuses = ALL_PROGRESS_SKILLS.map((skill) => statusFor(skill, evidenceMap, roadmap))
    return {
      proven: allStatuses.filter((status) => status === 'mastered' || status === 'confirmed').length,
      needsWork: allStatuses.filter((status) => status === 'needs-work').length,
      notObserved: allStatuses.filter((status) => status === 'not-observed' || status === 'not-started').length,
    }
  }, [evidenceMap, roadmap])

  async function persistRoadmap(next) {
    if (!user?.id) return
    setRoadmap(next)
    setSaveState('saving')
    try { localStorage.setItem(localRoadmapKey(user.id), JSON.stringify(next)) } catch { /* cloud attempt still follows */ }
    try {
      await authedRequest('/me/climb-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: next }),
      })
      setSaveState('saved')
    } catch {
      setSaveState('device')
    }
  }

  function chooseTier(id) {
    const tier = PROGRESS_TIERS.find((item) => item.id === id)
    persistRoadmap({ ...roadmap, rankMode: 'manual', selectedTierId: id, focusId: pickAutomaticFocus(tier, evidenceMap, roadmap)?.id || null })
  }

  function useAutomaticRank() {
    const tier = PROGRESS_TIERS.find((item) => item.id === observedTierId) || selectedTier
    persistRoadmap({ ...roadmap, rankMode: 'auto', selectedTierId: null, focusId: pickAutomaticFocus(tier, evidenceMap, roadmap)?.id || null })
  }

  function toggleKnowledge(skill) {
    const checks = { ...(roadmap.checks || {}), [skill.id]: !roadmap.checks?.[skill.id] }
    persistRoadmap({ ...roadmap, checks })
  }

  function chooseFocus(id) {
    persistRoadmap({ ...roadmap, focusId: id })
    setTab('focus')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveMechanics(mechanics) {
    const checks = { ...(roadmap.checks || {}) }
    if (mechanics.lockedAt) checks['settings-locked'] = true
    const completedAimLanes = new Set((mechanics.aimSessions || []).map((session) => session.drillId))
    if (completedAimLanes.size >= 5) checks['warmup-routine'] = true
    persistRoadmap({ ...roadmap, mechanics, checks })
  }

  function chooseRankFile(event) {
    const file = event.target.files?.[0] || null
    setRankFile(file)
    setRankSnapshot(null)
    setRankImportState('idle')
    if (rankPreview) URL.revokeObjectURL(rankPreview)
    setRankPreview(file ? URL.createObjectURL(file) : null)
  }

  async function readRankScreenshot() {
    if (!rankFile) return
    setRankImportState('reading')
    setError(null)
    try {
      const result = await analyzeRankSnapshotApi(rankFile)
      if (!result?.snapshot?.rank) throw new Error('No exact Rainbow Six rank was readable in that image.')
      setRankSnapshot(result.snapshot)
      setRankImportState('review')
    } catch (err) {
      setError(`Rank screenshot could not be verified: ${err.message}`)
      setRankImportState('idle')
    }
  }

  async function confirmRankSnapshot() {
    if (!rankSnapshot?.rank) return
    setRankImportState('saving')
    setError(null)
    try {
      const gameProfiles = { ...(account?.game_profiles || {}) }
      gameProfiles.r6 = {
        ...(gameProfiles.r6 || {}),
        rank: rankSnapshot.rank,
        rank_snapshot: { ...rankSnapshot, confirmed_at: new Date().toISOString(), source: 'user-confirmed-screenshot' },
      }
      await authedRequest('/me', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_profiles_json: JSON.stringify(gameProfiles), active_game_id: 'r6' }),
      })
      await refreshProfile?.()
      const nextTierId = tierForRank(rankSnapshot.rank)
      const tier = PROGRESS_TIERS.find((item) => item.id === nextTierId) || selectedTier
      await persistRoadmap({ ...roadmap, rankMode: 'auto', selectedTierId: null, focusId: pickAutomaticFocus(tier, evidenceMap, roadmap)?.id || null })
      setRankImportState('saved')
    } catch (err) {
      setError(`Rank snapshot could not be saved: ${err.message}`)
      setRankImportState('review')
    }
  }

  if (authLoading || (user && roadmapOwnerId !== user.id)) {
    return <main className="progress-shell"><div className="progress-notice">Loading your road to Champion…</div></main>
  }

  if (!user) {
    return (
      <main className="progress-shell progress-signin">
        <div className="progress-eyebrow">Road to Champion</div>
        <h1>Turn every match into a training plan.</h1>
        <p>Sign in so Coach evidence, knowledge checks, and your next-match mission stay together.</p>
        <Link to="/auth?redirect=/progress" className="btn btn-primary">Sign in to see my plan</Link>
      </main>
    )
  }

  return (
    <main className="progress-shell">
      <header className="progress-hero">
        <div>
          <div className="progress-eyebrow">Road to Champion</div>
          <h1>Know the one thing to fix next.</h1>
          <p>Your rank is not a checklist. Knowledge is confirmed by you; gameplay is proven by Coach evidence across matches.</p>
        </div>
        <div className="progress-save" aria-live="polite">
          {saveState === 'saving' ? 'Saving…' : saveState === 'device' ? 'Saved on this device' : 'Progress saved'}
        </div>
      </header>

      <section className="progress-scoreboard" aria-label="Progress summary">
        <div><strong>{automaticRank || selectedTier.name}</strong><span>{roadmap.rankMode === 'manual' ? 'Manual focus tier' : 'Auto-detected focus tier'}</span></div>
        <div><strong>{summary.proven}</strong><span>Knowledge or skills proven</span></div>
        <div className="is-warning"><strong>{summary.needsWork}</strong><span>Skills needing work</span></div>
        <div><strong>{profile?.totals?.sessions || 0}</strong><span>Coaching evidence sessions</span></div>
      </section>

      <nav className="progress-tabs" aria-label="Progress views">
        {[
          ['focus', 'Focus now'], ['mechanics', 'Training & Range'], ['roadmap', 'Skill map'], ['evidence', 'Gameplay evidence'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {loading && <div className="progress-notice">Building your training plan from coaching evidence…</div>}
      {error && <div className="progress-notice is-warning">{error}</div>}

      {!loading && tab === 'focus' && (
        <div className="progress-view">
          <FocusCard skill={focus} evidence={focusEvidence} status={focusStatus} onChoose={() => chooseFocus(focus.id)} />

          <section className="progress-priorities">
            <div className="progress-section-heading">
              <div><span>What Coach sees</span><h2>Your priority list</h2></div>
              <button type="button" onClick={() => setTab('roadmap')}>Open skill map</button>
            </div>
            <div className="progress-priority-grid">
              <article className="progress-priority-card is-danger">
                <span>Doing wrong</span>
                <strong>{summary.needsWork || 'No repeated leak yet'}</strong>
                <p>{profile?.mechanics?.recurringLeak
                  ? `${cap(profile.mechanics.recurringLeak.cause)} repeated in ${profile.mechanics.recurringLeak.matches} recent matches.`
                  : 'Coach needs repeated evidence before labeling a habit.'}</p>
              </article>
              <article className="progress-priority-card is-unknown">
                <span>Not doing or not seen</span>
                <strong>{summary.notObserved} objectives</strong>
                <p>These stay unproven until you check the knowledge or Coach sees the action in real play.</p>
              </article>
              <article className="progress-priority-card is-good">
                <span>Working</span>
                <strong>{summary.proven} objectives</strong>
                <p>Proven items remain visible so you know what to maintain instead of endlessly retraining it.</p>
              </article>
            </div>
          </section>

          <section className="progress-session-rule">
            <div><span>Next session rule</span><h2>One mission. Three matches. Then review.</h2></div>
            <ol>
              <li>Read the mission before you queue.</li>
              <li>Play three matches with the Coach connected.</li>
              <li>Return here and check whether the evidence moved.</li>
            </ol>
          </section>
        </div>
      )}

      {!loading && tab === 'mechanics' && (
        <div className="progress-view">
          <MechanicsLab
            value={roadmap.mechanics}
            onSave={saveMechanics}
            rank={automaticRank}
            coachTrainingSessions={profile?.trainingSessions || []}
          />
        </div>
      )}

      {!loading && tab === 'roadmap' && (
        <div className="progress-view">
          <section className="progress-rank-picker">
            <div className="progress-section-heading">
              <div><span>40-division ladder</span><h2>Choose the level you are training</h2></div>
              <div className="progress-rank-mode">
                <strong>{selectedTier.name} {selectedTier.divisions}</strong>
                {automaticRank && roadmap.rankMode === 'manual' && <button type="button" onClick={useAutomaticRank}>Use detected {automaticRank}</button>}
                {roadmap.rankMode === 'auto' && <small>Automatic</small>}
              </div>
            </div>
            <div className="progress-tier-buttons">
              {PROGRESS_TIERS.map((tier) => {
                const completion = tierCompletion(tier, evidenceMap, roadmap)
                return (
                  <button key={tier.id} type="button" onClick={() => chooseTier(tier.id)} className={tier.id === selectedTier.id ? 'active' : ''} style={{ '--tier-color': tier.color }}>
                    <span>{tier.name}</span><small>{completion}%</small>
                  </button>
                )
              })}
            </div>
            <div className="progress-divisions" aria-label={`${selectedTier.name} divisions`}>
              {RANKS.filter((rank) => rank.tier.toLowerCase() === selectedTier.id).map((rank) => <span key={rank.order}>{rank.label}</span>)}
            </div>
          </section>

          <section className="progress-tier-panel" style={{ '--tier-color': selectedTier.color }}>
            <div className="progress-tier-title">
              <div><span>{selectedTier.name} standard</span><h2>{selectedTier.theme}</h2></div>
              <strong>{tierCompletion(selectedTier, evidenceMap, roadmap)}%</strong>
            </div>
            <div className="progress-gate"><span>Promotion gate</span><p>{selectedTier.gate}</p></div>
            <div className="progress-skill-list">
              {selectedTier.skills.map((skill) => {
                const evidence = evidenceMap[skill.id] || {}
                const status = statusFor(skill, evidenceMap, roadmap)
                const latest = evidence.recent?.at(-1)
                return (
                  <article key={skill.id} className={`progress-skill progress-skill--${status}`}>
                    <div className="progress-skill-top">
                      <div>
                        <span className="progress-kind">{skill.kind === 'knowledge' ? 'Knowledge' : 'Gameplay action'}</span>
                        <h3>{skill.title}</h3>
                      </div>
                      <span className={`progress-status progress-status--${status}`}>{STATUS_COPY[status]}</span>
                    </div>
                    <p className="progress-skill-action">{skill.action}</p>
                    <div className="progress-skill-proof"><span>Proof:</span> {skill.proof}</div>
                    {latest?.evidence && <div className="progress-skill-evidence">{latest.evidence}</div>}
                    <div className="progress-skill-actions">
                      {skill.kind === 'knowledge' ? (
                        <button type="button" onClick={() => toggleKnowledge(skill)}>
                          {roadmap.checks?.[skill.id] ? 'Undo knowledge check' : 'I understand this'}
                        </button>
                      ) : (
                        <button type="button" onClick={() => chooseFocus(skill.id)}>Make this my mission</button>
                      )}
                      <span>{Number(evidence.proved || 0)} proved · {Number(evidence.missed || 0)} missed</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {!loading && tab === 'evidence' && (
        <div className="progress-view progress-evidence-view">
          <section className="progress-evidence-feed">
            <div className="progress-section-heading">
              <div><span>No guessing</span><h2>What your gameplay actually showed</h2></div>
            </div>
            {(profile?.progressEvidence?.recent || []).length ? (
              profile.progressEvidence.recent.slice().reverse().map((item, index) => {
                const skill = findProgressSkill(item.skillId)
                return (
                  <article className={`progress-evidence-item is-${item.result}`} key={`${item.ts}-${item.skillId}-${index}`}>
                    <div><span>{item.result === 'proved' ? 'Proved' : 'Needs work'}</span><strong>{skill?.title || cap(item.skillId)}</strong></div>
                    <p>{item.evidence}</p>
                    <small>{[item.map, item.side, (item.ts || '').slice(0, 10)].filter(Boolean).join(' · ')}</small>
                  </article>
                )
              })
            ) : (
              <div className="progress-empty">
                <h3>No skill evidence synced yet</h3>
                <p>Play three matches with the Owner Coach connected. The page will separate proven actions, missed actions, and things the Coach has not observed.</p>
              </div>
            )}
          </section>

          <section className="progress-history">
            <div className="progress-section-heading"><div><span>Match history</span><h2>Recent results and leaks</h2></div></div>
            <div className="progress-match-list">
              {sessions.slice(0, 10).map((session) => (
                <article key={session.sessionId}>
                  <div><strong>{(session.maps || []).join(', ') || 'Map not read'}</strong><span>{(session.firstTs || '').slice(0, 10)}</span></div>
                  <div className="progress-match-result">
                    <b className={session.result === 'win' ? 'win' : session.result === 'loss' ? 'loss' : ''}>{session.result ? cap(session.result) : 'Result not logged'}</b>
                    <span>{session.roundsWon}–{session.roundsLost} rounds</span>
                    <span>{session.deaths} deaths</span>
                    <span>{session.dominantCause ? cap(session.dominantCause) : 'No verified leak'}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="progress-tracker">
            <div className="progress-tracker-copy">
              <span>Verified rank context</span><h2>Import what the screen proves</h2>
              <p>Upload a screenshot of your Ubisoft or TRN overview. Recon 6 reads only visible fields, shows them for confirmation, then aligns your training tier. It does not scrape or claim a live TRN connection.</p>
              {trackerUrl(account?.platform, account?.display_name) && (
                <a target="_blank" rel="noopener noreferrer" href={trackerUrl(account.platform, account.display_name)}>Open {account.display_name}'s TRN page →</a>
              )}
            </div>
            <div className="progress-rank-import">
              <label className="progress-file-picker">Rank/stat screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseRankFile} /></label>
              {rankPreview && <img src={rankPreview} alt="Rank screenshot preview" />}
              {rankSnapshot && (
                <div className="progress-rank-review">
                  <strong>{rankSnapshot.rank}</strong>
                  <span>{rankSnapshot.rp != null ? `${rankSnapshot.rp} RP` : 'RP not visible'}</span>
                  <span>{rankSnapshot.kd != null ? `${rankSnapshot.kd} K/D` : 'K/D not visible'}</span>
                  <span>{rankSnapshot.win_rate != null ? `${rankSnapshot.win_rate}% win rate` : 'Win rate not visible'}</span>
                  <small>{Math.round(Number(rankSnapshot.confidence || 0) * 100)}% visual confidence</small>
                </div>
              )}
              {rankSnapshot ? (
                <button type="button" className="btn btn-primary" disabled={rankImportState === 'saving' || rankImportState === 'saved'} onClick={confirmRankSnapshot}>
                  {rankImportState === 'saving' ? 'Saving…' : rankImportState === 'saved' ? 'Saved and aligned' : `Confirm ${rankSnapshot.rank}`}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" disabled={!rankFile || rankImportState === 'reading'} onClick={readRankScreenshot}>
                  {rankImportState === 'reading' ? 'Reading visible stats…' : 'Read screenshot'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
