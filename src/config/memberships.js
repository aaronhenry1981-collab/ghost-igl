export const PLAN_RANK = Object.freeze({
  free: 0,
  pro: 1,
  elite: 2,
  champion: 3,
})

export const PLAN_LABEL = Object.freeze({
  free: 'Basic',
  pro: 'Pro',
  elite: 'Elite',
  champion: 'Champion',
})

export function normalizePlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_RANK, plan) ? plan : 'free'
}

export function hasPlan(plan, minimum, isAdmin = false) {
  if (isAdmin) return true
  return (PLAN_RANK[normalizePlan(plan)] || 0) >= (PLAN_RANK[minimum] || 0)
}

export function planLabel(plan, isAdmin = false) {
  return isAdmin ? 'CEO' : PLAN_LABEL[normalizePlan(plan)]
}
