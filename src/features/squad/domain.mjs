// Pure squad command model. The prototype adapter supplies a synthetic actor;
// production must supply the verified server principal, never a body subject.
export class SquadError extends Error {
  constructor(code, message) { super(message); this.code = code }
}
const fail = (code, message) => { throw new SquadError(code, message) }
export const OPERATORS = ['Thermite', 'Ace', 'Hibana', 'Thatcher', 'Twitch', 'Zero', 'Sledge', 'Buck', 'Ash', 'Nomad', 'Gridlock', 'Iana']
const any = OPERATORS
const role = (id, name, operators, first, cue, fallback) => ({ id, name, operators, first, cue, fallback })
export const DEMO_PLANS = [
  { id: 'solo', name: 'Solo preparation', complexity: 'Basic', minPlayers: 1, roles: [
    role('observe', 'Observe and decide', any, 'Check the next area before committing.', 'Continue only when the route is understood.', 'Pause and choose a safer approach if information is missing.'),
  ] },
  { id: 'pair', name: 'Two-player coordination', complexity: 'Basic', minPlayers: 2, roles: [
    role('first', 'First action', ['Thermite', 'Ace', 'Hibana'], 'Name your intended first action to your support.', 'Wait for your support to confirm readiness.', 'Hold the action if support cannot help.'),
    role('support', 'Support', ['Thatcher', 'Twitch', 'Zero'], 'Confirm what the first player needs from you.', 'Say ready after you have checked your task.', 'Call a pause if the required utility is unavailable.'),
  ] },
  { id: 'trio', name: 'Three-player coordination', complexity: 'Basic', minPlayers: 3, roles: [
    role('first', 'First action', ['Thermite', 'Ace', 'Hibana'], 'Confirm the intended opening action.', 'Wait for support and information.', 'Hold if a required teammate is not ready.'),
    role('support', 'Utility support', ['Thatcher', 'Twitch', 'Zero'], 'Confirm the utility dependency.', 'Act on the agreed cue.', 'Tell the IGL if the dependency cannot be met.'),
    role('entry', 'Follow-up', ['Sledge', 'Buck', 'Ash'], 'Confirm the safe follow-up route.', 'Follow only after the opening is confirmed.', 'Regroup instead of taking an unsupported route.'),
  ] },
  { id: 'quad', name: 'Four-player coordination', complexity: 'Basic', minPlayers: 4, roles: [
    role('first', 'First action', ['Thermite', 'Ace', 'Hibana'], 'Confirm the intended opening action.', 'Wait for support and information.', 'Hold if a required teammate is not ready.'),
    role('support', 'Utility support', ['Thatcher', 'Twitch', 'Zero'], 'Confirm the utility dependency.', 'Act on the agreed cue.', 'Tell the IGL if the dependency cannot be met.'),
    role('entry', 'Follow-up', ['Sledge', 'Buck', 'Ash'], 'Confirm the safe follow-up route.', 'Follow only after the opening is confirmed.', 'Regroup instead of taking an unsupported route.'),
    role('flank', 'Rear watch', ['Nomad', 'Gridlock'], 'Confirm who is watching the rear.', 'Report a change before leaving the role.', 'Ask for a replacement before moving.'),
  ] },
  { id: 'stack', name: 'Five-player coordination', complexity: 'Advanced', minPlayers: 5, roles: [
    role('first', 'First action', ['Thermite', 'Ace', 'Hibana'], 'Confirm the intended opening action.', 'Wait for support and information.', 'Hold if a required teammate is not ready.'),
    role('support', 'Utility support', ['Thatcher', 'Twitch', 'Zero'], 'Confirm the utility dependency.', 'Act on the agreed cue.', 'Tell the IGL if the dependency cannot be met.'),
    role('entry', 'Follow-up', ['Sledge', 'Buck', 'Ash'], 'Confirm the safe follow-up route.', 'Follow only after the opening is confirmed.', 'Regroup instead of taking an unsupported route.'),
    role('flank', 'Rear watch', ['Nomad', 'Gridlock'], 'Confirm who is watching the rear.', 'Report a change before leaving the role.', 'Ask for a replacement before moving.'),
    role('intel', 'Information', ['Iana', 'Zero', 'Twitch'], 'Report what is confirmed and what is unknown.', 'Give an explicit clear or hold call.', 'Mark lost information as unknown.'),
  ] },
]
// Name-only coordination choices, checked against Ubisoft's map index 2026-11-02.
// Mode availability is confirmed manually; no Ranked-pool or tactical-readiness claim.
// https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps
export const COORDINATION_MAPS = Object.freeze([
  'Bank', 'Border', 'Calypso Casino', 'Chalet', 'Clubhouse', 'Coastline', 'Consulate',
  'Emerald Plains', 'Favela', 'Fortress', 'Hereford Base', 'House', 'Kafe Dostoyevsky',
  'Kanal', 'Lair', 'Nighthaven Labs', 'Oregon', 'Outback', 'Presidential Plane',
  'Skyscraper', 'Stadium Alpha', 'Stadium Bravo', 'Theme Park', 'Tower', 'Villa', 'Yacht',
])
export const PHASES = ['prequeue', 'map_offer', 'round_prep', 'action', 'result']
export const planFor = id => DEMO_PLANS.find(plan => plan.id === id)
export function createRoom({ id, actor, now, inviteExpiresAt }) {
  if (!id || !actor?.subject || !actor.alias?.trim()) fail('IDENTITY', 'A room and an identified player are required.')
  if (!Number.isFinite(now) || !(inviteExpiresAt > now)) fail('EXPIRY', 'The invite needs a future expiry.')
  return { schema: 1, id, revision: 0, owner: actor.subject, igl: actor.subject, iglTerm: 1,
    phase: 'prequeue', phaseEpoch: 1, round: 1, side: 'attack', map: null,
    inviteExpiresAt, inviteRevoked: false, plan: null, planRevision: 0, assignmentRevision: 0,
    members: { [actor.subject]: { subject: actor.subject, alias: actor.alias.trim().slice(0, 30), operator: 'Thermite' } },
    assignments: {}, votes: {}, ready: {}, receipts: [], excluded: [], result: null }
}
export function applyCommand(original, command, actor, now) {
  if (!original || original.schema !== 1 || !actor?.subject) fail('IDENTITY', 'An identified room member is required.')
  if (!command?.requestId || command.requestId.length > 100) fail('REQUEST', 'A bounded request identifier is required.')
  if (original.excluded.includes(actor.subject)) fail('MEMBERSHIP', 'This player was removed from this squad.')
  if (command.type !== 'join' && !original.members[actor.subject]) fail('MEMBERSHIP', 'You are not a member of this squad.')
  const receipt = original.receipts.find(item => item.actor === actor.subject && item.requestId === command.requestId)
  if (receipt) {
    if (receipt.payload !== JSON.stringify(command)) fail('REPLAY', 'This request ID was used for another command.')
    return structuredClone(original)
  }
  const joining = command.type === 'join'
  if (!joining && !original.members[actor.subject]) fail('MEMBERSHIP', 'You are not a member of this squad.')
  if (command.phaseEpoch !== original.phaseEpoch) fail('STALE_PHASE', 'The round or phase changed. Review the latest plan.')
  const iglOnly = ['choose_map', 'select_plan', 'assign', 'lock', 'advance', 'new_round', 'transfer', 'remove', 'revoke_invite', 'record_result']
  if (iglOnly.includes(command.type)) {
    if (actor.subject !== original.igl) fail('IGL_ONLY', 'Only the current IGL can make this decision.')
    if (command.iglTerm !== original.iglTerm) fail('STALE_IGL', 'Leadership changed. Refresh before deciding.')
    if (command.expectedRevision !== original.revision) fail('STALE_REVISION', 'The squad changed. Review it before deciding.')
  }
  const room = structuredClone(original)
  const invalidate = () => { room.ready = {}; room.assignmentRevision++; if (room.plan) room.plan.locked = false }
  switch (command.type) {
    case 'join':
      if (room.members[actor.subject]) break
      if (room.inviteRevoked || now >= room.inviteExpiresAt) fail('INVITE_EXPIRED', 'This invitation is no longer available.')
      if (Object.keys(room.members).length >= 5) fail('FULL', 'This squad already has five players.')
      if (!actor.alias?.trim()) fail('IDENTITY', 'Choose a player alias.')
      room.members[actor.subject] = { subject: actor.subject, alias: actor.alias.trim().slice(0, 30), operator: 'Thatcher' }
      break
    case 'report_operator':
      if (!OPERATORS.includes(command.operator)) fail('OPERATOR', 'Choose an available demonstration operator.')
      if (room.members[actor.subject].operator === command.operator) break
      room.members[actor.subject].operator = command.operator
      invalidate()
      break
    case 'vote':
      if (!planFor(command.planId)) fail('PLAN', 'Choose an available demonstration plan.')
      room.votes[actor.subject] = command.planId
      break
    case 'choose_map':
      if (!COORDINATION_MAPS.includes(command.map)) fail('MAP', 'Choose a listed map and confirm it in your game.')
      if (!['prequeue', 'map_offer', 'result'].includes(room.phase)) fail('PHASE', 'Change maps between rounds or before preparation.')
      room.map = command.map; room.phase = 'round_prep'; room.phaseEpoch++; room.ready = {}
      room.plan = null; room.assignments = {}; room.votes = {}; room.planRevision++; room.assignmentRevision++; room.result = null
      break
    case 'select_plan':
      if (room.phase !== 'round_prep' || !room.map) fail('PHASE', 'Choose a map and open preparation first.')
      if (!planFor(command.planId)) fail('PLAN', 'This plan is unavailable.')
      room.plan = { id: command.planId, version: 'demo.1', locked: false }; room.planRevision++
      room.assignments = {}; invalidate()
      break
    case 'assign': {
      if (room.phase !== 'round_prep' || !room.plan) fail('PHASE', 'Choose a plan during preparation first.')
      const selected = planFor(room.plan.id)?.roles.find(item => item.id === command.roleId)
      const member = room.members[command.memberSubject]
      if (!selected || !member) fail('ASSIGNMENT', 'Choose an existing role and squad member.')
      if (!selected.operators.includes(member.operator)) fail('CAPABILITY', 'This operator does not match the demonstration role.')
      if (Object.entries(room.assignments).some(([key, value]) => key !== selected.id && value === member.subject)) fail('DUPLICATE_ROLE', 'This player already has another role.')
      room.assignments[selected.id] = member.subject; invalidate()
      break
    }
    case 'lock': {
      const selected = planFor(room.plan?.id)
      if (room.phase !== 'round_prep' || !selected) fail('PHASE', 'Choose a plan during preparation first.')
      if (Object.keys(room.members).length < selected.minPlayers) fail('STACK_SIZE', 'This plan needs more players.')
      for (const required of selected.roles) {
        const member = room.members[room.assignments[required.id]]
        if (!member || !required.operators.includes(member.operator)) fail('INCOMPLETE', 'Assign every role to a compatible operator before locking.')
      }
      room.plan.locked = true; room.planRevision++; room.ready = {}
      break
    }
    case 'ready':
      if (!room.plan?.locked || command.planRevision !== room.planRevision || command.assignmentRevision !== room.assignmentRevision) fail('STALE_PLAN', 'Review the current locked role before acknowledging.')
      if (!Object.values(room.assignments).includes(actor.subject)) fail('UNASSIGNED', 'The IGL must assign your role first.')
      room.ready[actor.subject] = { planRevision: room.planRevision, assignmentRevision: room.assignmentRevision }
      break
    case 'transfer':
      if (!room.members[command.memberSubject]) fail('MEMBERSHIP', 'Choose a current squad member.')
      if (command.memberSubject === room.igl) break
      room.igl = command.memberSubject; room.iglTerm++; room.ready = {}
      break
    case 'remove':
      if (!room.members[command.memberSubject] || command.memberSubject === room.igl || command.memberSubject === room.owner) fail('REMOVAL', 'The owner and current IGL cannot be removed here.')
      delete room.members[command.memberSubject]; delete room.votes[command.memberSubject]; room.excluded.push(command.memberSubject)
      for (const [key, value] of Object.entries(room.assignments)) if (value === command.memberSubject) delete room.assignments[key]
      invalidate(); break
    case 'revoke_invite': room.inviteRevoked = true; break
    case 'advance': {
      const index = PHASES.indexOf(room.phase)
      if (room.phase === 'round_prep' && !room.plan?.locked) fail('UNLOCKED', 'Lock a compatible plan before starting action.')
      if (index < 0 || index === PHASES.length - 1 || room.phase === 'map_offer') fail('PHASE', 'Choose the actual map or start the next round.')
      room.phase = PHASES[index + 1]; room.phaseEpoch++; room.ready = {}; break
    }
    case 'new_round':
      if (room.phase !== 'result') fail('PHASE', 'Finish this round before starting another.')
      if (command.side !== undefined && !['attack', 'defense'].includes(command.side)) fail('SIDE', 'Report an attack or defense side.')
      room.round++; room.side = command.side || room.side; room.phase = 'round_prep'; room.phaseEpoch++; room.plan = null; room.assignments = {}; room.votes = {}; room.ready = {}; room.planRevision++; room.assignmentRevision++; room.result = null
      break
    case 'record_result':
      if (room.phase !== 'result' || !['win', 'loss', 'unknown'].includes(command.result)) fail('RESULT', 'Record a result after the round.')
      room.result = { outcome: command.result, source: 'user_reported', round: room.round }; break
    default: fail('COMMAND', 'This command is not supported.')
  }
  room.revision++
  room.receipts.push({ actor: actor.subject, requestId: command.requestId, payload: JSON.stringify(command) })
  if (room.receipts.length > 1000) fail('LIMIT', 'This demonstration room reached its command limit.')
  return room
}
export function myRole(room, subject) {
  if (!room?.members[subject] || !room.plan) return null
  const selected = planFor(room.plan.id)
  return selected?.roles.find(item => room.assignments[item.id] === subject) || null
}
