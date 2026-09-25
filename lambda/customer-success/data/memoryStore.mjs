// In-memory customer-success store with the same semantics as the DynamoDB
// single table (see dynamoStore.mjs): items keyed by pk/sk, conditional puts
// for idempotency, and a type index for cross-contact lists.

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

export class ConditionFailedError extends Error {
  constructor(message = 'condition failed') {
    super(message)
    this.name = 'ConditionalCheckFailedException'
  }
}

export function createMemoryStore(seed = []) {
  const items = new Map()
  const key = (pk, sk) => `${pk}\u0000${sk}`
  for (const item of seed) items.set(key(item.pk, item.sk), clone(item))

  return {
    async listContact(pk) {
      return [...items.values()].filter((item) => item.pk === pk).map(clone)
    },
    async get(pk, sk) {
      return clone(items.get(key(pk, sk)) || null)
    },
    // ifNotExists: fail when the item already exists (idempotent create).
    // expectVersion: optimistic concurrency on `version`.
    async put(item, { ifNotExists = false, expectVersion } = {}) {
      const k = key(item.pk, item.sk)
      const existing = items.get(k)
      if (ifNotExists && existing) throw new ConditionFailedError('item exists')
      if (expectVersion !== undefined && (existing?.version ?? 0) !== expectVersion) throw new ConditionFailedError('version mismatch')
      items.set(k, clone(item))
      return clone(item)
    },
    // expect: { field: value } requires equality; { field: null } requires
    // the field to be absent (same as dynamoStore).
    async update(pk, sk, patch, { mustExist = true, expect = null } = {}) {
      const k = key(pk, sk)
      const existing = items.get(k)
      if (!existing && mustExist) throw new ConditionFailedError('item missing')
      for (const [field, value] of Object.entries(expect || {})) {
        const current = existing?.[field]
        if (value === null ? current !== undefined && current !== null : JSON.stringify(current) !== JSON.stringify(value)) throw new ConditionFailedError(`${field} changed`)
      }
      const next = { ...(existing || { pk, sk }), ...clone(patch) }
      items.set(k, next)
      return clone(next)
    },
    async listByType(type, { limit = 200, since = null } = {}) {
      return [...items.values()]
        .filter((item) => item.gsi1pk === type && (!since || String(item.gsi1sk) >= since))
        .sort((a, b) => String(b.gsi1sk).localeCompare(String(a.gsi1sk)))
        .slice(0, limit)
        .map(clone)
    },
    async listAll() {
      return [...items.values()].map(clone)
    },
  }
}
