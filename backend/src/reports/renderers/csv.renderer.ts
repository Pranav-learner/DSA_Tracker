import type { ReportDTO } from '../dto/report.dto.js';

/** Escape a CSV cell (quote if it contains a comma, quote or newline). */
function cell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(cells: (string | number)[]): string {
  return cells.map(cell).join(',');
}

/**
 * Render a report's analytics tables as CSV (metrics + scores + trends +
 * distributions). CSV covers TABLES only — a flat, spreadsheet-friendly export.
 */
export function renderCsv(report: ReportDTO): string {
  const lines: string[] = [];
  const push = (section: string, cells: (string | number)[]) => lines.push(row([section, ...cells]));

  lines.push(row(['section', 'key', 'value', 'extra']));

  push('meta', ['title', report.meta.title, report.meta.periodLabel]);
  push('meta', ['generatedAt', report.meta.generatedAt, '']);

  const s = report.scores;
  for (const [k, v] of Object.entries(s)) push('score', [k, v, '']);

  for (const m of report.keyMetrics) push('metric', [m.label, m.value, m.hint ?? '']);

  for (const t of report.trends) push('trend', [t.label, `${t.current}${t.unit}`, `${t.direction} (${t.delta > 0 ? '+' : ''}${t.delta}${t.unit})`]);

  for (const d of report.overview.problems.platformDistribution) push('platform', [d.key, d.count, `${d.percent}%`]);
  for (const d of report.overview.problems.difficultyDistribution) push('difficulty', [d.key, d.count, `${d.percent}%`]);

  for (const p of report.overview.learning.phaseProgress) push('phase', [p.title, `${p.completionPercent}%`, `${p.topicsCompleted}/${p.topicsTotal}`]);

  for (const w of report.weaknesses) push('weakness', [w.title, w.severity, w.metric]);
  for (const st of report.strengths) push('strength', [st.title, st.value, st.metric]);

  return lines.join('\n');
}
