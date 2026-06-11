import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { Env } from '../types.js'

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_SECRET

  if (!secret) {
    console.error('JWT_SECRET is not configured')
    return c.json({ error: 'Internal Server Error: JWT configuration missing' }, 500)
  }

  try {
    const payload = await verify(token, secret, 'HS256')
    if (!payload || typeof payload.userId !== 'string') {
      return c.json({ error: 'Unauthorized: Invalid token payload' }, 401)
    }

    c.set('userId', payload.userId)
    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401)
  }
})
