export default function SiteSelector({ sites, onSelect }) {
  return (
    <div className="site-grid">
      {sites.map((site) => (
        <button
          key={site.id}
          type="button"
          className="site-card"
          aria-label={`Open ${site.name} strategy`}
          onClick={() => onSelect(site.id)}
        >
          <div className="site-card-name">{site.name}</div>
          <div className="site-card-floor">{site.floor}</div>
        </button>
      ))}
    </div>
  )
}
