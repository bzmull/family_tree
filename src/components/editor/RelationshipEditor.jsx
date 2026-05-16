import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import { useFamilyData } from '../../context/FamilyDataContext'
import { inferRelationships } from '../../utils/relationshipInference'
import { InferenceDialog } from './InferenceDialog'
import './RelationshipEditor.css'

const REL_TYPES = [
  { value: 'parent-child', label: 'Parent of' },
  { value: 'adoptive-parent-child', label: 'Adoptive parent of' },
  { value: 'step-parent', label: 'Step-parent of' },
  { value: 'child-of', label: 'Child of' },
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'half-sibling', label: 'Half-sibling' },
  { value: 'sibling', label: 'Sibling' },
]

const REL_LABEL_MAP = Object.fromEntries(REL_TYPES.map((r) => [r.value, r.label]))

function relDescription(rel, personId, people) {
  const otherId = rel.fromId === personId ? rel.toId : rel.fromId
  const other = people.find((p) => p.id === otherId)
  const name = other ? `${other.firstName} ${other.lastName}` : '(unknown)'
  const type = REL_LABEL_MAP[rel.type] ?? rel.type
  const isFrom = rel.fromId === personId
  if (rel.type === 'spouse') {
    const parts = []
    if (rel.marriageDate) parts.push(`m. ${rel.marriageDate.slice(0, 4)}`)
    if (rel.divorceDate) parts.push(`div. ${rel.divorceDate.slice(0, 4)}`)
    const details = parts.length ? ` (${parts.join(', ')})` : ''
    return `${rel.divorceDate ? 'Ex-spouse' : 'Spouse'}: ${name}${details}`
  }
  if (rel.type.includes('parent') && isFrom) return `${type}: ${name}`
  if (rel.type.includes('parent') && !isFrom) return `Child of: ${name}`
  return `${type}: ${name}`
}

// externalRels / onExternalAdd / onExternalRemove are provided when creating a new person
// so RelationshipEditor manages pending rels without touching liveData yet.
export function RelationshipEditor({ personId, personName, externalRels, onExternalAdd, onExternalRemove }) {
  const { liveData, addRelationship, removeRelationship, updateRelationship } = useFamilyData()
  const isPending = externalRels !== undefined

  const [showAdd, setShowAdd] = useState(false)
  const [relType, setRelType] = useState('parent-child')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [marriageDate, setMarriageDate] = useState('')
  const [divorceDate, setDivorceDate] = useState('')
  const [editingDivorce, setEditingDivorce] = useState(null) // { relId, date }
  const [suggestions, setSuggestions] = useState(null)

  const myRels = isPending
    ? externalRels
    : (liveData?.relationships ?? []).filter((r) => r.fromId === personId || r.toId === personId)

  const fuse = new Fuse(
    (liveData?.people ?? []).filter((p) => p.id !== personId),
    { keys: ['firstName', 'lastName'], threshold: 0.35 }
  )
  const searchResults = search.trim()
    ? fuse.search(search.trim()).slice(0, 6).map((r) => r.item)
    : []

  function resetForm() {
    setShowAdd(false)
    setSearch('')
    setSelectedId(null)
    setMarriageDate('')
    setDivorceDate('')
  }

  function handleRemove(relId) {
    if (isPending) onExternalRemove(relId)
    else removeRelationship(relId)
  }

  function handleAdd() {
    if (!selectedId) return
    const isChildOf = relType === 'child-of'
    const rel = {
      id: `r_${Date.now()}`,
      type: isChildOf ? 'parent-child' : relType,
      fromId: isChildOf ? selectedId : personId,
      toId:   isChildOf ? personId   : selectedId,
      ...(relType === 'spouse' ? {
        marriageDate: marriageDate || null,
        divorceDate: divorceDate || null,
        isCurrentSpouse: !divorceDate,
      } : {}),
    }

    const hint = personName ? { personId, personName } : null
    const inferred = inferRelationships(rel, liveData, hint)

    if (isPending) {
      onExternalAdd(rel)
    } else {
      addRelationship(rel)
    }

    if (inferred.length > 0) setSuggestions(inferred)

    resetForm()
  }

  function handleDivorceSave(rel) {
    updateRelationship({
      ...rel,
      divorceDate: editingDivorce.date || null,
      isCurrentSpouse: !editingDivorce.date,
    })
    setEditingDivorce(null)
  }

  function handleInferenceConfirm(selected) {
    selected.forEach((s, i) => {
      const rel = { id: `r_${Date.now()}_${i}`, type: s.type, fromId: s.fromId, toId: s.toId }
      if (isPending) onExternalAdd(rel)
      else addRelationship(rel)
    })
    setSuggestions(null)
  }

  return (
    <div className="re-editor">
      <div className="re-list">
        {myRels.length === 0 && <p className="re-empty">No relationships yet.</p>}
        {myRels.map((rel) => (
          <div key={rel.id} className="re-item">
            <div className="re-item-main">
              <span className="re-desc">{relDescription(rel, personId, liveData?.people ?? [])}</span>
              <div className="re-item-actions">
                {rel.type === 'spouse' && !isPending && (
                  <button
                    className="re-divorce-btn"
                    onClick={() => setEditingDivorce({ relId: rel.id, date: rel.divorceDate ?? '' })}
                  >
                    {rel.divorceDate ? 'Edit divorce' : 'Set divorced'}
                  </button>
                )}
                <button className="re-remove" onClick={() => handleRemove(rel.id)} title="Remove">✕</button>
              </div>
            </div>
            {editingDivorce?.relId === rel.id && (
              <div className="re-divorce-form">
                <label className="re-label">Divorce date</label>
                <input
                  type="date"
                  className="re-search"
                  value={editingDivorce.date}
                  onChange={(e) => setEditingDivorce({ ...editingDivorce, date: e.target.value })}
                />
                <div className="re-add-actions">
                  <button className="re-cancel" onClick={() => setEditingDivorce(null)}>Cancel</button>
                  <button className="re-confirm" onClick={() => handleDivorceSave(rel)}>Save</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAdd && !suggestions && (
        <button className="re-add-btn" onClick={() => setShowAdd(true)}>+ Add relationship</button>
      )}

      {showAdd && (
        <div className="re-add-form">
          <select className="re-select" value={relType} onChange={(e) => setRelType(e.target.value)}>
            {REL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            className="re-search"
            placeholder="Search person by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedId(null) }}
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="re-results">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  className={`re-result ${selectedId === p.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedId(p.id); setSearch(`${p.firstName} ${p.lastName}`) }}
                >
                  {p.firstName} {p.lastName}
                  {p.birthDate && <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.35rem' }}>b. {p.birthDate.slice(0, 4)}</span>}
                </button>
              ))}
            </div>
          )}
          {relType === 'spouse' && (
            <>
              <label className="re-label">Marriage date (optional)</label>
              <input type="date" className="re-search" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} />
              <label className="re-label">Divorce date (optional)</label>
              <input type="date" className="re-search" value={divorceDate} onChange={(e) => setDivorceDate(e.target.value)} />
            </>
          )}
          <div className="re-add-actions">
            <button className="re-cancel" onClick={resetForm}>Cancel</button>
            <button className="re-confirm" onClick={handleAdd} disabled={!selectedId}>Add</button>
          </div>
        </div>
      )}

      {suggestions && (
        <InferenceDialog
          suggestions={suggestions}
          onConfirm={handleInferenceConfirm}
          onSkip={() => setSuggestions(null)}
        />
      )}
    </div>
  )
}
