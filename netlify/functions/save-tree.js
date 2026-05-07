const jwt = require('jsonwebtoken')

const GITHUB_API = 'https://api.github.com'

async function getFileSha(owner, repo, path, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.sha
}

async function commitFile(owner, repo, path, content, sha, message, token) {
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
  }
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

  return res
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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

  if (payload.role !== 'editor') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Editor access required' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { data } = body
  if (!data) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No data provided' }) }
  }

  const { GITHUB_TOKEN, DATA_REPO_OWNER, DATA_REPO_NAME } = process.env
  const filePath = 'data/family.json'

  const updatedData = {
    ...data,
    lastModified: new Date().toISOString(),
  }
  const content = JSON.stringify(updatedData, null, 2)

  // Fetch current SHA — required by GitHub API to update an existing file
  let sha = await getFileSha(DATA_REPO_OWNER, DATA_REPO_NAME, filePath, GITHUB_TOKEN)

  let res = await commitFile(
    DATA_REPO_OWNER,
    DATA_REPO_NAME,
    filePath,
    content,
    sha,
    'Update family data via web editor',
    GITHUB_TOKEN
  )

  // Handle SHA conflict from concurrent edits: fetch latest SHA and retry once
  if (res.status === 409) {
    sha = await getFileSha(DATA_REPO_OWNER, DATA_REPO_NAME, filePath, GITHUB_TOKEN)
    res = await commitFile(
      DATA_REPO_OWNER,
      DATA_REPO_NAME,
      filePath,
      content,
      sha,
      'Update family data via web editor',
      GITHUB_TOKEN
    )
  }

  if (!res.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to save family data' }) }
  }

  const json = await res.json()

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      commitUrl: json.commit?.html_url,
    }),
  }
}
