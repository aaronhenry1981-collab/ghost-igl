import { useState, useEffect, useCallback, useMemo } from 'react'
import { generatePosts, CHANNELS } from '../../data/promoTemplates'

const USED_KEY = 'ghost-igl:promo-used'

function readUsed() {
  try {
    const raw = localStorage.getItem(USED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
function writeUsed(obj) {
  try { localStorage.setItem(USED_KEY, JSON.stringify(obj)) } catch { /* no-op */ }
}

function PostCard({ post, used, onMarkUsed }) {
  const [copied, setCopied] = useState(false)
  const [showWhy, setShowWhy] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(post.body)
      setCopied(true)
      onMarkUsed(post.templateId)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API blocked — fall back to document.execCommand
      const ta = document.createElement('textarea')
      ta.value = post.body
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true); onMarkUsed(post.templateId) } catch { /* no-op */ }
      document.body.removeChild(ta)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className={`promo-card${used ? ' promo-card-used' : ''}`}>
      <div className="promo-card-head">
        <div>
          <div className="promo-card-label">{post.templateLabel}</div>
          <div className="promo-card-subject">{post.subject}</div>
        </div>
        <button className={`promo-copy${copied ? ' copied' : ''}`} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="promo-body">{post.body}</pre>
      <div className="promo-meta">
        <button
          type="button"
          className="promo-why-toggle"
          onClick={() => setShowWhy((v) => !v)}
        >
          {showWhy ? 'Hide reasoning' : 'Why this works'}
        </button>
        {used && <span className="promo-used-flag">Used before</span>}
      </div>
      {showWhy && <p className="promo-why">{post.whyItWorks}</p>}
    </div>
  )
}

export default function PromoKit() {
  const [channel, setChannel] = useState('discord')
  const [seed, setSeed] = useState(() => Date.now().toString())
  const [used, setUsed] = useState(readUsed)

  const posts = useMemo(() => generatePosts({ channel, seed }), [channel, seed])

  const markUsed = useCallback((templateId) => {
    setUsed((prev) => {
      const next = { ...prev, [templateId]: Date.now() }
      writeUsed(next)
      return next
    })
  }, [])

  function regenerate() { setSeed(Date.now().toString()) }
  function resetUsed() {
    if (!window.confirm('Clear the "used" tracking on all templates?')) return
    setUsed({})
    writeUsed({})
  }

  const channelMeta = CHANNELS.find((c) => c.id === channel)

  return (
    <section className="admin-section admin-promo-kit">
      <div className="admin-section-header">
        <h2>Promo kit — autonomous growth posts</h2>
        <div className="admin-actions">
          <button onClick={regenerate} className="btn btn-sm btn-outline">Regenerate</button>
          <button onClick={resetUsed} className="btn btn-sm btn-outline">Reset used flags</button>
        </div>
      </div>

      <p className="admin-footnote" style={{ marginTop: 0, marginBottom: 14 }}>
        Copy-paste these into your community channels. Every post uses your real strat data (ops, sites, meta
        counts) — no generic slop. Click <strong>Regenerate</strong> to shuffle which maps/ops they pick.
      </p>

      <div className="promo-channel-tabs">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            className={`promo-channel-tab${channel === c.id ? ' active' : ''}`}
            onClick={() => setChannel(c.id)}
          >
            <span className="promo-channel-icon">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {channelMeta && <p className="promo-channel-tip">{channelMeta.tip}</p>}

      <div className="promo-grid">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            used={!!used[post.templateId]}
            onMarkUsed={markUsed}
          />
        ))}
        {!posts.length && (
          <div className="promo-empty">No templates configured for this channel yet.</div>
        )}
      </div>
    </section>
  )
}
