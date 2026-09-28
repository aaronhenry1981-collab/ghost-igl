// AWS Lambda entry point for the Recon 6 customer-success API.
// All behaviour lives in app.mjs; this file only wires AWS clients and env.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { createApp } from './app.mjs'
import { createDynamoTables } from './data/dynamoTables.mjs'
import { createDynamoStore } from './data/dynamoStore.mjs'
import { createCognitoAuthenticator } from './lib/auth.mjs'
import { DEFAULT_ALLOWED_ORIGINS } from './lib/http.mjs'
import { catalogFromEnv, vodLimitsFromEnv } from './domain/plans.mjs'
import { routeModules } from './routes/index.mjs'
import { configureContactKeySecret } from './lib/ids.mjs'

const env = process.env
const region = env.AWS_REGION || 'us-east-1'

// Decision D-C1: contact keys are HMACs keyed by an SSM SecureString, read
// once per container with the SDK that ships in the Lambda Node.js runtime.
// Fail closed: without the secret the function refuses to start, so it can
// never store records under unkeyed (email-derivable) keys.
if (!env.CONTACT_KEY_SECRET_PARAM) throw new Error('CONTACT_KEY_SECRET_PARAM is not set')
{
  const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm')
  const out = await new SSMClient({ region }).send(new GetParameterCommand({ Name: env.CONTACT_KEY_SECRET_PARAM, WithDecryption: true }))
  configureContactKeySecret(out?.Parameter?.Value)
}
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
    // Player-data history for Player Success diagnostics (Query only).
    // Unset -> that source reports "not connected".
    playerSnapshots: env.PLAYER_SNAPSHOTS_TABLE,
    playerIdentities: env.PLAYER_IDENTITIES_TABLE,
    providerHealth: env.PROVIDER_HEALTH_TABLE,
  },
})

const store = createDynamoStore({ ddb, tableName: env.CS_TABLE, log: console })

// Mirror opt-outs into the existing CRM job's log so its welcome/win-back
// emails honour them too. Only ever SETS a suppression timestamp (never
// clears one) and only when explicitly enabled.
const legacy = flag('SYNC_LEGACY_SUPPRESSION') && env.CRM_LOG_TABLE
  ? {
    async mirrorSuppression(email, at, reason) {
      await ddb.send(new UpdateCommand({
        TableName: env.CRM_LOG_TABLE,
        Key: { email: String(email).trim().toLowerCase() },
        UpdateExpression: 'SET marketing_suppressed_at = if_not_exists(marketing_suppressed_at, :at), marketing_suppressed_reason = if_not_exists(marketing_suppressed_reason, :r)',
        ExpressionAttributeValues: { ':at': at, ':r': reason },
      }))
    },
  }
  : null

// Support email plus-address HMAC secret. Only when
// SUPPORT_EMAIL_TOKEN_SECRET_ARN is set: read once per container from Secrets
// Manager with the SDK that ships in the Lambda Node.js runtime (it is not a
// dependency of this package, so nothing is bundled). Unset, or any failure
// -> null, and token lookups return nothing (mail goes to review).
const supportEmailTokenSecret = env.SUPPORT_EMAIL_TOKEN_SECRET_ARN
  ? (() => {
    let cached
    return async () => {
      if (cached !== undefined) return cached
      try {
        const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager')
        const out = await new SecretsManagerClient({ region }).send(new GetSecretValueCommand({ SecretId: env.SUPPORT_EMAIL_TOKEN_SECRET_ARN }))
        cached = typeof out.SecretString === 'string' ? out.SecretString : null
      } catch (err) {
        console.warn('support_email_secret_unavailable', { error: err?.name || 'Error' })
        cached = null
      }
      return cached
    }
  })()
  : null

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
      // Player Success & Support: every route 404s unless this is 'true'.
      support: flag('FEATURE_SUPPORT'),
    },
    // Every support switch defaults OFF (see aws/customer-success-template.yaml).
    support: {
      attachments: flag('SUPPORT_ATTACHMENTS'),
      proactive: flag('SUPPORT_PROACTIVE'),
      copilotModel: flag('SUPPORT_COPILOT_MODEL'),
      emailTokenSecret: supportEmailTokenSecret,
    },
    activityTrackingSince: env.ACTIVITY_TRACKING_SINCE || null,
    vodLimits: vodLimitsFromEnv(env),
    allowedOrigins: env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_ALLOWED_ORIGINS,
    deliveryMode: env.OUTREACH_DELIVERY_MODE === 'in_app' ? 'in_app' : 'disabled',
  },
  legacy,
  extraRoutes: routeModules,
})
