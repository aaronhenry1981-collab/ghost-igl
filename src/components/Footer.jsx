import { Link, useLocation, useNavigate } from 'react-router-dom'

function scrollToSection(id, navigate, isLanding) {
  const navHeight = 60
  if (isLanding) {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight
      window.scrollTo({ top, behavior: 'smooth' })
    }
  } else {
    navigate('/')
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, 300)
  }
}

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">Recon<span>6</span></div>
          <p className="footer-tagline">Climb faster in every FPS you play.<br />R6 live today. Your rank, earned by you.</p>
        </div>
        <div className="footer-col">
          <h4>Tools</h4>
          <ul>
            <li><Link to="/strats">Map Strats</Link></li>
            <li><Link to="/loadouts">Loadouts</Link></li>
            <li><Link to="/match-prep">Match Prep Cheatsheet</Link></li>
            <li><Link to="/operators">Operators</Link></li>
            <li><Link to="/meta">Meta Board</Link></li>
            <li><Link to="/vod">VOD Review</Link></li>
            <li><button type="button" className="footer-linkbtn" onClick={() => scrollToSection('pricing', navigate, isLanding)}>Pricing</button></li>
            <li><button type="button" className="footer-linkbtn" onClick={() => scrollToSection('faq', navigate, isLanding)}>FAQ</button></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Guides</h4>
          <ul>
            <li><a href="/guides/">All map guides</a></li>
            <li><a href="/guides/bank.html">Bank guide</a></li>
            <li><a href="/guides/clubhouse.html">Clubhouse guide</a></li>
            <li><a href="/guides/kafe.html">Kafe guide</a></li>
            <li><a href="/blog/">Rank-up blog</a></li>
            <li><a href="/countdown/">Next season countdown</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Community</h4>
          <ul>
            <li><a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener noreferrer">Discord</a></li>
            <li><a href="https://youtube.com/@MrAaron8189" target="_blank" rel="noopener noreferrer">YouTube</a></li>
            <li><a href="https://twitch.tv/splinter251981" target="_blank" rel="noopener noreferrer">Twitch</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Recon 6</h4>
          <ul>
            <li><Link to="/changelog">What's new</Link></li>
            <li><Link to="/press">Press kit</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Recon 6. Game names & characters are property of their respective owners. Fan-made, not affiliated.</p>
        <div className="payment-badges" aria-label="Accepted payment methods">
          <svg className="payment-badge" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="Visa" role="img">
            <title>Visa</title>
            <text x="24" y="12" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="11" fill="#1a1f71" fontStyle="italic" fontWeight="900">VISA</text>
          </svg>
          <svg className="payment-badge" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard" role="img">
            <title>Mastercard</title>
            <circle cx="20" cy="8" r="6" fill="#eb001b" />
            <circle cx="28" cy="8" r="6" fill="#f79e1b" />
            <path d="M24 3.5 a6 6 0 0 1 0 9 a6 6 0 0 1 0 -9z" fill="#ff5f00" />
          </svg>
          <svg className="payment-badge" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="American Express" role="img">
            <title>American Express</title>
            <rect width="48" height="16" rx="2" fill="#2e77bb" />
            <text x="24" y="11" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="6.5" fill="#fff" fontWeight="700">AMEX</text>
          </svg>
          <svg className="payment-badge" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal" role="img">
            <title>PayPal</title>
            <text x="24" y="11" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="9" fontWeight="900">
              <tspan fill="#003087">Pay</tspan><tspan fill="#009cde">Pal</tspan>
            </text>
          </svg>
          <svg className="payment-badge" viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Pay" role="img">
            <title>Apple Pay</title>
            <text x="4" y="11" fontFamily="-apple-system, Helvetica, sans-serif" fontSize="9" fill="currentColor" fontWeight="600">Pay</text>
            <text x="24" y="11" fontFamily="-apple-system, Helvetica, sans-serif" fontSize="9" fill="currentColor" fontWeight="600">Pay</text>
            <path d="M20 4c-0.8 0-1.5 0.5-1.8 1.2-0.3-0.7-1-1.2-1.8-1.2-1.2 0-2.2 1-2.2 2.2 0 2.2 4 4.5 4 4.5s4-2.3 4-4.5c0-1.2-1-2.2-2.2-2.2z" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
      </div>
    </footer>
  )
}
