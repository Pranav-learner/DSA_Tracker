import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/** Catches unmatched routes and forwards a 404 to the error handler. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
