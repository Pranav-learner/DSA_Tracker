import { AISettings, type AISettingsDocument, type IAISettings } from '../../models/AISettings.js';

/**
 * AISettings repository — sole owner of AISettings MongoDB operations. This is
 * the AI module's OWN storage (preferences), not business data; the AI pipeline
 * never reaches into learning/knowledge/etc. collections directly.
 */
export const aiSettingsRepository = {
  findByUser(userId: string): Promise<AISettingsDocument | null> {
    return AISettings.findOne({ userId }).exec();
  },

  upsert(userId: string, update: Partial<IAISettings>): Promise<AISettingsDocument> {
    return AISettings.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<AISettingsDocument>;
  },

  deleteByUser(userId: string): Promise<unknown> {
    return AISettings.deleteOne({ userId }).exec();
  },
};
