import { useState, useRef, useEffect } from 'react'
import { analyzeSessionApi, retryVodEvidenceApi } from '../api/vodApi'
import { useAuth } from './useAuth'

// VOD analysis hook — supports multi-image sessions with optional context
// hints (game_id, map, side, character) plus session-cap awareness.
//
// Returns the session-shaped response from the rebuilt VOD Lambda:
//   { session, per_image, patterns, practice_plan, character_feedback, usage }
//
// On 429 usage_limit_exceeded, we set errorCode='usage_limit' so the UI can
// show the dedicated over-limit modal with the right upsell + reset date.
// On 200 success the response includes a fresh usage payload — we push it
// into the auth context so the Account page + upload-zone counter update
// without a /me re-fetch.
export function useVodAnalysis() {
  const { user, setVodUsage, captureAuthScope, isAuthScopeCurrent } = useAuth()
  const requestGeneration = useRef(0)
  const [resultOwner, setResultOwner] = useState(user)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [usageError, setUsageError] = useState(null)
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    const requests = requestGeneration
    requests.current++
    setResultOwner(user)
    setAnalysis(null); setLoading(false); setError(null)
    setErrorCode(null); setUsageError(null)
    setSavingEvidence(false); setSaveError(null)
    return () => { requests.current++ }
  }, [user])

  async function analyzeSession(files, context = {}) {
    if (!user) return
    const generation = ++requestGeneration.current
    const scope = captureAuthScope()
    const current = () => generation === requestGeneration.current && isAuthScopeCurrent(scope)
    setResultOwner(user)
    setSavingEvidence(false); setSaveError(null)
    setLoading(true)
    setError(null)
    setErrorCode(null)
    setUsageError(null)
    setAnalysis(null)

    try {
      const result = await analyzeSessionApi(files, context, { isCurrent: current })
      if (!current()) return
      if (result?.error === 'not_siege' || result?.error === 'wrong_game') {
        setError(result.message || "These screenshots don't look like the active game's gameplay.")
        setErrorCode(result.error)
      } else {
        setAnalysis(result)
        // Bump the usage counter in auth context so the UI reflects the
        // newly-spent session immediately (no /me re-fetch needed).
        if (result?.usage && typeof setVodUsage === 'function') {
          setVodUsage(result.usage)
        }
      }
    } catch (err) {
      if (!current()) return
      // Failed processing can still consume a reserved review or prepaid
      // credits. Keep the displayed allowance in step with that response.
      if (err.usage && typeof setVodUsage === 'function') {
        setVodUsage(err.usage)
      }
      // The api helper attaches err.code from the response body when present.
      if (err.code === 'usage_limit_exceeded') {
        setUsageError({
          message: err.message,
          used: err.used,
          limit: err.limit,
          isTrial: err.is_trial,
          periodEnd: err.period_end,
          upgradeUrl: err.upgrade_url,
        })
        setErrorCode('usage_limit')
        setError(err.message || 'You\'ve used all your VOD sessions for this period.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
        setErrorCode(err.code || null)
      }
    } finally {
      if (current()) setLoading(false)
    }
  }

  async function retrySave() {
    if (!user || resultOwner !== user || !analysis?.roadmap_retry || savingEvidence) return
    const generation = ++requestGeneration.current
    const scope = captureAuthScope()
    const current = () => generation === requestGeneration.current && isAuthScopeCurrent(scope)
    setSavingEvidence(true); setSaveError(null)
    try {
      const saved = await retryVodEvidenceApi(analysis)
      if (current()) setAnalysis(saved)
    } catch (err) {
      if (current()) setSaveError(err.message || 'Saving is not confirmed. Retry saving later.')
    } finally {
      if (current()) setSavingEvidence(false)
    }
  }

  async function analyzeScreenshot(file, context = {}) {
    return analyzeSession([file], context)
  }

  function reset() {
    requestGeneration.current++
    setResultOwner(user)
    setSavingEvidence(false); setSaveError(null)
    setAnalysis(null)
    setLoading(false)
    setError(null)
    setErrorCode(null)
    setUsageError(null)
  }

  // Hide the previous identity's state in the very first render after an
  // account change, before effect cleanup runs. Scope guards stop late writes.
  const ownsResult = !!user && resultOwner === user
  return {
    analysis: ownsResult ? analysis : null, loading: ownsResult && loading,
    error: ownsResult ? error : null, errorCode: ownsResult ? errorCode : null,
    usageError: ownsResult ? usageError : null,
    savingEvidence: ownsResult && savingEvidence, saveError: ownsResult ? saveError : null,
    analyzeSession, analyzeScreenshot, retrySave, reset,
  }
}
