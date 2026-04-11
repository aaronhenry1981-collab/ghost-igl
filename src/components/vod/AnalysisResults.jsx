export default function AnalysisResults({ analysis, onReset }) {
  return (
    <div className="analysis-results">
      <div className="analysis-header">
        <h3>Analysis Complete</h3>
        <button className="btn btn-outline" onClick={onReset}>Analyze Another</button>
      </div>

      {analysis.score != null && (
        <div className="analysis-score">
          <span className="analysis-score-num">{analysis.score}</span>
          <span className="analysis-score-label">/ 100<br />Tactical Score</span>
        </div>
      )}

      {analysis.overview && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\uD83D\uDCCB'} Overview</div>
          <p>{analysis.overview}</p>
        </div>
      )}

      {analysis.positioning && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\uD83D\uDCCD'} Positioning</div>
          <p>{analysis.positioning}</p>
        </div>
      )}

      {analysis.crosshair && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\uD83C\uDFAF'} Crosshair Placement</div>
          <p>{analysis.crosshair}</p>
        </div>
      )}

      {analysis.utility && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\uD83D\uDEE0\uFE0F'} Utility Usage</div>
          <p>{analysis.utility}</p>
        </div>
      )}

      {analysis.improvements?.length > 0 && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\uD83D\uDCA1'} Key Improvements</div>
          <ul className="analysis-list">
            {analysis.improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.strengths?.length > 0 && (
        <div className="analysis-card">
          <div className="analysis-card-title">{'\u2705'} What You Did Well</div>
          <ul className="analysis-list">
            {analysis.strengths.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
