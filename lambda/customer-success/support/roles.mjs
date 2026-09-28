// Support roles and permissions (docs/player-success/ARCHITECTURE.md §5).
//
// Roles come ONLY from verified Cognito groups on the identity that
// lib/auth.mjs produced from a verified ID token. Nothing in a request body,
// header or query can add a role. `isAdmin` is itself derived from the
// `admins` group by lib/auth.mjs, so it is treated as that group.
//
// Unknown actions are refused (fail closed).

export const ROLES = Object.freeze(['player', 'agent', 'billing', 'engineering', 'lead', 'admin'])
export const STAFF_ROLES = Object.freeze(['agent', 'billing', 'engineering', 'lead', 'admin'])

// Cognito group -> roles it grants. Future groups map without code change
// elsewhere: add a row here.
export const GROUP_ROLES = Object.freeze({
  admins: Object.freeze([...ROLES]),
  'support-agent': Object.freeze(['agent']),
  'support-billing': Object.freeze(['agent', 'billing']),
  'support-engineering': Object.freeze(['agent', 'engineering']),
  'support-lead': Object.freeze(['agent', 'billing', 'engineering', 'lead']),
})

export function rolesFor(identity) {
  if (!identity?.email) return []
  const roles = new Set(['player'])
  const groups = Array.isArray(identity.groups) ? [...identity.groups] : []
  if (identity.isAdmin === true) groups.push('admins')
  for (const group of groups) for (const role of GROUP_ROLES[group] || []) roles.add(role)
  return ROLES.filter((r) => roles.has(r))
}

export const isStaff = (roles) => roles.some((r) => STAFF_ROLES.includes(r))

const STAFF = STAFF_ROLES
const LEAD = Object.freeze(['lead', 'admin'])
const BILLING = Object.freeze(['billing', 'lead', 'admin'])
const ENGINEERING = Object.freeze(['engineering', 'lead', 'admin'])

// action -> roles that may perform it. `admin` holds every role, so it is
// listed explicitly only for readability.
export const PERMISSIONS = Object.freeze({
  // player
  'case.create_own': ['player'],
  'case.read_own': ['player'],
  'case.message_own': ['player'],
  'case.csat_own': ['player'],
  // staff: cases
  'queue.read': STAFF,
  'case.read': STAFF,
  'case.reply': STAFF,
  'case.note': STAFF,
  'case.status': STAFF,
  'case.assign': STAFF,
  'case.escalate': STAFF,
  'case.link_incident': STAFF,
  'case.resolve': STAFF,
  'diagnostics.staff': STAFF,
  'diagnostics.technical': ENGINEERING,
  // Full Stripe references; everyone else sees the last 4 characters.
  'billing.refs.full': BILLING,
  // sensitive actions (§6)
  'action.request': STAFF,
  'action.request.billing': BILLING,
  'action.authorize': LEAD,
  'action.reject': LEAD,
  'action.record_done': BILLING,
  // incidents
  'incident.read': STAFF,
  'incident.write': LEAD,
  // reporting and knowledge base
  'metrics.read': LEAD,
  'kb.read': STAFF,
  'kb.decide': LEAD,
  // inbound email review
  'email.unmatched.read': STAFF,
  'email.unmatched.assign': STAFF,
  // proactive care
  'proactive.run': LEAD,
  // maintenance sweeps (auto-close of resolved cases)
  'maintenance.run': LEAD,
})

export function can(roles, action) {
  const allowed = PERMISSIONS[action]
  if (!allowed || !Array.isArray(roles)) return false
  return roles.some((r) => allowed.includes(r))
}
