import { describe, it, expect } from 'vitest'
import { filterPersonForViewer, filterDataForRole } from './privacyFilter'

const living = {
  id: 'p1',
  firstName: 'Alice',
  birthDate: '1985-04-01',
  isLiving: true,
  bio: 'Some bio',
  privateNotes: 'Secret note',
  private: {},
}

const deceased = {
  id: 'p2',
  firstName: 'Bob',
  birthDate: '1930-01-01',
  deathDate: '2000-12-31',
  isLiving: false,
  privateNotes: 'Another secret',
  private: { bio: true },
  bio: 'Public bio',
}

describe('filterPersonForViewer', () => {
  it('removes privateNotes', () => {
    const result = filterPersonForViewer(living)
    expect(result.privateNotes).toBeUndefined()
  })

  it('hides birthDate of living person by default', () => {
    const result = filterPersonForViewer(living)
    expect(result.birthDate).toBeUndefined()
  })

  it('shows birthDate of living person when explicitly set to false', () => {
    const person = { ...living, private: { birthDate: false } }
    const result = filterPersonForViewer(person)
    expect(result.birthDate).toBe('1985-04-01')
  })

  it('shows birthDate of deceased person', () => {
    const result = filterPersonForViewer(deceased)
    expect(result.birthDate).toBe('1930-01-01')
  })

  it('strips fields marked private', () => {
    const result = filterPersonForViewer(deceased)
    expect(result.bio).toBeUndefined()
  })
})

describe('filterDataForRole', () => {
  const data = { people: [living, deceased], relationships: [] }

  it('returns raw data for editor role', () => {
    const result = filterDataForRole(data, 'editor')
    expect(result.people[0].privateNotes).toBe('Secret note')
  })

  it('strips private fields for viewer role', () => {
    const result = filterDataForRole(data, 'viewer')
    expect(result.people[0].privateNotes).toBeUndefined()
  })
})
