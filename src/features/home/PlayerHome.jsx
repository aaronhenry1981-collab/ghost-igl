import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { currentIdToken, openBillingPortal } from '../../lib/customerSuccess'
import RankGoalEditor from './RankGoalEditor'
import MessagesCard from './MessagesCard'
import ContactPreferences from './ContactPreferences'
import FeedbackPrompt from './FeedbackPrompt'
import { greeting } from './homeFormat'
import {
  ActivationCard,
  ActivityCard,
  CoachingCard,
  ContinueCard,
  FocusCard,
  HelpCard,
  MembershipCard,
  MissionCard,
  RoadToChampionCard,
  StuckCard,
  ToolsCard,
  VodCard,
} from './sections'
import './PlayerHome.css'

function HomeSkeleton() {
  return (
    <div className="ph" aria-busy="true">
      <p className="ph-visually-hidden" role="status">Loading your home…</p>
      <div className="ph-skeleton ph-skeleton-hero" />
      <div className="ph-grid">
        <div className="ph-skeleton" />
        <div className="ph-skeleton" />
      </div>
    </div>
  )
}

// The player home. `state` comes from useHomeView (live) or a dev preview.
// `api` is the player's own customer-success client (null in lite mode and
// in the CRM's read-only "view as player").
export default function PlayerHome({ state, preview = false, slots = {}, api = null }) {
  const auth = useAuth()
  const [notice, setNotice] = useState(null)
  const [rankEditorOpen, setRankEditorOpen] = useState(false)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const { status, error, view, reload, authLoading, signedIn } = state

  if (authLoading) return <HomeSkeleton />
  if (!signedIn) {
    return (
      <div className="ph">
        <section className="ph-card ph-signin">
          <h1 className="ph-h1">Your coaching home</h1>
          <p className="ph-muted">Sign in to see your next mission, Road to Champion progress and membership in one place.</p>
          <Link to="/auth?redirect=/dashboard" className="btn btn-primary">Sign in</Link>
        </section>
      </div>
    )
  }
  if (status === 'loading' && !view) return <HomeSkeleton />
  if (status === 'error' && !view) {
    return (
      <div className="ph">
        <section className="ph-card" role="alert">
          <h1 className="ph-h1">We couldn&apos;t load your home</h1>
          <p className="ph-muted">{error?.status === 401 ? 'Your session expired. Sign in again.' : 'Something went wrong on our side. Your account and progress are safe.'}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>Try again</button>
        </section>
      </div>
    )
  }
  if (!view) return <HomeSkeleton />

  async function onAction(action) {
    setNotice(null)
    if (action === 'message_support' && api && view.messages?.enabled) {
      setMessagesOpen(true)
      document.getElementById('home-messages')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (preview && action !== 'set_rank_goal') {
      setNotice(`Preview: "${action.replace(/_/g, ' ')}" is disabled with fictional data.`)
      return
    }
    try {
      if (action === 'billing_portal') {
        setNotice('Opening billing…')
        await openBillingPortal(await currentIdToken())
      } else if (action === 'open_profile') {
        window.dispatchEvent(new CustomEvent('recon:open-profile-setup'))
      } else if (action === 'set_rank_goal') {
        setRankEditorOpen(true)
      } else if (action === 'message_support') {
        if (slots.openMessages) slots.openMessages()
        else window.location.href = 'mailto:support@r6coaching.com'
      }
    } catch (err) {
      setNotice(err.message || 'That did not work. Try again.')
    }
  }

  const name = view.player?.name
  const m = view.membership

  return (
    <div className="ph">
      <header className="ph-header">
        <div>
          <p className="ph-eyebrow">{view.mode === 'lite' ? 'Your coaching home' : 'Your coaching home'}</p>
          <h1 className="ph-h1">{greeting()}{name ? `, ${name}` : ''}.</h1>
          {(view.player?.rank || view.player?.goalRank) && (
            <p className="ph-sub">
              {view.player.rank ? <>Rank <strong>{view.player.rank}</strong></> : 'Rank not set'}
              {view.player.goalRank && <> · Goal <strong>{view.player.goalRank}</strong></>}
            </p>
          )}
        </div>
        {m && (
          <div className="ph-header-plan">
            <span className={`ph-plan ph-plan-${m.plan || 'unknown'}`}>{m.planLabel || 'Unknown'}</span>
            <span className={`ph-status ph-tone-${m.tone}`}>{m.statusLabel}</span>
          </div>
        )}
      </header>

      {notice && <p className="ph-notice" role="status">{notice}</p>}
      {slots.banner}

      <MissionCard mission={view.mission} onAction={onAction} />

      {rankEditorOpen && (
        <section className="ph-card" aria-label="Set your rank and goal">
          <RankGoalEditor
            profile={auth.profile}
            preview={preview}
            onCancel={() => setRankEditorOpen(false)}
            onSaved={async () => {
              setRankEditorOpen(false)
              if (!preview) {
                await auth.refreshProfile?.()
                reload()
              } else {
                setNotice('Preview: rank not saved.')
              }
            }}
          />
        </section>
      )}

      {api && view.feedbackPrompt && <FeedbackPrompt api={api} prompt={view.feedbackPrompt} />}
      {slots.feedback}

      <div className="ph-grid">
        <div className="ph-col">
          <RoadToChampionCard rtc={view.roadToChampion} sourceStatus={view.sources?.roadToChampion} />
          <ActivationCard activation={view.activation} onAction={onAction} />
          <ContinueCard items={view.continue} />
          <FocusCard skills={view.skills} evidence={view.evidence} />
          <ActivityCard activity={view.activity} />
        </div>
        <div className="ph-col ph-col-side">
          <MembershipCard membership={m} vod={view.vod} onAction={onAction} />
          <StuckCard stuck={view.stuck} />
          <VodCard vod={view.vod} />
          <CoachingCard coaching={view.coaching} />
          {api && view.messages?.enabled && (
            <div id="home-messages">
              <MessagesCard api={api} summary={view.messages} open={messagesOpen} onOpenChange={setMessagesOpen} />
            </div>
          )}
          <HelpCard help={view.help} onAction={onAction} />
          {api && <ContactPreferences api={api} />}
        </div>
      </div>

      <ToolsCard tools={view.tools} />
    </div>
  )
}
