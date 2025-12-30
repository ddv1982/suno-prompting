import { describe, it, expect } from "bun:test";
import {
  buildQuickVibesSystemPrompt,
  buildQuickVibesUserPrompt,
  postProcessQuickVibes,
  injectQuickVibesMaxTags,
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt
} from "@bun/prompt/quick-vibes-builder";
import { QUICK_VIBES_CATEGORIES, QUICK_VIBES_MAX_CHARS } from "@bun/prompt/quick-vibes-categories";

describe("Quick Vibes Builder", () => {
  describe("buildQuickVibesSystemPrompt", () => {
    it("includes char limit instruction", () => {
      const prompt = buildQuickVibesSystemPrompt(false, false);
      expect(prompt).toContain(`${QUICK_VIBES_MAX_CHARS} characters`);
    });

    it("handles instrumental mode (no vocals)", () => {
      const prompt = buildQuickVibesSystemPrompt(false, false);
      expect(prompt).toContain("instrumental");
      expect(prompt).toContain("do NOT mention vocals");
    });

    it("handles wordless vocals mode", () => {
      const prompt = buildQuickVibesSystemPrompt(false, true);
      expect(prompt).toContain("WORDLESS vocals");
      expect(prompt).toContain("humming");
    });

    it("includes Max Mode realism tags when enabled", () => {
      const prompt = buildQuickVibesSystemPrompt(true, false);
      expect(prompt).toContain("realism tags");
      expect(prompt).toContain("vinyl warmth");
    });

    it("excludes Max Mode tags when disabled", () => {
      const prompt = buildQuickVibesSystemPrompt(false, false);
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
      expect(result.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
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
  it("defines all 6 categories", () => {
    const categories = Object.keys(QUICK_VIBES_CATEGORIES);
    expect(categories).toHaveLength(6);
    expect(categories).toContain("lofi-study");
    expect(categories).toContain("cafe-coffeeshop");
    expect(categories).toContain("ambient-focus");
    expect(categories).toContain("latenight-chill");
    expect(categories).toContain("cozy-rainy");
    expect(categories).toContain("lofi-chill");
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

describe("injectQuickVibesMaxTags", () => {
  it("adds a lo-fi tag when space permits", () => {
    const prompt = "dreamy lo-fi beats";
    const result = injectQuickVibesMaxTags(prompt, QUICK_VIBES_MAX_CHARS);
    expect(result.length).toBeGreaterThan(prompt.length);
    expect(result).toContain(prompt);
    expect(result).toContain(", ");
  });

  it("returns original prompt if tag would exceed limit", () => {
    const prompt = "a".repeat(QUICK_VIBES_MAX_CHARS - 5);
    const result = injectQuickVibesMaxTags(prompt, QUICK_VIBES_MAX_CHARS);
    expect(result).toBe(prompt);
  });

  it("adds one of the known lo-fi tags", () => {
    const prompt = "chill vibes";
    const result = injectQuickVibesMaxTags(prompt, QUICK_VIBES_MAX_CHARS);
    const knownTags = ["vinyl warmth", "tape hiss", "lo-fi dusty", "analog warmth", "tape saturation"];
    const hasKnownTag = knownTags.some(tag => result.includes(tag));
    expect(hasKnownTag).toBe(true);
  });
});

describe("buildQuickVibesRefineSystemPrompt", () => {
  it("includes base Quick Vibes instructions", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false, false);
    expect(prompt).toContain(`${QUICK_VIBES_MAX_CHARS} characters`);
    expect(prompt).toContain("Quick Vibes");
  });

  it("includes refinement instructions", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false, false);
    expect(prompt).toContain("REFINING");
    expect(prompt).toContain("user feedback");
  });

  it("includes Max Mode instructions when enabled", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(true, false);
    expect(prompt).toContain("realism tags");
  });

  it("includes wordless vocals instructions when enabled", () => {
    const prompt = buildQuickVibesRefineSystemPrompt(false, true);
    expect(prompt).toContain("WORDLESS vocals");
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
});

describe("applyQuickVibesMaxMode", () => {
  it("prepends MAX_MODE_HEADER when maxMode is true", () => {
    const result = applyQuickVibesMaxMode("chill vibes", true, QUICK_VIBES_MAX_CHARS);
    expect(result).toContain("[Is_MAX_MODE: MAX]");
    expect(result).toContain("[QUALITY: MAX]");
    expect(result).toContain("chill vibes");
  });

  it("returns prompt unchanged when maxMode is false", () => {
    const result = applyQuickVibesMaxMode("chill vibes", false, QUICK_VIBES_MAX_CHARS);
    expect(result).toBe("chill vibes");
  });

  it("injects lo-fi tags before prepending header", () => {
    const result = applyQuickVibesMaxMode("dreamy beats", true, QUICK_VIBES_MAX_CHARS);
    const knownTags = ["vinyl warmth", "tape hiss", "lo-fi dusty", "analog warmth", "tape saturation"];
    const hasKnownTag = knownTags.some(tag => result.includes(tag));
    expect(hasKnownTag).toBe(true);
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
