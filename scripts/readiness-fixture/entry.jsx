// Local acceptance shell only. Production pages/providers and their SDKs are
// unchanged; the runner intercepts external requests before navigation/imports.
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../src/hooks/useAuth'
import { GameProvider } from '../../src/hooks/useActiveGame'
import AuthPage from '../../src/pages/AuthPage'
import VodPage from '../../src/pages/VodPage'
import '../../src/index.css'
import '../../src/App.css'
import '../../src/styles/polish.css'

export function FixtureControls() {
  const { user, plan, vodUsage, loading, signOut } = useAuth()
  const navigate = useNavigate()
  return <aside aria-label="Local test controls">
    <p>Local fixtures only: no real account, purchase, model, capture or microphone.</p>
    <output id="fixture-identity">{JSON.stringify({ subject: user?.id || null, plan, remaining: vodUsage?.remaining, loading })}</output>
    <button id="fixture-logout" onClick={() => signOut()}>Fixture sign out</button>
    <button id="fixture-login" onClick={() => navigate('/auth?redirect=/vod')}>Fixture sign in page</button>
  </aside>
}
createRoot(document.getElementById('root')).render(
  <BrowserRouter><AuthProvider><GameProvider><FixtureControls /><Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/vod" element={<VodPage />} />
    <Route path="*" element={<Navigate to="/auth?redirect=/vod" replace />} />
  </Routes></GameProvider></AuthProvider></BrowserRouter>,
)
