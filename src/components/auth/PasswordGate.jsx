import { useState } from 'react'
import './PasswordGate.css'

export function PasswordGate({ onLogin, error, loading }) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.trim()) onLogin(password)
  }

  return (
    <div className="pg-overlay">
      <div className="pg-card">
        <h1 className="pg-title">Family Tree</h1>
        <p className="pg-subtitle">Enter the family password to continue</p>
        <form onSubmit={handleSubmit} className="pg-form">
          <input
            type="password"
            className="pg-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
          />
          {error && <p className="pg-error">{error}</p>}
          <button type="submit" className="pg-btn" disabled={loading || !password.trim()}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
