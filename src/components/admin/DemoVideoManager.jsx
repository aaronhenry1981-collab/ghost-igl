import { useState } from 'react'
import { useDemoVideo, parseVideoUrl } from '../../hooks/useDemoVideo'
import { Badge, Field, Notice, Panel, Skeleton } from '../../features/admin/ui'

// Landing-page hero video. The API stores the URL and headline only.
export default function DemoVideoManager() {
  const { video, loading, save, clear } = useDemoVideo()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  // Fill the form from the saved video once it arrives (and after saves).
  const [synced, setSynced] = useState(null)
  const savedKey = video ? `${video.url}|${video.title || ''}` : ''
  if (!loading && synced !== savedKey) {
    setSynced(savedKey)
    setUrl(video?.url || '')
    setTitle(video?.title || '')
  }

  const parsed = parseVideoUrl(url)
  const unchanged = video && url.trim() === video.url && title.trim() === (video.title || '')

  async function submit(e) {
    e.preventDefault()
    setStatus(null)
    if (!parsed) {
      setStatus({ tone: 'danger', text: 'Paste a YouTube (youtu.be / youtube.com) or Twitch VOD link.' })
      return
    }
    setSaving(true)
    try {
      await save({ url: url.trim(), title: title.trim() || 'Recon 6 — 60 second demo' })
      setStatus({ tone: 'ok', text: 'Saved. The landing page shows the new video on its next load.' })
    } catch (err) {
      setStatus({ tone: 'danger', text: `Not saved: ${err.message || 'request failed'}` })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove the demo video from the landing page?')) return
    setStatus(null)
    try {
      await clear()
      setStatus({ tone: 'ok', text: 'Removed. The landing page hides the video section.' })
    } catch (err) {
      setStatus({ tone: 'danger', text: `Not removed: ${err.message || 'request failed'}` })
    }
  }

  return (
    <Panel
      title="Hero demo video"
      description="The video in the landing page hero. Without one, the section is hidden."
      actions={loading ? null : <Badge tone={video ? 'ok' : 'muted'}>{video ? `Live · ${video.provider}` : 'Not set'}</Badge>}
    >
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}
      {loading ? <Skeleton rows={2} /> : (
        <form onSubmit={submit} className="ax-form-stack">
          <div className="ax-form-grid">
            <Field label="Video link" hint="YouTube or Twitch VOD" error={url && !parsed ? 'Not a YouTube or Twitch VOD link.' : null}>
              <input className="ax-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" maxLength={300} />
            </Field>
            <Field label="Headline (optional)">
              <input className="ax-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recon 6 — 60 second demo" maxLength={80} />
            </Field>
          </div>
          {parsed && (
            <div className="ax-video">
              <iframe src={parsed.embedUrl} title="Demo video preview" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          )}
          <div className="ax-btn-row">
            <button type="submit" className="ax-btn ax-btn--sm ax-btn--primary" disabled={saving || !parsed || unchanged}>{saving ? 'Saving…' : video ? 'Update video' : 'Add video'}</button>
            {video && <button type="button" className="ax-btn ax-btn--sm ax-btn--danger" onClick={remove}>Remove video</button>}
          </div>
        </form>
      )}
    </Panel>
  )
}
