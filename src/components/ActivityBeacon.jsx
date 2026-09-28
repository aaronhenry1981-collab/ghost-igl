import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { activityForPath, activityKey } from '../lib/activityRoutes'
import { currentIdToken, isCustomerSuccessConfigured, recordActivity } from '../lib/customerSuccess'

// Records "opened a round plan / match prep / live guide" for signed-in
// players so the home and the CRM can show real activity. Off unless the
// customer-success API is configured. One beacon per page, per day, per tab.
const sent = new Set()

export default function ActivityBeacon() {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!user || !isCustomerSuccessConfigured()) return
    const activity = activityForPath(location.pathname)
    if (!activity) return
    const key = activityKey(activity)
    if (sent.has(key)) return
    sent.add(key)
    currentIdToken()
      .then((token) => recordActivity(token, activity))
      .catch(() => sent.delete(key))
  }, [user, location.pathname])

  return null
}
