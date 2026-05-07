import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const dateString = z.string().regex(ISO_DATE, 'Must be YYYY-MM-DD').nullable()

export const BranchSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
})

export const PersonSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  maidenName: z.string().nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: dateString.optional(),
  birthPlace: z.string().optional(),
  deathDate: dateString.optional(),
  isLiving: z.boolean().optional(),
  bio: z.string().optional(),
  occupation: z.string().optional(),
  branches: z.array(z.string()).min(1),
  private: z.record(z.string(), z.boolean()).optional().default({}),
  privateNotes: z.string().optional().default(''),
  customFields: z.record(z.string(), z.string()).optional().default({}),
})

const RELATIONSHIP_TYPES = [
  'parent-child',
  'adoptive-parent-child',
  'step-parent',
  'spouse',
  'half-sibling',
  'sibling',
]

export const RelationshipSchema = z.object({
  id: z.string().min(1),
  type: z.enum(RELATIONSHIP_TYPES),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  marriageDate: dateString.optional(),
  divorceDate: dateString.optional(),
  isCurrentSpouse: z.boolean().optional(),
  sharedParentId: z.string().optional(),
})

export const FamilyDataSchema = z.object({
  version: z.string(),
  lastModified: z.string(),
  branches: z.array(BranchSchema),
  people: z.array(PersonSchema),
  relationships: z.array(RelationshipSchema),
})

export function validateReferentialIntegrity(data) {
  const errors = []
  const personIds = new Set(data.people.map((p) => p.id))
  const branchIds = new Set(data.branches.map((b) => b.id))

  // Check all relationship person references exist
  for (const rel of data.relationships) {
    if (!personIds.has(rel.fromId)) {
      errors.push(`Relationship ${rel.id}: fromId "${rel.fromId}" does not match any person`)
    }
    if (!personIds.has(rel.toId)) {
      errors.push(`Relationship ${rel.id}: toId "${rel.toId}" does not match any person`)
    }
    if (rel.sharedParentId && !personIds.has(rel.sharedParentId)) {
      errors.push(`Relationship ${rel.id}: sharedParentId "${rel.sharedParentId}" does not match any person`)
    }
  }

  // Check all person branch references exist
  for (const person of data.people) {
    for (const branchId of person.branches) {
      if (!branchIds.has(branchId)) {
        errors.push(`Person ${person.id}: branch "${branchId}" does not match any defined branch`)
      }
    }
  }

  // Check for duplicate IDs
  const relIds = data.relationships.map((r) => r.id)
  const dupRelIds = relIds.filter((id, i) => relIds.indexOf(id) !== i)
  if (dupRelIds.length > 0) {
    errors.push(`Duplicate relationship IDs: ${dupRelIds.join(', ')}`)
  }

  const dupPersonIds = [...personIds].filter((id, i) => [...personIds].indexOf(id) !== i)
  if (dupPersonIds.length > 0) {
    errors.push(`Duplicate person IDs: ${dupPersonIds.join(', ')}`)
  }

  return errors
}
