import { useState } from 'react'
import { analyzeSessionApi } from '../api/vodApi'
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
  const { setVodUsage } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [usageError, setUsageError] = useState(null)

  async function analyzeSession(files, context = {}) {
    setLoading(true)
    setError(null)
    setErrorCode(null)
    setUsageError(null)
    setAnalysis(null)

    try {
      const result = await analyzeSessionApi(files, context)
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
      setLoading(false)
    }
  }

  async function analyzeScreenshot(file, context = {}) {
    return analyzeSession([file], context)
  }

  function reset() {
    setAnalysis(null)
    setLoading(false)
    setError(null)
    setErrorCode(null)
    setUsageError(null)
  }

  return { analysis, loading, error, errorCode, usageError, analyzeSession, analyzeScreenshot, reset }
}
