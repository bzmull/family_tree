import { useState, useEffect } from 'react'
import './SuggestionsPanel.css'

const FIELD_LABELS = {
  firstName: 'First name', lastName: 'Last name', maidenName: 'Maiden name',
  gender: 'Gender', isLiving: 'Living?', birthDate: 'Birth date', deathDate: 'Death date',
  birthPlace: 'Birth place', deathPlace: 'Death place', occupation: 'Occupation',
  bio: 'Biography', privateNotes: 'Private notes',
}

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  return String(val)
}

function DiffRow({ field, from, to }) {
  return (
    <div className="sp-diff-row">
      <span className="sp-diff-label">{FIELD_LABELS[field] ?? field}</span>
      <span className="sp-diff-from">{formatValue(from)}</span>
      <span className="sp-diff-arrow">→</span>
      <span className="sp-diff-to">{formatValue(to)}</span>
    </div>
  )
}

function SuggestionItem({ suggestion, liveData, token, onResolved }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [busy, setBusy] = useState(false)

  const person = liveData?.people.find((p) => p.id === suggestion.personId)
  const current = suggestion.personSnapshot ?? person ?? {}
  const proposed = suggestion.proposedData ?? {}

  const changedFields = Object.keys({ ...current, ...proposed }).filter((k) => {
    if (k === 'id' || k === 'private' || k === 'customFields') return false
    return JSON.stringify(current[k]) !== JSON.stringify(proposed[k])
  })

  async function respond(action) {
    setBusy(true)
    try {
      const res = await fetch('/.netlify/functions/respond-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suggestionId: suggestion.id, action, rejectionNote }),
      })
      if (res.ok) onResolved(suggestion.id)
    } finally {
      setBusy(false)
    }
  }

  const personName = `${current.firstName ?? ''} ${current.lastName ?? ''}`.trim() || 'Unknown'
  const date = new Date(suggestion.submittedAt).toLocaleDateString()

  return (
    <div className="sp-item">
      <button className="sp-item-header" onClick={() => setExpanded((e) => !e)}>
        <span className="sp-item-name">{personName}</span>
        <span className="sp-item-meta">
          {suggestion.submitterName ? `by ${suggestion.submitterName} · ` : ''}{date} · {changedFields.length} field{changedFields.length !== 1 ? 's' : ''}
        </span>
        <span className="sp-item-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="sp-item-body">
          {changedFields.length === 0 ? (
            <p className="sp-no-changes">No field changes detected.</p>
          ) : (
            <div className="sp-diff">
              {changedFields.map((f) => (
                <DiffRow key={f} field={f} from={current[f]} to={proposed[f]} />
              ))}
            </div>
          )}

          {rejectMode ? (
            <div className="sp-reject-form">
              <textarea
                className="sp-reject-note"
                placeholder="Rejection note (optional)"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={2}
              />
              <div className="sp-actions">
                <button className="sp-btn sp-btn--cancel" onClick={() => setRejectMode(false)} disabled={busy}>Back</button>
                <button className="sp-btn sp-btn--reject" onClick={() => respond('reject')} disabled={busy}>
                  {busy ? 'Rejecting…' : 'Confirm reject'}
                </button>
              </div>
            </div>
          ) : (
            <div className="sp-actions">
              <button className="sp-btn sp-btn--reject" onClick={() => setRejectMode(true)} disabled={busy}>Reject</button>
              <button className="sp-btn sp-btn--approve" onClick={() => respond('approve')} disabled={busy}>
                {busy ? 'Approving…' : 'Approve'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SuggestionsPanel({ token, liveData, onClose, onCountChange }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/.netlify/functions/get-suggestions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setSuggestions(d.suggestions ?? []); onCountChange(d.pendingCount ?? 0) })
      .finally(() => setLoading(false))
  }, [token])

  function handleResolved(id) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
    onCountChange((c) => Math.max(0, c - 1))
  }

  const pending = suggestions.filter((s) => s.status === 'pending')
  const resolved = suggestions.filter((s) => s.status !== 'pending')

  return (
    <>
      <div className="sp-backdrop" onClick={onClose} />
      <div className="sp-panel">
        <div className="sp-header">
          <h2 className="sp-title">Suggestions</h2>
          <button className="sp-close" onClick={onClose}>✕</button>
        </div>
        <div className="sp-body">
          {loading ? (
            <p className="sp-empty">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="sp-empty">No pending suggestions.</p>
          ) : (
            pending.map((s) => (
              <SuggestionItem
                key={s.id}
                suggestion={s}
                liveData={liveData}
                token={token}
                onResolved={handleResolved}
              />
            ))
          )}
          {resolved.length > 0 && (
            <>
              <p className="sp-section-label">Previously resolved</p>
              {resolved.map((s) => (
                <div key={s.id} className="sp-item sp-item--resolved">
                  <div className="sp-item-header sp-item-header--static">
                    <span className="sp-item-name">
                      {`${s.personSnapshot?.firstName ?? ''} ${s.personSnapshot?.lastName ?? ''}`.trim() || 'Unknown'}
                    </span>
                    <span className={`sp-status sp-status--${s.status}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
