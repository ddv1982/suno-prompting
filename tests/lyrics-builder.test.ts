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

    it("should prioritize story/meaning in prompt", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain("CONTENT PRIORITY");
      expect(prompt).toContain("STORY/MEANING");
      expect(prompt).toContain("PRIMARY source");
    });

    it("should include critical distinction between genre and content", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain("CRITICAL DISTINCTION");
      expect(prompt).toContain("Genre affects HOW the story is told");
      expect(prompt).toContain("Genre does NOT affect WHAT the story is about");
    });

    it("should include narrative guidelines", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).toContain("NARRATIVE GUIDELINES");
      expect(prompt).toContain("coherent story");
      expect(prompt).toContain("concrete, specific details");
    });

    it("should NOT contain old genre-matching instruction", () => {
      const prompt = buildLyricsSystemPrompt(false);
      expect(prompt).not.toContain("Match the genre's typical lyrical style and vocabulary");
    });

    it("includes backing vocals guidance when useSunoTags is true", () => {
      const prompt = buildLyricsSystemPrompt(false, true);
      expect(prompt).toContain("BACKING VOCALS");
      expect(prompt).toContain("(ooh)");
      expect(prompt).toContain("LYRIC ECHO");
      expect(prompt).toContain("Do NOT use instruction words like (belt)");
    });

    it("does not include backing vocals guidance when useSunoTags is false", () => {
      const prompt = buildLyricsSystemPrompt(false, false);
      expect(prompt).not.toContain("BACKING VOCALS");
      expect(prompt).not.toContain("(ooh)");
    });
  });

  describe("buildLyricsUserPrompt", () => {
    it("should include description, genre, and mood", () => {
      const prompt = buildLyricsUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("A song about the ocean");
      expect(prompt).toContain("ambient");
      expect(prompt).toContain("peaceful");
    });

    it("should present description as CORE SUBJECT", () => {
      const prompt = buildLyricsUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("CORE SUBJECT");
      expect(prompt).toContain('"A song about the ocean"');
    });

    it("should clarify role of each parameter", () => {
      const prompt = buildLyricsUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("WHAT to write about");
      expect(prompt).toContain("HOW to phrase it");
      expect(prompt).toContain("how it should FEEL");
    });

    it("should warn against replacing story with genre imagery", () => {
      const prompt = buildLyricsUserPrompt("A song about the ocean", "ambient", "peaceful");
      expect(prompt).toContain("do NOT replace the story with genre imagery");
    });

    it("includes genre-specific backing vocals when useSunoTags is true", () => {
      const prompt = buildLyricsUserPrompt("A song about love", "soul", "emotional", true);
      expect(prompt).toContain("Backing vocals for soul");
      expect(prompt).toContain("(oh yeah)");
      expect(prompt).toContain("call and response style");
    });

    it("uses genre-specific backing vocals for rock", () => {
      const prompt = buildLyricsUserPrompt("A song about freedom", "rock", "powerful", true);
      expect(prompt).toContain("Backing vocals for rock");
      expect(prompt).toContain("(hey!)");
      expect(prompt).toContain("repeat with intensity");
    });

    it("does not include backing vocals when useSunoTags is false", () => {
      const prompt = buildLyricsUserPrompt("A song about love", "soul", "emotional", false);
      expect(prompt).not.toContain("Backing vocals for");
    });

    it("uses default backing vocals for unknown genre", () => {
      const prompt = buildLyricsUserPrompt("A song", "unknowngenre", "calm", true);
      expect(prompt).toContain("Backing vocals for unknowngenre");
      expect(prompt).toContain("(ooh)");
      expect(prompt).toContain("repeat key word");
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
