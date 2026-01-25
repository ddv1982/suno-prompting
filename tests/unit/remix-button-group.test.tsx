/**
 * Unit tests for RemixButtonGroup component button visibility.
 * Tests hybrid button visibility based on storyMode UI toggle AND prompt content format.
 *
 * @module tests/unit/remix-button-group
 */
import { describe, expect, test } from 'bun:test';

import { isStoryModeFormat, isStructuredPrompt } from '@shared/prompt-utils';

// ============================================
// Test Fixtures: Sample Prompts
// ============================================

const STRUCTURED_PROMPT_STANDARD = `[Emotional, Jazz, Key: D minor]

Genre: Jazz
BPM: between 80 and 110
Mood: smooth, warm, sophisticated
Instruments: Rhodes piano, tenor sax, upright bass

[VERSE] Soft piano with breathy sax`;

const STRUCTURED_PROMPT_MAX = `::tags realistic music ::
genre: "jazz"
bpm: "between 80 and 110"
instruments: "Rhodes piano, tenor sax, upright bass"
style tags: "smooth, warm, sophisticated"
recording: "intimate jazz club"`;

const NARRATIVE_PROSE_PROMPT = `The song opens in the intimate glow of a dimly-lit jazz club, where a Rhodes piano plays warm, melancholic chords in D minor. A tenor sax drifts in with a smooth, late-night melody between 80 and 110 BPM while an upright bass walks through sophisticated changes. The brushed drums whisper beneath, creating an atmosphere of wistful longing.`;

// Story Mode + MAX Mode output: MAX header followed by narrative prose (no structured fields)
const MAX_HEADER_WITH_NARRATIVE = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)

The song opens in the intimate glow of a dimly-lit jazz club, where a Rhodes piano plays warm, melancholic chords in D minor. A tenor sax drifts in with a smooth, late-night melody between 80 and 110 BPM while an upright bass walks through sophisticated changes.`;

// MAX header with structured fields (normal MAX mode output)
const MAX_HEADER_WITH_STRUCTURED = `[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)

genre: "jazz"
bpm: "between 80 and 110"
instruments: "Rhodes piano, tenor sax, upright bass"
style tags: "smooth, warm, sophisticated"
recording: "intimate jazz club"`;

const EMPTY_PROMPT = '';
const WHITESPACE_PROMPT = '   \n\t  ';

// ============================================
// Button Visibility Logic (Hybrid Approach)
// ============================================

interface ButtonVisibility {
  genre: boolean;
  mood: boolean;
  instruments: boolean;
  style: boolean;
  recording: boolean;
  remix: boolean;
  copy: boolean;
}

/**
 * Compute button visibility using hybrid approach.
 * Mirrors the logic in remix-button-group.tsx:
 * 
 * hideFieldButtons = storyMode || isStoryModeFormat(currentPrompt)
 * 
 * - When storyMode UI toggle is ON: always hide field buttons
 * - When storyMode UI toggle is OFF: use content detection
 */
function computeButtonVisibility(storyMode: boolean, currentPrompt: string, maxMode: boolean): ButtonVisibility {
  const hideFieldButtons = storyMode || isStoryModeFormat(currentPrompt);
  return {
    genre: !hideFieldButtons,
    mood: !hideFieldButtons && !maxMode,
    instruments: !hideFieldButtons,
    style: !hideFieldButtons && maxMode,
    recording: !hideFieldButtons && maxMode,
    remix: true,
    copy: true,
  };
}

// ============================================
// Tests: isStoryModeFormat utility
// ============================================

describe('isStoryModeFormat utility', () => {
  test('returns false for structured standard prompt', () => {
    expect(isStoryModeFormat(STRUCTURED_PROMPT_STANDARD)).toBe(false);
  });

  test('returns false for structured MAX mode prompt', () => {
    expect(isStoryModeFormat(STRUCTURED_PROMPT_MAX)).toBe(false);
  });

  test('returns false for MAX header with structured fields', () => {
    expect(isStoryModeFormat(MAX_HEADER_WITH_STRUCTURED)).toBe(false);
  });

  test('returns true for narrative prose prompt', () => {
    expect(isStoryModeFormat(NARRATIVE_PROSE_PROMPT)).toBe(true);
  });

  test('returns true for MAX header with narrative prose (Story Mode + MAX Mode)', () => {
    expect(isStoryModeFormat(MAX_HEADER_WITH_NARRATIVE)).toBe(true);
  });

  test('returns true for empty string (no fields to remix)', () => {
    expect(isStoryModeFormat(EMPTY_PROMPT)).toBe(true);
  });

  test('returns true for whitespace-only string (no fields to remix)', () => {
    expect(isStoryModeFormat(WHITESPACE_PROMPT)).toBe(true);
  });

  test('is inverse of isStructuredPrompt for non-empty content', () => {
    expect(isStoryModeFormat(STRUCTURED_PROMPT_STANDARD)).toBe(!isStructuredPrompt(STRUCTURED_PROMPT_STANDARD));
    expect(isStoryModeFormat(NARRATIVE_PROSE_PROMPT)).toBe(!isStructuredPrompt(NARRATIVE_PROSE_PROMPT));
    expect(isStoryModeFormat(MAX_HEADER_WITH_NARRATIVE)).toBe(!isStructuredPrompt(MAX_HEADER_WITH_NARRATIVE));
    expect(isStoryModeFormat(MAX_HEADER_WITH_STRUCTURED)).toBe(!isStructuredPrompt(MAX_HEADER_WITH_STRUCTURED));
  });
});

// ============================================
// Tests: isStructuredPrompt with MAX headers
// ============================================

describe('isStructuredPrompt with MAX headers', () => {
  test('returns true for MAX header with structured fields', () => {
    expect(isStructuredPrompt(MAX_HEADER_WITH_STRUCTURED)).toBe(true);
  });

  test('returns false for MAX header with narrative prose (Story Mode output)', () => {
    expect(isStructuredPrompt(MAX_HEADER_WITH_NARRATIVE)).toBe(false);
  });

  test('returns true for standard structured prompt (no MAX header)', () => {
    expect(isStructuredPrompt(STRUCTURED_PROMPT_STANDARD)).toBe(true);
  });

  test('returns false for pure narrative prose', () => {
    expect(isStructuredPrompt(NARRATIVE_PROSE_PROMPT)).toBe(false);
  });
});

// ============================================
// Tests: Hybrid Approach - storyMode UI toggle ON
// ============================================

describe('RemixButtonGroup with storyMode=true (UI toggle ON)', () => {
  describe('with structured content', () => {
    test('GENRE button is hidden even for structured prompt', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.genre).toBe(false);
    });

    test('MOOD button is hidden even for structured prompt', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.mood).toBe(false);
    });

    test('INSTRUMENTS button is hidden even for structured prompt', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.instruments).toBe(false);
    });

    test('STYLE button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_MAX, true);
      expect(visibility.style).toBe(false);
    });

    test('RECORDING button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_MAX, true);
      expect(visibility.recording).toBe(false);
    });

    test('REMIX button is always visible', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.remix).toBe(true);
    });

    test('COPY button is always visible', () => {
      const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.copy).toBe(true);
    });
  });

  describe('with narrative prose content', () => {
    test('all field buttons are hidden', () => {
      const visibility = computeButtonVisibility(true, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.genre).toBe(false);
      expect(visibility.mood).toBe(false);
      expect(visibility.instruments).toBe(false);
    });

    test('REMIX and COPY are visible', () => {
      const visibility = computeButtonVisibility(true, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.remix).toBe(true);
      expect(visibility.copy).toBe(true);
    });
  });
});

// ============================================
// Tests: Hybrid Approach - storyMode UI toggle OFF
// ============================================

describe('RemixButtonGroup with storyMode=false (UI toggle OFF)', () => {
  describe('with structured content', () => {
    test('GENRE button is visible for structured prompt', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.genre).toBe(true);
    });

    test('MOOD button is visible when maxMode=false', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.mood).toBe(true);
    });

    test('MOOD button is hidden when maxMode=true', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true);
      expect(visibility.mood).toBe(false);
    });

    test('INSTRUMENTS button is visible', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false);
      expect(visibility.instruments).toBe(true);
    });

    test('STYLE button is visible when maxMode=true', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true);
      expect(visibility.style).toBe(true);
    });

    test('RECORDING button is visible when maxMode=true', () => {
      const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true);
      expect(visibility.recording).toBe(true);
    });

    test('REMIX button is always visible', () => {
      expect(computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false).remix).toBe(true);
      expect(computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true).remix).toBe(true);
    });

    test('COPY button is always visible', () => {
      expect(computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false).copy).toBe(true);
      expect(computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true).copy).toBe(true);
    });
  });

  describe('with narrative prose content (content detection kicks in)', () => {
    test('GENRE button is hidden', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.genre).toBe(false);
    });

    test('MOOD button is hidden', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.mood).toBe(false);
    });

    test('INSTRUMENTS button is hidden', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.instruments).toBe(false);
    });

    test('STYLE button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, true);
      expect(visibility.style).toBe(false);
    });

    test('RECORDING button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, true);
      expect(visibility.recording).toBe(false);
    });

    test('REMIX button is visible', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.remix).toBe(true);
    });

    test('COPY button is visible', () => {
      const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
      expect(visibility.copy).toBe(true);
    });
  });

  describe('with MAX header + narrative prose (Story Mode + MAX Mode output)', () => {
    test('GENRE button is hidden (content detection sees narrative body)', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, false);
      expect(visibility.genre).toBe(false);
    });

    test('MOOD button is hidden', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, false);
      expect(visibility.mood).toBe(false);
    });

    test('INSTRUMENTS button is hidden', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, false);
      expect(visibility.instruments).toBe(false);
    });

    test('STYLE button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, true);
      expect(visibility.style).toBe(false);
    });

    test('RECORDING button is hidden even with maxMode=true', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, true);
      expect(visibility.recording).toBe(false);
    });

    test('REMIX and COPY are visible', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_NARRATIVE, false);
      expect(visibility.remix).toBe(true);
      expect(visibility.copy).toBe(true);
    });
  });

  describe('with MAX header + structured fields (normal MAX mode output)', () => {
    test('GENRE button is visible', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_STRUCTURED, false);
      expect(visibility.genre).toBe(true);
    });

    test('INSTRUMENTS button is visible', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_STRUCTURED, false);
      expect(visibility.instruments).toBe(true);
    });

    test('STYLE button is visible when maxMode=true', () => {
      const visibility = computeButtonVisibility(false, MAX_HEADER_WITH_STRUCTURED, true);
      expect(visibility.style).toBe(true);
    });
  });
});

// ============================================
// Tests: Edge Cases
// ============================================

describe('RemixButtonGroup edge cases', () => {
  test('empty prompt with storyMode=false shows only REMIX and COPY', () => {
    const visibility = computeButtonVisibility(false, EMPTY_PROMPT, false);
    expect(visibility.genre).toBe(false);
    expect(visibility.mood).toBe(false);
    expect(visibility.instruments).toBe(false);
    expect(visibility.remix).toBe(true);
    expect(visibility.copy).toBe(true);
  });

  test('whitespace-only prompt with storyMode=false shows only REMIX and COPY', () => {
    const visibility = computeButtonVisibility(false, WHITESPACE_PROMPT, false);
    expect(visibility.genre).toBe(false);
    expect(visibility.remix).toBe(true);
    expect(visibility.copy).toBe(true);
  });

  test('empty prompt with storyMode=true shows only REMIX and COPY', () => {
    const visibility = computeButtonVisibility(true, EMPTY_PROMPT, false);
    expect(visibility.genre).toBe(false);
    expect(visibility.remix).toBe(true);
    expect(visibility.copy).toBe(true);
  });
});

// ============================================
// Tests: Complete Visibility Matrix
// ============================================

describe('Complete visibility matrix', () => {
  test('storyMode=false, structured prompt, maxMode=false', () => {
    const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, false);
    expect(visibility).toEqual({
      genre: true,
      mood: true,
      instruments: true,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=false, structured prompt, maxMode=true', () => {
    const visibility = computeButtonVisibility(false, STRUCTURED_PROMPT_STANDARD, true);
    expect(visibility).toEqual({
      genre: true,
      mood: false,
      instruments: true,
      style: true,
      recording: true,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=false, narrative prose, maxMode=false', () => {
    const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, false);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=false, narrative prose, maxMode=true', () => {
    const visibility = computeButtonVisibility(false, NARRATIVE_PROSE_PROMPT, true);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=true, structured prompt, maxMode=false', () => {
    const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, false);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=true, structured prompt, maxMode=true', () => {
    const visibility = computeButtonVisibility(true, STRUCTURED_PROMPT_STANDARD, true);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=true, narrative prose, maxMode=false', () => {
    const visibility = computeButtonVisibility(true, NARRATIVE_PROSE_PROMPT, false);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });

  test('storyMode=true, narrative prose, maxMode=true', () => {
    const visibility = computeButtonVisibility(true, NARRATIVE_PROSE_PROMPT, true);
    expect(visibility).toEqual({
      genre: false,
      mood: false,
      instruments: false,
      style: false,
      recording: false,
      remix: true,
      copy: true,
    });
  });
});

// ============================================
// Source verification tests
// ============================================

describe('RemixButtonGroup source verification', () => {
  test('component has storyMode prop in interface', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('storyMode: boolean');
  });

  test('component has currentPrompt prop in interface', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('currentPrompt: string');
  });

  test('component imports isStoryModeFormat', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain("import { isStoryModeFormat } from");
  });

  test('component uses hybrid visibility logic', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('storyMode || isStoryModeFormat(currentPrompt)');
  });

  test('component uses hideFieldButtons variable', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('hideFieldButtons');
  });

  test('FieldButtons component renders GENRE button', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('<ShuffleBtn label="GENRE"');
  });

  test('FieldButtons component conditionally renders MOOD button', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('{!maxMode && <ShuffleBtn label="MOOD"');
  });

  test('FieldButtons component renders INSTRUMENTS button', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('<ShuffleBtn label="INSTRUMENTS"');
  });

  test('FieldButtons component conditionally renders STYLE button', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('{maxMode && <ShuffleBtn label="STYLE"');
  });

  test('FieldButtons component conditionally renders RECORDING button', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('{maxMode && <ShuffleBtn label="RECORDING"');
  });

  test('FieldButtons are wrapped with hideFieldButtons condition', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('{!hideFieldButtons && (');
    expect(source).toContain('<FieldButtons');
  });

  test('REMIX button has no hideFieldButtons condition', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('onClick={onRemix}');
    expect(source).not.toMatch(/\{!hideFieldButtons && [^}]*onClick=\{onRemix\}/);
  });

  test('COPY button has no hideFieldButtons condition', async () => {
    const source = await Bun.file('src/main-ui/components/remix-button-group.tsx').text();
    expect(source).toContain('onClick={onCopy}');
    expect(source).not.toMatch(/\{!hideFieldButtons && [^}]*onClick=\{onCopy\}/);
  });
});
