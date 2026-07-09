# Module 5 · Sprint 1 — Contest Library, Rating History & Contest Management

The foundation of the Competitive Programming Engine: a multi-platform **Contest
Library** with full CRUD, a maintained **Rating History**, and basic contest
statistics. Designed so the whole CP engine (workspace → postmortem → upsolve →
analytics) can build on it without refactoring.

Out of scope (later sprints): contest workspace, timelines, problem tracking,
postmortem, upsolve, contest intelligence, advanced analytics.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/contest.ts                        ＋ pagination · rating bounds · sort fields
├── contests/                                ＋ SELF-CONTAINED module
│   ├── providers/contestProvider.ts         ＋ ContestProvider interface + CF/LC/AtCoder/CC + registry
│   ├── dto/contest.dto.ts                   ＋ Contest · PaginatedContests · Stats · RatingSummary · Facets · Dashboard
│   ├── repositories/contest.repository.ts   ＋ CRUD + search + stats aggregation (DB only)
│   ├── repositories/rating.repository.ts    ＋ rating timeline (DB only)
│   ├── services/contest.service.ts          ＋ CRUD · list/filter/sort/paginate · stats
│   ├── services/rating.service.ts           ＋ timeline sync + summary (current/high/low/avg/delta)
│   ├── validators/contest.validator.ts      ＋ create/update/query (zod)
│   ├── controllers/contest.controller.ts    ＋ CRUD + stats + facets
│   ├── controllers/rating.controller.ts     ＋ summary + history + current
│   └── routes/contest.routes.ts             ＋ /api/contests + /api/ratings
├── models/Contest.ts · RatingHistory.ts     ＋ collections + indexes
├── types/domain.ts                          ~ CONTEST_PLATFORMS · CONTEST_TYPES · contest entity + 3 activity types
├── services/dashboard.service.ts / dto.ts   ~ contest widget (parallel call)
├── seed/seed.ts                             ~ seedContests() — multi-platform + CF rating arc
└── tests/roadmap.integration.ts             ~ contest CRUD/list/stats + rating + HTTP assertions

frontend/src/
├── lib/contest.ts                           ＋ platform/type meta · rating-change fmt
├── api/contest.api.ts · hooks/useContests.ts ＋ CRUD + rating hooks
├── store/slices/contestSlice.ts             ＋ filters/sort/platform/date range (UI only)
├── components/contest/ (16)                 ＋ badges · table · card · stats · rating · form
├── pages/ (6)                               ＋ Dashboard · Library · Detail · New · Rating History · Statistics
├── router/index.tsx · layout/Sidebar.tsx     ~ lazy routes + Contests nav
└── pages/DashboardPage.tsx                  ~ Home contest widget
```

**No previous module was rewritten** — only additive route/dashboard/domain wiring.

---

## 2. Contest Architecture

Layered and platform-agnostic:

```
Controller → ContestService → { ContestRepository, RatingService, ContestProvider }
                                     │
             RatingService → RatingRepository   (timeline kept in sync automatically)
```

- **ContestService** owns all business logic (CRUD, uniqueness, filtered/paginated
  history, statistics). On create/update it derives `ratingChange`, resolves the
  canonical URL via the provider, and calls **RatingService** to upsert/remove the
  rating point — so the timeline never drifts and no rating logic is duplicated.
- **Repositories** hold only DB operations; every read is `userId`-scoped
  (security: users only ever touch their own contests/ratings).

---

## 3. ContestProvider Architecture

A single interface abstracts every platform, so the engine never special-cases
one:

```ts
interface ContestProvider {
  platform · label · baseUrl · supportsRating · supportsDivisions · divisions[]
  contestUrl(contestId): string
}
```

Providers ship for **Codeforces, LeetCode, AtCoder, CodeChef** (URL patterns +
divisions/series), resolved through a registry (`getContestProvider`,
`listContestProviders`). Sprint 1 uses **manual data entry**; the interface is
deliberately shaped so a future API integration (fetch contests, live ratings)
adds fetch methods to a provider **without any schema change** — callers stay
identical.

---

## 4. MongoDB Schemas

**Contest** — `{ userId, platform, provider, contestId, contestName, contestUrl,
division, contestType (Rated|Unrated|Virtual), startTime, durationMinutes,
ratingBefore, ratingAfter, ratingChange, rank, percentile, participated, notes,
timestamps }`. Indexes: unique `{userId, platform, contestId}` (uniqueness),
`{userId, startTime}`, `platform`.

**RatingHistory** — `{ userId, platform, contestRef, contestId, rating,
ratingChange, contestDate, createdAt }`. Indexes: unique `{userId, contestRef}`
(one point per contest), `{userId, platform, contestDate}`. Kept separate from
Contest so the timeline charts cheaply.

---

## 5. API Documentation

Standard `{ success, data, meta? }` envelope; user is always the authenticated
user.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/contests` | create (`409` duplicate · `400` invalid) |
| GET | `/api/contests` | list — `q`, `platform`, `contestType`, `division`, `rated`, `from/to`, `sort`, `order`, `page`, `pageSize` |
| GET | `/api/contests/stats` | totals · rated/virtual · avg rank/Δ · frequency · platform distribution |
| GET | `/api/contests/facets` | data-driven filter values (platforms/divisions/types) |
| GET \| PATCH \| DELETE | `/api/contests/:id` | one contest (`400` bad id · `404`/`403`) |
| GET | `/api/ratings` | summary: current/highest/lowest/average + best/worst + recent |
| GET | `/api/ratings/history` | full rating timeline (`?platform=`) |
| GET | `/api/ratings/current` | current rating |

---

## 6. RatingService

Maintains the rating timeline and computes **basic** statistics only (per scope):

- **`syncFromContest`** — a rated contest with a recorded post-rating upserts a
  `RatingHistory` point; an unrated/virtual contest (or one without a post-rating)
  removes it. Idempotent, keyed by `contestRef`.
- **`summary`** — current (latest), highest, lowest, average, best improvement
  (max Δ), worst drop (min Δ), rated count, last change, recent changes (enriched
  with contest names).
- **`current`**, **`history`** (timeline with names), **`rebuild`** (used after
  seeding). No trend/forecast analytics beyond these basics.

---

## 7. Contest Management Flow

```
Add contest → validate (uniqueness, platform, rating bounds, dates)
            → derive ratingChange · resolve provider URL
            → persist Contest → RatingService.syncFromContest
            → activity: contest-added (+ rating-updated if rated)
Update      → recompute ratingChange → re-sync rating point → contest-updated
Delete      → remove rating point → delete contest
List/Stats  → filtered, paginated reads + one aggregation pipeline
```

Every meaningful mutation records an **Activity** event (`contest-added`,
`contest-updated`, `rating-updated`), reusing the existing Activity model — so
the Home timeline and the analytics cache stay in sync for free.

---

## 8. The Contest Dashboard & Library (description)

The **Contest Dashboard** (`/contests`) leads with rating tiles (current,
highest, total, avg rank, best improvement, worst drop), a rating-progress line
chart (reusing the Module-4 chart library), a recent-contests table and a link to
statistics — plus prominent **Add contest** / **Library** actions. The **Library**
(`/contests/library`) is the full searchable table (Contest · Platform · Division
· Type · Date · Rank · Rating Δ) with a debounced search, a data-driven filter bar
(platform/type/rated) and prev/next pagination. **Contest Detail** shows the
contest info + rating before/after/Δ/rank, notes, and dimmed **Problems /
Timeline / Postmortem / Upsolve** placeholders for later sprints. **Rating
History** pairs the timeline with recent-change and rating-span panels;
**Statistics** shows totals + platform distribution (pie + bar). The Home
dashboard gains a compact **Contests** widget (rating + latest contest + quick
add). All dark-theme, responsive, with loading skeletons and empty states.

---

## 9. Extension Points for Sprint 2 (Contest Workspace & Performance Tracking)

- **ContestProvider** is the seam for live API integration — add
  `fetchContest()` / `fetchRating()` to a provider; the schema and callers are
  unchanged.
- **Contest Detail placeholders** (Problems / Timeline / Postmortem / Upsolve)
  are already laid out — Sprint 2 fills them in place.
- **Contest model** has room for per-contest problem/submission subdocuments or a
  linked `ContestProblem` collection without touching existing fields.
- **RatingService** can grow richer trend/prediction methods behind the same
  interface; **RatingHistory** already stores the time-series.
- **Activity + dashboard + analytics cache** already recognise contests, so
  contest analytics slot into Module 4 with no refactor.

---

## Verification

- **Backend** `tsc --noEmit` → clean; **frontend** `tsc` + `vite build` → clean
  (contest pages code-split; main bundle ~846 KB).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. create
  (derives `+64` rating change + provider URL), duplicate `409`, update, filtered/
  sorted/paginated list, stats aggregation, rating summary + timeline maintenance,
  the dashboard contest widget, contest activity events, and delete removing the
  rating point — plus HTTP `201/200/409/400` coverage for every endpoint. E.g.
  `ratings: current=902 highest=1553 best=64 worst=41` and
  `http contests: create=201 … dup=409 badPlatform=400 badId=400`.
