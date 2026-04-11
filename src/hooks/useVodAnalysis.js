import { useState } from 'react'
import { analyzeScreenshotApi } from '../api/vodApi'

// Mock analysis for demo when no backend is configured
function generateMockAnalysis() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        score: 72,
        overview: 'You appear to be holding a post-plant position on the second floor. The operator choice is solid for this site, but your positioning exposes you to multiple angles simultaneously.',
        positioning: 'Your current position gives you a sightline on the doorway, but you\'re exposed to a window peek from your left. Consider repositioning behind the desk for better cover while maintaining the same angle. This reduces the number of angles you need to hold from 3 to 1.',
        crosshair: 'Crosshair placement is slightly low — you\'re aiming at chest level rather than head height. At this distance and angle, raising your crosshair by about 10% would significantly improve your time-to-kill on any peek.',
        utility: 'You still have a reinforcement and a deployable shield available. The shield could be placed in the doorway to force attackers into a predictable vault animation, giving you an easy kill. Don\'t forget to use all your utility before the round gets late.',
        improvements: [
          'Reposition to reduce the number of angles you\'re exposed to',
          'Raise crosshair placement to head level for faster kills',
          'Deploy remaining utility (shield) to strengthen your position',
          'Consider using a camera or intel gadget to watch the flank',
        ],
        strengths: [
          'Good site anchor position with sightline on main entry point',
          'Operator choice is appropriate for this site and role',
          'Health and ammo are in good shape for a late-round hold',
        ],
      })
    }, 8000)
  })
}

export function useVodAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function analyzeScreenshot(file) {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      // Try real API first, fall back to mock demo
      let result
      try {
        result = await analyzeScreenshotApi(file)
      } catch {
        // No backend configured — use mock analysis for demo
        result = await generateMockAnalysis()
      }
      setAnalysis(result)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setAnalysis(null)
    setLoading(false)
    setError(null)
  }

  return { analysis, loading, error, analyzeScreenshot, reset }
}
