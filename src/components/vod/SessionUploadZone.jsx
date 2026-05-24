import { useState, useRef, useCallback, useMemo } from 'react'
import { useGameData } from '../../hooks/useGameData'
import { useActiveGame } from '../../hooks/useActiveGame'

// Multi-image upload zone for the VOD session-based analysis flow. Supports
// drag/drop OR click-to-browse for 1-10 screenshots, plus optional context
// selectors (map, side, character) the AI uses to give sharper feedback.
//
// Game-aware: the map list, character roster, and vocabulary all come from
// the active game's data + gameMeta. The same upload zone serves all 20
// supported games.

const MAX_IMAGES_PRO = 5
const MAX_IMAGES_CHAMPION = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function SessionUploadZone({ onUpload, tier = 'pro', disabled = false }) {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  const [showContext, setShowContext] = useState(false)
  const [context, setContext] = useState({ map: '', site: '', side: '', operator: '' })
  const inputRef = useRef()

  const { activeGameId } = useActiveGame()
  const { data, gameMeta } = useGameData()

  const maxImages = tier === 'champion' ? MAX_IMAGES_CHAMPION : MAX_IMAGES_PRO

  // Maps from the active game's data, fall back to empty.
  const playableMaps = useMemo(() => {
    if (!data) return []
    const arr = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    return arr.filter((m) => !m.comingSoon)
  }, [data])

  // Character roster from CAST. Each game's CAST shape varies, so we
  // tolerate both array-of-objects and object-keyed-by-name forms.
  const characterRoster = useMemo(() => {
    if (!data) return []
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    return cast.map((c) => c?.name || c).filter((n) => typeof n === 'string')
  }, [data])

  // Filter by side if the user picked one AND the cast has a `side` field.
  const operatorChoices = useMemo(() => {
    if (!data) return []
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    if (context.side && cast.some((c) => c?.side)) {
      return cast
        .filter((c) => (c?.side || '').toLowerCase() === context.side)
        .map((c) => c?.name)
        .filter(Boolean)
    }
    return characterRoster
  }, [data, characterRoster, context.side])

  const selectedMap = playableMaps.find((m) => m.id === context.map)
  const siteChoices = selectedMap?.sites || []

  // Vocabulary — match the active game.
  const characterLabel = (gameMeta?.vocab?.operator || 'Character')
  const siteLabel = (gameMeta?.vocab?.site || 'Site')
  const attackLabel = (gameMeta?.vocab?.side_attack || 'Attack')
  const defenseLabel = (gameMeta?.vocab?.side_defense || 'Defense')

  const addFiles = useCallback((newFiles) => {
    setError(null)
    const list = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) {
      setError('No valid image files. Use PNG, JPG, or WebP.')
      return
    }
    const oversized = list.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`${oversized.name} is too large — max 5MB per image`)
      return
    }
    const combined = [...files, ...list].slice(0, maxImages)
    if (files.length + list.length > maxImages) {
      setError(`Max ${maxImages} images per session on ${tier} tier — kept the first ${maxImages}`)
    }
    setFiles(combined)
    Promise.all(combined.map((f) => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve({ name: f.name, dataUrl: e.target.result })
      reader.readAsDataURL(f)
    }))).then(setPreviews)
  }, [files, maxImages, tier])

  function removeAt(idx) {
    const next = files.filter((_, i) => i !== idx)
    setFiles(next)
    setPreviews((p) => p.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setFiles([])
    setPreviews([])
    setContext({ map: '', site: '', side: '', operator: '' })
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleSubmit() {
    if (files.length === 0) return
    // Stamp the active game id so the Lambda picks the right context file.
    onUpload(files, { ...context, game_id: activeGameId })
  }

  function setContextField(field, value) {
    setContext((c) => {
      const next = { ...c, [field]: value }
      if (field === 'map') next.site = ''
      if (field === 'side') next.operator = ''
      return next
    })
  }

  return (
    <div className="session-upload">
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}${files.length === 0 ? '' : ' has-files'}`}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => files.length === 0 && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />

        {files.length === 0 ? (
          <>
            <div className="upload-zone-icon">📸</div>
            <h3>Drop your screenshots here</h3>
            <p>1–{maxImages} images per session ({tier === 'champion' ? 'Champion' : 'Pro'} tier)</p>
            <span className="upload-zone-btn">Choose Files</span>
            <p style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.55)', marginTop: '1rem' }}>
              Death cams, post-plant freezes, round-end scoreboards. Multi-round sessions get holistic
              feedback + recurring weakness detection.
            </p>
          </>
        ) : (
          <div className="upload-previews">
            {previews.map((p, i) => (
              <div key={i} className="upload-preview-tile" onClick={(e) => e.stopPropagation()}>
                <img src={p.dataUrl} alt={`screenshot ${i + 1}`} />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="upload-preview-remove"
                  aria-label={`Remove image ${i + 1}`}
                >
                  ×
                </button>
                <div className="upload-preview-label">{i + 1}</div>
              </div>
            ))}
            {files.length < maxImages && (
              <div
                className="upload-preview-tile upload-preview-add"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              >
                <span style={{ fontSize: '2rem' }}>+</span>
                <span style={{ fontSize: '0.75rem', marginTop: 4 }}>Add more</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="vod-error" style={{ marginTop: '0.75rem' }}>{error}</div>}

      {files.length > 0 && (
        <>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowContext((s) => !s)}
              className="btn btn-sm btn-outline"
              style={{ marginRight: 8 }}
            >
              {showContext ? '▾' : '▸'} {showContext ? 'Hide context hints' : 'Add context hints (optional)'}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.55)' }}>
              Telling the AI the map / {characterLabel.toLowerCase()} gives sharper feedback. Skip if you want it to detect from the screenshots.
            </span>
          </div>

          {showContext && (
            <div className="vod-context-grid" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(230,233,239,0.65)' }}>Map (optional)</span>
                <select
                  value={context.map}
                  onChange={(e) => setContextField('map', e.target.value)}
                  className="testi-input"
                >
                  <option value="">Auto-detect</option>
                  {playableMaps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(230,233,239,0.65)' }}>{siteLabel} (optional)</span>
                <select
                  value={context.site}
                  onChange={(e) => setContextField('site', e.target.value)}
                  className="testi-input"
                  disabled={!context.map}
                >
                  <option value="">{context.map ? 'Any' : 'Pick map first'}</option>
                  {siteChoices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(230,233,239,0.65)' }}>Side (optional)</span>
                <select
                  value={context.side}
                  onChange={(e) => setContextField('side', e.target.value)}
                  className="testi-input"
                >
                  <option value="">Auto-detect</option>
                  <option value="attack">{attackLabel}</option>
                  <option value="defense">{defenseLabel}</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(230,233,239,0.65)' }}>{characterLabel} (optional)</span>
                <select
                  value={context.operator}
                  onChange={(e) => setContextField('operator', e.target.value)}
                  className="testi-input"
                  disabled={operatorChoices.length === 0}
                >
                  <option value="">{operatorChoices.length === 0 ? 'Roster loading…' : 'Auto-detect'}</option>
                  {operatorChoices.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
              </label>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary btn-lg"
              disabled={disabled || files.length === 0}
            >
              Analyze {files.length} {files.length === 1 ? 'screenshot' : 'screenshots'}
            </button>
            <button type="button" onClick={clearAll} className="btn btn-ghost">Clear all</button>
          </div>
        </>
      )}
    </div>
  )
}
