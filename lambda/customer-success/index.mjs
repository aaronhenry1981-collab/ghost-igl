// AWS Lambda entry point for the Recon 6 customer-success API.
// All behaviour lives in app.mjs; this file only wires AWS clients and env.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { createApp } from './app.mjs'
import { createDynamoTables } from './data/dynamoTables.mjs'
import { createDynamoStore } from './data/dynamoStore.mjs'
import { createCognitoAuthenticator } from './lib/auth.mjs'
import { DEFAULT_ALLOWED_ORIGINS } from './lib/http.mjs'
import { catalogFromEnv, vodLimitsFromEnv } from './domain/plans.mjs'
import { routeModules } from './routes/index.mjs'

const env = process.env
const region = env.AWS_REGION || 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } })
const cognito = new CognitoIdentityProviderClient({ region })
const flag = (name) => String(env[name] || '').toLowerCase() === 'true'

const tables = createDynamoTables({
  ddb,
  cognito,
  userPoolId: env.COGNITO_USER_POOL_ID,
  names: {
    subscriptions: env.SUBSCRIPTIONS_TABLE,
    profiles: env.PROFILES_TABLE,
    climb: env.CLIMB_TABLE,
    bookings: env.BOOKINGS_TABLE,
    coachingEvents: env.COACHING_EVENTS_TABLE,
    playerStore: env.PLAYER_STORE_TABLE,
    playerEvents: env.PLAYER_EVENTS_TABLE,
    referrals: env.REFERRALS_TABLE,
    crmLog: env.CRM_LOG_TABLE,
    testimonials: env.TESTIMONIALS_TABLE,
  },
})

const store = createDynamoStore({ ddb, tableName: env.CS_TABLE })

export const handler = createApp({
  tables,
  store,
  authenticate: createCognitoAuthenticator({ userPoolId: env.COGNITO_USER_POOL_ID, clientId: env.COGNITO_CLIENT_ID }),
  catalog: catalogFromEnv(env),
  config: {
    features: {
      messaging: flag('FEATURE_MESSAGING'),
      feedback: flag('FEATURE_FEEDBACK'),
      liveCoachApp: false,
    },
    activityTrackingSince: env.ACTIVITY_TRACKING_SINCE || null,
    vodLimits: vodLimitsFromEnv(env),
    allowedOrigins: env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_ALLOWED_ORIGINS,
  },
  extraRoutes: routeModules,
})
