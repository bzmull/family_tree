/**
 * Transforms flat family.json format into the nested format expected by family-chart (f3).
 *
 * f3 expects each node to have a `rels` object:
 *   { spouses: [id, ...], children: [id, ...], father: id | null, mother: id | null }
 */
export function transformToF3Format(data) {
  const { people, relationships } = data

  // Index relationships for fast lookup
  const spouseRels = relationships.filter((r) => r.type === 'spouse')
  const parentChildRels = relationships.filter((r) =>
    ['parent-child', 'adoptive-parent-child', 'step-parent'].includes(r.type)
  )

  const nodes = people.map((person) => {
    const spouses = spouseRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => (r.fromId === person.id ? r.toId : r.fromId))

    const children = parentChildRels
      .filter((r) => r.fromId === person.id)
      .map((r) => r.toId)

    const parents = parentChildRels
      .filter((r) => r.toId === person.id)
      .map((r) => r.fromId)

    // f3 uses father/mother based on gender; fall back to generic parent slots
    const father = parents.find((pid) => {
      const p = people.find((x) => x.id === pid)
      return p?.gender === 'male'
    }) ?? parents[0] ?? null

    const mother = parents.find((pid) => {
      const p = people.find((x) => x.id === pid)
      return p?.gender === 'female'
    }) ?? (parents[1] ?? null)

    return {
      id: person.id,
      data: person,
      rels: { spouses, children, father, mother },
    }
  })

  return nodes
}

export function getRelationshipMeta(relationships, fromId, toId) {
  return relationships.find(
    (r) =>
      (r.fromId === fromId && r.toId === toId) ||
      (r.fromId === toId && r.toId === fromId)
  ) ?? null
}
