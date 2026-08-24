// The Road to Champion curriculum. The old /climb page had the right ideas,
// but presented all 40 objectives as equal self-checked boxes. This structure
// separates knowledge from gameplay and gives the Coach stable IDs for proof.

export const PROGRESS_TIERS = [
  {
    id: 'copper', name: 'Copper', divisions: 'V–I', color: '#b8734c',
    theme: 'Stop losing to the map',
    gate: 'Name the important rooms on three maps and enter behind information.',
    skills: [
      { id: 'settings-locked', kind: 'knowledge', title: 'Lock your settings', action: 'Keep one candidate only after it wins two controlled comparisons.', proof: 'Mechanics Lab records the baseline, one-variable candidate, two wins, and lock date.' },
      { id: 'crosshair-head-height', kind: 'action', title: 'Crosshair at head height', action: 'Pre-aim the next head position before every doorway.', proof: 'Coach sees head-height placement across changing angles.' },
      { id: 'map-foundation', kind: 'knowledge', title: 'Know three ranked maps', action: 'Learn bomb sites, stairs, hatches, and room names on three maps.', proof: 'Complete the map check and use the callouts in play.' },
      { id: 'drone-before-entry', kind: 'action', title: 'Drone before entry', action: 'Get one fresh piece of information before crossing a doorway.', proof: 'Coach sees a drone or confirmed cue immediately before entry.' },
      { id: 'operator-depth', kind: 'knowledge', title: 'Build legal operator depth', action: 'Train twelve operators per side so bans and teammate locks still leave useful choices.', proof: 'Training records at least one completed operator job and the Coach can rank five legal choices.' },
    ],
  },
  {
    id: 'bronze', name: 'Bronze', divisions: 'V–I', color: '#b18a58',
    theme: 'Win the fights you choose',
    gate: 'Warm up consistently and stop donating deaths to wide swings and spawn peeks.',
    skills: [
      { id: 'warmup-routine', kind: 'knowledge', title: 'Run a 10-minute warmup', action: 'Complete all five Mechanics Lab aim lanes before ranked.', proof: 'Mechanics Lab records first-shot, micro-correction, recoil, moving placement, and pressure-transfer work.' },
      { id: 'controlled-peeks', kind: 'action', title: 'Slice the pie', action: 'Clear one angle at a time instead of exposing to the whole room.', proof: 'Coach sees controlled angle isolation instead of a wide swing.' },
      { id: 'lean-discipline', kind: 'action', title: 'Lean on angle checks', action: 'Reduce exposure whenever you clear or hold a doorway.', proof: 'Coach sees repeated lean use on live checks.' },
      { id: 'default-cams', kind: 'knowledge', title: 'Know default cameras', action: 'Learn the cameras that see each approach on your three maps.', proof: 'Complete the camera check for each map.' },
      { id: 'spawn-discipline', kind: 'action', title: 'Respect spawn peeks', action: 'Check the known window or door before crossing open ground.', proof: 'No verified spawn-peek death across the proof window.' },
    ],
  },
  {
    id: 'silver', name: 'Silver', divisions: 'V–I', color: '#b8c4cf',
    theme: 'Play the round, not the kill',
    gate: 'Fewer than three untradeable deaths in your last ten losses.',
    skills: [
      { id: 'objective-priority', kind: 'action', title: 'Objective over kills', action: 'Create the plant or deny it instead of chasing the last gunfight.', proof: 'Coach sees objective action chosen over a chase.' },
      { id: 'trade-spacing', kind: 'action', title: 'Stay tradeable', action: 'Take fights close enough for a teammate to refrag.', proof: 'Death review confirms trade spacing or flags an isolated death.' },
      { id: 'sound-information', kind: 'knowledge', title: 'Turn sound into location', action: 'Associate footsteps, rappel, wire, and reinforcement audio with a place.', proof: 'Pass the sound-cue knowledge check.' },
      { id: 'save-midround-drone', kind: 'action', title: 'Save a mid-round drone', action: 'Keep information available for the 1:30 push.', proof: 'Coach observes drone information used after prep.' },
      { id: 'roam-purpose', kind: 'action', title: 'Roam with a return plan', action: 'Waste time, then return before your team must hold site alone.', proof: 'Coach sees a timely disengage instead of an early solo death.' },
    ],
  },
  {
    id: 'gold', name: 'Gold', divisions: 'V–I', color: '#f2bc45',
    theme: 'Make utility create the fight',
    gate: 'Explain the wall-opening chain and execute it in eight of ten relevant attack rounds.',
    skills: [
      { id: 'utility-sequencing', kind: 'knowledge', title: 'Know utility chains', action: 'Clear denial before committing hard breach.', proof: 'Pass the counter-chain check and execute it in play.' },
      { id: 'default-site-setup', kind: 'knowledge', title: 'Know default site setups', action: 'Place reinforcements, rotates, and gadgets with a reason.', proof: 'Complete a site setup check on your three maps.' },
      { id: 'drone-entry-partner', kind: 'action', title: 'Get droned in', action: 'Let a teammate hold the drone while your gun stays ready.', proof: 'Coach observes entry immediately following teammate information.' },
      { id: 'deny-drones', kind: 'action', title: 'Deny attacker information', action: 'Place denial where drones must travel, not where it looks convenient.', proof: 'Coach sees useful denial or confirms the drone route was closed.' },
      { id: 'ban-with-plan', kind: 'knowledge', title: 'Ban with a plan', action: 'Remove the operator that blocks your intended strategy.', proof: 'Explain how the ban changes the round plan.' },
    ],
  },
  {
    id: 'platinum', name: 'Platinum', divisions: 'V–I', color: '#42d1ca',
    theme: 'Control the information economy',
    gate: 'At least eight of ten reviewed deaths happen with known information, not blind.',
    skills: [
      { id: 'information-discipline', kind: 'action', title: 'Price every push', action: 'Know what is checked, unknown, and worth spending utility to learn.', proof: 'Coach sees a decision change after new information.' },
      { id: 'camera-network', kind: 'knowledge', title: 'Build and clear camera networks', action: 'Create overlapping defensive information and clear it on attack.', proof: 'Complete the network check on three sites.' },
      { id: 'roam-timing', kind: 'action', title: 'Time the roam', action: 'Apply pressure as attackers want to commit, then survive the exit.', proof: 'Coach observes pressure and a timed disengage.' },
      { id: 'flank-control', kind: 'action', title: 'Assign the flank', action: 'Use a player, gadget, or audio cue to own the route behind the push.', proof: 'Coach sees an active flank answer before the commit.' },
      { id: 'recalculate-advantage', kind: 'action', title: 'Recalculate after every pick', action: 'Change pace and risk when the numbers or utility change.', proof: 'Coach sees a decision change tied to a visible pick.' },
    ],
  },
  {
    id: 'emerald', name: 'Emerald', divisions: 'V–I', color: '#48c878',
    theme: 'Make good play repeatable',
    gate: 'One-role season, ten Death Audits, and no sessions played through the three-loss stop.',
    skills: [
      { id: 'role-discipline', kind: 'knowledge', title: 'Specialize your role', action: 'Choose entry, support, flex, IGL, anchor, or roam and own its duties.', proof: 'Select the role and complete its responsibility check.' },
      { id: 'session-discipline', kind: 'action', title: 'Protect the session', action: 'Break after two losses and stop after three.', proof: 'Session history shows the stop rule held.' },
      { id: 'death-audit', kind: 'action', title: 'Run the Death Audit', action: 'Record info, tradeability, value, win condition, and one fix.', proof: 'Complete the audit after ten sessions.' },
      { id: 'stack-system', kind: 'knowledge', title: 'Build a reliable stack', action: 'Define who handles information, breach, flank, and the final call.', proof: 'Save the roles for your regular squad.' },
      { id: 'win-condition', kind: 'action', title: 'State one win condition', action: 'Say the round plan in one sentence before action begins.', proof: 'Coach records a plan and sees play follow it.' },
    ],
  },
  {
    id: 'diamond', name: 'Diamond', divisions: 'V–I', color: '#8fa8ff',
    theme: 'Close the rounds you should win',
    gate: 'Win at least 60% of reviewed late-round advantages across twenty games.',
    skills: [
      { id: 'meta-adaptation', kind: 'knowledge', title: 'Adapt to the current meta', action: 'Use patch and opponent information to change picks and plans.', proof: 'Explain the current counter plan and execute it.' },
      { id: 'clock-management', kind: 'action', title: 'Own the clock', action: 'Begin the attack commit by 1:00; make attackers spend every second on defense.', proof: 'Coach sees timely commits and no avoidable timeouts.' },
      { id: 'post-plant', kind: 'action', title: 'Pre-plan post-plant', action: 'Hold crossfires on the defuser instead of crowding it.', proof: 'Coach observes a protected plant or disciplined retake.' },
      { id: 'anti-strat', kind: 'action', title: 'Read the lineup', action: 'Change the plan when bans, picks, or confirmed operators reveal intent.', proof: 'Coach records a counter-decision tied to visible evidence.' },
      { id: 'peek-craft', kind: 'action', title: 'Use deliberate peek craft', action: 'Quick-peek, shoulder-peek, and prefire only with a reason.', proof: 'Coach sees controlled repetitions without an over-peek death.' },
    ],
  },
  {
    id: 'champion', name: 'Champion', divisions: 'V–I', color: '#ed5c9f',
    theme: 'Maintain the system',
    gate: 'Champion is maintained through adaptation, review, and disciplined training.',
    skills: [
      { id: 'patch-literacy', kind: 'knowledge', title: 'Study every live patch', action: 'Translate balance changes into pick, ban, and setup changes.', proof: 'Complete the patch-impact check.' },
      { id: 'information-mastery', kind: 'action', title: 'Waste less information', action: 'Preserve drones, cams, sound, and utility better than the other team.', proof: 'Recent evidence shows reliable information-led decisions.' },
      { id: 'training-blocks', kind: 'action', title: 'Train in blocks', action: 'Schedule focused sessions instead of unfocused volume.', proof: 'Session log shows deliberate blocks and review.' },
      { id: 'play-up', kind: 'knowledge', title: 'Practice above ranked', action: 'Use scrims or organized five-stacks to expose the next weakness.', proof: 'Log the practice and its one learned adjustment.' },
      { id: 'teach-the-system', kind: 'knowledge', title: 'Teach the doctrine', action: 'Review another player and explain one evidence-backed correction.', proof: 'Complete and save one structured review.' },
    ],
  },
]

export const ALL_PROGRESS_SKILLS = PROGRESS_TIERS.flatMap((tier, tierIndex) =>
  tier.skills.map((skill, skillIndex) => ({ ...skill, tierId: tier.id, tierName: tier.name, tierIndex, skillIndex }))
)

export const PROGRESS_SKILL_IDS = new Set(ALL_PROGRESS_SKILLS.map((skill) => skill.id))

export function findProgressSkill(id) {
  return ALL_PROGRESS_SKILLS.find((skill) => skill.id === id) || null
}

export function evidenceStatus(skill, evidence = {}, checked = false) {
  if (skill.kind === 'knowledge') return checked ? 'confirmed' : 'not-started'
  const recent = Array.isArray(evidence.recent) ? evidence.recent : []
  const last = recent[recent.length - 1]
  const proved = Number(evidence.proved || 0)
  const missed = Number(evidence.missed || 0)
  if (!proved && !missed) return 'not-observed'
  if (last?.result === 'missed' || missed >= Math.max(2, proved)) return 'needs-work'
  if (proved >= 3 && recent.slice(-5).filter((item) => item.result === 'missed').length <= 1) return 'mastered'
  return 'building'
}

export const STATUS_COPY = {
  'not-started': 'Not checked',
  'not-observed': 'Not observed yet',
  'needs-work': 'Needs work',
  building: 'Building proof',
  mastered: 'Proven in gameplay',
  confirmed: 'Knowledge confirmed',
}
