import { useState, useCallback, useEffect } from 'react'

const SESSION_KEY = 'ft_jwt'

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function isTokenValid(token) {
  const payload = parseJwt(token)
  if (!payload) return false
  return payload.exp * 1000 > Date.now()
}

export function useAuth() {
  const [token, setToken] = useState(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    return stored && isTokenValid(stored) ? stored : null
  })
  const [role, setRole] = useState(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored && isTokenValid(stored)) return parseJwt(stored)?.role ?? null
    return null
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Invalid password')
        return false
      }
      sessionStorage.setItem(SESSION_KEY, json.token)
      setToken(json.token)
      setRole(json.role)
      return true
    } catch {
      setError('Could not connect. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setToken(null)
    setRole(null)
  }, [])

  const isAuthenticated = !!token
  const isEditor = role === 'editor'

  return { token, role, isAuthenticated, isEditor, login, logout, error, loading }
}
