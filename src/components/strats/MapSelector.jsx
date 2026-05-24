import { useAuth } from '../../hooks/useAuth'

const MAP_ICONS = {
  bank: '🏦',
  oregon: '🏕️',
  clubhouse: '🎮',
  coastline: '🌊',
  consulate: '🏛️',
  kafe: '☕',
  chalet: '🏔️',
  border: '🚧',
  skyscraper: '🏙️',
  'theme-park': '🎠',
  villa: '🏠',
  nighthaven: '🔬',
  lair: '🕳️',
}

// Champion-only maps (championOnly: true in maps.js) display a star badge.
// Non-Champion users get a disabled card with the "Champion Only" label and
// can't open it; the StratsPage upstream blocks navigation as a safety net.
//
// CHAMPION + ADMIN OVERRIDE: Champions and admins bypass both `comingSoon`
// and `championOnly` gates — Champions get the full catalog as part of their
// tier benefit, and admins (Aaron) walk through everything for testing.
// ComingSoon maps display a "Strats coming" badge for Champions (vs. the
// hard "Coming Soon" lock free/pro see).
export default function MapSelector({ maps, onSelect }) {
  const { isAdmin, plan, isPro } = useAuth()
  const isChampion = isAdmin || plan === 'champion'

  return (
    <div className="map-grid">
      {maps.map((map) => {
        const isStadium = map.type === 'Stadium'
        const championLocked = map.championOnly && !isChampion
        // Stadium maps are Pro-only — non-Pro users can still click in (the
        // StratsPage shows them a ProGate teaser) but the card shows a PRO
        // badge upfront so the expectation is set.
        const locked = !isAdmin && !isChampion && (map.comingSoon || championLocked)
        const tierLabel = isAdmin && map.comingSoon
          ? 'Admin · Strats coming'
          : isChampion && map.comingSoon
            ? `Strats coming · ${map.sites?.length || 0} sites`
            : isAdmin && map.championOnly
              ? `Champion · ${map.sites?.length || 0} sites`
              : isChampion && map.championOnly
                ? `Champion · ${map.sites?.length || 0} sites`
                : championLocked
                  ? 'Champion Only'
                  : map.comingSoon
                    ? 'Coming Soon'
                    : isStadium && !isPro
                      ? `Pro · ${map.sites.length} sites`
                      : `${map.sites.length} sites`

        return (
          <button
            type="button"
            key={map.id}
            className={`map-card${locked ? ' coming-soon' : ''}${map.championOnly ? ' champion-map' : ''}${isStadium ? ' stadium-map' : ''}`}
            style={{ position: 'relative' }}
            onClick={() => onSelect(map.id)}
            disabled={locked}
            aria-label={
              championLocked
                ? `${map.name} (Champion only)`
                : map.comingSoon
                  ? `${map.name} (coming soon)`
                  : isStadium && !isPro
                    ? `${map.name} (Pro feature, ${map.sites.length} sites)`
                    : `${map.name}, ${map.sites.length} sites`
            }
          >
            {map.championOnly && (
              <div
                className="map-card-badge"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(0, 229, 255, 0.18)',
                  border: '1px solid rgba(0, 229, 255, 0.5)',
                  color: '#00e5ff',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {'★'} CHAMP
              </div>
            )}
            {isStadium && !map.championOnly && !isPro && (
              <div
                className="map-card-badge"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(255, 180, 80, 0.18)',
                  border: '1px solid rgba(255, 180, 80, 0.5)',
                  color: '#ffc97a',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {'⚑'} PRO
              </div>
            )}
            <div className="map-card-icon">{MAP_ICONS[map.id] || '🗺️'}</div>
            <div className="map-card-name">{map.name}</div>
            <div className="map-card-sites">{tierLabel}</div>
          </button>
        )
      })}
    </div>
  )
}
