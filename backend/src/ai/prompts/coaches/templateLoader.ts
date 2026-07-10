import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { logger } from '../../../utils/logger.js';

/**
 * Coach prompt-template loader (Module 7 · Sprint 3). Coach prompts live as
 * EXTERNAL Markdown files (study.md, revision.md, …) — never embedded in
 * TypeScript. This loads them once, caches them, and derives a stable
 * `promptVersion` from the content so the API can expose which template version
 * produced a response (and future sprints can A/B templates without code changes).
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Resolve a template file, tolerating dev (src) vs built (dist) layouts. */
function resolveTemplatePath(file: string): string {
  const candidates = [
    path.join(HERE, file),
    // When running from dist/ but the source tree is present, fall back to src/.
    path.join(HERE.replace(`${path.sep}dist${path.sep}`, `${path.sep}src${path.sep}`), file),
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0];
}

/** Tiny deterministic string hash → 8-char hex, for prompt versioning. */
function hash8(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface LoadedTemplate {
  /** File basename without extension (e.g. 'study'). */
  name: string;
  body: string;
  /** Content-derived version, e.g. 'v1-1a2b3c4d'. */
  version: string;
}

const cache = new Map<string, LoadedTemplate>();

/**
 * Load a coach template by name (e.g. 'study'). Cached after first read. Throws a
 * clear error if the template is missing — coaches surface this as a graceful
 * "prompt template error".
 */
export function loadCoachTemplate(name: string): LoadedTemplate {
  const cached = cache.get(name);
  if (cached) return cached;

  const file = resolveTemplatePath(`${name}.md`);
  if (!existsSync(file)) {
    logger.error(`Coach prompt template '${name}.md' not found (looked in ${HERE})`);
    throw new Error(`Coach prompt template '${name}' is missing`);
  }
  const body = readFileSync(file, 'utf8').trim();
  const loaded: LoadedTemplate = { name, body, version: `v1-${hash8(body)}` };
  cache.set(name, loaded);
  return loaded;
}
