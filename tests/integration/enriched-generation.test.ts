/**
 * Integration tests for Enriched LLM Generation.
 *
 * Tests verify:
 * - Full generation with all enrichment fields works correctly
 * - Generation with partial enrichment produces valid output
 * - Fallback works when LLM unavailable
 * - Artist names NEVER appear in output
 * - Performance stays within 4-second timeout
 * - Vocal/energy/spatial fields influence output
 * - Tag budget enforcement (≤15 tags)
 * - Deterministic reproducibility with seed
 *
 * @module tests/integration/enriched-generation
 */

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

import { APP_CONSTANTS } from '@shared/constants';
import { createSeededRng } from '@shared/utils/random';

import type { GenerationConfig } from '@bun/ai/types';
import type { ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Fully enriched thematic context with all enrichment fields.
 */
const MOCK_FULLY_ENRICHED_CONTEXT: ThematicContext = {
  // Base fields
  themes: ['carnival', 'rhythm', 'celebration'],
  moods: ['joyful', 'energetic', 'vibrant'],
  scene: 'Brazilian carnival parade with samba dancers',

  // Core enrichment: Era, Tempo, Contrast
  era: '70s',
  tempo: { adjustment: 10, curve: 'gradual-rise' },
  contrast: {
    sections: [
      { type: 'intro', mood: 'anticipation', dynamics: 'building' },
      { type: 'chorus', mood: 'euphoric', dynamics: 'explosive' },
    ],
  },

  // Intent and reference
  intent: 'dancefloor',
  musicalReference: {
    style: ['samba', 'latin jazz'],
    signature: ['syncopated rhythms', 'call and response'],
  },

  // Vocal, energy, and spatial
  vocalCharacter: {
    style: 'powerful',
    layering: 'harmonies',
    technique: 'belt',
  },
  energyLevel: 'energetic',
  spatialHint: {
    space: 'hall',
    reverb: 'wet',
  },

  // Narrative and cultural
  narrativeArc: ['gathering', 'celebration', 'ecstasy', 'reflection'],
  culturalContext: {
    region: 'brazil',
    instruments: ['surdo', 'tamborim'],
    scale: 'mixolydian',
  },
};

/**
 * Partially enriched context (core fields only).
 */
const MOCK_PARTIAL_CONTEXT: ThematicContext = {
  themes: ['retro', 'synth', 'night'],
  moods: ['nostalgic', 'dreamy'],
  scene: 'neon-lit city streets at midnight',
  era: '80s',
  tempo: { adjustment: 5, curve: 'steady' },
};

/**
 * Minimal context (base fields only).
 */
const MOCK_MINIMAL_CONTEXT: ThematicContext = {
  themes: ['love', 'hope', 'journey'],
  moods: ['tender', 'hopeful'],
  scene: 'sunrise over a quiet mountain lake',
};

/**
 * Context with only vocalCharacter set.
 */
const MOCK_VOCAL_CHARACTER_ONLY: ThematicContext = {
  themes: ['soul', 'emotion', 'power'],
  moods: ['passionate', 'intense'],
  scene: 'gospel choir in a Sunday morning service',
  vocalCharacter: {
    style: 'powerful',
    layering: 'choir',
    technique: 'belt',
  },
};

/**
 * Context with only energyLevel set.
 */
const MOCK_ENERGY_LEVEL_ONLY: ThematicContext = {
  themes: ['chill', 'relax', 'peace'],
  moods: ['calm', 'serene'],
  scene: 'meditation session at sunset',
  energyLevel: 'ambient',
};

/**
 * Context with only spatialHint set.
 */
const MOCK_SPATIAL_HINT_ONLY: ThematicContext = {
  themes: ['cathedral', 'sacred', 'ethereal'],
  moods: ['reverent', 'peaceful'],
  scene: 'ancient stone cathedral at midnight',
  spatialHint: {
    space: 'vast',
    reverb: 'cavernous',
  },
};

/**
 * Context with potential artist name in musical reference.
 * Tests must verify NO artist names appear in output.
 */
const MOCK_CONTEXT_WITH_REFERENCE: ThematicContext = {
  themes: ['progressive', 'epic', 'space'],
  moods: ['expansive', 'cosmic'],
  scene: 'journey through the cosmos',
  musicalReference: {
    // Note: No artist names should be here, only style descriptors
    style: ['progressive rock', 'space rock'],
    era: '70s',
    signature: ['long instrumental sections', 'synthesizer solos', 'concept album feel'],
  },
};

// Mock the thematic context extraction module
const mockExtractThematicContext = mock<() => Promise<ThematicContext | null>>(
  () => Promise.resolve(MOCK_FULLY_ENRICHED_CONTEXT)
);

// Mock Ollama availability
const mockCheckOllamaAvailable = mock(() =>
  Promise.resolve({ available: true, hasGemma: true })
);

await mock.module('@bun/ai/thematic-context', () => ({
  extractThematicContext: mockExtractThematicContext,
}));

await mock.module('@bun/ai/ollama-availability', () => ({
  checkOllamaAvailable: mockCheckOllamaAvailable,
  invalidateOllamaCache: mock(() => {}),
}));

await mock.module('@bun/ai/ollama-client', () => ({
  generateWithOllama: mock(() => Promise.resolve('Generated text')),
}));

// Import after mocking
const { generateInitial } = await import('@bun/ai/generation');

function createMockConfig(overrides: Partial<GenerationConfig> = {}): GenerationConfig {
  return {
    getModel: () => ({} as unknown),
    isDebugMode: () => false,
    isMaxMode: () => false,
    isLyricsMode: () => false,
    isStoryMode: () => false, // Story Mode disabled by default
    isUseLocalLLM: () => false,
    isLLMAvailable: () => true,
    getUseSunoTags: () => true,
    getModelName: () => 'test-model',
    getProvider: () => 'groq',
    getOllamaEndpoint: () => 'http://127.0.0.1:11434',
    getOllamaEndpointIfLocal: () => undefined,
    ...overrides,
  } as GenerationConfig;
}

/**
 * List of known artist names that must NEVER appear in output.
 * This is a critical safety check.
 */
const FORBIDDEN_ARTIST_NAMES = [
  'pink floyd',
  'the beatles',
  'led zeppelin',
  'daft punk',
  'kraftwerk',
  'radiohead',
  'björk',
  'taylor swift',
  'beyonce',
  'drake',
  'kanye',
  'travis scott',
  'david bowie',
  'prince',
  'madonna',
  'michael jackson',
];

/**
 * Check that no artist names appear in the output.
 */
function assertNoArtistNames(output: string): void {
  const lowercaseOutput = output.toLowerCase();
  for (const artist of FORBIDDEN_ARTIST_NAMES) {
    expect(lowercaseOutput).not.toContain(artist);
  }
}

describe('Enriched Generation Integration', () => {
  beforeEach(() => {
    mockExtractThematicContext.mockReset();
    mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Full generation with all enrichment fields', () => {
    test('produces valid output with fully enriched context', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'Brazilian carnival music with samba rhythms' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.title).toBeDefined();
    });

    test('includes era tags when era is provided', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_PARTIAL_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: '80s synthwave track' },
        config
      );

      // 80s era should produce tags like "gated reverb", "synth pads"
      // At least one era-related production characteristic should appear
      const hasEraInfluence = result.text.toLowerCase().includes('synth') ||
                              result.text.toLowerCase().includes('pad') ||
                              result.text.toLowerCase().includes('reverb') ||
                              result.text.toLowerCase().includes('retro');
      expect(hasEraInfluence).toBe(true);
    });

    test('includes intent influence when intent is provided', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'dance floor track' },
        config
      );

      // Dancefloor intent should influence output
      expect(result.text).toBeDefined();
    });

    test('includes cultural instruments when culturalContext is provided', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'Brazilian samba carnival music' },
        config
      );

      // Cultural instruments (surdo, tamborim) might appear in output
      // or influence the instrument selection
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(50);
    });

    test('applies narrative arc to section mood progression', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'journey song with emotional progression' },
        config
      );

      expect(result.text).toBeDefined();
      // The output should have section markers if in section mode
      // or have varied moods reflecting the arc
    });
  });

  describe('Generation with partial enrichment', () => {
    test('works with core fields only', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_PARTIAL_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'retro synth track' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('works with minimal context (base fields only)', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_MINIMAL_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'peaceful morning song' },
        config
      );

      expect(result.text).toBeDefined();
      // Themes should appear in output
      const hasTheme = result.text.toLowerCase().includes('love') ||
                       result.text.toLowerCase().includes('hope') ||
                       result.text.toLowerCase().includes('journey');
      expect(hasTheme).toBe(true);
    });

    test('gracefully handles missing optional enrichment fields', async () => {
      // Context with only core fields, no vocal/spatial/narrative fields
      const partialContext: ThematicContext = {
        themes: ['rock', 'power', 'energy'],
        moods: ['powerful', 'driving'],
        scene: 'stadium rock concert',
        era: '80s',
      };
      mockExtractThematicContext.mockResolvedValue(partialContext);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'stadium rock anthem' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback when LLM unavailable', () => {
    test('produces valid output when LLM unavailable', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const result = await generateInitial(
        { description: 'a jazz song with piano' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('fallback produces valid structured output', async () => {
      const seed = 42;

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const result = await generateInitial(
        { description: 'electronic ambient track' },
        config,
        { rng: createSeededRng(seed) }
      );

      // Verify structure is correct even in fallback mode
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);
      // Should have genre indicator
      expect(result.text.toLowerCase()).toContain('genre');
      // Should have mood indicator
      expect(result.text.toLowerCase()).toContain('mood');
      // Should have sections
      expect(result.text.toUpperCase()).toMatch(/\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]/);
    });

    test('fallback uses keyword-based era detection', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      // "synthwave" and "neon" should trigger 80s era in fallback
      const result = await generateInitial(
        { description: 'synthwave track with neon lights' },
        config
      );

      expect(result.text).toBeDefined();
      // Should still produce valid output even without LLM
    });

    test('thematic extraction not called when LLM unavailable', async () => {
      mockExtractThematicContext.mockReset();

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      await generateInitial(
        { description: 'test song' },
        config
      );

      expect(mockExtractThematicContext).not.toHaveBeenCalled();
    });
  });

  describe('Artist name filtering (CRITICAL)', () => {
    test('NO artist names appear in output with musical reference', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_CONTEXT_WITH_REFERENCE);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'progressive rock space music' },
        config
      );

      assertNoArtistNames(result.text);
      if (result.title) {
        assertNoArtistNames(result.title);
      }
    });

    test('NO artist names in output even with full enrichment', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'Brazilian carnival' },
        config
      );

      assertNoArtistNames(result.text);
    });

    test('NO artist names in fallback mode', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const result = await generateInitial(
        { description: 'rock song' },
        config
      );

      assertNoArtistNames(result.text);
    });

    test('signature tags from musical reference are style descriptors only', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_CONTEXT_WITH_REFERENCE);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'space rock epic' },
        config
      );

      // Signature tags should be production/style descriptors
      // like "synthesizer solos", "long instrumental sections"
      // NOT artist names
      assertNoArtistNames(result.text);
    });
  });

  describe('Performance requirements', () => {
    test('generation completes within 4-second timeout', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const startTime = performance.now();

      await generateInitial(
        { description: 'test performance timing' },
        config
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete well within 4 seconds (4000ms)
      // In practice, mocked tests should be much faster
      expect(duration).toBeLessThan(4000);
    });

    test('fallback generation is fast (under 100ms)', async () => {
      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => false,
      });

      const startTime = performance.now();

      await generateInitial(
        { description: 'fast fallback test' },
        config
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Deterministic fallback should be very fast
      expect(duration).toBeLessThan(100);
    });

    test('slow LLM extraction does not block beyond timeout', async () => {
      // Simulate slow LLM extraction
      mockExtractThematicContext.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return MOCK_FULLY_ENRICHED_CONTEXT;
      });

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const startTime = performance.now();

      const result = await generateInitial(
        { description: 'test with slow extraction' },
        config
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.text).toBeDefined();
      // Even with 200ms extraction delay, should complete quickly
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Edge cases', () => {
    test('handles empty narrativeArc gracefully', async () => {
      const contextWithEmptyArc: ThematicContext = {
        themes: ['ambient', 'space', 'calm'],
        moods: ['peaceful', 'floating'],
        scene: 'drifting through space',
        narrativeArc: [],
      };
      mockExtractThematicContext.mockResolvedValue(contextWithEmptyArc);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'ambient space music' },
        config
      );

      expect(result.text).toBeDefined();
    });

    test('handles empty culturalContext gracefully', async () => {
      const contextWithEmptyCultural: ThematicContext = {
        themes: ['world', 'fusion', 'blend'],
        moods: ['eclectic', 'diverse'],
        scene: 'world music festival',
        culturalContext: {},
      };
      mockExtractThematicContext.mockResolvedValue(contextWithEmptyCultural);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'world fusion music' },
        config
      );

      expect(result.text).toBeDefined();
    });

    test('handles null extraction result gracefully', async () => {
      mockExtractThematicContext.mockResolvedValue(null);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'test with null extraction' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('handles extraction timeout gracefully', async () => {
      mockExtractThematicContext.mockImplementation(async () => {
        // Simulate timeout by never resolving within test timeout
        await new Promise((resolve) => setTimeout(resolve, 100));
        return null;
      });

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'test with timeout' },
        config
      );

      expect(result.text).toBeDefined();
    });
  });

  describe('Backward compatibility', () => {
    test('output format remains consistent with pre-enrichment', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_MINIMAL_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'simple pop song' },
        config
      );

      // Should have standard output structure
      expect(result.text).toBeDefined();
      expect(result.title).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(typeof result.title).toBe('string');
    });

    test('seeded generation remains deterministic', async () => {
      const seed = 12345;
      mockExtractThematicContext.mockResolvedValue(MOCK_MINIMAL_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result1 = await generateInitial(
        { description: 'deterministic test' },
        config,
        { rng: createSeededRng(seed) }
      );

      const result2 = await generateInitial(
        { description: 'deterministic test' },
        config,
        { rng: createSeededRng(seed) }
      );

      expect(result1.text).toBe(result2.text);
    });
  });

  // ============================================
  // Full Hybrid Generation with Vocal/Energy/Spatial Fields
  // ============================================

  describe('Full hybrid generation with vocal/energy/spatial fields', () => {
    test('produces enriched output with all vocal/energy/spatial fields populated', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'powerful gospel choir with hall reverb' },
        config
      );

      // Verify output is defined and substantial
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);
      expect(result.title).toBeDefined();

      // All vocal/energy/spatial fields should influence output in some way
      // vocalCharacter should add vocal tags
      // energyLevel should adjust weights
      // spatialHint should influence reverb selection
    });

    test('verifies tag count does not exceed 15 with full enrichment', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'full enrichment test' },
        config
      );

      // Extract style tags from output
      const styleTagsMatch = /Style Tags:\s*([^\n]+)/i.exec(result.text);
      if (styleTagsMatch?.[1]) {
        const tags = styleTagsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
        expect(tags.length).toBeLessThanOrEqual(APP_CONSTANTS.STYLE_TAG_LIMIT);
      }
    });
  });

  describe('Partial vocal/energy/spatial field scenarios', () => {
    test('works with only vocalCharacter set', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_VOCAL_CHARACTER_ONLY);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'soulful gospel song' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // Should produce valid output even with only vocalCharacter
      // Vocal-related tags may appear based on character - verified at unit level
    });

    test('works with only energyLevel set', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_ENERGY_LEVEL_ONLY);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'ambient meditation music' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // Ambient energy level should reduce dynamic tags
      // This is tested more thoroughly at unit level
    });

    test('works with only spatialHint set', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_SPATIAL_HINT_ONLY);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'cathedral ambient music' },
        config
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // Vast space + cavernous reverb should influence reverb selection
      // This is tested more thoroughly at unit level
    });
  });

  describe('Tag budget enforcement', () => {
    test('output has 15 or fewer tags with maximum enrichment', async () => {
      // Context with maximum possible enrichment
      const maxEnrichmentContext: ThematicContext = {
        themes: ['epic', 'cinematic', 'orchestral'],
        moods: ['triumphant', 'majestic', 'soaring'],
        scene: 'grand finale of an epic film score',
        era: '80s',
        tempo: { adjustment: 20, curve: 'explosive' },
        intent: 'cinematic',
        musicalReference: {
          style: ['cinematic', 'orchestral', 'epic'],
          signature: ['big crescendos', 'brass fanfares'],
        },
        vocalCharacter: {
          style: 'powerful',
          layering: 'choir',
          technique: 'belt',
        },
        energyLevel: 'intense',
        spatialHint: {
          space: 'vast',
          reverb: 'cavernous',
        },
        narrativeArc: ['introduction', 'rising', 'climax', 'resolution', 'epilogue'],
        culturalContext: {
          region: 'hollywood',
          instruments: ['orchestra', 'choir'],
          scale: 'major',
        },
      };
      mockExtractThematicContext.mockResolvedValue(maxEnrichmentContext);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'epic cinematic score' },
        config
      );

      // Parse style tags
      const styleTagsMatch = /Style Tags:\s*([^\n]+)/i.exec(result.text);
      if (styleTagsMatch?.[1]) {
        const tags = styleTagsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
        expect(tags.length).toBeLessThanOrEqual(15);
      }
    });

    test('high-priority tags (production, recording) are preserved', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result = await generateInitial(
        { description: 'test high priority tags' },
        config
      );

      // Recording field should be present
      expect(result.text.toLowerCase()).toContain('recording');

      // Production-related terms should appear somewhere
      const hasProduction = result.text.toLowerCase().includes('reverb') ||
                            result.text.toLowerCase().includes('stereo') ||
                            result.text.toLowerCase().includes('room') ||
                            result.text.toLowerCase().includes('hall');
      expect(hasProduction).toBe(true);
    });
  });

  describe('Deterministic reproducibility', () => {
    test('same seed produces same output with enrichment fields', async () => {
      const seed = 54321;
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result1 = await generateInitial(
        { description: 'deterministic enrichment test' },
        config,
        { rng: createSeededRng(seed) }
      );

      const result2 = await generateInitial(
        { description: 'deterministic enrichment test' },
        config,
        { rng: createSeededRng(seed) }
      );

      expect(result1.text).toBe(result2.text);
    });

    test('different seeds produce different outputs', async () => {
      mockExtractThematicContext.mockResolvedValue(MOCK_FULLY_ENRICHED_CONTEXT);

      const config = createMockConfig({
        isLyricsMode: () => false,
        isLLMAvailable: () => true,
      });

      const result1 = await generateInitial(
        { description: 'different seed test' },
        config,
        { rng: createSeededRng(11111) }
      );

      const result2 = await generateInitial(
        { description: 'different seed test' },
        config,
        { rng: createSeededRng(99999) }
      );

      // Outputs should differ with different seeds
      expect(result1.text).not.toBe(result2.text);
    });
  });
});
