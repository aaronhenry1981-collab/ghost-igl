// No background or autoplay promise. Reconnect is explicit and bounded by the
// server's one-time ticket allowance. Every state completion has a local lease.
export function createRoomRealtime({ api, endpoint, socketFactory = url => new WebSocket(url), requestId = () => crypto.randomUUID(), onState, onStatus = () => {}, now = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  let generation = 0, socket, timer, expiry, latest = -1, roomId, memberId, refreshPending = false, desired = -1
  function stop() { generation++; cancel(timer); cancel(expiry); const old = socket; socket = null; if (old) { old.onclose = null; old.close() }; onStatus('Disconnected — reconnect when ready') }
  function accept(value, mine) {
    if (mine !== generation || value.room?.id !== roomId || value.memberId !== memberId || !value.room?.members?.[memberId] || !Number.isSafeInteger(value.revision) || value.revision < latest || !Number.isFinite(value.expiresAt) || value.expiresAt <= now()) return
    latest = value.revision; cancel(expiry); expiry = schedule(() => { if (mine === generation) stop() }, Math.max(0, value.expiresAt - now()))
    onState(value); onStatus('Snapshot synchronized')
  }
  async function refresh(version, mine) {
    desired = Math.max(desired, version)
    if (refreshPending || mine !== generation || desired <= latest) return
    refreshPending = true
    onStatus('Refreshing the latest squad snapshot')
    try {
      // Coalesce notifications. Strong server reads should already include the
      // announced version; cap catch-up attempts rather than loop forever.
      for (let attempt = 0; attempt < 3 && mine === generation && latest < desired; attempt++) accept(await api.snapshot(roomId), mine)
      if (mine === generation && latest < desired) onStatus('Connection is behind — refresh before deciding')
    } catch { if (mine === generation) onStatus('Unable to verify the latest state — refresh before deciding') }
    finally { if (mine === generation) refreshPending = false }
  }
  return {
    stop,
    async start(id) {
      stop(); const mine = generation; roomId = id; latest = -1; desired = -1; refreshPending = false
      onStatus('Connecting to the private squad')
      try {
        const value = await api.socketTicket(id, requestId())
        if (mine !== generation) return
        if (!value.ticket || value.ticketExpiresAt <= now() || !value.memberId) throw new Error('Ticket is unavailable; reconnect explicitly')
        memberId = value.memberId; accept(value, mine)
        const url = new URL(endpoint); if (url.protocol !== 'wss:' || url.search || url.hash || url.username || url.password) throw new Error('The approved socket endpoint is required')
        url.searchParams.set('ticket', value.ticket); socket = socketFactory(url.href); const current = socket
        current.onopen = () => { if (mine !== generation) { current.close(); return }; current.send(JSON.stringify({ type: 'sync', knownRevision: latest })) }
        current.onmessage = event => {
          if (mine !== generation || typeof event.data !== 'string' || event.data.length > 40_000) return
          let message; try { message = JSON.parse(event.data) } catch { onStatus('Invalid update — refresh before deciding'); return }
          if (message.type === 'snapshot') accept(message, mine)
          else if (['room_changed', 'version'].includes(message.type) && message.roomId === roomId && Number.isSafeInteger(message.revision)) refresh(message.revision, mine)
        }
        current.onerror = () => { if (mine === generation) onStatus('Connection unavailable — refresh before deciding') }
        current.onclose = () => { if (mine === generation) { cancel(timer); onStatus('Disconnected — reconnect explicitly') } }
        const heartbeat = () => { if (mine !== generation) return; if (current.readyState === 1) current.send(JSON.stringify({ type: 'ping', knownRevision: latest })); timer = schedule(heartbeat, 30_000) }
        timer = schedule(heartbeat, 30_000)
      } catch { if (mine === generation) onStatus('Private connection unavailable — reconnect explicitly') }
    },
  }
}
