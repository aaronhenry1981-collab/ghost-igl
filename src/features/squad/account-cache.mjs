// Optional owner-scoped view cache, never a queue of commands or an auth store.
const PREFIX = 'recon.squad.private-view.v1.'
const subjectKey = subject => {
  if (typeof subject !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(subject)) throw new Error('A verified account subject is required')
  return PREFIX + subject + '.'
}
export function createAccountViewCache({ storage, now = Date.now, maxAgeMs = 15 * 60_000 }) {
  const key = (subject, roomId) => subjectKey(subject) + encodeURIComponent(roomId)
  return {
    save(subject, snapshot) {
      const room = snapshot?.room, memberId = snapshot?.memberId
      if (!room?.id || !memberId || !room.members?.[memberId] || !Number.isSafeInteger(snapshot.revision) || !Number.isFinite(snapshot.expiresAt)) throw new Error('An authorized room snapshot is required')
      // Deliberately whitelist a view. Never persist an invite, token, headers,
      // receipt, full response or a client-supplied identity assertion.
      const view = structuredClone(room); delete view.receipts; delete view.excluded
      const item = { owner: subject, savedAt: now(), until: Math.min(snapshot.expiresAt, now() + maxAgeMs),
        snapshot: { room: view, memberId, revision: snapshot.revision, expiresAt: snapshot.expiresAt } }
      storage.setItem(key(subject, room.id), JSON.stringify(item))
    },
    read(subject, roomId) {
      const name = key(subject, roomId)
      try {
        const raw = storage.getItem(name)
        if (!raw) return null
        const item = JSON.parse(raw)
        if (item.owner !== subject || !Number.isFinite(item.savedAt) || !Number.isFinite(item.until) || !Number.isFinite(item.snapshot?.expiresAt) || item.savedAt > now() || item.until > item.savedAt + maxAgeMs || item.until > item.snapshot.expiresAt || item.until <= now() || item.snapshot?.room?.id !== roomId || !item.snapshot.room.members?.[item.snapshot.memberId]) { storage.removeItem(name); return null }
        return { ...item.snapshot, offline: true, stale: true, savedAt: item.savedAt }
      } catch { storage.removeItem(name); return null }
    },
    clear(subject) {
      const prefix = subjectKey(subject), names = []
      for (let i = 0; i < storage.length; i++) { const name = storage.key(i); if (name?.startsWith(prefix)) names.push(name) }
      names.forEach(name => storage.removeItem(name))
    },
  }
}
