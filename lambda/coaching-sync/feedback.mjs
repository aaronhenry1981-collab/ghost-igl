const CATEGORIES = new Set(['game-plan', 'live-coach', 'round-review', 'billing', 'account', 'other'])

export function sanitizeFeedback(value) {
  const source = value && typeof value === 'object' ? value : {}
  const category = String(source.category || '').trim().toLowerCase()
  const message = String(source.message || '').trim()
  const numericRating = Number(source.rating)
  const rating = Number.isInteger(numericRating) && numericRating >= 1 && numericRating <= 5 ? numericRating : null
  const page = String(source.page || '').trim().slice(0, 200)

  if (!CATEGORIES.has(category)) return { error: 'choose a feedback category' }
  if (message.length < 10) return { error: 'tell us a little more so we can act on it' }
  if (message.length > 2000) return { error: 'feedback must be 2,000 characters or fewer' }

  return { category, message, rating, page }
}
