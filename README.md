# EchoCart — Voice Command Shopping Assistant

EchoCart is a local‑first, browser‑based shopping assistant that lets you build and manage lists with your voice. It works offline, uses the Web Speech API for voice input/output, does client‑side product search with lightweight NLP, and syncs lists to Firestore when available. AI is used for intent parsing and smart suggestions when configured; everything degrades gracefully without it.

• Deliverables: see `DELIVERABLES.md`  • Approach: see `APPROACH.md`

## Tech stack

- React + Vite
- Tailwind CSS
- Web Speech API (SpeechRecognition, speechSynthesis)
- Firebase: Auth (anonymous), Firestore, Firebase AI (Gemini via `@firebase/ai`)
- ESLint, PostCSS

## Features

- Voice commands: add/remove/search items hands‑free
- Product search with filters (brand, size, price caps/ranges, organic)
- Smart suggestions (history, seasonality, substitutes; optional AI‑assisted)
- Local‑first persistence with cloud snapshots (debounced) and hydration
- Accessible UI: Voice HUD, status toasts, mic‑permission banner, keyboard parity

## Getting started

Prerequisites:
- Node 18+ and npm
- Firebase project with Firestore and Firebase AI enabled (for cloud/AI features)

1) Install deps
```bash
npm install
```

2) Environment variables (.env)

Vite is configured to expose both VITE_ and FIREBASE_ prefixes. Create a `.env` file in the project root:
```
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_MEASUREMENT_ID=...
```

3) Run the app (HTTPS recommended for mic):
```bash
npm run dev
```

If your local dev server isn’t HTTPS, microphone may be blocked by the browser. Use HTTPS (e.g., `vite --https`) or a dev tunnel.

## Using the app

- Click the mic button (bottom‑right) and grant microphone permission.
- Speak commands like:
	- “Add two apples”
	- “Remove milk”
	- “Find organic rice under 200 rupees”
	- “Suggest alternatives to eggs”
- Add products from the search results list.
- Mark items bought, adjust quantities, or delete from the list.
- “New List” archives your current list locally (and to Firestore if enabled) and starts a fresh one.

## Build and deploy (Firebase Hosting)

```bash
npm run build
firebase deploy
```

`firebase.json` is set to serve from `dist` with SPA rewrites. After deploying, update the live URL in `DELIVERABLES.md`.

## Configuration notes

- Env prefix: `vite.config.js` allows `FIREBASE_` so you don’t need `VITE_` for Firebase keys.
- AI parsing and suggestions: if Gemini is not configured/available, the app falls back to heuristic parsing and local suggestions.
- Firestore writes are debounced (~800ms) and best‑effort; failures don’t affect local usage.

## Troubleshooting

- Microphone not working: ensure HTTPS and that the browser has mic permission.
- Speech not supported: some browsers/devices lack `SpeechRecognition`; the UI will inform you.
- Empty search results: try removing filters like brand/size/price; dataset is local and small by design.

## Links

- Deliverables: `DELIVERABLES.md`
- Architecture/Approach: `APPROACH.md`
- Key files: `src/App.jsx`, `src/hooks/*`, `src/utils/*`, `src/components/*`

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
