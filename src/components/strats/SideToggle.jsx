export default function SideToggle({ side, onToggle }) {
  return (
    <div className="side-toggle">
      <button
        className={side === 'attack' ? 'active-attack' : ''}
        onClick={() => onToggle('attack')}
      >
        Attack
      </button>
      <button
        className={side === 'defense' ? 'active-defense' : ''}
        onClick={() => onToggle('defense')}
      >
        Defense
      </button>
    </div>
  )
}
