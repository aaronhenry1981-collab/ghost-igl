// Road to Champion (/climb) catalog and progress summary.
//
// The static /climb page owns the checklist and stores progress as
// `{ checks: { "<tierId>-<taskIndex>": true }, open: { ... } }` in the
// recon6-climb-progress table. This file mirrors that page's tiers so the home
// and CRM can summarise real progress. `roadToChampion.test.mjs` parses
// public/climb/index.html and fails if the two drift apart.

export const CLIMB_TIERS = Object.freeze([
  {
    id: 'copper',
    rank: 'Copper',
    theme: 'Foundation — stop losing to the map',
    tasks: ['Lock your settings once', 'Crosshair lives at head height', 'Learn 3 ranked maps in custom game', 'Drone before you walk', 'Run a 4-operator pool'],
  },
  {
    id: 'bronze',
    rank: 'Bronze',
    theme: 'Mechanics — win the fights you take',
    tasks: ['10-minute warmup, every session', 'Slice the pie', 'Lean is a way of life', 'Learn the default cams', 'Respect the spawn peek'],
  },
  {
    id: 'silver',
    rank: 'Silver',
    theme: 'Game sense — play the round, not the kill',
    tasks: ['Objective over kills', 'Never fight alone', 'Sound is free intel', 'Save a drone for mid-round', 'Learn basic roaming'],
  },
  {
    id: 'gold',
    rank: 'Gold',
    theme: 'Utility — the gadget game begins',
    tasks: ['Learn the utility chains', 'Run default site setups', 'Get droned in', 'Deny their drones', 'Ban with a plan'],
  },
  {
    id: 'plat',
    rank: 'Platinum',
    theme: 'Information economy — the Champion doctrine starts here',
    tasks: ['Treat info as currency', 'Master the cam network', 'Time your roams', 'Watch the flank', 'Read the killfeed like a book'],
  },
  {
    id: 'emerald',
    rank: 'Emerald',
    theme: 'Consistency — the mental tier',
    tasks: ['Specialize your role', 'Hard session rules', 'Mandatory Death Audit', 'Build your stack', 'One win condition per round'],
  },
  {
    id: 'diamond',
    rank: 'Diamond',
    theme: 'Champion prep — close rounds, play the meta',
    tasks: ['Play the meta, not your feelings', 'Own the clock', 'Master post-plant', 'Anti-strat the lobby', 'Sharpen the peek'],
  },
  {
    id: 'champ',
    rank: 'Champion',
    theme: 'The 0.4% — hold the line',
    tasks: ['Study patch notes like a textbook', 'Information economy, mastered', 'Protect the rank', 'Scrim above your level', 'Give it back'],
  },
])

export const CLIMB_TASK_TOTAL = CLIMB_TIERS.reduce((sum, tier) => sum + tier.tasks.length, 0)

// Map a player-reported rank ("Gold II", "platinum", "Champion") to a tier.
export function tierIdForRank(rank) {
  const value = String(rank || '').trim().toLowerCase()
  if (!value) return null
  if (value.startsWith('champ')) return 'champ'
  if (value.startsWith('plat')) return 'plat'
  const match = CLIMB_TIERS.find((tier) => value.startsWith(tier.id) || value.startsWith(tier.rank.toLowerCase()))
  return match ? match.id : null
}

// Summarise a saved progress blob. Returns null when nothing has been saved,
// so callers can show an honest "not started" state instead of 0% progress.
export function summarizeRoadToChampion(progress, { updatedAt = null, playerRank = null } = {}) {
  const checks = progress && typeof progress === 'object' && progress.checks && typeof progress.checks === 'object'
    ? progress.checks
    : null
  if (!checks) return null

  const tiers = CLIMB_TIERS.map((tier) => {
    const done = tier.tasks.reduce((count, _task, index) => count + (checks[`${tier.id}-${index}`] === true ? 1 : 0), 0)
    const nextIndex = tier.tasks.findIndex((_task, index) => checks[`${tier.id}-${index}`] !== true)
    return {
      id: tier.id,
      rank: tier.rank,
      theme: tier.theme,
      done,
      total: tier.tasks.length,
      complete: done === tier.tasks.length,
      nextTask: nextIndex === -1 ? null : tier.tasks[nextIndex],
    }
  })

  const tasksDone = tiers.reduce((sum, tier) => sum + tier.done, 0)
  if (tasksDone === 0 && !updatedAt) return null

  // Focus on the player's own rank tier while it is unfinished; otherwise the
  // first unfinished tier from the bottom. That matches how the page teaches.
  const rankTierId = tierIdForRank(playerRank)
  const rankTier = rankTierId ? tiers.find((tier) => tier.id === rankTierId && !tier.complete) : null
  const currentTier = rankTier || tiers.find((tier) => !tier.complete) || null

  return {
    tasksDone,
    tasksTotal: CLIMB_TASK_TOTAL,
    tiersComplete: tiers.filter((tier) => tier.complete).length,
    tiersTotal: tiers.length,
    currentTier,
    allComplete: tasksDone === CLIMB_TASK_TOTAL,
    tiers,
    updatedAt,
  }
}
