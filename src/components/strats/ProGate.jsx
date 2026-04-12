export default function ProGate({ label, children }) {
  return (
    <div className="pro-gate">
      <div className="pro-gate-content">
        {children}
      </div>
      <div className="pro-gate-overlay">
        <div className="pro-gate-lock">{'\uD83D\uDD12'}</div>
        <div className="pro-gate-text">
          <strong>{label || 'Pro Feature'}</strong>
          <p>Upgrade to Pro to unlock this intel</p>
        </div>
        <a
          href="https://buy.stripe.com/00weVe0gygI4c3d3tM7ss0a"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm pro-gate-btn"
        >
          Unlock for $12/mo
        </a>
      </div>
    </div>
  )
}
