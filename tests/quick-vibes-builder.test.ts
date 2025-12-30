import { describe, it, expect } from "bun:test";
import {
  buildQuickVibesSystemPrompt,
  buildQuickVibesUserPrompt,
  postProcessQuickVibes
} from "@bun/prompt/quick-vibes-builder";
import { QUICK_VIBES_CATEGORIES, QUICK_VIBES_MAX_CHARS } from "@bun/prompt/quick-vibes-categories";

describe("Quick Vibes Builder", () => {
  describe("buildQuickVibesSystemPrompt", () => {
    it("includes 120 char limit instruction", () => {
      const prompt = buildQuickVibesSystemPrompt(false, false);
      expect(prompt).toContain("120 characters");
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

  it("example outputs are under 120 characters", () => {
    for (const [_id, category] of Object.entries(QUICK_VIBES_CATEGORIES)) {
      expect(category.exampleOutput.length).toBeLessThanOrEqual(QUICK_VIBES_MAX_CHARS);
    }
  });

  it("max chars constant is 120", () => {
    expect(QUICK_VIBES_MAX_CHARS).toBe(120);
  });
});
