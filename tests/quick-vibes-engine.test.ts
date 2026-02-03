import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

import { APP_CONSTANTS } from "@shared/constants";

import type { AIEngine as AIEngineType } from "@bun/ai/engine";

import { setAiGenerateTextMock } from "./helpers/ai-mock";

const QUICK_VIBES_MAX_CHARS = APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;

// Mock the AI SDK generateText
const mockGenerateText = mock(async () => ({
  text: "warm lo-fi beats to study to",
}));

let AIEngine: typeof import("@bun/ai/engine").AIEngine;

beforeEach(async () => {
  setAiGenerateTextMock(mockGenerateText);

  ({ AIEngine } = await import("@bun/ai/engine"));
});

afterEach(() => {
  mock.restore();
});

describe("AIEngine.generateQuickVibes", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: "warm lo-fi beats to study to",
    }));
  });

  it("returns GenerationResult with text", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", []);
    
    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("returns text under max chars limit", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", []);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });

  it("handles category-only input deterministically (no LLM)", async () => {
    const result = await engine.generateQuickVibes("cafe-coffeeshop", "", []);
    
    expect(result.text).toBeDefined();
    // Category-based generation is now deterministic - no LLM call
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("handles description-only input (passthrough)", async () => {
    const result = await engine.generateQuickVibes(null, "late night coding session", []);
    
    expect(result.text).toBeDefined();
    expect(result.text).toBe("late night coding session");
    // Description-only is passthrough - no LLM call
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("handles combined category and description (category takes priority)", async () => {
    const result = await engine.generateQuickVibes("ambient-focus", "deep work session", []);
    
    expect(result.text).toBeDefined();
    // Category-based generation is deterministic
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  // NOTE: Debug tracing is migrated to TraceRun, but trace emission is implemented in later task groups.

  it("returns deterministic output for category (no empty response possible)", async () => {
    // Category-based generation is deterministic and always produces output
    const result = await engine.generateQuickVibes("lofi-study", "", []);
    
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("returns title for category-based generation", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", []);
    
    // Deterministic generation includes a title
    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThan(0);
  });

  it("truncates response exceeding max chars limit", async () => {
    const longText = "a".repeat(QUICK_VIBES_MAX_CHARS + 100);
    mockGenerateText.mockImplementation(async () => ({
      text: longText,
    }));

    const result = await engine.generateQuickVibes("lofi-study", "", []);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });
});

describe("AIEngine.generateQuickVibes Direct Mode", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
  });

  it("returns exact styles when sunoStyles provided (direct mode)", async () => {
    const sunoStyles = ["lo-fi jazz", "dark goa trance"];
    const result = await engine.generateQuickVibes(null, "", sunoStyles);

    // Styles are preserved in enriched prompt
    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    expect(result.text).toContain("Genre:");
  });

  it("handles single style selection", async () => {
    const result = await engine.generateQuickVibes(null, "", ["jazz"]);

    // Style preserved in enriched prompt
    expect(result.text).toContain("jazz");
    expect(result.text).toContain("Genre:");
  });

  it("handles maximum 4 styles", async () => {
    const sunoStyles = ["rock", "pop", "jazz", "blues"];
    const result = await engine.generateQuickVibes(null, "", sunoStyles);

    // All styles preserved in enriched prompt
    expect(result.text).toContain("rock, pop, jazz, blues");
  });

  it("calls LLM only for title generation in direct mode", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "Generated Title",
    }));

    const result = await engine.generateQuickVibes(null, "", ["synthwave"]);

    // Direct mode calls generateText for title generation only
    expect(mockGenerateText).toHaveBeenCalled();
    // Styles are preserved in enriched prompt
    expect(result.text).toContain("synthwave");
    expect(result.text).toContain("Genre:");
    // Title is generated
    expect(result.title).toBeDefined();
  });

  it("uses deterministic generation when sunoStyles is empty but category provided", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", []);

    // Category-based generation is deterministic - no LLM call
    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
  });

  // NOTE: Debug tracing is migrated to TraceRun, but trace emission is implemented in later task groups.
});

describe("AIEngine.refineQuickVibes Direct Mode", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
  });

  it("keeps styles unchanged when refining in direct mode", async () => {
    const result = await engine.refineQuickVibes({
      currentPrompt: "lo-fi jazz, dark goa trance",
      currentTitle: "Current Title",
      description: "some description",
      feedback: "make it darker",
      category: null,
      sunoStyles: ["lo-fi jazz", "dark goa trance"],
    });

    // Styles should be preserved in enriched prompt
    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    expect(result.text).toContain("Genre:");
  });

  it("updates styles when refining with different sunoStyles", async () => {
    const result = await engine.refineQuickVibes({
      currentPrompt: "lo-fi jazz, dark goa trance",
      currentTitle: "Current Title",
      description: "some description",
      feedback: "",
      category: null,
      sunoStyles: ["ambient", "drone"],
    });

    // New styles preserved in enriched prompt
    expect(result.text).toContain("ambient, drone");
    expect(mockGenerateText).toHaveBeenCalled();
    const calls = mockGenerateText.mock.calls as unknown as [{ prompt?: string }][];
    expect(String(calls[0]?.[0]?.prompt)).toContain("Suno V5 styles: ambient, drone");
  });

  it("bypasses LLM for styles when refining in direct mode", async () => {
    // Reset mock to track calls for title generation only
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: "New Title",
    }));

    await engine.refineQuickVibes({
      currentPrompt: "ambient, drone",
      currentTitle: "Old Title",
      description: "updated description",
      feedback: "more atmospheric",
      category: null,
      sunoStyles: ["ambient", "drone"],
    });

    // Direct mode refine calls generateText for title regeneration
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("uses deterministic refinement when category is set (no LLM call)", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "refined vibes",
    }));

    const result = await engine.refineQuickVibes({
      currentPrompt: "original vibes",
      feedback: "make it better",
      category: "lofi-study",
      sunoStyles: [],
    });

    // Category-based refinement is now deterministic - no LLM call
    expect(mockGenerateText).not.toHaveBeenCalled();
    // Should still produce a valid result
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.title).toBeDefined();
  });

  it("uses LLM flow when no category and no sunoStyles during refine", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "refined vibes from LLM",
    }));

    await engine.refineQuickVibes({
      currentPrompt: "original vibes",
      feedback: "make it better",
      category: null,
      sunoStyles: [],
    });

    // No category and no sunoStyles - should use LLM
    expect(mockGenerateText).toHaveBeenCalled();
  });
});

describe("AIEngine.generateQuickVibes Direct Mode Title Generation", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: "Midnight Jazz Session",
    }));
  });

  it("generates title from description when provided", async () => {
    const result = await engine.generateQuickVibes(null, "late night jazz vibes", ["lo-fi jazz", "smooth jazz"]);

    expect(result.title).toBeDefined();
    expect(result.title).toBe("Midnight Jazz Session");
    // generateText called for title
    expect(mockGenerateText).toHaveBeenCalled();
    const calls = mockGenerateText.mock.calls as unknown as [{ prompt?: string }][];
    expect(String(calls[0]?.[0]?.prompt)).toContain("late night jazz vibes");
    expect(String(calls[0]?.[0]?.prompt)).toContain("Suno V5 styles: lo-fi jazz, smooth jazz");
  });

  it("generates title from styles when no description", async () => {
    const result = await engine.generateQuickVibes(null, "", ["synthwave", "retrowave"]);

    expect(result.title).toBeDefined();
    // generateText called for title using styles as source
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("returns fallback title on title generation failure", async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new Error("Title generation failed");
    });

    const result = await engine.generateQuickVibes(null, "", ["ambient"]);

    // Should have fallback title
    expect(result.title).toBe("Untitled");
    // Styles should be preserved in enriched prompt
    expect(result.text).toContain("ambient");
    expect(result.text).toContain("Genre:");
  });

  it("regenerates title on refine with new description", async () => {
    const result = await engine.refineQuickVibes({
      currentPrompt: "lo-fi jazz",
      currentTitle: "Old Title",
      description: "dreamy coffee shop morning",
      feedback: "refine feedback",
      category: null,
      sunoStyles: ["lo-fi jazz"],
    });

    expect(result.title).toBeDefined();
    // Styles preserved in enriched prompt
    expect(result.text).toContain("lo-fi jazz");
    expect(mockGenerateText).toHaveBeenCalled(); // Called for title
    const calls = mockGenerateText.mock.calls as unknown as [{ prompt?: string }][];
    expect(String(calls[0]?.[0]?.prompt)).toContain("dreamy coffee shop morning");
    expect(String(calls[0]?.[0]?.prompt)).toContain("Suno V5 styles: lo-fi jazz");
  });
});
