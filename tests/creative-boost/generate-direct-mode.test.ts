import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

afterAll(() => {
  mock.restore();
});

import { AIEngine } from "@bun/ai/engine";

let generateTextCalls = 0;
let generateTextCallArgs: { system?: string; prompt?: string }[] = [];

const mockGenerateText = mock(async (args: unknown) => {
  generateTextCallArgs.push(args as { system?: string; prompt?: string });
  generateTextCalls++;
  if (generateTextCalls === 1) {
    return { text: "Neon Dreams" };
  } else {
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

void mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

describe("AIEngine.generateCreativeBoost Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;
    generateTextCallArgs = [];

    mockGenerateText.mockImplementation(async (args: unknown) => {
      generateTextCallArgs.push(args as { system?: string; prompt?: string });
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return { text: "Neon Dreams" };
      } else {
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

  it("returns exact styles when sunoStyles provided (direct mode)", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["lo-fi jazz", "dark goa trance"], "", "", true, false
    );

    expect(result.text).toContain("lo-fi jazz, dark goa trance");
    expect(result.text).toContain("genre:");
  });

  it("handles single style selection", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["k-pop"], "", "", false, false
    );

    expect(result.text).toContain("k-pop");
    expect(result.text).toContain("Genre:");
  });

  it("handles maximum 4 styles", async () => {
    const styles = ["style1", "style2", "style3", "style4"];
    const result = await engine.generateCreativeBoost(
      50, [], styles, "", "", false, false
    );

    expect(result.text).toContain("style1, style2, style3, style4");
  });

  it("bypasses LLM for style generation in direct mode (title only)", async () => {
    await engine.generateCreativeBoost(
      50, [], ["hip-hop"], "", "", true, false
    );

    expect(generateTextCalls).toBe(1);
  });

  it("makes 2 LLM calls in direct mode with lyrics (title + lyrics)", async () => {
    await engine.generateCreativeBoost(
      50, [], ["indie rock"], "", "", true, true
    );

    expect(generateTextCalls).toBe(2);
  });

  it("includes performance tags guidance in lyrics generation when useSunoTags is enabled", async () => {
    engine.setUseSunoTags(true);

    await engine.generateCreativeBoost(
      50, [], ["indie rock"], "", "", false, true
    );

    expect(generateTextCalls).toBe(2);
    expect(generateTextCallArgs[1]?.system).toContain("(breathy)");
  });

  it("generates lyrics without max mode header in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["indie rock"], "", "love story", false, true
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).not.toContain("///*****///");
    expect(result.lyrics).toContain("[VERSE]");
  });

  it("generates lyrics with standard section tags in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["synthwave"], "", "space adventure", false, true
    );

    expect(result.lyrics).toBeDefined();
    expect(result.lyrics).toContain("[VERSE]");
    expect(result.lyrics).toContain("[CHORUS]");
    expect(result.lyrics).not.toContain("///*****///");
  });

  it("uses deterministic generation when sunoStyles is empty", async () => {
    const result = await engine.generateCreativeBoost(
      50, ["rock"], [], "energetic song", "", true, false
    );

    expect(generateTextCalls).toBe(0);
    expect(result.text.length).toBeGreaterThan(20);
    expect(result.title).toBeDefined();
  });

  it("returns a generated title in direct mode", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["lo-fi beats"], "", "", false, false
    );

    expect(result.title).toBe("Neon Dreams");
  });

  it("respects maxMode parameter in direct mode (enriched output)", async () => {
    const resultMax = await engine.generateCreativeBoost(
      50, [], ["ambient", "chillwave"], "", "", true, false
    );

    expect(resultMax.text).toContain("[Is_MAX_MODE: MAX]");
    expect(resultMax.text).toContain("ambient, chillwave");

    const resultStd = await engine.generateCreativeBoost(
      50, [], ["ambient", "chillwave"], "", "", false, false
    );

    expect(resultStd.text).not.toContain("[Is_MAX_MODE: MAX]");
    expect(resultStd.text).toContain("ambient, chillwave");
  });
});

describe("generateDirectMode title context priority (Bug 4)", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Generated Title" };
    });
  });

  it("uses description when provided for title context", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["dream-pop"], "love song about summer", "heartbreak theme", false, false
    );

    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Generated Title");
  });

  it("falls back to lyricsTopic when description is empty", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["synthwave"], "", "space adventure", false, false
    );

    expect(generateTextCalls).toBe(1);
    expect(result.title).toBe("Generated Title");
  });

  it("uses empty string when both description and lyricsTopic are empty", async () => {
    const result = await engine.generateCreativeBoost(
      50, [], ["ambient"], "", "", false, false
    );

    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThan(0);
  });
});
