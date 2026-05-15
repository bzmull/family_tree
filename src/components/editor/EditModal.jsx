import { useState, useEffect } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import { PersonForm } from './PersonForm'
import { RelationshipEditor } from './RelationshipEditor'
import './EditModal.css'

const TABS = ['Person', 'Relationships']

function blankPerson() {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    maidenName: null,
    gender: undefined,
    birthDate: null,
    birthPlace: '',
    deathDate: null,
    isLiving: true,
    bio: '',
    occupation: '',
    private: {},
    privateNotes: '',
    customFields: {},
  }
}

export function EditModal() {
  const { liveData, editingPersonId, setEditingPersonId, updatePerson, addPerson, addRelationship, deletePerson } = useFamilyData()
  const [tab, setTab] = useState('Person')
  const [draft, setDraft] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingRels, setPendingRels] = useState([])

  const isOpen = editingPersonId != null

  useEffect(() => {
    if (!isOpen) { setDraft(null); setTab('Person'); setPendingRels([]); return }
    if (editingPersonId === '__new__') {
      setDraft(blankPerson())
      setIsNew(true)
      setPendingRels([])
    } else {
      const person = liveData?.people.find((p) => p.id === editingPersonId)
      setDraft(person ? structuredClone(person) : null)
      setIsNew(false)
    }
  }, [editingPersonId, isOpen, liveData])

  const handleSave = () => {
    if (!draft) return
    if (isNew) {
      addPerson(draft)
      pendingRels.forEach((rel) => addRelationship(rel))
    } else {
      updatePerson(draft)
    }
    setEditingPersonId(null)
  }

  const handleClose = () => { setEditingPersonId(null); setConfirmDelete(false) }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deletePerson(draft.id)
    setEditingPersonId(null)
  }

  if (!isOpen || !draft) return null

  return (
    <>
      <div className="em-backdrop" onClick={handleClose} />
      <div className="em-panel">
        <div className="em-header">
          <h2 className="em-title">
            {isNew ? 'Add Person' : `${draft.firstName || ''} ${draft.lastName || ''}`.trim() || 'Edit Person'}
          </h2>
          <button className="em-close" onClick={handleClose}>✕</button>
        </div>

        <div className="em-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`em-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="em-body">
          {tab === 'Person' && (
            <PersonForm
              person={draft}
              onChange={setDraft}
            />
          )}
          {tab === 'Relationships' && (
            <RelationshipEditor
              personId={draft.id}
              personName={isNew ? `${draft.firstName ?? ''} ${draft.lastName ?? ''}`.trim() || undefined : undefined}
              externalRels={isNew ? pendingRels : undefined}
              onExternalAdd={isNew ? (rel) => setPendingRels((prev) => [...prev, rel]) : undefined}
              onExternalRemove={isNew ? (relId) => setPendingRels((prev) => prev.filter((r) => r.id !== relId)) : undefined}
            />
          )}
        </div>

        <div className="em-footer">
          {!isNew && (
            confirmDelete ? (
              <>
                <button className="em-btn em-btn--cancel" onClick={() => setConfirmDelete(false)}>Keep</button>
                <button className="em-btn em-btn--delete em-btn--delete-confirm" onClick={handleDelete}>Delete forever</button>
              </>
            ) : (
              <button className="em-btn em-btn--delete" onClick={handleDelete}>Delete</button>
            )
          )}
          {!confirmDelete && (
            <>
              <button className="em-btn em-btn--cancel" onClick={handleClose}>Cancel</button>
              <button className="em-btn em-btn--save" onClick={handleSave} disabled={!draft.firstName || !draft.lastName}>
                {isNew ? 'Add to tree' : 'Apply changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
