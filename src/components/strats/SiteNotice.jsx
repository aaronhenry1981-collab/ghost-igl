import { siteNoticeFor } from '../../data/siteNotices'

// A visible warning on a site whose plan is known to be out of date (for
// example a bomb site Ubisoft moved). Renders nothing for normal sites.
export default function SiteNotice({ mapId, siteId, compact = false }) {
  const notice = siteNoticeFor(mapId, siteId)
  if (!notice) return null
  return (
    <div
      role="note"
      className="site-notice"
      style={{
        margin: compact ? '0.5rem 0' : '0 0 1rem',
        padding: compact ? '0.55rem 0.75rem' : '0.8rem 1rem',
        border: '1px solid rgba(255, 196, 92, 0.55)',
        background: 'rgba(255, 196, 92, 0.1)',
        borderRadius: 8,
        color: '#ffe2a8',
        fontSize: compact ? '0.82rem' : '0.9rem',
        lineHeight: 1.45,
        textAlign: 'left',
      }}
    >
      <strong style={{ color: '#ffc45c' }}>{notice.kind === 'unavailable' ? 'Plan withdrawn' : 'Layout changed'}{notice.since ? ` in ${notice.since}` : ''}.</strong> {notice.text}
    </div>
  )
}
