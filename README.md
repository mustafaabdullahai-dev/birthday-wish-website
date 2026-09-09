# 🎂 Celebrate — 3D Interactive Birthday Wishes

An immersive, multisensory 3D birthday celebration platform. Pick a **template**, choose the birthday person, generate a private wish link, and share it — the party starts when they open it: fireworks, floating balloons, confetti rain, a glowing 3D cake with candles you can blow out, a gift that opens into the celebration, a love letter with a personal wish, and gift boxes full of memories.

Built as an open-source web app — everything persists in `localStorage`, with wish links also published to Netlify Blobs so they open on any device.

## ✨ Features

- **Wish links** (`#/celebrate/slug`) — create-a-wish flow with a live phone preview:
  - 10 **templates** with rendered preview thumbnails — each one drives the celebration's *design*, not just its colors (cake shape, balloon palette, fireworks hue)
  - **Emotions** (joyful / heartfelt / funny / inspiring / romantic), cake color, custom message, and wish-link lifespan
  - **Birthday month/day/year** picker (leap-aware) with an "I don't know the birth year" mode that keeps day & month
  - **Family roles** — "I am their X → they are my Y" (18 roles + quick suggestions) shown on the sender badge, letter signature, and exported card
  - **Photos & videos** attached to the link (images downscaled; small videos stored as data URLs, larger ones streamed)
  - **QR code** for the link, plus **share buttons** for WhatsApp / Facebook / X (open a share dialog) and Instagram / Snapchat / Imo (copy the link)
  - **Download the wish as a card**: PNG poster, animated **GIF**, and **video** (WebM), rendered on a canvas
- **Gift opening** — a wiggling gift box opens with a confetti burst into the celebration. When a birthday is set, a **live countdown** (days/hrs/min/sec) ticks above it and flips to "It's today! 🎂"
- **3D celebration scene** (Three.js + React Three Fiber):
  - 💥 Procedural **fireworks** with gravity physics — hue follows the template
  - 🎈 **Balloons** in the template's palette that rise, sway, and **pop on click** (with sound + confetti burst)
  - 🎊 **Confetti shower** of spinning 3D rectangles
  - 🎂 **3D cake** (classic / tiered / square / ring shapes) with candles that flicker, a glowing name, and a rise-from-below entrance — **tap to blow out the candles** (smoke + hiss)
  - 🪩 Shimmering gradient **name display** with a gentle pulse
- **Love meter** — a tap-to-send-love heart button that bursts hearts and fills a meter, with milestones at 10 / 25 / 50 / 100 (then ∞)
- **Synthesized audio** (Web Audio API) — procedural "Happy Birthday" melody + pop, whoosh, hiss, chime, fanfare & tick SFX. No audio files. Mute + volume controls.
- **Love letter reveal** — an envelope that opens into a hand-lettered card with the wish typed word-by-word, name highlighted in gold
- **Gift boxes**:
  - 📸 **Memories** — only shown when photos/videos exist, with **grid ⇄ timeline** views and a lightbox
  - 💬 **Messages** — guest messages and the celebration wish
  - 🎉 **Surprise** — "Reasons I love you" **flip-cards**, a **video reel** of surprise messages, and a photo collage
  - 📖 **Guestbook** — friends can sign wishes and add photos/videos by scanning the QR
- **Zero-dependency content** — the wish generator composes personalized messages and "surprise facts" about a name, a drop-in point for a real LLM API later
- Fully responsive, `prefers-reduced-motion` aware, keyboard accessible

## 🚀 Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev        # dev server → http://localhost:5173
```

Production build & preview:

```bash
npm run build       # type-checks + bundles
npm run preview     # serve the production build
```

Quality gates:

```bash
npm run lint        # Oxlint
npm test            # Vitest (37 unit tests)
npx playwright test # E2E — run `npm run build` first
```

## 🏗️ Architecture

```
src/
├── scenes/                   # Three.js world (React Three Fiber)
│   ├── CelebrationScene.tsx  # Canvas, lights, fog, camera, template->design mapping
│   ├── Cake.tsx              # 3D cake (4 shapes), candles, flames, smoke, icing texture
│   ├── Fireworks.tsx         # rocket particle system (template hue)
│   ├── Balloons.tsx          # rising/pop-able balloons (template palettes)
│   └── Confetti.tsx          # instanced 3D confetti
├── components/               # DOM/UX layer
│   ├── LoginScreen.tsx       # landing: create a wish / open a link / recent wishes
│   ├── CreateWish.tsx        # 4-step builder (who → vibe → memories → preview) + share card
│   ├── CelebrateScreen.tsx   # phase machine (gift → cake → letter → gifts)
│   ├── GiftUnbox.tsx         # tap-to-open gift + live birthday countdown
│   ├── LoveMeter.tsx         # tap-to-send-love heart + love meter
│   ├── NameOverlay.tsx       # shimmer name centerpiece
│   ├── LetterModal.tsx       # envelope + typewriter wish
│   ├── GiftStage.tsx         # gift boxes, memories grid/timeline, reasons, video reel
│   ├── GuestbookModal.tsx    # sign a wish, add photos/videos via QR
│   └── QrCode.tsx            # QR renderer for share card
├── store/useStore.ts         # Zustand store, session TTL, wish links
├── utils/
│   ├── helpers.ts            # 10 theme presets, family roles, birthday/calendar math, wish text
│   ├── cardExporter.ts       # wish-card canvas renderer (PNG / GIF / WebM)
│   └── audioEngine.ts        # Web Audio melody + SFX synthesizer
└── types.ts
```

### Experience flow

```
Create a wish link (template + roles + birthday + photos/videos)
   → Share via QR, social apps, or download as PNG/GIF/video
   → Recipient opens link →
   → Birthday countdown + tap the gift box (confetti burst)
   → Fireworks + music + name display (template-styled cake/balloons/fireworks)
   → "Tap the cake to blow out the candles!" → smoke + hiss
   → Love-letter envelope → typewriter wish
   → Gift boxes → memories / messages / surprise (flip-cards + video reel)
   → Send love ❤️ anytime with the love meter
```

### Data & persistence

| Key | Purpose | Storage |
|---|---|---|
| `bday_session` | user + 24h expiry | `localStorage` |
| `bday_wishLinks` | wish links + memories | `localStorage` + Netlify Blobs |

Every wish link is saved locally **and** published to a small Netlify Function (`netlify/functions/wish.mjs`, `GET/POST /api/wish`) backed by Netlify's Blob store, so the link works on *any* device. If the POST fails (offline / local `vite dev` without functions), the wish still works in the creator's own browser.

Photos are downscaled to ≤1400px before saving; videos ≤1.2MB are stored as data URLs and larger ones stream from a blob URL (kept out of persistence). There is no login — the link itself is the identity, so no per-user accounts or real backend are needed.

## 🔌 Wiring a real AI wish API

`src/utils/helpers.ts` exports `generateWish(name, emotion)` — replace its body with a call to any provider (e.g. Anthropic's Claude), keeping the same signature. The letter, messages box, and preview are fully decoupled from message generation.

## 🧭 Roadmap ideas

- Backend (Node + Postgres + S3) for durable memories & real auth
- Voice commands ("blow out the candles") via Web Speech API
- Email reminders and multi-user real-time celebrations
- More cake/balloon/fireworks design engines and gamification badges

## 📄 License

MIT — contributions welcome.