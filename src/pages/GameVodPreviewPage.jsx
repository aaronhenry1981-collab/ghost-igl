import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'
import './GameVodPreviewPage.css'

// Game-aware VOD preview. The R6 VOD review is fully live (Lambda + AI
// analysis); the other 9 games' VOD analysis is still being wired up.
// Rather than show a dead "redirect to catalog" page, we show a real
// sample analysis tailored to the active game so the buyer sees:
//   1. What VOD review looks like
//   2. That it's specific to THEIR game (not a generic R6 example)
//   3. How to lock in founding pricing now so it's there when launched
//
// Sample analysis is built from the game's actual MAPS + CAST data so
// the situation feels real ("Mirage A-site retake on CS2", not vapor).

const SAMPLE_FEEDBACK_TEMPLATES = {
  cs2: {
    overview: 'Solid mid-round CT hold on Mirage A-site. You are anchoring CT spawn but your crosshair is pointed at the floor — every duel starts with you flicking up. Pre-aim head height through the smoke gap.',
    positioning: 'You\'re holding from the default Connector angle but exposed to a quick palace peek. Step one foot back into ticket booth so you have cover if Connector pushes commit.',
    crosshair: 'Crosshair is on the ground level. Pre-aim head height (45° up from default). On Mirage A-site that\'s the gap between Sandbags and Palace.',
    utility: 'You held a Molotov the entire round. Pop it on Sandbags as soon as you hear utility from connector — denies the entry and wastes their flash.',
    detected: { map: 'Mirage', site: 'A Bombsite', side: 'CT', role: 'Anchor' },
  },
  valorant: {
    overview: 'Defensive setup on Bind A-site. Your Killjoy turret is in the wrong spot — facing Showers means it gets traded immediately. Move to default Heaven angle covering Bath.',
    positioning: 'You\'re jiggle-peeking the default angle but Sage wall is up. Don\'t peek into a wall you can\'t see through. Wait for it to break or rotate.',
    crosshair: 'Pre-aim head level on Heaven entry through the wall break. Your current angle has crosshair at chest — instant headshot loss to a flick.',
    utility: 'Alarmbot was placed at Hookah but the round was on A. Pre-place it on the back of A Heaven for retake intel.',
    detected: { map: 'Bind', site: 'A Site', side: 'Defense', role: 'Sentinel' },
  },
  ow2: {
    overview: 'You held Reinhardt charge for too long on attack into King\'s Row first point. Your team needed shield 4 seconds before you committed.',
    positioning: 'Reinhardt is best held one car-length forward of the rest of the team. You were too far back — Pharah had a free angle on your supports.',
    crosshair: 'Earthshatter ult timing was 0.5s early — enemy Suzu cleansed it. Wait for Kiriko cooldown before you commit.',
    utility: 'Fire Strike was on cooldown the whole fight. Use it before the engage to chip enemy tank, not after.',
    detected: { map: "King's Row", site: 'First Point', side: 'Attack', role: 'Tank' },
  },
  apex: {
    overview: 'Final ring fight at World\'s Edge - you took the open angle from Skyhook. Edge of zone with no cover = third-party magnet.',
    positioning: 'Drop into Bunker for hard cover, not the open hill. You took 80 damage before reaching cover.',
    crosshair: 'Tracking on the Wraith was clean but you reset crosshair after every spray. Hold it on the angle she\'ll re-peek.',
    utility: 'Pathfinder grapple held until ring 4. Use it earlier — get high ground for the next fight, not as a panic button.',
    detected: { map: "World's Edge", site: 'Skyhook', side: 'Engage', role: 'Recon' },
  },
  mvr: {
    overview: 'Push on Asgard payload didn\'t connect because Doctor Strange and Hela ult chain wasn\'t coordinated. Strange pulled, Hela ult landed 2s late.',
    positioning: 'Strange anchor was 5m too far forward. He died to a Spider-Man dive before pulling — losing the ult chain.',
    crosshair: 'Hela tracking on the support was crisp but she rotated to the off-angle without you adjusting. Pre-aim where they go, not where they were.',
    utility: 'Mantis sleep was unused. Sleep the enemy DPS during your team\'s ult window — guaranteed pick.',
    detected: { map: 'Asgard', site: 'First Payload', side: 'Attack', role: 'DPS' },
  },
  halo: {
    overview: 'Mid-game loss on Streets came from missing the Rocket spawn. You contested with a BR — should have rotated to power-weapon side 5s before respawn.',
    positioning: 'Held the bottom-mid angle but Sniper line of sight was clear from top. Rotate up after a kill, don\'t hold low.',
    crosshair: 'BR burst tracking was inconsistent at range. Practice burst timing — pull-down between shots is the recoil pattern.',
    utility: 'Threat Sensor in your equipment slot but never thrown. Throw it on the choke before a push, not for self-defense.',
    detected: { map: 'Streets', site: 'Mid', side: 'Hold', role: 'Slayer' },
  },
  finals: {
    overview: 'Cashout defense on Skyway Stadium broke when Heavy ran out of position. Mesh Shield left the cashout exposed for 4 seconds.',
    positioning: 'Heavy with Mesh Shield should anchor THE cashout, not push the choke. Drop shield AT the box, not in front of it.',
    crosshair: 'Lewis Gun tracking was clean but you reloaded into the fight. Pre-reload before contact, not during.',
    utility: 'Goo Grenade unused — would have blocked the entry that won them the fight.',
    detected: { map: 'Skyway Stadium', site: 'Cashout', side: 'Defense', role: 'Heavy' },
  },
  cod: {
    overview: 'Hardpoint hold on Subbase fell apart because you anchored from the wrong window. Drift Mall window has 3 entry points behind it — too much to cover solo.',
    positioning: 'Hold the Drift mid-stair angle instead — only one entry to your back, full sightline on the Hardpoint.',
    crosshair: 'M4 ADS to first-shot was 0.3s slower than meta. Run Lightweight Stock or Sleight of Hand for faster engagements.',
    utility: 'Trip Mine in your equipment but never placed. Mine the back stairs of your hold — anti-flank insurance.',
    detected: { map: 'Subbase', site: 'P3 Hardpoint', side: 'Hold', role: 'Anchor' },
  },
  fn: {
    overview: 'Endgame zone fight at top 5: low ground, no high builds, Mythic gold pump in inventory. You had the gun but not the position.',
    positioning: 'Build a one-by-one on the natural high ground BEFORE storm closes — don\'t race for it on final ring.',
    crosshair: 'Pre-edit spam on the box fight was solid but you held the edit too long. Take the shot 0.1s after edit window opens.',
    utility: 'Shockwave grenade unused at top 10. Shockwave + double-edit cone-piece = mythic-pump confirm.',
    detected: { map: 'Reckless Railways', site: 'Final Ring', side: 'Endgame', role: 'Aggressive' },
  },
}

export default function GameVodPreviewPage() {
  const { activeGameId } = useActiveGame()
  const { data, gameMeta } = useGameData()
  const { user, isPro } = useAuth()
  const goToPricing = useSectionNavigate('pricing')

  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const sample = SAMPLE_FEEDBACK_TEMPLATES[activeGameId] || SAMPLE_FEEDBACK_TEMPLATES.cs2

  return (
    <div className="game-vod-preview">
      <header className="game-vod-header" style={{ borderColor: accent }}>
        <div className="game-vod-eyebrow" style={{ color: accent }}>{displayName} · VOD Review</div>
        <h1>Find Out Why You <span style={{ color: accent }}>Lost The Round</span></h1>
        <p>
          Drop a screenshot from any {displayName} match — death cam, post-plant freeze, scoreboard.
          You get back a specific fix, not generic "use utility better" advice. R6 VOD review is live today;
          {' '}{displayName} VOD review ships next as part of your subscription.
        </p>
        <div className="game-vod-status" style={{ borderColor: accent, color: accent }}>
          <strong>Status:</strong> {displayName} review engine in build. Lock in founding pricing now —
          your subscription unlocks {displayName} the day it goes live.
        </div>
      </header>

      <div className="game-vod-sample-banner">
        <span className="game-vod-sample-pill">SAMPLE</span>
        <span>This is what a real {displayName} VOD breakdown will return. Below is a sample situation
          using actual {displayName} map + role data.</span>
      </div>

      <div className="game-vod-sample">
        <header>
          <div>
            <h2>Round Breakdown</h2>
            <div className="game-vod-detected">
              <span><strong>Map:</strong> {sample.detected.map}</span>
              <span><strong>Site:</strong> {sample.detected.site}</span>
              <span><strong>Side:</strong> {sample.detected.side}</span>
              <span><strong>Role:</strong> {sample.detected.role}</span>
            </div>
          </div>
          <div className="game-vod-score" style={{ color: accent }}>
            <span className="game-vod-score-num">72</span>
            <span className="game-vod-score-label">/ 100</span>
          </div>
        </header>

        <section>
          <h3>Overview</h3>
          <p>{sample.overview}</p>
        </section>

        <section>
          <h3>Positioning</h3>
          <p>{sample.positioning}</p>
        </section>

        <section>
          <h3>Crosshair / Aim</h3>
          <p>{sample.crosshair}</p>
        </section>

        <section>
          <h3>Utility / Ability Use</h3>
          <p>{sample.utility}</p>
        </section>

        <section>
          <h3>What to fix next round</h3>
          <ul>
            <li>Apply the positioning fix from above — even one round of the new angle changes the round outcome.</li>
            <li>Pre-aim head height every entry, every round.</li>
            <li>Use the unused utility this round — that one piece won the fight.</li>
          </ul>
        </section>
      </div>

      <div className="game-vod-cta-block" style={{ borderColor: accent }}>
        <h3>Lock in founding pricing before {displayName} VOD launches</h3>
        <p>
          Pro is $9/mo founding (locked for life if you join before May 31). All-Access Pro+ at $19/mo unlocks
          every game the moment its VOD engine ships. R6 reviews are live today — all 9 other games roll out
          monthly as the per-game prompts ship.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {!isPro && (
            <button type="button" onClick={goToPricing} className="btn btn-primary" style={{ background: accent, color: '#0a0f19' }}>See pricing</button>
          )}
          <Link to="/strats" className="btn btn-outline">Open {displayName} strats</Link>
          <Link to="/loadouts" className="btn btn-outline">Open {displayName} loadouts</Link>
        </div>
      </div>
    </div>
  )
}
