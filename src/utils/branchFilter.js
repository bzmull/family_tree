export function filterByBranch(data, branchId) {
  if (!branchId || branchId === 'all') return data

  // Collect people in the selected branch
  const branchPersonIds = new Set(
    data.people
      .filter((p) => (p.branches ?? []).includes(branchId))
      .map((p) => p.id)
  )

  // Expand: include spouses of core members even if they're in another branch.
  // Parent-child expansion is downward only (parent→child), so we don't pull in
  // a bridge person's parents from the other branch.
  const expandedIds = new Set(branchPersonIds)
  for (const rel of data.relationships) {
    if (rel.type === 'spouse') {
      if (branchPersonIds.has(rel.fromId)) expandedIds.add(rel.toId)
      if (branchPersonIds.has(rel.toId)) expandedIds.add(rel.fromId)
    } else {
      // parent-child / step-parent / adoptive: expand parent→child only
      if (branchPersonIds.has(rel.fromId)) expandedIds.add(rel.toId)
    }
  }

  const people = data.people.filter((p) => expandedIds.has(p.id))
  const relationships = data.relationships.filter(
    (r) => expandedIds.has(r.fromId) && expandedIds.has(r.toId)
  )

  return { ...data, people, relationships }
}

export function isBridgePerson(person, allBranches) {
  const branches = person.branches ?? []
  return branches.length > 1 || allBranches.every((b) => branches.includes(b.id))
}
