import { expect, test, describe } from "bun:test";
import { validatePrompt } from "@shared/validation";
import { _testStripLeakedMetaLines } from "@bun/ai/engine";

describe("validatePrompt", () => {
    test("should pass for valid prompt under 1000 characters", () => {
        const prompt = "A beautiful synthwave track with neon vibes.";
        const result = validatePrompt(prompt);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.charCount).toBe(prompt.length);
    });

    test("should fail for prompt over 1000 characters", () => {
        const longPrompt = "a".repeat(1001);
        const result = validatePrompt(longPrompt);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Prompt exceeds 1000 characters (1001).");
        expect(result.charCount).toBe(1001);
    });

    test("should detect contradictory tags and provide warnings", () => {
        const prompt = "A lo-fi high fidelity track.";
        const result = validatePrompt(prompt);
        expect(result.isValid).toBe(true); // Warnings don't make it invalid
        expect(result.warnings).toContain('Detected contradictory tags: "lo-fi" and "high fidelity".');
    });

    test("should detect multiple contradictory tags", () => {
        const prompt = "A lo-fi pristine acoustic synth track.";
        const result = validatePrompt(prompt);
        expect(result.warnings).toContain('Detected contradictory tags: "lo-fi" and "pristine".');
        expect(result.warnings).toContain('Detected contradictory tags: "acoustic" and "synth".');
    });

    test("should be case-insensitive when detecting contradictory tags", () => {
        const prompt = "LO-FI and STUDIO QUALITY";
        const result = validatePrompt(prompt);
        expect(result.warnings).toContain('Detected contradictory tags: "lo-fi" and "studio quality".');
    });

    test("should handle empty prompt", () => {
        const result = validatePrompt("");
        expect(result.isValid).toBe(true);
        expect(result.charCount).toBe(0);
    });
});

describe("stripLeakedMetaLines", () => {
    test("removes leaked meta-instruction lines while preserving the prompt", () => {
        const input = [
            "Remove word repetition while preserving meaning and musical quality",
            "Mood, Genre, Key: C minor",
            "Instruments: synth pad, piano",
            "[VERSE] drifting neon fog over empty streets",
        ].join("\n");

        const out = _testStripLeakedMetaLines(input);
        expect(out).not.toContain("Remove word repetition");
        expect(out).toContain("Mood, Genre, Key");
        expect(out).toContain("[VERSE]");
    });

    test("removes common 'output only' style leakage", () => {
        const input = [
            "Output ONLY the revised prompt.",
            "A minimal ambient piece with soft synth pads.",
        ].join("\n");

        const out = _testStripLeakedMetaLines(input);
        expect(out).toBe("A minimal ambient piece with soft synth pads.");
    });
});
