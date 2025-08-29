# EchoCart

Voice-powered shopping list assistant you can run in the browser, with optional cloud features for sync and suggestions. This README guides a beginner from zero to a hosted MVP in about 8 hours.

## Overview

- Core idea: Speak commands like “add milk”, “remove apples”, “find organic apples under $5”.
- MVP runs fully in the browser using the Web Speech API. Optional backend (Firebase) adds sync/history and smarter suggestions.
- Keep it simple, shippable, and demoable. Stretch goals are clearly marked.

## Architecture (MVP → optional)

- MVP: React app (Vite) + Web Speech API + local state (persist to localStorage).
- Optional backend: Firebase (Firestore + Auth) for cloud sync, history, and suggestions.
- Optional STT: Google Cloud Speech-to-Text or OpenAI Whisper API for multilingual/accuracy.

Data model (Firestore):
- items: { id, name, quantity, category, createdAt, updatedAt, done }
- history: { id, name, countAdded, lastAddedAt }
- user: { id, preferredLanguage }

## Quickstart

Prereqs: Node.js 18+, Git, a GitHub account.

 Vite :
1) Create app
	 - npx create-vite@latest echocart --template react-ts
2) Install and run
	 - cd echocart
	 - npm install
	 - npm run dev

Tip: Commit early, push to GitHub after the scaffold builds locally.

## Phases and Timebox

Each phase lists goals, tasks, and acceptance criteria to know when to stop.

### Phase 1 — Core Setup (≈1.5h)
- Goals: Pick stack, scaffold app, commit baseline.
- Tasks:
	- Choose Vite React .
	- Add UI libs if desired (e.g., Tailwind CSS) and a basic layout with a header and mic button.
	- Create simple List page with placeholder items.
- Accept when: Dev server runs, mic button renders, list shows static items, repo pushed.

### Phase 2 — Voice Input & NLP (≈2h)
- Goals: Convert speech to text and parse intent.
- Tasks:
	- Implement Web Speech API with fallback detection:
		- Check window.SpeechRecognition || window.webkitSpeechRecognition.
		- If unsupported, disable mic button and show tip to use Chrome or fallback to text input.
	- Multilingual: expose a language selector (e.g., English, Spanish, Hindi) and set recognition.lang accordingly (default: en-US). Persist selection (localStorage or Firestore user profile). For cloud STT, pass languageCode.
	- Parse utterances into: intent (add|remove|search), item name, quantity.
		- Start simple with regex and a few patterns.
		- Optionally add a lightweight NLP library: compromise.js or winkNLP.
- Example intents to support:
	- “add milk”, “add 2 oranges”, “add three bananas”
	- “remove apples”, “delete eggs”
	- “find organic apples under $5” (basic filters)
- Accept when: Saying “add milk” adds an item to the UI list reliably; errors show helpful messages.

Parsing starter (pseudo):
- Normalize input: lowercase, trim.
- Quantity: extract first number word or digit (e.g., 2, two → 2; default 1).
- Intent: startsWith(add|remove|delete|find|search).
- Item: remaining tokens after intent and numbers.

### Phase 3 — Shopping List Management (≈2h)
- Goals: CRUD list with categories and quantities.
- Tasks:
	- State: items[] in React with localStorage persistence.
	- Fields: name, quantity (default 1), category, done (checkbox), createdAt.
	- Categories: map keywords to categories with a small JSON.
- Example mapping:
	- dairy: ["milk", "yogurt", "cheese"]
	- produce: ["apple", "banana", "spinach"]
	- snacks: ["chips", "cookies", "nuts"]
- Accept when: Add/remove/edit items in UI; reload keeps list.

### Phase 4 — Smart Suggestions (≈1.5h)
- Goals: Suggest frequent/seasonal/substitute items.
- Tasks:
	- Track history: when adding an item, increment countAdded in a simple map (local or Firestore).
	- Show a “Suggestions” row: top 3 frequent items not in the list.
	- Seasonal JSON (demo-only): summer → [mango], autumn → [pumpkin].
	- Substitutes JSON: milk → [almond milk, soy milk], bread → [whole wheat bread].
- Accept when: Suggestions render and can be added with one click.

### Phase 5 — Voice Search & Filtering (≈0.5h)
- Goals: Parse filters from phrases.
- Tasks:
	- Recognize words like “organic”, brand names (e.g., “Colgate”), sizes (“500 ml”, “2 kg”), and price comparators (“under/less than/below $5”).
	- For demo: Filter a small mock products.json by fields: name, brand, size (string, normalized), price (number), tags (array: ["organic", "gluten-free"]).
- Accept when: “find organic apples under $5” shows filtered mock results.

### Phase 6 — UI/UX Polish (≈0.5h)
- Goals: Minimal but clear UI and feedback.
- Tasks:
	- Collapsible categories; badge for quantity.
	- Toasts or inline messages like “Added milk ✅”, “Removed apples ❌”.
	- Active mic indicator; show live transcript while listening.
- Accept when: Flows feel smooth and obvious to a new user.

### Phase 7 — Hosting & Docs (≈0.5h)
- Goals: Deploy frontend and write concise docs.
- Tasks:
	- Deploy to Vercel (recommended) or Netlify.
	- If using Firebase, deploy Firestore rules and (optionally) Cloud Functions.
	- Complete this README: setup, run, deploy, and approach write-up.
- Accept when: Public URL works on desktop Chrome; README includes a 200-word write-up.

## Beginner Notes and Gotchas

- Browser support: Web Speech API works best in desktop Chrome; Safari/Firefox support varies.
- Mic permissions: The browser will ask for permission; handle “denied” by disabling the mic button and showing help.
- Accents/languages: For better accuracy or multilingual, consider Google STT or Whisper API (paid/free tiers). Keep this optional.
- Offline behavior: Keep the MVP usable without any backend; localStorage is enough for a demo.

## Optional: Firebase Integration

What you get: sync across devices, history-based suggestions, user settings.

Setup (high level):
- Create a Firebase project → enable Firestore and Anonymous Auth.
- Install SDK: npm i firebase
- Add .env with Firebase config (use Vite/Next env conventions).
- Initialize app, sign in anonymously, read/write collections.

Suggested Firestore rules (dev-easy, not production-safe):
```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /users/{uid}/{document=**} {
			allow read, write: if request.auth != null && request.auth.uid == uid;
		}
	}
}
```

Collections:
- users/{uid}/items
- users/{uid}/history

## Optional: More Accurate Speech (Google STT or Whisper)

- Keep Web Speech API as default. Add a toggle to use cloud STT.
- Route audio: capture mic, send to backend endpoint, forward to STT API, return transcript.
- Mind cost and latency; cache recent transcripts for quick demos.

## Testing Strategy

- Unit: parser tests (intent, item, quantity). Test a few tricky phrases: “add two dozen eggs”, “remove 3 tomatoes”, “add bread and butter” (scope MVP to one item per command).
- Component: list reducer/state tests (add/remove/edit).
- Manual: microphone workflow, denied permissions, unsupported browser.

## Accessibility

- Keyboard: space/enter to toggle mic; tab order on controls.
- ARIA: aria-pressed on mic button; role="status" for feedback messages.
- Visual: clear focus styles, high contrast for transcript and toasts.

## Deployment

Vercel (React/Next):
- Push code to GitHub → Import repo into Vercel → Framework auto-detected → Deploy.
- Add environment variables in Vercel dashboard if using Firebase/STT.

Netlify (Vite React):
- Connect repo → pick Vite build (npm run build) and publish dist/.

Firebase (optional backend):
- Firebase CLI: firebase init firestore; firebase deploy

## Requirements Traceability

This plan maps to the requested features and evaluation criteria:

- Voice Input
	- Voice command recognition: Web Speech API by default; optional Cloud STT for accuracy/multilingual.
	- NLP: regex + optional compromise.js/winkNLP. Extract intent, item, quantity, filters.
	- Multilingual: language selector → sets recognition.lang (e.g., en-US, es-ES, hi-IN); optional Cloud STT languageCode.

- Smart Suggestions
	- Product recommendations: frequency-based history and “not currently on list” suggestions.
	- Seasonal: seasonal.json for simple season → items mapping.
	- Substitutes: substitutes.json mapping with quick-add buttons.

- Shopping List Management
	- Add/Remove/Modify: via voice and UI controls (edit quantity, mark done, delete).
	- Categorize: categories.json keyword mapping; auto-assign on add.
	- Quantity: parse digits and number words (default 1).

- Voice-Activated Search
	- Item search: parse queries like “find organic apples” (item + tags).
	- Brand/size/price: parse brand tokens, sizes (ml/kg/oz), comparators (under/below/less than), and numeric prices.

- UI/UX
	- Minimalist list with categories; collapsible groups; quantity badges.
	- Visual feedback: live transcript, toasts (“Added milk ✅”), disabled mic when permission denied.
	- Mobile/voice-only: large mic button, high-contrast transcript, keyboard accessibility, works on mobile Chrome.

- Hosting
	- Frontend: Vercel/Netlify recommended.
	- Backend (optional): Firebase (Firestore + Functions). You can also deploy to AWS Amplify or GCP Cloud Run if preferred.

- Technical Requirements
	- Clean, production-quality code: typed React (TS), small modules, simple state reducers.
	- Error handling: mic permission denied, STT unavailable, network errors; show inline messages.
	- Loading states: listening indicator, “processing” spinner for NLP/cloud calls.
	- Documentation: this README + 200-word write-up.

## Mobile and Voice-only UI Notes

- Use a full-width mic FAB on mobile.
- Keep critical actions reachable with one tap; large hit targets (44px+).
- Show transcript at the top with clear status (Listening/Processing/Idle).
- Provide a text input fallback for unsupported browsers.

## Acceptance Criteria (MVP)

- Voice “add milk” adds an item; “remove apples” removes it; quantity like “add 2 oranges” sets quantity.
- Items auto-categorize into at least 3 categories.
- Suggestions show frequent items and at least one seasonal/substitute suggestion.
- Voice search handles “find organic apples under $5” and filters mock products accordingly.
- Deployed URL publicly accessible; README includes setup and write-up.

## Timeline

- Deadline: 1 Sep 2025
- Time budget: ≤ 8 hours
- Suggested allocation:
	- Phase 1: 1.5h
	- Phase 2: 2h
	- Phase 3: 2h
	- Phase 4: 1.5h
	- Phase 5–7: 1h combined

## Minimal Component Outline (for planning)

- AppShell: header, mic button, live transcript, toast area.
- List: grouped by category, item row with quantity and done toggle.
- Suggestions: chips/pills to add items.
- SearchPanel: shows filtered mock products for “find …” commands.

## Example JSONs (starter data)

categories.json
```
{
	"dairy": ["milk", "yogurt", "cheese"],
	"produce": ["apple", "banana", "spinach"],
	"snacks": ["chips", "cookies", "nuts"]
}
```

seasonal.json
```
{
	"summer": ["mango", "watermelon"],
	"autumn": ["pumpkin", "squash"]
}
```

substitutes.json
```
{
	"milk": ["almond milk", "soy milk"],
	"bread": ["whole wheat bread", "sourdough"]
}
```

## 200-word write-up (template)

Echocart is a voice-first shopping list assistant built with React and the Web Speech API. The goal was a fast, demoable MVP that runs entirely in the browser while leaving room for cloud features. I chose Vite for a simple developer experience and rapid iteration. Voice commands like “add milk” or “remove apples” are transcribed and parsed into intent, item, and quantity using lightweight patterns, keeping dependencies minimal for reliability and speed. Items are categorized and persisted locally so the app works offline. Suggestions are generated from recent history, basic seasonal data, and simple substitutes to showcase “smart” behavior without heavy ML. The UI focuses on clarity: a microphone button with live transcript, feedback toasts, and collapsible categories.

For better accuracy and multilingual support, the architecture supports optional integrations with Firebase for sync and Google/STT APIs for transcription; these are clearly separated so beginners can ship the MVP without managing cloud billing. Testing prioritizes the parser and list logic. Accessibility covers keyboard control and ARIA roles. The trade-offs favor simplicity and timeboxing over completeness, delivering a working, hostable prototype suitable for user feedback and future iteration.

## Deliverables Checklist

- Public URL (Vercel/Netlify) that works in desktop Chrome.
- GitHub repo with this README and clean commits.
- Short write-up (200 words) using the template above.
