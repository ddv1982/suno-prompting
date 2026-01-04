import { describe, expect, test } from "bun:test";

import { removeSessionById, sortByUpdated, upsertSessionList, limitVersionHistory } from "@shared/session-utils";
import { type PromptSession, type PromptVersion } from "@shared/types";

const makeSession = (id: string, updatedAt: string): PromptSession => ({
  id,
  originalInput: `input-${id}`,
  currentPrompt: `prompt-${id}`,
  versionHistory: [],
  createdAt: updatedAt,
  updatedAt,
});

const makeVersion = (id: string, timestamp: string): PromptVersion => ({
  id,
  content: `content-${id}`,
  timestamp,
});

describe("session utils", () => {
  test("sortByUpdated orders by updatedAt desc", () => {
    const sessions = [
      makeSession("1", "2026-01-01T00:00:00Z"),
      makeSession("2", "2026-02-01T00:00:00Z"),
      makeSession("3", "2025-12-01T00:00:00Z"),
    ];

    const sorted = sortByUpdated(sessions);
    expect(sorted.map((s) => s.id)).toEqual(["2", "1", "3"]);
  });

  test("upsertSessionList replaces and moves to front", () => {
    const sessions = [
      makeSession("a", "2026-01-01T00:00:00Z"),
      makeSession("b", "2026-01-02T00:00:00Z"),
    ];

    const updated = upsertSessionList(sessions, makeSession("a", "2026-02-01T00:00:00Z"));
    expect(updated.map((s) => s.id)).toEqual(["a", "b"]);
    expect(updated[0]?.updatedAt).toBe("2026-02-01T00:00:00Z");
  });

  test("removeSessionById filters out matching id", () => {
    const sessions = [makeSession("x", "2026-01-01T00:00:00Z"), makeSession("y", "2026-01-01T00:00:00Z")];
    expect(removeSessionById(sessions, "x").map((s) => s.id)).toEqual(["y"]);
  });

  test("limitVersionHistory returns all versions when under limit", () => {
    const versions = [
      makeVersion("1", "2026-01-01T00:00:00Z"),
      makeVersion("2", "2026-01-02T00:00:00Z"),
    ];
    const result = limitVersionHistory(versions, 5);
    expect(result).toHaveLength(2);
  });

  test("limitVersionHistory keeps most recent versions when over limit", () => {
    const versions = [
      makeVersion("1", "2026-01-01T00:00:00Z"),
      makeVersion("2", "2026-01-02T00:00:00Z"),
      makeVersion("3", "2026-01-03T00:00:00Z"),
      makeVersion("4", "2026-01-04T00:00:00Z"),
      makeVersion("5", "2026-01-05T00:00:00Z"),
    ];
    const result = limitVersionHistory(versions, 3);
    expect(result).toHaveLength(3);
    expect(result.map(v => v.id)).toEqual(["5", "4", "3"]);
  });

  test("upsertSessionList limits version history automatically", () => {
    const manyVersions = Array.from({ length: 60 }, (_, i) => 
      makeVersion(`v${i}`, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)
    );
    const session: PromptSession = {
      ...makeSession("a", "2026-02-01T00:00:00Z"),
      versionHistory: manyVersions,
    };
    
    const result = upsertSessionList([], session);
    expect(result[0]?.versionHistory.length).toBeLessThanOrEqual(50);
  });
});
