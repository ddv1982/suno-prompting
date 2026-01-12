import { describe, it, expect, mock, beforeEach } from "bun:test";

import { AIEngine } from "@bun/ai/engine";
import { MAX_MODE_SIGNATURE } from "@shared/max-format";

// Track generateText calls to detect conversion AI calls
let generateTextCalls: number = 0;

// Mock the AI SDK generateText
// First call: Creative Boost JSON response
// Second call: Conversion AI enhancement response (max or non-max)
const mockGenerateText = mock(async (_args?: unknown) => {
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
      50, // creativityLevel
      [], // seedGenres
      [], // sunoStyles
      "ambient soundscape", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    // Deterministic generation - no LLM calls
    expect(generateTextCalls).toBe(0);
  });

  it("generates deterministically without LLM when maxMode is false (no lyrics)", async () => {
    await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      [], // sunoStyles
      "ambient soundscape", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      false, // maxMode = false
      false // withLyrics
    );

    // Deterministic generation - no LLM calls
    expect(generateTextCalls).toBe(0);
  });

  it("returns Max Format structure when maxMode is true", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      ["jazz"], // seedGenres
      [], // sunoStyles
      "smooth vibes", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode = true
      false // withLyrics
    );

    // Deterministic builder uses standard MAX_MODE_HEADER format
    expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
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
      [], // sunoStyles
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

  it("returns deterministic title", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], [], "", "", false, false, false
    );

    // Title is now deterministic (not from LLM response)
    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThan(0);
  });

  it("includes debug info when debug mode enabled", async () => {
    engine.setDebugMode(true);

    const result = await engine.generateCreativeBoost(
      50, [], [], "", "", false, true, false
    );

    expect(result.debugInfo).toBeDefined();
    // Debug info shows deterministic generation info
    expect(result.debugInfo?.systemPrompt).toContain("DETERMINISTIC");
  });

  it("excludes debug info when debug mode disabled", async () => {
    engine.setDebugMode(false);

    const result = await engine.generateCreativeBoost(
      50, [], [], "", "", false, false, false
    );

    expect(result.debugInfo).toBeUndefined();
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
      undefined,
      "make it warmer",
      "", // lyricsTopic
      "", // description
      [], // seedGenres
      [], // sunoStyles
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
      undefined,
      "make it warmer",
      "", // lyricsTopic
      "", // description
      [], // seedGenres
      [], // sunoStyles
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
      undefined,
      "add more bass",
      "", "", [], [], false, true, false
    );

    expect(result.text).toContain(MAX_MODE_SIGNATURE);
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('instruments:');
  });

  it("returns Non-Max Format structure when maxMode is false", async () => {
    const result = await engine.refineCreativeBoost(
      "original prompt",
      "Original Title",
      undefined,
      "add more bass",
      "", "", [], [], false, false, false
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

// =============================================================================
// DIRECT MODE TESTS - Suno V5 Styles bypass LLM for style generation
// =============================================================================

describe("AIEngine.generateCreativeBoost Direct Mode", () => {
  let engine: AIEngine;
  let generateTextCallArgs: Array<{ system?: string; prompt?: string }> = [];

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
    generateTextCallArgs = [];

    // Mock for direct mode: Title generation returns a title, lyrics returns lyrics
    mockGenerateText.mockImplementation(async (args: unknown) => {
      generateTextCallArgs.push(args as { system?: string; prompt?: string });
      generateTextCalls++;
      // In direct mode:
      // - Call 1: Title generation
      // - Call 2: Lyrics generation (if withLyrics=true)
      if (generateTextCalls === 1) {
        // Title generation response
        return {
          text: "Neon Dreams",
        };
      } else {
        // Lyrics generation response
        return {
          text: `[VERSE]
Walking through the neon lights
City sounds fill the night

[CHORUS]
Dancing in the glow
Let the rhythm flow`,
        };
      }
    });
  });

  // Task 4.1: Test direct mode preserves styles in genre field and enriches prompt
  it("returns exact styles when sunoStyles provided (direct mode)", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel (ignored in direct mode)
      [], // seedGenres (empty)
      ["lo-fi jazz", "dark goa trance"], // sunoStyles
      "", // description (ignored in direct mode)
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode
      false // withLyrics
    );

    // Styles are preserved exactly in genre field, prompt is enriched
    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    // MAX mode uses lowercase "genre:"
    expect(result.text).toContain("genre:");
  });

  // Task 4.4: Test single style selection
  it("handles single style selection", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["k-pop"], "", "", false, false, false
    );

    // Style preserved in enriched prompt
    expect(result.text).toContain("k-pop");
    expect(result.text).toContain("Genre:");
  });

  // Task 4.4: Test maximum 4 styles
  it("handles maximum 4 styles", async () => {
    const styles = ["style1", "style2", "style3", "style4"];
    const result = await engine.generateCreativeBoost(
      50, [], styles, "", "", false, false, false
    );

    // All styles preserved in enriched prompt
    expect(result.text).toContain("style1, style2, style3, style4");
  });

  // Task 4.2: Test direct mode bypasses LLM for styles
  it("bypasses LLM for style generation in direct mode (title only)", async () => {
    await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      ["hip-hop"], // sunoStyles - triggers direct mode
      "", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode (ignored in direct mode)
      false // withLyrics = false
    );

    // Should only make 1 call (title generation)
    // Style is NOT generated via LLM - it's passed through directly
    expect(generateTextCalls).toBe(1);
  });

  // Task 4.2: Test direct mode with lyrics makes 2 calls
  it("makes 2 LLM calls in direct mode with lyrics (title + lyrics)", async () => {
    await engine.generateCreativeBoost(
      50, [], ["indie rock"], "", "", false, true, true // withLyrics = true
    );

    // Should make 2 calls: 1 for title, 1 for lyrics
    // Style is NOT generated via LLM
    expect(generateTextCalls).toBe(2);
  });

  it("includes performance tags guidance in lyrics generation when useSunoTags is enabled", async () => {
    engine.setUseSunoTags(true);

    await engine.generateCreativeBoost(
      50,
      [],
      ["indie rock"],
      "",
      "",
      false,
      false,
      true
    );

    expect(generateTextCalls).toBe(2);
    expect(generateTextCallArgs[1]?.system).toContain("(breathy)");
  });

  // Task 4.3: Test direct mode lyrics without max mode header
  it("generates lyrics without max mode header in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      ["indie rock"], // sunoStyles
      "", // description
      "love story", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode = true (but should be ignored in direct mode)
      true // withLyrics
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).not.toContain("///*****///");
    expect(result.lyrics).toContain("[VERSE]");
  });

  // Task 4.3: Test lyrics contain standard section tags
  it("generates lyrics with standard section tags in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["synthwave"], "", "space adventure", false, false, true
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    expect(result.lyrics).toContain("[CHORUS]");
    expect(result.lyrics).not.toContain("///*****///");
  });

  // Task 4.6: Test fallback to deterministic mode when sunoStyles is empty
  it("uses deterministic generation when sunoStyles is empty", async () => {
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      ["rock"], // seedGenres
      [], // sunoStyles - empty, triggers deterministic mode
      "energetic song", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode
      false // withLyrics
    );

    // Deterministic mode: no LLM calls
    expect(generateTextCalls).toBe(0);
    // Result should still be valid prompt
    expect(result.text.length).toBeGreaterThan(20);
    expect(result.title).toBeDefined();
  });

  it("returns a generated title in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["lo-fi beats"], "", "", false, false, false
    );

    expect(result.title).toBe("Neon Dreams");
  });

  it("respects maxMode parameter in direct mode (enriched output)", async () => {
    // With maxMode=true, direct mode returns MAX mode enriched prompt
    const resultMax = await engine.generateCreativeBoost(
      50, [], ["ambient", "chillwave"], "", "", false, true, false
    );

    // Should contain MAX mode headers when maxMode=true
    expect(resultMax.text).toContain("[Is_MAX_MODE: MAX]");
    // Should preserve styles in genre field
    expect(resultMax.text).toContain("ambient, chillwave");

    // With maxMode=false, direct mode returns standard enriched prompt
    const resultStd = await engine.generateCreativeBoost(
      50, [], ["ambient", "chillwave"], "", "", false, false, false
    );

    // Should NOT contain MAX mode headers
    expect(resultStd.text).not.toContain("[Is_MAX_MODE: MAX]");
    // Should still preserve styles
    expect(resultStd.text).toContain("ambient, chillwave");
  });
});

describe("AIEngine.refineCreativeBoost Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for direct mode refine
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        // Title refinement response
        return {
          text: "Upbeat Vibes",
        };
      } else {
        // Lyrics generation response
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

  // Task 4.5: Test refine mode keeps styles unchanged
  it("keeps styles unchanged when refining in direct mode", async () => {
    const sunoStyles = ["lo-fi jazz", "dark goa trance"];
    const result = await engine.refineCreativeBoost(
      "lo-fi jazz, dark goa trance", // currentPrompt (the styles)
      "Old Title", // currentTitle
      undefined,
      "Make it more upbeat", // feedback
      "", // lyricsTopic
      "", // description
      [], // seedGenres
      sunoStyles, // sunoStyles - triggers direct mode
      false, // withWordlessVocals
      false, // maxMode
      false // withLyrics
    );

    // Styles should be preserved in enriched prompt
    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    // Enriched prompt should include genre and other elements
    expect(result.text).toContain("Genre:");
  });

  it("refines title based on feedback in direct mode", async () => {
    const originalStyles = "indie rock, shoegaze";
    const result = await engine.refineCreativeBoost(
      originalStyles,
      "Old Title",
      undefined,
      "Make the title more energetic",
      "", "", [],
      ["indie rock", "shoegaze"],
      false, false, false
    );

    // Title should be refined (different from original)
    expect(result.title).toBe("Upbeat Vibes");
    expect(result.title).not.toBe("Old Title");
  });

  it("refines lyrics without max mode header in direct mode", async () => {
    const result = await engine.refineCreativeBoost(
      "synthpop, electro",
      "Electric Nights",
      undefined,
      "Add more emotion",
      "love story", // lyricsTopic
      "", [],
      ["synthpop", "electro"],
      false,
      true, // maxMode = true (should be ignored)
      true // withLyrics
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).not.toContain("///*****///");
    expect(result.lyrics).toContain("[VERSE]");
    expect(result.lyrics).toContain("[CHORUS]");
  });

  it("uses normal LLM flow when sunoStyles is empty during refine", async () => {
    // Reset mock to normal mode behavior
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        // Refine response
        return {
          text: '{"title": "Refined Rock", "style": "refined rock with new elements"}',
        };
      } else {
        // Conversion AI response
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
      "original rock prompt",
      "Original Title",
      undefined,
      "make it heavier",
      "", "", ["rock"], [], // seedGenres has value, sunoStyles is empty
      false, true, false
    );

    // Normal mode: should have multiple LLM calls
    expect(generateTextCalls).toBeGreaterThanOrEqual(2);
    // Result should be longer (LLM-processed content)
    expect(result.text.length).toBeGreaterThan(20);
  });

  it("only makes LLM calls for title and lyrics in direct mode refine", async () => {
    await engine.refineCreativeBoost(
      "chill hop, lo-fi",
      "Chill Session",
      undefined,
      "Make it mellower",
      "", "", [],
      ["chill hop", "lo-fi"],
      false, false,
      true // withLyrics
    );

    // Direct mode refine: 1 call for title, 1 for lyrics
    expect(generateTextCalls).toBe(2);
  });

  it("only makes 1 LLM call for title in direct mode refine without lyrics", async () => {
    await engine.refineCreativeBoost(
      "ambient, drone",
      "Peaceful Drift",
      undefined,
      "Make it darker",
      "", "", [],
      ["ambient", "drone"],
      false, false,
      false // withLyrics = false
    );

    // Direct mode refine without lyrics: only 1 call for title
    expect(generateTextCalls).toBe(1);
  });

  it("bootstraps lyrics when withLyrics is true and no lyrics exist, even without feedback", async () => {
    // Override mock: without feedback, title refinement is skipped, so the first LLM call is lyrics.
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "[VERSE]\nBootstrapped lyrics" };
    });

    const result = await engine.refineCreativeBoost(
      "chill, lo-fi",
      "Old Title",
      undefined,
      "", // no feedback
      "love story", // lyricsTopic
      "", // description
      [], // seedGenres
      ["chill", "lo-fi"], // Direct Mode
      false,
      false,
      true // withLyrics
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    expect(generateTextCalls).toBe(1);
  });
});

// =============================================================================
// BUG 4: TITLE CONTEXT FALLBACK TESTS
// Tests for using lyricsTopic as fallback context for title generation
// =============================================================================

describe("generateDirectMode title context priority (Bug 4)", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for direct mode title generation
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Generated Title" };
    });
  });

  it("uses description when provided for title context", async () => {
    // When description is provided, title should be generated (1 LLM call)
    // The description "love song about summer" should be used over lyricsTopic
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      ["dream-pop"], // sunoStyles - triggers direct mode
      "love song about summer", // description - should be used
      "heartbreak theme", // lyricsTopic - should be ignored when description exists
      false, false, false
    );

    // Should make 1 LLM call for title generation
    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Generated Title");
  });

  it("falls back to lyricsTopic when description is empty", async () => {
    // When description is empty, should fall back to lyricsTopic for context
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      [], // seedGenres
      ["synthwave"], // sunoStyles - triggers direct mode
      "", // description - empty
      "space adventure", // lyricsTopic - should be used as fallback
      false, false, false
    );

    // Should make 1 LLM call for title generation
    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Generated Title");
  });

  it("uses empty string when both description and lyricsTopic are empty", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["ambient"], "", "", false, false, false
    );

    // Should still generate a title (falls back to styles-only context)
    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThan(0);
  });
});

describe("refineDirectMode title context priority (Bug 4)", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for direct mode title refinement
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Refined Title" };
    });
  });

  it("uses feedback first for title refinement context", async () => {
    // When feedback is provided, it should be used for title refinement
    const result = await engine.refineCreativeBoost(
      "lo-fi, chill", // currentPrompt
      "Old Title", // currentTitle
      undefined,
      "make it more epic", // feedback - should be used
      "peaceful journey", // lyricsTopic - included but feedback takes priority
      "", [], ["lo-fi", "chill"],
      false, false, false
    );

    // Should make 1 LLM call for title refinement
    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Refined Title");
  });

  it("keeps title unchanged when lyricsTopic provided but feedback empty", async () => {
    // Per Bug 3 requirements: title only changes when feedback is provided
    // lyricsTopic alone does NOT trigger title refinement in refine mode
    const result = await engine.refineCreativeBoost(
      "jazz, smooth", // currentPrompt
      "Old Title", // currentTitle
      undefined,
      "", // feedback - empty
      "ocean voyage", // lyricsTopic - should NOT trigger title refinement
      "", [], ["jazz", "smooth"],
      false, false, false
    );

    // Should make 0 LLM calls (no title refinement without feedback)
    expect(generateTextCalls).toBe(0);
    // Title should remain unchanged
    expect(result.title).toBe("Old Title");
  });

  it("skips title refinement when both feedback and lyricsTopic are empty", async () => {
    const result = await engine.refineCreativeBoost(
      "rock, alternative", // currentPrompt
      "Original Title", // currentTitle
      undefined,
      "", // feedback - empty
      "", // lyricsTopic - empty
      "", [], ["rock", "alternative"],
      false, false,
      false // withLyrics = false
    );

    // Should keep the original title unchanged (no LLM call for title)
    expect(result.title).toBe("Original Title");
    // Should make 0 LLM calls (no title refinement, no lyrics)
    expect(generateTextCalls).toBe(0);
  });

  it("keeps title unchanged when lyricsTopic provided but no feedback", async () => {
    // Per Bug 3 requirements: title only changes when feedback is provided
    // lyricsTopic alone does NOT trigger title refinement
    const result = await engine.refineCreativeBoost(
      "electronic, dance", // currentPrompt
      "Old Title", // currentTitle
      undefined,
      "", // feedback - empty
      "night city vibes", // lyricsTopic - should NOT trigger title refinement
      "", [], ["electronic", "dance"],
      false, false, false
    );

    // Should make 0 LLM calls (no title refinement without feedback)
    expect(generateTextCalls).toBe(0);
    expect(result.title).toBe("Old Title");
  });
});

// =============================================================================
// BUG 3: STYLE APPLICATION TESTS
// Tests for applying new styles during Direct Mode refinement
// =============================================================================

describe("refineDirectMode style updates (Bug 3)", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for direct mode refine
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        // Title refinement response
        return {
          text: "Refined Title",
        };
      } else {
        // Lyrics generation response
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
    // When sunoStyles array differs from currentPrompt, new styles should be applied
    const result = await engine.refineCreativeBoost(
      "old-style, chillwave", // currentPrompt (old styles)
      "Old Title",
      undefined,
      "", // no feedback
      "", "", [],
      ["dream-pop", "shoegaze"], // NEW styles
      false, false, false
    );

    // New styles should be in enriched prompt
    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
    expect(result.text).not.toContain("old-style");
    expect(result.text).not.toContain("chillwave");
  });

  it("keeps title unchanged when only styles change (no feedback)", async () => {
    // Per requirements: title not regenerated without feedback
    const result = await engine.refineCreativeBoost(
      "lo-fi, chill", // currentPrompt
      "Original Title", // currentTitle - should remain unchanged
      undefined,
      "", // no feedback
      "", "", [],
      ["dream-pop", "shoegaze"], // Different styles
      false, false, false
    );

    // Title should remain unchanged
    expect(result.title).toBe("Original Title");
    // No LLM calls should be made (no title refinement, no lyrics)
    expect(generateTextCalls).toBe(0);
    // Styles should be in enriched prompt
    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
  });

  it("keeps lyrics undefined when only styles change (no feedback)", async () => {
    // Per requirements: lyrics not regenerated without feedback
    const result = await engine.refineCreativeBoost(
      "rock, metal", // currentPrompt
      "Rock Title",
      "[VERSE]\nExisting lyrics",
      "", // no feedback
      "some topic", "", [],
      ["jazz", "smooth"], // Different styles
      false, false,
      true // withLyrics = true, but no feedback so no lyrics generated
    );

    // Lyrics should be preserved (no regeneration without feedback)
    expect(result.lyrics).toBe("[VERSE]\nExisting lyrics");
    // No LLM calls should be made
    expect(generateTextCalls).toBe(0);
    // Styles should be in enriched prompt
    expect(result.text).toContain("jazz, smooth");
    expect(result.text).toContain("Genre:");
  });

  it("regenerates title when feedback provided with style change", async () => {
    // Both style change AND feedback → title regenerated
    const result = await engine.refineCreativeBoost(
      "old-style, ambient", // currentPrompt
      "Old Title",
      undefined,
      "make it more energetic", // feedback provided
      "", "", [],
      ["rock", "punk"], // NEW styles
      false, false, false
    );

    // Styles should be in enriched prompt
    expect(result.text).toContain("rock, punk");
    expect(result.text).toContain("Genre:");
    // Title should be refined (LLM called)
    expect(result.title).toBe("Refined Title");
    expect(generateTextCalls).toBe(1);
  });

  it("generates lyrics when feedback provided with style change", async () => {
    // Feedback + withLyrics → lyrics generated
    const result = await engine.refineCreativeBoost(
      "chill, lo-fi", // currentPrompt
      "Old Title",
      undefined,
      "add more feeling", // feedback provided
      "love theme", "", [],
      ["dream-pop", "ethereal"], // NEW styles
      false, false,
      true // withLyrics = true
    );

    // Styles should be in enriched prompt
    expect(result.text).toContain("dream-pop, ethereal");
    expect(result.text).toContain("Genre:");
    // Lyrics should be generated (feedback provided)
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    // Should make 2 LLM calls: 1 for title, 1 for lyrics
    expect(generateTextCalls).toBe(2);
  });

  it("keeps same styles when sunoStyles matches currentPrompt", async () => {
    // When styles haven't actually changed, result should still match
    const result = await engine.refineCreativeBoost(
      "dream-pop, shoegaze", // currentPrompt
      "Title",
      undefined,
      "", // no feedback
      "", "", [],
      ["dream-pop", "shoegaze"], // Same styles
      false, false, false
    );

    // Styles should be in enriched prompt
    expect(result.text).toContain("dream-pop, shoegaze");
    expect(result.text).toContain("Genre:");
    // No LLM calls (no feedback)
    expect(generateTextCalls).toBe(0);
  });

  it("handles single style in sunoStyles array", async () => {
    const result = await engine.refineCreativeBoost(
      "old-style, old-style-2", // currentPrompt
      "Title",
      undefined,
      "", // no feedback
      "", "", [],
      ["single-new-style"], // Single new style
      false, false, false
    );

    // Single style should be in enriched prompt
    expect(result.text).toContain("single-new-style");
    expect(result.text).toContain("Genre:");
  });
});

// ============================================================================
// Performance Instruments Integration Tests
// ============================================================================

describe("AIEngine.generateCreativeBoost performance instruments", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
  });

  it("passes performance instruments from seed genre to conversion", async () => {
    // Arrange - use a genre that has instruments in the registry (e.g., "jazz")
    const seedGenres = ["jazz"];

    // Act
    const result = await engine.generateCreativeBoost(
      50, // creativityLevel
      seedGenres,
      [], // sunoStyles
      "smooth night jazz", // description
      "", // lyricsTopic
      false, // withWordlessVocals
      true, // maxMode
      false // withLyrics
    );

    // Assert - result should contain instruments (exact ones depend on genre registry)
    expect(result.text).toContain("instruments:");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("uses performance instruments for compound genres", async () => {
    // Arrange - compound genre like "ambient rock"
    const seedGenres = ["ambient rock"];

    // Act
    const result = await engine.generateCreativeBoost(
      50,
      seedGenres,
      [],
      "atmospheric rock",
      "",
      false,
      true, // maxMode
      false
    );

    // Assert - should have instruments from both genres blended
    expect(result.text).toContain("instruments:");
  });

  it("handles empty seedGenres gracefully", async () => {
    // Arrange - no seed genres
    const seedGenres: string[] = [];

    // Act
    const result = await engine.generateCreativeBoost(
      50,
      seedGenres,
      [],
      "something cool",
      "",
      false,
      true,
      false
    );

    // Assert - should still produce valid output with fallback instruments
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
    // Arrange
    const seedGenres = ["electronic"];

    // Act
    const result = await engine.refineCreativeBoost(
      "current prompt text",
      "Current Title",
      undefined,
      "make it more energetic", // feedback
      "", // lyricsTopic
      "", // description
      seedGenres,
      [], // sunoStyles
      false, // withWordlessVocals
      true, // maxMode
      false // withLyrics
    );

    // Assert
    expect(result.text).toContain("instruments:");
  });
});

// =============================================================================
// GENRE COUNT ENFORCEMENT TESTS
// Tests for targetGenreCount parameter in refineCreativeBoost
// =============================================================================

describe("AIEngine.refineCreativeBoost genre count enforcement", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for refine that returns a response with genres
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        // Refine LLM response - intentionally returns 2 genres to test enforcement
        return {
          text: '{"title": "Refined Song", "style": "genre: \\"jazz, rock\\"\\nbpm: \\"120\\"\\nmood: \\"smooth\\"\\ninstruments: \\"piano, guitar\\""}',
        };
      } else {
        // Conversion AI response
        return {
          text: JSON.stringify({
            styleTags: "warm, intimate",
            recording: "studio session",
            intro: "Gentle intro",
            verse: "Main verse",
            chorus: "Powerful chorus",
            outro: "Fade out",
          }),
        };
      }
    });
  });

  it("enforces targetGenreCount: 3 to produce exactly 3 genres in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"\nmood: "energetic"', // currentPrompt
      "Original Title",
      undefined,
      "make it more jazzy", // feedback
      "", // lyricsTopic
      "", // description
      ["rock", "jazz", "funk"], // seedGenres - 3 genres
      [], // sunoStyles
      false, // withWordlessVocals
      true, // maxMode
      false, // withLyrics
      3 // targetGenreCount
    );

    // Extract genres from the result
    const genreMatch = result.text.match(/genre:\s*"?([^"\n]+?)(?:"|$)/im);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(3);
  });

  it("enforces targetGenreCount: 1 to produce exactly 1 genre in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock, jazz, funk"\nbpm: "100"', // currentPrompt with 3 genres
      "Original Title",
      undefined,
      "simplify the genre", // feedback
      "", "", ["rock"], [], false, true, false,
      1 // targetGenreCount
    );

    const genreMatch = result.text.match(/genre:\s*"?([^"\n]+?)(?:"|$)/im);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(1);
  });

  it("enforces targetGenreCount: 4 to produce exactly 4 genres in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "100"', // currentPrompt with 1 genre
      "Original Title",
      undefined,
      "make it a fusion", // feedback
      "", "", ["rock", "jazz", "funk", "pop"], [], false, true, false,
      4 // targetGenreCount
    );

    const genreMatch = result.text.match(/genre:\s*"?([^"\n]+?)(?:"|$)/im);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(4);
  });
});

describe("AIEngine.refineCreativeBoost skips enforcement for Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for direct mode
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Refined Title" };
    });
  });

  it("skips genre enforcement when sunoStyles is provided (Direct Mode)", async () => {
    const result = await engine.refineCreativeBoost(
      "lo-fi, chillwave", // currentPrompt
      "Original Title",
      undefined,
      "make it warmer", // feedback
      "", "", [],
      ["lo-fi", "chillwave"], // sunoStyles - triggers Direct Mode
      false, false, false,
      3 // targetGenreCount - should be ignored in Direct Mode
    );

    // Direct Mode returns enriched prompt with styles preserved
    expect(result.text).toContain("lo-fi, chillwave");
    // Should contain Genre: field (from enrichment)
    expect(result.text).toContain("Genre:");
  });

  it("returns exact sunoStyles in Direct Mode regardless of targetGenreCount", async () => {
    const styles = ["synthwave", "retrowave", "outrun"];
    const result = await engine.refineCreativeBoost(
      "old styles",
      "Title",
      undefined,
      "",
      "", "", [],
      styles, // Direct Mode
      false, false, false,
      1 // targetGenreCount should be ignored
    );

    // Styles should be in enriched prompt
    expect(result.text).toContain("synthwave, retrowave, outrun");
    expect(result.text).toContain("Genre:");
  });
});

describe("AIEngine.refineCreativeBoost skips enforcement when targetGenreCount is 0 or undefined", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    // Mock for refine - returns a response that will go through conversion
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        // LLM refine response
        return {
          text: '{"title": "Song Title", "style": "genre: \\"jazz\\"\\nbpm: \\"100\\"\\nmood: \\"cool\\"\\ninstruments: \\"piano\\""}',
        };
      } else {
        // Conversion AI response
        return {
          text: JSON.stringify({
            styleTags: "smooth, warm",
            recording: "studio session",
            intro: "Gentle intro",
            verse: "Main verse",
            chorus: "Powerful chorus",
            outro: "Fade out",
          }),
        };
      }
    });
  });

  it("does not call enforceGenreCount when targetGenreCount is 0", async () => {
    // When targetGenreCount is 0, enforcement is skipped
    // The output should contain a valid genre field (from LLM + conversion)
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"',
      "Title",
      undefined,
      "add jazz elements",
      "", "", ["rock"], [], false, true, false,
      0 // targetGenreCount = 0 means no enforcement
    );

    // Verify we got a valid result with genre field
    expect(result.text).toContain('genre:');
    // Should have made 2 LLM calls (refine + conversion)
    expect(generateTextCalls).toBe(2);
  });

  it("does not call enforceGenreCount when targetGenreCount is undefined", async () => {
    // When targetGenreCount is undefined, enforcement is skipped
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"',
      "Title",
      undefined,
      "add jazz elements",
      "", "", ["rock"], [], false, true, false
      // targetGenreCount not provided (undefined)
    );

    // Verify we got a valid result with genre field
    expect(result.text).toContain('genre:');
    // Should have made 2 LLM calls (refine + conversion)
    expect(generateTextCalls).toBe(2);
  });

  it("enforcement is applied only when targetGenreCount > 0", async () => {
    // Reset mock to return a single-genre response
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Song Title", "style": "genre: \\"jazz\\"\\nbpm: \\"100\\"\\nmood: \\"cool\\"\\ninstruments: \\"piano\\""}',
        };
      } else {
        return {
          text: JSON.stringify({
            styleTags: "smooth",
            recording: "studio",
            intro: "Intro",
            verse: "Verse",
            chorus: "Chorus",
            outro: "Outro",
          }),
        };
      }
    });

    // When targetGenreCount is 3, enforcement adds genres
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"',
      "Title",
      undefined,
      "make it jazzy",
      "", "", ["rock", "jazz", "funk"], [], false, true, false,
      3 // targetGenreCount = 3 triggers enforcement
    );

    // Extract genres from the result
    const genreMatch = result.text.match(/genre:\s*"?([^"\n]+?)(?:"|$)/im);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    // Enforcement should have ensured exactly 3 genres
    expect(genres).toHaveLength(3);
  });
});
