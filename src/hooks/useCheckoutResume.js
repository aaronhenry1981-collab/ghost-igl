import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from './useAuth'
import { openMembershipCheckout } from '../lib/membershipCheckout'

const PAID_TIERS = ['pro', 'elite', 'champion']

// A signed-out player picks a plan, creates or signs into a verified account
// on /auth, and comes back with ?checkout=<tier>. Resume the server-owned
// Checkout Session exactly once (same contract as the home page).
export function useCheckoutResume(onError) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const resumedRef = useRef(false)
  const onErrorRef = useRef(onError)

  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    const tier = searchParams.get('checkout')
    if (!user || resumedRef.current || !PAID_TIERS.includes(tier)) return
    resumedRef.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    setSearchParams(next, { replace: true })
    openMembershipCheckout(tier).catch((error) => {
      resumedRef.current = false
      onErrorRef.current?.(error)
    })
  }, [user, searchParams, setSearchParams])
}
