import { type PromptSession } from "@shared/types";

export function upsertSessionList(
  sessions: PromptSession[],
  session: PromptSession
): PromptSession[] {
  const filtered = sessions.filter((s) => s.id !== session.id);
  return sortByUpdated([session, ...filtered]);
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
