# 🎂 Celebrate — 3D Interactive Birthday Wishes

An immersive, multisensory 3D birthday celebration platform. Enter a name (yes, **your name is the password**), and the party starts: fireworks, floating balloons, confetti rain, a glowing 3D cake with candles you can blow out, a love letter with a personal wish, and gift boxes full of memories.

Built as an open-source web app — no backend required to run, everything persists in `localStorage`.

## ✨ Features

- **Name-based auth** — the birthday person's name *is* their password. Case-insensitive, auto-trimmed, 24-hour session persistence.
- **3D celebration scene** (Three.js + React Three Fiber):
  - 💥 Procedural **fireworks** with gravity physics (they re-launch forever)
  - 🎈 **Balloons** that rise, sway, and **pop on click** (with sound + confetti burst)
  - 🎊 **Confetti shower** of spinning 3D rectangles
  - 🎂 **3D cake** with candles that flicker, a glowing name on the front, and a rise-from-below entrance — **tap the cake to blow out the candles** (smoke + hiss)
  - 🪩 Shimmering gradient **name display** with a gentle pulse
- **Synthesized audio** (Web Audio API) — a procedural "Happy Birthday" melody loop plus pop, whoosh, hiss, chime, fanfare & tick SFX. No audio files needed. Mute + volume controls included.
- **Love letter reveal** — an envelope that opens into a hand-lettered card, with the wish typed word-by-word and the recipient's name highlighted in gold.
- **Three gift boxes**: memories gallery (with lightbox), messages, and a grand surprise collage.
- **Create-a-wish links**: pick a name, an emotion (joyful / heartfelt / funny / inspiring / romantic), a cake color, a custom message, and attach photos. Get a unique shareable URL (`#/celebrate/slug`). When the birthday person opens it, they see the sender's badge, custom wish, and memory boxes.
- **Zero-dependency content**: the wish generator composes personalized messages and fun "surprise facts" about the name — a drop-in `services` point for a real LLM API later.
- Fully responsive, `prefers-reduced-motion` aware, keyboard accessible.

## 🚀 Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev        # start dev server → http://localhost:5173
```

Production build & preview:

```bash
npm run build       # type-checks + bundles (three.js lazy-loaded)
npm run preview     # serve the production build
```

`npm run lint` runs Oxlint.

## 🧪 What was verified

Automated headless-Chrome checks confirmed these flows run with **zero console errors**:

1. Login → enter name → celebration scene with WebGL canvas.
2. Tap cake → candles blow out → envelope → letter typewriter → gift stage.
3. Gift box opens (memories / messages / surprise).
4. Create-wish form → generate link → open the link in a fresh tab → themed celebration with sender badge + custom wish.

## 🏗️ Architecture

```
src/
├── scenes/           # Three.js world (R3F)
│   ├── CelebrationScene.tsx   # Canvas, lights, fog, camera
│   ├── Cake.tsx               # 3D cake, candles, flames, smoke, icing texture
│   ├── Fireworks.tsx          # rocket particle system
│   ├── Balloons.tsx           # rising/pop-able balloons
│   └── Confetti.tsx           # instanced 3D confetti
├── components/       # DOM/UX layer
│   ├── LoginScreen.tsx        # name = password
│   ├── CelebrateScreen.tsx    # phase machine (intro → cake → letter → gifts)
│   ├── NameOverlay.tsx        # shimmer name centerpiece
│   ├── LetterModal.tsx        # envelope + typewriter wish
│   ├── GiftStage.tsx          # 3 gift boxes + memory gallery
│   └── CreateWish.tsx         # shareable link builder
├── store/useStore.ts          # Zustand store, session TTL, wish links
├── utils/
│   ├── helpers.ts             # name-hash palettes, wish templates, fun facts
│   └── audioEngine.ts         # Web Audio melody + SFX synthesizer
└── types.ts
```

### Experience flow

```
Login (enter name)
  → Fireworks + music + name display (the WOW moment)
  → Cake rises from below (2s)
  → "Tap the cake to blow out the candles!" → smoke + hiss
  → Love-letter envelope → typewriter wish
  → Three gift boxes → memories / messages / surprise
```

### Data & persistence (no server needed)

| Key | Purpose | Storage |
|---|---|---|
| `bday_session` | user + 24h expiry | `localStorage` |
| `bday_wishLinks` | wish links + memories | `localStorage` |

Photos uploaded to a wish link are stored as compressed data-URLs (capped for quota). For real multi-user sharing you'd move this to a backend (see below).

## 🔌 Wiring a real AI wish API

`src/utils/helpers.ts` exports `generateWish(name, emotion)` — replace its body with a call to any provider (e.g. Anthropic's Claude), keeping the same signature. The UI (letter + messages box) is fully decoupled from message generation.

## 🧭 Roadmap ideas (from the master spec)

- Backend (Node + Postgres + S3) for durable memories & real auth
- WebXR **AR mode** (place the cake in your room)
- Voice commands ("blow out the candles") via Web Speech API
- QR codes on wish links, email reminders, multi-user real-time celebrations
- Custom cake builder, theme presets (cyberpunk, nature, luxury…), gamification badges

## 📄 License

MIT — contributions welcome.