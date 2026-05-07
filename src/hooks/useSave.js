import { useState, useCallback } from 'react'
import { useFamilyData } from '../context/FamilyDataContext'

export function useSave(token) {
  const { draft, data, commitDraft } = useFamilyData()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [commitUrl, setCommitUrl] = useState(null)

  const save = useCallback(async () => {
    const payload = draft ?? data
    if (!payload) return

    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/.netlify/functions/save-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      commitDraft(payload)
      setLastSavedAt(new Date())
      setCommitUrl(json.commitUrl)
      return true
    } catch (err) {
      setSaveError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [draft, data, token, commitDraft])

  return { save, saving, saveError, lastSavedAt, commitUrl }
}
