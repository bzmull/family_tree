export function filterPersonForViewer(person) {
  const sanitized = { ...person }
  const privateFlags = person.private || {}

  // privateNotes is always stripped for viewers
  delete sanitized.privateNotes

  // Strip any field explicitly marked private
  for (const [field, isPrivate] of Object.entries(privateFlags)) {
    if (isPrivate) delete sanitized[field]
  }

  // birthDate on living people is private by default unless explicitly set to false
  if (person.isLiving && privateFlags.birthDate !== false) {
    delete sanitized.birthDate
  }

  return sanitized
}

export function filterDataForRole(data, role) {
  if (role === 'editor') return data
  return {
    ...data,
    people: data.people.map(filterPersonForViewer),
  }
}
