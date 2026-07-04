import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  // 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset'
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
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const {
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    confirmForgotPassword,
  } = useAuth()
  const navigate = useNavigate()
  const redirectTarget = safeRedirect(searchParams.get('redirect'))
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
      const { error: err } = await signUp(email, password)
      if (err) {
        setError(err.message)
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
      const { error: err } = await signIn(email, password)
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
    'Set New Password'

  const subtitle =
    mode === 'signin' ? 'Sign in to your Recon 6 account.' :
    mode === 'signup' ? 'Create an account — first 7 days of Pro on us.' :
    mode === 'confirm' ? 'Enter the 6-digit code we emailed to confirm your account.' :
    mode === 'forgot' ? "Enter your email and we'll send a 6-digit reset code." :
    'Enter the reset code we emailed and pick a new password.'

  const submitLabel =
    mode === 'signin' ? 'Sign In' :
    mode === 'signup' ? 'Create Account' :
    mode === 'confirm' ? 'Confirm Account' :
    mode === 'forgot' ? 'Send Reset Code' :
    'Set New Password'

  // Field visibility per mode
  const showEmail = true
  const emailDisabled = mode === 'confirm' || mode === 'reset'
  const showPassword = mode === 'signin' || mode === 'signup' || mode === 'reset'
  const passwordPlaceholder =
    mode === 'reset' ? 'New password (min 8 chars)' :
    mode === 'signin' ? 'Your password' :
    'Min 8 characters, mix of letters and numbers'
  // Cognito default policy requires 8+ chars with upper/lower/number. Match
  // it across all forms so users don't get a confusing post-submit rejection.
  const passwordMinLength = mode === 'signin' ? 1 : 8
  const showCode = mode === 'confirm' || mode === 'reset'

  return (
    <div className="auth-page">
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
              {mode === 'reset' ? 'New Password' : 'Password'}
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
      </div>
    </div>
  )
}
