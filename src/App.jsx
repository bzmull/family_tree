import { useState, useMemo, useEffect, useRef } from 'react'
import { FamilyDataProvider, useFamilyData } from './context/FamilyDataContext'
import { useAuth } from './hooks/useAuth'
import { useTreeData, toRelNodes } from './hooks/useTreeData'
import { useSave } from './hooks/useSave'
import { useAutosave } from './hooks/useAutosave'
import { filterByGeneration } from './utils/generationFilter'
import { filterByParentSide, getParentOptions } from './utils/parentSideFilter'
import { PasswordGate } from './components/auth/PasswordGate'
import { FamilyTree } from './components/tree/FamilyTree'
import { BranchFilter } from './components/tree/BranchFilter'
import { TreeControls } from './components/tree/TreeControls'
import { TreeErrorBoundary } from './components/tree/TreeErrorBoundary'
import { EditModal } from './components/editor/EditModal'
import { SuggestionsPanel } from './components/editor/SuggestionsPanel'
import { SearchBar } from './components/search/SearchBar'
import { ExportPanel } from './components/export/ExportPanel'
import './App.css'

function AppInner({ auth }) {
  const { liveData, setEditingPersonId, draft } = useFamilyData()
  const { token, role, isEditor, logout } = auth
  const isSuggestion = role === 'viewer'
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [activeSide, setActiveSide] = useState('all')
  const [rootPersonId, setRootPersonId] = useState(null)
  const [ancestorGens, setAncestorGens] = useState(3)
  const [descendantGens, setDescendantGens] = useState(3)
  const { save, saving, saveError, lastSavedAt } = useSave(token)
  const treeControlRef = useRef(null)

  useTreeData(token)
  useAutosave(draft, save, isEditor)

  useEffect(() => {
    if (!isEditor || !token) return
    const fetchCount = () =>
      fetch('/.netlify/functions/get-suggestions', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setPendingCount(d.pendingCount) })
        .catch(() => {})
    fetchCount()
  }, [isEditor, token])

  // Reset side filter when the root person changes (parent options change)
  useEffect(() => {
    setActiveSide('all')
  }, [rootPersonId])

  const parentOptions = useMemo(
    () => getParentOptions(liveData, rootPersonId),
    [liveData, rootPersonId]
  )

  const filteredData = useMemo(() => {
    if (!liveData) return null
    const sided = filterByParentSide(liveData, rootPersonId, activeSide)
    return filterByGeneration(sided, rootPersonId, ancestorGens, descendantGens)
  }, [liveData, rootPersonId, activeSide, ancestorGens, descendantGens])

  const nodes = useMemo(() => toRelNodes(filteredData), [filteredData])

  const personById = useMemo(
    () => new Map((filteredData?.people ?? []).map((p) => [p.id, p])),
    [filteredData]
  )

  // On first load, use defaultRootId from data if set; otherwise fall back to oldest ancestor
  useEffect(() => {
    if (!nodes?.length || rootPersonId !== null) return
    const preferred = liveData?.defaultRootId
    if (preferred && nodes.some((n) => n.id === preferred)) {
      setRootPersonId(preferred)
    } else {
      const rootNode = nodes.find((n) => !n.parents?.length)
      setRootPersonId(rootNode?.id ?? nodes[0]?.id)
    }
  }, [nodes])

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
      <div className="app-header-inner">
        <div className="app-header-left">
          <span className="app-title">Family Tree</span>
          <BranchFilter
            options={parentOptions}
            activeSide={activeSide}
            onChange={setActiveSide}
          />
          <SearchBar
            activeBranch={activeSide}
            onSelect={(id) => {
              const node = nodes?.find((n) => n.id === id)
              // "Married-in" people (no parents in tree) centre poorly — redirect to
              // their spouse who carries the lineage. Reverses automatically once their
              // own parents are added.
              if (!node?.parents?.length && node?.spouses?.length) {
                setRootPersonId(node.spouses[0].id)
              } else {
                setRootPersonId(id)
              }
            }}
          />
        </div>
        <div className="app-header-right">
          <ExportPanel />
          {isEditor && rootPersonId && (
            <button
              className="header-btn header-btn--edit"
              onClick={() => setEditingPersonId(rootPersonId)}
            >
              Edit {personById.get(rootPersonId)?.firstName ?? 'Person'}
            </button>
          )}
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
          {isEditor && (
            <button
              className={`header-btn header-btn--suggestions ${pendingCount > 0 ? 'has-badge' : ''}`}
              onClick={() => setShowSuggestions(true)}
            >
              Suggestions{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          )}
          {draft && !saving && isEditor && (
            <span className="unsaved-status">Unsaved changes</span>
          )}
          {lastSavedAt && !draft && (
            <span className="save-status">Saved — tree refreshing in ~60s</span>
          )}
          {saveError && <span className="save-error">{saveError}</span>}
          <button className="header-btn" onClick={logout}>Sign out</button>
        </div>
      </div>
      </header>

      <div className="app-body">
        <div className="app-tree">
          <TreeErrorBoundary>
            <FamilyTree
              nodes={nodes}
              personById={personById}
              isEditor={isEditor}
              rootPersonId={rootPersonId}
              controlRef={treeControlRef}
              onPersonClick={(id) => {
                if (isSuggestion) {
                  setEditingPersonId(id)
                } else {
                  setRootPersonId(id)
                }
              }}
            />
          </TreeErrorBoundary>
        </div>
        <div className="app-controls">
          <TreeControls
            onFitScreen={() => treeControlRef.current?.resetTransform()}
            onZoomIn={() => treeControlRef.current?.zoomIn()}
            onZoomOut={() => treeControlRef.current?.zoomOut()}
            onJumpToRoot={() => {
              const rootNode = nodes?.find((n) => !n.parents?.length)
              setRootPersonId(rootNode?.id ?? nodes[0]?.id ?? null)
            }}
            ancestorGens={ancestorGens}
            descendantGens={descendantGens}
            onAncestorGensChange={setAncestorGens}
            onDescendantGensChange={setDescendantGens}
          />
        </div>
      </div>
      <EditModal role={role} token={token} />
      {showSuggestions && (
        <SuggestionsPanel
          token={token}
          liveData={liveData}
          onClose={() => setShowSuggestions(false)}
          onCountChange={setPendingCount}
        />
      )}
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
      <AppInner auth={auth} />
    </FamilyDataProvider>
  )
}
