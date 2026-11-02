import { applyCommand, createRoom } from './domain.mjs'
// Local simulation only: not authentication, invitations or cross-device sync.
// Production adapter must bind a verified subject and authorize reads and events.
export function createLocalSquadAdapter({ storage, locks, now = Date.now, id = () => crypto.randomUUID() }) {
  const key = roomId => `recon.squad.synthetic.v1.${roomId}`
  const read = roomId => {
    const raw = storage.getItem(key(roomId))
    if (!raw) throw new Error('This local demonstration room was not found on this browser.')
    const room = JSON.parse(raw)
    if (room.id !== roomId || room.schema !== 1) throw new Error('The local snapshot is not supported.')
    return room
  }
  const serial = (roomId, task) => {
    if (!locks?.request) throw new Error('This browser cannot safely serialize demo changes. Use a supported browser.')
    return locks.request(key(roomId), task)
  }
  return {
    kind: 'synthetic_browser_local',
    async create(actor) {
      const roomId = id().replaceAll('-', '').slice(0, 10)
      return serial(roomId, () => {
        if (storage.getItem(key(roomId))) throw new Error('Room code collision. Create a new room.')
        const room = createRoom({ id: roomId, actor, now: now(), inviteExpiresAt: now() + 3600_000 })
        storage.setItem(key(roomId), JSON.stringify(room)); return room
      })
    },
    read(roomId, actor) {
      const room = read(roomId)
      if (!actor?.subject || !room.members[actor.subject]) throw new Error('Join this local demonstration room first.')
      return room
    },
    async dispatch(roomId, actor, command) {
      return serial(roomId, () => {
        const room = applyCommand(read(roomId), command, actor, now())
        storage.setItem(key(roomId), JSON.stringify(room)); return room
      })
    },
  }
}
