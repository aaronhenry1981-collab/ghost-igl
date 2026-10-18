// Leave headroom beneath the HTTP API's verified 30-second integration limit.
// Aborting transport does not prove the provider stopped work or waived cost.
export const REVIEW_REQUEST_BUDGET_MS = 24000

export async function withRequestDeadline(operation, deadline, timers = {}) {
  const now = timers.now || Date.now
  const setTimer = timers.setTimer || setTimeout
  const clearTimer = timers.clearTimer || clearTimeout
  const remaining = deadline - now()
  const timeout = () => Object.assign(new Error('Review request deadline reached'), { name: 'ReviewDeadlineError' })
  if (remaining <= 0) throw timeout()
  const controller = new AbortController()
  let timer
  const expired = new Promise((_, reject) => {
    timer = setTimer(() => { reject(timeout()); controller.abort() }, remaining)
  })
  try {
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), expired])
  } finally {
    clearTimer(timer)
  }
}
