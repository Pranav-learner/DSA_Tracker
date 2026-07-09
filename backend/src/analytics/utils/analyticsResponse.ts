/**
 * Analytics response wrapper — a consistent envelope across every analytics API:
 *   { success, status, message, timestamp, data, metadata }
 *
 * It is a strict SUPERSET of the app-wide `{ success, data }` envelope, so the
 * existing frontend client keeps working unchanged while analytics consumers get
 * the richer `status/message/timestamp/metadata` fields.
 */
export interface AnalyticsEnvelope<T> {
  success: true;
  status: 'success';
  message: string;
  timestamp: string;
  data: T;
  metadata: Record<string, unknown>;
}

export function analyticsOk<T>(
  data: T,
  metadata: Record<string, unknown> = {},
  message = 'OK',
): AnalyticsEnvelope<T> {
  return {
    success: true,
    status: 'success',
    message,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  };
}
