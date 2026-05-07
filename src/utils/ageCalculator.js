export function calculateAge(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null

  let age = referenceDate.getFullYear() - birth.getFullYear()
  const monthDiff = referenceDate.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function getAgeAtDeath(birthDate, deathDate) {
  if (!birthDate || !deathDate) return null
  return calculateAge(birthDate, new Date(deathDate))
}

export function getBirthYear(birthDate) {
  if (!birthDate) return null
  const year = parseInt(birthDate.split('-')[0], 10)
  return isNaN(year) ? null : year
}

export function getDeathYear(deathDate) {
  return getBirthYear(deathDate)
}

export function formatLifespan(person) {
  const birthYear = getBirthYear(person.birthDate)
  const deathYear = getDeathYear(person.deathDate)

  if (birthYear && deathYear) return `${birthYear}–${deathYear}`
  if (birthYear && person.isLiving) return `b. ${birthYear}`
  if (birthYear) return `${birthYear}–?`
  return ''
}
