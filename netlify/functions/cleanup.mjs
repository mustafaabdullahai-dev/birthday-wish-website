import { getStore } from '@netlify/blobs'

const store = getStore({ name: 'wishes' })

export default async () => {
  const now = Date.now()
  let removed = 0
  let scanned = 0

  const opts = { paginate: true }
  for await (const page of store.list(opts)) {
    for (const item of page.blobs) {
      scanned += 1
      const wish = await store.get(item.key, { type: 'json' }).catch(() => null)
      if (wish && typeof wish.expiresAt === 'string') {
        const expiry = new Date(wish.expiresAt).getTime()
        if (Number.isFinite(expiry) && expiry < now) {
          await store.delete(item.key).catch(() => null)
          removed += 1
        }
      }
    }
  }

  return Response.json({ ok: true, scanned, removed, at: new Date().toISOString() })
}

export const config = { schedule: '@daily' }