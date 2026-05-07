const GENDER_MAP = { male: 'M', female: 'F' }

export function transformToF3Format(data) {
  const { people, relationships } = data

  const spouseRels = relationships.filter((r) => r.type === 'spouse')
  const parentChildRels = relationships.filter((r) =>
    ['parent-child', 'adoptive-parent-child', 'step-parent'].includes(r.type)
  )
  const siblingRels = relationships.filter((r) =>
    r.type === 'sibling' || r.type === 'half-sibling'
  )

  // For sibling pairs with no shared real parent, create an invisible virtual
  // parent node so f3 can render them as siblings in the tree layout.
  const virtualParents = []
  const virtualPCRels = []

  for (const { fromId, toId } of siblingRels) {
    const parentsOfA = parentChildRels.filter((r) => r.toId === fromId).map((r) => r.fromId)
    const parentsOfB = parentChildRels.filter((r) => r.toId === toId).map((r) => r.fromId)
    if (parentsOfA.some((p) => parentsOfB.includes(p))) continue // already share a parent

    const vid = `__vp_${[fromId, toId].sort().join('_')}`
    if (virtualParents.some((v) => v.id === vid)) continue

    virtualParents.push({ id: vid, firstName: '', lastName: '', isVirtual: true })
    virtualPCRels.push({ fromId: vid, toId: fromId }, { fromId: vid, toId: toId })
  }

  const allPeople = [...people, ...virtualParents]
  const allPC = [...parentChildRels, ...virtualPCRels]

  return allPeople.map((person) => {
    const spouses = spouseRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => (r.fromId === person.id ? r.toId : r.fromId))

    const children = allPC.filter((r) => r.fromId === person.id).map((r) => r.toId)
    const parents = allPC.filter((r) => r.toId === person.id).map((r) => r.fromId)

    return {
      id: person.id,
      data: {
        ...person,
        gender: GENDER_MAP[person.gender] ?? undefined,
      },
      rels: { parents, spouses, children },
    }
  })
}

export function getRelationshipMeta(relationships, fromId, toId) {
  return relationships.find(
    (r) =>
      (r.fromId === fromId && r.toId === toId) ||
      (r.fromId === toId && r.toId === fromId)
  ) ?? null
}
