/**
 * Quick Vibes Builder
 *
 * Main builder function for deterministic Quick Vibes prompts.
 *
 * @module prompt/quick-vibes/builder
 */

import { selectMoodsForCategory } from '@bun/mood';
import { traceDecision } from '@bun/trace';
import { selectRandom } from '@shared/utils/random';

import { QUICK_VIBES_TEMPLATES } from './templates';

import type { BuildQuickVibesOptions, QuickVibesTemplate } from './types';
import type { TraceCollector } from '@bun/trace';
import type { QuickVibesCategory } from '@shared/types';

/**
 * Probability of adding context suffix to title (e.g., "Warm Beats to Study To").
 * Set to 50% for balanced variety between short and contextual titles.
 */
const TITLE_CONTEXT_PROBABILITY = 0.5;

/**
 * Generate a deterministic title from template word pools.
 *
 * Combines adjective + noun, optionally adding context suffix for variety.
 *
 * @param template - The category template containing title word pools
 * @param rng - Random number generator for deterministic selection
 * @param trace - Optional trace collector for debug mode
 * @returns Generated title string
 *
 * @example
 * const template = QUICK_VIBES_TEMPLATES['lofi-study'];
 * generateQuickVibesTitle(template, () => 0.3);
 * // "Warm Beats to Study To" (with context, since 0.3 < 0.5)
 *
 * @example
 * generateQuickVibesTitle(template, () => 0.8);
 * // "Mellow Session" (no context, since 0.8 >= 0.5)
 */
export function generateQuickVibesTitle(
  template: QuickVibesTemplate,
  rng: () => number,
  trace?: TraceCollector
): string {
  const { titleWords } = template;
  const adjective = selectRandom(titleWords.adjectives, rng);
  const noun = selectRandom(titleWords.nouns, rng);

  // Add context suffix for more descriptive titles half the time
  const addContext = rng() < TITLE_CONTEXT_PROBABILITY;
  let title: string;

  if (addContext) {
    const context = selectRandom(titleWords.contexts, rng);
    title = `${adjective} ${noun} ${context}`;
  } else {
    title = `${adjective} ${noun}`;
  }

  traceDecision(trace, {
    domain: 'other',
    key: 'quickVibes.title.generate',
    branchTaken: title,
    why: `adjective="${adjective}" noun="${noun}"${addContext ? ` context added` : ''}`,
  });

  return title;
}

/**
 * Build a deterministic Quick Vibes prompt from templates.
 *
 * Selects genre, instruments, and mood from category-specific pools,
 * then formats as either MAX mode or standard mode prompt.
 *
 * When moodCategory is provided, uses moods from that category instead of
 * template moods. Falls back to template moods if category selection returns empty.
 *
 * @param category - Quick Vibes category (e.g., 'lofi-study', 'cafe-coffeeshop')
 * @param withWordlessVocals - Whether to include wordless vocals in instruments
 * @param maxMode - Whether to use MAX mode format (quoted fields) or standard
 * @param rngOrOptions - Random number generator OR options object
 * @returns Object with generated prompt text and title
 *
 * @example
 * // Generate a lo-fi study prompt in MAX mode
 * const result = buildDeterministicQuickVibes('lofi-study', false, true);
 * // result.text: 'Genre: "lo-fi"\nMood: "relaxed"\nInstruments: "Rhodes piano, vinyl crackle, soft drums"'
 * // result.title: "Warm Beats to Study To"
 *
 * @example
 * // Generate with wordless vocals in standard mode
 * const result = buildDeterministicQuickVibes('ambient-focus', true, false);
 * // result.text: 'meditative ambient\nInstruments: synthesizer pad, reverb textures, soft drones, wordless vocals'
 *
 * @example
 * // Generate with mood category override
 * const result = buildDeterministicQuickVibes('lofi-study', false, true, {
 *   moodCategory: 'calm',
 *   rng: () => 0.5,
 * });
 * // Mood will be selected from 'calm' category instead of template moods
 */
export function buildDeterministicQuickVibes(
  category: QuickVibesCategory,
  withWordlessVocals: boolean,
  maxMode: boolean,
  rngOrOptions: (() => number) | BuildQuickVibesOptions = Math.random,
): { text: string; title: string } {
  // Handle both old function signature (rng only) and new options object
  const options: BuildQuickVibesOptions =
    typeof rngOrOptions === 'function'
      ? { withWordlessVocals, maxMode, rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;
  const trace = options.trace;

  const template = QUICK_VIBES_TEMPLATES[category];

  const genre = selectRandom(template.genres, rng);
  traceDecision(trace, {
    domain: 'genre',
    key: 'quickVibes.genre.select',
    branchTaken: genre,
    why: `category="${category}"`,
    selection: {
      method: 'pickRandom',
      candidates: template.genres,
    },
  });

  const instruments = selectRandom(template.instruments, rng);
  traceDecision(trace, {
    domain: 'instruments',
    key: 'quickVibes.instruments.select',
    branchTaken: instruments.join(', '),
    why: `category="${category}"`,
    selection: {
      method: 'pickRandom',
      candidates: template.instruments.map(i => i.join(', ')),
    },
  });

  // Select mood: use mood category if provided, otherwise use template moods
  let mood: string;
  let moodSource: string;
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 1, rng);
    // Fall back to template mood if category selection returns empty
    if (categoryMoods[0]) {
      mood = categoryMoods[0];
      moodSource = `moodCategory="${moodCategory}"`;
    } else {
      mood = selectRandom(template.moods, rng);
      moodSource = `moodCategory="${moodCategory}" empty, fallback to template`;
    }
  } else {
    mood = selectRandom(template.moods, rng);
    moodSource = 'template';
  }

  traceDecision(trace, {
    domain: 'mood',
    key: 'quickVibes.mood.select',
    branchTaken: mood,
    why: moodSource,
    selection: moodCategory
      ? { method: 'pickRandom' }
      : { method: 'pickRandom', candidates: template.moods },
  });

  const title = generateQuickVibesTitle(template, rng, trace);

  // Build instrument list
  const instrumentList = [...instruments];
  if (withWordlessVocals) {
    instrumentList.push('wordless vocals');
  }

  // Build the prompt based on mode
  if (maxMode) {
    // Use lowercase field names consistent with Full Prompt MAX mode
    const lines = [
      `genre: "${genre}"`,
      `mood: "${mood}"`,
      `instruments: "${instrumentList.join(', ')}"`,
    ];
    return {
      text: lines.join('\n'),
      title,
    };
  }

  // Standard mode - simpler format
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instrumentList.join(', ')}`,
  ];
  return {
    text: lines.join('\n'),
    title,
  };
}

/**
 * Get template for a category.
 *
 * @param category - Quick Vibes category
 * @returns Template containing genre, instrument, mood, and title word pools
 *
 * @example
 * const template = getQuickVibesTemplate('cafe-coffeeshop');
 * console.log(template.genres); // ['cafe jazz', 'bossa nova', ...]
 * console.log(template.moods);  // ['cozy', 'warm', 'intimate', ...]
 */
export function getQuickVibesTemplate(category: QuickVibesCategory): QuickVibesTemplate {
  return QUICK_VIBES_TEMPLATES[category];
}
