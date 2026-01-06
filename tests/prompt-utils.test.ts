import { describe, it, expect } from 'bun:test';

import { MAX_MODE_HEADER, isMaxFormat } from '../src/shared/max-format';
import { cleanJsonResponse, stripMaxModeHeader, isStructuredPrompt } from '../src/shared/prompt-utils';

// Suno V5 tags format header (used by deterministic builder)
const MAX_MODE_TAGS_HEADER = `::tags realistic music ::
::quality maximum ::
::style suno v5 ::`;

// ============================================================================
// cleanJsonResponse Tests
// ============================================================================

describe('cleanJsonResponse', () => {
  it('removes ```json and ``` markers from response', () => {
    const input = '```json\n{"prompt": "test"}\n```';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });

  it('handles response without markers', () => {
    const input = '{"prompt": "test"}';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });

  it('handles response with only opening marker', () => {
    const input = '```json\n{"prompt": "test"}';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });

  it('handles response with only closing marker', () => {
    const input = '{"prompt": "test"}\n```';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });

  it('trims whitespace from result', () => {
    const input = '  ```json\n{"prompt": "test"}\n```  ';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });

  it('handles multiline JSON content', () => {
    const input = '```json\n{\n  "prompt": "test",\n  "title": "Title"\n}\n```';
    const expected = '{\n  "prompt": "test",\n  "title": "Title"\n}';
    expect(cleanJsonResponse(input)).toBe(expected);
  });

  it('handles empty input', () => {
    expect(cleanJsonResponse('')).toBe('');
  });

  it('handles whitespace-only input', () => {
    expect(cleanJsonResponse('   \n  ')).toBe('');
  });

  it('produces valid JSON after cleaning', () => {
    const input = '```json\n{"prompt": "Genre: jazz, BPM: 110", "title": "Test"}\n```';
    const cleaned = cleanJsonResponse(input);
    const parsed = JSON.parse(cleaned);
    expect(parsed.prompt).toBe('Genre: jazz, BPM: 110');
    expect(parsed.title).toBe('Test');
  });

  it('handles adjacent newlines correctly', () => {
    const input = '```json{"prompt": "test"}```';
    expect(cleanJsonResponse(input)).toBe('{"prompt": "test"}');
  });
});

// ============================================================================
// isMaxFormat Tests
// ============================================================================

describe('isMaxFormat', () => {
  it('returns true for standard MAX_MODE_HEADER format', () => {
    const prompt = `${MAX_MODE_HEADER}
genre: "jazz"
bpm: "110"`;
    expect(isMaxFormat(prompt)).toBe(true);
  });

  it('returns true for Suno V5 tags format', () => {
    const prompt = `${MAX_MODE_TAGS_HEADER}

genre: "jazz"
bpm: "110"`;
    expect(isMaxFormat(prompt)).toBe(true);
  });

  it('returns false for non-max format', () => {
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
  it('removes standard MAX_MODE_HEADER from prompt', () => {
    const prompt = `${MAX_MODE_HEADER}
genre: "jazz"
bpm: "110"`;
    const result = stripMaxModeHeader(prompt);
    expect(result).toBe('genre: "jazz"\nbpm: "110"');
  });

  it('removes Suno V5 tags header from prompt', () => {
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
      expect(isStructuredPrompt('I want a melancholic ballad about lost love in the style of 80s pop')).toBe(false);
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
