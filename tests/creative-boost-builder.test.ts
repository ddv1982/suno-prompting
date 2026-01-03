import { describe, it, expect } from 'bun:test';
import {
  getCreativityLevel,
  buildCreativeBoostSystemPrompt,
  buildCreativeBoostUserPrompt,
  parseCreativeBoostResponse,
  buildCreativeBoostRefineSystemPrompt,
  buildCreativeBoostRefineUserPrompt,
} from '@bun/prompt/creative-boost-builder';

// ============================================================================
// Task 9.1: Unit Tests for getCreativityLevel
// ============================================================================

describe('getCreativityLevel', () => {
  describe('low range (0-20)', () => {
    it('returns "low" for value 0 (slider position)', () => {
      expect(getCreativityLevel(0)).toBe('low');
    });

    it('returns "low" for value 20 (boundary)', () => {
      expect(getCreativityLevel(20)).toBe('low');
    });

    it('returns "low" for mid-range value 10', () => {
      expect(getCreativityLevel(10)).toBe('low');
    });
  });

  describe('safe range (21-40)', () => {
    it('returns "safe" for value 21 (boundary)', () => {
      expect(getCreativityLevel(21)).toBe('safe');
    });

    it('returns "safe" for value 25 (slider position)', () => {
      expect(getCreativityLevel(25)).toBe('safe');
    });

    it('returns "safe" for value 40 (boundary)', () => {
      expect(getCreativityLevel(40)).toBe('safe');
    });
  });

  describe('normal range (41-60)', () => {
    it('returns "normal" for value 50 (slider position)', () => {
      expect(getCreativityLevel(50)).toBe('normal');
    });

    it('returns "normal" for value 41 (boundary)', () => {
      expect(getCreativityLevel(41)).toBe('normal');
    });

    it('returns "normal" for value 60 (boundary)', () => {
      expect(getCreativityLevel(60)).toBe('normal');
    });
  });

  describe('adventurous range (61-80)', () => {
    it('returns "adventurous" for value 61 (boundary)', () => {
      expect(getCreativityLevel(61)).toBe('adventurous');
    });

    it('returns "adventurous" for value 75 (slider position)', () => {
      expect(getCreativityLevel(75)).toBe('adventurous');
    });

    it('returns "adventurous" for value 80 (boundary)', () => {
      expect(getCreativityLevel(80)).toBe('adventurous');
    });
  });

  describe('high range (81-100)', () => {
    it('returns "high" for value 81 (boundary)', () => {
      expect(getCreativityLevel(81)).toBe('high');
    });

    it('returns "high" for value 100 (slider position)', () => {
      expect(getCreativityLevel(100)).toBe('high');
    });

    it('returns "high" for mid-range value 90', () => {
      expect(getCreativityLevel(90)).toBe('high');
    });
  });
});

// ============================================================================
// Task 9.2: Unit Tests for System/User Prompts
// ============================================================================

describe('buildCreativeBoostSystemPrompt', () => {
  describe('creativity guidance', () => {
    it('includes LOW guidance for low creativity level', () => {
      const prompt = buildCreativeBoostSystemPrompt(10, false);
      expect(prompt).toContain('CREATIVITY: LOW');
      expect(prompt).toContain('single genres');
      expect(prompt).toContain('genre-pure');
    });

    it('includes SAFE guidance for safe creativity level', () => {
      const prompt = buildCreativeBoostSystemPrompt(35, false);
      expect(prompt).toContain('CREATIVITY: SAFE');
      expect(prompt).toContain('established combinations');
      expect(prompt).toContain('recognized genre pairings');
    });

    it('includes NORMAL guidance for normal creativity level', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, false);
      expect(prompt).toContain('CREATIVITY: NORMAL');
      expect(prompt).toContain('BALANCED');
      expect(prompt).toContain('musically coherent');
    });

    it('includes ADVENTUROUS guidance for adventurous creativity level', () => {
      const prompt = buildCreativeBoostSystemPrompt(65, false);
      expect(prompt).toContain('CREATIVITY: ADVENTUROUS');
      expect(prompt).toContain('Push boundaries');
      expect(prompt).toContain('unusual combinations');
    });

    it('includes HIGH guidance for high creativity level', () => {
      const prompt = buildCreativeBoostSystemPrompt(90, false);
      expect(prompt).toContain('CREATIVITY: HIGH');
      expect(prompt).toContain('EXPERIMENTAL');
      expect(prompt).toContain('INVENT entirely new');
    });

    it('different levels produce different guidance', () => {
      const lowPrompt = buildCreativeBoostSystemPrompt(10, false);
      const highPrompt = buildCreativeBoostSystemPrompt(90, false);
      expect(lowPrompt).not.toBe(highPrompt);
      expect(lowPrompt).toContain('LOW');
      expect(highPrompt).toContain('HIGH');
    });
  });

  describe('vocal modes', () => {
    it('includes wordless vocals instructions when withWordlessVocals is true', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, true);
      expect(prompt).toContain('VOCALS: Include wordless vocals');
      expect(prompt).toContain('humming');
      expect(prompt).toContain('NO actual words');
    });

    it('focuses on musical style when withWordlessVocals is false', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, false);
      expect(prompt).toContain('VOCALS: Focus on the musical style');
      expect(prompt).toContain('handled separately');
    });
  });

  describe('output format', () => {
    it('specifies JSON output format', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, false);
      expect(prompt).toContain('JSON object');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"style"');
    });

    it('does not include lyrics field (lyrics generated separately)', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, false);
      expect(prompt).not.toContain('"lyrics"');
    });

    it('warns against markdown code blocks', () => {
      const prompt = buildCreativeBoostSystemPrompt(50, false);
      expect(prompt).toContain('Do NOT wrap the JSON in markdown code blocks');
    });
  });
});

describe('buildCreativeBoostUserPrompt', () => {
  it('includes creativity level as percentage', () => {
    const prompt = buildCreativeBoostUserPrompt(75, [], '');
    expect(prompt).toContain('Creativity level: 75%');
  });

  it('includes seed genres when provided', () => {
    const prompt = buildCreativeBoostUserPrompt(50, ['jazz', 'ambient'], '');
    expect(prompt).toContain('Seed genres to explore: jazz, ambient');
  });

  it('shows surprise message when no seed genres provided', () => {
    const prompt = buildCreativeBoostUserPrompt(50, [], '');
    expect(prompt).toContain('No seed genres - surprise me');
  });

  it('includes description when provided', () => {
    const prompt = buildCreativeBoostUserPrompt(50, [], 'a late night vibe');
    expect(prompt).toContain('User\'s description: "a late night vibe"');
  });

  it('omits description line when empty', () => {
    const prompt = buildCreativeBoostUserPrompt(50, [], '');
    expect(prompt).not.toContain('User\'s description:');
  });

  it('does not include lyrics topic (handled separately)', () => {
    const prompt = buildCreativeBoostUserPrompt(50, [], '');
    expect(prompt).not.toContain('Lyrics topic');
  });

  it('includes all parts when fully populated', () => {
    const prompt = buildCreativeBoostUserPrompt(
      80,
      ['rock', 'electronic'],
      'energetic and dark'
    );
    expect(prompt).toContain('Creativity level: 80%');
    expect(prompt).toContain('rock, electronic');
    expect(prompt).toContain('energetic and dark');
    expect(prompt).toContain('Generate the creative prompt');
  });

  it('trims whitespace from description', () => {
    const prompt = buildCreativeBoostUserPrompt(50, [], '  spaced text  ');
    expect(prompt).toContain('"spaced text"');
    expect(prompt).not.toContain('"  spaced text  "');
  });
});

// ============================================================================
// Task 9.3: Unit Tests for Response Parsing
// ============================================================================

describe('parseCreativeBoostResponse', () => {
  describe('valid JSON parsing', () => {
    it('parses valid JSON with title and style', () => {
      const response = JSON.stringify({
        title: 'Midnight Dreams',
        style: 'lo-fi jazz with subtle vinyl warmth',
      });
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Midnight Dreams');
      expect(result.style).toBe('lo-fi jazz with subtle vinyl warmth');
    });

    it('parses valid JSON with only required fields', () => {
      const response = JSON.stringify({
        title: 'Instrumental Vibes',
        style: 'ambient electronic textures',
      });
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Instrumental Vibes');
      expect(result.style).toBe('ambient electronic textures');
    });
  });

  describe('markdown code block stripping', () => {
    it('strips ```json blocks', () => {
      const response = '```json\n{"title": "Test", "style": "jazz"}\n```';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Test');
      expect(result.style).toBe('jazz');
    });

    it('strips plain ``` blocks', () => {
      const response = '```\n{"title": "Test", "style": "rock"}\n```';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Test');
      expect(result.style).toBe('rock');
    });

    it('handles mixed case ```JSON blocks', () => {
      const response = '```JSON\n{"title": "Test", "style": "pop"}\n```';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Test');
      expect(result.style).toBe('pop');
    });
  });

  describe('JSON extraction from text', () => {
    it('extracts JSON from surrounding text', () => {
      const response = 'Here is your prompt:\n{"title": "Test", "style": "jazz"}\nEnjoy!';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Test');
      expect(result.style).toBe('jazz');
    });
  });

  describe('fallback behavior', () => {
    it('falls back gracefully for invalid JSON', () => {
      const response = 'This is not valid JSON at all';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Creative Boost');
      expect(result.style).toBe('This is not valid JSON at all');
    });

    it('falls back for partial JSON', () => {
      const response = '{"title": "Test", "style": ';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Creative Boost');
      expect(result.style).toBe('{"title": "Test", "style":');
    });

    it('uses default title when title is missing', () => {
      const response = JSON.stringify({
        style: 'ambient pads',
      });
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Untitled');
      expect(result.style).toBe('ambient pads');
    });

    it('uses empty string when style is missing', () => {
      const response = JSON.stringify({
        title: 'Only Title',
      });
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Only Title');
      expect(result.style).toBe('');
    });
  });

  describe('whitespace handling', () => {
    it('trims whitespace from response', () => {
      const response = '  \n{"title": "Test", "style": "jazz"}\n  ';
      const result = parseCreativeBoostResponse(response);

      expect(result.title).toBe('Test');
      expect(result.style).toBe('jazz');
    });
  });
});

// ============================================================================
// Task 9.5: Unit Tests for Refine Prompts
// ============================================================================

describe('buildCreativeBoostRefineSystemPrompt', () => {
  describe('vocal modes', () => {
    it('includes wordless vocals guidance when withWordlessVocals is true', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(true);
      expect(prompt).toContain('VOCALS: Include wordless vocals only');
      expect(prompt).toContain('humming');
    });

    it('focuses on musical style when withWordlessVocals is false', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).toContain('VOCALS: Focus on the musical style');
      expect(prompt).toContain('handled separately');
    });
  });

  describe('output format', () => {
    it('specifies JSON output format', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).toContain('JSON object');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"style"');
    });

    it('does not include lyrics field (lyrics generated separately)', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).not.toContain('"lyrics"');
    });

    it('warns against markdown code blocks', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).toContain('Do NOT wrap the JSON in markdown code blocks');
    });
  });

  describe('refinement context', () => {
    it('mentions refining existing prompt', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).toContain('REFINING');
      expect(prompt).toContain('existing');
    });

    it('mentions applying feedback thoughtfully', () => {
      const prompt = buildCreativeBoostRefineSystemPrompt(false);
      expect(prompt).toContain('feedback');
      expect(prompt).toContain('thoughtfully');
    });
  });
});

describe('buildCreativeBoostRefineUserPrompt', () => {
  it('includes current title', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'lo-fi jazz', 'Midnight Vibes', 'make it darker'
    );
    expect(prompt).toContain('Current title: "Midnight Vibes"');
  });

  it('includes current style/prompt', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'lo-fi jazz with vinyl crackle', 'Test', 'more upbeat'
    );
    expect(prompt).toContain('Current style: "lo-fi jazz with vinyl crackle"');
  });

  it('does not include lyrics section (lyrics handled separately)', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'ambient', 'Floating', 'add more texture'
    );
    expect(prompt).not.toContain('Current lyrics:');
  });

  it('includes user feedback', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'rock', 'Power Up', 'add more distortion and energy'
    );
    expect(prompt).toContain('User feedback: add more distortion and energy');
  });

  it('ends with generation instruction', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'jazz', 'Cool', 'more swing'
    );
    expect(prompt).toContain('Generate the refined prompt');
  });

  it('formats all parts correctly', () => {
    const prompt = buildCreativeBoostRefineUserPrompt(
      'electronic dance music',
      'Night Rider',
      'darker and more intense'
    );
    expect(prompt).toContain('Current title: "Night Rider"');
    expect(prompt).toContain('Current style: "electronic dance music"');
    expect(prompt).toContain('User feedback: darker and more intense');
  });
});
