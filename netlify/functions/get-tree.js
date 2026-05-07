const jwt = require('jsonwebtoken')

const GITHUB_API = 'https://api.github.com'

function stripPrivateFields(data, role) {
  if (role === 'editor') return data

  const people = data.people.map((person) => {
    const sanitized = { ...person }

    // privateNotes always hidden from viewers
    delete sanitized.privateNotes

    // Strip per-field private flags
    const privateFlags = person.private || {}
    for (const [field, isPrivate] of Object.entries(privateFlags)) {
      if (isPrivate) delete sanitized[field]
    }

    // birthDate on living people is private by default unless explicitly set to false
    if (person.isLiving && privateFlags.birthDate !== false) {
      delete sanitized.birthDate
    }

    return sanitized
  })

  return { ...data, people }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const authHeader = event.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No token provided' }) }
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) }
  }

  const { GITHUB_TOKEN, DATA_REPO_OWNER, DATA_REPO_NAME } = process.env
  const url = `${GITHUB_API}/repos/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/contents/data/family.json`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch family data' }) }
  }

  const { content } = await response.json()
  const data = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'))
  const filtered = stripPrivateFields(data, payload.role)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filtered),
  }
}
