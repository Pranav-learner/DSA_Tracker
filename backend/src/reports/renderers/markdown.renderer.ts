import type { PhaseReportDTO, ReportDTO } from '../dto/report.dto.js';

function isPhase(r: ReportDTO): r is PhaseReportDTO {
  return r.meta.kind === 'phase';
}

/** Render a report as clean, shareable Markdown. */
export function renderMarkdown(report: ReportDTO): string {
  const L: string[] = [];
  const s = report.scores;

  L.push(`# ${report.meta.title}`);
  L.push('');
  L.push(`*${report.meta.periodLabel} · generated ${report.meta.generatedAt.slice(0, 10)}*`);
  L.push('');
  L.push('## Summary');
  L.push(report.summary);
  L.push('');

  L.push('## Executive Scores');
  L.push('| Score | Value |');
  L.push('| --- | --- |');
  L.push(`| Overall Readiness | ${s.overallReadiness}% |`);
  L.push(`| Learning | ${s.learning}% |`);
  L.push(`| Knowledge | ${s.knowledge}% |`);
  L.push(`| Retention | ${s.retention}% |`);
  L.push(`| Revision | ${s.revision}% |`);
  L.push(`| Productivity | ${s.productivity}% |`);
  L.push('');

  if (isPhase(report)) {
    L.push('## Phase');
    L.push(`**${report.phase.title}** — ${report.phase.completionPercent}% complete · ${report.phase.topicsCompleted}/${report.phase.topicsTotal} topics · readiness **${report.readinessLabel}** (${report.estimatedReadiness}%)`);
    L.push('');
  }

  L.push('## Key Metrics');
  L.push('| Metric | Value | Note |');
  L.push('| --- | --- | --- |');
  for (const m of report.keyMetrics) L.push(`| ${m.label} | ${m.value} | ${m.hint ?? ''} |`);
  L.push('');

  if (report.achievements.length) {
    L.push('## Achievements');
    for (const a of report.achievements) L.push(`- **${a.title}** — ${a.description}`);
    L.push('');
  }

  L.push('## Trends');
  L.push('| Metric | Previous | Current | Direction |');
  L.push('| --- | --- | --- | --- |');
  for (const t of report.trends) L.push(`| ${t.label} | ${t.previous}${t.unit} | ${t.current}${t.unit} | ${t.direction} |`);
  L.push('');

  if (report.strengths.length) {
    L.push('## Strengths');
    for (const st of report.strengths.slice(0, 8)) L.push(`- ${st.title} — ${st.detail}`);
    L.push('');
  }

  if (report.weaknesses.length) {
    L.push('## Weaknesses');
    for (const w of report.weaknesses.slice(0, 8)) L.push(`- **[${w.severity}]** ${w.title} — ${w.detail}`);
    L.push('');
  }

  if (report.recommendations.length) {
    L.push('## Recommendations');
    for (const r of report.recommendations) L.push(`- **[${r.priority}]** ${r.suggestedAction}: ${r.reason} _(~${r.estimatedTimeMinutes}m, ${r.learningImpact} impact)_`);
    L.push('');
  }

  if (report.nextGoals.length) {
    L.push('## Next Goals');
    for (const g of report.nextGoals) L.push(`- ${g}`);
    L.push('');
  }

  L.push('---');
  L.push('*CP-OS — Analytics & Insights Engine*');
  return L.join('\n');
}
