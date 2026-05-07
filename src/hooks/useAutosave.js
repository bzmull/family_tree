import { useEffect, useRef } from 'react'

export function useAutosave(draft, save, isEditor) {
  const saveRef = useRef(save)
  saveRef.current = save

  // Debounced autosave: 30s after last draft change
  useEffect(() => {
    if (!draft || !isEditor) return
    const timer = setTimeout(() => saveRef.current(), 30_000)
    return () => clearTimeout(timer)
  }, [draft, isEditor])

  // Immediate save when user leaves the tab or closes the window
  useEffect(() => {
    if (!isEditor) return
    const handler = () => {
      if (document.visibilityState === 'hidden' && draft) saveRef.current()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [draft, isEditor])
}
