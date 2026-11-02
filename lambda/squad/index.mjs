import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { ApiGatewayManagementApiClient, PostToConnectionCommand, DeleteConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { createSquadService, createHttpHandler } from './service.mjs'
import { createDynamoRepository } from './dynamo-repository.mjs'
import { createGatewayAuthenticator } from './gateway-auth.mjs'
import { createWebsocketService } from './websocket.mjs'
import * as domain from './domain.mjs'

export function buildRuntime({ env, documentClient, transport, now = Date.now } = {}) {
  if (env?.AWS_REGION !== 'us-east-1' || env.STATE_TABLE !== 'recon-squad-state' || env.GRANTS_TABLE !== 'recon-squad-grants' || !/^[a-z0-9]{10}$/.test(env.HTTP_API_ID || '') || !/^[a-z0-9]{10}$/.test(env.WS_API_ID || '') || env.COGNITO_POOL_ID !== 'us-east-1_rvLy8WLQB' || env.COGNITO_CLIENT_ID !== '5bpa1cteenctoue24v4e245re8') throw new Error('The exact reviewed squad deployment configuration is required')
  const client = documentClient || DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1', maxAttempts: 1 }), { marshallOptions: { removeUndefinedValues: true } })
  const repo = createDynamoRepository({ client, commands: { GetCommand, QueryCommand, TransactWriteCommand }, table: env.STATE_TABLE, grantsTable: env.GRANTS_TABLE, now })
  const authenticate = createGatewayAuthenticator({ apiId: env.HTTP_API_ID, issuer: `https://cognito-idp.us-east-1.amazonaws.com/${env.COGNITO_POOL_ID}`, audience: env.COGNITO_CLIENT_ID, now })
  const service = createSquadService({ repo, authenticate, domain, now })
  let wire = transport
  if (!wire) {
    const gateway = new ApiGatewayManagementApiClient({ region: 'us-east-1', endpoint: `https://${env.WS_API_ID}.execute-api.us-east-1.amazonaws.com/prod`, maxAttempts: 1 })
    wire = { post: (id, data) => gateway.send(new PostToConnectionCommand({ ConnectionId: id, Data: Buffer.from(JSON.stringify(data)) })), close: id => gateway.send(new DeleteConnectionCommand({ ConnectionId: id })) }
  }
  const socket = createWebsocketService({ apiId: env.WS_API_ID, repo, service, transport: wire })
  const http = createHttpHandler(service, { afterCommit: id => socket.broadcastRoom(id) })
  return { handle: event => event?.requestContext?.apiId === env.WS_API_ID ? socket.handler(event) : http(event) }
}
let runtime
export async function handler(event, context) {
  if (!/^arn:aws:lambda:us-east-1:183678667221:function:recon-squad-api(?::[a-zA-Z0-9_-]+)?$/.test(context?.invokedFunctionArn || '')) return { statusCode: 503, body: '{"error":"Squad deployment configuration is unavailable"}' }
  runtime ||= buildRuntime({ env: process.env })
  return runtime.handle(event)
}
