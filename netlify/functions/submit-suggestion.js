const jwt = require('jsonwebtoken')

const GITHUB_API = 'https://api.github.com'
const FILE_PATH = 'data/suggestions.json'

async function getFile(owner, repo, path, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  })
  if (res.status === 404) return { content: null, sha: null }
  if (!res.ok) return null
  const json = await res.json()
  return { content: JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8')), sha: json.sha }
}

async function commitFile(owner, repo, path, content, sha, message, token) {
  const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64') }
  if (sha) body.sha = sha
  return fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET) }
  catch { return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) } }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { personId, personSnapshot, proposedData, submitterName } = body
  if (!personId || !proposedData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'personId and proposedData required' }) }
  }

  const { GITHUB_TOKEN, DATA_REPO_OWNER, DATA_REPO_NAME } = process.env

  const file = await getFile(DATA_REPO_OWNER, DATA_REPO_NAME, FILE_PATH, GITHUB_TOKEN)
  if (file === null) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to read suggestions' }) }

  const existing = file.content ?? { suggestions: [] }
  const id = `sugg_${Date.now()}`
  existing.suggestions.push({
    id,
    personId,
    personSnapshot: personSnapshot ?? null,
    proposedData,
    submitterName: submitterName?.trim() || null,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    respondedAt: null,
    rejectionNote: null,
  })

  let res = await commitFile(DATA_REPO_OWNER, DATA_REPO_NAME, FILE_PATH, existing, file.sha, 'Add suggestion', GITHUB_TOKEN)

  if (res.status === 409) {
    const retry = await getFile(DATA_REPO_OWNER, DATA_REPO_NAME, FILE_PATH, GITHUB_TOKEN)
    if (retry) res = await commitFile(DATA_REPO_OWNER, DATA_REPO_NAME, FILE_PATH, existing, retry.sha, 'Add suggestion', GITHUB_TOKEN)
  }

  if (!res.ok) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to save suggestion' }) }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, id }),
  }
}
