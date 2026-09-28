import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isCategory } from './supportLogic.mjs'
import { createLiveSupportApi } from './supportApi'
import { LIVE_PATHS } from './supportPaths'
import SupportPage from './player/SupportPage'

// /support and /support/cases/:caseNumber (live). The API derives the player
// from the verified token; the client never sends a player identifier.
export default function SupportRoute() {
  const { user, loading } = useAuth()
  const { caseNumber = null } = useParams()
  const [params] = useSearchParams()
  const api = useMemo(() => createLiveSupportApi(), [])
  const category = params.get('category')
  return (
    <SupportPage
      api={api}
      paths={LIVE_PATHS}
      signedIn={Boolean(user)}
      authLoading={loading}
      caseNumber={caseNumber}
      initialCategory={isCategory(category) ? category : null}
      source={(params.get('from') || '').slice(0, 64) || null}
    />
  )
}
