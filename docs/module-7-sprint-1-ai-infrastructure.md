# Module 7 · Sprint 1 — AI Infrastructure, LLM Gateway & Context Engine

The production-grade **AI Platform Layer** that will power every future AI feature
in CP-OS. The AI is *another service in the architecture*, not a standalone
chatbot: every request flows through one pipeline, and the AI never touches the
database — it consumes existing module services to build context.

```
User → AI API → Orchestrator → Intent Router → Context Builder → Prompt Builder → LLM Gateway → Provider
```

Infrastructure only. No specialised coaches, no agent logic, no new
recommendations — those are later sprints. This sprint makes all of that possible
without refactoring.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/ai.ts                                ＋ provider catalogue · defaults · limits · rate-limit · secrets (env)
├── models/AISettings.ts · Conversation.ts · ConversationMessage.ts  ＋ AI-owned collections + indexes
├── ai/                                         ＋ SELF-CONTAINED, business-isolated module
│   ├── types/ai.types.ts                       ＋ pipeline contracts (intents, LLM msg/result, ProviderInfo, AIError)
│   ├── providers/
│   │   ├── llmProvider.ts                       ＋ LLMProvider interface (the core seam)
│   │   ├── openai.provider.ts                   ＋ REAL (fetch, streaming + non-streaming, gated on key)
│   │   ├── mock.provider.ts                     ＋ offline, always-available streaming provider
│   │   ├── anthropic|gemini|ollama.provider.ts  ＋ compiling placeholders (via placeholder factory)
│   │   └── registry.ts                          ＋ provider registry + health + fallback
│   ├── router/intentRouter.service.ts          ＋ rule-based intent classification (pluggable)
│   ├── context/contextBuilder.service.ts       ＋ builds structured context from EXISTING services (no DB)
│   ├── prompts/templates.ts · promptBuilder.service.ts  ＋ template-based prompt assembly
│   ├── orchestrator/aiOrchestrator.service.ts  ＋ THE pipeline coordinator (streaming + non-streaming)
│   ├── services/llmGateway.ts                  ＋ the only caller of providers (+ graceful fallback)
│   ├── services/responseValidator.ts           ＋ guards the UI from provider failures
│   ├── services/conversation.service.ts · aiSettings.service.ts  ＋ AI-owned storage (CRUD + prefs)
│   ├── repositories/{conversation,aiSettings}.repository.ts  ＋ DB owners (AI's own data only)
│   ├── middleware/rateLimit.ts · sanitize.ts    ＋ per-user AI rate limit + prompt sanitisation
│   ├── dto/ai.dto.ts · validators/ai.validator.ts · controllers/ai.controller.ts (SSE) · routes/ai.routes.ts
│   ├── utils/tokens.ts                          ＋ token estimation
│   └── index.ts                                 ＋ module surface (router export)
├── routes/index.ts                             ~ mount /api/ai
└── tests/ai.smoke.ts                           ＋ 34-check end-to-end (npm run test:ai)

frontend/src/
├── api/ai.api.ts                               ＋ SSE streaming reader + CRUD/settings/providers
├── hooks/useAI.ts                              ＋ React Query hooks + useChatStream (streaming orchestration)
├── store/slices/aiSlice.ts                     ＋ UI state (current convo, streaming buffer, drawers)
├── components/ai/ (16)                         ＋ ChatLayout · Sidebar · ChatWindow · MessageBubble · Streaming · Input · Markdown · selectors · settings …
├── pages/AIWorkspace.tsx                       ＋ /ai workspace
├── router/index.tsx · layout/Sidebar.tsx        ~ /ai route + "AI Mentor" nav
└── types/index.ts · lib/queryClient.ts · store/index.ts  ~ AI types, query keys, reducer
```

**No business module was modified.** The AI module only *consumes* their services.

---

## 2. AI Platform Architecture

The module is isolated from business modules — it depends **inward** on their
services (via the Context Builder) but they never depend on it, and it owns no
learning logic. Its only own data is conversations + settings.

```
        ┌──────────────────────── AI Module (isolated) ───────────────────────┐
        │  Controller (SSE)                                                    │
        │      │                                                               │
        │  AIOrchestrator ── IntentRouter                                      │
        │      │          ── ContextBuilder ──▶ dashboardService,              │
        │      │                                gamificationProfileService,    │  (existing services —
        │      │                                activityService … (DTOs only)  │   never DB/models)
        │      │          ── PromptBuilder (templates)                         │
        │      │          ── LLMGateway ── providerRegistry ── LLMProvider ──▶ OpenAI / mock / …
        │      │          ── ResponseValidator                                 │
        │      │          ── ConversationService ──▶ Conversation / Message    │  (AI-owned storage)
        └──────┴───────────────────────────────────────────────────────────────┘
```

Two rules enforced structurally:
- **The AI never accesses business MongoDB.** The ContextBuilder calls *services*
  that return DTOs; it never imports a business model or repository. Raw models
  are never serialized into a prompt.
- **All AI traffic flows through the pipeline.** There is no path to a provider
  except `Orchestrator → LLMGateway → LLMProvider`.

---

## 3. AI Orchestrator Flow

One method (`chat`) drives both streaming and non-streaming (pass `onToken` to
stream):

```
1. resolve settings + provider/model     (AISettings → LLMGateway.resolve → graceful fallback)
2. resolve conversation + prior history  (create if new; capture history BEFORE this turn)
3. persist the user turn
4. classify intent  (IntentRouter)
5. build context    (ContextBuilder — best-effort, DTO-derived)
6. assemble prompt   (PromptBuilder — [system+context, ...history, user])
7. call provider     (LLMGateway.generate | .stream)
8. validate          (ResponseValidator — empty/malformed/token checks)
9. persist assistant turn WITH telemetry (provider, model, tokens, responseTime, contextSnapshot)
```

No provider-specific logic lives here. Streaming aborts cleanly on client
disconnect (`res` 'close' + `writableEnded` guard — not `req` 'close', which fires
early once the body is parsed).

---

## 4. Context Builder

The heart of "context-aware without touching the DB". It runs **one** dashboard +
one profile fetch (no N+1), then derives concise, human-readable summaries per
intent. Each section is best-effort — a failing service is logged and omitted, so
a context error never fails the request.

- **Sections**: learner-profile (always), progression, learning-plan, revision,
  knowledge, analytics-health, contest, recent-activity.
- **Intent-scoped**: `study-plan` → learning-plan + progression; `contest` →
  contest + progression; `revision` → revision; etc.
- **DTO-derived only** — e.g. learner-profile reads `gamificationProfileService`
  (level/XP/streak/achievements) + `dashboardService` (phase/topic/mastery). No
  raw document is ever exposed.

Live proof: for the seeded user the mentor answered *"I can see you're at Level 5,
on a 12-day streak, currently working through Sliding Window (mastery 67%)"* —
all pulled through services by the ContextBuilder.

---

## 5. Prompt Builder Architecture

Template-based, not string concatenation (`prompts/templates.ts`):

```
systemPersona()  +  intentDirective(intent)  +  renderContext(context)   → system message
[system, ...history(trimmed to window), user]                            → LLMMessage[]
```

Each template is a small composable function returning one section, so a future
sprint can swap the persona or context rendering without touching the builder.
History is trimmed to `AI_LIMITS.historyWindow`. `generateTitle()` is the Sprint-1
placeholder title generator (first words of the opening message).

---

## 6. LLM Gateway Implementation

A provider abstraction with one real implementation and graceful degradation.

```
LLMProvider (interface: describe / isAvailable / generate / stream)
├── OpenAIProvider   — REAL: fetch to Chat Completions, SSE streaming, usage, typed errors, timeout
├── MockProvider     — offline, always-available; streams a context-aware mentor reply (dev/test/demo)
├── AnthropicProvider ┐
├── GeminiProvider    │ compiling placeholders (report unavailable; throw provider_unavailable if called)
└── OllamaProvider   ┘
```

- **Gateway** resolves a ProviderId → implementation and, if the requested one is
  unavailable (no key / placeholder), **falls back** to the first available
  provider (always the mock) so the UI never dead-ends.
- **Secrets** (`OPENAI_API_KEY`, …) are read server-side from env and NEVER sent
  to the client. With no key configured the default provider is `mock`, so the
  whole platform works offline.
- **Errors** are normalised to a typed `AIError` (`provider_unavailable`,
  `rate_limited`, `timeout`, `invalid_response`, …) that the controller maps to
  the right HTTP status (JSON) or an SSE `error` event (streaming).

---

## 7. MongoDB Schemas

```
AISettings            userId(unique) · preferredProvider · preferredModel ·
                      temperature · maxTokens · streamingEnabled · ts        (no secrets)

Conversation          userId · title · messageCount · lastMessageAt · ts
                      idx: {userId} {userId,updatedAt:-1}

ConversationMessage   conversationId · userId · role · content · contextSnapshot ·
                      provider · model · promptTokens · completionTokens ·
                      totalTokens · responseTime · createdAt
                      idx: {conversationId} {userId} {conversationId,createdAt:1}
```

Rich per-message telemetry (provider/model/tokens/time + the context snapshot) is
stored deliberately so future AI analytics need no schema change.

---

## 8. API Documentation

Base `/api/ai`, user-scoped (ownership: every query keyed by `userId` → 404 on
mismatch). `/chat` is rate-limited per user.

| Endpoint | Purpose |
|---|---|
| `POST /chat` | Run the pipeline. `{message, conversationId?, provider?, model?, stream?}`. `stream:true` → **SSE** (`start` → `token`×N → `done`\|`error`); else one JSON `ChatResult`. |
| `GET /conversations` | The user's threads (sidebar). |
| `POST /conversations` | Create an empty thread. |
| `GET /conversations/:id` | Thread + full message list. |
| `PATCH /conversations/:id` | Rename. |
| `DELETE /conversations/:id` | Delete thread + messages. |
| `GET /settings` · `PATCH /settings` | AI preferences (validated against the catalogue). |
| `GET /providers` | Providers + models + capabilities + **health** + `defaultProvider`. |

---

## 9. Component Hierarchy

```
AIWorkspace → ChatLayout
├── ConversationSidebar → ConversationCard        (New chat · thread list · delete)
├── ChatWindow
│   ├── header: title · ContextBadge · settings
│   ├── MessageBubble → MarkdownRenderer (code blocks + CopyButton) · ContextBadge
│   │                   · TokenUsageCard · ResponseTimeBadge · copy · regenerate
│   ├── StreamingMessage → MarkdownRenderer + TypingIndicator + Stop
│   └── ChatInput  (auto-grow · Enter-to-send)
└── SettingsDrawer → ProviderSelector · ModelSelector (+ temperature · maxTokens · streaming)
```

Chat features shipped: streaming responses, Markdown + fenced code blocks (custom,
zero-dependency renderer), copy message / copy code, regenerate, stop generation,
retry-on-error, auto-scroll, context indicator, placeholder title generation.

**State split**: React Query owns conversations/messages/settings/providers; Redux
(`aiSlice`) holds UI only — current conversation, live streaming buffer, input,
sidebar/settings visibility.

---

## 10. AI Workspace (live-verified description)

*(App needs MongoDB; below is the real behaviour, verified over HTTP.)*

A full-height, ChatGPT-quality workspace: a left **conversation sidebar** (New
chat + threads with recency/counts), the **chat window** (welcome screen with
suggested prompts when empty; otherwise the message thread), a **streaming area**
where the assistant reply types in token-by-token with a Stop button, an **input**
with Enter-to-send, a **context badge** in the header showing the detected intent
and how many context sections were used, and a slide-in **settings drawer** for
provider/model/temperature/maxTokens/streaming. Assistant turns render Markdown
with syntax-styled, copyable code blocks and a telemetry footer
(provider · model · tokens · response time).

Verified live: streaming produced **133 token events** whose concatenation exactly
equalled the persisted message; the reply embedded live context ("Level 5",
"12-day streak", "Sliding Window mastery 67%"); intents classified correctly
(study-plan, pattern); `/providers` reported mock available + OpenAI/others
unavailable; settings + conversation CRUD + validation (empty message → 400,
invalid model → 400) all passed.

---

## 11. Extension Points Prepared for Sprint 2 (Mentor Workspace & Context-Aware Chat)

- **Intent classifier is pluggable** — `IntentRouter.classify` is one method; an
  embedding/LLM classifier drops in behind it with no caller change.
- **Context sections are a registry** — add a section builder + map it to intents;
  specialised coaches (study-plan, contest, notebook) just request more sections.
- **Prompt templates are composable** — per-coach personas/directives slot into
  `templates.ts` without touching the builder.
- **Provider interface is the seam** — Anthropic/Gemini/Ollama fill in `generate`/
  `stream`; nothing else changes. `LLMResult` already carries everything.
- **Telemetry is already persisted** — `contextSnapshot` + token/time metadata on
  every message enable AI analytics with no migration.
- **Orchestrator is the single entry** — future AI features (proactive nudges,
  tools, multi-step) become new callers/options of `aiOrchestrator.chat`, not new
  chatbots.
- **Documented swaps**: in-memory rate-limit/context-cache → Redis for
  multi-instance; mock default → real provider by setting an API key.

---

## Verification

- `backend tsc` / `frontend tsc` → clean · `frontend vite build` → clean.
- `npm run test:ai` → **34 checks pass** — intent routing, context building
  (DTO-only), template prompt assembly, gateway fallback, response validation,
  non-streaming + streaming chat (streamed == persisted), conversation
  persistence/history/ownership, settings update + validation.
- `npm run test:smoke` (full integration) + Module 6 smokes → still pass (AI is
  additive).
- **Live end-to-end** (real mongod + seed + booted API): `/providers`,
  `/settings`, non-streaming `/chat` (context-aware), **SSE streaming** (133
  tokens, exact match), conversations CRUD, rename, delete, and validation all
  verified.

## Success Criteria — met

AI Platform Layer implemented ✓ · Orchestrator coordinates all requests ✓ · Intent
Router classifies ✓ · Context Builder generates structured context (no DB) ✓ ·
Prompt Builder is template-based ✓ · LLM Gateway abstracts providers ✓ ·
conversations stored ✓ · streaming chat works ✓ · settings configurable ✓ ·
components reusable ✓ · modular & production-ready ✓ · prepared for Sprint 2
without refactoring ✓.
