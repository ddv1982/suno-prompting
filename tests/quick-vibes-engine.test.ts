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
    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("returns text under 120 characters", async () => {
    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });

  it("handles category-only input", async () => {
    const result = await engine.generateQuickVibes("cafe-coffeeshop", "", false);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles description-only input", async () => {
    const result = await engine.generateQuickVibes(null, "late night coding session", false);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles combined category and description", async () => {
    const result = await engine.generateQuickVibes("ambient-focus", "deep work session", false);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("handles wordless vocals option", async () => {
    const result = await engine.generateQuickVibes("lofi-chill", "", true);
    
    expect(result.text).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("includes debug info when debug mode enabled", async () => {
    // Enable debug mode
    engine.setDebugMode(true);
    
    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.systemPrompt).toBeDefined();
    expect(result.debugInfo?.userPrompt).toBeDefined();
  });

  it("excludes debug info when debug mode disabled", async () => {
    // Ensure debug mode is off
    engine.setDebugMode(false);
    
    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    expect(result.debugInfo).toBeUndefined();
  });

  it("throws AIGenerationError on empty response", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: "",
    }));

    await expect(engine.generateQuickVibes("lofi-study", "", false)).rejects.toThrow(
      "Empty response"
    );
  });

  it("post-processes response to remove artifacts", async () => {
    mockGenerateText.mockImplementation(async () => ({
      text: '  "chill lo-fi beats"  ',
    }));

    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    // Should remove quotes and trim
    expect(result.text).toBe("chill lo-fi beats");
  });

  it("truncates response exceeding 120 characters", async () => {
    const longText = "this is a very long prompt that definitely exceeds the maximum character limit of one hundred and twenty characters for quick vibes prompts";
    mockGenerateText.mockImplementation(async () => ({
      text: longText,
    }));

    const result = await engine.generateQuickVibes("lofi-study", "", false);
    
    expect(result.text.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
  });
});
