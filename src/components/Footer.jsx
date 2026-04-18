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
          <div className="footer-logo">Ghost <span>IGL</span></div>
          <p className="footer-tagline">AI-powered coaching for Rainbow Six Siege.<br />Your rank, earned by you.</p>
        </div>
        <div className="footer-col">
          <h4>Tools</h4>
          <ul>
            <li><Link to="/strats">Map Strats</Link></li>
            <li><Link to="/vod">VOD Review</Link></li>
            <li><span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('pricing', navigate, isLanding)}>Pricing</span></li>
            <li><span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('faq', navigate, isLanding)}>FAQ</span></li>
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
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Ghost IGL. Not affiliated with Ubisoft Entertainment.</p>
        <div className="payment-badges">
          <span>Visa</span>
          <span>Mastercard</span>
          <span>PayPal</span>
          <span>Apple Pay</span>
        </div>
      </div>
    </footer>
  )
}
