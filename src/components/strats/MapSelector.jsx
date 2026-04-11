const MAP_ICONS = {
  bank: '\uD83C\uDFE6',
  oregon: '\uD83C\uDFD5\uFE0F',
  clubhouse: '\uD83C\uDFAE',
  coastline: '\uD83C\uDF0A',
  consulate: '\uD83C\uDFDB\uFE0F',
  kafe: '\u2615',
  chalet: '\uD83C\uDFD4\uFE0F',
  border: '\uD83D\uDEA7',
  skyscraper: '\uD83C\uDFD9\uFE0F',
  'theme-park': '\uD83C\uDFA0',
  villa: '\uD83C\uDFE0',
  nighthaven: '\uD83D\uDD2C',
  lair: '\uD83D\uDD73\uFE0F',
}

export default function MapSelector({ maps, onSelect }) {
  return (
    <div className="map-grid">
      {maps.map((map) => (
        <div
          key={map.id}
          className={`map-card${map.comingSoon ? ' coming-soon' : ''}`}
          onClick={() => onSelect(map.id)}
        >
          <div className="map-card-icon">{MAP_ICONS[map.id] || '\uD83D\uDDFA\uFE0F'}</div>
          <div className="map-card-name">{map.name}</div>
          {map.comingSoon ? (
            <div className="map-card-sites">Coming Soon</div>
          ) : (
            <div className="map-card-sites">{map.sites.length} sites</div>
          )}
        </div>
      ))}
    </div>
  )
}
