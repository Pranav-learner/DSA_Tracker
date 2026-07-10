/**
 * Module 7 · Sprint 1 — AI Platform smoke test.
 *
 * Drives the full pipeline (IntentRouter → ContextBuilder → PromptBuilder →
 * LLMGateway → MockProvider → ResponseValidator → ConversationService) end-to-end
 * with the offline mock provider — no API keys, no network. Also seeds a minimal
 * learner so the ContextBuilder has real DTOs to summarise.
 * Run with: npx tsx tests/ai.smoke.ts
 */
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { intentRouterService } from '../src/ai/router/intentRouter.service.js';
import { contextBuilderService } from '../src/ai/context/contextBuilder.service.js';
import { contextComposerService } from '../src/ai/context/contextComposer.service.js';
import { workspaceService } from '../src/ai/services/workspace.service.js';
import { suggestionService } from '../src/ai/services/suggestion.service.js';
import { coachRegistry } from '../src/ai/coaches/index.js';
import { aiOperatingSystem } from '../src/ai/os/aiOperatingSystem.js';
import { promptBuilderService } from '../src/ai/prompts/promptBuilder.service.js';
import { aiOrchestratorService } from '../src/ai/orchestrator/aiOrchestrator.service.js';
import { conversationService } from '../src/ai/services/conversation.service.js';
import { aiSettingsService } from '../src/ai/services/aiSettings.service.js';
import { llmGateway } from '../src/ai/services/llmGateway.js';
import { responseValidator } from '../src/ai/services/responseValidator.js';
import { providerRegistry } from '../src/ai/providers/registry.js';
import { AIError } from '../src/ai/types/ai.types.js';
import { activityService } from '../src/services/activity.service.js';
import { learningRepository } from '../src/repositories/learning.repository.js';

const USER = 'ai-smoke';
let pass = 0;
function check(label: string, cond: boolean): void {
  assert.ok(cond, `FAILED: ${label}`);
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri('cp_os_ai'));

  try {
    // Minimal learner footprint so ContextBuilder produces sections.
    await learningRepository.upsert(USER, { lastActiveAt: new Date() });
    await activityService.record(USER, { type: 'problem-solved', entityType: 'problem', entityId: 'p1', title: 'Solved Two Sum', description: '' });

    // ── 1. Intent Router (rule-based) ──────────────────────────────────
    check('classifies contest intent', intentRouterService.classify('How do I improve my Codeforces rating?') === 'contest');
    check('classifies revision intent', intentRouterService.classify('What should I revise today?') === 'revision');
    check('classifies pattern intent', intentRouterService.classify('Explain the sliding window pattern') === 'pattern');
    check('classifies study-plan intent', intentRouterService.classify('What should I learn next?') === 'study-plan');
    check('empty message → unknown', intentRouterService.classify('   ') === 'unknown');
    check('plain greeting → general', intentRouterService.classify('hey there') === 'general');

    // ── 2. Context Builder (DTO-derived, never raw models) ─────────────
    const ctx = await contextBuilderService.build(USER, 'study-plan');
    check('context has a learner-profile section', ctx.sections.some((s) => s.key === 'learner-profile'));
    check('context is intent-scoped (learning-plan for study-plan)', ctx.sections.some((s) => s.key === 'learning-plan'));
    check('context reports a token estimate', ctx.tokenEstimate > 0);
    check('context summaries are strings (no raw models)', ctx.sections.every((s) => typeof s.summary === 'string'));

    // ── 3. Prompt Builder (template-based) ─────────────────────────────
    const prompt = promptBuilderService.build({ context: ctx, history: [], userMessage: 'Plan my week' });
    check('prompt starts with a system message', prompt[0].role === 'system');
    check('system prompt embeds the CONTEXT block', prompt[0].content.includes('CONTEXT'));
    check('prompt ends with the user message', prompt[prompt.length - 1].role === 'user');

    // ── 4. Gateway + providers + fallback ──────────────────────────────
    check('registry describes all 5 providers', providerRegistry.describeAll().length === 5);
    check('mock provider is always available', providerRegistry.get('mock')!.isAvailable());
    check('anthropic is a placeholder (unavailable)', !providerRegistry.get('anthropic')!.isAvailable());
    const resolved = llmGateway.resolve('anthropic');
    check('gateway falls back from an unavailable provider', resolved.fellBack && resolved.id === 'mock');

    // ── 5. Response Validator ──────────────────────────────────────────
    let threw = false;
    try {
      responseValidator.validate({ content: '', usage: { promptTokens: 1, completionTokens: 0, totalTokens: 1 }, model: 'x', provider: 'mock', finishReason: 'stop', responseTimeMs: 1 });
    } catch (e) {
      threw = e instanceof AIError && e.code === 'empty_response';
    }
    check('validator rejects an empty response', threw);

    // ── 6. Orchestrator: non-streaming chat end-to-end ─────────────────
    const settings = await aiSettingsService.get(USER);
    check('default settings resolve to the mock provider (no key)', settings.preferredProvider === 'mock');

    const r1 = await aiOrchestratorService.chat(USER, { message: 'Explain the sliding window pattern' });
    check('chat returns an assistant message with content', r1.assistantMessage.content.length > 0);
    check('chat classified the pattern intent', r1.intent === 'pattern');
    check('assistant message carries token usage', r1.assistantMessage.usage.totalTokens > 0);
    check('assistant message carries provider + model', r1.assistantMessage.provider === 'mock' && Boolean(r1.assistantMessage.model));
    check('assistant message carries a context snapshot', r1.assistantMessage.context?.intent === 'pattern');
    check('a conversation was created', Boolean(r1.conversationId));

    // ── 7. Streaming chat accumulates the same content ─────────────────
    let streamed = '';
    let tokenCount = 0;
    const r2 = await aiOrchestratorService.chat(
      USER,
      { conversationId: r1.conversationId, message: 'Give me a follow-up tip' },
      { onToken: (d) => { streamed += d; tokenCount += 1; } },
    );
    check('streaming emitted multiple tokens', tokenCount > 3);
    check('streamed text equals the final content', streamed === r2.assistantMessage.content);

    // ── 8. Conversation persistence + history + ownership ──────────────
    const detail = await conversationService.get(USER, r1.conversationId);
    check('conversation stored all 4 turns (2 user + 2 assistant)', detail.messages.length === 4);
    check('history window returns prior turns', (await conversationService.history(r1.conversationId)).length === 4);

    const list = await conversationService.list(USER);
    check('conversation appears in the user list', list.some((c) => c.id === r1.conversationId));

    let owned = false;
    try {
      await conversationService.get('someone-else', r1.conversationId);
    } catch {
      owned = true;
    }
    check('another user cannot read the conversation (ownership)', owned);

    await conversationService.remove(USER, r1.conversationId);
    check('deleting a conversation removes it', (await conversationService.list(USER)).length === 0);

    // ── 9. Settings update + validation ────────────────────────────────
    const updated = await aiSettingsService.update(USER, { temperature: 0.3, maxTokens: 512 });
    check('settings update persists', updated.temperature === 0.3 && updated.maxTokens === 512);
    let rejected = false;
    try {
      await aiSettingsService.update(USER, { preferredProvider: 'openai', preferredModel: 'not-a-real-model' });
    } catch {
      rejected = true;
    }
    check('settings reject an invalid model for a provider', rejected);

    // ── 10. Context Intelligence: composer + profiles + preview ────────
    const composed = await contextComposerService.compose(USER, { intent: 'study-plan' });
    check('composer merges the study-plan profiles', composed.profiles.includes('learning') && composed.profiles.includes('gamification'));
    check('composer always includes the core learner-profile', composed.sections.some((s) => s.key === 'learner-profile'));

    const excluded = await contextComposerService.compose(USER, { intent: 'study-plan', excludeSections: ['learning-plan'] });
    check('composer honours excluded sections', !excluded.sections.some((s) => s.key === 'learning-plan'));

    const preview = await contextComposerService.preview(USER, { intent: 'study-plan', excludeSections: ['learning-plan'] });
    check('preview marks the core section as non-optional', preview.sections.find((s) => s.key === 'learner-profile')?.optional === false);
    check('preview marks an excluded optional section as not included', preview.sections.find((s) => s.key === 'learning-plan')?.included === false);
    check('preview reports an included-token total', preview.includedTokens > 0);

    // ── 11. Slash-command intent override in chat ──────────────────────
    const overridden = await aiOrchestratorService.chat(USER, { message: 'help me', intent: 'contest', profiles: ['contest', 'gamification'] });
    check('chat honours the slash-command intent override', overridden.intent === 'contest');
    check('chat records the profiles used', overridden.profiles.includes('contest'));

    // ── 12. Workspace + personalised suggestions ───────────────────────
    const snapshot = await workspaceService.getSnapshot(USER);
    check('snapshot exposes streak + revision + recommendation shape', typeof snapshot.currentStreak === 'number' && typeof snapshot.revisionDue === 'number');
    const suggestions = suggestionService.generate(snapshot);
    check('suggestions are generated (and mapped to intents)', suggestions.length > 0 && suggestions.every((s) => Boolean(s.intent)));
    const workspace = await workspaceService.getWorkspace(USER);
    check('workspace bundles snapshot + suggestions + quick actions', Boolean(workspace.snapshot) && workspace.suggestions.length > 0 && workspace.quickActions.length > 0);

    // ── 13. Conversation intelligence: pin / archive / search / export ──
    const conv = await conversationService.create(USER, 'Sliding window deep dive');
    await conversationService.update(USER, conv.id, { pinned: true });
    const pinned = (await conversationService.list(USER)).find((c) => c.id === conv.id);
    check('a conversation can be pinned', pinned?.pinned === true);

    await conversationService.update(USER, conv.id, { archived: true });
    check('archived conversations are hidden by default', !(await conversationService.list(USER)).some((c) => c.id === conv.id));
    check('archived conversations show when requested', (await conversationService.list(USER, { includeArchived: true })).some((c) => c.id === conv.id));

    const found = await conversationService.search(USER, 'sliding window');
    check('conversation search finds by title', found.some((c) => c.id === conv.id));

    // Chat into a conversation, then export + check metadata was recorded.
    const chatForExport = await aiOrchestratorService.chat(USER, { message: 'Explain two pointers' });
    const md = await conversationService.export(USER, chatForExport.conversationId, 'markdown');
    check('markdown export contains the mentor turns', md.content.includes('## Mentor') && md.filename.endsWith('.md'));
    const json = await conversationService.export(USER, chatForExport.conversationId, 'json');
    check('json export is valid + excludes internal context', !json.content.includes('contextSnapshot') && JSON.parse(json.content).messages.length === 2);
    const metaConv = (await conversationService.list(USER)).find((c) => c.id === chatForExport.conversationId);
    check('conversation metadata (lastIntent/tokens) is recorded', Boolean(metaConv?.lastIntent) && (metaConv?.totalTokens ?? 0) > 0);

    // ── 14. Sprint 3: Specialized Coaching Framework ──
    check('registry resolves study intent → StudyCoach', coachRegistry.resolve({ intent: 'study-plan' })?.id === 'study');
    check('registry resolves revision intent → RevisionCoach', coachRegistry.resolveByIntent('revision')?.id === 'revision');
    check('registry resolves contest/pattern/notebook/interview', ['contest', 'pattern', 'notebook', 'interview'].every((i) => coachRegistry.resolveByIntent(i as never)?.id === i));
    check('StudyCoach is the fallback for general/unknown/analytics', ['general', 'unknown', 'analytics'].every((i) => coachRegistry.resolveByIntent(i as never)?.id === 'study'));
    check('all six coaches are registered', coachRegistry.all().length === 6);
    check('every coach exposes a prompt version from an external template', coachRegistry.all().every((c) => /^v1-[0-9a-f]{8}$/.test(c.promptVersion)));
    check('coach metadata lists outputs + supported intents', coachRegistry.all().every((c) => c.meta().outputs.length > 0 && c.meta().supportedIntents.length > 0));

    const studyCoach = coachRegistry.get('study')!;
    const coachRes = await studyCoach.handle(USER, { message: 'What should I study today?' });
    check('coach returns a structured response (summary + explanation)', coachRes.summary.length > 0 && coachRes.explanation.length > 0);
    check('coach response is typed with confidence 0-100', coachRes.confidence >= 0 && coachRes.confidence <= 100);
    check('coach records sources used (context section titles)', Array.isArray(coachRes.sourcesUsed) && coachRes.sourcesUsed.length > 0);
    check('coach suggested actions deep-link into CP-OS', coachRes.suggestedActions.length > 0 && coachRes.suggestedActions.every((a) => a.to.startsWith('/') || Boolean(a.intent)));
    check('coach exposes follow-up questions', coachRes.followUpQuestions.length > 0);
    check('coach persisted a conversation with a coach-tagged turn', Boolean(coachRes.conversationId) && coachRes.assistantMessage.role === 'assistant');
    check('coach carries provider + model + prompt version', Boolean(coachRes.provider) && Boolean(coachRes.model) && coachRes.promptVersion === studyCoach.promptVersion);

    // Context spec is honoured: study coach draws on the learning profile.
    const studyCtx = await studyCoach.buildContext(USER, {});
    check('coach buildContext includes the required learner-profile section', studyCtx.sections.some((s) => s.key === 'learner-profile'));
    check('coach context stays within its token budget', studyCtx.tokenEstimate <= studyCoach.contextSpec.maxContextTokens);

    // Streaming coach turn.
    let coachTokens = 0;
    const coachStreamed = await coachRegistry.get('revision')!.handle(USER, { message: 'Summarize my revision backlog' }, { onToken: () => { coachTokens += 1; } });
    check('coach streaming emits tokens and a final structured result', coachTokens > 0 && coachStreamed.explanation.length > 0 && coachStreamed.coachId === 'revision');

    // ── 15. Sprint 4: AI Operating System ──
    const actions = await aiOperatingSystem.actions(USER);
    check('action generator produces deep-linked CP-OS actions', actions.length > 0 && actions.every((a) => a.to.startsWith('/') || Boolean(a.intent)));

    const previews = await aiOperatingSystem.previewWorkflows(USER);
    check('workflow engine builds all six workflows', previews.length === 6);
    const study = previews.find((w) => w.key === 'study-session')!;
    check('a workflow is a sequence of suggested steps with modules', study.steps.length > 0 && study.modules.length > 0 && study.estimatedMinutes > 0);
    check('workflow steps carry deep-link actions or coach intents', study.steps.every((s) => (s.action ? s.action.to.startsWith('/') : true)));

    const savedWf = await aiOperatingSystem.generateWorkflow(USER, 'revision-session', { save: true });
    check('a generated workflow can be saved (persisted)', Boolean(savedWf.id) && savedWf.status === 'generated');
    const wfList = await aiOperatingSystem.listWorkflows(USER);
    check('saved workflows are listed', wfList.some((w) => w.id === savedWf.id));
    const startedWf = await aiOperatingSystem.updateWorkflowStatus(USER, savedWf.id, 'started');
    check('workflow status transitions (learner-driven)', startedWf.status === 'started');

    const recs = await aiOperatingSystem.recommendations(USER);
    check('recommendations are generated with a stable key + status', recs.length > 0 && recs.every((r) => Boolean(r.key)) && recs.every((r) => r.status === 'generated' || r.status === 'viewed' || r.status === 'accepted'));
    // Regenerating does NOT duplicate (upsert by key).
    const recs2 = await aiOperatingSystem.recommendations(USER);
    check('regenerating recommendations does not duplicate (upsert by key)', recs2.length === recs.length);

    const target = recs[0];
    const accepted = await aiOperatingSystem.updateRecommendation(USER, target.id, 'accepted');
    check('recommendation lifecycle: accepted stamps acceptedAt', accepted.status === 'accepted' && Boolean(accepted.acceptedAt));
    const completed = await aiOperatingSystem.updateRecommendation(USER, target.id, 'completed');
    check('recommendation lifecycle: completed stamps completedAt', completed.status === 'completed' && Boolean(completed.completedAt));
    const stats = await aiOperatingSystem.recommendationStats(USER);
    check('recommendation effectiveness stats roll up', typeof stats.total === 'number' && stats.completed >= 1);

    const brief = await aiOperatingSystem.brief(USER, 'daily');
    check('mentor brief is generated on demand with focus + sections', Boolean(brief.headline) && Boolean(brief.todaysFocus) && brief.sections.length > 0);
    check('mentor brief suggests a workflow + quick-start actions', Boolean(brief.suggestedWorkflow) && brief.quickStart.length > 0);
    const revBrief = await aiOperatingSystem.brief(USER, 'revision');
    check('briefs vary by kind', revBrief.kind === 'revision' && revBrief.title.includes('Revision'));

    const timeline = await aiOperatingSystem.timeline(USER, {});
    check('mentor timeline aggregates recommendations + sessions + workflows', timeline.length > 0 && timeline.some((e) => e.type === 'workflow') && timeline.some((e) => e.type === 'recommendation'));
    const searched = await aiOperatingSystem.timeline(USER, { q: 'revision' });
    check('mentor timeline is searchable', searched.every((e) => `${e.title} ${e.description}`.toLowerCase().includes('revision')));

    const overview = await aiOperatingSystem.overview(USER);
    check('AI OS overview bundles brief + workflows + recommendations + actions', Boolean(overview.brief) && overview.workflows.length === 6 && overview.actions.length > 0);

    // Conversation continuity: summary + tags.
    const summarized = await conversationService.summarize(USER, chatForExport.conversationId);
    check('conversation can be compressed into a summary', Boolean(summarized.summary));
    const tagged = await conversationService.update(USER, chatForExport.conversationId, { tags: ['DP', 'graphs', 'dp'] });
    check('conversation tags are normalised + deduped', tagged.tags.includes('dp') && tagged.tags.includes('graphs') && tagged.tags.length === 2);

    console.log(`\n✅ AI platform smoke test passed — ${pass} checks.`);
  } finally {
    await disconnectDatabase();
    await mongo.stop();
  }
}

main().catch((err) => {
  console.error('\n❌ AI platform smoke test FAILED:', err);
  process.exit(1);
});
