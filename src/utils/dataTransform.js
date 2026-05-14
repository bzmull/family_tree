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
    if (parentsOfA.some((p) => parentsOfB.includes(p))) continue

    const vid = `__vp_${[fromId, toId].sort().join('_')}`
    if (virtualParents.some((v) => v.id === vid)) continue

    virtualParents.push({ id: vid, firstName: '', lastName: '', isVirtual: true })
    virtualPCRels.push({ fromId: vid, toId: fromId }, { fromId: vid, toId: toId })
  }

  const allPeople = [...people, ...virtualParents]
  const allPC = [...parentChildRels, ...virtualPCRels]

  // For each child with multiple parents, pick exactly ONE "primary parent".
  // Only that parent lists the child in rels.children; f3 infers the co-parent
  // from the spouse relationship. Without this, both parents would list the same
  // children and f3 would render each child twice (once per parent's subtree).
  //
  // Selection rule: prefer the parent who is married to a co-parent of the same
  // child (so f3's spouse-inference works). When both parents qualify (married
  // couple), pick the one that appears earliest in the people array.
  const peopleOrder = new Map(allPeople.map((p, i) => [p.id, i]))
  const primaryParentOf = new Map()

  for (const person of allPeople) {
    const parentIds = allPC.filter((r) => r.toId === person.id).map((r) => r.fromId)
    if (parentIds.length === 0) continue
    if (parentIds.length === 1) { primaryParentOf.set(person.id, parentIds[0]); continue }

    let chosen = null
    for (const pid of parentIds) {
      const spouseIds = spouseRels
        .filter((r) => r.fromId === pid || r.toId === pid)
        .map((r) => (r.fromId === pid ? r.toId : r.fromId))
      const coParentIsSpouse = parentIds.some((p) => p !== pid && spouseIds.includes(p))
      if (coParentIsSpouse) {
        const pidOrder = peopleOrder.get(pid) ?? Infinity
        const chosenOrder = chosen ? (peopleOrder.get(chosen) ?? Infinity) : Infinity
        if (pidOrder < chosenOrder) chosen = pid
      }
    }
    primaryParentOf.set(person.id, chosen ?? parentIds[0])
  }

  return allPeople.map((person) => {
    const spouses = spouseRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => (r.fromId === person.id ? r.toId : r.fromId))

    // Only include children for whom this person is the chosen primary parent.
    // The co-parent (spouse) will have an empty children list here; f3 infers them.
    const children = allPC
      .filter((r) => r.fromId === person.id && primaryParentOf.get(r.toId) === person.id)
      .map((r) => r.toId)

    const primaryParent = primaryParentOf.get(person.id)
    const parents = primaryParent ? [primaryParent] : []

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
