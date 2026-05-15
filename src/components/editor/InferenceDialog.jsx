import { useState } from 'react'
import './InferenceDialog.css'

const TYPE_LABELS = {
  'parent-child': 'Parent',
  'adoptive-parent-child': 'Adoptive parent',
  'step-parent': 'Step-parent',
  'sibling': 'Sibling',
  'half-sibling': 'Half-sibling',
}

export function InferenceDialog({ suggestions, onConfirm, onSkip }) {
  const [state, setState] = useState(() =>
    Object.fromEntries(suggestions.map((s) => [s.id, { checked: s.defaultChecked, type: s.type }]))
  )

  const selectedCount = Object.values(state).filter((v) => v.checked).length

  function toggle(id) {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }))
  }

  function setType(id, type) {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], type } }))
  }

  function confirm() {
    const selected = suggestions
      .filter((s) => state[s.id].checked)
      .map((s) => ({ ...s, type: state[s.id].type }))
    onConfirm(selected)
  }

  return (
    <div className="id-panel">
      <div className="id-header">Suggested relationships</div>
      <div className="id-list">
        {suggestions.map((s) => {
          const { checked, type } = state[s.id]
          return (
            <div key={s.id} className={`id-item ${!checked ? 'id-item--dim' : ''}`}>
              <input
                type="checkbox"
                id={`id-chk-${s.id}`}
                checked={checked}
                onChange={() => toggle(s.id)}
              />
              <label htmlFor={`id-chk-${s.id}`} className="id-label">{s.label}</label>
              {s.typeOptions.length > 1 && (
                <select
                  className="id-type-select"
                  value={type}
                  disabled={!checked}
                  onChange={(e) => setType(s.id, e.target.value)}
                >
                  {s.typeOptions.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>
      <div className="id-actions">
        <button className="id-skip" onClick={onSkip}>Skip</button>
        <button className="id-confirm" onClick={confirm} disabled={selectedCount === 0}>
          Add {selectedCount > 0 ? selectedCount : ''} selected
        </button>
      </div>
    </div>
  )
}
