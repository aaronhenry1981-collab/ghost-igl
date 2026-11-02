import { memberIdFor } from './service.mjs'
// SDK command constructors/client are injected so tests never capture a live SDK
// sender. State writes and read-only grant checks share conditional transactions.
export function createDynamoRepository({ client, commands, table, grantsTable = 'recon-squad-grants', now = Date.now }) {
  if (!client || !commands || table !== 'recon-squad-state' || grantsTable !== 'recon-squad-grants') throw new Error('The dedicated squad tables and SDK adapter are required')
  const key = (PK, SK = 'STATE') => ({ PK, SK })
  const roomKey = id => key(`ROOM#${id}`), grantKey = subject => key(`GRANT#${subject}`, 'ACCESS')
  const connectionKey = id => key(`CONNECTION#${id}`)
  const get = async (Key, property, TableName = table) => (await client.send(new commands.GetCommand({ TableName, Key, ConsistentRead: true }))).Item?.[property] || null
  const put = (Key, property, value, condition = 'attribute_not_exists(PK)', names, values) => ({ Put: { TableName: table, Item: { ...Key, [property]: value }, ConditionExpression: condition, ...(names ? { ExpressionAttributeNames: names } : {}), ...(values ? { ExpressionAttributeValues: values } : {}) } })
  function grantCondition(subject, grant) {
    return { ConditionCheck: { TableName: grantsTable, Key: grantKey(subject),
      ConditionExpression: '#g.#v = :v AND #g.#enabled = :yes AND #g.#owner = :owner AND #g.#until > :at',
      ExpressionAttributeNames: { '#g': 'grant', '#v': 'version', '#enabled': 'enabled', '#owner': 'ownerSubject', '#until': 'validUntil' },
      ExpressionAttributeValues: { ':v': grant.version, ':yes': true, ':owner': subject, ':at': now() } } }
  }
  const roomCondition = (previous, next) => put(roomKey(next.id), 'envelope', next,
    '#e.#v = :v AND #e.#until > :at', { '#e': 'envelope', '#v': 'version', '#until': 'expiresAt' }, { ':v': previous, ':at': now() })
  async function transact(items) {
    try { await client.send(new commands.TransactWriteCommand({ TransactItems: items })); return true }
    catch (error) {
      const reasons = error.CancellationReasons || []
      if (error.name === 'TransactionCanceledException' && reasons.length && reasons.some(row => ['ConditionalCheckFailed', 'TransactionConflict'].includes(row.Code)) && reasons.every(row => ['None', 'ConditionalCheckFailed', 'TransactionConflict'].includes(row.Code))) return false
      // A timeout/unknown failure may have committed. Do not treat it as a
      // known failed CAS and blindly submit a new mutation.
      throw error
    }
  }
  async function connectionsFor(id) {
    const result = await client.send(new commands.QueryCommand({ TableName: table,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': `ROOM#${id}`, ':prefix': 'CONN#' }, ConsistentRead: true, Limit: 50 }))
    if (result.LastEvaluatedKey) throw new Error('Connection index exceeded its bounded room limit')
    return (result.Items || []).map(row => row.connection).filter(row => row?.status === 'active')
  }
  return {
    getGrant: subject => get(grantKey(subject), 'grant', grantsTable), getRoom: id => get(roomKey(id), 'envelope'),
    getUsage: id => get(key(`USAGE#${id}`), 'usage'),
    getReceipt: (id, actor, requestId) => get(key(`ROOM#${id}`, `RECEIPT#${actor}#${requestId}`), 'receipt'),
    getCreateReceipt: (owner, requestId) => get(key(`CREATE#${owner}`, `REQUEST#${requestId}`), 'receipt'),
    getConnection: id => get(connectionKey(id), 'connection'), getConnections: connectionsFor,
    getProfile: subject => get(key(`USER#${subject}`, 'PROFILE'), 'profile'),
    async getProfileHistory(subject) {
      const result = await client.send(new commands.QueryCommand({ TableName: table, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)', ExpressionAttributeValues: { ':pk': `USER#${subject}`, ':prefix': 'OBS#' }, ConsistentRead: true, ScanIndexForward: false, Limit: 25 }))
      return (result.Items || []).map(row => row.profile)
    },
    async createSession({ envelope, grant, createReceipt }) {
      const usageKey = key(`USAGE#${grant.id}`), previous = await get(usageKey, 'usage')
      if ((previous?.sessions || 0) >= grant.maxSessions || (previous?.activeUntil || 0) > now()) return false
      const usage = { version: (previous?.version || 0) + 1, sessions: (previous?.sessions || 0) + 1, activeRoomId: envelope.id, activeUntil: envelope.expiresAt }
      return transact([
        grantCondition(envelope.hostSubject, grant), put(roomKey(envelope.id), 'envelope', envelope),
        put(key(`CREATE#${envelope.hostSubject}`, `REQUEST#${createReceipt.requestId}`), 'receipt', createReceipt),
        previous ? put(usageKey, 'usage', usage, '#u.#v = :v', { '#u': 'usage', '#v': 'version' }, { ':v': previous.version }) : put(usageKey, 'usage', usage),
      ])
    },
    async commitRoom({ expectedVersion, next, receipt, grant, ticket, privateProfile }) {
      const items = [grantCondition(next.hostSubject, grant), roomCondition(expectedVersion, next),
        put(key(`ROOM#${next.id}`, `RECEIPT#${receipt.actor}#${receipt.requestId}`), 'receipt', receipt)]
      if (ticket) items.push(put(key(`TICKET#${ticket.hash}`), 'ticket', ticket))
      if (privateProfile) {
        const { profile, previousVersion, requestId } = privateProfile
        items.push(previousVersion ? put(key(`USER#${profile.ownerSubject}`, 'PROFILE'), 'profile', profile, '#p.#v = :v', { '#p': 'profile', '#v': 'version' }, { ':v': previousVersion }) : put(key(`USER#${profile.ownerSubject}`, 'PROFILE'), 'profile', profile))
        items.push(put(key(`USER#${profile.ownerSubject}`, `OBS#${String(profile.version).padStart(12, '0')}#${requestId}`), 'profile', profile))
      }
      return transact(items)
    },
    async admitConnection(hash, connectionId) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const ticket = await get(key(`TICKET#${hash}`), 'ticket')
        if (!ticket || ticket.usedAt || ticket.expiresAt <= now() || ticket.authorizationExpiresAt <= now()) return null
        const room = await get(roomKey(ticket.roomId), 'envelope')
        if (!room || room.expiresAt <= now() || room.state.excluded.includes(ticket.memberId) || !room.state.members[ticket.memberId] || memberIdFor(room.id, ticket.subject) !== ticket.memberId) return null
        const grant = await get(grantKey(room.hostSubject), 'grant', grantsTable)
        if (!grant?.enabled || grant.id !== room.grantId || grant.ownerSubject !== room.hostSubject || grant.validUntil <= now() || !grant.allowedSubjects?.includes(ticket.subject)) return null
        const active = (await connectionsFor(room.id)).filter(row => row.memberId === ticket.memberId).sort((a, b) => a.connectedAt - b.connectedAt)
        const expired = active.filter(row => row.authorizationExpiresAt <= now()), current = active.filter(row => row.authorizationExpiresAt > now())
        const replaced = [...expired, ...(current.length >= 2 ? current.slice(0, current.length - 1) : [])]
        const connection = { connectionId, roomId: room.id, memberId: ticket.memberId, subject: ticket.subject, connectedAt: now(), expiresAt: room.expiresAt, authorizationExpiresAt: ticket.authorizationExpiresAt, status: 'active' }
        const next = { ...room, version: room.version + 1 }
        const items = [grantCondition(room.hostSubject, grant), roomCondition(room.version, next),
          { Update: { TableName: table, Key: key(`TICKET#${hash}`), UpdateExpression: 'SET #t.#used = :at',
            ConditionExpression: 'attribute_exists(PK) AND attribute_not_exists(#t.#used) AND #t.#until > :at',
            ExpressionAttributeNames: { '#t': 'ticket', '#used': 'usedAt', '#until': 'expiresAt' }, ExpressionAttributeValues: { ':at': now() } } },
          put(connectionKey(connectionId), 'connection', connection), put(key(`ROOM#${room.id}`, `CONN#${connectionId}`), 'connection', connection)]
        for (const old of replaced) {
          const closed = { ...old, status: 'superseded' }
          items.push(put(connectionKey(old.connectionId), 'connection', closed, '#c.#s = :active', { '#c': 'connection', '#s': 'status' }, { ':active': 'active' }))
          items.push(put(key(`ROOM#${room.id}`, `CONN#${old.connectionId}`), 'connection', closed, '#c.#s = :active', { '#c': 'connection', '#s': 'status' }, { ':active': 'active' }))
        }
        if (await transact(items)) return { connection, replaced: replaced.map(row => row.connectionId) }
      }
      return null
    },
    async disconnect(id) {
      const connection = await get(connectionKey(id), 'connection')
      if (!connection || connection.status === 'closed') return true
      const closed = { ...connection, status: 'closed' }
      return transact([put(connectionKey(id), 'connection', closed, 'attribute_exists(PK)'), put(key(`ROOM#${connection.roomId}`, `CONN#${id}`), 'connection', closed, 'attribute_exists(PK)')])
    },
  }
}
