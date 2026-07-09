import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startRetentionJob, stopRetentionJob } from './jobs/retentionDecay.job.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`CP-OS API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Module 3 · Sprint 3 — start the independent background retention decay job.
  startRetentionJob();

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    stopRetentionJob();
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
