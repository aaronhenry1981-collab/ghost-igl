// Local acceptance shell only. Production pages/providers and their SDKs are
// unchanged; the runner intercepts external requests before navigation/imports.
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../src/hooks/useAuth'
import { GameProvider } from '../../src/hooks/useActiveGame'
import AuthPage from '../../src/pages/AuthPage'
import VodPage from '../../src/pages/VodPage'
import AccountPage from '../../src/pages/AccountPage'
import ProgressPage from '../../src/pages/ProgressPage'
import SupportRoute from '../../src/features/support/SupportRoute'
import PricingSection from '../../src/components/PricingSection'
import { useCheckoutResume } from '../../src/hooks/useCheckoutResume'
import { useState } from 'react'
import '../../src/index.css'
import '../../src/App.css'
import '../../src/styles/polish.css'

export function FixtureControls() {
  const { user, plan, vodUsage, loading, signOut, signIn } = useAuth()
  const navigate = useNavigate()
  return <aside aria-label="Local test controls">
    <p>Local fixtures only: no real account, purchase, model, capture or microphone.</p>
    <output id="fixture-identity">{JSON.stringify({ subject: user?.id || null, plan, remaining: vodUsage?.remaining, loading })}</output>
    <button id="fixture-logout" onClick={() => signOut()}>Fixture sign out</button>
    <button id="fixture-login" onClick={() => navigate('/auth?redirect=/vod')}>Fixture sign in page</button>
    <button id="fixture-account" onClick={() => navigate('/account')}>Fixture account page</button>
    <button id="fixture-progress" onClick={() => navigate('/progress')}>Fixture progress page</button>
    <button id="fixture-support" onClick={() => navigate('/support')}>Fixture Support page</button>
    <button id="fixture-pricing" onClick={() => navigate('/pricing')}>Fixture pricing page</button>
    <button id="fixture-switch-a" onClick={() => signIn('subject-a@example.test', 'LocalFixture123!')}>Fixture switch to A</button>
    <button id="fixture-switch-b" onClick={() => signIn('subject-b@example.test', 'LocalFixture123!')}>Fixture switch to B</button>
  </aside>
}
export function FixturePricing() {
  const [error, setError] = useState(null)
  useCheckoutResume(error => setError(error.message))
  return <PricingSection externalError={error} />
}
createRoot(document.getElementById('root')).render(
  <BrowserRouter><AuthProvider><GameProvider><FixtureControls /><Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/vod" element={<VodPage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/progress" element={<ProgressPage />} />
    <Route path="/support" element={<SupportRoute />} />
    <Route path="/support/cases/:caseNumber" element={<SupportRoute />} />
    <Route path="/pricing" element={<FixturePricing />} />
    <Route path="/" element={<FixturePricing />} />
    <Route path="*" element={<Navigate to="/auth?redirect=/vod" replace />} />
  </Routes></GameProvider></AuthProvider></BrowserRouter>,
)
