import { getStore } from '@netlify/blobs'

const store = getStore({ name: 'wishes' })

function escapeXml(s = '') {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))
}

function buildCard(name, fromName, theme) {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#2a1440"/>
      <stop offset="100%" stop-color="#0c0a1e"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.primary}"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="${theme.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-style="italic" fill="${theme.glow}">A celebration for</text>
  <text x="600" y="300" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="120" fill="url(#gold)">${escapeXml(name)}</text>
  <text x="600" y="390" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#e8e4ff">🎂 🎆 ✨</text>
  ${fromName ? `<text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" fill="#a99fd0">with love from ${escapeXml(fromName)}</text>` : ''}
  <text x="600" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#ffd700">Celebrate — 3D Birthday Wishes</text>
</svg>`
}

export default async (req, context) => {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  const fallbackName = url.searchParams.get('name')
  const fallbackFrom = url.searchParams.get('from')

  let name = fallbackName || 'You'
  let fromName = fallbackFrom || ''
  let theme = { primary: '#FFD700', secondary: '#FF69B4', glow: '#fff3b0' }

  if (slug) {
    const wish = await store.get(slug, { type: 'json' }).catch(() => null)
    if (wish) {
      name = wish.forName || name
      fromName = wish.fromName || ''
      const presets = {
        'classic-gold': { primary: '#FFD700', secondary: '#FF69B4', glow: '#fff3b0' },
        'pastel-dream': { primary: '#FFB6C1', secondary: '#B19CD9', glow: '#ffe9f0' },
        'midnight-neon': { primary: '#FF1493', secondary: '#00FFFF', glow: '#ffb3e0' },
      }
      theme = presets[wish.themePreset] || theme
    }
  }

  const svg = buildCard(name, fromName, theme)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

export const config = { path: '/api/og-image' }
