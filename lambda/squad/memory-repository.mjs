// Transactional fixture repository only. Not a production persistence adapter.
export function createMemoryRepository({ grants = [], now = Date.now } = {}) {
  const rooms = new Map(), receipts = new Map(), creates = new Map(), usage = new Map(), tickets = new Map(), connections = new Map(), profiles = new Map(), observations = new Map(), grantRows = new Map(grants.map(row => [row.ownerSubject, structuredClone(row)]))
  let tail = Promise.resolve()
  const atomic = task => { const result = tail.then(task); tail = result.catch(() => {}); return result }
  const clone = value => value ? structuredClone(value) : null
  return {
    getGrant: async subject => clone(grantRows.get(subject)),
    getUsage: async id => clone(usage.get(id)),
    getRoom: async id => clone(rooms.get(id)),
    getReceipt: async (room, actor, request) => clone(receipts.get(`${room}:${actor}:${request}`)),
    getCreateReceipt: async (owner, request) => clone(creates.get(`${owner}:${request}`)),
    getConnection: async id => clone(connections.get(id)),
    getConnections: async roomId => [...connections.values()].filter(value => value.roomId === roomId && value.status === 'active').map(clone),
    getProfile: async subject => clone(profiles.get(subject)),
    getProfileHistory: async subject => [...(observations.get(subject) || [])].slice(-25).reverse().map(clone),
    createSession: values => atomic(() => {
      const { envelope, grant, createReceipt } = values, currentGrant = grantRows.get(envelope.hostSubject), used = usage.get(grant.id) || { sessions: 0, activeRoomId: null }
      if (!currentGrant?.enabled || currentGrant.version !== grant.version || currentGrant.id !== grant.id || currentGrant.validUntil <= now() || used.sessions >= currentGrant.maxSessions || rooms.has(envelope.id) || creates.has(`${createReceipt.ownerSubject}:${createReceipt.requestId}`)) return false
      if (used.activeRoomId && rooms.get(used.activeRoomId)?.expiresAt > now()) return false
      rooms.set(envelope.id, clone(envelope)); creates.set(`${createReceipt.ownerSubject}:${createReceipt.requestId}`, clone(createReceipt)); usage.set(grant.id, { version: (used.version || 0) + 1, sessions: used.sessions + 1, activeRoomId: envelope.id, activeUntil: envelope.expiresAt }); return true
    }),
    commitRoom: values => atomic(() => {
      const { expectedVersion, next, receipt, grant, ticket, privateProfile } = values, room = rooms.get(next.id), receiptKey = `${next.id}:${receipt.actor}:${receipt.requestId}`, currentGrant = grantRows.get(room?.hostSubject)
      if (!room || room.expiresAt <= now() || !currentGrant?.enabled || currentGrant.version !== grant.version || currentGrant.id !== grant.id || currentGrant.validUntil <= now() || room.commandCount >= currentGrant.maxCommands || room.version !== expectedVersion || receipts.has(receiptKey)) return false
      if (ticket && tickets.has(ticket.hash)) return false
      if (privateProfile && (profiles.get(privateProfile.profile.ownerSubject)?.version || 0) !== privateProfile.previousVersion) return false
      if (privateProfile) {
        const profile = privateProfile.profile; profiles.set(profile.ownerSubject, clone(profile))
        observations.set(profile.ownerSubject, [...(observations.get(profile.ownerSubject) || []), clone(profile)])
      }
      rooms.set(next.id, clone(next)); receipts.set(receiptKey, clone(receipt)); if (ticket) tickets.set(ticket.hash, clone(ticket)); return true
    }),
    admitConnection: (hash, connectionId) => atomic(() => {
      const ticket = tickets.get(hash), room = rooms.get(ticket?.roomId), grant = grantRows.get(room?.hostSubject)
      if (!ticket || ticket.usedAt || ticket.expiresAt <= now() || ticket.authorizationExpiresAt <= now() || !room || room.expiresAt <= now() || !grant?.enabled || grant.id !== room.grantId || grant.validUntil <= now() || !grant.allowedSubjects.includes(ticket.subject) || room.state.excluded.includes(ticket.memberId) || !room.state.members[ticket.memberId] || connections.has(connectionId)) return null
      const active = [...connections.values()].filter(row => row.roomId === room.id && row.memberId === ticket.memberId && row.status === 'active').sort((a, b) => a.connectedAt - b.connectedAt)
      const replaced = active.length >= 2 ? active.slice(0, active.length - 1) : []
      replaced.forEach(row => { row.status = 'superseded' })
      const connection = { connectionId, roomId: room.id, memberId: ticket.memberId, subject: ticket.subject, connectedAt: now(), expiresAt: room.expiresAt, authorizationExpiresAt: ticket.authorizationExpiresAt, status: 'active' }
      ticket.usedAt = now(); connections.set(connectionId, connection)
      return { connection: clone(connection), replaced: replaced.map(row => row.connectionId) }
    }),
    disconnect: id => atomic(() => { const connection = connections.get(id); if (connection) connection.status = 'closed'; return true }),
    // Explicitly fixture-only controls; these must never be exposed as API routes.
    fixture: { setGrant(value) { grantRows.set(value.ownerSubject, clone(value)) }, roomCount: () => rooms.size },
  }
}
