import { useState } from 'react'
import Fuse from 'fuse.js'
import { useFamilyData } from '../../context/FamilyDataContext'
import './RelationshipEditor.css'

const REL_TYPES = [
  { value: 'parent-child', label: 'Parent of' },
  { value: 'adoptive-parent-child', label: 'Adoptive parent of' },
  { value: 'step-parent', label: 'Step-parent of' },
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
  if (rel.type === 'spouse') return `Spouse: ${name}${rel.marriageDate ? ` (m. ${rel.marriageDate.slice(0, 4)})` : ''}`
  if (rel.type.includes('parent') && isFrom) return `${type}: ${name}`
  if (rel.type.includes('parent') && !isFrom) return `Child of: ${name}`
  return `${type}: ${name}`
}

export function RelationshipEditor({ personId }) {
  const { liveData, addRelationship, removeRelationship } = useFamilyData()
  const [showAdd, setShowAdd] = useState(false)
  const [relType, setRelType] = useState('parent-child')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [marriageDate, setMarriageDate] = useState('')

  const myRels = (liveData?.relationships ?? []).filter(
    (r) => r.fromId === personId || r.toId === personId
  )

  const fuse = new Fuse(
    (liveData?.people ?? []).filter((p) => p.id !== personId),
    { keys: ['firstName', 'lastName'], threshold: 0.35 }
  )
  const searchResults = search.trim()
    ? fuse.search(search.trim()).slice(0, 6).map((r) => r.item)
    : []

  const handleAdd = () => {
    if (!selectedId) return
    const rel = {
      id: `r_${Date.now()}`,
      type: relType,
      fromId: personId,
      toId: selectedId,
      ...(relType === 'spouse' ? { marriageDate: marriageDate || null, divorceDate: null, isCurrentSpouse: true } : {}),
    }
    addRelationship(rel)
    setShowAdd(false)
    setSearch('')
    setSelectedId(null)
    setMarriageDate('')
  }

  return (
    <div className="re-editor">
      <div className="re-list">
        {myRels.length === 0 && <p className="re-empty">No relationships yet.</p>}
        {myRels.map((rel) => (
          <div key={rel.id} className="re-item">
            <span className="re-desc">{relDescription(rel, personId, liveData?.people ?? [])}</span>
            <button className="re-remove" onClick={() => removeRelationship(rel.id)} title="Remove">✕</button>
          </div>
        ))}
      </div>

      {!showAdd && (
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
                </button>
              ))}
            </div>
          )}
          {relType === 'spouse' && (
            <div>
              <label className="re-label">Marriage date (optional)</label>
              <input type="date" className="re-search" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} />
            </div>
          )}
          <div className="re-add-actions">
            <button className="re-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="re-confirm" onClick={handleAdd} disabled={!selectedId}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}
