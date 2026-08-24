import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { track } from '../utils/analytics'
import './AuthPage.css'

// Only allow internal paths as redirect targets — never full URLs, never protocol-relative.
// Default destination is /dashboard so signed-in users land on their home base
// (active game, recent activity, today's tip, latest content) instead of a
// raw map list that requires them to figure out what to do next.
function safeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export default function AuthPage() {
  // 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset' | 'new-password'
  // forgot → enter email, request reset code
  // reset  → enter code + new password (after forgot flow emails the code)
  // Honor ?mode=signup (etc.) so the "Sign Up" deep links in the navbar/landing
  // open the Sign Up form instead of dumping people on Sign In.
  const [searchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const [mode, setMode] = useState(
    ['signup', 'forgot'].includes(requestedMode) ? requestedMode : 'signin',
  )
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const {
    signIn,
    completeNewPassword,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    confirmForgotPassword,
    user,
    loading: authLoading,
  } = useAuth()
  const navigate = useNavigate()
  const redirectTarget = safeRedirect(searchParams.get('redirect'))
  // Already signed in? /auth is a dead end — send them to the dashboard (or
  // the requested redirect). Deep links and bookmarks kept landing signed-in
  // users on a Sign In form (2026-07-06 UX audit).
  useEffect(() => {
    if (!authLoading && user) navigate(redirectTarget || '/dashboard', { replace: true })
  }, [authLoading, user, navigate, redirectTarget])
  // Stripe payment links redirect here with ?checkout=success after payment.
  // The one thing that links their subscription to a login is signing up with
  // the SAME email they paid with — say it loudly, or they orphan themselves
  // (2 of the first 4 paying customers did exactly that).
  const fromCheckout = searchParams.get('checkout') === 'success'

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  function switchMode(next) {
    setMode(next)
    clearMessages()
    setCode('')
    if (next === 'signin' || next === 'forgot') setPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    if (mode === 'signup') {
      const { error: err } = await signUp(email, password, fullName)
      if (err) {
        // The Stripe webhook auto-provisions a Cognito login the instant payment
        // lands, so someone arriving straight from checkout usually ALREADY has
        // an account they never knowingly created. Cognito's raw "already
        // exists" error dead-ended them seconds after paying, with no hint that
        // a temporary password had been emailed — a top source of orphaned
        // paying customers. Send a reset code and drop them into the reset step
        // so they can set their own password and get in.
        const exists = err.name === 'UsernameExistsException'
          || /already exists/i.test(err.message || '')
        if (exists) {
          const { error: resetErr } = await forgotPassword(email)
          setError(null)
          if (resetErr) {
            setSuccess('You already have an account with that email. Use "Forgot password" below to set a password and sign in.')
            setMode('forgot')
          } else {
            setSuccess(
              fromCheckout
                ? 'Your account was already created when your payment went through. We just emailed you a 6-digit code — enter it below with a password of your choice to finish and unlock everything.'
                : 'You already have an account with that email. We just emailed you a 6-digit code — enter it below with a new password.',
            )
            setMode('reset')
            setCode('')
          }
        } else {
          setError(err.message)
        }
      } else {
        track('Signup Started')
        setSuccess('Account created! Check your email for a 6-digit confirmation code.')
        setMode('confirm')
      }
    } else if (mode === 'confirm') {
      const { error: err } = await confirmSignUp(email, code)
      if (err) {
        setError(err.message)
      } else {
        // Auto sign-in after confirmation if we still have the password
        if (password) {
          const { error: signInErr } = await signIn(email, password)
          if (signInErr) {
            setSuccess('Account confirmed! Please sign in.')
            setMode('signin')
            setCode('')
          } else {
            track('Signup Completed')
            navigate(redirectTarget)
          }
        } else {
          track('Signup Completed')
          setSuccess('Account confirmed! Please sign in.')
          setMode('signin')
          setCode('')
        }
      }
    } else if (mode === 'new-password') {
      const { error: err } = await completeNewPassword(password)
      if (err) {
        setError(err.message)
      } else {
        track('First Login Password Set')
        navigate(redirectTarget)
      }
    } else if (mode === 'forgot') {
      const { error: err } = await forgotPassword(email)
      if (err) {
        setError(err.message)
      } else {
        setSuccess('A 6-digit reset code has been emailed to you. Enter it below with your new password.')
        setMode('reset')
        setCode('')
      }
    } else if (mode === 'reset') {
      const { error: err } = await confirmForgotPassword(email, code, password)
      if (err) {
        setError(err.message)
      } else {
        // Auto-sign-in with the new password
        const { error: signInErr } = await signIn(email, password)
        if (signInErr) {
          setSuccess('Password reset! Please sign in.')
          setMode('signin')
          setCode('')
        } else {
          navigate(redirectTarget)
        }
      }
    } else {
      const { data, error: err } = await signIn(email, password)
      if (data?.challenge === 'NEW_PASSWORD_REQUIRED') {
        setError(null)
        setSuccess('Temporary password accepted. Choose your permanent password to finish setting up your account.')
        setPassword('')
        setMode('new-password')
        setLoading(false)
        return
      }
      if (err) {
        if (err.message === 'User is not confirmed.') {
          setError(null)
          setSuccess('This account needs confirmation. Enter the 6-digit code from your email (or resend a new one).')
          setMode('confirm')
        } else {
          setError(err.message)
        }
      } else {
        // Honor ?redirect=... param if set, otherwise default to /dashboard
        // so signed-in users land on their home base instead of a map list.
        navigate(redirectTarget)
      }
    }
    setLoading(false)
  }

  async function handleResend() {
    clearMessages()
    setLoading(true)
    const { error: err } = await resendConfirmationCode(email)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('A new confirmation code has been sent to your email.')
    }
    setLoading(false)
  }

  async function handleResendReset() {
    clearMessages()
    setLoading(true)
    const { error: err } = await forgotPassword(email)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('A new reset code has been sent to your email.')
    }
    setLoading(false)
  }

  const title =
    mode === 'signin' ? 'Sign In' :
    mode === 'signup' ? 'Create Account' :
    mode === 'confirm' ? 'Confirm Your Email' :
    mode === 'forgot' ? 'Reset Password' :
    mode === 'new-password' ? 'Finish Account Setup' :
    'Set New Password'

  const subtitle =
    mode === 'signin' ? 'Sign in to your Recon 6 account.' :
    mode === 'signup' ? 'Create your free Recon 6 account.' :
    mode === 'confirm' ? 'Enter the 6-digit code we emailed to confirm your account.' :
    mode === 'forgot' ? "Enter your email and we'll send a 6-digit reset code." :
    mode === 'new-password' ? 'Your temporary password worked. Choose the permanent password you will use from now on.' :
    'Enter the reset code we emailed and pick a new password.'

  const submitLabel =
    mode === 'signin' ? 'Sign In' :
    mode === 'signup' ? 'Create Account' :
    mode === 'confirm' ? 'Confirm Account' :
    mode === 'forgot' ? 'Send Reset Code' :
    mode === 'new-password' ? 'Save Password and Sign In' :
    'Set New Password'

  // Field visibility per mode
  const showEmail = true
  const emailDisabled = mode === 'confirm' || mode === 'reset' || mode === 'new-password'
  const showPassword = mode === 'signin' || mode === 'signup' || mode === 'reset' || mode === 'new-password'
  const passwordPlaceholder =
    mode === 'reset' || mode === 'new-password' ? 'New password (min 8 chars)' :
    mode === 'signin' ? 'Your password' :
    'Min 8 characters, mix of letters and numbers'
  // Cognito default policy requires 8+ chars with upper/lower/number. Match
  // it across all forms so users don't get a confusing post-submit rejection.
  const passwordMinLength = mode === 'signin' ? 1 : 8
  const showCode = mode === 'confirm' || mode === 'reset'

  const storyTitle = mode === 'signup'
    ? 'Your next round starts with a clear job.'
    : mode === 'signin'
      ? 'Get back to the plan. Keep climbing.'
      : 'Get your account secure and get back in.'

  const storyBody = mode === 'signup'
    ? 'Create a free player account to keep your R6 preparation, round reviews, and next-match focus in one place.'
    : mode === 'signin'
      ? 'Your saved plan, Road to Champion progress, and coaching tools are waiting.'
      : 'We will walk you through the account step without losing your place or your plan.'

  return (
    <div className={`auth-page auth-page-${mode}`}>
      <div className="auth-page-art" aria-hidden="true" />
      <div className="auth-page-shade" aria-hidden="true" />
      <div className="auth-shell">
        <aside className="auth-story">
          <div className="auth-story-kicker">RECON 6 · PLAYER ACCESS</div>
          <h1>{storyTitle}</h1>
          <p>{storyBody}</p>
          <div className="auth-story-brief">
            <div className="auth-story-brief-head">
              <span>EXAMPLE PLAYER JOB</span>
              <i />
            </div>
            <strong>Bank · 2F CEO · Attack</strong>
            <div className="auth-story-job">
              <span>TH</span>
              <div><strong>Thermite</strong><small>Hard breach</small></div>
              <p>Open the CEO double wall after denial clears.</p>
            </div>
          </div>
          <ul className="auth-story-points">
            <li><span>01</span> Free map, operator, and strategy foundation</li>
            <li><span>02</span> Try a real round review before paying</li>
            <li><span>03</span> No game login, injection, or account sharing</li>
          </ul>
        </aside>

        <div className="auth-card-wrap">
          <div className="auth-card-eyebrow">
            <span>{mode === 'signup' ? 'FREE PLAYER ACCOUNT' : 'SECURE PLAYER LOGIN'}</span>
            <Link to="/strats">Preview a strat →</Link>
          </div>
          <div className="auth-card">
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {fromCheckout && mode === 'signup' && (
          <div className="auth-success" style={{ lineHeight: 1.45 }}>
            <strong>Payment received — one last step.</strong><br />
            Create your account with the <strong>same email you used at checkout</strong>.
            That links your subscription automatically and unlocks everything.
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Sign-up only: capture who they actually are. An email alone makes
              every support reply and coaching session start with "hey there" —
              and the admin member list unreadable. */}
          {mode === 'signup' && (
            <label className="auth-label">
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="auth-input"
                placeholder="First and last name"
              />
            </label>
          )}

          {showEmail && (
            <label className="auth-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="your@email.com"
                disabled={emailDisabled}
              />
            </label>
          )}

          {showCode && (
            <label className="auth-label">
              {mode === 'reset' ? 'Reset Code' : 'Confirmation Code'}
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                className="auth-input"
                placeholder="6-digit code"
                autoFocus
              />
            </label>
          )}

          {showPassword && (
            <label className="auth-label">
              {mode === 'reset' || mode === 'new-password' ? 'New Password' : 'Password'}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={passwordMinLength}
                className="auth-input"
                placeholder={passwordPlaceholder}
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Loading...' : submitLabel}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="auth-legal">
            By creating an account, you agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </p>
        )}

        {mode === 'signin' && (
          <p className="auth-switch" style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>
          </p>
        )}

        {mode === 'confirm' && (
          <p className="auth-switch">
            Didn't get a code?{' '}
            <button type="button" onClick={handleResend} disabled={loading || !email}>Resend code</button>
            {' · '}
            <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>
          </p>
        )}

        {mode === 'reset' && (
          <p className="auth-switch">
            Didn't get a code?{' '}
            <button type="button" onClick={handleResendReset} disabled={loading || !email}>Resend code</button>
            {' · '}
            <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="auth-switch">
            <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>
          </p>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <p className="auth-switch">
            {mode === 'signin' ? (
              <>Don't have an account? <button type="button" onClick={() => switchMode('signup')}>Sign Up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign In</button></>
            )}
          </p>
        )}

        {mode === 'new-password' && (
          <p className="auth-switch">
            Temporary password expired?{' '}
            <button type="button" onClick={() => switchMode('signin')}>Start again</button>
          </p>
        )}
          </div>
          <div className="auth-card-trust">
            <span><i /> Free to start</span>
            <span>No credit card</span>
            <span>Cancel paid plans online</span>
          </div>
        </div>
      </div>
    </div>
  )
}
