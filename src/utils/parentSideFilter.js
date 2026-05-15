const PARENT_TYPES = new Set(['parent-child', 'adoptive-parent-child', 'step-parent'])

export function getParentOptions(data, rootPersonId) {
  if (!rootPersonId || !data) return []
  const peopleById = new Map(data.people.map((p) => [p.id, p]))
  return data.relationships
    .filter((r) => PARENT_TYPES.has(r.type) && r.toId === rootPersonId)
    .map((r) => r.fromId)
    .filter((id) => peopleById.has(id))
    .map((id) => ({
      id,
      label: `${peopleById.get(id).firstName ?? 'Parent'}'s Side`,
    }))
}

export function filterByParentSide(data, rootPersonId, selectedParentId) {
  if (!selectedParentId || selectedParentId === 'all' || !rootPersonId) return data

  const parentRels = data.relationships.filter((r) => PARENT_TYPES.has(r.type))
  const parentsOf = new Map()
  const childrenOf = new Map()
  for (const rel of parentRels) {
    if (!parentsOf.has(rel.toId)) parentsOf.set(rel.toId, [])
    parentsOf.get(rel.toId).push(rel.fromId)
    if (!childrenOf.has(rel.fromId)) childrenOf.set(rel.fromId, [])
    childrenOf.get(rel.fromId).push(rel.toId)
  }

  // BFS ancestors from the selected parent
  const sideAncestors = new Set([selectedParentId])
  let frontier = [selectedParentId]
  while (frontier.length) {
    const next = []
    for (const id of frontier) {
      for (const pid of (parentsOf.get(id) ?? [])) {
        if (!sideAncestors.has(pid)) { sideAncestors.add(pid); next.push(pid) }
      }
    }
    frontier = next
  }

  // All descendants of those ancestors
  const sideAll = new Set(sideAncestors)
  frontier = [...sideAncestors]
  while (frontier.length) {
    const next = []
    for (const id of frontier) {
      for (const cid of (childrenOf.get(id) ?? [])) {
        if (!sideAll.has(cid)) { sideAll.add(cid); next.push(cid) }
      }
    }
    frontier = next
  }

  // Include spouses of everyone on this side
  const withSpouses = new Set(sideAll)
  for (const rel of data.relationships) {
    if (rel.type !== 'spouse') continue
    if (sideAll.has(rel.fromId)) withSpouses.add(rel.toId)
    if (sideAll.has(rel.toId)) withSpouses.add(rel.fromId)
  }

  // Always keep the root person visible
  withSpouses.add(rootPersonId)

  return {
    ...data,
    people: data.people.filter((p) => withSpouses.has(p.id)),
    relationships: data.relationships.filter(
      (r) => withSpouses.has(r.fromId) && withSpouses.has(r.toId)
    ),
  }
}
