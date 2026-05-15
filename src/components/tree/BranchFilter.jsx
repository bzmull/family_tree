import './BranchFilter.css'

export function BranchFilter({ options, activeSide, onChange }) {
  return (
    <div className="branch-filter">
      <button
        className={`branch-pill ${activeSide === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`branch-pill ${activeSide === opt.id ? 'active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
