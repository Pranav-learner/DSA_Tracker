import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated environment configuration.
 * Fails fast if a required variable is missing.
 */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/cp_os'),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  /**
   * Single-user scope for Sprint 3 (auth arrives later). All learning data —
   * TopicProgress, LearningState — is keyed by this id. Swapping to real
   * per-user auth becomes a repository-layer change only.
   */
  demoUserId: process.env.DEMO_USER_ID ?? 'demo-user',
  get isProd() {
    return this.nodeEnv === 'production';
  },
} as const;
