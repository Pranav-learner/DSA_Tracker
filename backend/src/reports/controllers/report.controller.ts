import type { Request, Response } from 'express';
import { reportService } from '../services/report.service.js';
import { parseExportParams } from '../validators/report.validator.js';
import { renderMarkdown } from '../renderers/markdown.renderer.js';
import { renderCsv } from '../renderers/csv.renderer.js';
import { renderPdf } from '../renderers/pdf.renderer.js';
import { analyticsOk } from '../../analytics/utils/analyticsResponse.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { ReportDTO } from '../dto/report.dto.js';
import type { ReportType } from '../../config/reports.js';

/** Resolve a report by type (used by both the JSON endpoints and exports). */
function resolveReport(userId: string, type: ReportType, phaseId?: string): Promise<ReportDTO> {
  switch (type) {
    case 'weekly':
      return reportService.weekly(userId);
    case 'monthly':
      return reportService.monthly(userId);
    case 'phase':
      return reportService.phase(userId, phaseId as string);
    case 'summary':
    default:
      return reportService.summary(userId);
  }
}

/* ------------------------------- reports -------------------------------- */

export const getWeekly = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.weekly(currentUserId(req));
  res.status(200).json(analyticsOk(data, { kind: 'weekly' }, 'Weekly report'));
});

export const getMonthly = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.monthly(currentUserId(req));
  res.status(200).json(analyticsOk(data, { kind: 'monthly' }, 'Monthly report'));
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.summary(currentUserId(req));
  res.status(200).json(analyticsOk(data, { kind: 'summary' }, 'Learning summary'));
});

export const getPhaseReport = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.phase(currentUserId(req), req.params.phaseId);
  res.status(200).json(analyticsOk(data, { kind: 'phase', phaseId: req.params.phaseId }, 'Phase report'));
});

/* ------------------------------- exports -------------------------------- */

function fileName(report: ReportDTO, ext: string): string {
  return `cp-os-${report.meta.kind}-report.${ext}`;
}

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const { type, phaseId } = parseExportParams(req.query);
  const report = await resolveReport(currentUserId(req), type, phaseId);
  const buffer = await renderPdf(report);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName(report, 'pdf')}"`);
  res.status(200).send(buffer);
});

export const exportMarkdown = asyncHandler(async (req: Request, res: Response) => {
  const { type, phaseId } = parseExportParams(req.query);
  const report = await resolveReport(currentUserId(req), type, phaseId);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName(report, 'md')}"`);
  res.status(200).send(renderMarkdown(report));
});

export const exportJson = asyncHandler(async (req: Request, res: Response) => {
  const { type, phaseId } = parseExportParams(req.query);
  const report = await resolveReport(currentUserId(req), type, phaseId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName(report, 'json')}"`);
  res.status(200).send(JSON.stringify(report, null, 2));
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { type, phaseId } = parseExportParams(req.query);
  const report = await resolveReport(currentUserId(req), type, phaseId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName(report, 'csv')}"`);
  res.status(200).send(renderCsv(report));
});
