/**
 * AI Platform Layer (Module 7 · Sprint 1) — the public surface of the AI module.
 *
 * The module is isolated from business modules: it CONSUMES their services (via
 * the ContextBuilder) but owns no learning logic and never touches their data
 * directly. Everything funnels through the AIOrchestrator pipeline, so future AI
 * features become new callers of this layer, not new chatbots.
 */
export { aiRouter } from './routes/ai.routes.js';
