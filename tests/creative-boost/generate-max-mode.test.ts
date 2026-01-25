import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

afterAll(() => {
  mock.restore();
});

import { AIEngine } from "@bun/ai/engine";
import { MAX_MODE_SIGNATURE } from "@shared/max-format";

// Track generateText calls to detect conversion AI calls
let generateTextCalls = 0;

// Mock the AI SDK generateText
const mockGenerateText = mock(async (_args?: unknown) => {
  generateTextCalls++;
  if (generateTextCalls === 1) {
    return {
      text: '{"title": "Mystic Journey", "style": "ethereal ambient with shimmering pads"}',
    };
  } else {
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

void mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

describe("AIEngine.generateCreativeBoost Max Mode (Deterministic)", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
  });

  it("generates deterministically without LLM when maxMode is true (no lyrics)", async () => {
    await engine.generateCreativeBoost(
      50, [], [], "ambient soundscape", "", false, true, false
    );
    expect(generateTextCalls).toBe(0);
  });

  it("generates deterministically without LLM when maxMode is false (no lyrics)", async () => {
    await engine.generateCreativeBoost(
      50, [], [], "ambient soundscape", "", false, false, false
    );
    expect(generateTextCalls).toBe(0);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.generateCreativeBoost(
      50, ["jazz"], [], "smooth vibes", "", false, true, false
    );

    expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('bpm:');
    expect(result.text).toContain('instruments:');
    expect(result.text).toContain('style tags:');
    expect(result.text).toContain('recording:');
  });

  it("returns Non-Max Format structure when maxMode is false", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], [], "chill vibes", "", false, false, false
    );

    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('BPM:');
    expect(result.text).toContain('Mood:');
    expect(result.text).toContain('Instruments:');
    expect(result.text).toContain('[INTRO]');
    expect(result.text).toContain('[VERSE]');
    expect(result.text).toContain('[CHORUS]');
    expect(result.text).toContain('[OUTRO]');
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
  });

  it("returns deterministic title", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], [], "", "", false, false, false
    );

    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThan(0);
  });
});

describe("AIEngine.refineCreativeBoost Max Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
    
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
      "original prompt", "Original Title", undefined, "make it warmer",
      "", "", [], [], false, true, false
    );
    expect(generateTextCalls).toBe(2);
  });

  it("makes AI call for non-max conversion when maxMode is false", async () => {
    await engine.refineCreativeBoost(
      "original prompt", "Original Title", undefined, "make it warmer",
      "", "", [], [], false, false, false
    );
    expect(generateTextCalls).toBe(2);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt", "Original Title", undefined, "add more bass",
      "", "", [], [], false, true, false
    );

    expect(result.text).toContain(MAX_MODE_SIGNATURE);
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('instruments:');
  });

  it("returns Non-Max Format structure when maxMode is false", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt", "Original Title", undefined, "add more bass",
      "", "", [], [], false, false, false
    );

    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('BPM:');
    expect(result.text).toContain('[INTRO]');
    expect(result.text).toContain('[VERSE]');
    expect(result.text).toContain('[CHORUS]');
    expect(result.text).not.toContain(MAX_MODE_SIGNATURE);
  });
});

describe("AIEngine.generateCreativeBoost performance instruments", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
  });

  it("passes performance instruments from seed genre to conversion", async () => {
    const result = await engine.generateCreativeBoost(
      50, ["jazz"], [], "smooth night jazz", "", false, true, false
    );

    expect(result.text).toContain("instruments:");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("uses performance instruments for compound genres", async () => {
    const result = await engine.generateCreativeBoost(
      50, ["ambient rock"], [], "atmospheric rock", "", false, true, false
    );

    expect(result.text).toContain("instruments:");
  });

  it("handles empty seedGenres gracefully", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], [], "something cool", "", false, true, false
    );

    expect(result.text).toContain("instruments:");
  });
});

describe("AIEngine.refineCreativeBoost performance instruments", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
  });

  it("passes performance instruments during refinement", async () => {
    const result = await engine.refineCreativeBoost(
      "current prompt text", "Current Title", undefined,
      "make it more energetic", "", "", ["electronic"], [], false, true, false
    );

    expect(result.text).toContain("instruments:");
  });
});
