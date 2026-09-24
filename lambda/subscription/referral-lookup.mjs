// DynamoDB Scan Limit applies before FilterExpression, not after it.
// Empty pages can still have a continuation key and must not end lookup.
export async function findReferralProfile(scanPage, tableName, code) {
  let cursor
  do {
    const page = await scanPage({
      TableName: tableName,
      FilterExpression: 'referral_code = :code',
      ExpressionAttributeValues: { ':code': code },
      Limit: 100,
      ...(cursor ? { ExclusiveStartKey: cursor } : {}),
    })
    const match = (page.Items || []).find(item => item.referral_code === code)
    if (match) return match
    cursor = page.LastEvaluatedKey
  } while (cursor && Object.keys(cursor).length)
  return null
}
