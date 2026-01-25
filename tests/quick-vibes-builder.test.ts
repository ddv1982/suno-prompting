import { describe, it, expect } from "bun:test";

import {
  postProcessQuickVibes,
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
  _testHelpers
} from "@bun/prompt/quick-vibes-builder";
import { QUICK_VIBES_CATEGORIES, QUICK_VIBES_MAX_CHARS, QUICK_VIBES_GENERATION_LIMIT } from "@bun/prompt/quick-vibes-categories";

const {
  buildQuickVibesSystemPrompt,
  buildQuickVibesUserPrompt,
} = _testHelpers;

describe("Quick Vibes Builder", () => {
  describe("buildQuickVibesSystemPrompt", () => {
    it("includes char limit instruction", () => {
      const prompt = buildQuickVibesSystemPrompt(false);
      expect(prompt).toContain(`${QUICK_VIBES_GENERATION_LIMIT} characters`);
    });

    it("handles instrumental mode (no vocals)", () => {
      const prompt = buildQuickVibesSystemPrompt(false);
      expect(prompt).toContain("instrumental");
      expect(prompt).toContain("do NOT mention vocals");
    });

    it("handles wordless vocals mode", () => {
      const prompt = buildQuickVibesSystemPrompt(true);
      expect(prompt).toContain("WORDLESS VOCALS");
      expect(prompt).toContain("wordless vocalizations");
    });

    it("excludes realism tags instructions", () => {
      const prompt = buildQuickVibesSystemPrompt(false);
      expect(prompt).not.toContain("vinyl warmth");
    });
  });

  describe("buildQuickVibesUserPrompt", () => {
    it("includes category info when provided", () => {
      const prompt = buildQuickVibesUserPrompt("lofi-study", "");
      expect(prompt).toContain("Lo-fi / Study");
      expect(prompt).toContain("Keywords:");
    });

    it("includes custom description when provided", () => {
      const prompt = buildQuickVibesUserPrompt(null, "late night coding");
      expect(prompt).toContain("late night coding");
    });

    it("combines category and custom description", () => {
      const prompt = buildQuickVibesUserPrompt("cafe-coffeeshop", "sunday morning");
      expect(prompt).toContain("Cafe / Coffee shop");
      expect(prompt).toContain("sunday morning");
    });

    it("returns fallback for empty input", () => {
      const prompt = buildQuickVibesUserPrompt(null, "");
      expect(prompt).toContain("generic");
    });

    it("includes example output for category", () => {
      const prompt = buildQuickVibesUserPrompt("ambient-focus", "");
      expect(prompt).toContain("Example style:");
    });
  });

  describe("postProcessQuickVibes", () => {
    it("trims whitespace", () => {
      const result = postProcessQuickVibes("  chill lo-fi beats  ");
      expect(result).toBe("chill lo-fi beats");
    });

    it("enforces max character limit", () => {
      const longText = "a".repeat(200);
      const result = postProcessQuickVibes(longText);
      expect(result.length).toBeLessThanOrEqual(QUICK_VIBES_GENERATION_LIMIT);
    });

    it("removes section tags", () => {
      const result = postProcessQuickVibes("[VERSE] chill beats [CHORUS] for studying");
      expect(result).not.toContain("[VERSE]");
      expect(result).not.toContain("[CHORUS]");
    });

    it("removes markdown code blocks", () => {
      const result = postProcessQuickVibes("```json\nchill beats\n```");
      expect(result).not.toContain("```");
    });

    it("removes surrounding quotes", () => {
      const result = postProcessQuickVibes('"chill lo-fi beats"');
      expect(result).toBe("chill lo-fi beats");
    });

    it("removes double spaces", () => {
      const result = postProcessQuickVibes("chill  lo-fi   beats");
      expect(result).toBe("chill lo-fi beats");
    });
  });
});

describe("Quick Vibes Categories", () => {
  it("defines all 16 categories", () => {
    const categories = Object.keys(QUICK_VIBES_CATEGORIES);
    expect(categories).toHaveLength(16);
    // Original 6 categories
    expect(categories).toContain("lofi-study");
    expect(categories).toContain("cafe-coffeeshop");
    expect(categories).toContain("ambient-focus");
    expect(categories).toContain("latenight-chill");
    expect(categories).toContain("cozy-rainy");
    expect(categories).toContain("lofi-chill");
    // New v3.0 categories
    expect(categories).toContain("workout-energy");
    expect(categories).toContain("morning-sunshine");
    expect(categories).toContain("sunset-golden");
    expect(categories).toContain("dinner-party");
    expect(categories).toContain("road-trip");
    expect(categories).toContain("gaming-focus");
    expect(categories).toContain("romantic-evening");
    expect(categories).toContain("meditation-zen");
    expect(categories).toContain("creative-flow");
    expect(categories).toContain("party-night");
  });

  it("each category has required fields", () => {
    for (const [_id, category] of Object.entries(QUICK_VIBES_CATEGORIES)) {
      expect(category.label).toBeDefined();
      expect(category.label.length).toBeGreaterThan(0);
      expect(category.description).toBeDefined();
      expect(category.description.length).toBeGreaterThan(0);
      expect(category.keywords).toBeDefined();
      expect(category.keywords.length).toBeGreaterThan(0);
      expect(category.exampleOutput).toBeDefined();
      expect(category.exampleOutput.length).toBeGreaterThan(0);
    }
  });

  it("example outputs are under max chars limit", () => {
    for (const [_id, category] of Object.entries(QUICK_VIBES_CATEGORIES)) {
      expect(category.exampleOutput.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
    }
  });

  it("max chars constant is defined and positive", () => {
    expect(QUICK_VIBES_MAX_CHARS).toBeGreaterThan(0);
  });
});

describe("buildQuickVibesRefineSystemPrompt", () => {
  it("includes base Quick Vibes instructions", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false);
    expect(prompt).toContain(`${QUICK_VIBES_GENERATION_LIMIT} characters`);
    expect(prompt).toContain("Quick Vibes");
  });

  it("includes refinement instructions", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false);
    expect(prompt).toContain("REFINING");
    expect(prompt).toContain("user feedback");
  });

  it("excludes realism tags instructions", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false);
    expect(prompt).not.toContain("realism tags");
    expect(prompt).not.toContain("vinyl warmth");
  });

  it("includes wordless vocals instructions when enabled", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(true);
    expect(prompt).toContain("WORDLESS VOCALS");
  });
});

describe("buildQuickVibesRefineUserPrompt", () => {
  it("includes current prompt", () => {
    const prompt = buildQuickVibesRefineUserPrompt("dreamy lo-fi beats", "make it warmer");
    expect(prompt).toContain("dreamy lo-fi beats");
  });

  it("includes user feedback", () => {
    const prompt = buildQuickVibesRefineUserPrompt("dreamy lo-fi beats", "make it warmer");
    expect(prompt).toContain("make it warmer");
  });

  it("formats prompt correctly", () => {
    const prompt = buildQuickVibesRefineUserPrompt("chill vibes", "add rain sounds");
    expect(prompt).toContain("Current prompt:");
    expect(prompt).toContain("User feedback:");
    expect(prompt).toContain("Generate the refined prompt:");
  });

  it("includes category context when provided", () => {
    const prompt = buildQuickVibesRefineUserPrompt("chill vibes", "make it warmer", "lofi-study");
    expect(prompt).toContain("Refine toward this category style");
    expect(prompt).toContain("Lo-fi / Study");
    expect(prompt).toContain("Keywords:");
  });

  it("works with category only (no feedback)", () => {
    const prompt = buildQuickVibesRefineUserPrompt("chill vibes", "", "cafe-coffeeshop");
    expect(prompt).toContain("Refine toward this category style");
    expect(prompt).toContain("Cafe / Coffee shop");
    expect(prompt).not.toContain("User feedback:");
  });

  it("excludes category section when not provided", () => {
    const prompt = buildQuickVibesRefineUserPrompt("chill vibes", "more dreamy");
    expect(prompt).not.toContain("Refine toward this category style");
  });
});

describe("applyQuickVibesMaxMode", () => {
  it("prepends MAX_MODE_HEADER when maxMode is true", () => {
    const result = applyQuickVibesMaxMode("chill vibes", true);
    expect(result).toContain("[Is_MAX_MODE: MAX]");
    expect(result).toContain("[QUALITY: MAX]");
    expect(result).toContain("chill vibes");
  });

  it("returns prompt unchanged when maxMode is false", () => {
    const result = applyQuickVibesMaxMode("chill vibes", false);
    expect(result).toBe("chill vibes");
  });

  it("preserves prompt content without adding realism tags", () => {
    const result = applyQuickVibesMaxMode("dreamy beats", true);
    expect(result).toContain("dreamy beats");
    expect(result).not.toContain("vinyl warmth");
    expect(result).not.toContain("tape hiss");
  });
});

describe("stripMaxModeHeader", () => {
  it("strips header from prompt", () => {
    const withHeader = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
chill vibes`;
    expect(stripMaxModeHeader(withHeader)).toBe("chill vibes");
  });

  it("returns prompt unchanged if no header", () => {
    expect(stripMaxModeHeader("chill vibes")).toBe("chill vibes");
  });

  it("handles prompt with header and multiple lines of content", () => {
    const withHeader = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
dreamy lo-fi beats, vinyl warmth`;
    expect(stripMaxModeHeader(withHeader)).toBe("dreamy lo-fi beats, vinyl warmth");
  });
});
