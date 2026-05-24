import CHANGELOG from '../data/changelog'
import './ChangelogPage.css'

const TAG_LABEL = {
  feature: 'New feature',
  fix: 'Fix',
  content: 'Content',
  design: 'Design',
  release: 'Release',
}

function formatDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

export default function ChangelogPage() {
  return (
    <div className="changelog-page legal-page">
      <header className="changelog-header">
        <div className="section-label">What's new</div>
        <h1>Recon 6 changelog</h1>
        <p>
          Everything that's shipped, newest first. Active development — expect improvements weekly.
        </p>
      </header>

      <ol className="changelog-list">
        {CHANGELOG.map((entry, i) => (
          <li key={`${entry.date}-${i}`} className={`changelog-entry changelog-tag-${entry.tag}`}>
            <div className="changelog-rail">
              <div className="changelog-dot" />
            </div>
            <article className="changelog-card">
              <div className="changelog-meta">
                <span className={`changelog-tag changelog-tag-pill changelog-tag-pill-${entry.tag}`}>
                  {TAG_LABEL[entry.tag] || entry.tag}
                </span>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
              </div>
              <h2>{entry.title}</h2>
              {entry.items?.length > 0 && (
                <ul className="changelog-items">
                  {entry.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}
