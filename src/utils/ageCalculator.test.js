import { describe, it, expect } from 'vitest'
import { calculateAge, getAgeAtDeath, getBirthYear, formatLifespan } from './ageCalculator'

describe('calculateAge', () => {
  it('returns correct age when birthday has passed this year', () => {
    const ref = new Date('2026-06-01')
    expect(calculateAge('1990-03-15', ref)).toBe(36)
  })

  it('returns correct age when birthday has not yet occurred this year', () => {
    const ref = new Date('2026-02-01')
    expect(calculateAge('1990-03-15', ref)).toBe(35)
  })

  it('returns null for null birthDate', () => {
    expect(calculateAge(null)).toBeNull()
  })

  it('returns null for invalid date string', () => {
    expect(calculateAge('not-a-date')).toBeNull()
  })
})

describe('getAgeAtDeath', () => {
  it('calculates age at death correctly', () => {
    expect(getAgeAtDeath('1938-11-02', '2010-04-17')).toBe(71)
  })

  it('returns null when either date is missing', () => {
    expect(getAgeAtDeath(null, '2010-04-17')).toBeNull()
    expect(getAgeAtDeath('1938-11-02', null)).toBeNull()
  })
})

describe('getBirthYear', () => {
  it('extracts year from date string', () => {
    expect(getBirthYear('1942-03-15')).toBe(1942)
  })

  it('returns null for null input', () => {
    expect(getBirthYear(null)).toBeNull()
  })
})

describe('formatLifespan', () => {
  it('formats birth–death range', () => {
    expect(formatLifespan({ birthDate: '1938-11-02', deathDate: '2010-04-17', isLiving: false })).toBe('1938–2010')
  })

  it('formats living person as b. YYYY', () => {
    expect(formatLifespan({ birthDate: '1990-05-01', isLiving: true })).toBe('b. 1990')
  })

  it('returns empty string when no dates', () => {
    expect(formatLifespan({ isLiving: true })).toBe('')
  })
})
