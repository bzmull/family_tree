import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Inline schema validation (no TS/zod import issues in plain Node)
// Mirrors the constraints in src/data/schema.js
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const VALID_RELATIONSHIP_TYPES = new Set([
  'parent-child', 'adoptive-parent-child', 'step-parent',
  'spouse', 'half-sibling', 'sibling',
])
const VALID_GENDERS = new Set(['male', 'female', 'other'])

function fail(msg) {
  console.error(`  ✗ ${msg}`)
  return false
}

function validate(data) {
  let ok = true

  // Top-level structure
  if (!data.version) ok = fail('Missing version')
  if (!Array.isArray(data.branches) || data.branches.length === 0) ok = fail('branches must be a non-empty array')
  if (!Array.isArray(data.people)) ok = fail('people must be an array')
  if (!Array.isArray(data.relationships)) ok = fail('relationships must be an array')

  if (!ok) return false

  // Branches
  const branchIds = new Set()
  for (const b of data.branches) {
    if (!b.id) ok = fail(`Branch missing id`)
    if (!b.label) ok = fail(`Branch ${b.id}: missing label`)
    if (!HEX_COLOR.test(b.color)) ok = fail(`Branch ${b.id}: invalid color "${b.color}"`)
    if (branchIds.has(b.id)) ok = fail(`Duplicate branch id: ${b.id}`)
    branchIds.add(b.id)
  }

  // People
  const personIds = new Set()
  for (const p of data.people) {
    if (!p.id) ok = fail('Person missing id')
    if (!p.firstName) ok = fail(`Person ${p.id}: missing firstName`)
    if (!p.lastName) ok = fail(`Person ${p.id}: missing lastName`)
    if (!Array.isArray(p.branches) || p.branches.length === 0) ok = fail(`Person ${p.id}: branches must be a non-empty array`)
    if (p.gender && !VALID_GENDERS.has(p.gender)) ok = fail(`Person ${p.id}: invalid gender "${p.gender}"`)
    if (p.birthDate && !ISO_DATE.test(p.birthDate)) ok = fail(`Person ${p.id}: birthDate must be YYYY-MM-DD`)
    if (p.deathDate && !ISO_DATE.test(p.deathDate)) ok = fail(`Person ${p.id}: deathDate must be YYYY-MM-DD`)
    if (personIds.has(p.id)) ok = fail(`Duplicate person id: ${p.id}`)
    personIds.add(p.id)

    for (const bid of (p.branches || [])) {
      if (!branchIds.has(bid)) ok = fail(`Person ${p.id}: unknown branch "${bid}"`)
    }
  }

  // Relationships
  const relIds = new Set()
  for (const r of data.relationships) {
    if (!r.id) ok = fail('Relationship missing id')
    if (!VALID_RELATIONSHIP_TYPES.has(r.type)) ok = fail(`Relationship ${r.id}: invalid type "${r.type}"`)
    if (!personIds.has(r.fromId)) ok = fail(`Relationship ${r.id}: fromId "${r.fromId}" not found`)
    if (!personIds.has(r.toId)) ok = fail(`Relationship ${r.id}: toId "${r.toId}" not found`)
    if (r.sharedParentId && !personIds.has(r.sharedParentId)) ok = fail(`Relationship ${r.id}: sharedParentId "${r.sharedParentId}" not found`)
    if (r.marriageDate && !ISO_DATE.test(r.marriageDate)) ok = fail(`Relationship ${r.id}: marriageDate must be YYYY-MM-DD`)
    if (r.divorceDate && !ISO_DATE.test(r.divorceDate)) ok = fail(`Relationship ${r.id}: divorceDate must be YYYY-MM-DD`)
    if (relIds.has(r.id)) ok = fail(`Duplicate relationship id: ${r.id}`)
    relIds.add(r.id)
  }

  return ok
}

const filePath = join(__dirname, '..', 'data', 'sample.json')
console.log(`Validating ${filePath}...`)

let data
try {
  data = JSON.parse(readFileSync(filePath, 'utf-8'))
} catch (e) {
  console.error(`Failed to parse JSON: ${e.message}`)
  process.exit(1)
}

const ok = validate(data)
if (ok) {
  console.log(`  ✓ sample.json is valid (${data.people.length} people, ${data.relationships.length} relationships)`)
  process.exit(0)
} else {
  console.error('Validation failed.')
  process.exit(1)
}
