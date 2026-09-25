// DynamoDB implementation of the customer-success store (single table, see
// items.mjs for the key layout). Same interface as memoryStore.mjs.
//
// Multi-page reads fail closed: if a scan or query would need more than
// MAX_PAGES pages, it throws instead of returning a silently truncated list.
// A partial read would drop some players' consent and decision records, and
// the outreach run would then treat them as having default consent.

import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const MAX_PAGES = 40

export class StoreLimitError extends Error {
  constructor(what) {
    super(`${what} needs more than ${MAX_PAGES} pages; refusing to return a partial result`)
    this.name = 'StoreLimitError'
  }
}

async function paginate(send, what, log) {
  const items = []
  let ExclusiveStartKey
  let pages = 0
  do {
    const page = await send(ExclusiveStartKey)
    items.push(...(page.Items || []))
    ExclusiveStartKey = page.LastEvaluatedKey
    pages += 1
  } while (ExclusiveStartKey && pages < MAX_PAGES)
  if (ExclusiveStartKey) throw new StoreLimitError(what)
  if (pages > MAX_PAGES / 2) log?.warn?.('cs_store_large_read', { what, pages })
  return items
}

// Optional preconditions for update(): { field: value } requires the stored
// field to equal value; { field: null } requires it to be absent.
function conditionFor(expect, names, values) {
  const parts = []
  Object.entries(expect || {}).forEach(([field, value], i) => {
    names[`#c${i}`] = field
    if (value === null) parts.push(`attribute_not_exists(#c${i})`)
    else {
      values[`:c${i}`] = value
      parts.push(`#c${i} = :c${i}`)
    }
  })
  return parts
}

export function createDynamoStore({ ddb, tableName, typeIndexName = 'gsi1', log = null }) {
  if (!tableName) throw new Error('customer-success table name is required')

  return {
    async listContact(pk) {
      return paginate((ExclusiveStartKey) => ddb.send(new QueryCommand({ TableName: tableName, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk }, ExclusiveStartKey })), 'contact query', log)
    },
    async get(pk, sk) {
      const r = await ddb.send(new GetCommand({ TableName: tableName, Key: { pk, sk } }))
      return r.Item || null
    },
    async put(item, { ifNotExists = false, expectVersion } = {}) {
      const input = { TableName: tableName, Item: item }
      if (ifNotExists) input.ConditionExpression = 'attribute_not_exists(pk)'
      else if (expectVersion !== undefined) {
        input.ConditionExpression = expectVersion === 0 ? 'attribute_not_exists(pk) OR version = :v' : 'version = :v'
        input.ExpressionAttributeValues = { ':v': expectVersion }
      }
      await ddb.send(new PutCommand(input))
      return item
    },
    async update(pk, sk, patch, { mustExist = true, expect = null } = {}) {
      const entries = Object.entries(patch).filter(([k]) => k !== 'pk' && k !== 'sk')
      if (!entries.length) return this.get(pk, sk)
      const names = {}
      const values = {}
      const sets = entries.map(([k, v], i) => {
        names[`#f${i}`] = k
        values[`:v${i}`] = v
        return `#f${i} = :v${i}`
      })
      const conditions = [...(mustExist ? ['attribute_exists(pk)'] : []), ...conditionFor(expect, names, values)]
      const r = await ddb.send(new UpdateCommand({
        TableName: tableName,
        Key: { pk, sk },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ...(conditions.length ? { ConditionExpression: conditions.join(' AND ') } : {}),
        ReturnValues: 'ALL_NEW',
      }))
      return r.Attributes || null
    },
    async listByType(type, { limit = 200, since = null } = {}) {
      const r = await ddb.send(new QueryCommand({
        TableName: tableName,
        IndexName: typeIndexName,
        KeyConditionExpression: since ? 'gsi1pk = :t AND gsi1sk >= :s' : 'gsi1pk = :t',
        ExpressionAttributeValues: since ? { ':t': type, ':s': since } : { ':t': type },
        ScanIndexForward: false,
        Limit: Math.min(Math.max(Number(limit) || 200, 1), 1000),
      }))
      return r.Items || []
    },
    async listAll() {
      return paginate((ExclusiveStartKey) => ddb.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey })), 'table scan', log)
    },
  }
}
