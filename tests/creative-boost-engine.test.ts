import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AIEngine } from "@bun/ai/engine";
import { MAX_MODE_SIGNATURE } from "@shared/max-format";

// Track generateText calls to detect if max conversion AI call was made
let generateTextCalls: number = 0;

// Mock the AI SDK generateText
// First call: Creative Boost JSON response
// Second call (if maxMode): Max conversion style tags response
const mockGenerateText = mock(async () => {
  generateTextCalls++;
  if (generateTextCalls === 1) {
    // Creative Boost response
    return {
      text: '{"title": "Mystic Journey", "style": "ethereal ambient with shimmering pads"}',
    };
  } else {
    // Max conversion AI enhancement response
    return {
      text: '{"styleTags": "atmospheric, dreamy", "recording": "studio session with reverb"}',
    };
  }
});

mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

describe("AIEngine.generateCreativeBoost Max Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
  });

  it("makes additional AI call for max conversion when maxMode is true", async () => {
    await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      "ambient soundscape", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    // Should make 2 calls: 1 for Creative Boost, 1 for max conversion
    expect(generateTextCalls).toBe(2);
  });

  it("makes only one AI call when maxMode is false", async () => {
    await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      "ambient soundscape", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Should make only 1 call for Creative Boost
    expect(generateTextCalls).toBe(1);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      ["jazz"], // seedGenres
      "smooth vibes", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    expect(result.text).toContain(MAX_MODE_SIGNATURE);
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('bpm:');
    expect(result.text).toContain('instruments:');
    expect(result.text).toContain('style tags:');
    expect(result.text).toContain('recording:');
  });

  it("returns plain style when maxMode is false", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      "chill vibes", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    expect(result.text).toBe("ethereal ambient with shimmering pads");
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
    expect(result.text).not.toContain('genre:');
  });

  it("returns title from parsed response", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], "", "", false, false, false
    );

    expect(result.title).toBe("Mystic Journey");
  });

  it("includes maxConversion debug info when debug mode enabled and maxMode true", async () => {
    engine.setDebugMode(true);

    const result = await engine.generateCreativeBoost(
      50, [], "", "", false, true, false
    );

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.maxConversion).toBeDefined();
  });

  it("does NOT include maxConversion debug info when maxMode false", async () => {
    engine.setDebugMode(true);

    const result = await engine.generateCreativeBoost(
      50, [], "", "", false, false, false
    );

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.maxConversion).toBeUndefined();
  });
});

describe("AIEngine.refineCreativeBoost Max Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
    
    // Override mock for refine tests
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Refined Journey", "style": "refined ambient with warm tones"}',
        };
      } else {
        return {
          text: '{"styleTags": "warm, intimate", "recording": "cozy studio session"}',
        };
      }
    });
  });

  it("makes additional AI call for max conversion when maxMode is true", async () => {
    await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "make it warmer",
      "", // lyricsTopic
      "", // description
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    // Should make 2 calls: 1 for refine, 1 for max conversion
    expect(generateTextCalls).toBe(2);
  });

  it("makes only one AI call when maxMode is false", async () => {
    await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "make it warmer",
      "", // lyricsTopic
      "", // description
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Should make only 1 call for refine
    expect(generateTextCalls).toBe(1);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "add more bass",
      "", "", false, true, false
    );

    expect(result.text).toContain(MAX_MODE_SIGNATURE);
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('instruments:');
  });

  it("returns plain style when maxMode is false", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "add more bass",
      "", "", false, false, false
    );

    expect(result.text).toBe("refined ambient with warm tones");
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
  });
});
