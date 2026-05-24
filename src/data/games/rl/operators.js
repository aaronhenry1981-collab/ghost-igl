// Rocket League — 6 role archetypes. RL doesn't have characters; the
// "cast" is the position you play in a given game state. Knowing which
// role you're in at any moment is the single biggest gap between Gold
// and Champion-tier play.

const CAST = [
  {
    id: 'first-man',
    name: '1st Man',
    role: 'Pressure / Challenger',
    kit: [
      'Closest to the ball — challenges the opponent or strikes',
      'Reads commit windows: when to engage vs fake',
      'Takes the first 50/50 — wins or sets up the bump for teammate',
      'Boost target: 30-50 (enough to challenge, not enough to over-commit)',
    ],
  },
  {
    id: 'second-man',
    name: '2nd Man',
    role: 'Support / Boost Manager',
    kit: [
      'Mid-position, ready to follow up the 1st man challenge',
      'Picks up the loose ball after a 50',
      'Trails the play at ~75% speed, never bumping into 1st',
      'Boost target: 50-80 — needs to convert if 1st man wins',
    ],
  },
  {
    id: 'third-man',
    name: '3rd Man / Last Back',
    role: 'Goalkeeper / Cover',
    kit: [
      'Defensive anchor — covers the backboard at all times',
      'Reads aerial threats and pre-positions for the save',
      'Never leaves the back unless 1st AND 2nd man are committed',
      'Boost target: 60+ — needs to clear, not just save',
    ],
  },
  {
    id: 'striker',
    name: 'Striker (Aggressive Lead)',
    role: 'Goal scorer / Air dribbler',
    kit: [
      'Highest mechanical skill — flicks, air dribbles, double-touches',
      'Plays the most boost-hungry role on the team',
      'Best on small boost pads — minimizes time off the ball',
      'Pairs with a defensive 2nd man who covers when they over-commit',
    ],
  },
  {
    id: 'goalie',
    name: 'Defensive Goalie',
    role: 'Save / Clear / Reset',
    kit: [
      'Specializes in shadow defense and backboard clears',
      'Always within ball-recovery distance of the net',
      'Best at reading aerial trajectories early',
      'Pairs with two aggressive teammates who can finish off the cleared ball',
    ],
  },
  {
    id: 'igl',
    name: 'IGL (Caller)',
    role: 'Communication / Rotation',
    kit: [
      'Calls "rotating," "boost," "challenge," "fake" every play',
      'Reads opponent comp and adjusts rotation speed',
      'Calls timeouts/freeplay between goals',
      'Usually plays 2nd man so they see the whole field',
    ],
  },
]

export default CAST
