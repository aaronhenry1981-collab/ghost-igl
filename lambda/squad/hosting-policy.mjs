// Privileged configuration only: no HTTP/WS operation can write a hosting grant.
// This policy grants no membership, paid product, AI, billing or CRM capability.
const ID = /^[a-zA-Z0-9_-]{8,100}$/
export const OWNER_POLICY = Object.freeze({ policy: 'owner-v1', maxMembers: 5, maxCommands: 500, maxSessions: 20,
  maxSessionsPerDay: 2, sessionMs: 4 * 3600_000, maxTickets: 40, changesPerSecond: 5, roomReservationBytes: 8 * 1024 * 1024, maxRetainedRooms: 512 })
export function hostingPolicy(record, owner, now) {
  if (!record?.enabled || record.ownerSubject !== owner || !ID.test(record.id || '')) return { error: 403 }
  if (record.kind === 'owner') {
    if (record.policy !== OWNER_POLICY.policy || !Number.isSafeInteger(record.version) || record.version < 1 ||
      ['validUntil','allowedSubjects','maxMembers','maxCommands','maxSessions','sessionMs'].some(key => Object.hasOwn(record,key))) return { error: 503 }
    return { ...record, ...OWNER_POLICY }
  }
  if (!Number.isFinite(record.validUntil) || record.validUntil <= now) return { error: 403 }
  if (!Number.isSafeInteger(record.version) || record.version < 1 || !Number.isInteger(record.maxMembers) || record.maxMembers < 1 || record.maxMembers > 5 || !Number.isInteger(record.maxCommands) || record.maxCommands < 1 || record.maxCommands > 500 || !Number.isInteger(record.maxSessions) || record.maxSessions < 1 || record.maxSessions > 3 || !Number.isFinite(record.sessionMs) || record.sessionMs < 60_000 || record.sessionMs > 3600_000) return { error: 503 }
  if (!Array.isArray(record.allowedSubjects) || !record.allowedSubjects.includes(owner) || new Set(record.allowedSubjects).size !== record.allowedSubjects.length || record.allowedSubjects.length > record.maxMembers || record.allowedSubjects.some(value => typeof value !== 'string' || !ID.test(value))) return { error: 503 }
  return record
}
export const audienceAllows = (grant, subject) => grant.kind === 'owner' ? typeof subject === 'string' && ID.test(subject) : grant.allowedSubjects.includes(subject)
export const sessionEndsAt = (grant, now) => grant.kind === 'owner' ? now + grant.sessionMs : Math.min(now + grant.sessionMs, grant.validUntil)
const period = now => new Date(now).toISOString().slice(0,7)
const day = now => new Date(now).toISOString().slice(0,10)
export function usageForDisplay(grant, used, now) {
  return { sessions: grant.kind === 'owner' && used?.period !== period(now) ? 0 : used?.sessions || 0,
    sessionsToday: grant.kind === 'owner' && used?.day === day(now) ? used?.sessionsToday || 0 : 0,
    activeRoomId: used?.activeUntil > now ? used.activeRoomId : null,
    ...(grant.kind === 'owner' ? { retainedRooms: used?.retainedRooms || 0, reservedBytes: used?.reservedBytes || 0 } : {}) }
}
export function nextSessionUsage(grant, used, now, roomId, expiresAt) {
  if (used && (!Number.isSafeInteger(used.version) || used.version < 1 || !Number.isSafeInteger(used.sessions) || used.sessions < 0 || !Number.isFinite(used.activeUntil) || used.activeUntil < 0 || (grant.kind === 'owner' && (!/^\d{4}-\d{2}$/.test(used.period || '') || !/^\d{4}-\d{2}-\d{2}$/.test(used.day || '') || !Number.isSafeInteger(used.sessionsToday) || used.sessionsToday < 0)))) return null
  // Owner storage counters belong to the verified subject, never a resettable grant id.
  if (grant.kind === 'owner' && used && (!Number.isSafeInteger(used.retainedRooms) || used.retainedRooms < 0 || !Number.isSafeInteger(used.reservedBytes) || used.reservedBytes !== used.retainedRooms * grant.roomReservationBytes)) return null
  const current = usageForDisplay(grant, used, now)
  if (grant.kind === 'owner' && current.retainedRooms >= grant.maxRetainedRooms) return null
  if ((used?.activeUntil || 0) > now || current.activeRoomId || current.sessions >= grant.maxSessions || (grant.kind === 'owner' && current.sessionsToday >= grant.maxSessionsPerDay)) return null
  return { version: (used?.version || 0) + 1, sessions: current.sessions + 1, activeRoomId: roomId, activeUntil: expiresAt,
    ...(grant.kind === 'owner' ? { period: period(now), day: day(now), sessionsToday: current.sessionsToday + 1, retainedRooms: current.retainedRooms + 1, reservedBytes: current.reservedBytes + grant.roomReservationBytes } : {}) }
}
