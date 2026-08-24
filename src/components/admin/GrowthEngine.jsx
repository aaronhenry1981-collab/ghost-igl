import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getIdToken, getSession } from '../../lib/cognito'
import './GrowthEngine.css'

const LOCAL_PUBLISHER = 'http://127.0.0.1:5599'

function fileName(path) {
  return String(path || '').split(/[\\/]/).pop() || 'recording'
}

function formatWhen(value) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return 'Not scheduled'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(parsed))
}

function providerLabel(state) {
  const labels = {
    queued: 'Queued', scheduled: 'Scheduled', processing: 'Processing',
    published: 'Published', blocked: 'Blocked', 'review-required': 'Review required',
  }
  return labels[state] || 'Waiting'
}

async function localRequest(path, init = {}) {
  const user = getCurrentUser()
  if (!user) throw new Error('Sign in again to use the local publisher.')
  const session = await getSession(user)
  const token = getIdToken(session)
  const response = await fetch(`${LOCAL_PUBLISHER}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `Local publisher returned ${response.status}.`)
  return body
}

function AccountCard({ account, busy, onConnect }) {
  const ready = account.state === 'ready' || account.state === 'review-required'
  const providerName = account.provider === 'youtube' ? 'YouTube Shorts' : 'TikTok'
  return (
    <article className={`growth-account is-${account.state}`}>
      <div className="growth-account-head">
        <div><span>{providerName}</span><h3>{account.handle}</h3></div>
        <strong>{ready ? 'Connected' : 'Setup incomplete'}</strong>
      </div>
      <div className="growth-account-checks">
        <span className={account.clientConfigured ? 'ok' : ''}>Developer app {account.clientConfigured ? 'ready' : 'needed'}</span>
        <span className={account.connected ? 'ok' : ''}>Account {account.connected ? 'authorized' : 'not authorized'}</span>
        <span className={account.publicAuditApproved ? 'ok' : ''}>Public posting {account.publicAuditApproved ? 'approved' : 'awaiting platform audit'}</span>
      </div>
      <p>{account.nextAction}</p>
      {account.clientConfigured && !account.connected && (
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => onConnect(account.provider)}>
          Authorize {account.handle} once
        </button>
      )}
      {!account.clientConfigured && (
        <small>
          One-time setup file: <code>C:\IronFront_Master\aim-coach\{account.provider}-client.json</code>
        </small>
      )}
    </article>
  )
}

function QueueItem({ item, tiktokReady, busy, onTikTokPublish }) {
  const youtube = item.youtube || {}
  const tiktok = item.tiktok || {}
  const isRealClip = item.render_state === 'ready' && item.clip_path
  return (
    <article className={`growth-queue-item is-${item.render_state || 'waiting'}`}>
      <div className="growth-queue-top">
        <div>
          <span>{item.event_kind === 'death' ? 'Recorded death review' : 'Recorded round win'} · {formatWhen(item.scheduled_at)}</span>
          <h3>{item.title || 'Evidence clip waiting to render'}</h3>
        </div>
        <strong>{isRealClip ? 'Real clip ready' : providerLabel(item.render_state)}</strong>
      </div>
      <dl>
        <div><dt>Source</dt><dd>{fileName(item.source_video)} at {Math.floor(Number(item.event_secs || 0) / 60)}:{String(Number(item.event_secs || 0) % 60).padStart(2, '0')}</dd></div>
        <div><dt>Evidence</dt><dd>{item.evidence || 'No evidence recorded.'}</dd></div>
        <div><dt>Correction</dt><dd>{item.correction || 'Waiting for a recorded coaching correction.'}</dd></div>
      </dl>
      {item.render_error && <p className="growth-error">{item.render_error}</p>}
      <div className="growth-platform-row">
        <div>
          <span>YouTube</span><strong>{providerLabel(youtube.state)}</strong>
          {youtube.url && <a href={youtube.url} target="_blank" rel="noreferrer">Open verified post</a>}
          {youtube.error && <small>{youtube.error}</small>}
        </div>
        <div>
          <span>TikTok</span><strong>{providerLabel(tiktok.state)}</strong>
          {tiktok.url && <a href={tiktok.url} target="_blank" rel="noreferrer">Open verified post</a>}
          {tiktok.error && <small>{tiktok.error}</small>}
        </div>
        {isRealClip && tiktokReady && tiktok.state === 'review-required' && (
          <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => onTikTokPublish(item.id)}>
            Review & publish to TikTok
          </button>
        )}
      </div>
    </article>
  )
}

export default function GrowthEngine({ currentMrr = 0 }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const gap = Math.max(0, 10_000 - Number(currentMrr || 0))

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setError(null)
    try {
      const next = await localRequest('/social/status')
      setStatus(next)
    } catch (err) {
      if (!quiet) setError(err.message.includes('Failed to fetch')
        ? 'Start the Owner Coach, then return here. Publishing runs locally so gameplay videos never create AWS storage charges.'
        : err.message)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(() => load({ quiet: true }), 30_000)
    return () => window.clearInterval(timer)
  }, [load])

  const accounts = useMemo(() => Object.fromEntries((status?.accounts || []).map((account) => [account.provider, account])), [status])
  const items = status?.items || []

  async function runAction(action, success) {
    setBusy(true); setError(null); setNotice(null)
    try {
      await action()
      setNotice(success)
      await load({ quiet: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function scanNow() {
    return runAction(
      () => localRequest('/social/scan', { method: 'POST', body: '{}' }),
      'Latest recordings checked. Only moments with recorded evidence can enter the queue.',
    )
  }

  function connect(provider) {
    const popup = window.open('about:blank', 'recon6-provider-authorization')
    if (!popup) {
      setError('Allow the one-time authorization tab, then try again.')
      return
    }
    setBusy(true); setError(null); setNotice(null)
    localRequest('/social/oauth/start', { method: 'POST', body: JSON.stringify({ provider }) }).then((result) => {
      popup.location.replace(result.url)
      setNotice(`Authorization opened for ${provider}. Finish it once, then this page will update.`)
    }).catch((err) => {
      popup.close()
      setError(err.message)
    }).finally(() => {
      setBusy(false)
    })
  }

  function publishTikTok(id) {
    const approved = window.confirm('Publish this exact real-gameplay clip and displayed caption to @recon6coach now?')
    if (!approved) return
    return runAction(
      () => localRequest('/social/tiktok/publish', { method: 'POST', body: JSON.stringify({ id }) }),
      'TikTok accepted the upload. Recon 6 will wait for the platform status before calling it published.',
    )
  }

  return (
    <section className="growth-engine" aria-labelledby="growth-engine-title">
      <header className="growth-engine-header">
        <div>
          <span className="admin-eyebrow">Evidence publishing system · build 208</span>
          <h2 id="growth-engine-title">Three real gameplay clips each week</h2>
          <p>The Owner Coach finds recorded deaths and round wins, cuts vertical clips locally, and schedules them without Bedrock. No copied scripts, manual uploads, or fake “posted” buttons.</p>
        </div>
        <div className="growth-target">
          <span>MRR goal</span><strong>${Number(currentMrr || 0).toLocaleString()} / $10,000</strong><small>${gap.toLocaleString()} gap</small>
        </div>
      </header>

      <div className="growth-truth-strip">
        <div><strong>{status?.confirmedThisWeek ?? '—'} / {status?.weeklyTarget || 3}</strong><span>provider-confirmed this week</span></div>
        <div><strong>{items.filter((item) => item.render_state === 'ready').length}</strong><span>real clips ready</span></div>
        <div><strong>0</strong><span>AI calls for selection</span></div>
        <div><strong>Local only</strong><span>no gameplay upload to AWS</span></div>
      </div>

      {error && <div className="growth-alert is-error"><strong>Not ready yet</strong><span>{error}</span><button type="button" className="btn btn-sm btn-outline" onClick={() => load()} disabled={busy}>Check again</button></div>}
      {notice && <div className="growth-alert is-ok"><strong>Updated</strong><span>{notice}</span></div>}

      <div className="growth-section-heading">
        <div><span>One-time account authorization</span><h3>Publishing accounts</h3></div>
        <p>Passwords never go into Recon 6. Each platform grants and can revoke its own token.</p>
      </div>
      <div className="growth-account-grid">
        {(status?.accounts || []).map((account) => <AccountCard key={account.provider} account={account} busy={busy} onConnect={connect} />)}
        {!status && !error && <div className="growth-loading">Checking the Owner Coach…</div>}
      </div>

      <div className="growth-section-heading growth-queue-heading">
        <div><span>Monday · Wednesday · Friday</span><h3>Evidence queue</h3></div>
        <button type="button" className="btn btn-sm btn-outline" onClick={scanNow} disabled={busy || !status}>{busy ? 'Working…' : 'Check recordings now'}</button>
      </div>
      <p className="growth-automation-note">
        The Windows task checks automatically each day. This button is only a fallback. YouTube schedules itself after authorization and audit; TikTok requires one express Review & Publish action because TikTok’s platform rules require it.
      </p>
      <div className="growth-queue">
        {items.length ? items.map((item) => (
          <QueueItem key={item.id} item={item} tiktokReady={accounts.tiktok?.state === 'review-required'} busy={busy} onTikTokPublish={publishTikTok} />
        )) : (
          <div className="growth-empty">
            <strong>No invented assignments.</strong>
            <span>The first queue item appears only after the Coach finds a recorded death or round win with usable evidence.</span>
          </div>
        )}
      </div>
    </section>
  )
}
