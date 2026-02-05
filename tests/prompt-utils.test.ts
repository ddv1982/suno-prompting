import { describe, it, expect } from 'bun:test';

import { MAX_MODE_HEADER, MAX_MODE_TAGS_HEADER, isMaxFormat } from '../src/shared/max-format';
import {
  cleanJsonResponse,
  stripMaxModeHeader,
  isStructuredPrompt,
  detectRemixableFields,
} from '../src/shared/prompt-utils';

// ============================================================================
// Test Fixtures
// ============================================================================

/** Sample JSON content used across multiple tests */
const TEST_JSON = '{"prompt": "test"}';
const TEST_JSON_MULTILINE = '{\n  "prompt": "test",\n  "title": "Title"\n}';
const TEST_JSON_WITH_CONTENT = '{"prompt": "Genre: jazz, BPM: 110", "title": "Test"}';

/** JSON wrapped in markdown code blocks */
const JSON_WITH_MARKERS = `\`\`\`json\n${TEST_JSON}\n\`\`\``;
const JSON_OPENING_MARKER_ONLY = `\`\`\`json\n${TEST_JSON}`;
const JSON_CLOSING_MARKER_ONLY = `${TEST_JSON}\n\`\`\``;
const JSON_WITH_WHITESPACE = `  \`\`\`json\n${TEST_JSON}\n\`\`\`  `;
const JSON_MULTILINE_WITH_MARKERS = `\`\`\`json\n${TEST_JSON_MULTILINE}\n\`\`\``;
const JSON_ADJACENT_MARKERS = `\`\`\`json${TEST_JSON}\`\`\``;
const JSON_CONTENT_WITH_MARKERS = `\`\`\`json\n${TEST_JSON_WITH_CONTENT}\n\`\`\``;

// ============================================================================
// cleanJsonResponse Tests
// ============================================================================

describe('cleanJsonResponse', () => {
  it('removes ```json and ``` markers from response', () => {
    expect(cleanJsonResponse(JSON_WITH_MARKERS)).toBe(TEST_JSON);
  });

  it('handles response without markers', () => {
    expect(cleanJsonResponse(TEST_JSON)).toBe(TEST_JSON);
  });

  it('handles response with only opening marker', () => {
    expect(cleanJsonResponse(JSON_OPENING_MARKER_ONLY)).toBe(TEST_JSON);
  });

  it('handles response with only closing marker', () => {
    expect(cleanJsonResponse(JSON_CLOSING_MARKER_ONLY)).toBe(TEST_JSON);
  });

  it('trims whitespace from result', () => {
    expect(cleanJsonResponse(JSON_WITH_WHITESPACE)).toBe(TEST_JSON);
  });

  it('handles multiline JSON content', () => {
    expect(cleanJsonResponse(JSON_MULTILINE_WITH_MARKERS)).toBe(TEST_JSON_MULTILINE);
  });

  it('handles empty input', () => {
    expect(cleanJsonResponse('')).toBe('');
  });

  it('handles whitespace-only input', () => {
    expect(cleanJsonResponse('   \n  ')).toBe('');
  });

  it('produces valid JSON after cleaning', () => {
    const cleaned = cleanJsonResponse(JSON_CONTENT_WITH_MARKERS);
    const parsed = JSON.parse(cleaned);
    expect(parsed.prompt).toBe('Genre: jazz, BPM: 110');
    expect(parsed.title).toBe('Test');
  });

  it('handles adjacent newlines correctly', () => {
    expect(cleanJsonResponse(JSON_ADJACENT_MARKERS)).toBe(TEST_JSON);
  });
});

// ============================================================================
// isMaxFormat Tests
// ============================================================================

// Two MAX mode header formats exist:
// - Standard format: Used by max-conversion.ts, context-preservation.ts
// - Suno V5 tags format: Used by deterministic-builder.ts for faster generation
describe('isMaxFormat', () => {
  it('detects standard MAX_MODE_HEADER format', () => {
    const prompt = `${MAX_MODE_HEADER}
genre: "jazz"
bpm: "110"`;
    expect(isMaxFormat(prompt)).toBe(true);
  });

  it('detects Suno V5 tags format from deterministic builder', () => {
    const prompt = `${MAX_MODE_TAGS_HEADER}

genre: "jazz"
bpm: "110"`;
    expect(isMaxFormat(prompt)).toBe(true);
  });

  it('returns false for non-max structured format', () => {
    expect(isMaxFormat('Genre: jazz\nBPM: 110')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isMaxFormat('')).toBe(false);
  });

  it('detects signature anywhere in text', () => {
    expect(isMaxFormat('Some text\n[Is_MAX_MODE: MAX](MAX)\nMore text')).toBe(true);
    expect(isMaxFormat('Some text\n::tags realistic music ::\nMore text')).toBe(true);
  });
});

// ============================================================================
// stripMaxModeHeader Tests
// ============================================================================

describe('stripMaxModeHeader', () => {
  it('strips standard MAX_MODE_HEADER used by most code paths', () => {
    const prompt = `${MAX_MODE_HEADER}
genre: "jazz"
bpm: "110"`;
    const result = stripMaxModeHeader(prompt);
    expect(result).toBe('genre: "jazz"\nbpm: "110"');
  });

  it('strips Suno V5 tags header used by deterministic builder', () => {
    const prompt = `${MAX_MODE_TAGS_HEADER}

genre: "jazz"
bpm: "110"`;
    const result = stripMaxModeHeader(prompt);
    expect(result).toBe('genre: "jazz"\nbpm: "110"');
  });

  it('returns unchanged if no header present', () => {
    const prompt = 'genre: "jazz"\nbpm: "110"';
    const result = stripMaxModeHeader(prompt);
    expect(result).toBe(prompt);
  });
});

// ============================================================================
// isStructuredPrompt Tests
// ============================================================================

describe('isStructuredPrompt', () => {
  describe('simple descriptions (should NOT match)', () => {
    it('returns false for simple description', () => {
      expect(isStructuredPrompt('a sad song about rain')).toBe(false);
    });

    it('returns false for longer description', () => {
      expect(
        isStructuredPrompt('I want a melancholic ballad about lost love in the style of 80s pop')
      ).toBe(false);
    });

    it('returns false for description with genre word but not as field', () => {
      expect(isStructuredPrompt('Genre fusion of jazz and rock sounds great')).toBe(false);
    });

    it('returns false for description mentioning BPM', () => {
      expect(isStructuredPrompt('My BPM is too slow for dancing')).toBe(false);
    });

    it('returns false for description with mood word', () => {
      expect(isStructuredPrompt('I want something with a warm mood')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isStructuredPrompt('')).toBe(false);
    });
  });

  describe('non-max structured prompts (should match)', () => {
    it('returns true for prompt with Genre field', () => {
      expect(isStructuredPrompt('Genre: rock\nBPM: 120')).toBe(true);
    });

    it('returns true for prompt with BPM field', () => {
      expect(isStructuredPrompt('BPM: 90\nMood: calm')).toBe(true);
    });

    it('returns true for prompt with Mood field', () => {
      expect(isStructuredPrompt('Mood: energetic, powerful')).toBe(true);
    });

    it('returns true for prompt with Instruments field', () => {
      expect(isStructuredPrompt('Instruments: guitar, drums, bass')).toBe(true);
    });

    it('returns true for prompt with section tags', () => {
      expect(isStructuredPrompt('[INTRO] Soft piano opening\n[VERSE] Building tension')).toBe(true);
    });

    it('returns true for prompt with CHORUS tag', () => {
      expect(isStructuredPrompt('Some text\n[CHORUS] Full power')).toBe(true);
    });

    it('returns true for prompt with BRIDGE tag', () => {
      expect(isStructuredPrompt('[BRIDGE] Unexpected turn')).toBe(true);
    });

    it('returns true for prompt with OUTRO tag', () => {
      expect(isStructuredPrompt('[OUTRO] Fading out')).toBe(true);
    });

    it('returns true for full non-max structured prompt', () => {
      const prompt = `[Energetic, Rock]

Genre: rock
BPM: 140
Mood: energetic, powerful
Instruments: electric guitar, drums

[INTRO] Driving guitar riff
[VERSE] Building energy
[CHORUS] Full power explosion`;
      expect(isStructuredPrompt(prompt)).toBe(true);
    });
  });

  describe('max format prompts (should match)', () => {
    it('returns true for full max format prompt', () => {
      const prompt = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
genre: "jazz"
bpm: "110"`;
      expect(isStructuredPrompt(prompt)).toBe(true);
    });

    it('returns true for Suno V5 tags format prompt', () => {
      const prompt = `${MAX_MODE_TAGS_HEADER}

genre: "jazz"
bpm: "110"`;
      expect(isStructuredPrompt(prompt)).toBe(true);
    });

    it('returns true for max format body without header', () => {
      const prompt = `genre: "jazz"
bpm: "110"
instruments: "piano, bass"`;
      expect(isStructuredPrompt(prompt)).toBe(true);
    });

    it('returns true for prompt with style tags field', () => {
      expect(isStructuredPrompt('style tags: "warm, intimate"')).toBe(true);
    });

    it('returns true for prompt with recording field', () => {
      expect(isStructuredPrompt('recording: "studio session"')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles lowercase genre field (max style)', () => {
      expect(isStructuredPrompt('genre: "rock"')).toBe(true);
    });

    it('handles mixed case section tags', () => {
      expect(isStructuredPrompt('[Verse] Some lyrics')).toBe(true);
    });

    it('handles PRE-CHORUS tag', () => {
      expect(isStructuredPrompt('[PRE-CHORUS] Building up')).toBe(true);
    });

    it('handles HOOK tag', () => {
      expect(isStructuredPrompt('[HOOK] Catchy melody')).toBe(true);
    });

    it('matches colon without space (space after colon is optional)', () => {
      expect(isStructuredPrompt('Genre:rock')).toBe(true);
    });

    it('handles multiline with field in middle', () => {
      const prompt = `Some intro text
Genre: electronic
More content`;
      expect(isStructuredPrompt(prompt)).toBe(true);
    });

    it('does NOT match Genre: mid-sentence (not at line start)', () => {
      expect(isStructuredPrompt('The Genre: rock is my favorite')).toBe(false);
    });

    it('returns false for whitespace-only input', () => {
      expect(isStructuredPrompt('   \n\t  ')).toBe(false);
    });

    it('matches standard section tags but not numbered variants', () => {
      // [VERSE] should match
      expect(isStructuredPrompt('[VERSE] Some lyrics')).toBe(true);
      // [Verse 1] should NOT match (numbered variant not in our pattern)
      expect(isStructuredPrompt('[Verse 1] Some lyrics')).toBe(false);
    });

    it('does NOT match field name in middle of word', () => {
      // "Subgenre:" should not match as "Genre:" - it's at line start but starts with "Sub"
      expect(isStructuredPrompt('Subgenre: rock')).toBe(false);
    });
  });
});

// ============================================================================
// detectRemixableFields Tests
// ============================================================================

describe('detectRemixableFields', () => {
  describe('empty/whitespace input', () => {
    it('returns all false for empty string', () => {
      const result = detectRemixableFields('');
      expect(result).toEqual({
        hasGenre: false,
        hasMood: false,
        hasInstruments: false,
        hasStyleTags: false,
        hasRecording: false,
      });
    });

    it('returns all false for whitespace-only string', () => {
      const result = detectRemixableFields('   \n\t  ');
      expect(result).toEqual({
        hasGenre: false,
        hasMood: false,
        hasInstruments: false,
        hasStyleTags: false,
        hasRecording: false,
      });
    });
  });

  describe('Quick Vibes MAX output (Capitalized fields)', () => {
    it('detects Genre, Mood, Instruments in Quick Vibes MAX format', () => {
      const quickVibesMax = `Genre: "lo-fi"
Mood: "golden"
Instruments: "warm synth pad, soft drums, bass"`;
      const result = detectRemixableFields(quickVibesMax);
      expect(result.hasGenre).toBe(true);
      expect(result.hasMood).toBe(true);
      expect(result.hasInstruments).toBe(true);
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(false);
    });

    it('detects fields with MAX header prepended', () => {
      const quickVibesMaxWithHeader = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)
Genre: "lo-fi"
Mood: "golden"
Instruments: "warm synth pad, soft drums, bass"`;
      const result = detectRemixableFields(quickVibesMaxWithHeader);
      expect(result.hasGenre).toBe(true);
      expect(result.hasMood).toBe(true);
      expect(result.hasInstruments).toBe(true);
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(false);
    });
  });

  describe('Full MAX prompt (lowercase fields)', () => {
    it('detects all fields in full MAX format', () => {
      const fullMax = `genre: "jazz"
bpm: "between 80 and 110"
instruments: "upright bass, drums, Rhodes piano"
style tags: "smooth, warm, tape saturation"
recording: "intimate jazz club"`;
      const result = detectRemixableFields(fullMax);
      expect(result.hasGenre).toBe(true);
      expect(result.hasMood).toBe(false); // No Mood in full MAX
      expect(result.hasInstruments).toBe(true);
      expect(result.hasStyleTags).toBe(true);
      expect(result.hasRecording).toBe(true);
    });

    it('detects fields with MAX header', () => {
      const fullMaxWithHeader = `${MAX_MODE_HEADER}
genre: "jazz"
instruments: "piano"
style tags: "warm"
recording: "studio"`;
      const result = detectRemixableFields(fullMaxWithHeader);
      expect(result.hasGenre).toBe(true);
      expect(result.hasInstruments).toBe(true);
      expect(result.hasStyleTags).toBe(true);
      expect(result.hasRecording).toBe(true);
    });
  });

  describe('Standard mode (Capitalized, non-quoted)', () => {
    it('detects fields in standard mode format', () => {
      const standard = `Genre: rock
BPM: 120
Mood: energetic
Instruments: guitar, drums`;
      const result = detectRemixableFields(standard);
      expect(result.hasGenre).toBe(true);
      expect(result.hasMood).toBe(true);
      expect(result.hasInstruments).toBe(true);
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(false);
    });
  });

  describe('partial prompts', () => {
    it('detects only Genre when only Genre present', () => {
      const result = detectRemixableFields('Genre: "ambient"');
      expect(result.hasGenre).toBe(true);
      expect(result.hasMood).toBe(false);
      expect(result.hasInstruments).toBe(false);
    });

    it('detects style tags alone', () => {
      const result = detectRemixableFields('style tags: "vintage, warm"');
      expect(result.hasStyleTags).toBe(true);
      expect(result.hasRecording).toBe(false);
    });

    it('detects recording alone', () => {
      const result = detectRemixableFields('recording: "live session"');
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(true);
    });
  });

  describe('narrative prose (Story Mode)', () => {
    it('returns all false for narrative prose', () => {
      const narrative =
        'A dreamy lo-fi track with warm synthesizers floating over a gentle drum pattern, perfect for late-night study sessions.';
      const result = detectRemixableFields(narrative);
      expect(result.hasGenre).toBe(false);
      expect(result.hasMood).toBe(false);
      expect(result.hasInstruments).toBe(false);
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(false);
    });

    it('returns all false for Story Mode with MAX header', () => {
      const storyWithHeader = `${MAX_MODE_HEADER}

A gentle jazz piano melody drifts through a smoky club, with brushed drums keeping time.`;
      const result = detectRemixableFields(storyWithHeader);
      expect(result.hasGenre).toBe(false);
      expect(result.hasMood).toBe(false);
      expect(result.hasInstruments).toBe(false);
      expect(result.hasStyleTags).toBe(false);
      expect(result.hasRecording).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('does not match field names mid-sentence', () => {
      const result = detectRemixableFields('The Genre: rock is my favorite');
      expect(result.hasGenre).toBe(false);
    });

    it('handles mixed case detection', () => {
      // genre: (lowercase) should be detected
      expect(detectRemixableFields('genre: "rock"').hasGenre).toBe(true);
      // Genre: (capitalized) should be detected
      expect(detectRemixableFields('Genre: rock').hasGenre).toBe(true);
    });

    it('requires quoted value for style tags', () => {
      // style tags: without quotes should not match (different format)
      expect(detectRemixableFields('style tags: warm, vintage').hasStyleTags).toBe(false);
      // style tags: with quotes should match
      expect(detectRemixableFields('style tags: "warm, vintage"').hasStyleTags).toBe(true);
    });

    it('requires quoted value for recording', () => {
      expect(detectRemixableFields('recording: studio').hasRecording).toBe(false);
      expect(detectRemixableFields('recording: "studio"').hasRecording).toBe(true);
    });
  });
});
