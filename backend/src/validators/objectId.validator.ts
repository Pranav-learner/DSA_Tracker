import { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/**
 * Validates a Mongo ObjectId, throwing a 400 on malformed input.
 * Keeps controllers free of validation branching.
 */
export function assertObjectId(id: string, label = 'id'): string {
  if (!isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}: '${id}' is not a valid ObjectId`);
  }
  return id;
}
