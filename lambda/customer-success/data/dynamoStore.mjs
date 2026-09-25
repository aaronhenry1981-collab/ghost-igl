// DynamoDB implementation of the customer-success store (single table, see
// items.mjs for the key layout). Same interface as memoryStore.mjs.

import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const MAX_PAGES = 40

export function createDynamoStore({ ddb, tableName, typeIndexName = 'gsi1' }) {
  if (!tableName) throw new Error('customer-success table name is required')

  return {
    async listContact(pk) {
      const items = []
      let ExclusiveStartKey
      let pages = 0
      do {
        const page = await ddb.send(new QueryCommand({ TableName: tableName, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk }, ExclusiveStartKey }))
        items.push(...(page.Items || []))
        ExclusiveStartKey = page.LastEvaluatedKey
        pages += 1
      } while (ExclusiveStartKey && pages < MAX_PAGES)
      return items
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
    async update(pk, sk, patch, { mustExist = true } = {}) {
      const entries = Object.entries(patch).filter(([k]) => k !== 'pk' && k !== 'sk')
      if (!entries.length) return this.get(pk, sk)
      const names = {}
      const values = {}
      const sets = entries.map(([k, v], i) => {
        names[`#f${i}`] = k
        values[`:v${i}`] = v
        return `#f${i} = :v${i}`
      })
      const r = await ddb.send(new UpdateCommand({
        TableName: tableName,
        Key: { pk, sk },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ...(mustExist ? { ConditionExpression: 'attribute_exists(pk)' } : {}),
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
      const items = []
      let ExclusiveStartKey
      let pages = 0
      do {
        const page = await ddb.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }))
        items.push(...(page.Items || []))
        ExclusiveStartKey = page.LastEvaluatedKey
        pages += 1
      } while (ExclusiveStartKey && pages < MAX_PAGES)
      return items
    },
  }
}
