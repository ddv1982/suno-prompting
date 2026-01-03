import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AIEngine } from "@bun/ai/engine";
import { MAX_MODE_SIGNATURE } from "@shared/max-format";

// Track generateText calls to detect conversion AI calls
let generateTextCalls: number = 0;

// Mock the AI SDK generateText
// First call: Creative Boost JSON response
// Second call: Conversion AI enhancement response (max or non-max)
const mockGenerateText = mock(async () => {
  generateTextCalls++;
  if (generateTextCalls === 1) {
    // Creative Boost response
    return {
      text: '{"title": "Mystic Journey", "style": "ethereal ambient with shimmering pads"}',
    };
  } else {
    // Conversion AI enhancement response (works for both max and non-max)
    return {
      text: JSON.stringify({
        styleTags: "atmospheric, dreamy",
        recording: "studio session with reverb",
        intro: "Warm pads float in gently",
        verse: "Instruments weave together",
        chorus: "Full arrangement peaks",
        outro: "Peaceful fade out",
      }),
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

  it("makes AI call for max conversion when maxMode is true", async () => {
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

  it("makes AI call for non-max conversion when maxMode is false", async () => {
    await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      "ambient soundscape", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Should make 2 calls: 1 for Creative Boost, 1 for non-max conversion
    expect(generateTextCalls).toBe(2);
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

  it("returns Non-Max Format structure when maxMode is false", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      "chill vibes", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Should have non-max structured format with section tags
    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('BPM:');
    expect(result.text).toContain('Mood:');
    expect(result.text).toContain('Instruments:');
    expect(result.text).toContain('[INTRO]');
    expect(result.text).toContain('[VERSE]');
    expect(result.text).toContain('[CHORUS]');
    expect(result.text).toContain('[OUTRO]');
    // Should NOT have max mode header
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
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

  it("includes maxConversion debug info when maxMode false (non-max conversion)", async () => {
    engine.setDebugMode(true);

    const result = await engine.generateCreativeBoost(
      50, [], "", "", false, false, false
    );

    expect(result.debugInfo).toBeDefined();
    // Non-max conversion also includes debug info for the conversion step
    expect(result.debugInfo?.maxConversion).toBeDefined();
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

  it("makes AI call for max conversion when maxMode is true", async () => {
    await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "make it warmer",
      "", // lyricsTopic
      "", // description
      [], // seedGenres
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    // Should make 2 calls: 1 for refine, 1 for max conversion
    expect(generateTextCalls).toBe(2);
  });

  it("makes AI call for non-max conversion when maxMode is false", async () => {
    await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "make it warmer",
      "", // lyricsTopic
      "", // description
      [], // seedGenres
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Should make 2 calls: 1 for refine, 1 for non-max conversion
    expect(generateTextCalls).toBe(2);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "add more bass",
      "", "", [], false, true, false
    );

    expect(result.text).toContain(MAX_MODE_SIGNATURE);
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('instruments:');
  });

  it("returns Non-Max Format structure when maxMode is false", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      "add more bass",
      "", "", [], false, false, false
    );

    // Should have non-max structured format with section tags
    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('BPM:');
    expect(result.text).toContain('[INTRO]');
    expect(result.text).toContain('[VERSE]');
    expect(result.text).toContain('[CHORUS]');
    // Should NOT have max mode header
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
  });
});
