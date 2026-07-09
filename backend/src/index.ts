import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startRetentionJob, stopRetentionJob } from './jobs/retentionDecay.job.js';
import { startAnalyticsJob, stopAnalyticsJob } from './jobs/analyticsRefresh.job.js';
import { startReportJob, stopReportJob } from './jobs/reportGeneration.job.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`CP-OS API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Module 3 · Sprint 3 — start the independent background retention decay job.
  startRetentionJob();
  // Module 4 · Sprint 1 — start the independent analytics refresh job.
  startAnalyticsJob();
  // Module 4 · Sprint 4 — start the independent report generation job.
  startReportJob();

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    stopRetentionJob();
    stopAnalyticsJob();
    stopReportJob();
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during startup', err);
  process.exit(1);
});
