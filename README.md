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
- V1 persistence: browser `localStorage`; feedback uses backend local JSON
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Important frontend modules:

- `frontend/src/domain/memoryModel.js` — versioned personal-memory schema
- `frontend/src/domain/memoryEngine.js` — evidence updates and confidence changes
- `frontend/src/domain/decisionEngine.js` — local deterministic purchase judgment
- `frontend/src/domain/productStore.js` — persistence, migration, and decision lifecycle

The matching backend engine is `backend/engines/memoryDecisionEngine.js`, exposed at `POST /api/analyze-purchase-v2`. When the backend is unavailable, the frontend runs the same decision locally and visibly shows Local Demo Mode.

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

## Privacy boundary

Photos in the current version are previewed locally in the browser and are not uploaded to the backend. No API key is stored in the frontend. Future image analysis must add explicit consent, retention details, deletion controls, format and size limits, and metadata removal.
