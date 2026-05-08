import { createContext, useContext, useState, useCallback } from 'react'

const FamilyDataContext = createContext(null)

export function FamilyDataProvider({ children }) {
  const [data, setData] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editingPersonId, setEditingPersonId] = useState(null)

  const updatePerson = useCallback((updatedPerson) => {
    setDraft((prev) => {
      const base = prev ?? data
      return {
        ...base,
        people: base.people.map((p) => p.id === updatedPerson.id ? updatedPerson : p),
      }
    })
  }, [data])

  const addPerson = useCallback((newPerson) => {
    setDraft((prev) => {
      const base = prev ?? data
      return { ...base, people: [...base.people, newPerson] }
    })
  }, [data])

  const addRelationship = useCallback((rel) => {
    setDraft((prev) => {
      const base = prev ?? data
      return { ...base, relationships: [...base.relationships, rel] }
    })
  }, [data])

  const removeRelationship = useCallback((relId) => {
    setDraft((prev) => {
      const base = prev ?? data
      return { ...base, relationships: base.relationships.filter((r) => r.id !== relId) }
    })
  }, [data])

  const deletePerson = useCallback((personId) => {
    setDraft((prev) => {
      const base = prev ?? data
      return {
        ...base,
        people: base.people.filter((p) => p.id !== personId),
        relationships: base.relationships.filter(
          (r) => r.fromId !== personId && r.toId !== personId
        ),
      }
    })
  }, [data])

  const discardDraft = useCallback(() => setDraft(null), [])

  const commitDraft = useCallback((savedData) => {
    setData(savedData)
    setDraft(null)
  }, [])

  // The live view: draft takes precedence over saved data
  const liveData = draft ?? data

  return (
    <FamilyDataContext.Provider value={{
      data, setData,
      draft, liveData,
      editingPersonId, setEditingPersonId,
      updatePerson, addPerson, deletePerson,
      addRelationship, removeRelationship,
      discardDraft, commitDraft,
    }}>
      {children}
    </FamilyDataContext.Provider>
  )
}

export function useFamilyData() {
  const ctx = useContext(FamilyDataContext)
  if (!ctx) throw new Error('useFamilyData must be used within FamilyDataProvider')
  return ctx
}
