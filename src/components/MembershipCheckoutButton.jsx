import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { membershipSignInPath, openMembershipCheckout } from '../lib/membershipCheckout'
import { track } from '../utils/analytics'

export default function MembershipCheckoutButton({
  tier,
  location,
  children,
  className = '',
  style,
  onError,
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    track('Pricing CTA Click', { tier, location })
    if (!user) {
      navigate(membershipSignInPath(tier))
      return
    }
    setLoading(true)
    try {
      await openMembershipCheckout(tier)
    } catch (error) {
      setLoading(false)
      onError?.(error)
    }
  }

  return (
    <button type="button" className={className} style={style} onClick={handleClick} disabled={loading}>
      {loading ? 'Opening secure checkout…' : children}
    </button>
  )
}
