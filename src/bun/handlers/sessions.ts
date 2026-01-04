import { type StorageManager } from '@bun/storage';

import { log } from './utils';

import type { RPCHandlers } from '@shared/types';

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
    deleteSession: async ({ id }) => {
      log.info('deleteSession', { id });
      await storage.deleteSession(id);
      return { success: true };
    },
  };
}
