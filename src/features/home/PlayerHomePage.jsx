import { useMemo } from 'react'
import PlayerHome from './PlayerHome'
import { useHomeView } from './useHomeView'
import { createLiveHomeApi } from './homeApi'
import ReferralsWidget from '../../components/dashboard/ReferralsWidget'

// /dashboard — the signed-in player's coaching home.
//
// The referral program widget reads the signed-in user's own /me/referrals,
// so it is rendered only here, never in the CRM's "view as player" preview
// (where it would show the admin's referral data).
export default function PlayerHomePage() {
  const state = useHomeView()
  const api = useMemo(() => createLiveHomeApi(), [])
  const slots = useMemo(() => ({ sidebarEnd: <ReferralsWidget /> }), [])
  return <PlayerHome state={state} api={api} slots={slots} />
}
