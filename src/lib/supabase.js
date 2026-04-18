import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
}

export const userPool = poolData.UserPoolId && poolData.ClientId
  ? new CognitoUserPool(poolData)
  : null

export const API_URL = import.meta.env.VITE_API_BASE_URL || ''

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
