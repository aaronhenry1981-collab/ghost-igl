import { DEMO_PLANS, planFor } from './domain.mjs'

export const STACK_SIZES = Object.freeze([1, 2, 3, 4, 5])
const planIds = ['solo', 'pair', 'trio', 'quad', 'stack']

export function planningSizeFor(room, choice = null) {
  if (choice !== null) {
    if (!STACK_SIZES.includes(choice)) throw new RangeError('Choose 1 to 5 coordinated players.')
    return choice
  }
  return planFor(room?.plan?.id)?.minPlayers || Math.max(1, Object.keys(room?.members || {}).length)
}

// A personal planning preview. This never creates members, assignments or commands.
export function stackPlanning(room, size) {
  if (!STACK_SIZES.includes(size)) throw new RangeError('Choose 1 to 5 coordinated players.')
  const members = Object.values(room?.members || {})
  if (members.length > 5) throw new RangeError('The confirmed roster exceeds five members.')
  const drill = planFor(planIds[size - 1])
  const shared = room?.plan?.id === drill.id
  const roles = drill.roles.map(role => {
    const subject = shared ? room.assignments?.[role.id] : null
    const member = members.find(item => item.subject === subject)
    const compatible = Boolean(member && role.operators.includes(member.operator))
    return { ...role, member: compatible ? member : null, status: compatible ? 'assigned' : member ? 'incompatible' : 'unassigned' }
  })
  const covered = new Set(drill.roles.map(role => role.id === 'observe' ? 'intel' : role.id))
  return {
    size, drill, confirmedCount: members.length,
    missingCoordinated: Math.max(0, size - members.length),
    additionalConfirmed: Math.max(0, members.length - size),
    unconfirmedTeammates: 5 - members.length,
    outsidePlannedStack: 5 - Math.max(size, members.length),
    slots: Array.from({ length: 5 }, (_, index) => members[index]
      ? { kind: 'member', member: members[index] }
      : index < size ? { kind: 'needed', member: null } : { kind: 'unconfirmed', member: null }),
    roles, shared, sharedDrillName: planFor(room?.plan?.id)?.name || null,
    outsideDrill: DEMO_PLANS.find(plan => plan.id === 'stack').roles.filter(role => !covered.has(role.id)),
  }
}
