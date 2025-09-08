import { describe, it, expect } from 'vitest'
import fetch from 'node-fetch'

describe('test-credentials route', () => {
  it('returns 401 for missing body', async () => {
    const res = await fetch('http://localhost:3000/api/auth/test-credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    expect(res.status).toBe(400)
  })
})
