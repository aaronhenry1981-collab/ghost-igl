import { useState, useEffect } from 'react'

const STEPS = [
  'Uploading screenshot...',
  'Identifying map and site...',
  'Analyzing operator positioning...',
  'Evaluating crosshair placement...',
  'Checking utility usage...',
  'Generating tactical feedback...',
]

export default function AnalysisLoading() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s))
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="analysis-loading">
      <div className="loading-spinner" />
      <h3 style={{ color: 'var(--text-h)', marginBottom: 8 }}>Analyzing Your Gameplay</h3>
      <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Ghost IGL is reviewing your screenshot...</p>
      <ul className="loading-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'active' : ''}>
            <span>{i < step ? '\u2713' : i === step ? '\u25CB' : '\u25CB'}</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
