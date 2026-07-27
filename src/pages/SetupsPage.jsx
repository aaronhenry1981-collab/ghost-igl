import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ChampionGate from '../components/strats/ChampionGate'
import SITE_INDEX, { SITE_TALLY } from '../data/site-index'
import { setupFor } from '../data/verified-setups'
import VERIFIED_CALLOUTS from '../data/verified-callouts'
import { PICK_ORDER, AVOID, poolFor } from '../data/pick-order'
import { OP_ROSTER } from '../data/op-roster'
import SquadRoster, { loadRoster, rosterPool } from '../components/SquadRoster'
import './SetupsPage.css'

// SETUP LIBRARY — every map, every bomb site, with an honest status on each.
//
// The point of listing sites we have NOTHING for is that they are the work
// queue: play a site, its geography gets read off the recording, and it moves
// up a tier. A library showing only the two finished maps would be useless as a
// reference and would hide the roadmap.
//
// The three states must never be rendered the same way. Everything this page is
// worth rests on a reader being able to tell, at a glance, what is proven and
// what is not.

const STATUS = {
  verified: { label: 'Verified', cls: 'ok', blurb: 'Setup written from recorded matches.' },
  geography: { label: 'Names confirmed', cls: 'part', blurb: 'Room and spawn names read off the objective screen. No setup written yet.' },
  unverified: { label: 'Not verified', cls: 'none', blurb: 'Nothing from footage yet. Play it and it enters the queue.' },
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.unverified
  return <span className={`sx-badge sx-${s.cls}`}>{s.label}</span>
}

function Steps({ title, items }) {
  if (!items || !items.length) return null
  return (
    <div className="sx-block">
      <h4>{title}</h4>
      <ol>{items.map((t, i) => <li key={i}>{t}</li>)}</ol>
    </div>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return <p className="sx-field"><span>{label}</span>{value}</p>
}

// Seats must be resolved TOGETHER, in order, sharing one running set of what is
// already spoken for. Resolving each independently handed the same substitute to
// two players: banning Kaid gave Aaron Vigil AND left Vigil on a teammate.
function resolveSeats(wanted, side, gone) {
  const used = new Set()
  return wanted.map(({ who, op, note }) => {
    const isGone = op && gone.has(op.toLowerCase())
    const clash = op && used.has(op.toLowerCase())
    let use = op
    if (isGone || clash) {
      const alt = (PICK_ORDER[side] || [])
        .find((p) => !gone.has(p.op.toLowerCase()) && !used.has(p.op.toLowerCase()))
      use = alt ? alt.op : null
    }
    if (use) used.add(use.toLowerCase())
    // Distinguish the two reasons: banned is a fact about the match, taken is a
    // consequence of the seat above. Calling both "gone" told him Kapkan was
    // banned when a teammate had simply claimed it.
    return { who, op: use, swappedFrom: (isGone || clash) ? op : null,
             swapReason: isGone ? 'banned' : clash ? 'taken' : null, note }
  })
}

function Seat({ who, op, swappedFrom, swapReason, note }) {
  return (
    <div className={`sx-pick${swappedFrom ? ' sx-pick-swapped' : ''}`}>
      <span className="sx-pick-who">{who === 'You' ? 'You play' : `${who} plays`}</span>
      <strong>{op || '—'}</strong>
      {swappedFrom
        ? <span className="sx-pick-note sx-swap">{swappedFrom} {swapReason === 'taken' ? 'taken' : 'banned'} · next best</span>
        : note ? <span className="sx-pick-note">{note}</span> : null}
    </div>
  )
}

// Side is owned by the PAGE, not this component. Two independent toggles meant
// the ban chips could be listing attackers while the setup below showed the
// defense plan.
// A plan can name an operator in its steps ("before Ace commits a charge").
// If that operator is banned and nobody on the squad replaced the role, the
// written plan is no longer runnable — and silently leaving the text up tells
// the player to use a gadget they do not have.
function brokenPremise(d, seats, gone, side) {
  const text = [
    ...(d.approach || []), ...(d.job || []), ...(d.duoJob || []),
    ...(d.reinforce || []), d.plant || '', d.anchor || '',
  ].join(' ')
  const assigned = new Set(seats.map((s) => (s.op || '').toLowerCase()))
  // Whole-word match so "Ace" does not fire on "placed". No regex building —
  // escaping it through a generator is what broke this the first time.
  const words = new Set(text.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean))
  // ONLY operators on your own side. An attack plan names enemy defenders too
  // ("EMP to kill a Jager ADS"), and banning one of those makes the plan easier,
  // not broken — flagging it told the player his plan was dead when the ban had
  // gone in his favour.
  const named = (OP_ROSTER[side] || [])
    .filter((op) => op.toLowerCase().split(' ').every((w) => words.has(w)))
  return named.filter((op) => gone.has(op.toLowerCase()) && !assigned.has(op.toLowerCase()))
}

// What this plan takes on faith, and how much of it would fall over.
//
// Every setup already carries an `unverifiedSpots` list, and nothing rendered
// it. So Oregon Kids' Dorms shipped wearing a Verified badge with eleven steps
// hanging off a ceiling hatch that does not exist — its own data said the hatch
// was unconfirmed and the page never showed anyone. "Verified" means the room
// NAMES came off the screen. It has never meant the geometry was checked.
//
// Ranked by how many steps actually depend on each one, so the thirty seconds
// in a custom game go to the assumption that would cost the most rounds.
function assumptionRisk(full, side) {
  const spots = full?.unverifiedSpots || []
  if (!spots.length) return []
  const s = full[side] || {}
  const steps = [
    ...(s.reinforce || []), ...(s.job || []), ...(s.duoJob || []), ...(s.approach || []),
    s.anchor, s.fallback, s.roam, s.randoms, s.spawn, s.plant, s.ifStalled,
  ].filter(Boolean)

  return spots.map((spot) => {
    // The head noun is everything before the em-dash explanation.
    const head = spot.split(/\s+[—-]\s+/)[0].replace(/^The\s+/i, '').replace(/\(.*?\)/g, '')
      .split(/,| inside | between | leading | reachable /)[0].trim()
    const depends = head.length > 8
      ? steps.filter((t) => t.toLowerCase().includes(head.toLowerCase())).length
      : 0
    return { spot, head, depends }
  }).filter((x) => x.depends > 0).sort((a, b) => b.depends - a.depends)
}

function Assumptions({ full, side }) {
  const risk = assumptionRisk(full, side)
  const uncertain = full?.uncertain || []
  if (!risk.length && !uncertain.length) return null
  const worst = risk[0]
  const heavy = worst && worst.depends >= 4

  return (
    <div className={`sx-assume${heavy ? ' heavy' : ''}`}>
      <h4>
        {heavy
          ? `Check this before you trust the plan — ${worst.depends} steps rest on it`
          : 'What this plan assumes'}
      </h4>
      {risk.length > 0 && (
        <ul className="sx-assume-list">
          {risk.map((r) => (
            <li key={r.spot}>
              <span className="sx-assume-n">{r.depends}</span>
              <span>{r.spot}</span>
            </li>
          ))}
        </ul>
      )}
      {uncertain.length > 0 && (
        <details className="sx-assume-more">
          <summary>{uncertain.length} open question{uncertain.length === 1 ? '' : 's'} to settle in a custom game</summary>
          <ul>{uncertain.map((u) => <li key={u}>{u}</li>)}</ul>
        </details>
      )}
      <p className="sx-assume-foot">
        Verified means the room names were read off your own screen. It does not mean anyone has
        stood in the room and checked the geometry. If one of these is wrong, tell me and the plan
        gets rewritten around it.
      </p>
    </div>
  )
}

function VerifiedSetup({ setupKey, squad, mates, gone = new Set(), side, setSide }) {
  const data = setupFor(setupKey.split(':')[0], setupKey.split(':')[1])
  if (!data) return null
  // The page shows the FULL plan. The short fields exist for the coach's voice,
  // and rendering those here produced fragments like "confirm it worked" with
  // nothing before it saying what to do.
  const d = (data.full && data.full[side]) || data[side]
  const stacked = squad > 1

  // The verified data names two picks: his and his partner's. For a trio or
  // bigger, fill the remaining seats from the pick order, skipping anything
  // already taken. Better than showing three players nothing.
  const claimed = new Set([d.me, d.duo].filter(Boolean).map((x) => x.toLowerCase()))
  const extras = (PICK_ORDER[side] || [])
    .filter((p) => !claimed.has(p.op.toLowerCase()) && !gone.has(p.op.toLowerCase()))
    .slice(0, Math.max(0, squad - 2))

  // One ordered list, resolved once, so no two players are handed the same op.
  const seats = resolveSeats([
    { who: 'You', op: d.me },
    ...(stacked && d.duo ? [{ who: mates[0] || 'Your duo', op: d.duo }] : []),
    ...extras.map((p, i) => ({
      who: mates[i + 1] || `Player ${i + 3}`,
      op: p.op,
      note: `next best open · ${p.win}`,
    })),
  ], side, gone)

  return (
    <div className="sx-setup">
      {(() => {
        const broken = brokenPremise(d, seats, gone, side)
        if (!broken.length) return null
        return (
          <div className="sx-broken">
            <strong>This plan no longer works.</strong>
            <p>
              It is built around <b>{broken.join(' and ')}</b>, {broken.length > 1 ? 'both banned' : 'which is banned'}.
              The steps below still call for {broken.length > 1 ? 'those gadgets' : 'that gadget'} and nobody in your
              squad has {broken.length > 1 ? 'them' : 'it'} — do not run this as written.
            </p>
            {d.ifStalled ? <p className="sx-broken-alt"><span>Use the fallback:</span> {d.ifStalled}</p> : null}
          </div>
        )
      })()}

      <div className="sx-picks">
        {seats.map((s) => (
          <Seat key={s.who + (s.op || '')} who={s.who} op={s.op}
                swappedFrom={s.swappedFrom} swapReason={s.swapReason} note={s.note} />
        ))}
      </div>

      {side === 'defense' ? (
        <>
          <Steps title="Reinforce, in this order" items={d.reinforce} />
          <Steps title="Your job" items={d.job} />
          {stacked && <Steps title={mates[0] ? `Tell ${mates[0]}` : 'Tell your duo'} items={d.duoJob} />}
          <Field label="Anchor" value={d.anchor} />
          <Field label="If you lose site" value={d.fallback} />
        </>
      ) : (
        <>
          <Field label="Spawn" value={d.spawn} />
          <Steps title="Approach" items={d.approach} />
          <Steps title="Your job" items={d.job} />
          {stacked && <Steps title={mates[0] ? `Tell ${mates[0]}` : 'Tell your duo'} items={d.duoJob} />}
          <Field label="Plant" value={d.plant} />
        </>
      )}

      <Assumptions full={data.full} side={side} />
    </div>
  )
}

function GeographyOnly({ mapId, site }) {
  const geo = VERIFIED_CALLOUTS[mapId]
  const callouts = geo ? geo.callouts.slice(0, 14) : []
  return (
    <div className="sx-partial">
      <p>
        The room names on this site are confirmed — they were read off your own objective screen
        {geo ? ` across ${geo.framesRead} frames from ${geo.sessions} recorded ${geo.sessions === 1 ? 'session' : 'sessions'}` : ''}.
        No setup is written for it yet, so nothing below tells you where to stand: that would be a guess,
        and guesses are what this library exists to replace.
      </p>
      {geo && geo.spawns?.length > 0 && (
        <Field label="Attack spawns" value={geo.spawns.map((s) => s.name).join(' · ')} />
      )}
      {callouts.length > 0 && (
        <div className="sx-block">
          <h4>Confirmed callouts on this map</h4>
          <p className="sx-callouts">
            {callouts.map((c) => `${c.floor ? c.floor + ' ' : ''}${c.name}`).join('  ·  ')}
          </p>
        </div>
      )}
    </div>
  )
}

function Unverified() {
  return (
    <div className="sx-partial">
      <p>
        Nothing verified here yet. Play this site with the coach recording and its geography gets read
        off the footage — room names, floors and attack spawns — which moves it up a tier automatically.
        Until then there is deliberately nothing here rather than a plausible guess.
      </p>
    </div>
  )
}

// Who to play, on ANY site, verified or not. The setup is map-specific; the pick
// is not — it comes from his own win rates. Withholding it on unverified sites
// left the page blank in the exact moment it was needed.
function PickOrder({ side, squad = 1, mates = [], gone = new Set(), roster = [] }) {
  // "gone" = banned by either team, or already taken by a teammate. Same thing
  // from your seat: you cannot have it, so it must not be the recommendation.
  const list = (PICK_ORDER[side] || []).filter((p) => !gone.has(p.op.toLowerCase()))

  // Assign a seat to every player, not just Aaron. Naming the squad was
  // pointless while the page still only answered "what do YOU play" on the 92
  // sites with no written setup.
  const taken = new Set()
  const seats = []
  const yours = list.find((p) => !taken.has(p.op.toLowerCase()))
  if (yours) { taken.add(yours.op.toLowerCase()); seats.push({ who: 'You', op: yours.op, win: yours.win, sure: true }) }
  for (let i = 0; i < squad - 1; i++) {
    const name = mates[i]
    // Saved roster first — that is the one HE curated. poolFor() is the built-in
    // fallback for Jackson, who predates the roster feature.
    const saved = rosterPool(roster, name, side)
    const own = saved ? { [side]: saved } : poolFor(name)
    const pick = own
      ? (own[side] || []).find((op) => !taken.has(op.toLowerCase()) && !gone.has(op.toLowerCase()))
      : (list.find((p) => !taken.has(p.op.toLowerCase())) || {}).op
    if (!pick) continue
    taken.add(String(pick).toLowerCase())
    seats.push({
      who: name || (i === 0 ? 'Your duo' : `Player ${i + 2}`),
      op: pick,
      sure: !!own,
    })
  }

  return (
    <div className="sx-pickorder">
      {squad > 1 && (
        <div className="sx-seats">
          <h4>Your squad here — {side}</h4>
          <div className="sx-picks">
            {seats.map((s) => (
              <div className={`sx-pick${s.sure ? '' : ' sx-pick-soft'}`} key={s.who + s.op}>
                <span className="sx-pick-who">{s.who === 'You' ? 'You play' : `${s.who} plays`}</span>
                <strong>{s.op}</strong>
                <span className="sx-pick-note">
                  {s.win ? `your ${s.win}` : s.sure ? 'from their own pool' : 'best still open'}
                </span>
              </div>
            ))}
          </div>
          <p className="sx-pickorder-note">
            Names we hold a pool for get an operator they actually play. Anyone else gets the best
            pick still open, marked as such — we are not pretending to know what a stranger runs.
          </p>
        </div>
      )}
      <h4>Full order — {side === 'attack' ? 'attack' : 'defense'}</h4>
      <p className="sx-pickorder-note">
        Take the highest name that is open and not banned. This comes from your own win rate, so it
        holds on every map — including the ones with no setup written yet.
      </p>
      <ol className="sx-picklist">
        {list.map((p) => (
          <li key={p.op}>
            <strong>{p.op}</strong>
            <span className="sx-win">{p.win}</span>
            <span className="sx-why">{p.why}</span>
          </li>
        ))}
      </ol>
      <p className="sx-avoid">
        <span>Not these</span>
        {AVOID.map((a) => `${a.op} ${a.win}${a.note ? ` (${a.note})` : ''}`).join(' · ')}
      </p>
    </div>
  )
}

export default function SetupsPage() {
  const { plan, isAdmin } = useAuth()
  const [openMap, setOpenMap] = useState('oregon')
  const [openSite, setOpenSite] = useState(null)
  const [openSide, setOpenSide] = useState('attack')
  // Squad SIZE and WHO. Size alone was not enough — "duo" could not say which
  // of your mates takes the second pick, and a trio or 5-stack had no option at
  // all. Names persist so this is set once, not every visit.
  const [squad, setSquad] = useState(() => {
    const n = parseInt(localStorage.getItem('recon6-squad-size') || '2', 10)
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 2
  })
  const [mates, setMates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recon6-squad-mates') || '[]') } catch { return [] }
  })
  const [editSquad, setEditSquad] = useState(false)
  const [roster, setRoster] = useState(() => loadRoster())
  const [rankedOnly, setRankedOnly] = useState(true)
  // Banned by either team, or already locked by a teammate. From your seat the
  // two are the same problem: you cannot have it. Not persisted — bans change
  // every match, and a stale ban is worse than no ban.
  const [gone, setGone] = useState(() => new Set())
  const toggleGone = (op) => setGone((prev) => {
    const next = new Set(prev)
    const k = op.toLowerCase()
    if (next.has(k)) next.delete(k); else next.add(k)
    return next
  })

  const setSquadSize = (n) => {
    setSquad(n)
    localStorage.setItem('recon6-squad-size', String(n))
  }
  const setMate = (i, v) => {
    const next = [...mates]
    next[i] = v
    setMates(next)
    localStorage.setItem('recon6-squad-mates', JSON.stringify(next))
  }

  const maps = useMemo(() => {
    const list = SITE_INDEX.filter((m) => !m.comingSoon)
    // A map you have actually PLAYED is never hidden. Villa and Skyscraper are
    // out of the ranked rotation, so the filter swallowed them the same night
    // their geography got verified off Aaron's own footage — you record a map,
    // it verifies, and then it is invisible. Footage always beats the filter.
    const shown = rankedOnly
      ? list.filter((m) => m.rankedPool || m.framesRead > 0)
      : list
    // Most-verified first — the finished work should be the first thing seen,
    // and the empty maps read as a queue rather than as failure.
    return [...shown].sort((a, b) => {
      const score = (m) => m.sites.filter((s) => s.status === 'verified').length * 10
        + m.sites.filter((s) => s.status === 'geography').length
      return score(b) - score(a) || a.name.localeCompare(b.name)
    })
  }, [rankedOnly])

  const active = maps.find((m) => m.id === openMap) || maps[0]

  return (
    <div className="setups-page">
      <header className="sx-head">
        <h1>Setup Library</h1>
        <p className="sx-sub">
          Every map, every bomb site. Each one carries its own status, because a setup read off real
          footage and a setup someone imagined are not the same thing and should never look the same.
        </p>
        <div className="sx-tally">
          <span className="sx-badge sx-ok">{SITE_TALLY.verified} verified</span>
          <span className="sx-badge sx-part">{SITE_TALLY.geography} names confirmed</span>
          <span className="sx-badge sx-none">{SITE_TALLY.unverified} not yet</span>
        </div>
      </header>

      <div className="sx-controls">
        {/* Side lives at page level: the ban chips depend on it, and it used to
            be reachable only inside an expanded site — close them all and you
            were stuck on attack with no way back. */}
        <div className="sx-seg sx-seg-side">
          <button className={openSide === 'attack' ? 'on' : ''} onClick={() => setOpenSide('attack')}>Attack</button>
          <button className={openSide === 'defense' ? 'on' : ''} onClick={() => setOpenSide('defense')}>Defense</button>
        </div>
        <div className="sx-seg">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={squad === n ? 'on' : ''} onClick={() => setSquadSize(n)}>
              {['Solo', 'Duo', 'Trio', '4-stack', '5-stack'][n - 1]}
            </button>
          ))}
        </div>
        {squad > 1 && (
          <button className="sx-who" onClick={() => setEditSquad((v) => !v)}>
            {mates.slice(0, squad - 1).filter(Boolean).length
              ? `with ${mates.slice(0, squad - 1).filter(Boolean).join(', ')}`
              : 'who are you playing with?'}
          </button>
        )}
        <label className="sx-check">
          <input type="checkbox" checked={rankedOnly} onChange={(e) => setRankedOnly(e.target.checked)} />
          Ranked pool only
        </label>
      </div>

      <div className="sx-bans">
        <div className="sx-bans-head">
          <strong>Gone this round</strong>
          <span>Tap anything banned or already taken on the <strong>{openSide}</strong> side — every pick re-sorts around it.</span>
          {gone.size > 0 && <button className="sx-clear" onClick={() => setGone(new Set())}>clear {gone.size}</button>}
        </div>
        <div className="sx-banchips">
          {/* Full roster for the side you are actually on. Yours are marked so
              they are findable in a list of forty. */}
          {[...(OP_ROSTER[openSide] || [])].sort().map((op) => {
            const mine = (PICK_ORDER[openSide] || []).some((p) => p.op.toLowerCase() === op.toLowerCase())
            return (
              <button
                key={op}
                className={`sx-banchip${gone.has(op.toLowerCase()) ? ' out' : ''}${mine ? ' mine' : ''}`}
                onClick={() => toggleGone(op)}
                title={mine ? 'in your pool' : undefined}
              >{op}</button>
            )
          })}
        </div>
      </div>

      {squad > 1 && editSquad && (
        <>
          <SquadRoster roster={roster} setRoster={setRoster} onClose={() => setEditSquad(false)} />
          <div className="sx-squadedit">
            <p>Who is in each seat tonight?</p>
            <div className="sx-mateinputs">
              {Array.from({ length: squad - 1 }).map((_, i) => (
                <select key={i} value={mates[i] || ''} onChange={(e) => setMate(i, e.target.value)}>
                  <option value="">{i === 0 ? 'Your duo…' : `Player ${i + 2}…`}</option>
                  {roster.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              ))}
            </div>
            <button className="sx-done" onClick={() => setEditSquad(false)}>Done</button>
          </div>
        </>
      )}

      <div className="sx-layout">
        <nav className="sx-maps">
          {maps.map((m) => {
            const v = m.sites.filter((s) => s.status === 'verified').length
            const g = m.sites.filter((s) => s.status === 'geography').length
            return (
              <button
                key={m.id}
                className={m.id === active?.id ? 'on' : ''}
                onClick={() => { setOpenMap(m.id); setOpenSite(null) }}
              >
                <span className="sx-mapname">{m.name}</span>
                <span className="sx-dots">
                  {m.sites.map((s, i) => <i key={i} className={`sx-dot sx-${STATUS[s.status].cls}`} />)}
                </span>
                <span className="sx-mapmeta">
                  {v ? `${v} verified` : g ? `${g} confirmed` : 'not yet'}
                  {!m.rankedPool && m.framesRead > 0 ? <span className="sx-offpool"> · off-pool</span> : null}
                </span>
              </button>
            )
          })}
        </nav>

        <section className="sx-detail">
          {active && (
            <>
              <div className="sx-detail-head">
                <h2>{active.name}</h2>
                {active.framesRead > 0 && (
                  <p className="sx-receipt">
                    Read from {active.framesRead} frames across {active.sessions} recorded{' '}
                    {active.sessions === 1 ? 'session' : 'sessions'}
                    {active.spawns.length ? ` · spawns: ${active.spawns.join(', ')}` : ''}
                  </p>
                )}
              </div>

              {active.sites.map((s) => {
                const open = openSite === s.id
                return (
                  <article key={s.id} className={`sx-site ${open ? 'open' : ''}`}>
                    <button className="sx-site-head" onClick={() => setOpenSite(open ? null : s.id)}>
                      <span className="sx-site-name">
                        {s.floor ? <em>{s.floor}</em> : null} {s.name}
                      </span>
                      <Badge status={s.status} />
                    </button>
                    {open && (
                      <div className="sx-site-body">
                        <p className="sx-status-blurb">{STATUS[s.status].blurb}</p>
                        {s.status === 'verified' ? (
                          <ChampionGate label="Champion — verified setups">
                            <VerifiedSetup setupKey={s.setupKey} squad={squad} mates={mates} gone={gone}
                                           side={openSide} setSide={setOpenSide} />
                          </ChampionGate>
                        ) : (
                          <>
                            {/* No setup yet, but the pick is still answerable. */}
                            <PickOrder side={openSide} squad={squad} mates={mates} gone={gone} roster={roster} />
                            {s.status === 'geography'
                              ? <GeographyOnly mapId={active.id} site={s} />
                              : <Unverified />}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </>
          )}
        </section>
      </div>

      <footer className="sx-foot">
        <p>
          How a site gets verified: play it with the coach recording. The objective screen, spawn screen
          and in-world labels are read straight off your own footage, so the room names here are the ones
          the game actually prints — not the ones a guide remembers.
        </p>
        {!isAdmin && plan !== 'champion' && (
          <p className="sx-foot-cta">Verified setups are Champion. Everything else on this page is free to browse.</p>
        )}
      </footer>
    </div>
  )
}
