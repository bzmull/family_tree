import { useState, useMemo } from 'react'
import { FamilyDataProvider, useFamilyData } from './context/FamilyDataContext'
import { useAuth } from './hooks/useAuth'
import { useTreeData, toF3Nodes } from './hooks/useTreeData'
import { useSave } from './hooks/useSave'
import { filterByBranch } from './utils/branchFilter'
import { PasswordGate } from './components/auth/PasswordGate'
import { FamilyTree } from './components/tree/FamilyTree'
import { BranchFilter } from './components/tree/BranchFilter'
import { TreeControls } from './components/tree/TreeControls'
import { EditModal } from './components/editor/EditModal'
import './App.css'

function AppInner() {
  const { liveData, setEditingPersonId } = useFamilyData()
  const { token, isEditor, logout } = useAuth()
  const [activeBranch, setActiveBranch] = useState('all')
  const [rootPersonId, setRootPersonId] = useState(null)
  const { save, saving, saveError, lastSavedAt } = useSave(token)

  useTreeData(token)

  const filteredData = useMemo(() => {
    if (!liveData) return null
    return filterByBranch(liveData, activeBranch)
  }, [liveData, activeBranch])

  const nodes = useMemo(() => toF3Nodes(filteredData), [filteredData])

  if (!liveData) {
    return (
      <div className="app-loading">
        <div className="app-spinner" />
        <p>Loading family tree…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-title">Family Tree</span>
          <BranchFilter
            branches={liveData.branches}
            activeBranch={activeBranch}
            onChange={setActiveBranch}
          />
        </div>
        <div className="app-header-right">
          {isEditor && (
            <button
              className="header-btn header-btn--add"
              onClick={() => setEditingPersonId('__new__')}
            >
              + Add Person
            </button>
          )}
          {isEditor && (
            <button
              className="header-btn header-btn--save"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {lastSavedAt && (
            <span className="save-status">
              Saved — tree refreshing in ~60s
            </span>
          )}
          {saveError && <span className="save-error">{saveError}</span>}
          <button className="header-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="app-body">
        <div className="app-tree">
          <FamilyTree
            nodes={nodes}
            branches={liveData.branches}
            isEditor={isEditor}
            rootPersonId={rootPersonId}
            onPersonClick={(id) => {
              if (isEditor) setEditingPersonId(id)
              else setRootPersonId(id)
            }}
          />
        </div>
        <div className="app-controls">
          <TreeControls
            onFitScreen={() => setRootPersonId(null)}
            onZoomIn={() => document.querySelector('svg.main_svg')?.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true }))}
            onZoomOut={() => document.querySelector('svg.main_svg')?.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }))}
            onJumpToRoot={() => setRootPersonId(nodes[0]?.id ?? null)}
          />
        </div>
      </div>
      <EditModal />
    </div>
  )
}

export default function App() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return <PasswordGate onLogin={auth.login} error={auth.error} loading={auth.loading} />
  }

  return (
    <FamilyDataProvider>
      <AppInner />
    </FamilyDataProvider>
  )
}
