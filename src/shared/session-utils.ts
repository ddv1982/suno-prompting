import { type PromptSession, type PromptVersion } from "@shared/types";
import { APP_CONSTANTS } from "@shared/constants";

/**
 * Limits version history to the most recent N versions.
 * Keeps the most recent versions based on timestamp.
 */
export function limitVersionHistory(
  versions: PromptVersion[],
  maxVersions: number = APP_CONSTANTS.MAX_VERSION_HISTORY
): PromptVersion[] {
  if (versions.length <= maxVersions) return versions;
  
  // Sort by timestamp descending and take the most recent
  const sorted = [...versions].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted.slice(0, maxVersions);
}

export function upsertSessionList(
  sessions: PromptSession[],
  session: PromptSession
): PromptSession[] {
  // Limit version history before saving
  const limitedSession = {
    ...session,
    versionHistory: limitVersionHistory(session.versionHistory),
  };
  const filtered = sessions.filter((s) => s.id !== session.id);
  return sortByUpdated([limitedSession, ...filtered]);
}

export function removeSessionById(
  sessions: PromptSession[],
  id: string
): PromptSession[] {
  return sessions.filter((s) => s.id !== id);
}

export function sortByUpdated(sessions: PromptSession[]): PromptSession[] {
  return [...sessions].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
