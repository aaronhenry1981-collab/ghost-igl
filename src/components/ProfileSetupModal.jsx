import { useState } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useAuth } from '../hooks/useAuth'
import { getRefSource, clearRefSource } from '../lib/refSource'
import { RANKS } from '../data/ranks' // single source of truth — all 40 R6 ranks w/ divisions

// First-login profile setup. Collects identity fields Aaron needs to know
// who his customers are when emailing them — display name, platform, region,
// referral source — plus optional R6-specific fields (rank, role, gamer tag,
// goal rank). Everything is saved to ghost-igl-profiles via PUT /me.
//
// Shown by AppShell when:
//   - user is signed in AND profile_complete is false AND user hasn't dismissed
//
// User CAN skip — saved as a localStorage flag to suppress for the session.
// They get a banner reminder elsewhere later.

const PLATFORMS = [
  { id: 'pc', label: 'PC' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'ps5', label: 'PlayStation' },
]
const REGIONS = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'sa', label: 'South America' },
  { id: 'apac', label: 'Asia / Pacific' },
  { id: 'oce', label: 'Oceania' },
]
const REFERRAL_SOURCES = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'discord', label: 'Discord' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'friend', label: 'A friend' },
  { id: 'google', label: 'Google search' },
  { id: 'streamer', label: 'A streamer' },
  { id: 'other', label: 'Other' },
]
const R6_ROLES = [
  { id: 'anchor', label: 'Anchor (defense, hold site)' },
  { id: 'roamer', label: 'Roamer (defense, off-site flank)' },
  { id: 'hard-breach', label: 'Hard Breach (attack, open walls)' },
  { id: 'support', label: 'Support (attack, utility clear)' },
  { id: 'entry', label: 'Entry Frag (attack, take first contact)' },
  { id: 'flex', label: 'Flex (no fixed role)' },
]

const SKIP_KEY = 'ghost-igl:profile-skip'

export default function ProfileSetupModal() {
  const { user, profile, profileComplete, loading, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [skipped, setSkipped] = useState(() => {
    try { return sessionStorage.getItem(SKIP_KEY) === '1' } catch { return false }
  })

  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    platform: profile?.platform || '',
    region: profile?.region || '',
    discord_username: profile?.discord_username || '',
    // Prefill from the captured ?ref= channel (see lib/refSource.js) — the
    // user can still change it; their explicit answer wins on save.
    referral_source: profile?.referral_source || getRefSource() || '',
    // R6-specific
    r6_rank: profile?.game_profiles?.r6?.rank || '',
    r6_goal_rank: profile?.game_profiles?.r6?.goal_rank || '',
    r6_main_role: profile?.game_profiles?.r6?.main_role || '',
    r6_ubisoft_username: profile?.game_profiles?.r6?.ubisoft_username || '',
  })

  // Don't render if not signed in, still loading, profile already complete,
  // or user dismissed for the session.
  if (loading || !user || profileComplete || skipped) return null

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }))
    setError(null)
  }

  async function save() {
    setError(null)
    if (!form.display_name.trim()) {
      setError('Display name is required so we know what to call you.')
      setStep(1)
      return
    }
    if (!form.platform) {
      setError('Pick a platform so we can tailor advice.')
      setStep(1)
      return
    }

    setSubmitting(true)
    try {
      const cognitoUser = getCurrentUser()
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)

      // Build game_profiles_json from R6-specific fields.
      const gameProfiles = { r6: {} }
      if (form.r6_rank) gameProfiles.r6.rank = form.r6_rank
      if (form.r6_goal_rank) gameProfiles.r6.goal_rank = form.r6_goal_rank
      if (form.r6_main_role) gameProfiles.r6.main_role = form.r6_main_role
      if (form.r6_ubisoft_username.trim()) gameProfiles.r6.ubisoft_username = form.r6_ubisoft_username.trim()

      const body = {
        display_name: form.display_name.trim(),
        platform: form.platform,
        region: form.region || null,
        discord_username: form.discord_username.trim() || null,
        referral_source: form.referral_source || null,
        game_profiles_json: JSON.stringify(gameProfiles),
      }

      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      // Auto-grant 7-day Pro trial on first profile setup. Best-effort —
      // ignore errors (user already had a trial, or endpoint not yet deployed)
      // so we don't block the profile save flow on the trial grant.
      try {
        await fetch(`${API_URL}/me/start-trial`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (trialErr) {
        console.warn('Trial grant failed (non-fatal):', trialErr)
      }
      // Attribution landed with the profile save — drop the stored channel
      // so ReferralAttributor doesn't re-send it.
      if (form.referral_source) clearRefSource()
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'Could not save profile. Try again.')
      setSubmitting(false)
    }
  }

  function skip() {
    try { sessionStorage.setItem(SKIP_KEY, '1') } catch { /* ignore */ }
    setSkipped(true)
  }

  return (
    <div
      role="dialog"
      aria-labelledby="profile-setup-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        maxWidth: 540, width: '100%',
        background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '1.75rem',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(230,233,239,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Quick setup · Step {step} of 2
            </div>
            <h2 id="profile-setup-title" style={{ margin: 0, fontSize: '1.5rem' }}>
              {step === 1 ? 'Welcome to Recon 6' : 'Your gamer setup'}
            </h2>
          </div>
          <button onClick={skip} className="btn btn-sm btn-ghost" style={{ flexShrink: 0 }}>
            Skip for now
          </button>
        </div>

        <p style={{ color: 'rgba(230,233,239,0.7)', fontSize: '0.9rem', margin: '0.5rem 0 0.75rem' }}>
          {step === 1
            ? "We use this to personalize content and know what to call you in emails. Takes 30 seconds."
            : "Tell us about your setup so the strats and VOD breakdowns match your rank and role. You can update this anytime from Account."}
        </p>
        {step === 2 && (
          <div style={{
            padding: '0.75rem 1rem', marginBottom: '1.25rem',
            background: 'rgba(80,200,120,0.08)', border: '1px solid rgba(80,200,120,0.4)',
            borderRadius: 8, fontSize: '0.85rem', color: '#7ee2a4',
          }}>
            <strong>Bonus:</strong> finishing setup unlocks a free 7-day Pro trial — round-by-round VOD breakdowns, no credit card.
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,90,90,0.12)', border: '1px solid #ff5a5a', color: '#ff8a8a', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <Field label="Display name" required>
              <input type="text" value={form.display_name} onChange={(e) => setField('display_name', e.target.value)} placeholder="What should we call you?" maxLength={60} className="testi-input" autoFocus />
            </Field>
            <Field label="Platform" required>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {PLATFORMS.map(p => (
                  <button
                    key={p.id} type="button"
                    onClick={() => setField('platform', p.id)}
                    className={`btn ${form.platform === p.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.6rem' }}
                  >{p.label}</button>
                ))}
              </div>
            </Field>
            <Field label="Region (optional)">
              <select value={form.region} onChange={(e) => setField('region', e.target.value)} className="testi-input">
                <option value="">Skip</option>
                {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="How did you find Recon 6? (optional)">
              <select value={form.referral_source} onChange={(e) => setField('referral_source', e.target.value)} className="testi-input">
                <option value="">Skip</option>
                {REFERRAL_SOURCES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Discord username (optional)">
              <input type="text" value={form.discord_username} onChange={(e) => setField('discord_username', e.target.value)} placeholder="@yourtag" maxLength={40} className="testi-input" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <Field label="Current R6 rank (optional)">
              <select value={form.r6_rank} onChange={(e) => setField('r6_rank', e.target.value)} className="testi-input">
                <option value="">Skip</option>
                {RANKS.map(r => <option key={r.order} value={r.label}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Goal rank (optional)">
              <select value={form.r6_goal_rank} onChange={(e) => setField('r6_goal_rank', e.target.value)} className="testi-input">
                <option value="">Skip</option>
                {RANKS.map(r => <option key={r.order} value={r.label}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Main role (optional)">
              <select value={form.r6_main_role} onChange={(e) => setField('r6_main_role', e.target.value)} className="testi-input">
                <option value="">Skip</option>
                {R6_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Ubisoft username (optional — unlocks stat-based feedback later)">
              <input type="text" value={form.r6_ubisoft_username} onChange={(e) => setField('r6_ubisoft_username', e.target.value)} placeholder="Splinter2581" maxLength={40} className="testi-input" />
            </Field>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.5rem' }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="btn btn-outline" disabled={submitting}>
              ← Back
            </button>
          ) : <span />}
          {step === 1 ? (
            <button
              onClick={() => {
                if (!form.display_name.trim()) { setError('Display name is required.'); return }
                if (!form.platform) { setError('Pick a platform.'); return }
                setError(null); setStep(2)
              }}
              className="btn btn-primary"
            >
              Continue →
            </button>
          ) : (
            <button onClick={save} className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save & continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
      <span style={{ color: 'rgba(230,233,239,0.75)' }}>
        {label}{required && <span style={{ color: '#ff8a8a', marginLeft: 4 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
