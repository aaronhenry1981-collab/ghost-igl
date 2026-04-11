const API_BASE = import.meta.env.VITE_API_URL || ''

export async function analyzeScreenshotApi(file) {
  const formData = new FormData()
  formData.append('screenshot', file)

  const res = await fetch(`${API_BASE}/api/analyze-screenshot`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Analysis failed (${res.status})`)
  }

  return res.json()
}
