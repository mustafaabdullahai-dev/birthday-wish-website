import { getStore } from '@netlify/blobs'

const store = getStore({ name: 'wishes' })

const MAX_WISH_BYTES = Number(process.env.CELEBRATE_MAX_WISH_BYTES) || 300_000
const MAX_MEMORIES = Number(process.env.CELEBRATE_MAX_MEMORIES) || 25
const MAX_GUESTBOOK = Number(process.env.CELEBRATE_MAX_GUESTBOOK) || 50
const MAX_RATE_PER_HOUR = Number(process.env.CELEBRATE_MAX_WRITES_PER_HOUR) || 5

const rateMap = new Map()

function checkRate(ip) {
  const now = Date.now()
  const WINDOW = 60 * 60 * 1000
  const entry = rateMap.get(ip)
  if (!entry || now - entry.start > WINDOW) {
    rateMap.set(ip, { start: now, count: 1 })
    return true
  }
  entry.count += 1
  return entry.count <= MAX_RATE_PER_HOUR
}

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-nf-client-connection-ip') || 'unknown'
}

function isValidWish(wish) {
  if (!wish || typeof wish !== 'object') return false
  if (typeof wish.slug !== 'string' || !wish.slug) return false
  if (typeof wish.forName !== 'string' || !wish.forName.trim()) return false
  if (wish.memories && (!Array.isArray(wish.memories) || wish.memories.length > MAX_MEMORIES)) return false
  if (wish.message && typeof wish.message !== 'string') return false
  if (wish.cakeColor && typeof wish.cakeColor !== 'string') return false
  return true
}

async function readWish(slug) {
  try {
    const wish = await store.get(slug, { type: 'json' })
    return wish || null
  } catch {
    return null
  }
}

function isExpired(wish) {
  return !!wish.expiresAt && new Date(wish.expiresAt).getTime() < Date.now()
}

async function handlePost(req, ip) {
  let body
  try {
    body = await req.text()
  } catch {
    return Response.json({ error: 'read failed' }, { status: 400 })
  }
  if (body.length > MAX_WISH_BYTES) {
    return Response.json({ error: 'payload too large' }, { status: 413 })
  }
  let wish
  try {
    wish = JSON.parse(body)
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }
  if (!isValidWish(wish)) {
    return Response.json({ error: 'invalid wish data' }, { status: 400 })
  }
  if (!checkRate(ip)) {
    return Response.json({ error: 'Too many wishes created. Please try again later.' }, { status: 429 })
  }
  const existing = await readWish(wish.slug)
  await store.setJSON(wish.slug, { ...existing, ...wish })
  return Response.json(wish)
}

async function handleGet(req, url) {
  const slug = url.searchParams.get('slug')
  if (!slug) return Response.json({ error: 'missing slug' }, { status: 400 })

  const path = url.pathname
  if (path.endsWith('/guestbook')) {
    const wish = await readWish(slug)
    if (!wish) return Response.json({ error: 'wish not found', notFound: true }, { status: 404 })
    return Response.json({ entries: wish.guestbook || [] })
  }

  const wish = await readWish(slug)
  if (!wish) return Response.json({ error: 'wish not found', notFound: true }, { status: 404 })
  if (isExpired(wish)) return Response.json({ error: 'wish expired', expired: true }, { status: 410 })
  return Response.json(wish)
}

async function handlePostGuestbook(req, url) {
  const slug = url.searchParams.get('slug')
  if (!slug) return Response.json({ error: 'missing slug' }, { status: 400 })
  const wish = await readWish(slug)
  if (!wish) return Response.json({ error: 'wish not found', notFound: true }, { status: 404 })
  if (isExpired(wish)) return Response.json({ error: 'wish expired', expired: true }, { status: 410 })

  let body
  try {
    body = await req.text()
  } catch {
    return Response.json({ error: 'read failed' }, { status: 400 })
  }
  if (body.length > 20_000) return Response.json({ error: 'entry too large' }, { status: 413 })
  let entry
  try {
    entry = JSON.parse(body)
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }
  if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || typeof entry.message !== 'string' || !entry.message.trim()) {
    return Response.json({ error: 'name and message are required' }, { status: 400 })
  }
  if (entry.photo && typeof entry.photo !== 'string') {
    return Response.json({ error: 'invalid photo' }, { status: 400 })
  }
  const entries = wish.guestbook || []
  if (entries.length >= MAX_GUESTBOOK) {
    return Response.json({ error: 'guestbook is full' }, { status: 400 })
  }
  const newEntry = {
    id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name: entry.name.slice(0, 40),
    message: entry.message.slice(0, 500),
    photo: entry.photo,
    createdAt: new Date().toISOString(),
  }
  await store.setJSON(wish.slug, { ...wish, guestbook: [...entries, newEntry] })
  return Response.json(newEntry)
}

export default async (req, context) => {
  const ip = clientIp(req)
  const url = new URL(req.url)

  if (req.method === 'POST') {
    if (url.pathname.endsWith('/guestbook')) return handlePostGuestbook(req, url)
    return handlePost(req, ip)
  }

  if (req.method === 'GET') {
    return handleGet(req, url)
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  return Response.json({ error: 'method not allowed' }, { status: 405 })
}

export const config = { path: '/api/wish*' }
