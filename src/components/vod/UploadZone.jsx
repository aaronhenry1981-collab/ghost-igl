import { useState, useRef } from 'react'

export default function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const inputRef = useRef()

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleSubmit() {
    if (file) onUpload(file)
  }

  function handleClear() {
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`upload-zone${dragging ? ' dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => !preview && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {!preview ? (
        <>
          <div className="upload-zone-icon">{'\uD83D\uDCF7'}</div>
          <h3>Drop your screenshot here</h3>
          <p>or click to browse files</p>
          <span className="upload-zone-btn">Choose File</span>
          <div className="upload-zone-formats">PNG, JPG, WebP &mdash; Max 10MB</div>
        </>
      ) : (
        <>
          <div className="upload-preview">
            <img src={preview} alt="Screenshot preview" />
          </div>
          <div className="upload-actions">
            <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); handleClear() }}>
              Change
            </button>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleSubmit() }}>
              Analyze Screenshot
            </button>
          </div>
        </>
      )}
    </div>
  )
}
