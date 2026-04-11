import { useState } from 'react'

export default function LinkInput({ disabled, onSubmit }) {
  const [url, setUrl] = useState('')

  function handleSubmit() {
    if (url.trim() && onSubmit) onSubmit(url.trim())
  }

  return (
    <div className="link-input-wrap">
      <input
        type="url"
        className="link-input"
        placeholder="Paste YouTube or Twitch VOD link..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
      />
      <button
        className="link-input-btn"
        disabled={disabled || !url.trim()}
        onClick={handleSubmit}
      >
        Analyze
      </button>
    </div>
  )
}
