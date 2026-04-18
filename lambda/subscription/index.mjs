import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
})

export async function handler(event) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Verify JWT token
  const authHeader = event.headers?.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token provided' }) }
  }

  let payload
  try {
    payload = await verifier.verify(token)
  } catch (err) {
    console.error('Token verification failed:', err)
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const email = payload.email?.toLowerCase()
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No email in token' }) }
  }

  // Query subscription by email (using GSI)
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
      ScanIndexForward: false,
    }))

    const sub = result.Items?.[0]

    if (sub && sub.status === 'active') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          plan: sub.plan,
          status: sub.status,
          current_period_end: sub.current_period_end,
        }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ plan: 'free', status: 'none' }),
    }
  } catch (err) {
    console.error('DynamoDB query error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
