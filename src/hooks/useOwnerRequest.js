import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { requestForOwner, tokenForOwner, authorizationForOwner } from '../lib/ownerRequest'

export function useOwnerRequest() {
  const { user, captureAuthScope, isAuthScopeCurrent } = useAuth()
  const ownerId = user?.id
  return useCallback((path, init) => requestForOwner(ownerId, { captureAuthScope, isAuthScopeCurrent }, path, init), [ownerId, captureAuthScope, isAuthScopeCurrent])
}

export function useOwnerToken() {
  const { user, captureAuthScope, isAuthScopeCurrent } = useAuth()
  const ownerId = user?.id
  return useCallback(() => tokenForOwner(ownerId, { captureAuthScope, isAuthScopeCurrent }), [ownerId, captureAuthScope, isAuthScopeCurrent])
}

export function useOwnerAuthorization() {
  const { user, captureAuthScope, isAuthScopeCurrent } = useAuth()
  const ownerId = user?.id
  return useCallback(() => authorizationForOwner(ownerId, { captureAuthScope, isAuthScopeCurrent }), [ownerId, captureAuthScope, isAuthScopeCurrent])
}
