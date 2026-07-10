import { Fragment, type ReactNode } from 'react';
import { CopyButton } from './CopyButton';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer — a lightweight, dependency-free Markdown renderer tuned for
 * chat: fenced code blocks (with language label + copy), inline code, headings,
 * bold/italic, links, blockquotes and lists. Deliberately hand-rolled to avoid
 * pulling a heavy markdown/highlighter bundle into the app; it covers what the
 * mentor actually emits and degrades gracefully on anything unrecognised.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return <div className={cn('space-y-3 text-sm leading-relaxed', className)}>{renderBlocks(content)}</div>;
}

/** Split content into blocks, pulling fenced code out first. */
function renderBlocks(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = content.split(/```/);
  // Even indices are prose, odd indices are code blocks (```lang\n...```).
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const newline = part.indexOf('\n');
      const lang = newline >= 0 ? part.slice(0, newline).trim() : '';
      const code = (newline >= 0 ? part.slice(newline + 1) : part).replace(/\n$/, '');
      nodes.push(<CodeBlock key={`code-${i}`} lang={lang} code={code} />);
    } else if (part.trim()) {
      nodes.push(...renderProse(part, i));
    }
  });
  return nodes;
}

/** Parse prose into headings / quotes / lists / paragraphs. */
function renderProse(text: string, base: number): ReactNode[] {
  const lines = text.replace(/\n{3,}/g, '\n\n').split('\n');
  const nodes: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = (k: string) => {
    if (para.length) {
      nodes.push(<p key={k}>{renderInline(para.join(' '))}</p>);
      para = [];
    }
  };
  const flushList = (k: string) => {
    if (list) {
      const items = list.items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>);
      nodes.push(
        list.ordered ? (
          <ol key={k} className="ml-5 list-decimal space-y-1">{items}</ol>
        ) : (
          <ul key={k} className="ml-5 list-disc space-y-1">{items}</ul>
        ),
      );
      list = null;
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `${base}-${idx}`;
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (heading) {
      flushPara(`p-${key}`); flushList(`l-${key}`);
      const level = heading[1].length;
      const size = level <= 1 ? 'text-base font-semibold' : level === 2 ? 'text-sm font-semibold' : 'text-sm font-medium';
      nodes.push(<p key={key} className={cn(size, 'mt-1')}>{renderInline(heading[2])}</p>);
    } else if (ordered) {
      flushPara(`p-${key}`);
      if (!list || !list.ordered) { flushList(`l-${key}`); list = { ordered: true, items: [] }; }
      list.items.push(ordered[1]);
    } else if (bullet) {
      flushPara(`p-${key}`);
      if (!list || list.ordered) { flushList(`l-${key}`); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
    } else if (quote) {
      flushPara(`p-${key}`); flushList(`l-${key}`);
      nodes.push(
        <blockquote key={key} className="border-l-2 border-primary/40 pl-3 text-muted-foreground">
          {renderInline(quote[1])}
        </blockquote>,
      );
    } else if (!line.trim()) {
      flushPara(`p-${key}`); flushList(`l-${key}`);
    } else {
      flushList(`l-${key}`);
      para.push(line);
    }
  });
  flushPara(`p-${base}-end`); flushList(`l-${base}-end`);
  return nodes;
}

/** Inline formatting: `code`, **bold**, *italic*, [text](url). */
function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.filter(Boolean).map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**')) return <strong key={i} className="font-semibold">{tok.slice(2, -2)}</strong>;
    if (tok.startsWith('*') && tok.endsWith('*')) return <em key={i} className="italic">{tok.slice(1, -1)}</em>;
    const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{tok}</Fragment>;
  });
}

/** A fenced code block with a language label + copy button. */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lang || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
