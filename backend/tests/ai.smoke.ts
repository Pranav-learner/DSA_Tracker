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
