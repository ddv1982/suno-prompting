import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

import type { AIEngine as AIEngineType } from "@bun/ai/engine";

import { setAiGenerateTextMock } from "../helpers/ai-mock";

let generateTextCalls = 0;

const mockGenerateText = mock(async () => {
  generateTextCalls++;
  if (generateTextCalls === 1) {
    return { text: "Upbeat Vibes" };
  } else {
    return {
      text: `[VERSE]
Feeling the energy rise
Reaching for the skies

[CHORUS]
Upbeat and alive
This is how we thrive`,
    };
  }
});

let AIEngine: typeof import("@bun/ai/engine").AIEngine;

beforeEach(async () => {
  setAiGenerateTextMock(mockGenerateText);

  ({ AIEngine } = await import("@bun/ai/engine"));
});

afterEach(() => {
  mock.restore();
});

describe("AIEngine.refineCreativeBoost Direct Mode", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return { text: "Upbeat Vibes" };
      } else {
        return {
          text: `[VERSE]
Feeling the energy rise
Reaching for the skies

[CHORUS]
Upbeat and alive
This is how we thrive`,
        };
      }
    });
  });

  it("keeps styles unchanged when refining in direct mode", async () => {
    const sunoStyles = ["lo-fi jazz", "dark goa trance"];
    const result = await engine.refineCreativeBoost(
      "lo-fi jazz, dark goa trance", "Old Title", undefined,
      "Make it more upbeat", "", "", [], sunoStyles, false, false
    );

    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    expect(result.text).toContain("Genre:");
  });

  it("refines title based on feedback in direct mode", async () => {
    const result = await engine.refineCreativeBoost(
      "indie rock, shoegaze", "Old Title", undefined,
      "Make the title more energetic", "", "", [],
      ["indie rock", "shoegaze"], false, false
    );

    expect(result.title).toBe("Upbeat Vibes");
    expect(result.title).not.toBe("Old Title");
  });

  it("refines lyrics without max mode header in direct mode", async () => {
    const result = await engine.refineCreativeBoost(
      "synthpop, electro", "Electric Nights", undefined,
      "Add more emotion", "love story", "", [],
      ["synthpop", "electro"], true, true
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).not.toContain("///*****///");
    expect(result.lyrics).toContain("[VERSE]");
    expect(result.lyrics).toContain("[CHORUS]");
  });

  it("uses normal LLM flow when sunoStyles is empty during refine", async () => {
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Refined Rock", "style": "refined rock with new elements"}',
        };
      } else {
        return {
          text: JSON.stringify({
            styleTags: "refined, evolved",
            recording: "professional studio",
            intro: "New intro",
            verse: "Updated verse",
            chorus: "Enhanced chorus",
            outro: "New outro",
          }),
        };
      }
    });

    const result = await engine.refineCreativeBoost(
      "original rock prompt", "Original Title", undefined,
      "make it heavier", "", "", ["rock"], [], true, false
    );

    expect(generateTextCalls).toBeGreaterThanOrEqual(2);
    expect(result.text.length).toBeGreaterThan(20);
  });

  it("only makes LLM calls for title and lyrics in direct mode refine", async () => {
    await engine.refineCreativeBoost(
      "chill hop, lo-fi", "Chill Session", undefined,
      "Make it mellower", "", "", [],
      ["chill hop", "lo-fi"], false, true
    );

    expect(generateTextCalls).toBe(2);
  });

  it("only makes 1 LLM call for title in direct mode refine without lyrics", async () => {
    await engine.refineCreativeBoost(
      "ambient, drone", "Peaceful Drift", undefined,
      "Make it darker", "", "", [],
      ["ambient", "drone"], false, false
    );

    expect(generateTextCalls).toBe(1);
  });

  it("bootstraps lyrics when withLyrics is true and no lyrics exist, even without feedback", async () => {
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "[VERSE]\nBootstrapped lyrics" };
    });

    const result = await engine.refineCreativeBoost(
      "chill, lo-fi", "Old Title", undefined,
      "", "love story", "", [],
      ["chill", "lo-fi"], false, true
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    expect(generateTextCalls).toBe(1);
  });
});

describe("refineDirectMode title context priority (Bug 4)", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Refined Title" };
    });
  });

  it("uses feedback first for title refinement context", async () => {
    const result = await engine.refineCreativeBoost(
      "lo-fi, chill", "Old Title", undefined,
      "make it more epic", "peaceful journey", "", [],
      ["lo-fi", "chill"], false, false
    );

    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Refined Title");
  });

  it("keeps title unchanged when lyricsTopic provided but feedback empty", async () => {
    const result = await engine.refineCreativeBoost(
      "jazz, smooth", "Old Title", undefined,
      "", "ocean voyage", "", [],
      ["jazz", "smooth"], false, false
    );

    expect(generateTextCalls).toBe(0);
    expect(result.title).toBe("Old Title");
  });

  it("skips title refinement when both feedback and lyricsTopic are empty", async () => {
    const result = await engine.refineCreativeBoost(
      "rock, alternative", "Original Title", undefined,
      "", "", "", [],
      ["rock", "alternative"], false, false
    );

    expect(result.title).toBe("Original Title");
    expect(generateTextCalls).toBe(0);
  });

  it("keeps title unchanged when lyricsTopic provided but no feedback", async () => {
    const result = await engine.refineCreativeBoost(
      "electronic, dance", "Old Title", undefined,
      "", "night city vibes", "", [],
      ["electronic", "dance"], false, false
    );

    expect(generateTextCalls).toBe(0);
    expect(result.title).toBe("Old Title");
  });
});

describe("refineDirectMode style updates (Bug 3)", () => {
  let engine: AIEngineType;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return { text: "Refined Title" };
      } else {
        return {
          text: `[VERSE]
New lyrics for refined song

[CHORUS]
This is the chorus`,
        };
      }
    });
  });

  it("applies new styles when changed", async () => {
    const result = await engine.refineCreativeBoost(
      "old-style, chillwave", "Old Title", undefined,
      "", "", "", [],
      ["dream-pop", "shoegaze"], false, false
    );

    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
    expect(result.text).not.toContain("old-style");
    expect(result.text).not.toContain("chillwave");
  });

  it("keeps title unchanged when only styles change (no feedback)", async () => {
    const result = await engine.refineCreativeBoost(
      "lo-fi, chill", "Original Title", undefined,
      "", "", "", [],
      ["dream-pop", "shoegaze"], false, false
    );

    expect(result.title).toBe("Original Title");
    expect(generateTextCalls).toBe(0);
    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
  });

  it("keeps lyrics undefined when only styles change (no feedback)", async () => {
    const result = await engine.refineCreativeBoost(
      "rock, metal", "Rock Title", "[VERSE]\nExisting lyrics",
      "", "some topic", "", [],
      ["jazz", "smooth"], false, true
    );

    expect(result.lyrics).toBe("[VERSE]\nExisting lyrics");
    expect(generateTextCalls).toBe(0);
    expect(result.text).toContain("jazz, smooth");
    expect(result.text).toContain("Genre:");
  });

  it("regenerates title when feedback provided with style change", async () => {
    const result = await engine.refineCreativeBoost(
      "old-style, ambient", "Old Title", undefined,
      "make it more energetic", "", "", [],
      ["rock", "punk"], false, false
    );

    expect(result.text).toContain("rock, punk");
    expect(result.text).toContain("Genre:");
    expect(result.title).toBe("Refined Title");
    expect(generateTextCalls).toBe(1);
  });

  it("generates lyrics when feedback provided with style change", async () => {
    const result = await engine.refineCreativeBoost(
      "chill, lo-fi", "Old Title", undefined,
      "add more feeling", "love theme", "", [],
      ["dream-pop", "ethereal"], false, true
    );

    expect(result.text).toContain("dream-pop, ethereal");
    expect(result.text).toContain("Genre:");
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    expect(generateTextCalls).toBe(2);
  });

  it("keeps same styles when sunoStyles matches currentPrompt", async () => {
    const result = await engine.refineCreativeBoost(
      "dream-pop, shoegaze", "Title", undefined,
      "", "", "", [],
      ["dream-pop", "shoegaze"], false, false
    );

    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
    expect(generateTextCalls).toBe(0);
  });

  it("handles single style in sunoStyles array", async () => {
    const result = await engine.refineCreativeBoost(
      "old-style, old-style-2", "Title", undefined,
      "", "", "", [],
      ["single-new-style"], false, false
    );

    expect(result.text).toContain("single-new-style");
    expect(result.text).toContain("Genre:");
  });
});
