import { useId, useState } from 'react'
import { RANKS } from '../../data/ranks'
import { API_URL } from '../../lib/cognito'
import { currentIdToken } from '../../lib/customerSuccess'

// Inline rank + goal editor. Merges into the existing game_profiles_json so
// other saved R6 details (role, Ubisoft name) are never overwritten.
export default function RankGoalEditor({ profile, onSaved, onCancel, preview = false }) {
  const current = profile?.game_profiles?.r6 || {}
  const [rank, setRank] = useState(current.rank || '')
  const [goal, setGoal] = useState(current.goal_rank || '')
  const [state, setState] = useState({ saving: false, error: null })
  const rankId = useId()
  const goalId = useId()
  const errorId = useId()

  async function save(event) {
    event.preventDefault()
    if (!rank || !goal) {
      setState({ saving: false, error: 'Pick both your current rank and your goal.' })
      return
    }
    if (preview) {
      onSaved?.()
      return
    }
    setState({ saving: true, error: null })
    try {
      const games = profile?.game_profiles && typeof profile.game_profiles === 'object' ? profile.game_profiles : {}
      const next = { ...games, r6: { ...(games.r6 || {}), rank, goal_rank: goal } }
      const token = await currentIdToken()
      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_profiles_json: JSON.stringify(next) }),
      })
      if (!res.ok) throw new Error('Could not save your rank. Try again.')
      await onSaved?.()
    } catch (err) {
      setState({ saving: false, error: err.message })
    }
  }

  return (
    <form className="ph-rank-editor" onSubmit={save} aria-describedby={state.error ? errorId : undefined}>
      <div className="ph-field">
        <label htmlFor={rankId}>Current rank</label>
        <select id={rankId} value={rank} onChange={(e) => setRank(e.target.value)}>
          <option value="">Select</option>
          {RANKS.map((r) => <option key={r.order} value={r.label}>{r.label}</option>)}
        </select>
      </div>
      <div className="ph-field">
        <label htmlFor={goalId}>Goal</label>
        <select id={goalId} value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="">Select</option>
          {RANKS.map((r) => <option key={r.order} value={r.label}>{r.label}</option>)}
        </select>
      </div>
      {state.error && <p id={errorId} className="ph-error" role="alert">{state.error}</p>}
      <div className="ph-card-foot">
        <button type="submit" className="btn btn-primary btn-sm" disabled={state.saving}>{state.saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
