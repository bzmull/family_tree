import { useState } from 'react'
import './ExportPanel.css'

export function ExportPanel() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const { exportSubtreePdf } = await import('../../utils/exportTree')
      await exportSubtreePdf('.f3', { title: 'Family Tree' })
    } catch (e) {
      setError('Export failed. Try again.')
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="ep-wrap">
      <button
        className="ep-btn"
        onClick={handleExport}
        disabled={exporting}
        title="Export tree as PDF"
      >
        {exporting ? 'Exporting…' : '⬇ PDF'}
      </button>
      {error && <span className="ep-error">{error}</span>}
    </div>
  )
}
