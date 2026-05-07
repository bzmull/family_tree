import './TreeControls.css'

export function TreeControls({ onFitScreen, onZoomIn, onZoomOut, onJumpToRoot }) {
  return (
    <div className="tree-controls">
      <button className="ctrl-btn" title="Zoom in" onClick={onZoomIn}>+</button>
      <button className="ctrl-btn" title="Zoom out" onClick={onZoomOut}>−</button>
      <button className="ctrl-btn" title="Fit to screen" onClick={onFitScreen}>⊡</button>
      <button className="ctrl-btn" title="Jump to root" onClick={onJumpToRoot}>⌂</button>
    </div>
  )
}
