import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SessionUploadZone from '../components/vod/SessionUploadZone'
import LinkInput from '../components/vod/LinkInput'
import SessionResults from '../components/vod/SessionResults'
import AnalysisLoading from '../components/vod/AnalysisLoading'
import { useVodAnalysis } from '../hooks/useVodAnalysis'
import { useAuth } from '../hooks/useAuth'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import { useSectionNavigate } from '../utils/sectionLink'
import { isFoundingOpen, FOUNDING_END_SHORT, foundingTimeRemaining } from '../config/founding'
import { track } from '../utils/analytics'
import './VodPage.css'

// R6 has a hand-tuned demo. Every other game falls through to a synthetic
// demo built from the active game's actual maps + cast + vocabulary — so a
// Tekken player sees a Tekken-shaped sample, a LoL player sees a LoL one,
// etc. Without this, non-R6 visitors had NO way to preview the AI output
// before paying. That was killing conversion on 19 of 20 games.
const R6_DEMO_ANALYSIS = {
  session: {
    headline:
      'Solid setup on Bank 2F CEO Office but a predictable head-glitch angle and unused utility cost you the round.',
    score: 72,
    detected_map: 'Bank',
    detected_side: 'defense',
    image_count: 1,
  },
  per_image: [
    {
      image_index: 0,
      detected: { map: 'Bank', site: '2F CEO Office', side: 'defense', character: 'Smoke', round_phase: 'action' },
      what_happened: 'Smoke holding CEO doorway from the standard head-glitch spot during the action phase.',
      what_went_wrong: [
        'Crosshair on the door frame, not pre-aimed head height into Executive Lounge.',
        'Smoke canister visible on HUD but undeployed — wasted on a defensive round with no plant pressure yet.',
        'Position is droneable: Iana/Flores attackers will see your exact angle.',
      ],
      what_went_right: ['Anchored the bomb site instead of roaming early.'],
      specific_advice: [
        'Step two paces back behind the desk to break the head-glitch and force attackers deeper.',
        'Pre-aim chest height through the Executive Lounge shared wall.',
        'Save Smoke canister for plant denial — don\'t throw early for pressure.',
        'Ask Maestro to drop an Evil Eye covering Executive Lounge so you\'re not double-anchoring.',
      ],
    },
  ],
  patterns: {
    recurring_weaknesses: [
      'Holding head-glitch angles attackers can pre-drone',
      'Crosshair drifting to floor between peeks',
    ],
    standout_strengths: ['Smoke canister kept in reserve for plant denial'],
  },
  practice_plan: {
    this_week: [
      'Aim Training: pre-aim head height on every doorway entry — 10 minutes/day',
      'Custom Map: anchor Bank 2F CEO from 3 alternate spots, find one with cover',
      'Map Awareness: review one match VOD and identify every droneable angle you held',
    ],
  },
  character_feedback:
    'Smoke is meant to be a plant-denial anchor — your gas canisters are your value, not your ADS. Hold from positions that survive long enough to throw gas at the plant. Don\'t peek for frags.',
}

// Hand-tuned demos for the highest-TAM non-R6 games. These reference the
// game's actual maps + characters + vocab. Falls through to a generic
// synthetic demo for games not in this table (still game-aware via the
// gameMeta + data lookup below).
const HAND_TUNED_DEMOS = {
  cs2: {
    session: { headline: 'A-site retake on Mirage failed because of a predictable Connector peek and unused molotov.', score: 68, detected_map: 'Mirage', detected_side: 'CT', image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { map: 'Mirage', site: 'A Site', side: 'CT', character: 'Anchor', round_phase: 'action' },
      what_happened: 'CT anchor holding A-default while T-side executes through Connector.',
      what_went_wrong: [
        'Crosshair on the ground after the smoke pop — should be pre-aimed head-height at Connector exit.',
        'Molotov visible in HUD but never thrown — that one util pops the Connector push.',
        'Standing on default — Connector flash + push catches you mid-flash every time.',
      ],
      what_went_right: ['Held the A-default angle rather than jiggle-peeking.'],
      specific_advice: [
        'Pre-aim the Connector exit corner at head height — that\'s 45° above floor level.',
        'Pop the molotov on Sandbags the moment you hear util from Connector.',
        'Default off Sandbags after smoke — Connector flash splits you off the angle anyway.',
        'Ask your B-site player to rotate the second you hear Connector commit, not after kills land.',
      ],
    }],
    patterns: { recurring_weaknesses: ['Predictable A-default crosshair placement', 'Saving molotov instead of using it on commit'], standout_strengths: ['Patient hold pre-execute'] },
    practice_plan: { this_week: ['Aim Lab: pre-aim Connector exit at head height — 10 min/day', 'Workshop: Mirage util lineups — molotov on Sandbags + smoke on Window', 'Review 1 demo per day from your last 5 CT-side losses on Mirage'] },
    character_feedback: 'CT anchor on Mirage is about util usage, not aim. Your molotov + smokes decide retake feasibility. If you\'re holding util at round-end, you played the round wrong.',
  },
  valorant: {
    session: { headline: 'Defensive setup on Bind A-site failed because Killjoy turret faced Showers — trade-killed every time.', score: 64, detected_map: 'Bind', detected_side: 'Defense', image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { map: 'Bind', site: 'A Site', side: 'Defense', character: 'Killjoy', round_phase: 'prep' },
      what_happened: 'Killjoy setting up A-site defense before the round starts.',
      what_went_wrong: [
        'Turret placed facing Showers — gets traded by any halfway-decent entry through Hookah.',
        'Alarmbot at Hookah but the round is going A — bot is wasted util.',
        'No tripwire on Heaven entry — your standard angle for retake intel.',
      ],
      what_went_right: ['Held A-default rather than jiggle-peeking onto Showers.'],
      specific_advice: [
        'Move Turret to Heaven angle — covers Bath entry without exposing it to Showers entry trade.',
        'Reposition Alarmbot to the back of A Heaven for retake intel.',
        'Pre-place Nano Swarm on default plant spot — that\'s your retake util.',
        'Ult save for re-anchor: drop Lockdown on default the moment B is called.',
      ],
    }],
    patterns: { recurring_weaknesses: ['Util faces the wrong entry angle', 'No retake-intel utility staged'], standout_strengths: ['Right hero for the site'] },
    practice_plan: { this_week: ['Custom: practice Killjoy setup on Bind A — 10 min/day', 'VOD 1 pro Killjoy game per day, note ult timing windows', 'Aim Lab: pre-aim Heaven entry at head height'] },
    character_feedback: 'Killjoy is a setup sentinel — your value is util placement, not duels. If your turret + alarmbot face the wrong entry, you lose the round before it starts.',
  },
  lol: {
    session: { headline: 'Mid-lane Zed got solo-killed at 5:30 because of a predictable W-EQ-W trade pattern + over-extension past river ward.', score: 66, detected_map: "Summoner's Rift", detected_side: 'Blue', image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { map: "Summoner's Rift", site: 'Mid Lane', side: 'Blue', character: 'Zed', round_phase: 'lane phase' },
      what_happened: 'Zed mid lane at 5:30 trading with enemy Yasuo. Wave pushed to enemy tower, no jungle ward.',
      what_went_wrong: [
        'Trading with W-EQ-W pattern every time — Yasuo windwalls the second E.',
        'Over-extending past river without a ward at 5:30 — Lee Sin\'s standard mid-gank timer.',
        'Energy at 25 when you traded — no shadowstep escape if ganked.',
      ],
      what_went_right: ['Wave-controlled to enemy tower instead of letting it sit mid.'],
      specific_advice: [
        'Mix in W-E auto-attack-Q for chip damage — Yasuo can\'t windwall a basic.',
        'Ward river bush before extending past mid-river line at any 3-minute mark.',
        'Hold W for shadow-step escape — don\'t use it for damage when energy < 50.',
        'Recall when your wave bounces back to your tower around 6:00 — get Glacial Augment + boots.',
      ],
    }],
    patterns: { recurring_weaknesses: ['Predictable trade pattern (W-EQ-W)', 'Over-extending without river vision'], standout_strengths: ['Good wave control'] },
    practice_plan: { this_week: ['Practice Tool: Zed combo variations — 15 min/day', 'Review 3 Faker Zed VODs, note when he holds W for escape', 'Custom: practice river warding timings before pushing past mid'] },
    character_feedback: 'Zed is a tempo assassin — your value is winning lane + roaming. If you\'re trading predictably and not warding before extends, you\'re feeding the enemy jungler instead of pressuring side lanes.',
  },
  tk8: {
    session: { headline: 'Yakushima round 2 lost on a sidestep-right against Bryan\'s tracking string — Hatchet Kick caught you every time.', score: 63, detected_map: 'Yakushima', detected_side: 'P1', image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { map: 'Yakushima', site: 'Wall Pressure', side: 'P1', character: 'Reina', round_phase: 'mid-fight' },
      what_happened: 'Reina P1 against P2 Bryan during wall pressure phase. Health at ~30% with corner to back.',
      what_went_wrong: [
        'Sidestepping right into Bryan\'s db+4 (Hatchet Kick) — tracks left + right at i12.',
        'Not crouching low strings — Bryan\'s 4 string from neutral is high then low.',
        'Heat burst when wall-splatted, eating the launcher follow-up instead of standing block.',
      ],
      what_went_right: ['Got the wall splat with Reina f,F+2.'],
      specific_advice: [
        'Sidestep LEFT against Bryan, not right — Hatchet Kick tracks right only.',
        'Crouch after Bryan\'s 4 string — second hit is mid, can\'t be high-blocked.',
        'Save Heat for neutral pressure, not wakeup — wakeup Heat eats the post-knockdown launcher.',
        'Wall combo route after f,F+2 splat: 1,2,3,b+3,4 (38 damage) instead of mash standard.',
      ],
    }],
    patterns: { recurring_weaknesses: ['Wrong sidestep direction vs Bryan', 'Mistimed Heat burst on wakeup'], standout_strengths: ['Clean f,F+2 wall splat conversion'] },
    practice_plan: { this_week: ['Practice Mode: Reina vs Bryan matchup, focus on sidestep-left — 20 min/day', 'Drill: Reina BnB wall combo route — 50 reps/day', 'VOD: watch one tournament Reina match, note Heat usage patterns'] },
    character_feedback: 'Reina is a launcher-mixup character — your value is pressure + wall carries. Sidestep direction matters more than raw frame data here; matchup-specific habits.',
  },
  ow2: {
    session: { headline: 'Stadium Throne of Anubis round 5 as Reinhardt — Mid bank lost on a greedy economy + wrong Power pick.', score: 58, detected_map: 'Stadium — Throne of Anubis (Clash)', detected_side: 'Attack', image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { map: 'Stadium — Throne of Anubis', site: 'Mid Bank', side: 'Attack', character: 'Reinhardt', round_phase: 'round 5 mid contest' },
      what_happened: 'Round 5 Mid bank contest. You ran in with Shield Regen Power active, Charge on cooldown, $4,200 banked. Enemy Sigma had Gravitic Flux ready (visible from ult-charge bar) and used it as you crossed Mid threshold — team got Flux\'d, banked CCTV.',
      what_went_wrong: [
        'Bought Epic Reinforced Shield Item round 3 — burned $10K when economy still cooling. Round 5 you couldn\'t afford the Cooldown Reduction Item that would\'ve had Charge up.',
        'Picked Shield Regen as round 5 Power — wrong read for Throne Mid. Team needed Earthshatter range to break the Sigma shield-hold, not sustain.',
        'Engaged Mid without checking enemy ult economy — Sigma Flux ult-charge bar was at 95% from the post-screen but no one called it. Walked the team into a wipe ult.',
        'No Fire Strike before commit — Bandit (only allowed Fire Strike substitute) Disruptor not used to pre-mark Sigma position. Sigma reset rock-stun before the engage even started.',
      ],
      what_went_right: ['Shield up through the approach — team rolled in clean until Flux landed.', 'Banked $4,200 — round 6 you can actually afford the right Items now.'],
      specific_advice: [
        'STADIUM ECONOMY: never buy Epic before round 4 unless you\'re 3-0. Round 1-3 = Common/Rare Items only, bank Cash for the round-3 Power swing.',
        'POWER PICKS read the comp: enemy dive = defensive Powers (Shield Regen ok here); enemy brawl/Sigma = damage Powers (Shatter Range Up wins this round).',
        'WATCH ULT ECONOMY: every Stadium round-end shows enemy ult charge. Sigma at 95% Flux means you do NOT cross the Mid threshold — set up cover, bait the Flux on the wall.',
        'ITEM PRIORITY round 5 vs Sigma: Cooldown Reduction (Charge up = escape) > Reinforced Shield (you\'ll just shield through Flux either way). The wrong Item lost you Charge as escape.',
        'On Throne Mid specifically: Pillar at Mid offers Flux-blocking cover. Use it. The open-Mid commit only works if Sigma ult is burned.',
      ],
    }],
    patterns: { recurring_weaknesses: ['Greedy Epic Item purchases too early in the BO7', 'Defensive Power picks vs brawl comps', 'Engaging without checking enemy ult economy on round-end screen'], standout_strengths: ['Shield discipline through approaches', 'Cash banking — round 6 economy still healthy despite the loss'] },
    practice_plan: { this_week: ['Stadium Workshop: practice Power-pick reads — run 5 games, force yourself to call enemy comp archetype before picking each round', 'VOD 1 Top-500 Reinhardt Stadium replay per day, note Power picks per round + Cash spent per round', 'Custom Stadium lobby: Throne Mid contest from 3 different angles, with Sigma practicing Flux timing on you'] },
    character_feedback: 'Reinhardt in Stadium is the engage-decider — every fight is a Shatter setup. But Stadium adds two layers normal OW2 doesn\'t: build economy (when do you spend?) and Power synergy (what does this comp need?). You\'re playing Rein right; you\'re building Rein wrong. Fix the build, the fights follow.',
  },
}

// Generic synthetic demo for games without a hand-tuned one. Uses the
// active game's gameMeta + data so it feels game-aware: real map name,
// real character name, right vocabulary. The advice is intentionally
// general enough to ring true regardless of game — positioning, util
// timing, decision review — exactly the kind of feedback the real AI
// gives. We're not deceiving anyone; the page is clearly labeled SAMPLE.
function buildSyntheticDemo(gameMeta, data) {
  const displayName = gameMeta?.displayName || 'this game'
  const characterNoun = gameMeta?.vocab?.operator || 'character'
  const siteNoun = gameMeta?.vocab?.site || 'site'
  const attackLabel = gameMeta?.vocab?.side_attack || 'attack'

  // Pick the first real map + cast item + site from the active game so the
  // demo references things the user actually recognizes.
  const maps = Array.isArray(data?.MAPS) ? data.MAPS : Object.values(data?.MAPS || {})
  const cast = Array.isArray(data?.CAST) ? data.CAST : Object.values(data?.CAST || {})
  const firstMap = maps.find((m) => !m.comingSoon) || maps[0]
  const firstSite = firstMap?.sites?.[0]
  const firstChar = cast[0]

  const mapName = firstMap?.name || 'a competitive map'
  const siteName = firstSite?.name || 'a key area'
  const charName = firstChar?.name || `your ${characterNoun}`

  return {
    session: {
      headline: `Solid setup on ${mapName} — ${siteName} but a predictable angle and unused utility cost the round.`,
      score: 67,
      detected_map: mapName,
      detected_side: attackLabel,
      image_count: 1,
    },
    per_image: [{
      image_index: 0,
      detected: { map: mapName, site: siteName, side: attackLabel.toLowerCase(), character: charName, round_phase: 'action' },
      what_happened: `${charName} engaged at ${siteName} during the action phase. Standard team-shooting position with cover.`,
      what_went_wrong: [
        `Predictable angle hold — opponents tracking your ${characterNoun.toLowerCase()} could pre-aim your default position.`,
        'Key ability or utility on cooldown but not deployed in the engagement window — wasted resource.',
        'No off-angle backup — the same hold gets cleared with one pre-fire from the opponent next round.',
      ],
      what_went_right: [`Played the ${siteNoun.toLowerCase()} with the right ${characterNoun.toLowerCase()} for the comp.`],
      specific_advice: [
        `Reposition 2 steps off the default angle on ${siteName} — break the head-glitch and force opponents into the room.`,
        'Pre-aim the most likely entry corner at head height, not at the floor.',
        'Save your high-impact ability for the commit window, not pre-engage chip.',
        `Coordinate with a teammate to cover the off-angle so your ${characterNoun.toLowerCase()} isn't the only thing the enemy has to read.`,
      ],
    }],
    patterns: {
      recurring_weaknesses: [
        `Predictable angles on ${siteName} that opponents can pre-aim`,
        'Crosshair drift between peeks — costs you the first-shot advantage',
      ],
      standout_strengths: ['Right hero/character for the situation'],
    },
    practice_plan: {
      this_week: [
        `Aim Practice: pre-aim head height on every entry on ${mapName} — 10 minutes/day`,
        `Custom Map: ${siteName} hold from 3 different angles, find the one with cover`,
        'Match Review: identify every droneable / pre-aimable angle you held last 5 games',
      ],
    },
    character_feedback: `${charName} works best when used for their kit's strongest role. Your value isn't gunfights — it's the ${characterNoun.toLowerCase()} value you bring. Position to maximize that, not to frag.`,
  }
}

function getDemoForGame(gameId, gameMeta, data) {
  if (gameId === 'r6') return R6_DEMO_ANALYSIS
  if (HAND_TUNED_DEMOS[gameId]) return HAND_TUNED_DEMOS[gameId]
  return buildSyntheticDemo(gameMeta, data)
}

const TABS = [
  { id: 'screenshot', label: 'Screenshot', icon: '📷', available: true },
  { id: 'video', label: 'Video Clip', icon: '🎬', available: false },
  { id: 'link', label: 'YouTube / Twitch', icon: '🔗', available: false },
]

export default function VodPage() {
  const [activeTab, setActiveTab] = useState('screenshot')
  const [demoMode, setDemoMode] = useState(false)
  const { user, isPro, isAdmin, plan, vodUsage, loading: authLoading } = useAuth()
  const { activeGameId, isR6 } = useActiveGame()
  const { gameMeta, data: gameData } = useGameData()
  const { analysis, loading, error, errorCode, usageError, analyzeSession, reset } = useVodAnalysis()
  const tier = isAdmin || plan === 'champion' ? 'champion' : 'pro'
  const navigate = useNavigate()
  const goToPricing = useSectionNavigate('pricing')
  const [searchParams, setSearchParams] = useSearchParams()

  const canAnalyze = !!user && (isPro || isAdmin)
  // Demo is now available for ALL 20 games. R6 gets its hand-tuned demo, 5
  // high-TAM games (CS2/VAL/LoL/Tekken/OW2) get hand-tuned demos, the rest
  // get a synthetic demo that uses the active game's real maps + cast.
  // Every visitor can preview AI output before paying — was a major
  // conversion gap when only R6 had a demo.
  const demoAvailable = true
  const demoAnalysis = demoMode ? getDemoForGame(activeGameId, gameMeta, gameData) : null
  const isHandTunedDemo = activeGameId === 'r6' || !!HAND_TUNED_DEMOS[activeGameId]
  const effectiveAnalysis = demoMode ? demoAnalysis : analysis

  const displayName = gameMeta?.displayName || 'your game'
  const accent = gameMeta?.color || '#00e5ff'

  useEffect(() => {
    if (searchParams.get('demo') === '1' && demoAvailable) {
      setDemoMode(true)
      reset()
    }
  }, [searchParams, reset, demoAvailable])

  function showDemo() {
    if (!demoAvailable) return
    setDemoMode(true)
    reset()
  }
  function exitDemo() {
    setDemoMode(false)
    reset()
    if (searchParams.get('demo')) {
      const next = new URLSearchParams(searchParams)
      next.delete('demo')
      setSearchParams(next, { replace: true })
    }
  }

  return (
    <div className="vod-page">
      <div className="vod-header">
        <h1>
          Find Out Why You <span className="accent" style={{ color: accent }}>Lost the Round</span>
        </h1>
        <p>
          Drop a screenshot from any moment of a {displayName} match &mdash; death cam, post-plant freeze,
          round-end scoreboard. You get a specific fix: not &ldquo;use utility better,&rdquo; but
          &ldquo;you held off-angle on the wrong window when the entry pushed through the courtyard.&rdquo;
          {' '}
          <strong>
            Pro: 5 screenshots per session. Champion: 10 screenshots per session plus pattern reports and
            a weekly drill list built from your own clips.
          </strong>
        </p>
      </div>

      <div className="vod-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vod-tab${activeTab === tab.id ? ' active' : ''}${!tab.available ? ' disabled' : ''}`}
            onClick={() => tab.available && setActiveTab(tab.id)}
          >
            <span className="vod-tab-icon">{tab.icon}</span>
            {tab.label}
            {!tab.available && <span className="vod-tab-soon">Soon</span>}
          </button>
        ))}
      </div>

      <div className="vod-content">
        {activeTab === 'screenshot' && (
          <>
            {!authLoading && !user && !demoMode && (
              <div className="vod-gate">
                <h3>Sign in to review your gameplay</h3>
                <p>
                  Sign in to your Recon 6 account &mdash; Pro or Champion unlocks round-by-round breakdowns
                  of your {displayName} screenshots.
                </p>
                <div className="vod-gate-actions">
                  <button className="btn btn-primary" onClick={() => navigate('/auth?redirect=/vod')}>Sign in</button>
                  {demoAvailable && (
                    <button type="button" className="btn btn-outline" onClick={showDemo}>View sample analysis</button>
                  )}
                </div>
              </div>
            )}

            {user && !canAnalyze && !demoMode && (
              <div className="vod-gate">
                <h3>Upgrade to Pro to review your gameplay</h3>
                <p>
                  Free accounts can browse every strat. Pro unlocks the round-by-round breakdowns
                  &mdash; upload a screenshot, get a specific fix.
                </p>
                <div className="vod-gate-actions">
                  <button type="button" onClick={goToPricing} className="btn btn-primary">See plans</button>
                  {demoAvailable && (
                    <button type="button" className="btn btn-outline" onClick={showDemo}>View sample analysis</button>
                  )}
                </div>
              </div>
            )}

            {canAnalyze && !effectiveAnalysis && !loading && !error && !demoMode && (
              <>
                <UsageStrip usage={vodUsage} isAdmin={isAdmin} goToPricing={goToPricing} />
                <SessionUploadZone onUpload={analyzeSession} tier={tier} />
                {demoAvailable && (
                  <div className="vod-demo-hint">
                    Want to see what the analysis looks like first?{' '}
                    <button type="button" className="vod-demo-link" onClick={showDemo}>
                      View sample analysis &rarr;
                    </button>
                  </div>
                )}
              </>
            )}

            {canAnalyze && loading && <AnalysisLoading />}

            {canAnalyze && error && !demoMode && (
              <div className={`vod-error${errorCode === 'quota_throttled' || errorCode === 'model_access' ? ' vod-error-pending' : ''}`}>
                {errorCode === 'quota_throttled' ? (
                  <>
                    <div className="vod-error-icon">{'⏳'}</div>
                    <h3>The review engine is warming up</h3>
                    <p>{error}</p>
                    <p className="vod-error-sub">
                      This happens on new AWS accounts waiting for model quota approval. In the meantime,
                      {demoAvailable ? ' see what the output looks like on a sample screenshot:' : ' try again in a moment.'}
                    </p>
                    <div className="vod-error-actions">
                      {demoAvailable && <button className="btn btn-primary" onClick={showDemo}>View sample analysis</button>}
                      <button className="btn btn-outline" onClick={reset}>Try upload again</button>
                    </div>
                  </>
                ) : errorCode === 'model_access' ? (
                  <>
                    <div className="vod-error-icon">{'🔧'}</div>
                    <h3>Provisioning model access</h3>
                    <p>{error}</p>
                    <button className="btn btn-outline" onClick={reset}>Try again</button>
                  </>
                ) : errorCode === 'wrong_game' || errorCode === 'not_siege' ? (
                  <>
                    <div className="vod-error-icon">{'❓'}</div>
                    <p>{error}</p>
                    <button className="btn btn-outline" onClick={reset}>Upload a different screenshot</button>
                  </>
                ) : errorCode === 'usage_limit' ? (
                  <>
                    <div className="vod-error-icon">{'📊'}</div>
                    <h3>{usageError?.isTrial ? 'You\'ve used your trial sessions' : 'Monthly VOD allowance reached'}</h3>
                    <p>
                      {usageError?.used} of {usageError?.limit} sessions used.
                      {usageError?.periodEnd && (
                        <> Your allowance resets <strong>{new Date(usageError.periodEnd).toLocaleDateString()}</strong>.</>
                      )}
                    </p>
                    <p className="vod-error-sub">
                      {usageError?.isTrial
                        ? 'Subscribe to Pro to keep reviewing — Pro gets you 20 VOD sessions per month plus ban intel and opponent reads.'
                        : plan === 'pro'
                          ? 'Upgrade to Champion for 60 sessions per month, plus multi-round pattern reports and a weekly drill list.'
                          : 'Upgrade to Champion All-Access for 75 sessions per month across all 20 games.'}
                    </p>
                    <div className="vod-error-actions">
                      <button type="button" onClick={goToPricing} className="btn btn-primary">
                        {usageError?.isTrial ? 'See plans' : 'Upgrade'}
                      </button>
                      <button className="btn btn-outline" onClick={reset}>Dismiss</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{error}</p>
                    {errorCode === 'pro_required' && (
                      <button type="button" onClick={goToPricing} className="btn btn-primary">See plans</button>
                    )}
                    <button className="btn btn-outline" onClick={reset}>Try Again</button>
                  </>
                )}
              </div>
            )}

            {(canAnalyze || demoMode) && effectiveAnalysis && (
              <>
                {demoMode && (
                  <div className="vod-demo-banner">
                    <span className="vod-demo-badge">SAMPLE</span>
                    {canAnalyze
                      ? `Sample ${displayName} analysis. Upload your own screenshot to review your real match.`
                      : isHandTunedDemo
                        ? `Sample ${displayName} analysis. Sign up for Pro to review your own matches and find out exactly what cost you the round.`
                        : `Synthetic ${displayName} sample showing the format. Your real analysis references the exact map, character, and round phase the AI detects — not a stock example.`}
                    <button type="button" className="vod-demo-close" onClick={exitDemo} aria-label="Exit demo">&times;</button>
                  </div>
                )}
                <SessionResults analysis={effectiveAnalysis} />
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button type="button" onClick={demoMode ? exitDemo : reset} className="btn btn-outline">
                    {demoMode ? 'Exit demo' : 'Analyze another session'}
                  </button>
                </div>
                {demoMode && !canAnalyze && (
                  <div className="vod-demo-convert">
                    <div className="vod-demo-convert-eyebrow">That was a sample — here's the real thing</div>
                    <h3>Get this breakdown on <em>your</em> matches</h3>
                    <p>
                      Drop screenshots from a {displayName} match — death cams, post-plant freezes,
                      scoreboards. The AI reads each one, finds the recurring mistake, and gives you a
                      fix you can use next round. {isFoundingOpen()
                        ? `Founding rate locks for life if you join before ${FOUNDING_END_SHORT}.`
                        : ''}
                    </p>
                    <div className="vod-demo-convert-actions">
                      <button
                        type="button"
                        onClick={() => { track('VOD Demo Convert Click', { type: 'pro', game: activeGameId }); goToPricing() }}
                        className="btn btn-primary btn-lg"
                      >
                        {isFoundingOpen() ? 'Start Pro — $9/mo founding rate' : 'Start Pro — $12/mo'}
                      </button>
                      {!user && (
                        <button
                          type="button"
                          onClick={() => { track('VOD Demo Convert Click', { type: 'free-signup', game: activeGameId }); navigate('/auth?redirect=/vod') }}
                          className="btn btn-ghost"
                        >
                          Create a free account first
                        </button>
                      )}
                    </div>
                    {isFoundingOpen() && (() => {
                      const { days } = foundingTimeRemaining()
                      return (
                        <div className="vod-demo-convert-urgency">
                          ⏳ Founding rate ends {FOUNDING_END_SHORT}
                          {days > 0 ? ` — ${days} day${days === 1 ? '' : 's'} left` : ' — last day'}.
                          Subscribe now and your rate never goes up.
                        </div>
                      )
                    })()}
                    <div className="vod-demo-convert-trust">
                      <span>✓ 7-day money-back</span>
                      <span>✓ Cancel in one click</span>
                      <span>✓ Nobody logs into your account</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'video' && (
          <div className="vod-coming-soon">
            <div className="vod-coming-icon">🎬</div>
            <h3>Video Clip Analysis</h3>
            <p>
              Upload a clip from your match &mdash; the AI extracts key frames (round start, mid-round,
              post-plant, kill cams) and runs the same multi-image analysis across them. Up to 60s on
              Pro, 5 minutes on Champion.
            </p>
            <span className="vod-coming-badge">In progress &mdash; shipping soon</span>
            <p style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.55)', marginTop: '1rem' }}>
              For now: take 5-10 screenshots from your match and use the Screenshot tab. Same analysis depth.
            </p>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="vod-coming-soon">
            <div className="vod-coming-icon">{'🔗'}</div>
            <h3>YouTube / Twitch VOD Review</h3>
            <p>
              Paste a link to your stream VOD or YouTube video. Recon 6 will analyze key rounds and provide
              timestamped feedback on your gameplay.
            </p>
            <LinkInput disabled />
            <span className="vod-coming-badge">Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Compact usage indicator above the upload zone. Shows "X of Y VOD sessions
// left this month" with a thin progress bar. Tells users where they stand
// before they hit the 429 so the cap doesn't feel like a surprise.
// Admins + unlimited tiers get a quiet "unlimited" line. Free tier users
// don't see this at all (they can't upload anyway).
function UsageStrip({ usage, isAdmin, goToPricing }) {
  if (!usage) return null
  if (usage.unlimited || isAdmin) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.6rem 0.9rem', marginBottom: '0.85rem',
        background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.18)',
        borderRadius: 8, fontSize: '0.82rem', color: 'rgba(230,233,239,0.8)',
      }}>
        <span><strong style={{ color: '#00e5ff' }}>Admin</strong> · Unlimited VOD sessions</span>
      </div>
    )
  }
  const { used, limit, remaining, is_trial: isTrial, period_end: periodEnd } = usage
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const isLow = remaining <= 2 && remaining > 0
  const barColor = pct >= 90 ? '#ff8a8a' : pct >= 70 ? '#ffc97a' : '#7ee2a4'
  const resetLabel = isTrial
    ? 'Trial — lifetime allowance'
    : periodEnd
      ? `Resets ${new Date(periodEnd).toLocaleDateString()}`
      : 'Resets monthly'
  return (
    <div style={{
      marginBottom: '0.85rem',
      padding: '0.7rem 0.95rem',
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${isLow ? 'rgba(255,180,80,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8,
      fontSize: '0.85rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{ color: 'rgba(230,233,239,0.85)' }}>
          <strong style={{ color: '#fff' }}>{remaining}</strong> of {limit} VOD sessions left
          {isTrial && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#ffc97a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trial</span>}
        </span>
        <span style={{ color: 'rgba(230,233,239,0.5)', fontSize: '0.78rem' }}>
          {resetLabel}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s ease' }} />
      </div>
      {isLow && (
        <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#ffc97a' }}>
          Running low — {isTrial ? <button type="button" onClick={goToPricing} style={{ background: 'none', border: 'none', color: '#ffc97a', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>subscribe to Pro</button> : <button type="button" onClick={goToPricing} style={{ background: 'none', border: 'none', color: '#ffc97a', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>upgrade to Champion</button>} for more.
        </div>
      )}
    </div>
  )
}
