import { createHash } from 'node:crypto'
const hash = value => createHash('sha256').update(value).digest('hex')
export function createWebsocketService({ apiId, repo, service, transport }) {
  if (!apiId || !repo || !service || !transport) throw new Error('The exact WebSocket API and authorized dependencies are required')
  async function close(connectionId) {
    await repo.disconnect(connectionId)
    try { await transport.close(connectionId); return true } catch { return false }
  }
  async function post(connectionId, message) {
    try { await transport.post(connectionId, message); return true }
    catch (error) { if ((error.status || error.$metadata?.httpStatusCode) === 410) await close(connectionId); return false }
  }
  return {
    async handler(event) {
      const context = event?.requestContext, id = context?.connectionId
      if (context?.apiId !== apiId || typeof id !== 'string' || !/^[a-zA-Z0-9_=-]{1,128}$/.test(id)) return { statusCode: 403, body: 'Unknown connection' }
      try {
        if (context.routeKey === '$connect') {
          const ticket = event.queryStringParameters?.ticket
          if (typeof ticket !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(ticket) || Object.keys(event.queryStringParameters || {}).some(key => key !== 'ticket')) return { statusCode: 403, body: 'Ticket unavailable' }
          const admitted = await repo.admitConnection(hash(ticket), id)
          if (!admitted) return { statusCode: 403, body: 'Ticket unavailable' }
          for (const replaced of admitted.replaced) await close(replaced)
          return { statusCode: 200, body: 'Connected' }
        }
        if (context.routeKey === '$disconnect') { await repo.disconnect(id); return { statusCode: 200, body: 'Disconnected' } }
        if (context.routeKey !== '$default' || event.isBase64Encoded || Buffer.byteLength(event.body || '') > 1024) { await close(id); return { statusCode: 400, body: 'Unsupported message' } }
        let message
        try { message = JSON.parse(event.body || '{}') } catch { await close(id); return { statusCode: 400, body: 'Invalid message' } }
        if (!message || !['sync', 'ping'].includes(message.type) || Object.keys(message).some(key => !['type', 'knownRevision'].includes(key)) || (message.knownRevision !== undefined && (!Number.isSafeInteger(message.knownRevision) || message.knownRevision < 0))) { await close(id); return { statusCode: 400, body: 'Unsupported message' } }
        const snapshot = await service.connectionSnapshot(id)
        const value = message.type === 'sync' ? { type: 'snapshot', ...snapshot } : { type: 'version', roomId: snapshot.room.id, revision: snapshot.revision, expiresAt: snapshot.expiresAt }
        return { statusCode: await post(id, value) ? 200 : 503, body: 'Refresh your current snapshot if delivery is uncertain' }
      } catch (error) {
        if ([401, 403, 404, 410].includes(error.status)) await close(id)
        return { statusCode: error.status || 500, body: 'Connection unavailable' }
      }
    },
    async broadcastRoom(roomId) {
      const connections = await repo.getConnections(roomId), result = { delivered: 0, skipped: 0, uncertain: 0 }
      for (const connection of connections) {
        try {
          // Read current authorization for each delivery; never trust a cached
          // membership list captured when the socket first connected.
          const snapshot = await service.connectionSnapshot(connection.connectionId)
          if (await post(connection.connectionId, { type: 'room_changed', roomId, revision: snapshot.revision })) result.delivered++
          else result.uncertain++
        } catch (error) {
          if ([401, 403, 404, 410].includes(error.status)) { await close(connection.connectionId); result.skipped++ }
          else result.uncertain++
        }
      }
      return result
    },
  }
}
