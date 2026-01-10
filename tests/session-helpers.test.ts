import { describe, expect, test } from "bun:test";

import { buildFullPromptOriginalInput, getErrorToastType } from "@/lib/session-helpers";
import {
  ValidationError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  OllamaModelMissingError,
  AIGenerationError,
  StorageError,
  InvariantError,
} from "@shared/errors";

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

describe("getErrorToastType", () => {
  test("should map ValidationError to 'warning'", () => {
    const error = new ValidationError("Input too long");
    const type = getErrorToastType(error);
    expect(type).toBe("warning");
  });

  test("should map OllamaTimeoutError to 'warning'", () => {
    const error = new OllamaTimeoutError(30000);
    const type = getErrorToastType(error);
    expect(type).toBe("warning");
  });

  test("should map OllamaUnavailableError to 'error'", () => {
    const error = new OllamaUnavailableError("http://localhost:11434");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map OllamaModelMissingError to 'error'", () => {
    const error = new OllamaModelMissingError("gemma3:4b");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map AIGenerationError to 'error'", () => {
    const error = new AIGenerationError("AI generation failed");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map StorageError to 'error'", () => {
    const error = new StorageError("Failed to save session", "write");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map InvariantError to 'error'", () => {
    const error = new InvariantError("Invalid state");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map unknown errors to 'error'", () => {
    const error = new Error("Unknown error");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });

  test("should map generic Error to 'error'", () => {
    const error = new Error("Generic error");
    const type = getErrorToastType(error);
    expect(type).toBe("error");
  });
});
