import { describe, expect, test } from "bun:test";

import { buildFullPromptOriginalInput } from "@/lib/session-helpers";

describe("buildFullPromptOriginalInput", () => {
  test("returns description when only description provided", () => {
    const result = buildFullPromptOriginalInput("A song about rain");
    expect(result).toBe("A song about rain");
  });

  test("returns genre tag when only genre provided", () => {
    const result = buildFullPromptOriginalInput("", "jazz");
    expect(result).toBe("[genre: jazz]");
  });

  test("returns topic tag when only topic provided", () => {
    const result = buildFullPromptOriginalInput("", undefined, "love story");
    expect(result).toBe("[topic: love story]");
  });

  test("returns combined string when all three provided", () => {
    const result = buildFullPromptOriginalInput("My song", "rock", "adventure");
    expect(result).toBe("[genre: rock] [topic: adventure] My song");
  });

  test("returns 'Full Prompt' when nothing provided", () => {
    const result = buildFullPromptOriginalInput("");
    expect(result).toBe("Full Prompt");
  });

  test("returns 'Full Prompt' when topic is whitespace-only", () => {
    const result = buildFullPromptOriginalInput("", undefined, "  ");
    expect(result).toBe("Full Prompt");
  });

  test("trims whitespace from topic", () => {
    const result = buildFullPromptOriginalInput("", undefined, "  love story  ");
    expect(result).toBe("[topic: love story]");
  });

  test("returns combined string with genre and topic but no description", () => {
    const result = buildFullPromptOriginalInput("", "pop", "summer vibes");
    expect(result).toBe("[genre: pop] [topic: summer vibes]");
  });

  test("returns combined string with genre and description but no topic", () => {
    const result = buildFullPromptOriginalInput("A melody", "classical");
    expect(result).toBe("[genre: classical] A melody");
  });

  test("returns combined string with topic and description but no genre", () => {
    const result = buildFullPromptOriginalInput("A ballad", undefined, "heartbreak");
    expect(result).toBe("[topic: heartbreak] A ballad");
  });
});
