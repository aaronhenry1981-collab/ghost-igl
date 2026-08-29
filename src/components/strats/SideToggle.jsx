export default function SideToggle({ side, onToggle }) {
  return (
    <div className="side-toggle" role="group" aria-label="Choose your side">
      <button
        type="button"
        className={side === 'attack' ? 'active-attack' : ''}
        aria-pressed={side === 'attack'}
        onClick={() => onToggle('attack')}
      >
        Attack
      </button>
      <button
        type="button"
        className={side === 'defense' ? 'active-defense' : ''}
        aria-pressed={side === 'defense'}
        onClick={() => onToggle('defense')}
      >
        Defense
      </button>
    </div>
  )
}
