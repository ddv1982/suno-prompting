import { expect, test, describe } from "bun:test";
import {
  injectLockedPhrase,
  isValidLockedPhrase,
} from "@bun/prompt/postprocess";
import { validateLockedPhrase } from "@shared/validation";
import { APP_CONSTANTS } from "@shared/constants";

describe("locked phrase", () => {
  describe("injectLockedPhrase", () => {
    test("injects into max mode instruments field", () => {
      const prompt = 'instruments: "piano, guitar"';
      const result = injectLockedPhrase(prompt, "my locked phrase", true);
      expect(result).toBe('instruments: "piano, guitar, my locked phrase"');
    });

    test("injects into normal mode Instruments line", () => {
      const prompt = "Instruments: piano, guitar";
      const result = injectLockedPhrase(prompt, "my locked phrase", false);
      expect(result).toBe("Instruments: piano, guitar, my locked phrase");
    });

    test("returns original prompt when no locked phrase", () => {
      const prompt = 'instruments: "piano"';
      expect(injectLockedPhrase(prompt, "", true)).toBe(prompt);
    });

    test("appends to end if no instruments field found in max mode", () => {
      const prompt = 'genre: "jazz"';
      const result = injectLockedPhrase(prompt, "my phrase", true);
      expect(result).toBe('genre: "jazz"\nmy phrase');
    });

    test("appends to end if no instruments field found in normal mode", () => {
      const prompt = "Genre: jazz";
      const result = injectLockedPhrase(prompt, "my phrase", false);
      expect(result).toBe("Genre: jazz\nmy phrase");
    });

    test("preserves special characters in locked phrase", () => {
      const phrase = "Guitar (electric) & bass - building intensity!";
      const prompt = 'instruments: "piano"';
      const result = injectLockedPhrase(prompt, phrase, true);
      expect(result).toContain(phrase);
    });

    test("handles multiline max mode prompt", () => {
      const prompt = `genre: "jazz"
bpm: "120"
instruments: "piano, drums"
style tags: "warm, intimate"`;
      const result = injectLockedPhrase(prompt, "my phrase", true);
      expect(result).toContain('instruments: "piano, drums, my phrase"');
      expect(result).toContain('genre: "jazz"');
      expect(result).toContain('style tags: "warm, intimate"');
    });

    test("handles multiline normal mode prompt", () => {
      const prompt = `[Emotional, Jazz, Key: C Major]

Genre: jazz
BPM: 120
Instruments: piano, drums
Mood: warm, intimate`;
      const result = injectLockedPhrase(prompt, "my phrase", false);
      expect(result).toContain("Instruments: piano, drums, my phrase");
      expect(result).toContain("Genre: jazz");
      expect(result).toContain("Mood: warm, intimate");
    });

    test("is case-insensitive for field matching", () => {
      const prompt = 'INSTRUMENTS: "piano"';
      const result = injectLockedPhrase(prompt, "phrase", true);
      expect(result).toContain("phrase");
    });
  });

  describe("isValidLockedPhrase", () => {
    test("returns true for normal phrases", () => {
      expect(isValidLockedPhrase("A beautiful melody")).toBe(true);
    });

    test("returns true for empty string", () => {
      expect(isValidLockedPhrase("")).toBe(true);
    });

    test("returns false for phrases containing {{", () => {
      expect(isValidLockedPhrase("test {{ content")).toBe(false);
    });

    test("returns false for phrases containing }}", () => {
      expect(isValidLockedPhrase("test }} content")).toBe(false);
    });

    test("returns true for phrases with other special characters", () => {
      expect(isValidLockedPhrase("Guitar (electric) & bass!")).toBe(true);
    });
  });

  describe("validateLockedPhrase", () => {
    test("returns valid for normal phrases", () => {
      const result = validateLockedPhrase("A beautiful melody");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test("returns valid for empty string", () => {
      const result = validateLockedPhrase("");
      expect(result.isValid).toBe(true);
    });

    test("returns error for phrases exceeding max length", () => {
      const longPhrase = "a".repeat(APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS + 1);
      const result = validateLockedPhrase(longPhrase);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    test("returns error for phrases with {{ characters", () => {
      const result = validateLockedPhrase("contains {{ brackets");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("{{");
    });

    test("returns error for phrases with }} characters", () => {
      const result = validateLockedPhrase("contains }} brackets");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("}}");
    });

    test("allows phrases at exactly max length", () => {
      const exactPhrase = "a".repeat(APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS);
      const result = validateLockedPhrase(exactPhrase);
      expect(result.isValid).toBe(true);
    });
  });
});
