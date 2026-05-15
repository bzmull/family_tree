const PARENT_TYPES = new Set(['parent-child', 'adoptive-parent-child', 'step-parent'])

function getName(peopleById, id) {
  const p = peopleById.get(id)
  return p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Unknown' : 'Unknown'
}

function alreadySiblings(relationships, idA, idB) {
  return relationships.some(
    (r) =>
      (r.type === 'sibling' || r.type === 'half-sibling') &&
      ((r.fromId === idA && r.toId === idB) || (r.fromId === idB && r.toId === idA))
  )
}

function isParentOf(relationships, parentId, childId) {
  return relationships.some(
    (r) => PARENT_TYPES.has(r.type) && r.fromId === parentId && r.toId === childId
  )
}

function getParentsOf(relationships, childId) {
  return relationships
    .filter((r) => PARENT_TYPES.has(r.type) && r.toId === childId)
    .map((r) => r.fromId)
}

function getChildrenOf(relationships, parentId) {
  return relationships
    .filter((r) => PARENT_TYPES.has(r.type) && r.fromId === parentId)
    .map((r) => r.toId)
}

function getSpouseOf(relationships, personId) {
  const rel = relationships.find(
    (r) => r.type === 'spouse' && (r.fromId === personId || r.toId === personId)
  )
  if (!rel) return null
  return rel.fromId === personId ? rel.toId : rel.fromId
}

// Returns an array of suggested relationships to show in the inference dialog.
// Called with the new relationship BEFORE it has been added to liveData.
// personHint: { personId, personName } — used when the person isn't in liveData yet (new person creation).
export function inferRelationships(newRel, liveData, personHint = null) {
  const { people, relationships } = liveData
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const suggestions = []
  let counter = 0
  const uid = () => `inf_${Date.now()}_${counter++}`

  function getNameHinted(id) {
    if (personHint && id === personHint.personId && personHint.personName) return personHint.personName
    return getName(peopleById, id)
  }

  if (newRel.type === 'sibling' || newRel.type === 'half-sibling') {
    const personAId = newRel.fromId  // the person adding the rel (may be new/not in liveData)
    const personBId = newRel.toId    // the existing sibling

    // Suggest B's parents as parents of A
    for (const parentId of getParentsOf(relationships, personBId)) {
      if (!isParentOf(relationships, parentId, personAId)) {
        suggestions.push({
          id: uid(),
          fromId: parentId,
          toId: personAId,
          type: 'parent-child',
          label: `Add ${getNameHinted(parentId)} as parent of ${getNameHinted(personAId)}`,
          defaultChecked: true,
          typeOptions: ['parent-child', 'adoptive-parent-child', 'step-parent'],
        })
      }
    }

    // Suggest A's existing parents as parents of B (only relevant for existing persons)
    for (const parentId of getParentsOf(relationships, personAId)) {
      if (!isParentOf(relationships, parentId, personBId)) {
        suggestions.push({
          id: uid(),
          fromId: parentId,
          toId: personBId,
          type: 'parent-child',
          label: `Add ${getNameHinted(parentId)} as parent of ${getNameHinted(personBId)}`,
          defaultChecked: true,
          typeOptions: ['parent-child', 'adoptive-parent-child', 'step-parent'],
        })
      }
    }

    // Suggest B's existing siblings as siblings of A
    const bSiblings = relationships
      .filter(
        (r) =>
          (r.type === 'sibling' || r.type === 'half-sibling') &&
          (r.fromId === personBId || r.toId === personBId)
      )
      .map((r) => (r.fromId === personBId ? r.toId : r.fromId))
      .filter((sibId) => sibId !== personAId)

    for (const sibId of bSiblings) {
      if (alreadySiblings(relationships, personAId, sibId)) continue
      suggestions.push({
        id: uid(),
        fromId: personAId,
        toId: sibId,
        type: newRel.type,
        label: `${getNameHinted(personAId)} and ${getNameHinted(sibId)} as ${newRel.type === 'sibling' ? 'siblings' : 'half-siblings'}`,
        defaultChecked: true,
        typeOptions: ['sibling', 'half-sibling'],
      })
    }
  }

  if (PARENT_TYPES.has(newRel.type)) {
    const parentId = newRel.fromId
    const childId = newRel.toId
    const childExistingParents = getParentsOf(relationships, childId)

    // Sibling suggestions: other existing children of this parent
    for (const sibId of getChildrenOf(relationships, parentId)) {
      if (sibId === childId) continue
      if (alreadySiblings(relationships, childId, sibId)) continue

      const sibParents = getParentsOf(relationships, sibId)
      const additionalShared = childExistingParents.filter((pid) => sibParents.includes(pid)).length
      const defaultType = additionalShared > 0 ? 'sibling' : 'half-sibling'

      suggestions.push({
        id: uid(),
        fromId: childId,
        toId: sibId,
        type: defaultType,
        label: `${getNameHinted(childId)} and ${getNameHinted(sibId)} as ${defaultType === 'sibling' ? 'siblings' : 'half-siblings'}`,
        defaultChecked: true,
        typeOptions: ['sibling', 'half-sibling'],
      })
    }

    // Co-parent suggestion: parent's spouse
    const spouseId = getSpouseOf(relationships, parentId)
    if (spouseId && !isParentOf(relationships, spouseId, childId)) {
      suggestions.push({
        id: uid(),
        fromId: spouseId,
        toId: childId,
        type: 'parent-child',
        label: `Add ${getNameHinted(spouseId)} as parent of ${getNameHinted(childId)}`,
        defaultChecked: true,
        typeOptions: ['parent-child', 'adoptive-parent-child', 'step-parent'],
      })
    }
  }

  if (newRel.type === 'spouse') {
    const p1Id = newRel.fromId
    const p2Id = newRel.toId

    for (const childId of getChildrenOf(relationships, p2Id)) {
      if (!isParentOf(relationships, p1Id, childId)) {
        suggestions.push({
          id: uid(),
          fromId: p1Id,
          toId: childId,
          type: 'parent-child',
          label: `Add ${getNameHinted(p1Id)} as parent of ${getNameHinted(childId)}`,
          defaultChecked: false,
          typeOptions: ['parent-child', 'adoptive-parent-child', 'step-parent'],
        })
      }
    }

    for (const childId of getChildrenOf(relationships, p1Id)) {
      if (!isParentOf(relationships, p2Id, childId)) {
        suggestions.push({
          id: uid(),
          fromId: p2Id,
          toId: childId,
          type: 'parent-child',
          label: `Add ${getNameHinted(p2Id)} as parent of ${getNameHinted(childId)}`,
          defaultChecked: false,
          typeOptions: ['parent-child', 'adoptive-parent-child', 'step-parent'],
        })
      }
    }
  }

  return suggestions
}
