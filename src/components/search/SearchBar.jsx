import { useState, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { useFamilyData } from '../../context/FamilyDataContext'
import { filterByBranch } from '../../utils/branchFilter'
import './SearchBar.css'

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export function SearchBar({ activeBranch, onSelect }) {
  const { liveData } = useFamilyData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const search = useCallback((q) => {
    if (!q.trim() || !liveData) { setResults([]); return }
    const scoped = filterByBranch(liveData, activeBranch)
    const fuse = new Fuse(scoped.people, {
      keys: ['firstName', 'lastName', 'maidenName', 'birthPlace', 'occupation'],
      threshold: 0.35,
      includeScore: true,
    })
    setResults(fuse.search(q.trim()).slice(0, 8).map((r) => r.item))
  }, [liveData, activeBranch])

  const debouncedSearch = useDebounce(search, 150)

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    debouncedSearch(q)
  }

  const handleSelect = (person) => {
    setQuery(`${person.firstName} ${person.lastName}`)
    setResults([])
    setOpen(false)
    onSelect(person.id)
  }

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="sb-wrap">
      <input
        ref={inputRef}
        className="sb-input"
        placeholder="Search people…"
        value={query}
        onChange={handleChange}
        onFocus={() => query && setOpen(true)}
        onBlur={handleBlur}
        aria-label="Search family members"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
      />
      {open && results.length > 0 && (
        <ul className="sb-results" role="listbox">
          {results.map((p) => (
            <li
              key={p.id}
              className="sb-result"
              role="option"
              onMouseDown={() => handleSelect(p)}
            >
              <span className="sb-name">{p.firstName} {p.lastName}</span>
              {p.maidenName && <span className="sb-sub">née {p.maidenName}</span>}
              {p.birthDate && <span className="sb-sub">b. {p.birthDate.slice(0, 4)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
