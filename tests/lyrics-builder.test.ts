import { describe, it, expect } from "bun:test";
import {
  buildLyricsSystemPrompt,
  buildLyricsUserPrompt,
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
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
});
