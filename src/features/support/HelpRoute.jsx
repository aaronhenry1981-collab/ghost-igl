import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { createLiveHelpApi } from './supportApi'
import { LIVE_PATHS } from './supportPaths'
import HelpCenter from './help/HelpCenter'

// /help and /help/:slug (public; reviewed articles only).
export default function HelpRoute() {
  const { slug = null } = useParams()
  const api = useMemo(() => createLiveHelpApi(), [])
  return <HelpCenter api={api} paths={LIVE_PATHS} slug={slug} />
}
