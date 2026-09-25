import PlayerHome from './PlayerHome'
import { useHomeView } from './useHomeView'

// /dashboard — the signed-in player's coaching home.
export default function PlayerHomePage() {
  const state = useHomeView()
  return <PlayerHome state={state} />
}
