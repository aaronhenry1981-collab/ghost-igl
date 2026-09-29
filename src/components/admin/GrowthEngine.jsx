import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getIdToken, getSession } from '../../lib/cognito'
import { Badge, Icon, KeyValues, Notice, Panel, StateView } from '../../features/admin/ui'
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
  const checks = [
    [account.clientConfigured, `Developer app ${account.clientConfigured ? 'ready' : 'needed'}`],
    [account.connected, `Account ${account.connected ? 'authorized' : 'not authorized'}`],
    [account.publicAuditApproved, `Public posting ${account.publicAuditApproved ? 'approved' : 'awaiting platform audit'}`],
  ]
  return (
    <article className="growth-account">
      <div className="growth-account__head">
        <div>
          <p className="ax-eyebrow">{providerName}</p>
          <p className="ax-strong">{account.handle}</p>
        </div>
        <Badge tone={ready ? 'ok' : 'warning'}>{ready ? 'Connected' : 'Setup incomplete'}</Badge>
      </div>
      <ul className="growth-checks">
        {checks.map(([ok, label]) => <li key={label} className={ok ? 'is-ok' : ''}><Icon name={ok ? 'check' : 'close'} size={14} /> {label}</li>)}
      </ul>
      {account.nextAction && <p className="ax-help">{account.nextAction}</p>}
      {account.clientConfigured && !account.connected && (
        <button type="button" className="ax-btn ax-btn--sm ax-btn--primary" style={{ marginTop: 10 }} disabled={busy} onClick={() => onConnect(account.provider)}>
          Authorize {account.handle}
        </button>
      )}
      {!account.clientConfigured && (
        <p className="ax-help" style={{ marginTop: 8 }}>One-time setup file: <code>C:\IronFront_Master\aim-coach\{account.provider}-client.json</code></p>
      )}
    </article>
  )
}

function QueueItem({ item, tiktokReady, busy, onTikTokPublish }) {
  const youtube = item.youtube || {}
  const tiktok = item.tiktok || {}
  const isRealClip = item.render_state === 'ready' && item.clip_path
  const secs = Number(item.event_secs || 0)
  return (
    <article className="growth-item">
      <div className="growth-item__head">
        <div>
          <p className="ax-eyebrow">{item.event_kind === 'death' ? 'Recorded death review' : 'Recorded round win'} · {formatWhen(item.scheduled_at)}</p>
          <p className="ax-strong">{item.title || 'Evidence clip waiting to render'}</p>
        </div>
        <Badge tone={isRealClip ? 'ok' : 'muted'}>{isRealClip ? 'Clip ready' : providerLabel(item.render_state)}</Badge>
      </div>
      <KeyValues items={[
        { label: 'Source', value: `${fileName(item.source_video)} at ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` },
        { label: 'Evidence', value: item.evidence || 'No evidence recorded.' },
        { label: 'Correction', value: item.correction || 'Waiting for a recorded coaching correction.' },
      ]} />
      {item.render_error && <Notice tone="danger">{item.render_error}</Notice>}
      <div className="growth-platforms">
        {[['YouTube', youtube], ['TikTok', tiktok]].map(([label, p]) => (
          <div key={label}>
            <span className="ax-muted">{label}</span> <span className="ax-strong">{providerLabel(p.state)}</span>
            {p.url && <> · <a className="ax-link" href={p.url} target="_blank" rel="noreferrer">Open post</a></>}
            {p.error && <p className="ax-help" style={{ color: 'var(--ax-danger)' }}>{p.error}</p>}
          </div>
        ))}
        {isRealClip && tiktokReady && tiktok.state === 'review-required' && (
          <button type="button" className="ax-btn ax-btn--sm ax-btn--primary" disabled={busy} onClick={() => onTikTokPublish(item.id)}>
            Review and publish to TikTok
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

  const confirmed = status?.confirmedThisWeek
  const target = status?.weeklyTarget || 3
  const clipsReady = items.filter((item) => item.render_state === 'ready').length

  return (
    <>
      <Panel
        title="Evidence publishing"
        description="The Owner Coach on your PC finds recorded deaths and round wins, cuts vertical clips locally and schedules them. Clip selection makes no AI calls and gameplay video never uploads to AWS."
        bodyClassName="is-flush"
      >
        <div className="ax-metrics">
          <div className="ax-metric"><p className="ax-metric__label">Posts confirmed this week</p><p className="ax-metric__value">{confirmed ?? '—'} / {target}</p><p className="ax-metric__hint">{confirmed == null ? 'Owner Coach not reachable' : 'Confirmed by the platform'}</p></div>
          <div className="ax-metric"><p className="ax-metric__label">Clips ready</p><p className="ax-metric__value">{status ? clipsReady : '—'}</p></div>
          <div className="ax-metric"><p className="ax-metric__label">MRR toward the $10,000 goal</p><p className="ax-metric__value">${Number(currentMrr || 0).toLocaleString()}</p><p className="ax-metric__hint">${gap.toLocaleString()} to go</p></div>
        </div>
      </Panel>

      {error && (
        <Notice tone="warning" title="Owner Coach not connected." actions={<button type="button" className="ax-btn ax-btn--sm" onClick={() => load()} disabled={busy}>Check again</button>}>
          {error}
        </Notice>
      )}
      {notice && <Notice tone="ok" onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <Panel title="Publishing accounts" description="Each platform grants and can revoke its own token. Passwords never go into Recon 6.">
        {!status && !error ? <StateView kind="loading" compact title="Checking the Owner Coach…" />
          : (status?.accounts || []).length === 0 ? <StateView kind="empty" compact title="No publishing accounts">Start the Owner Coach on this PC to manage accounts.</StateView>
            : <div className="growth-accounts">{status.accounts.map((account) => <AccountCard key={account.provider} account={account} busy={busy} onConnect={connect} />)}</div>}
      </Panel>

      <Panel
        title="Evidence queue"
        description="Monday, Wednesday and Friday. A Windows task checks recordings daily; this button is only a fallback. TikTok requires one Review and publish action per post."
        actions={<button type="button" className="ax-btn ax-btn--sm" onClick={scanNow} disabled={busy || !status}>{busy ? 'Working…' : 'Check recordings now'}</button>}
        bodyClassName="is-flush"
      >
        {items.length ? items.map((item) => (
          <QueueItem key={item.id} item={item} tiktokReady={accounts.tiktok?.state === 'review-required'} busy={busy} onTikTokPublish={publishTikTok} />
        )) : (
          <StateView kind="empty" title="No clips queued">An item appears only after the Coach finds a recorded death or round win with usable evidence.</StateView>
        )}
      </Panel>
    </>
  )
}
