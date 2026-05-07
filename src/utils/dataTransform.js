const GENDER_MAP = { male: 'M', female: 'F' }

/**
 * Transforms flat family.json format into the node array expected by family-chart (f3).
 *
 * f3 format per node: { id, data: { gender: "M"|"F", ...rest }, rels: { parents, spouses, children } }
 */
export function transformToF3Format(data) {
  const { people, relationships } = data

  const spouseRels = relationships.filter((r) => r.type === 'spouse')
  const parentChildRels = relationships.filter((r) =>
    ['parent-child', 'adoptive-parent-child', 'step-parent'].includes(r.type)
  )

  return people.map((person) => {
    const spouses = spouseRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => (r.fromId === person.id ? r.toId : r.fromId))

    const children = parentChildRels
      .filter((r) => r.fromId === person.id)
      .map((r) => r.toId)

    const parents = parentChildRels
      .filter((r) => r.toId === person.id)
      .map((r) => r.fromId)

    return {
      id: person.id,
      data: {
        ...person,
        // f3 expects "M" | "F" — map our schema values
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
