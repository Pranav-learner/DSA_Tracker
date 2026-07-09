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
│   │               LoadingSkeleton, Breadcrumb, WorkspaceSection
│   ├── topic/      Sprint 2 workspace: TopicHeader, ConceptCard, KeywordChip,
│   │               PatternLadder, PatternStageCard, PatternCard, MetadataPanel,
│   │               EstimatedTimeCard, LearningResourceCard,
│   │               RepresentativeProblemTable, AssessmentCard, NotebookCard,
│   │               TopicNavigation
│   ├── learning/   Sprint 3 engine: MasteryRing, MasteryBar, StageProgress,
│   │               LearningRecommendationCard, ProgressOverviewCard,
│   │               CompletionBadge, UnlockBadge, CurrentTopicCard,
│   │               RoadmapProgressCard
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
| `/topic/:topicId` | **Topic Workspace** | Full study environment (see below) |
| `/topic/:topicId/problem/:problemId` | **Problem Placeholder** | Read-only preview of a representative problem; full tracker is a future sprint |
| `*` | **NotFound** | Standalone 404 |

### Topic Workspace (`/topic/:topicId`)

The primary screen of the app. A two-column responsive layout:

- **Header** — phase, title, difficulty, estimates, status & current-stage placeholder
- **Concept Overview** — core idea, when to use / not use, time & space complexity,
  advantages, limitations, applications, worked examples
- **Recognition Keywords** — keyword chips that hint the pattern
- **Pattern Ladder** — reusable 6-stage progression (Recognition → Implementation →
  Standard → Variant → Mixed → Contest) with placeholder lock/progress state, plus a
  `PatternCard` summarising the core pattern
- **Learning Resources** — placeholder cards (Concept Notes, Cheat Sheet, Visual,
  Reference Links, Editorial), markdown-ready
- **Representative Problems** — read-only table; a row opens the problem placeholder
- **Assessment** & **Notebook** — placeholder cards
- **Future Modules** — Mastery, Revision, Analytics, AI Mentor previews
- **Sidebar** — `MetadataPanel` (difficulty, estimates, prerequisites, related, next
  topic) + `EstimatedTimeCard`
- **TopicNavigation** — Previous / Next / Back-to-Phase / Continue, with ← → keyboard shortcuts

Data comes from three React Query hooks (`useTopic`, `useTopicRelated`,
`useTopicProblems`); the only Redux UI state is the expanded Pattern Ladder stage.

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

## Sprint 3 — Learning Engine integration

Server data comes from React Query hooks in `hooks/useLearning.ts`
(`useLearningState`, `useProgress`, `useRecommendation`, `useTopicProgress`,
`useTopicMastery`, `useUnlockedTopics`) plus mutations (`useUpdateTopicProgress`,
`useUnlockTopic`) that invalidate the affected keys. UI-only state lives in four
thin slices: `learning`, `mastery`, `recommendation`, `progressUi`.

- **Dashboard** — fully live: mastery ring, recommendation, current topic,
  completed/remaining/confidence, and a progress overview, all from the API.
- **Roadmap & Phase** — `PhaseCard` / `TopicCard` accept an optional progress
  overlay (backward-compatible) showing completed / current / locked / unlocked and
  a mastery bar; the page merges `useRoadmap` with `useProgress`.
- **Topic Workspace** — the Pattern Ladder now renders real per-stage progress
  (`useTopicMastery`), plus a mastery ring, completion/unlock badges, current stage
  and the recommendation card.

Mastery presentation helpers (tone/colour/labels) live in `lib/mastery.ts`.

## Extension points for Sprint 4

- The learning components (`MasteryRing`, `MasteryBar`, `ProgressOverviewCard`,
  `StageProgress`, …) are built to be **reused in the Sprint 4 Analytics** module.
- Mutations (`useUpdateTopicProgress`, `useUnlockTopic`) are wired and cache-aware —
  ready for assessment / attempt UIs to call.
- **`PatternCard`** still derives from the topic; swap its `PatternCardData` source
  for a real `Pattern` entity when the model lands.
- **Learning Resource / Notebook cards** are markdown-ready placeholders.
- **Icon registry** (`components/ui/Icon.tsx`) — add new phase icons here.
