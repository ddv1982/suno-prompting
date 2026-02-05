/**
 * Coherence Validation for Deterministic Prompts
 *
 * Lightweight conflict detection to ensure musically sensible
 * instrument-production combinations. This module validates that
 * selected instruments and production tags create coherent musical
 * combinations.
 *
 * At low creativity levels (≤60), strict checking is applied to
 * prevent obviously conflicting combinations. At high creativity
 * levels (>60), permissive mode allows experimental fusions.
 *
 * @module prompt/deterministic/coherence
 */

import { traceDecision } from '@bun/trace';

import type { TraceCollector } from '@bun/trace';

/**
 * Result from coherence validation.
 *
 * @example
 * ```typescript
 * const result: CoherenceResult = {
 *   valid: false,
 *   conflicts: ['distorted-intimate'],
 *   suggestions: ['Consider adjusting instruments or production style for better coherence']
 * };
 * ```
 */
export interface CoherenceResult {
  /** Whether the combination is coherent */
  readonly valid: boolean;
  /** List of detected conflicts (empty if valid) */
  readonly conflicts: readonly string[];
  /** Suggestions for fixing conflicts (optional) */
  readonly suggestions?: readonly string[];
}

/**
 * Conflict rule definition.
 *
 * Each rule specifies patterns that indicate musically incoherent
 * combinations when both instrument and production patterns match.
 */
interface ConflictRule {
  /** Unique identifier for this conflict rule */
  readonly id: string;
  /** Human-readable description of the conflict */
  readonly description: string;
  /** Instrument patterns that trigger this rule */
  readonly instrumentPatterns: readonly string[];
  /** Production patterns that conflict with the instruments */
  readonly productionPatterns: readonly string[];
}

/**
 * Conflict rules for coherence checking.
 *
 * Each rule defines instrument-production combinations that are
 * musically incoherent. These rules focus on obvious mismatches
 * rather than subtle preferences.
 *
 * Rule Categories:
 * 1. distorted-intimate: Heavy/distorted sounds don't pair with intimate/gentle production
 * 2. acoustic-digital: Pure acoustic instruments clash with heavy digital processing
 * 3. orchestral-lofi: Full orchestral sounds don't fit lo-fi aesthetics
 * 4. delicate-aggressive: Delicate instruments clash with aggressive production
 * 5. vintage-futuristic: Period-specific vintage gear conflicts with futuristic processing
 */
const CONFLICT_RULES: readonly ConflictRule[] = [
  {
    id: 'distorted-intimate',
    description: 'Distorted instruments with intimate production',
    instrumentPatterns: [
      'distorted',
      'overdriven',
      'fuzz',
      'heavy guitar',
      'crushing',
      'screaming',
    ],
    productionPatterns: ['intimate', 'bedroom', 'whisper', 'gentle', 'delicate', 'soft'],
  },
  {
    id: 'acoustic-digital',
    description: 'Pure acoustic instruments with heavy digital processing',
    instrumentPatterns: [
      'acoustic guitar',
      'upright bass',
      'acoustic piano',
      'nylon string',
      'ukulele',
    ],
    productionPatterns: [
      'glitch',
      'bitcrushed',
      'digital distortion',
      'vocoder',
      'autotune',
      'robotic',
    ],
  },
  {
    id: 'orchestral-lofi',
    description: 'Orchestral instruments with lo-fi production',
    instrumentPatterns: [
      'symphony',
      'orchestra',
      'string section',
      'philharmonic',
      'chamber orchestra',
      'full strings',
    ],
    productionPatterns: [
      'lo-fi',
      'vinyl crackle',
      'tape hiss',
      'dusty',
      'bedroom production',
      'cassette',
    ],
  },
  {
    id: 'delicate-aggressive',
    description: 'Delicate instruments with aggressive production',
    instrumentPatterns: [
      'music box',
      'celesta',
      'harp',
      'glockenspiel',
      'kalimba',
      'wind chimes',
      'glass harmonica',
    ],
    productionPatterns: [
      'crushing',
      'aggressive',
      'slamming',
      'brutal',
      'punishing',
      'extreme compression',
    ],
  },
  {
    id: 'vintage-futuristic',
    description: 'Vintage instruments with futuristic production',
    instrumentPatterns: ['phonograph', 'gramophone', '1920s', 'antique', 'victorian', 'baroque'],
    productionPatterns: ['futuristic', 'sci-fi', 'neural', 'ai-generated', 'cyber', 'space age'],
  },
] as const satisfies readonly ConflictRule[];

/**
 * Check if any patterns match in the given text.
 *
 * @param text - Text to search in (case-insensitive)
 * @param patterns - Patterns to match
 * @returns true if any pattern is found in the text
 */
function matchesAnyPattern(text: string, patterns: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

/**
 * Check coherence between instruments and production tags.
 *
 * At low creativity (0-60), applies strict checking to prevent
 * obviously conflicting combinations. At high creativity (61+),
 * allows experimental combinations (permissive mode).
 *
 * @param instruments - Array of instrument names
 * @param productionTags - Array of production/style tags
 * @param creativityLevel - Current creativity level (0-100)
 * @returns CoherenceResult with validation status and any conflicts
 *
 * @example
 * ```typescript
 * // Low creativity - strict checking
 * const result = checkCoherence(
 *   ['distorted guitar', 'heavy bass'],
 *   ['intimate bedroom recording'],
 *   30
 * );
 * // result.valid === false, result.conflicts === ['distorted-intimate']
 *
 * // High creativity - permissive
 * const result2 = checkCoherence(
 *   ['distorted guitar', 'heavy bass'],
 *   ['intimate bedroom recording'],
 *   80
 * );
 * // result2.valid === true, result2.conflicts === []
 * ```
 */
export function checkCoherence(
  instruments: readonly string[],
  productionTags: readonly string[],
  creativityLevel: number
): CoherenceResult {
  // High creativity = permissive (allow weird fusions)
  if (creativityLevel > 60) {
    return { valid: true, conflicts: [] };
  }

  const instrumentsText = instruments.join(' ');
  const productionText = productionTags.join(' ');
  const conflicts: string[] = [];

  for (const rule of CONFLICT_RULES) {
    const hasInstrumentMatch = matchesAnyPattern(instrumentsText, rule.instrumentPatterns);
    const hasProductionMatch = matchesAnyPattern(productionText, rule.productionPatterns);

    if (hasInstrumentMatch && hasProductionMatch) {
      conflicts.push(rule.id);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    suggestions:
      conflicts.length > 0
        ? ['Consider adjusting instruments or production style for better coherence']
        : undefined,
  };
}

/**
 * Validate and optionally fix coherence issues.
 *
 * Returns the original tags if valid, or filtered tags if conflicts
 * detected. This function is useful for automatic correction of
 * incoherent combinations.
 *
 * @param instruments - Array of instrument names
 * @param productionTags - Array of production/style tags
 * @param creativityLevel - Current creativity level (0-100)
 * @param trace - Optional trace collector for logging
 * @returns Validated (possibly filtered) production tags
 *
 * @example
 * ```typescript
 * const tags = validateAndFixCoherence(
 *   ['distorted guitar'],
 *   ['intimate bedroom recording', 'warm', 'wide stereo'],
 *   30
 * );
 * // Returns ['warm', 'wide stereo'] - 'intimate bedroom recording' removed
 * ```
 */
export function validateAndFixCoherence(
  instruments: readonly string[],
  productionTags: readonly string[],
  creativityLevel: number,
  trace?: TraceCollector
): readonly string[] {
  const result = checkCoherence(instruments, productionTags, creativityLevel);

  if (result.valid) {
    return productionTags;
  }

  // Filter out conflicting production tags
  const instrumentsText = instruments.join(' ');
  const removedTags: string[] = [];

  const filteredTags = productionTags.filter((tag) => {
    for (const rule of CONFLICT_RULES) {
      const hasInstrumentMatch = matchesAnyPattern(instrumentsText, rule.instrumentPatterns);
      const hasProductionMatch = matchesAnyPattern(tag, rule.productionPatterns);

      if (hasInstrumentMatch && hasProductionMatch) {
        removedTags.push(tag);
        return false; // Remove conflicting tag
      }
    }
    return true;
  });

  // Trace logging for removed tags
  if (removedTags.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.coherence.fix',
      branchTaken: 'tags-filtered',
      why: `Removed ${removedTags.length} conflicting tags at creativity=${creativityLevel}: ${removedTags.join(', ')}`,
    });
  }

  return filteredTags;
}

/**
 * Get description of a conflict rule by ID.
 *
 * @param conflictId - Conflict rule ID
 * @returns Human-readable description or undefined if not found
 */
export function getConflictDescription(conflictId: string): string | undefined {
  const rule = CONFLICT_RULES.find((r) => r.id === conflictId);
  return rule?.description;
}

/**
 * Get all available conflict rule IDs.
 *
 * @returns Array of all conflict rule IDs
 */
export function getAllConflictRuleIds(): readonly string[] {
  return CONFLICT_RULES.map((r) => r.id);
}
