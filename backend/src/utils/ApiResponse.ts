/**
 * Standard success envelope so every endpoint returns a consistent shape:
 *   { success: true, data, meta? }
 * Error responses (produced by the error handler) mirror this with
 *   { success: false, error: { message, ... } }
 */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export function ok<T>(data: T, meta?: Record<string, unknown>): SuccessEnvelope<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}
