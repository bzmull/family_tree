const PARENT_TYPES = new Set(['parent-child', 'adoptive-parent-child', 'step-parent'])

export function filterByGeneration(data, rootPersonId, ancestorGens, descendantGens) {
  if (!rootPersonId) return data
  if (ancestorGens == null && descendantGens == null) return data

  const parentRels = data.relationships.filter((r) => PARENT_TYPES.has(r.type))

  const parentsOf = new Map()
  const childrenOf = new Map()
  for (const rel of parentRels) {
    if (!parentsOf.has(rel.toId)) parentsOf.set(rel.toId, [])
    parentsOf.get(rel.toId).push(rel.fromId)
    if (!childrenOf.has(rel.fromId)) childrenOf.set(rel.fromId, [])
    childrenOf.get(rel.fromId).push(rel.toId)
  }

  const included = new Set([rootPersonId])

  // BFS upward
  let frontier = [rootPersonId]
  for (let gen = 0; gen < (ancestorGens ?? Infinity); gen++) {
    const next = []
    for (const id of frontier) {
      for (const pid of (parentsOf.get(id) ?? [])) {
        if (!included.has(pid)) { included.add(pid); next.push(pid) }
      }
    }
    if (!next.length) break
    frontier = next
  }

  // BFS downward
  frontier = [rootPersonId]
  for (let gen = 0; gen < (descendantGens ?? Infinity); gen++) {
    const next = []
    for (const id of frontier) {
      for (const cid of (childrenOf.get(id) ?? [])) {
        if (!included.has(cid)) { included.add(cid); next.push(cid) }
      }
    }
    if (!next.length) break
    frontier = next
  }

  // Pull in spouses of all included people
  const withSpouses = new Set(included)
  for (const rel of data.relationships) {
    if (rel.type !== 'spouse') continue
    if (included.has(rel.fromId)) withSpouses.add(rel.toId)
    if (included.has(rel.toId)) withSpouses.add(rel.fromId)
  }

  return {
    ...data,
    people: data.people.filter((p) => withSpouses.has(p.id)),
    relationships: data.relationships.filter(
      (r) => withSpouses.has(r.fromId) && withSpouses.has(r.toId)
    ),
  }
}
