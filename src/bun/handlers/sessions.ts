import { z } from 'zod';

import { type StorageManager } from '@bun/storage';

import { log } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

const DeleteSessionSchema = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'Session ID must be a valid UUID'
    ),
});

type SessionHandlers = Pick<RPCHandlers, 'getHistory' | 'saveSession' | 'deleteSession'>;

export function createSessionHandlers(storage: StorageManager): SessionHandlers {
  return {
    getHistory: async () => {
      log.info('getHistory');
      const sessions = await storage.getHistory();
      log.info('getHistory:complete', { count: sessions.length });
      return { sessions };
    },
    saveSession: async ({ session }) => {
      log.info('saveSession', { id: session.id });
      await storage.saveSession(session);
      return { success: true };
    },
    deleteSession: async (params) => {
      const { id } = validate(DeleteSessionSchema, params);
      log.info('deleteSession', { id });
      await storage.deleteSession(id);
      return { success: true };
    },
  };
}
