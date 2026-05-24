import { useState } from 'react'
import { useDemoVideo, parseVideoUrl } from '../../hooks/useDemoVideo'

export default function DemoVideoManager() {
  const { video, save, clear } = useDemoVideo()
  const [url, setUrl] = useState(video?.url || '')
  const [title, setTitle] = useState(video?.title || '')
  const [caption, setCaption] = useState(video?.caption || '')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const parsed = parseVideoUrl(url)
    if (!parsed) {
      setError('Paste a YouTube (youtu.be / youtube.com) or Twitch VOD URL.')
      return
    }
    try {
      await save({
        url: url.trim(),
        title: title.trim() || 'Recon 6 — 60 second demo',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message || 'Failed to save')
    }
  }

  async function remove() {
    if (!window.confirm('Remove the demo video from the landing page?')) return
    try {
      await clear()
      setUrl('')
      setTitle('')
      setCaption('')
    } catch (err) {
      setError(err.message || 'Failed to remove')
    }
  }

  return (
    <section className="admin-section admin-demo-video">
      <div className="admin-section-header">
        <h2>Hero demo video</h2>
        <span className="admin-footnote" style={{ margin: 0 }}>
          {video ? `Active · ${video.provider}` : 'Empty — landing page hides the section'}
        </span>
      </div>

      <form onSubmit={submit} className="testi-form">
        <label className="testi-field">
          <span>Video URL (YouTube or Twitch VOD)</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/... or https://www.twitch.tv/videos/..."
            className="testi-input"
            maxLength={300}
          />
        </label>
        <div className="testi-form-row">
          <label className="testi-field">
            <span>Headline (optional)</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Recon 6 — 60 second demo"
              className="testi-input"
              maxLength={80}
            />
          </label>
          <label className="testi-field">
            <span>Caption (optional)</span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Watch a real VOD analysis + strat lookup in under a minute."
              className="testi-input"
              maxLength={140}
            />
          </label>
        </div>
        {error && <div className="admin-note admin-note-error">{error}</div>}
        {saved && <div className="admin-note admin-note-success">Saved — refresh landing page to see the change.</div>}
        <div className="testi-form-actions">
          <button type="submit" className="btn btn-primary btn-sm">
            {video ? 'Update video' : 'Add video'}
          </button>
          {video && (
            <button type="button" onClick={remove} className="btn btn-sm btn-outline">
              Remove
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
