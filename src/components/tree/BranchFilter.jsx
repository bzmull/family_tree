import './BranchFilter.css'

export function BranchFilter({ branches, activeBranch, onChange }) {
  return (
    <div className="branch-filter">
      <button
        className={`branch-pill ${activeBranch === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {branches.map((branch) => (
        <button
          key={branch.id}
          className={`branch-pill ${activeBranch === branch.id ? 'active' : ''}`}
          style={{ '--branch-color': branch.color }}
          onClick={() => onChange(branch.id)}
        >
          {branch.label}
        </button>
      ))}
    </div>
  )
}
