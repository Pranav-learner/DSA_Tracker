# CP-OS Frontend — Learning Roadmap UI

React 19 · Vite · TypeScript · Tailwind · shadcn-style components · Redux Toolkit ·
React Query · Framer Motion · React Router.

A dark, premium, minimal interface (Linear / Raycast / GitHub / Apple inspired)
for navigating the `Roadmap → Phase → Topic` hierarchy.

---

## Architecture

### State: server vs UI (deliberately separated)

| Concern | Owner | Where |
|---------|-------|-------|
| **Server state** (phases, topics, roadmap) | **React Query** | `src/hooks/*`, `src/api/*` |
| **UI state** (view mode, filters, active tab) | **Redux Toolkit** | `src/store/*` |

React Query owns fetching, caching, retries and invalidation — so that never
lives in Redux. Redux holds only ephemeral view state. This keeps each tool doing
what it's best at and avoids duplicating server data in the store.

### Data flow

```
Component
  → useRoadmap / usePhase / useTopic        (React Query hooks)
      → api/*.ts                            (typed endpoint fns)
          → api/client.ts                   (fetch + envelope unwrap + ApiError)
              → Backend /api
```

UI interactions (switch view, filter difficulty, select topic section) dispatch to
Redux slices via typed hooks (`useAppDispatch` / `useAppSelector`).

---

## Folder structure

```
frontend/src/
├── api/            client.ts + roadmap/phase/topic endpoint modules
├── components/
│   ├── ui/         shadcn-style primitives: button, card, badge, skeleton, slot, Icon
│   ├── common/     PhaseCard, TopicCard, SectionHeader, ProgressChip, StatusBadge,
│   │               DifficultyBadge, StatCard, CardContainer, EmptyState, ErrorState,
│   │               LoadingSkeleton, Breadcrumb
│   ├── layout/     Sidebar, Navbar, AppLayout
│   └── ErrorBoundary.tsx
├── hooks/          useRoadmap, usePhase, useTopic  (React Query)
├── store/          index.ts, hooks.ts, slices/{roadmap,phase,topic}Slice.ts
├── pages/          Dashboard, Roadmap, Phase, Topic, NotFound
├── router/         route table
├── lib/            utils (cn, plural), queryClient, difficulties
├── config/         env.ts
├── types/          shared API DTO types (mirror backend)
├── App.tsx         provider composition
├── main.tsx        entry
└── index.css       theme tokens (CSS variables) + base styles
```

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | → redirect | to `/dashboard` |
| `/dashboard` | **Dashboard** | Stats, Continue-Learning card (current phase), Current-Topic placeholder, Roadmap preview |
| `/roadmap` | **Roadmap** | All 11 phases in a **timeline** or **grid** view, summary stats, focus-mode toggle (hide locked) |
| `/roadmap/:phaseId` | **Phase** | Phase header, progress placeholder, stats, topics grid with difficulty filter |
| `/topic/:topicId` | **Topic** | Topic meta + six placeholder module tabs: Concept, Pattern Ladder, Problems, Assessment, Notebook, Mastery |
| `*` | **NotFound** | Standalone 404 |

### Page states
Every data-driven page renders four states: **loading** (skeletons),
**error** (`ErrorState` with retry), **empty** (`EmptyState`), and **success**.

---

## Reusable components

`Sidebar`, `Navbar`, `PhaseCard`, `TopicCard`, `SectionHeader`, `ProgressChip`,
`StatusBadge`, `DifficultyBadge`, `StatCard`, `CardContainer`, `EmptyState`,
`ErrorState`, `LoadingSkeleton`, `Breadcrumb`, plus shadcn-style `Button`, `Card`,
`Badge`, `Skeleton`, `Icon`. All are prop-driven and used across multiple pages.

---

## Theme

A single set of HSL CSS variables in `src/index.css` drives the whole palette
(consumed by `tailwind.config.ts`). Dark by default with an ambient gradient,
soft shadows, rounded corners (`--radius`), Inter + JetBrains Mono, and Framer
Motion entrance/hover animations. Fully responsive: the sidebar collapses into a
motion drawer on mobile; grids reflow from 1→3 columns.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check only |

Set `VITE_API_URL` in `.env` (defaults to `http://localhost:5000/api`).

---

## Extension points for Sprint 2

- **Icon registry** (`components/ui/Icon.tsx`) — add new phase icons here.
- **Topic module tabs** — each of the six placeholder sections becomes a real
  feature module; the tab UI + Redux `activeSection` are already wired.
- **`ProgressChip`** consumes the real `progress` shape — the mastery engine only
  needs to supply non-zero values.
- **Redux slices** already hold filters/selection and are ready for search.
