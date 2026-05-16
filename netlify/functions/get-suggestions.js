const jwt = require('jsonwebtoken')

const GITHUB_API = 'https://api.github.com'
const FILE_PATH = 'data/suggestions.json'

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'No token' }) }

  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET) }
  catch { return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) } }

  if (payload.role !== 'editor') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Editor access required' }) }
  }

  const { GITHUB_TOKEN, DATA_REPO_OWNER, DATA_REPO_NAME } = process.env
  const url = `${GITHUB_API}/repos/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/contents/${FILE_PATH}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  })

  if (res.status === 404) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions: [], pendingCount: 0 }),
    }
  }

  if (!res.ok) return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch suggestions' }) }

  const { content } = await res.json()
  const data = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'))
  const pendingCount = data.suggestions.filter((s) => s.status === 'pending').length

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestions: data.suggestions, pendingCount }),
  }
}
