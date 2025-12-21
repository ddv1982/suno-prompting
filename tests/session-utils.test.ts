import { describe, expect, test } from "bun:test";
import { removeSessionById, sortByUpdated, upsertSessionList } from "@shared/session-utils";
import { type PromptSession } from "@shared/types";

const makeSession = (id: string, updatedAt: string): PromptSession => ({
  id,
  originalInput: `input-${id}`,
  currentPrompt: `prompt-${id}`,
  versionHistory: [],
  createdAt: updatedAt,
  updatedAt,
});

describe("session utils", () => {
  test("sortByUpdated orders by updatedAt desc", () => {
    const sessions = [
      makeSession("1", "2024-01-01T00:00:00Z"),
      makeSession("2", "2024-02-01T00:00:00Z"),
      makeSession("3", "2023-12-01T00:00:00Z"),
    ];

    const sorted = sortByUpdated(sessions);
    expect(sorted.map((s) => s.id)).toEqual(["2", "1", "3"]);
  });

  test("upsertSessionList replaces and moves to front", () => {
    const sessions = [
      makeSession("a", "2024-01-01T00:00:00Z"),
      makeSession("b", "2024-01-02T00:00:00Z"),
    ];

    const updated = upsertSessionList(sessions, makeSession("a", "2024-02-01T00:00:00Z"));
    expect(updated.map((s) => s.id)).toEqual(["a", "b"]);
    expect(updated[0]?.updatedAt).toBe("2024-02-01T00:00:00Z");
  });

  test("removeSessionById filters out matching id", () => {
    const sessions = [makeSession("x", "2024-01-01T00:00:00Z"), makeSession("y", "2024-01-01T00:00:00Z")];
    expect(removeSessionById(sessions, "x").map((s) => s.id)).toEqual(["y"]);
  });
});
