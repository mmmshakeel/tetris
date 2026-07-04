# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A browser-based Tetris game with a 3D-block look, built to run as an installable **PWA** so it can be used on mobile without a native app. No backend is required — the game runs entirely client-side.

## Stack

- **React 19** + TypeScript, function components with hooks
- **Vite 6** (dev server + build), alias `@/*` → repo root
- **Tailwind CSS v4** via `@tailwindcss/vite` (config lives in CSS, not `tailwind.config.js`)
- **lucide-react** for icons, **motion** for animation
- Type-check only (`noEmit`); Vite handles the actual build

## Commands

```bash
npm install          # install deps
npm run dev          # dev server on 0.0.0.0:3000 (LAN-accessible for mobile testing)
npm run build        # production build to dist/
npm run preview      # serve the production build locally
npm run lint         # tsc --noEmit type check
npm run clean        # remove dist/
```

Test PWA behavior against `npm run build` + `npm run preview` (or the LAN dev URL over HTTPS), not the raw dev server — service worker + install prompts need a production-like context.

## Layout

```
index.html              # entry; registers /sw.js, PWA meta tags, manifest link
src/main.tsx            # React root
src/App.tsx             # top-level UI: controls, score, next-piece preview, sound toggles
src/components/Tetris.tsx   # board rendering
src/game/TetrisEngine.ts    # core game logic + GameState (the source of truth)
src/game/constants.ts       # piece shapes, COLORS / LIGHT_COLORS / DARK_COLORS (3D bevel)
src/game/SoundManager.ts    # sound + music
public/manifest.json    # PWA manifest
public/sw.js            # service worker (cache-first)
```

Game state flows out of `TetrisEngine` via a state-change callback into `App.tsx`; UI actions call methods on the engine ref (`move`, `rotate`, `drop`, `hardDrop`, `togglePause`, `reset`).

## PWA notes / known gaps

The PWA scaffolding exists but has rough edges — fix these as PWA work continues:

- **`public/sw.js` caches dev paths** (`/src/main.tsx`, `/src/App.tsx`, `/src/index.css`). These don't exist in a production build — Vite emits hashed `dist/assets/*`. The cache list needs to match built output (or use a build-time SW / `vite-plugin-pwa`) for real offline support.
- **Icons are remote** (`picsum.photos`) in both `manifest.json` and the apple-touch-icon. A true installable/offline PWA needs local icons bundled in `public/` (192px + 512px, maskable).
- Bump `CACHE_NAME` in `sw.js` when cached assets change, or clients keep stale files.
- Manifest is locked to `portrait`, `standalone` display, theme `#09090b`.

## Cleanup context

Scaffolded from an AI Studio template. Unused deps still in `package.json`: `express`, `better-sqlite3`, `@google/genai`, `dotenv`. There is no server or Gemini integration in the game — ignore the README's Gemini/AI Studio instructions and the `GEMINI_API_KEY` define in `vite.config.ts` unless asked to add such a feature.

## Conventions

- Match existing style: 2-space indent, single quotes, function components.
- Keep game logic in `src/game/`; keep React/UI concerns in `src/components/` and `App.tsx`.
- After changes, run `npm run lint` to catch type errors.
