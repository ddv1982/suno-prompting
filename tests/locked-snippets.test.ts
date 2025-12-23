import { expect, test, describe } from "bun:test";
import { LOCKED_PLACEHOLDER } from "@bun/prompt/builders";
import {
  swapLockedPhraseIn,
  swapLockedPhraseOut,
  truncateToLimit,
  stripLeakedMetaLines,
  isValidLockedPhrase,
} from "@bun/prompt/postprocess";
import { validateLockedPhrase } from "@shared/validation";
import { APP_CONSTANTS } from "@shared/constants";

describe("locked phrase placeholder", () => {
  const testPhrase = "A beautiful electric guitar lead building in emotion";

  describe("swapLockedPhraseIn", () => {
    test("replaces locked phrase with placeholder", () => {
      const text = `[VERSE] ${testPhrase} with soft piano.`;
      const result = swapLockedPhraseIn(text, testPhrase);
      expect(result).toBe(`[VERSE] ${LOCKED_PLACEHOLDER} with soft piano.`);
      expect(result).not.toContain(testPhrase);
    });

    test("returns original text when phrase is empty", () => {
      const text = "Some prompt text";
      expect(swapLockedPhraseIn(text, "")).toBe(text);
    });

    test("returns original text when phrase not found", () => {
      const text = "Some prompt text";
      expect(swapLockedPhraseIn(text, "not found")).toBe(text);
    });
  });

  describe("swapLockedPhraseOut", () => {
    test("replaces placeholder with locked phrase", () => {
      const text = `[VERSE] ${LOCKED_PLACEHOLDER} with soft piano.`;
      const result = swapLockedPhraseOut(text, testPhrase);
      expect(result).toBe(`[VERSE] ${testPhrase} with soft piano.`);
      expect(result).not.toContain(LOCKED_PLACEHOLDER);
    });

    test("returns original text when phrase is empty", () => {
      const text = `Some ${LOCKED_PLACEHOLDER} text`;
      expect(swapLockedPhraseOut(text, "")).toBe(text);
    });

    test("preserves typos and unconventional text exactly", () => {
      const phraseWithTypo = "buildling intensity supported by beautful melody";
      const text = `[CHORUS] ${LOCKED_PLACEHOLDER} rising.`;
      const result = swapLockedPhraseOut(text, phraseWithTypo);
      expect(result).toContain("buildling");
      expect(result).toContain("beautful");
    });
  });

  describe("placeholder survives post-processing", () => {
    test("placeholder survives truncation", () => {
      const textWithPlaceholder = `[Intro] Some text ${LOCKED_PLACEHOLDER} more text at the end for padding to make it longer`;
      const truncated = truncateToLimit(textWithPlaceholder, 100);
      expect(truncated).toContain(LOCKED_PLACEHOLDER);
    });

    test("placeholder survives meta stripping", () => {
      const textWithPlaceholder = `Remove word repetition\n[VERSE] ${LOCKED_PLACEHOLDER} with emotion.`;
      const stripped = stripLeakedMetaLines(textWithPlaceholder);
      expect(stripped).toContain(LOCKED_PLACEHOLDER);
      expect(stripped).not.toContain("Remove word repetition");
    });
  });

  describe("round-trip preservation", () => {
    test("swap in and out preserves original text exactly", () => {
      const originalPrompt = `[VERSE] ${testPhrase} with soft piano accompaniment.`;
      const swappedIn = swapLockedPhraseIn(originalPrompt, testPhrase);
      const swappedOut = swapLockedPhraseOut(swappedIn, testPhrase);
      expect(swappedOut).toBe(originalPrompt);
    });

    test("preserves special characters in locked phrase", () => {
      const specialPhrase = "Guitar (electric) & bass - building intensity!";
      const originalPrompt = `[VERSE] ${specialPhrase} more content.`;
      const swappedIn = swapLockedPhraseIn(originalPrompt, specialPhrase);
      const swappedOut = swapLockedPhraseOut(swappedIn, specialPhrase);
      expect(swappedOut).toBe(originalPrompt);
    });
  });

  describe("replaceAll behavior", () => {
    test("replaces all occurrences of locked phrase", () => {
      const phrase = "repeating melody";
      const text = `[VERSE] ${phrase} [CHORUS] ${phrase} [OUTRO] ${phrase}`;
      const result = swapLockedPhraseIn(text, phrase);
      const occurrences = (result.match(new RegExp(LOCKED_PLACEHOLDER, 'g')) || []).length;
      expect(occurrences).toBe(3);
    });

    test("restores all placeholder occurrences", () => {
      const phrase = "test phrase";
      const text = `${LOCKED_PLACEHOLDER} and ${LOCKED_PLACEHOLDER}`;
      const result = swapLockedPhraseOut(text, phrase);
      expect(result).toBe(`${phrase} and ${phrase}`);
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

    test("returns false for phrases containing placeholder", () => {
      expect(isValidLockedPhrase(`contains ${LOCKED_PLACEHOLDER}`)).toBe(false);
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
