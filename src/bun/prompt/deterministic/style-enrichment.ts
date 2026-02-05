/**
 * Thematic enrichment functions for style tag assembly.
 *
 * Handles appending thematic themes, era tags, intent tags,
 * musical reference tags, and cultural context tags.
 *
 * @module prompt/deterministic/style-enrichment
 */

import { getCulturalScale, selectCulturalInstruments } from '@bun/instruments/cultural-instruments';
import { extractThemes } from '@bun/keywords';
import { traceDecision } from '@bun/trace';
import { EraSchema } from '@shared/schemas/thematic-context';

import { getEraProductionTagsLimited } from './era-tags';
import { getIntentTagsLimited } from './intent-tags';

import type { TraceCollector } from '@bun/trace';
import type { Era, ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Append thematic content from LLM context to style tags.
 * Adds first 2 themes + scene phrase (if available).
 *
 * If no thematic context but description is provided, falls back to
 * direct keyword extraction to preserve user's thematic intent.
 *
 * @param thematicContext - Optional LLM-extracted thematic context
 * @param addUnique - Function to add unique tags
 * @param trace - Optional trace collector
 * @param description - Optional user description for fallback extraction
 */
export function appendThematicThemes(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector,
  description?: string
): void {
  // If thematic context available, use it (LLM path)
  if (thematicContext) {
    // Add first 2 themes
    const themesToAppend = thematicContext.themes.slice(0, 2);
    for (const theme of themesToAppend) {
      addUnique(theme);
    }

    // Add scene phrase if available
    const scene = thematicContext.scene?.trim();
    if (scene) {
      addUnique(scene);
    }

    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.thematicContext',
      branchTaken: 'thematic-appended',
      why: `Appended ${themesToAppend.length} themes${scene ? ' + scene phrase' : ''} from LLM context`,
      selection: {
        method: 'shuffleSlice',
        candidates: scene ? [...themesToAppend, scene] : themesToAppend,
      },
    });
    return;
  }

  // Fallback: Extract themes directly from description (deterministic path)
  if (description) {
    const extractedThemes = extractThemes(description, 2);
    if (extractedThemes.length > 0) {
      for (const theme of extractedThemes) {
        addUnique(theme);
      }

      traceDecision(trace, {
        domain: 'styleTags',
        key: 'deterministic.styleTags.thematicContext',
        branchTaken: 'keyword-themes-fallback',
        why: `No LLM context; extracted ${extractedThemes.length} themes from description via keywords: ${extractedThemes.join(', ')}`,
        selection: { method: 'shuffleSlice', candidates: extractedThemes },
      });
    }
  }
}

/**
 * Resolve era from thematicContext with musicalReference fallback.
 *
 * Returns the top-level era if set, otherwise attempts to use
 * musicalReference.era as a fallback (if it's a valid Era enum value).
 *
 * @param thematicContext - Optional thematic context
 * @returns Resolved Era or undefined
 *
 * @example
 * resolveEra({ era: '80s', ... }) // Returns '80s'
 * resolveEra({ musicalReference: { era: '70s', ... }, ... }) // Returns '70s'
 * resolveEra({ musicalReference: { era: 'invalid', ... }, ... }) // Returns undefined
 */
export function resolveEra(thematicContext: ThematicContext | undefined): Era | undefined {
  // Return top-level era if set
  if (thematicContext?.era) return thematicContext.era;

  // Fallback to musicalReference.era if it's a valid Era enum value
  const refEra = thematicContext?.musicalReference?.era;
  if (refEra && EraSchema.safeParse(refEra).success) {
    return refEra as Era;
  }

  return undefined;
}

/**
 * Append era-based production tags to style output.
 *
 * Adds production tags that characterize the sonic qualities of recordings
 * from the specified era. Limited to 2 tags to preserve tag budget.
 * Uses resolveEra() to support musicalReference.era fallback.
 *
 * @param thematicContext - Optional thematic context with era field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
export function appendEraTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  const era = resolveEra(thematicContext);
  if (!era) return;

  const eraTags = getEraProductionTagsLimited(era, 2);
  for (const tag of eraTags) {
    addUnique(tag);
  }

  // Determine if era came from top-level or musicalReference
  const eraSource = thematicContext?.era ? 'top-level' : 'musicalReference';

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.enrichedContext',
    branchTaken: 'era-tags-appended',
    why: `Appended ${eraTags.length} era tags for era=${era} (source: ${eraSource})`,
    selection: { method: 'index', candidates: [...eraTags] },
  });
}

/**
 * Append intent-based production tags to style output.
 *
 * Adds production tags that optimize the generated music for specific
 * listening purposes (background, focal, cinematic, dancefloor, emotional).
 * Limited to 1 tag to preserve tag budget.
 *
 * @param thematicContext - Optional thematic context with intent field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
export function appendIntentTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.intent) return;

  const intentTags = getIntentTagsLimited(thematicContext.intent, 1);
  for (const tag of intentTags) {
    addUnique(tag);
  }

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.enrichedContext',
    branchTaken: 'intent-tags-appended',
    why: `Appended ${intentTags.length} intent tag for intent=${thematicContext.intent}`,
    selection: { method: 'index', candidates: [...intentTags] },
  });
}

/**
 * Validate that a signature element is a production descriptor, not an artist name.
 *
 * This is a CRITICAL security validation to ensure no artist names slip through
 * to the Suno output. The musicalReference.signature array should only contain
 * production style descriptors like "spacey guitar delay", "slow build", "analog synth".
 *
 * Validation criteria:
 * - Must be at least 3 characters (filters out initials)
 * - Should contain spaces or hyphens (compound descriptors are safer)
 * - Should not be a capitalized single word (likely a name)
 * - Should not match common name patterns
 *
 * @param signature - The signature element to validate
 * @returns True if the signature appears to be a valid production descriptor
 */
function isValidProductionSignature(signature: string): boolean {
  const trimmed = signature.trim();

  // Filter out very short strings (could be abbreviations or initials)
  if (trimmed.length < 3) {
    return false;
  }

  // Filter out empty or whitespace-only strings
  if (trimmed.length === 0) {
    return false;
  }

  // Check if it's a single capitalized word (likely a name)
  // Valid signatures are typically multi-word or lowercase descriptors
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    // Single word: reject if it starts with uppercase (likely a proper noun/name)
    // Allow single words that are all lowercase (e.g., "vocoder", "reverb")
    if (/^[A-Z]/.test(trimmed)) {
      return false;
    }
  }

  // Additional pattern-based filtering for common name formats
  // Reject strings that look like "First Last" or "First Middle Last"
  const namePattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/;
  if (namePattern.test(trimmed)) {
    return false;
  }

  // Reject strings that end with common name suffixes
  const nameSuffixPattern = /\b(Jr\.?|Sr\.?|III?|IV)\s*$/i;
  if (nameSuffixPattern.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Append musical reference signature tags to style output.
 *
 * Extracts signature production elements from the musicalReference context
 * (e.g., "spacey guitar delay", "slow build", "analog synth"). These are
 * production style characteristics extracted from artist references, but
 * NEVER include artist names themselves.
 *
 * CRITICAL: This function includes validation to ensure no artist names
 * slip through to the output. Only production descriptors are allowed.
 *
 * Limited to 2 signature tags to preserve tag budget.
 *
 * @param thematicContext - Optional thematic context with musicalReference field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
export function appendMusicalReferenceTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.musicalReference?.signature) return;

  const signatures = thematicContext.musicalReference.signature;
  if (signatures.length === 0) return;

  // Filter signatures to ensure no artist names slip through
  const validatedSignatures = signatures.filter(isValidProductionSignature).slice(0, 2); // Limit to 2 signatures

  // Track any filtered signatures for debugging
  const filteredCount = Math.min(signatures.length, 2) - validatedSignatures.length;

  for (const sig of validatedSignatures) {
    addUnique(sig);
  }

  if (validatedSignatures.length > 0 || filteredCount > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken:
        validatedSignatures.length > 0
          ? 'musical-reference-appended'
          : 'musical-reference-filtered',
      why: `Appended ${validatedSignatures.length} musical reference signature tags${filteredCount > 0 ? ` (filtered ${filteredCount} potential artist names)` : ''}`,
      selection: { method: 'index', candidates: [...validatedSignatures] },
    });
  }
}

/**
 * Append style tags from musicalReference.style array.
 *
 * Extracts up to 2 style descriptors from the musicalReference context.
 * Uses the same validation as signature tags to ensure no artist names
 * slip through to the output.
 *
 * @param thematicContext - Optional thematic context with musicalReference field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 *
 * @example
 * // With musicalReference.style = ['ethereal', 'shoegaze', 'dreamy']
 * // Adds: 'ethereal', 'shoegaze' (max 2)
 */
export function appendMusicalReferenceStyleTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.musicalReference?.style) return;

  const styles = thematicContext.musicalReference.style;
  if (styles.length === 0) return;

  // Filter and limit to 2 style tags
  const validatedStyles = styles
    .filter(isValidProductionSignature) // Reuse signature validation
    .slice(0, 2);

  // Track any filtered styles for debugging
  const filteredCount = Math.min(styles.length, 2) - validatedStyles.length;

  for (const style of validatedStyles) {
    addUnique(style.toLowerCase());
  }

  if (validatedStyles.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken: 'musical-reference-style-appended',
      why: `Appended ${validatedStyles.length} style tags from musicalReference.style${filteredCount > 0 ? ` (filtered ${filteredCount} invalid entries)` : ''}`,
      selection: { method: 'index', candidates: [...validatedStyles] },
    });
  }
}

/**
 * Append cultural context tags to style output.
 *
 * Adds cultural/regional context elements when available:
 * 1. Regional instruments (up to 2) - merged with genre instrument pool
 * 2. Cultural scale/mode (1) - added to harmonic tag selection
 *
 * Cultural context enhances authenticity when generating music inspired by
 * specific regional traditions (Brazil, Japan, Celtic, India, Middle East, Africa).
 *
 * @param thematicContext - Optional thematic context with culturalContext field
 * @param addUnique - Function to add unique tags to collection
 * @param rng - Random number generator for instrument selection
 * @param trace - Optional trace collector for debugging
 *
 * @example
 * // With Brazilian cultural context:
 * // Adds: 'surdo', 'tamborim', 'mixolydian'
 */
export function appendCulturalContextTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  rng: () => number,
  trace?: TraceCollector
): void {
  if (!thematicContext?.culturalContext?.region) return;

  const region = thematicContext.culturalContext.region;
  const addedTags: string[] = [];

  // Add cultural instruments (up to 2)
  // First check if context provides instruments, otherwise lookup from database
  let instruments: string[] = [];
  if (
    thematicContext.culturalContext.instruments &&
    thematicContext.culturalContext.instruments.length > 0
  ) {
    // Use provided instruments (already extracted by LLM)
    instruments = thematicContext.culturalContext.instruments.slice(0, 2);
  } else {
    // Lookup from cultural instruments database
    instruments = selectCulturalInstruments(region, 2, rng);
  }

  for (const instrument of instruments) {
    addUnique(instrument);
    addedTags.push(instrument);
  }

  // Add cultural scale/mode (1 tag)
  // First check if context provides scale, otherwise lookup from database
  let scale: string | undefined;
  if (thematicContext.culturalContext.scale) {
    scale = thematicContext.culturalContext.scale;
  } else {
    scale = getCulturalScale(region);
  }

  if (scale) {
    addUnique(scale);
    addedTags.push(scale);
  }

  if (addedTags.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken: 'cultural-context-appended',
      why: `Appended ${addedTags.length} cultural context tags for region=${region}: ${addedTags.join(', ')}`,
      selection: { method: 'index', candidates: [...addedTags] },
    });
  }
}
