import './TreeControls.css'

const MAX_GENS = 10

function GenControl({ label, value, onChange }) {
  const display = value == null ? 'All' : value

  function decrement() {
    if (value == null) onChange(MAX_GENS)
    else if (value <= 1) onChange(1)
    else onChange(value - 1)
  }

  function increment() {
    if (value == null) return
    if (value >= MAX_GENS) onChange(null)
    else onChange(value + 1)
  }

  return (
    <div className="gen-control">
      <span className="gen-label">{label}</span>
      <div className="gen-stepper">
        <button className="ctrl-btn ctrl-btn--sm" onClick={decrement}>−</button>
        <span className="gen-value">{display}</span>
        <button className="ctrl-btn ctrl-btn--sm" onClick={increment} disabled={value == null}>+</button>
      </div>
    </div>
  )
}

export function TreeControls({
  onFitScreen, onZoomIn, onZoomOut, onJumpToRoot,
  ancestorGens, descendantGens, onAncestorGensChange, onDescendantGensChange,
}) {
  return (
    <div className="tree-controls">
      <button className="ctrl-btn" title="Zoom in" onClick={onZoomIn}>+</button>
      <button className="ctrl-btn" title="Zoom out" onClick={onZoomOut}>−</button>
      <button className="ctrl-btn" title="Fit to screen" onClick={onFitScreen}>⊡</button>
      <button className="ctrl-btn" title="Jump to root" onClick={onJumpToRoot}>⌂</button>
      <div className="ctrl-divider" />
      <span className="ctrl-section-title">Generations</span>
      <GenControl label="Ancestors" value={ancestorGens} onChange={onAncestorGensChange} />
      <GenControl label="Descendants" value={descendantGens} onChange={onDescendantGensChange} />
    </div>
  )
}
