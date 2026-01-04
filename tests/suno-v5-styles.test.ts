import { describe, it, expect } from 'bun:test';
import {
  SUNO_V5_STYLES,
  SUNO_V5_STYLE_DISPLAY_NAMES,
  isSunoV5Style,
} from '../src/shared/suno-v5-styles';

// ============================================================================
// SUNO_V5_STYLES Array Tests
// ============================================================================

describe('SUNO_V5_STYLES', () => {
  it('contains expected number of styles (500+)', () => {
    expect(SUNO_V5_STYLES.length).toBeGreaterThanOrEqual(500);
  });

  it('all styles are unique', () => {
    const unique = new Set(SUNO_V5_STYLES);
    expect(unique.size).toBe(SUNO_V5_STYLES.length);
  });

  it('all styles are lowercase strings', () => {
    SUNO_V5_STYLES.forEach((style) => {
      expect(typeof style).toBe('string');
      expect(style as string).toBe(style.toLowerCase());
    });
  });

  it('all styles are non-empty', () => {
    SUNO_V5_STYLES.forEach((style) => {
      expect(style.trim().length).toBeGreaterThan(0);
    });
  });

  it('includes known simple styles', () => {
    expect(SUNO_V5_STYLES).toContain('jazz');
    expect(SUNO_V5_STYLES).toContain('rock');
    expect(SUNO_V5_STYLES).toContain('pop');
    expect(SUNO_V5_STYLES).toContain('soul');
    expect(SUNO_V5_STYLES).toContain('disco');
    expect(SUNO_V5_STYLES).toContain('house');
    expect(SUNO_V5_STYLES).toContain('trance');
    expect(SUNO_V5_STYLES).toContain('country');
  });

  it('includes known compound styles', () => {
    expect(SUNO_V5_STYLES).toContain('cumbia metal');
    expect(SUNO_V5_STYLES).toContain('acoustic chicago blues algorave');
    expect(SUNO_V5_STYLES).toContain('dark goa trance');
    expect(SUNO_V5_STYLES).toContain('afrobeat disco');
  });

  it('includes styles with special characters', () => {
    expect(SUNO_V5_STYLES).toContain('k-pop');
    expect(SUNO_V5_STYLES).toContain('g-funk');
    expect(SUNO_V5_STYLES).toContain('p-funk');
    expect(SUNO_V5_STYLES).toContain('16-bit');
    expect(SUNO_V5_STYLES).toContain('2-step');
    // j-pop and lo-fi exist in compound styles
    expect(SUNO_V5_STYLES).toContain('j-pop acid breaks');
    expect(SUNO_V5_STYLES).toContain('lo-fi afro-cuban jazz');
  });

  it('includes R&B related styles', () => {
    // R&B appears in compound styles
    const rbStyles = SUNO_V5_STYLES.filter((style) => style.includes('r&b'));
    expect(rbStyles.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SUNO_V5_STYLE_DISPLAY_NAMES Tests
// ============================================================================

describe('SUNO_V5_STYLE_DISPLAY_NAMES', () => {
  it('has an entry for every style', () => {
    SUNO_V5_STYLES.forEach((style) => {
      expect(SUNO_V5_STYLE_DISPLAY_NAMES[style]).toBeDefined();
    });
  });

  it('all display names are non-empty strings', () => {
    Object.values(SUNO_V5_STYLE_DISPLAY_NAMES).forEach((displayName) => {
      expect(typeof displayName).toBe('string');
      expect(displayName.trim().length).toBeGreaterThan(0);
    });
  });

  it('handles standard title case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['jazz']).toBe('Jazz');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['rock']).toBe('Rock');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['pop']).toBe('Pop');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['soul']).toBe('Soul');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['disco']).toBe('Disco');
  });

  it('handles K-Pop special case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['k-pop']).toBe('K-Pop');
  });

  it('handles J-Pop special case correctly in compound styles', () => {
    const jPopDisplay = SUNO_V5_STYLE_DISPLAY_NAMES['j-pop acid breaks'];
    expect(jPopDisplay).toBe('J-Pop Acid Breaks');
    
    const jPopChillsynth = SUNO_V5_STYLE_DISPLAY_NAMES['j-pop chillsynth'];
    expect(jPopChillsynth).toBe('J-Pop Chillsynth');
  });

  it('handles G-Funk special case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['g-funk']).toBe('G-Funk');
  });

  it('handles P-Funk special case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['p-funk']).toBe('P-Funk');
  });

  it('handles EDM special case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['edm']).toBe('EDM');
  });

  it('handles numeric prefixed styles correctly (16-bit)', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['16-bit']).toBe('16-Bit');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['16-bit celtic']).toBe('16-Bit Celtic');
  });

  it('handles 2-step correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['2-step']).toBe('2-Step');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['2-step country']).toBe('2-Step Country');
  });

  it('handles compound styles with special cases', () => {
    // K-Pop compound
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['afroswing k-pop']).toBe('Afroswing K-Pop');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['bluegrass k-pop']).toBe('Bluegrass K-Pop');
    
    // G-Funk compound
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['edm g-funk']).toBe('EDM G-Funk');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['pop g-funk']).toBe('Pop G-Funk');
  });

  it('handles R&B special case correctly', () => {
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['alternative r&b']).toBe('Alternative R&B');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['hawaiian r&b']).toBe('Hawaiian R&B');
  });
});

// ============================================================================
// isSunoV5Style Type Guard Tests
// ============================================================================

describe('isSunoV5Style', () => {
  it('returns true for valid simple styles', () => {
    expect(isSunoV5Style('jazz')).toBe(true);
    expect(isSunoV5Style('rock')).toBe(true);
    expect(isSunoV5Style('pop')).toBe(true);
    expect(isSunoV5Style('k-pop')).toBe(true);
    expect(isSunoV5Style('edm')).toBe(true);
  });

  it('returns true for valid compound styles', () => {
    expect(isSunoV5Style('cumbia metal')).toBe(true);
    expect(isSunoV5Style('acoustic chicago blues algorave')).toBe(true);
    expect(isSunoV5Style('dark goa trance')).toBe(true);
    expect(isSunoV5Style('afrobeat disco')).toBe(true);
  });

  it('returns false for invalid styles', () => {
    expect(isSunoV5Style('not-a-real-style')).toBe(false);
    expect(isSunoV5Style('made up genre')).toBe(false);
    expect(isSunoV5Style('foobar')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSunoV5Style('')).toBe(false);
  });

  it('returns false for whitespace-only strings', () => {
    expect(isSunoV5Style('   ')).toBe(false);
    expect(isSunoV5Style('\t')).toBe(false);
    expect(isSunoV5Style('\n')).toBe(false);
  });

  it('returns false for uppercase versions of valid styles', () => {
    // Styles must be lowercase to match
    expect(isSunoV5Style('JAZZ')).toBe(false);
    expect(isSunoV5Style('Jazz')).toBe(false);
    expect(isSunoV5Style('K-POP')).toBe(false);
  });

  it('returns false for close misspellings', () => {
    expect(isSunoV5Style('jaz')).toBe(false);
    expect(isSunoV5Style('roock')).toBe(false);
    expect(isSunoV5Style('cumbai metal')).toBe(false);
  });

  it('correctly narrows type for valid styles', () => {
    const maybeStyle: string = 'jazz';
    if (isSunoV5Style(maybeStyle)) {
      // TypeScript should now know this is SunoV5Style
      const validStyle: typeof SUNO_V5_STYLES[number] = maybeStyle;
      expect(validStyle).toBe('jazz');
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('handles styles with multiple hyphens correctly', () => {
    // lo-fi styles
    const lofiDisplay = SUNO_V5_STYLE_DISPLAY_NAMES['lo-fi afro-cuban jazz'];
    expect(lofiDisplay).toBe('Lo-Fi Afro-Cuban Jazz');
  });

  it('handles styles ending with special case words', () => {
    // Styles ending with r&b, edm, etc.
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['afro trap r&b']).toBe('Afro Trap R&B');
    expect(SUNO_V5_STYLE_DISPLAY_NAMES['hawaiian r&b']).toBe('Hawaiian R&B');
  });

  it('no styles contain leading/trailing whitespace', () => {
    SUNO_V5_STYLES.forEach((style) => {
      expect(style as string).toBe(style.trim());
    });
  });

  it('no duplicate styles exist', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    SUNO_V5_STYLES.forEach((style) => {
      if (seen.has(style)) {
        duplicates.push(style);
      }
      seen.add(style);
    });
    
    expect(duplicates).toEqual([]);
  });
});
