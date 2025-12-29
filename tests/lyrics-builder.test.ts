import { describe, it, expect } from "bun:test";
import {
  buildLyricsSystemPrompt,
  buildLyricsUserPrompt,
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  formatFullOutput,
  parseFullOutput,
  isLyricsModeOutput,
  extractStyleSection,
  rebuildLyricsModeOutput
} from "@bun/prompt/lyrics-builder";

describe("lyrics-builder", () => {
  describe("buildLyricsSystemPrompt", () => {
    it("should include section tags in prompt", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain("[INTRO]");
      expect(prompt).toContain("[VERSE]");
      expect(prompt).toContain("[CHORUS]");
      expect(prompt).toContain("[BRIDGE]");
      expect(prompt).toContain("[OUTRO]");
    });

    it("should not include max mode prefix when maxMode is false", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).not.toContain("///*****///");
      expect(prompt).not.toContain("CRITICAL REQUIREMENT");
    });

    it("should include max mode prefix instructions when maxMode is true", () => {
      const prompt = buildLyricsSystemPrompt(true);
      expect(prompt).toContain("///*****///");
      expect(prompt).toContain("CRITICAL REQUIREMENT");
      expect(prompt).toContain("VERY FIRST LINE");
    });
  });

  describe("buildLyricsUserPrompt", () => {
    it("should include description, genre, and mood", () => {
      const prompt = buildLyricsUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("A song about the ocean");
      expect(prompt).toContain("ambient");
      expect(prompt).toContain("peaceful");
    });
  });

  describe("buildTitleSystemPrompt", () => {
    it("should include rules for title generation", () => {
      const prompt = buildTitleSystemPrompt();
      expect(prompt).toContain("title");
      expect(prompt).toContain("short");
      expect(prompt).toContain("1-5 words");
    });
  });

  describe("buildTitleUserPrompt", () => {
    it("should include description, genre, and mood", () => {
      const prompt = buildTitleUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("A song about the ocean");
      expect(prompt).toContain("ambient");
      expect(prompt).toContain("peaceful");
    });
  });

  describe("formatFullOutput", () => {
    it("should format all three sections", () => {
      const output = formatFullOutput("My Title", "genre: ambient", "[VERSE]\nLyrics here");
      expect(output).toContain("=== TITLE ===");
      expect(output).toContain("My Title");
      expect(output).toContain("=== STYLE ===");
      expect(output).toContain("genre: ambient");
      expect(output).toContain("=== LYRICS ===");
      expect(output).toContain("[VERSE]");
    });

    it("should handle undefined title", () => {
      const output = formatFullOutput(undefined, "genre: ambient", "[VERSE]\nLyrics");
      expect(output).not.toContain("=== TITLE ===");
      expect(output).toContain("=== STYLE ===");
      expect(output).toContain("=== LYRICS ===");
    });

    it("should handle undefined lyrics", () => {
      const output = formatFullOutput("Title", "genre: ambient", undefined);
      expect(output).toContain("=== TITLE ===");
      expect(output).toContain("=== STYLE ===");
      expect(output).not.toContain("=== LYRICS ===");
    });
  });

  describe("parseFullOutput", () => {
    it("should parse all three sections", () => {
      const input = `=== TITLE ===
Ocean Dreams

=== STYLE ===
genre: "ambient"
mood: "peaceful"

=== LYRICS ===
[INTRO]
The waves crash softly`;

      const result = parseFullOutput(input);
      expect(result.title).toBe("Ocean Dreams");
      expect(result.style).toContain("genre: \"ambient\"");
      expect(result.style).toContain("mood: \"peaceful\"");
      expect(result.lyrics).toContain("[INTRO]");
      expect(result.lyrics).toContain("The waves crash softly");
    });

    it("should handle output with only style and lyrics", () => {
      const input = `=== STYLE ===
genre: "rock"

=== LYRICS ===
[VERSE]
Rock on`;

      const result = parseFullOutput(input);
      expect(result.title).toBeUndefined();
      expect(result.style).toBe("genre: \"rock\"");
      expect(result.lyrics).toContain("[VERSE]");
    });

    it("should handle multiline content in each section", () => {
      const input = `=== TITLE ===
My Song

=== STYLE ===
genre: "pop"
mood: "happy"
instruments: "guitar, drums"

=== LYRICS ===
[INTRO]
La la la

[VERSE]
Verse lyrics here
Second line of verse

[CHORUS]
Chorus lyrics`;

      const result = parseFullOutput(input);
      expect(result.title).toBe("My Song");
      expect(result.style).toContain("genre: \"pop\"");
      expect(result.style).toContain("instruments: \"guitar, drums\"");
      expect(result.lyrics).toContain("[INTRO]");
      expect(result.lyrics).toContain("[VERSE]");
      expect(result.lyrics).toContain("[CHORUS]");
    });
  });

  describe("isLyricsModeOutput", () => {
    it("should return true for lyrics mode output", () => {
      const input = `=== TITLE ===
Title

=== STYLE ===
genre: "ambient"

=== LYRICS ===
[VERSE]
Lyrics`;
      expect(isLyricsModeOutput(input)).toBe(true);
    });

    it("should return false for regular prompt output", () => {
      const input = `genre: "ambient"
mood: "peaceful"
instruments: "synth"`;
      expect(isLyricsModeOutput(input)).toBe(false);
    });

    it("should return false if only STYLE section exists", () => {
      const input = `=== STYLE ===
genre: "ambient"`;
      expect(isLyricsModeOutput(input)).toBe(false);
    });
  });

  describe("extractStyleSection", () => {
    it("should extract style section from lyrics mode output", () => {
      const input = `=== TITLE ===
Title

=== STYLE ===
genre: "ambient"
mood: "peaceful"

=== LYRICS ===
[VERSE]
Lyrics`;
      const style = extractStyleSection(input);
      expect(style).toContain("genre: \"ambient\"");
      expect(style).toContain("mood: \"peaceful\"");
      expect(style).not.toContain("=== TITLE ===");
      expect(style).not.toContain("=== LYRICS ===");
    });

    it("should return original text for non-lyrics mode output", () => {
      const input = `genre: "ambient"
mood: "peaceful"`;
      expect(extractStyleSection(input)).toBe(input);
    });
  });

  describe("rebuildLyricsModeOutput", () => {
    it("should rebuild with new style while preserving title and lyrics", () => {
      const original = `=== TITLE ===
Ocean Dreams

=== STYLE ===
genre: "ambient"
mood: "peaceful"

=== LYRICS ===
[VERSE]
Old lyrics`;

      const newStyle = `genre: "rock"
mood: "energetic"`;

      const rebuilt = rebuildLyricsModeOutput(original, newStyle);
      expect(rebuilt).toContain("=== TITLE ===");
      expect(rebuilt).toContain("Ocean Dreams");
      expect(rebuilt).toContain("=== STYLE ===");
      expect(rebuilt).toContain("genre: \"rock\"");
      expect(rebuilt).toContain("mood: \"energetic\"");
      expect(rebuilt).not.toContain("genre: \"ambient\"");
      expect(rebuilt).toContain("=== LYRICS ===");
      expect(rebuilt).toContain("[VERSE]");
      expect(rebuilt).toContain("Old lyrics");
    });
  });
});
