import { useState, useEffect } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import { PersonForm } from './PersonForm'
import { RelationshipEditor } from './RelationshipEditor'
import './EditModal.css'

const TABS = ['Person', 'Relationships']

function blankPerson(branches) {
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
    branches: branches.length > 0 ? [branches[0].id] : [],
    private: {},
    privateNotes: '',
    customFields: {},
  }
}

export function EditModal() {
  const { liveData, editingPersonId, setEditingPersonId, updatePerson, addPerson } = useFamilyData()
  const [tab, setTab] = useState('Person')
  const [draft, setDraft] = useState(null)
  const [isNew, setIsNew] = useState(false)

  const isOpen = editingPersonId != null

  useEffect(() => {
    if (!isOpen) { setDraft(null); setTab('Person'); return }
    if (editingPersonId === '__new__') {
      setDraft(blankPerson(liveData?.branches ?? []))
      setIsNew(true)
    } else {
      const person = liveData?.people.find((p) => p.id === editingPersonId)
      setDraft(person ? structuredClone(person) : null)
      setIsNew(false)
    }
  }, [editingPersonId, isOpen, liveData])

  const handleSave = () => {
    if (!draft) return
    if (isNew) addPerson(draft)
    else updatePerson(draft)
    setEditingPersonId(null)
  }

  const handleClose = () => setEditingPersonId(null)

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
              branches={liveData?.branches ?? []}
              onChange={setDraft}
            />
          )}
          {tab === 'Relationships' && !isNew && (
            <RelationshipEditor personId={draft.id} />
          )}
          {tab === 'Relationships' && isNew && (
            <p className="em-new-note">Save the person first, then add relationships.</p>
          )}
        </div>

        <div className="em-footer">
          <button className="em-btn em-btn--cancel" onClick={handleClose}>Cancel</button>
          <button className="em-btn em-btn--save" onClick={handleSave} disabled={!draft.firstName || !draft.lastName}>
            {isNew ? 'Add to tree' : 'Apply changes'}
          </button>
        </div>
      </div>
    </>
  )
}
