import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useSectionNavigate } from '../utils/sectionLink'
import { foundingPromisePhrase } from '../config/founding'
import './WelcomeModal.css'

const SEEN_KEY = 'ghost-igl-welcome-seen'
const DESKTOP_APP_RELEASED = import.meta.env.VITE_DESKTOP_APP_RELEASED === 'true'

const ROLES = [
  { id: 'Entry', label: 'Entry', emoji: 'âš”ï¸', desc: 'First through doors. Frag out fights.' },
  { id: 'Support', label: 'Support', emoji: 'ðŸ› ï¸', desc: 'Open walls, clear utility, enable your team.' },
  { id: 'Anchor', label: 'Anchor', emoji: 'ðŸ—¿', desc: 'Hold site. Deny plants. Sustain through pressure.' },
  { id: 'Roamer', label: 'Roamer', emoji: 'ðŸ¥·', desc: 'Flank, trade, disrupt â€” waste attacker time.' },
  { id: 'IGL', label: 'IGL', emoji: 'ðŸ§ ', desc: 'Call the round, drone, flex where needed.' },
  { id: 'Flex', label: 'Flex', emoji: 'ðŸŽ¯', desc: 'Fill whatever slot the team needs.' },
]

export default function WelcomeModal() {
  const { user, plan, isAdmin, loading } = useAuth()
  const { role: existingRole, refresh: refreshRole } = useUserRole()
  const goToPricing = useSectionNavigate('pricing')
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [savingRole, setSavingRole] = useState(false)
  const [roleError, setRoleError] = useState(null)

  useEffect(() => {
    if (loading || !user) return
    const seen = localStorage.getItem(SEEN_KEY)
    if (!seen) setVisible(true)
  }, [loading, user])

  function dismiss() {
    localStorage.setItem(SEEN_KEY, new Date().toISOString())
    setVisible(false)
  }

  async function saveRole(role) {
    setSavingRole(true)
    setRoleError(null)
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Not signed in')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_role: role }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Save failed (${res.status})`)
      }
      setSelectedRole(role)
      // Refresh the role cache so other pages pick it up immediately
      refreshRole()
      // Advance to next step automatically
      setStep((s) => s + 1)
    } catch (err) {
      setRoleError(err.message)
    } finally {
      setSavingRole(false)
    }
  }

  if (!visible) return null

  const isChampion = plan === 'champion' || isAdmin
  const isPro = plan === 'pro' || plan === 'champion' || isAdmin

  // If they already have a role set, skip the role picker step
  const showRoleStep = !existingRole

  const baseSteps = [
    {
      icon: isAdmin ? 'ðŸ‘‘' : isChampion ? 'ðŸ†' : isPro ? 'âš¡' : 'ðŸŽ¯',
      title: isAdmin
        ? `Welcome back, boss.`
        : isChampion
        ? `Welcome, Champion.`
        : isPro
        ? `Welcome to Pro.`
        : `Welcome to Recon 6.`,
      body: isAdmin
        ? `You have full access to everything plus the admin dashboard. Users, announcements, and backfills live at /admin.`
        : isChampion
        ? `You have the full stack â€” round-by-round VOD breakdowns up to 10 screenshots per session, weekly drill plans built from your own clips, and the desktop coach app once it ships.`
        : isPro
        ? `You've unlocked the round-by-round VOD breakdowns, ban targets, and the read on what the enemy is most likely to do. Most of the site is now open to you.`
        : `You're on the free tier â€” every strat, every callout, every operator. Upgrade anytime to start reviewing your own matches.`,
    },
  ]

  if (showRoleStep) {
    baseSteps.push({
      icon: 'ðŸŽ¯',
      title: 'What do you play?',
      body: `Pick your main role. Recon 6 will highlight the operator in every lineup that matches your playstyle â€” on every map, every site.`,
      rolePicker: true,
    })
  }

  baseSteps.push(
    {
      icon: 'ðŸ—ºï¸',
      title: 'Pick a map, study a site',
      body: `Every R6 ranked map, every site, with operator picks, callouts, and utility plans. Press / on the strats page to jump-search any operator, callout, or map name.`,
    },
    {
      icon: isPro ? 'ðŸŽ¬' : 'ðŸ”’',
      title: isPro ? 'Drop a screenshot, find out what cost you the round' : 'Pro unlocks the round-by-round breakdowns',
      body: isPro
        ? `Paste 1-10 in-match screenshots and get specific feedback on positioning, crosshair placement, utility usage, and decision-making â€” in under 30 seconds.`
        : (() => {
            const promise = foundingPromisePhrase()
            return promise
              ? `Pro is $9/mo ${promise}. Adds round-by-round VOD breakdowns, ban targets, and opponent reads. See pricing on the home page.`
              : `Pro adds round-by-round VOD breakdowns, ban targets, and opponent reads. See pricing on the home page.`
          })(),
    },
  )

  const steps = baseSteps
  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="welcome-overlay" onClick={dismiss}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} className="welcome-close" aria-label="Close">Ã—</button>

        <div className="welcome-icon">{current.icon}</div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>

        {current.rolePicker && (
          <>
            <div className="welcome-role-grid">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`welcome-role-btn${selectedRole === r.id ? ' selected' : ''}`}
                  onClick={() => saveRole(r.id)}
                  disabled={savingRole}
                >
                  <span className="welcome-role-emoji">{r.emoji}</span>
                  <span className="welcome-role-label">{r.label}</span>
                  <span className="welcome-role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
            {roleError && <p className="welcome-role-error">{roleError}</p>}
            <p className="welcome-role-hint">
              You can change this anytime in Account.
            </p>
          </>
        )}

        <div className="welcome-dots">
          {steps.map((_, i) => (
            <span key={i} className={`welcome-dot${i === step ? ' active' : ''}`} />
          ))}
        </div>

        <div className="welcome-actions">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn btn-ghost btn-sm">Back</button>
          )}
          {!last ? (
            current.rolePicker ? (
              <button onClick={() => setStep(step + 1)} className="btn btn-ghost btn-sm">
                {selectedRole ? 'Next' : 'Skip for now'}
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="btn btn-primary btn-sm">Next</button>
            )
          ) : (
            <>
              <button onClick={dismiss} className="btn btn-ghost btn-sm">Skip</button>
              {!isPro && (
                <button type="button" onClick={() => { dismiss(); goToPricing() }} className="btn btn-primary btn-sm">See plans</button>
              )}
              {isPro && !isChampion && (
                <button type="button" onClick={() => { dismiss(); goToPricing() }} className="btn btn-primary btn-sm">Upgrade to Champion</button>
              )}
              {isChampion && !isAdmin && DESKTOP_APP_RELEASED && (
                <Link to="/download" onClick={dismiss} className="btn btn-primary btn-sm">Get desktop app</Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={dismiss} className="btn btn-primary btn-sm">Open admin</Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

