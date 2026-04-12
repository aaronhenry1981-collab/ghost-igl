const SIZES = [
  { value: 1, label: 'Solo' },
  { value: 2, label: 'Duo' },
  { value: 3, label: '3-Stack' },
  { value: 4, label: '4-Stack' },
  { value: 5, label: '5-Stack' },
]

export default function SquadToggle({ size, onToggle }) {
  return (
    <div className="squad-toggle">
      <span className="squad-toggle-label">Squad Size:</span>
      <div className="squad-toggle-btns">
        {SIZES.map((s) => (
          <button
            key={s.value}
            className={size === s.value ? 'active' : ''}
            onClick={() => onToggle(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
