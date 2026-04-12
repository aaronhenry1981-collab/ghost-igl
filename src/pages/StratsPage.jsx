import { useState } from 'react'
import MAPS from '../data/maps'
import STRATS from '../data/strats'
import BANS from '../data/bans'
import SQUAD_ROLES from '../data/squadRoles'
import MapSelector from '../components/strats/MapSelector'
import SiteSelector from '../components/strats/SiteSelector'
import SideToggle from '../components/strats/SideToggle'
import SquadToggle from '../components/strats/SquadToggle'
import SquadGuide from '../components/strats/SquadGuide'
import StratDisplay from '../components/strats/StratDisplay'
import BanDisplay from '../components/strats/BanDisplay'
import './StratsPage.css'

export default function StratsPage() {
  const [selectedMap, setSelectedMap] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [side, setSide] = useState('attack')
  const [squadSize, setSquadSize] = useState(1)

  const mapData = MAPS.find((m) => m.id === selectedMap)
  const strat = selectedMap && selectedSite && STRATS[selectedMap]?.[selectedSite]?.[side]
  const bans = selectedMap && BANS[selectedMap]
  const squadGuide = SQUAD_ROLES[side]?.[squadSize]

  function handleMapSelect(mapId) {
    const map = MAPS.find((m) => m.id === mapId)
    if (map?.comingSoon) return
    setSelectedMap(mapId)
    setSelectedSite(null)
  }

  function handleSiteSelect(siteId) {
    setSelectedSite(siteId)
  }

  function handleBack() {
    if (selectedSite) {
      setSelectedSite(null)
    } else if (selectedMap) {
      setSelectedMap(null)
    }
  }

  return (
    <div className="strats-page">
      <div className="strats-header">
        <h1>Map <span className="accent">Strategies</span></h1>
        <p>Select a map, pick a site, choose your side. Get the strat your team needs to win.</p>
      </div>

      {selectedMap && (
        <button className="strats-back" onClick={handleBack}>
          &larr; {selectedSite ? mapData?.name : 'All Maps'}
        </button>
      )}

      {!selectedMap && (
        <MapSelector maps={MAPS} onSelect={handleMapSelect} />
      )}

      {selectedMap && !selectedSite && (
        <>
          <div className="strats-map-title">
            <h2>{mapData?.name}</h2>
          </div>
          <div className="strats-controls">
            <SideToggle side={side} onToggle={setSide} />
            <SquadToggle size={squadSize} onToggle={setSquadSize} />
          </div>
          {bans && <BanDisplay bans={bans} side={side} />}
          {squadGuide && <SquadGuide guide={squadGuide} />}
          <SiteSelector sites={mapData?.sites || []} onSelect={handleSiteSelect} />
        </>
      )}

      {selectedMap && selectedSite && (
        <>
          <div className="strats-map-title">
            <h2>{mapData?.name} &mdash; {mapData?.sites.find((s) => s.id === selectedSite)?.name}</h2>
          </div>
          <div className="strats-controls">
            <SideToggle side={side} onToggle={setSide} />
            <SquadToggle size={squadSize} onToggle={setSquadSize} />
          </div>
          {bans && <BanDisplay bans={bans} side={side} />}
          {strat ? (
            <>
              {squadGuide && <SquadGuide guide={squadGuide} operators={strat.operators} />}
              <StratDisplay strat={strat} side={side} />
            </>
          ) : (
            <div className="strats-empty">No strategy data available for this configuration.</div>
          )}
        </>
      )}
    </div>
  )
}
