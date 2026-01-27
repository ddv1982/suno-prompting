import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

afterAll(() => {
  mock.restore();
});

import { AIEngine } from "@bun/ai/engine";

let generateTextCalls = 0;

const mockGenerateText = mock(async () => {
  generateTextCalls++;
  if (generateTextCalls === 1) {
    return {
      text: '{"title": "Refined Song", "style": "genre: \\"jazz, rock\\"\\nbpm: \\"120\\"\\nmood: \\"smooth\\"\\ninstruments: \\"piano, guitar\\""}',
    };
  } else {
    return {
      text: JSON.stringify({
        styleTags: "warm, intimate",
        recording: "studio session",
        intro: "Gentle intro",
        verse: "Main verse",
        chorus: "Powerful chorus",
        outro: "Fade out",
      }),
    };
  }
});

void mock.module("ai", () => ({
  generateText: mockGenerateText,
}));

describe("AIEngine.refineCreativeBoost genre count enforcement", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Refined Song", "style": "genre: \\"jazz, rock\\"\\nbpm: \\"120\\"\\nmood: \\"smooth\\"\\ninstruments: \\"piano, guitar\\""}',
        };
      } else {
        return {
          text: JSON.stringify({
            styleTags: "warm, intimate",
            recording: "studio session",
            intro: "Gentle intro",
            verse: "Main verse",
            chorus: "Powerful chorus",
            outro: "Fade out",
          }),
        };
      }
    });
  });

  it("enforces targetGenreCount: 3 to produce exactly 3 genres in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"\nmood: "energetic"',
      "Original Title", undefined, "make it more jazzy",
      "", "", ["rock", "jazz", "funk"], [], true, false, 3
    );

    const genreMatch = /genre:\s*"?([^"\n]+?)(?:"|$)/im.exec(result.text);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(3);
  });

  it("enforces targetGenreCount: 1 to produce exactly 1 genre in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock, jazz, funk"\nbpm: "100"',
      "Original Title", undefined, "simplify the genre",
      "", "", ["rock"], [], true, false, 1
    );

    const genreMatch = /genre:\s*"?([^"\n]+?)(?:"|$)/im.exec(result.text);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(1);
  });

  it("enforces targetGenreCount: 4 to produce exactly 4 genres in output", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "100"',
      "Original Title", undefined, "make it a fusion",
      "", "", ["rock", "jazz", "funk", "pop"], [], true, false, 4
    );

    const genreMatch = /genre:\s*"?([^"\n]+?)(?:"|$)/im.exec(result.text);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(4);
  });
});

describe("AIEngine.refineCreativeBoost skips enforcement for Direct Mode", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      return { text: "Refined Title" };
    });
  });

  it("skips genre enforcement when sunoStyles is provided (Direct Mode)", async () => {
    const result = await engine.refineCreativeBoost(
      "lo-fi, chillwave", "Original Title", undefined,
      "make it warmer", "", "", [],
      ["lo-fi", "chillwave"], false, false, 3
    );

    expect(result.text).toContain("lo-fi, chillwave");
    expect(result.text).toContain("Genre:");
  });

  it("returns exact sunoStyles in Direct Mode regardless of targetGenreCount", async () => {
    const styles = ["synthwave", "retrowave", "outrun"];
    const result = await engine.refineCreativeBoost(
      "old styles", "Title", undefined,
      "", "", "", [], styles, false, false, 1
    );

    expect(result.text).toContain("synthwave, retrowave, outrun");
    expect(result.text).toContain("Genre:");
  });
});

describe("AIEngine.refineCreativeBoost skips enforcement when targetGenreCount is 0 or undefined", () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine();
    mockGenerateText.mockClear();
    generateTextCalls = 0;

    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Song Title", "style": "genre: \\"jazz\\"\\nbpm: \\"100\\"\\nmood: \\"cool\\"\\ninstruments: \\"piano\\""}',
        };
      } else {
        return {
          text: JSON.stringify({
            styleTags: "smooth, warm",
            recording: "studio session",
            intro: "Gentle intro",
            verse: "Main verse",
            chorus: "Powerful chorus",
            outro: "Fade out",
          }),
        };
      }
    });
  });

  it("does not call enforceGenreCount when targetGenreCount is 0", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"', "Title", undefined,
      "add jazz elements", "", "", ["rock"], [], true, false, 0
    );

    expect(result.text).toContain('genre:');
    expect(generateTextCalls).toBe(2);
  });

  it("does not call enforceGenreCount when targetGenreCount is undefined", async () => {
    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"', "Title", undefined,
      "add jazz elements", "", "", ["rock"], [], true, false
    );

    expect(result.text).toContain('genre:');
    expect(generateTextCalls).toBe(2);
  });

  it("enforcement is applied only when targetGenreCount > 0", async () => {
    mockGenerateText.mockImplementation(async () => {
      generateTextCalls++;
      if (generateTextCalls === 1) {
        return {
          text: '{"title": "Song Title", "style": "genre: \\"jazz\\"\\nbpm: \\"100\\"\\nmood: \\"cool\\"\\ninstruments: \\"piano\\""}',
        };
      } else {
        return {
          text: JSON.stringify({
            styleTags: "smooth",
            recording: "studio",
            intro: "Intro",
            verse: "Verse",
            chorus: "Chorus",
            outro: "Outro",
          }),
        };
      }
    });

    const result = await engine.refineCreativeBoost(
      'genre: "rock"\nbpm: "120"', "Title", undefined,
      "make it jazzy", "", "", ["rock", "jazz", "funk"], [], true, false, 3
    );

    const genreMatch = /genre:\s*"?([^"\n]+?)(?:"|$)/im.exec(result.text);
    const genres = genreMatch?.[1]?.split(",").map(g => g.trim()).filter(Boolean) || [];

    expect(genres).toHaveLength(3);
  });
});
