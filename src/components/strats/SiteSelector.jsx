export default function SiteSelector({ sites, onSelect }) {
  return (
    <div className="site-grid">
      {sites.map((site) => (
        <div key={site.id} className="site-card" onClick={() => onSelect(site.id)}>
          <div className="site-card-name">{site.name}</div>
          <div className="site-card-floor">{site.floor}</div>
        </div>
      ))}
    </div>
  )
}
