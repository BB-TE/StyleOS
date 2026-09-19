# StyleOS

StyleOS is a memory-based clothing purchase decision system. It does not stop at a one-off style quiz: it keeps evidence from preferences, wardrobe items, purchase decisions, returns, idle items, and frequently worn successes, then uses that memory before the next purchase.

## Product loop

```text
Initial memory → Buy check → Purchase / pass → Keep / return / idle outcome
       ↑                                                   ↓
       └──────────── Personal memory is updated ──────────┘
```

The result is produced by deterministic rules and visible evidence. AI adapters are reserved for image/text extraction and natural-language presentation; they are not allowed to freely invent the decision.

## Main routes

- `/` — public product introduction only
- `/today` — current memory, wardrobe, budget, and pending feedback
- `/purchase` — the primary pre-purchase decision workspace
- `/memory` — editable Style Memory with confidence and evidence
- `/wardrobe` — local wardrobe inventory
- `/decisions` — decision lifecycle and outcome feedback
- `/setup` — three-step initial memory setup
- `/styles` — eight-style reference library
- `/color-lab` — deterministic color analysis

Legacy `/analysis`, `/report`, and `/history` links redirect to their V2 equivalents.

## Architecture

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Lucide React
- Backend: Node.js, Express, CORS
- Offline persistence: browser `localStorage`
- Development sync: normalized state snapshots in a backend JSON file
- Production persistence contract: Supabase/PostgreSQL schema with row-level security
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Important frontend modules:

- `frontend/src/domain/memoryModel.js` — versioned personal-memory schema
- `frontend/src/domain/memoryEngine.js` — evidence updates and confidence changes
- `frontend/src/domain/decisionEngine.js` — local deterministic purchase judgment
- `frontend/src/domain/productStore.js` — persistence, migration, and decision lifecycle
- `frontend/src/contexts/DataSyncProvider.jsx` — local-first hydration and debounced sync
- `backend/routes/memory.js` — owner-scoped memory, wardrobe, decision, and outcome endpoints
- `backend/data/styleos-schema.sql` — production database contract

The matching backend engine is `backend/engines/memoryDecisionEngine.js`, exposed at `POST /api/analyze-purchase-v2`. The owner-scoped `POST /api/memory/decision-check` endpoint reads the stored revision, analyzes the candidate, and saves the resulting decision atomically. Purchase results now include wardrobe-based outfit drafts, estimated use value, and concrete next actions; numeric scores remain a secondary evidence view. The browser runs the same decision locally by default. Remote memory analysis and background text sync are separate opt-in feature flags, and sync does not begin until the user explicitly chooses it in the privacy guide. In local development, the sync API uses an anonymous device owner ID and a revisioned file repository; this is for development continuity, not production identity or cross-device security.

## Local development

Install once from the repository root:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## Verification

```bash
npm run test
npm run lint
npm run build
```

Backend tests can also be run from `backend` with `npm test`.

## GitHub Pages demo

The repository includes `.github/workflows/deploy-pages.yml`. After the project
is pushed to a GitHub repository whose default branch is `main`, enable
**Settings → Pages → Source → GitHub Actions**. Each push to `main` will test,
build, and publish the frontend.

The Pages build uses hash routing and local demo mode, so routes work after a
refresh and the browser does not try to call `localhost:3001`. The published
URL follows this format:

```text
https://<github-user>.github.io/<repository-name>/
```

GitHub Pages cannot run the Express backend. The repository therefore includes
`render.yaml` for a separate Render web service. After the Blueprint is
deployed, set the GitHub repository Actions variable `VITE_API_BASE_URL` to the
service URL (for example `https://styleos-api-bb-te.onrender.com`) and rerun the
Pages workflow. If that variable is absent, the site deliberately stays in
Local Demo Mode instead of attempting to call `localhost`.

Do not treat the Render file repository as durable production storage: instances
may replace or discard their local filesystem. The production server disables
the unauthenticated file-memory routes by default, and the Pages workflow leaves
both memory-sync flags off. Keep the public demo in Local Demo Mode until a
Supabase repository and authenticated user ownership have been connected.

## Privacy boundary

Photos in the current version are previewed locally in the browser and are not uploaded to the backend. Text memory also stays local unless the user explicitly opts into the development sync; that choice can be revoked and the backend text copy can be deleted from the privacy guide. No API key is stored in the frontend. Future image analysis must add separate explicit consent, retention details, deletion controls, format and size limits, and metadata removal.
