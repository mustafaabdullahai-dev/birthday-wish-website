import { getStore } from '@netlify/blobs'

const store = getStore({ name: 'wishes' })

export default async (req, context) => {
  if (req.method === 'POST') {
    let wish
    try {
      wish = await req.json()
    } catch {
      return Response.json({ error: 'invalid JSON' }, { status: 400 })
    }
    if (!wish || typeof wish.slug !== 'string' || !wish.slug) {
      return Response.json({ error: 'missing slug' }, { status: 400 })
    }
    await store.setJSON(wish.slug, wish)
    return Response.json(wish)
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return Response.json({ error: 'missing slug' }, { status: 400 })
  }
  const wish = await store.get(slug, { type: 'json' })
  if (!wish) {
    return Response.json({ error: 'wish not found', notFound: true }, { status: 404 })
  }
  return Response.json(wish)
}

export const config = { path: '/api/wish' }