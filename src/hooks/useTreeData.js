import { useEffect, useCallback } from 'react'
import { useFamilyData } from '../context/FamilyDataContext'
import { transformToF3Format } from '../utils/dataTransform'

export function useTreeData(token) {
  const { setData } = useFamilyData()

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/.netlify/functions/get-tree', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load family data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
  }, [token, setData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { refetch: fetchData }
}

export function toF3Nodes(data) {
  if (!data) return []
  return transformToF3Format(data)
}
