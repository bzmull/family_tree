const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { password } = body
  if (!password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Password required' }) }
  }

  const { VIEW_PASSWORD_HASH, EDIT_PASSWORD_HASH, JWT_SECRET } = process.env

  let role = null
  if (EDIT_PASSWORD_HASH && await bcrypt.compare(password, EDIT_PASSWORD_HASH)) {
    role = 'editor'
  } else if (VIEW_PASSWORD_HASH && await bcrypt.compare(password, VIEW_PASSWORD_HASH)) {
    role = 'viewer'
  }

  if (!role) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid password' }) }
  }

  const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '8h' })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, role }),
  }
}
