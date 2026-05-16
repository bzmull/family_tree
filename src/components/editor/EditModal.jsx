import { useState, useEffect } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import { PersonForm } from './PersonForm'
import { RelationshipEditor } from './RelationshipEditor'
import './EditModal.css'

const TABS = ['Person', 'Relationships']
const VIEWER_TABS = ['Person']

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

export function EditModal({ role, token }) {
  const { liveData, editingPersonId, setEditingPersonId, updatePerson, addPerson, addRelationship, deletePerson } = useFamilyData()
  const isSuggestion = role === 'viewer'
  const [tab, setTab] = useState('Person')
  const [draft, setDraft] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingRels, setPendingRels] = useState([])
  const [submitterName, setSubmitterName] = useState('')
  const [submitState, setSubmitState] = useState(null) // null | 'submitting' | 'done' | 'error'
  const [personSnapshot, setPersonSnapshot] = useState(null)

  const isOpen = editingPersonId != null

  useEffect(() => {
    if (!isOpen) { setDraft(null); setTab('Person'); setPendingRels([]); setSubmitState(null); setSubmitterName(''); setPersonSnapshot(null); return }
    if (editingPersonId === '__new__') {
      setDraft(blankPerson())
      setIsNew(true)
      setPendingRels([])
      setPersonSnapshot(null)
    } else {
      const person = liveData?.people.find((p) => p.id === editingPersonId)
      setDraft(person ? structuredClone(person) : null)
      setPersonSnapshot(person ? structuredClone(person) : null)
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

  const handleSuggest = async () => {
    if (!draft) return
    setSubmitState('submitting')
    try {
      const res = await fetch('/.netlify/functions/submit-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personId: draft.id, personSnapshot, proposedData: draft, submitterName }),
      })
      setSubmitState(res.ok ? 'done' : 'error')
    } catch {
      setSubmitState('error')
    }
  }

  const handleClose = () => { setEditingPersonId(null); setConfirmDelete(false) }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deletePerson(draft.id)
    setEditingPersonId(null)
  }

  if (!isOpen || !draft) return null

  const activeTabs = isSuggestion ? VIEWER_TABS : TABS
  const personName = `${draft.firstName || ''} ${draft.lastName || ''}`.trim() || 'Edit Person'

  return (
    <>
      <div className="em-backdrop" onClick={handleClose} />
      <div className="em-panel">
        <div className="em-header">
          <h2 className="em-title">
            {isSuggestion ? `Suggest edit — ${personName}` : isNew ? 'Add Person' : personName}
          </h2>
          <button className="em-close" onClick={handleClose}>✕</button>
        </div>

        {isSuggestion && submitState === 'done' ? (
          <div className="em-body em-suggestion-done">
            <p>Your suggestion has been submitted. An editor will review it shortly.</p>
            <button className="em-btn em-btn--cancel" onClick={handleClose} style={{ marginTop: '1rem' }}>Close</button>
          </div>
        ) : (
          <>
            {isSuggestion && (
              <div className="em-suggestion-banner">
                Suggesting a change — editors will review before anything is updated.
              </div>
            )}

            <div className="em-tabs">
              {activeTabs.map((t) => (
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
              {isSuggestion && (
                <div className="em-submitter">
                  <label className="em-submitter-label">Your name (optional)</label>
                  <input
                    className="em-submitter-input"
                    placeholder="e.g. Aunt Sarah"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                  />
                </div>
              )}
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
              {!isSuggestion && !isNew && (
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
                  {isSuggestion ? (
                    <button
                      className="em-btn em-btn--save"
                      onClick={handleSuggest}
                      disabled={submitState === 'submitting' || !draft.firstName || !draft.lastName}
                    >
                      {submitState === 'submitting' ? 'Submitting…' : submitState === 'error' ? 'Error — retry' : 'Submit suggestion'}
                    </button>
                  ) : (
                    <button className="em-btn em-btn--save" onClick={handleSave} disabled={!draft.firstName || !draft.lastName}>
                      {isNew ? 'Add to tree' : 'Apply changes'}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
