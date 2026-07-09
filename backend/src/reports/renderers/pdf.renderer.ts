import PDFDocument from 'pdfkit';
import type { PhaseReportDTO, ReportDTO } from '../dto/report.dto.js';

const ACCENT = '#6366f1';
const MUTED = '#6b7280';
const DARK = '#111827';
const TRACK = '#e5e7eb';
const GOOD = '#16a34a';
const WARN = '#d97706';
const BAD = '#dc2626';

const MARGIN = 48;

function toneColor(score: number): string {
  if (score >= 80) return GOOD;
  if (score >= 60) return ACCENT;
  if (score >= 40) return WARN;
  return BAD;
}

function isPhase(r: ReportDTO): r is PhaseReportDTO {
  return r.meta.kind === 'phase';
}

/**
 * Render a report to a PDF Buffer with pdfkit (pure server-side, no browser).
 * Charts are drawn as simple proportional bars ("where possible"); the layout is
 * a clean, printable, shareable document.
 */
export function renderPdf(report: ReportDTO): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: report.meta.title } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width - MARGIN * 2;

    const heading = (text: string) => {
      doc.moveDown(0.8);
      doc.fillColor(ACCENT).fontSize(13).font('Helvetica-Bold').text(text);
      doc.moveDown(0.3);
      doc.fillColor(DARK).font('Helvetica').fontSize(10);
    };

    const bar = (label: string, value: number, suffix = '%') => {
      const y = doc.y;
      const labelW = 150;
      const barX = MARGIN + labelW;
      const barW = width - labelW - 44;
      doc.fillColor(DARK).fontSize(9).font('Helvetica').text(label, MARGIN, y + 1, { width: labelW - 8 });
      doc.roundedRect(barX, y, barW, 8, 4).fill(TRACK);
      doc.roundedRect(barX, y, Math.max(2, (barW * Math.max(0, Math.min(100, value))) / 100), 8, 4).fill(toneColor(value));
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`${value}${suffix}`, barX + barW + 6, y, { width: 40 });
      doc.y = y + 16;
    };

    // Header
    doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold').text(report.meta.title);
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(`${report.meta.periodLabel} · generated ${report.meta.generatedAt.slice(0, 10)}`);
    doc.moveDown(0.6);
    doc.moveTo(MARGIN, doc.y).lineTo(doc.page.width - MARGIN, doc.y).strokeColor(TRACK).stroke();
    doc.moveDown(0.6);

    // Summary
    doc.fillColor(DARK).fontSize(10.5).font('Helvetica').text(report.summary, { align: 'left' });

    // Executive scores
    heading('Executive Scores');
    bar('Overall Readiness', report.scores.overallReadiness);
    bar('Learning', report.scores.learning);
    bar('Knowledge', report.scores.knowledge);
    bar('Retention', report.scores.retention);
    bar('Revision', report.scores.revision);
    bar('Productivity', report.scores.productivity);

    if (isPhase(report)) {
      heading('Phase');
      doc.fontSize(10).text(`${report.phase.title} — ${report.phase.completionPercent}% complete · ${report.phase.topicsCompleted}/${report.phase.topicsTotal} topics`);
      bar('Estimated readiness', report.estimatedReadiness);
      doc.fillColor(MUTED).fontSize(9).text(`Readiness: ${report.readinessLabel}`);
      doc.fillColor(DARK);
    }

    // Key metrics (two columns)
    heading('Key Metrics');
    const colW = width / 2;
    let mi = 0;
    for (const m of report.keyMetrics) {
      const col = mi % 2;
      const rowY = doc.y;
      const x = MARGIN + col * colW;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(m.label.toUpperCase(), x, rowY, { width: colW - 10 });
      doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text(m.value, x, rowY + 10, { width: colW - 10 });
      if (col === 1 || mi === report.keyMetrics.length - 1) doc.y = rowY + 30;
      else doc.y = rowY;
      mi += 1;
    }

    const bullets = (title: string, items: string[]) => {
      if (items.length === 0) return;
      heading(title);
      doc.fontSize(9.5).font('Helvetica');
      for (const it of items) doc.fillColor(DARK).text(`•  ${it}`, { width, indent: 2 });
    };

    bullets('Achievements', report.achievements.map((a) => `${a.title} — ${a.description}`));
    bullets('Strengths', report.strengths.slice(0, 8).map((s) => `${s.title} — ${s.detail}`));
    bullets('Weaknesses', report.weaknesses.slice(0, 8).map((w) => `[${w.severity}] ${w.title} — ${w.detail}`));
    bullets('Recommendations', report.recommendations.map((r) => `[${r.priority}] ${r.suggestedAction}: ${r.reason} (~${r.estimatedTimeMinutes}m)`));
    bullets('Next Goals', report.nextGoals);

    // Footer
    doc.moveDown(1);
    doc.moveTo(MARGIN, doc.y).lineTo(doc.page.width - MARGIN, doc.y).strokeColor(TRACK).stroke();
    doc.moveDown(0.4);
    doc.fillColor(MUTED).fontSize(8).text('CP-OS — Analytics & Insights Engine', { align: 'center' });

    doc.end();
  });
}
