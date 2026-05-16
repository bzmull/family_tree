const jwt = require('jsonwebtoken')

const GITHUB_API = 'https://api.github.com'
const SUGGESTIONS_PATH = 'data/suggestions.json'
const FAMILY_PATH = 'data/family.json'

async function getFile(owner, repo, path, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  })
  if (!res.ok) return null
  const json = await res.json()
  return { content: JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8')), sha: json.sha }
}

async function commitFile(owner, repo, path, content, sha, message, token) {
  const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64') }
  if (sha) body.sha = sha
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (res.status === 409) return { conflict: true }
  return { ok: res.ok }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET) }
  catch { return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) } }

  if (payload.role !== 'editor') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Editor access required' }) }
  }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { suggestionId, action, rejectionNote } = body
  if (!suggestionId || !['approve', 'reject'].includes(action)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'suggestionId and action (approve|reject) required' }) }
  }

  const { GITHUB_TOKEN, DATA_REPO_OWNER, DATA_REPO_NAME } = process.env

  const suggestionsFile = await getFile(DATA_REPO_OWNER, DATA_REPO_NAME, SUGGESTIONS_PATH, GITHUB_TOKEN)
  if (!suggestionsFile) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to read suggestions' }) }

  const suggestion = suggestionsFile.content.suggestions.find((s) => s.id === suggestionId)
  if (!suggestion) return { statusCode: 404, body: JSON.stringify({ error: 'Suggestion not found' }) }
  if (suggestion.status !== 'pending') {
    return { statusCode: 409, body: JSON.stringify({ error: 'Suggestion already resolved' }) }
  }

  if (action === 'approve') {
    const familyFile = await getFile(DATA_REPO_OWNER, DATA_REPO_NAME, FAMILY_PATH, GITHUB_TOKEN)
    if (!familyFile) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to read family data' }) }

    familyFile.content.people = familyFile.content.people.map((p) =>
      p.id === suggestion.personId ? { ...suggestion.proposedData, id: p.id } : p
    )
    familyFile.content.lastModified = new Date().toISOString()

    const familyResult = await commitFile(
      DATA_REPO_OWNER, DATA_REPO_NAME, FAMILY_PATH,
      familyFile.content, familyFile.sha,
      `Apply suggestion: ${suggestion.submitterName ?? 'viewer'} edit of ${suggestion.personId}`,
      GITHUB_TOKEN
    )
    if (!familyResult.ok) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to update family data' }) }
  }

  suggestion.status = action === 'approve' ? 'approved' : 'rejected'
  suggestion.respondedAt = new Date().toISOString()
  suggestion.rejectionNote = rejectionNote?.trim() || null

  const suggestionsResult = await commitFile(
    DATA_REPO_OWNER, DATA_REPO_NAME, SUGGESTIONS_PATH,
    suggestionsFile.content, suggestionsFile.sha,
    `${action === 'approve' ? 'Approve' : 'Reject'} suggestion ${suggestionId}`,
    GITHUB_TOKEN
  )
  if (!suggestionsResult.ok) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to update suggestion status' }) }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  }
}
