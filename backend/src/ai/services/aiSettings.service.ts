import { aiSettingsRepository } from '../repositories/aiSettings.repository.js';
import { providerRegistry } from '../providers/registry.js';
import { AI_DEFAULTS, AI_LIMITS, PROVIDER_CATALOGUE } from '../../config/ai.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AISettingsDocument } from '../../models/AISettings.js';
import type { AISettingsDTO } from '../dto/ai.dto.js';
import type { ProviderId } from '../types/ai.types.js';

/** Fields a client may update. */
export interface UpdateSettingsInput {
  preferredProvider?: ProviderId;
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
  streamingEnabled?: boolean;
}

function toDTO(doc: AISettingsDocument): AISettingsDTO {
  return {
    preferredProvider: doc.preferredProvider,
    preferredModel: doc.preferredModel,
    temperature: doc.temperature,
    maxTokens: doc.maxTokens,
    streamingEnabled: doc.streamingEnabled,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

/**
 * AISettingsService — the user's AI preferences, defaulted from config. Validates
 * that a chosen provider/model actually exist in the catalogue before persisting,
 * so the pipeline can trust the stored values.
 */
export const aiSettingsService = {
  /** Get settings, creating a default row from platform config on first access. */
  async get(userId: string): Promise<AISettingsDTO> {
    const existing = await aiSettingsRepository.findByUser(userId);
    if (existing) return toDTO(existing);
    const created = await aiSettingsRepository.upsert(userId, {
      preferredProvider: AI_DEFAULTS.provider,
      preferredModel: AI_DEFAULTS.model,
      temperature: AI_DEFAULTS.temperature,
      maxTokens: AI_DEFAULTS.maxTokens,
      streamingEnabled: AI_DEFAULTS.streamingEnabled,
    });
    return toDTO(created);
  },

  /** Resolve the effective, validated settings used to build a request. */
  async resolve(userId: string): Promise<Required<Omit<AISettingsDTO, 'updatedAt'>>> {
    const dto = await this.get(userId);
    return {
      preferredProvider: dto.preferredProvider,
      preferredModel: dto.preferredModel,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      streamingEnabled: dto.streamingEnabled,
    };
  },

  async update(userId: string, input: UpdateSettingsInput): Promise<AISettingsDTO> {
    const update: UpdateSettingsInput = { ...input };

    if (input.preferredProvider && !providerRegistry.get(input.preferredProvider)) {
      throw ApiError.badRequest(`Unknown provider '${input.preferredProvider}'`);
    }
    // If provider changed but no model given, snap to that provider's default.
    if (input.preferredProvider && !input.preferredModel) {
      update.preferredModel = PROVIDER_CATALOGUE[input.preferredProvider].models[0].id;
    }
    if (input.preferredModel) {
      const provider = input.preferredProvider ?? (await this.get(userId)).preferredProvider;
      const models = PROVIDER_CATALOGUE[provider].models.map((m) => m.id);
      if (!models.includes(input.preferredModel)) {
        throw ApiError.badRequest(`Model '${input.preferredModel}' is not valid for provider '${provider}'`);
      }
    }
    if (input.temperature !== undefined && (input.temperature < AI_LIMITS.minTemperature || input.temperature > AI_LIMITS.maxTemperature)) {
      throw ApiError.badRequest(`temperature must be between ${AI_LIMITS.minTemperature} and ${AI_LIMITS.maxTemperature}`);
    }
    if (input.maxTokens !== undefined && (input.maxTokens < AI_LIMITS.minMaxTokens || input.maxTokens > AI_LIMITS.maxMaxTokens)) {
      throw ApiError.badRequest(`maxTokens must be between ${AI_LIMITS.minMaxTokens} and ${AI_LIMITS.maxMaxTokens}`);
    }

    const doc = await aiSettingsRepository.upsert(userId, update);
    return toDTO(doc);
  },
};
