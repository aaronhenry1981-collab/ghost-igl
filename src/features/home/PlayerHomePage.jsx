import { useMemo } from 'react'
import PlayerHome from './PlayerHome'
import { useHomeView } from './useHomeView'
import { createLiveHomeApi } from './homeApi'

// /dashboard — the signed-in player's coaching home.
export default function PlayerHomePage() {
  const state = useHomeView()
  const api = useMemo(() => createLiveHomeApi(), [])
  return <PlayerHome state={state} api={api} />
}
