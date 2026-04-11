import { useState } from 'react'
import UploadZone from '../components/vod/UploadZone'
import LinkInput from '../components/vod/LinkInput'
import AnalysisResults from '../components/vod/AnalysisResults'
import AnalysisLoading from '../components/vod/AnalysisLoading'
import { useVodAnalysis } from '../hooks/useVodAnalysis'
import './VodPage.css'

const TABS = [
  { id: 'screenshot', label: 'Screenshot', icon: '\uD83D\uDCF7', available: true },
  { id: 'video', label: 'Video Clip', icon: '\uD83C\uDFAC', available: false },
  { id: 'link', label: 'YouTube / Twitch', icon: '\uD83D\uDD17', available: false },
]

export default function VodPage() {
  const [activeTab, setActiveTab] = useState('screenshot')
  const { analysis, loading, error, analyzeScreenshot, reset } = useVodAnalysis()

  return (
    <div className="vod-page">
      <div className="vod-header">
        <h1>VOD <span className="accent">Review</span></h1>
        <p>Upload a screenshot from your match and get AI-powered tactical analysis instantly.</p>
      </div>

      <div className="vod-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vod-tab${activeTab === tab.id ? ' active' : ''}${!tab.available ? ' disabled' : ''}`}
            onClick={() => tab.available && setActiveTab(tab.id)}
          >
            <span className="vod-tab-icon">{tab.icon}</span>
            {tab.label}
            {!tab.available && <span className="vod-tab-soon">Soon</span>}
          </button>
        ))}
      </div>

      <div className="vod-content">
        {activeTab === 'screenshot' && (
          <>
            {!analysis && !loading && (
              <UploadZone onUpload={analyzeScreenshot} />
            )}
            {loading && <AnalysisLoading />}
            {error && (
              <div className="vod-error">
                <p>{error}</p>
                <button className="btn btn-outline" onClick={reset}>Try Again</button>
              </div>
            )}
            {analysis && (
              <AnalysisResults analysis={analysis} onReset={reset} />
            )}
          </>
        )}

        {activeTab === 'video' && (
          <div className="vod-coming-soon">
            <div className="vod-coming-icon">{'\uD83C\uDFAC'}</div>
            <h3>Video Clip Analysis</h3>
            <p>Upload short clips from your matches for round-by-round tactical breakdown. Analyze positioning, rotations, and utility usage across an entire round.</p>
            <span className="vod-coming-badge">Coming Soon</span>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="vod-coming-soon">
            <div className="vod-coming-icon">{'\uD83D\uDD17'}</div>
            <h3>YouTube / Twitch VOD Review</h3>
            <p>Paste a link to your stream VOD or YouTube video. Ghost IGL will analyze key rounds and provide timestamped feedback on your gameplay.</p>
            <LinkInput disabled />
            <span className="vod-coming-badge">Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  )
}
