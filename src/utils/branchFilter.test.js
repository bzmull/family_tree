import { describe, it, expect } from 'vitest'
import { filterByBranch, isBridgePerson } from './branchFilter'

const branches = [
  { id: 'paternal', label: "Dad's Side", color: '#0891B2' },
  { id: 'maternal', label: "Mom's Side", color: '#7C3AED' },
]

const people = [
  { id: 'p1', branches: ['paternal'] },
  { id: 'p2', branches: ['maternal'] },
  { id: 'p3', branches: ['paternal', 'maternal'] }, // bridge
  { id: 'p4', branches: ['paternal'] },
]

const relationships = [
  { id: 'r1', type: 'spouse', fromId: 'p1', toId: 'p3' },
  { id: 'r2', type: 'parent-child', fromId: 'p1', toId: 'p4' },
  { id: 'r3', type: 'parent-child', fromId: 'p2', toId: 'p3' },
]

const data = { branches, people, relationships }

describe('filterByBranch', () => {
  it('returns all data when branchId is "all"', () => {
    const result = filterByBranch(data, 'all')
    expect(result.people).toHaveLength(4)
  })

  it('returns paternal members plus their relationship partners', () => {
    const result = filterByBranch(data, 'paternal')
    const ids = result.people.map((p) => p.id)
    expect(ids).toContain('p1')
    expect(ids).toContain('p4')
    expect(ids).toContain('p3') // bridge person — spouse of p1
  })

  it('excludes people with no connection to the branch', () => {
    const result = filterByBranch(data, 'paternal')
    const ids = result.people.map((p) => p.id)
    // p2 is maternal-only and has no relationship to paternal members
    expect(ids).not.toContain('p2')
  })

  it('only includes relationships where both people are in the filtered set', () => {
    const result = filterByBranch(data, 'paternal')
    expect(result.relationships.every((r) => {
      const ids = new Set(result.people.map((p) => p.id))
      return ids.has(r.fromId) && ids.has(r.toId)
    })).toBe(true)
  })
})

describe('isBridgePerson', () => {
  it('identifies multi-branch person as bridge', () => {
    expect(isBridgePerson(people[2], branches)).toBe(true)
  })

  it('does not flag single-branch person as bridge', () => {
    expect(isBridgePerson(people[0], branches)).toBe(false)
  })
})
