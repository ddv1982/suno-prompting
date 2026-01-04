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

  it("bypasses LLM in direct mode (no generateText call)", async () => {
    await engine.generateQuickVibes(null, "", false, ["synthwave"]);

    // Direct mode should not call generateText
    expect(mockGenerateText).not.toHaveBeenCalled();
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
    const result = await engine.refineQuickVibes(
      currentPrompt,
      "make it darker",
      false,
      null,
      ["lo-fi jazz", "dark goa trance"]
    );

    // Styles should remain unchanged in direct mode
    expect(result.text).toBe(currentPrompt);
  });

  it("bypasses LLM when refining in direct mode", async () => {
    await engine.refineQuickVibes(
      "ambient, drone",
      "more atmospheric",
      false,
      null,
      ["ambient", "drone"]
    );

    // Direct mode refine should not call generateText
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("uses normal LLM flow when sunoStyles is empty during refine", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "refined vibes",
    }));

    await engine.refineQuickVibes(
      "original vibes",
      "make it better",
      false,
      "lofi-study",
      []
    );

    // Should call generateText when no sunoStyles
    expect(mockGenerateText).toHaveBeenCalled();
  });
});
