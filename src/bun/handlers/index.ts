import { type AIEngine } from '@bun/ai';
import { type StorageManager } from '@bun/storage';

import { createCreativeBoostHandlers } from './creative-boost';
import { createGenerationHandlers } from './generation';
import { createMaxConversionHandlers } from './max-conversion';
import { createQuickVibesHandlers } from './quick-vibes';
import { createRemixHandlers } from './remix';
import { createSessionHandlers } from './sessions';
import { createSettingsHandlers } from './settings';

import type { RPCHandlers } from '@shared/types';

export function createHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): RPCHandlers {
  return {
    ...createGenerationHandlers(aiEngine),
    ...createRemixHandlers(aiEngine),
    ...createSessionHandlers(storage),
    ...createSettingsHandlers(aiEngine, storage),
    ...createQuickVibesHandlers(aiEngine),
    ...createCreativeBoostHandlers(aiEngine),
    ...createMaxConversionHandlers(aiEngine),
  };
}
