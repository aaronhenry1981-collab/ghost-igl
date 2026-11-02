import { useState } from 'react'
import { COORDINATION_MAPS } from './domain.mjs'

export default function MapPicker({ disabled, onConfirm }) {
  const [map, setMap] = useState('')
  return <div className="sq-map-picker"><label>Map shown in your game<select value={map} disabled={disabled} onChange={event => setMap(event.target.value)}><option value="">Choose the actual map</option>{COORDINATION_MAPS.map(name => <option key={name} value={name}>{name}</option>)}</select></label><button disabled={disabled || !map} onClick={() => onConfirm(map)}>Confirm map</button><p>Coordination only. Confirm this map is available in your current game/mode. This list is not a Ranked rotation.</p><p className="sq-no-playbook" role="status">{map ? `${map}: ` : ''}No verified map/site playbook is attached in this preview. The exercises and schematic remain generic.</p></div>
}
