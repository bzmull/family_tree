import { Component } from 'react'

export class TreeErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          alignItems: 'center',
          background: '#0f172a',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          height: '100%',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '2rem' }}>⚠</span>
          <p style={{ color: '#f1f5f9', fontWeight: 600 }}>Tree failed to render</p>
          <p style={{ fontSize: '0.85rem' }}>{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
