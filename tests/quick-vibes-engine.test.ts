import { describe, it, expect, mock, beforeEach } from "bun:test";

import { AIEngine } from "@bun/ai/engine";
import { QUICK_VIBES_MAX_CHARS } from "@shared/quick-vibes-categories";

// Mock the AI SDK generateText
const mockGenerateText = mock(async () => ({
  text: "warm lo-fi beats to study to",
}));

mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

describe("AIEngine.generateQuickVibes", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: "warm lo-fi beats to study to",
    }));
  });

  it("returns GenerationResult with text", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("returns text under max chars limit", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });

  it("handles category-only input", async () => {
    const result = await engine.generateQuickVibes("cafe-coffeeshop", "", false, []);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles description-only input", async () => {
    const result = await engine.generateQuickVibes(null, "late night coding session", false, []);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles combined category and description", async () => {
    const result = await engine.generateQuickVibes("ambient-focus", "deep work session", false, []);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles wordless vocals option", async () => {
    const result = await engine.generateQuickVibes("lofi-chill", "", true, []);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("includes debug info when debug mode enabled", async () => {
    // Enable debug mode
    engine.setDebugMode(true);
    
    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.systemPrompt).toBeDefined();
    expect(result.debugInfo?.userPrompt).toBeDefined();
  });

  it("excludes debug info when debug mode disabled", async () => {
    // Ensure debug mode is off
    engine.setDebugMode(false);
    
    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    expect(result.debugInfo).toBeUndefined();
  });

  it("throws AIGenerationError on empty response", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "",
    }));

    await expect(engine.generateQuickVibes("lofi-study", "", false, [])).rejects.toThrow(
      "Empty response"
    );
  });

  it("post-processes response to remove artifacts", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: '  "chill lo-fi beats"  ',
    }));

    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    // Should remove quotes and trim
    expect(result.text).toBe("chill lo-fi beats");
  });

  it("truncates response exceeding max chars limit", async () => {
    const longText = "a".repeat(QUICK_VIBES_MAX_CHARS + 100);
    mockGenerateText.mockImplementation(async () => ({
      text: longText,
    }));

    const result = await engine.generateQuickVibes("lofi-study", "", false, []);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });
});

describe("AIEngine.generateQuickVibes Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
  });

  it("returns exact styles when sunoStyles provided (direct mode)", async () => {
    const sunoStyles = ["lo-fi jazz", "dark goa trance"];
    const result = await engine.generateQuickVibes(null, "", false, sunoStyles);

    expect(result.text).toBe("lo-fi jazz, dark goa trance");
  });

  it("handles single style selection", async () => {
    const result = await engine.generateQuickVibes(null, "", false, ["jazz"]);

    expect(result.text).toBe("jazz");
  });

  it("handles maximum 4 styles", async () => {
    const sunoStyles = ["rock", "pop", "jazz", "blues"];
    const result = await engine.generateQuickVibes(null, "", false, sunoStyles);

    expect(result.text).toBe("rock, pop, jazz, blues");
  });

  it("calls LLM only for title generation in direct mode", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "Generated Title",
    }));

    const result = await engine.generateQuickVibes(null, "", false, ["synthwave"]);

    // Direct mode calls generateText for title generation only
    expect(mockGenerateText).toHaveBeenCalled();
    // Styles are still exact (not transformed by LLM)
    expect(result.text).toBe("synthwave");
    // Title is generated
    expect(result.title).toBeDefined();
  });

  it("uses normal LLM flow when sunoStyles is empty", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "chill vibes",
    }));

    await engine.generateQuickVibes("lofi-study", "", false, []);

    // Should call generateText when no sunoStyles
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("includes debug info in direct mode when debug enabled", async () => {
    engine.setDebugMode(true);
    const result = await engine.generateQuickVibes(null, "", false, ["ambient"]);

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.systemPrompt).toContain("DIRECT_MODE");
  });
});

describe("AIEngine.refineQuickVibes Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
  });

  it("keeps styles unchanged when refining in direct mode", async () => {
    const currentPrompt = "lo-fi jazz, dark goa trance";
    const result = await engine.refineQuickVibes({
      currentPrompt,
      currentTitle: "Current Title",
      description: "some description",
      feedback: "make it darker",
      withWordlessVocals: false,
      category: null,
      sunoStyles: ["lo-fi jazz", "dark goa trance"],
    });

    // Styles should remain unchanged in direct mode
    expect(result.text).toBe(currentPrompt);
  });

  it("updates styles when refining with different sunoStyles", async () => {
    const result = await engine.refineQuickVibes({
      currentPrompt: "lo-fi jazz, dark goa trance",
      currentTitle: "Current Title",
      description: "some description",
      feedback: "",
      withWordlessVocals: false,
      category: null,
      sunoStyles: ["ambient", "drone"],
    });

    expect(result.text).toBe("ambient, drone");
    expect(mockGenerateText).toHaveBeenCalled();
    const calls = mockGenerateText.mock.calls as unknown as Array<[{ prompt?: string }]>;
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
      withWordlessVocals: false,
      category: null,
      sunoStyles: ["ambient", "drone"],
    });

    // Direct mode refine calls generateText for title regeneration
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("uses normal LLM flow when sunoStyles is empty during refine", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "refined vibes",
    }));

    await engine.refineQuickVibes({
      currentPrompt: "original vibes",
      feedback: "make it better",
      withWordlessVocals: false,
      category: "lofi-study",
      sunoStyles: [],
    });

    // Should call generateText when no sunoStyles
    expect(mockGenerateText).toHaveBeenCalled();
  });
});

describe("AIEngine.generateQuickVibes Direct Mode Title Generation", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    mockGenerateText.mockImplementation(async () => ({
      text: "Midnight Jazz Session",
    }));
  });

  it("generates title from description when provided", async () => {
    const result = await engine.generateQuickVibes(
      null,
      "late night jazz vibes",
      false,
      ["lo-fi jazz", "smooth jazz"]
    );

    expect(result.title).toBeDefined();
    expect(result.title).toBe("Midnight Jazz Session");
    // generateText called for title
    expect(mockGenerateText).toHaveBeenCalled();
    const calls = mockGenerateText.mock.calls as unknown as Array<[{ prompt?: string }]>;
    expect(String(calls[0]?.[0]?.prompt)).toContain("late night jazz vibes");
    expect(String(calls[0]?.[0]?.prompt)).toContain("Suno V5 styles: lo-fi jazz, smooth jazz");
  });

  it("generates title from styles when no description", async () => {
    const result = await engine.generateQuickVibes(
      null,
      "",
      false,
      ["synthwave", "retrowave"]
    );

    expect(result.title).toBeDefined();
    // generateText called for title using styles as source
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("returns fallback title on title generation failure", async () => {
    mockGenerateText.mockImplementation(async () => {
      throw new Error("Title generation failed");
    });

    const result = await engine.generateQuickVibes(
      null,
      "",
      false,
      ["ambient"]
    );

    // Should have fallback title
    expect(result.title).toBe("Untitled");
    // Styles should still be correct
    expect(result.text).toBe("ambient");
  });

  it("regenerates title on refine with new description", async () => {
    const result = await engine.refineQuickVibes({
      currentPrompt: "lo-fi jazz",
      currentTitle: "Old Title",
      description: "dreamy coffee shop morning",
      feedback: "refine feedback",
      withWordlessVocals: false,
      category: null,
      sunoStyles: ["lo-fi jazz"],
    });

    expect(result.title).toBeDefined();
    expect(result.text).toBe("lo-fi jazz"); // Styles unchanged
    expect(mockGenerateText).toHaveBeenCalled(); // Called for title
    const calls = mockGenerateText.mock.calls as unknown as Array<[{ prompt?: string }]>;
    expect(String(calls[0]?.[0]?.prompt)).toContain("dreamy coffee shop morning");
    expect(String(calls[0]?.[0]?.prompt)).toContain("Suno V5 styles: lo-fi jazz");
  });
});
