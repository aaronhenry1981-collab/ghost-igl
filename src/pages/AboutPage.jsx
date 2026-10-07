import { Link } from 'react-router-dom'
import './AboutPage.css'

// /about: who builds Recon 6, how the plans are made, and how to reach him.
// Facts here are the ones already published in the press kit (PressPage.jsx);
// add only what Aaron has written or approved himself (his photo and his own
// "why I built this" story are still to come from him).
const CHANNELS = [
  { label: 'YouTube', href: 'https://youtube.com/@MrAaron8189' },
  { label: 'Twitch', href: 'https://twitch.tv/splinter251981' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@recon6coach' },
  { label: 'Discord', href: 'https://discord.gg/namGQqs3jb' },
]

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-header">
        <div className="section-label">About</div>
        <h1>About Recon 6</h1>
        <p className="about-lead">
          Recon 6 is a Rainbow Six Siege coaching tool. One person builds and runs it: Aaron Henry, from Texas.
        </p>
      </header>

      <section className="about-section" id="aaron-henry" aria-labelledby="about-founder">
        <h2 id="about-founder">The founder</h2>
        <p>
          Aaron Henry founded Recon 6 after recording his own ranked Rainbow Six Siege matches to find the patterns
          behind repeated round losses. Those notes became a practical coaching tool: decisions a player can test in
          the next match, not a wall of generic tips.
        </p>
        <p>
          Aaron is the founder and sole engineer. He builds the website and the Recon 6 Command desktop coach, and he
          runs the live 1:1 coaching sessions sold on the <a href="/coaching/index.html">coaching page</a> and included
          with Champion.
        </p>
        <ul className="about-facts">
          <li><strong>Based in</strong> Texas, USA</li>
          <li><strong>Company</strong> Iron Front Digital LLC</li>
          <li><strong>Founded</strong> 2025</li>
          <li><strong>Funding</strong> Bootstrapped</li>
        </ul>
      </section>

      <section className="about-section" aria-labelledby="about-process">
        <h2 id="about-process">How the plans are made</h2>
        <p>
          The strats are in beta. They are drafted with AI assistance from Recon 6's map and operator data, then
          held to what can be checked: site names follow Ubisoft's official map list, callouts are matched against
          recorded gameplay where footage exists, and a plan that can't be backed up is withdrawn instead of guessed.
          The old Villa plan was pulled for exactly that reason.
        </p>
        <p>
          Screenshot reviews (AI VOD review) look only at the screenshots you upload and the map, site and side you
          pick. Nobody logs into your game account, and Recon 6 doesn't inject into the game.
        </p>
      </section>

      <section className="about-section" aria-labelledby="about-channels">
        <h2 id="about-channels">Where to find Aaron</h2>
        <ul className="about-channels">
          {CHANNELS.map((c) => (
            <li key={c.label}><a href={c.href} target="_blank" rel="noopener noreferrer">{c.label}</a></li>
          ))}
        </ul>
      </section>

      <section className="about-section" id="contact" aria-labelledby="about-contact">
        <h2 id="about-contact">Contact</h2>
        <ul className="about-contact">
          <li><strong>Email</strong> <a href="mailto:aaronhenry1981@gmail.com">aaronhenry1981@gmail.com</a></li>
          <li><strong>Members</strong> Signed-in members can open a case from <Link to="/support">Support</Link>.</li>
          <li><strong>Press</strong> Logos, screenshots and copy are in the <Link to="/press">press kit</Link>.</li>
        </ul>
      </section>

      {/* Visitors were looping home → about → pricing and leaving; give the
          page one next step: the free plan. */}
      <section className="about-section about-next" aria-label="Try a plan">
        <p>See how a plan reads before anything else: the free Bank defense needs no account.</p>
        <Link to="/strats/bank/ceo/defense" className="btn btn-primary">Open the free Bank defense <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  )
}
