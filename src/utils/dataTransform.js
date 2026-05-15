const PARENT_TYPE = {
  'parent-child': 'blood',
  'adoptive-parent-child': 'adopted',
  'step-parent': 'half',
}
const SIBLING_TYPE = {
  'sibling': 'blood',
  'half-sibling': 'half',
}

// Transform raw { people, relationships } into relatives-tree node format.
// relatives-tree requires both parents to list a shared child — the library
// uses first.children ∩ second.children to find a couple's shared children.
export function transformToRelNodes(data) {
  const { people, relationships } = data

  const spouseRels   = relationships.filter((r) => r.type === 'spouse')
  const parentRels   = relationships.filter((r) => r.type in PARENT_TYPE)
  const siblingRels  = relationships.filter((r) => r.type in SIBLING_TYPE)

  return people.map((person) => ({
    id: person.id,
    gender: person.gender === 'female' ? 'female' : 'male',

    parents: parentRels
      .filter((r) => r.toId === person.id)
      .map((r) => ({ id: r.fromId, type: PARENT_TYPE[r.type] })),

    children: parentRels
      .filter((r) => r.fromId === person.id)
      .map((r) => ({ id: r.toId, type: PARENT_TYPE[r.type] })),

    siblings: siblingRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => ({
        id: r.fromId === person.id ? r.toId : r.fromId,
        type: SIBLING_TYPE[r.type],
      })),

    spouses: spouseRels
      .filter((r) => r.fromId === person.id || r.toId === person.id)
      .map((r) => ({
        id: r.fromId === person.id ? r.toId : r.fromId,
        type: r.divorceDate ? 'divorced' : 'married',
      })),
  }))
}

export function getRelationshipMeta(relationships, fromId, toId) {
  return relationships.find(
    (r) =>
      (r.fromId === fromId && r.toId === toId) ||
      (r.fromId === toId && r.toId === fromId)
  ) ?? null
}
