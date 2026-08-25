import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'

// These are public client-side identifiers, not secrets. Keep production-safe
// defaults in source so a clean checkout can still build a working login.
// Local/preview environments may override them with Vite environment values.
const env = import.meta.env || {}
const DEFAULT_USER_POOL_ID = 'us-east-1_rvLy8WLQB'
const DEFAULT_CLIENT_ID = '5bpa1cteenctoue24v4e245re8'
const DEFAULT_API_URL = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'

const poolData = {
  UserPoolId: env.VITE_COGNITO_USER_POOL_ID || DEFAULT_USER_POOL_ID,
  ClientId: env.VITE_COGNITO_CLIENT_ID || DEFAULT_CLIENT_ID,
}

export const userPool = poolData.UserPoolId && poolData.ClientId
  ? new CognitoUserPool(poolData)
  : null

export const API_URL = env.VITE_API_BASE_URL || DEFAULT_API_URL

export function getCognitoUser(email) {
  if (!userPool) return null
  return new CognitoUser({ Username: email, Pool: userPool })
}

export function getAuthDetails(email, password) {
  return new AuthenticationDetails({ Username: email, Password: password })
}

export function getCurrentUser() {
  if (!userPool) return null
  return userPool.getCurrentUser()
}

export function getSession(cognitoUser) {
  return new Promise((resolve, reject) => {
    if (!cognitoUser) return reject(new Error('No user'))
    cognitoUser.getSession((err, session) => {
      if (err) return reject(err)
      resolve(session)
    })
  })
}

export function getIdToken(session) {
  return session?.getIdToken()?.getJwtToken() || null
}
