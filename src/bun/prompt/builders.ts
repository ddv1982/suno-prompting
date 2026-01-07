import {
  detectRhythmic,
  getRhythmicGuidance,
  extractInstruments,
  buildGuidanceFromSelection,
  selectInstrumentsForGenre,
  getMultiGenreNuanceGuidance,
} from '@bun/instruments';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildProgressionDescriptor } from '@bun/prompt/chord-progressions';
import { buildPerformanceGuidance, parseGenreComponents } from '@bun/prompt/genre-parser';
import { MAX_MODE_HEADER } from '@bun/prompt/realism-tags';
import { CONTEXT_INTEGRATION_INSTRUCTIONS, JSON_OUTPUT_FORMAT_RULES } from '@bun/prompt/shared-instructions';
import { APP_CONSTANTS, DEFAULT_GENRE } from '@shared/constants';

import type { ModeSelection } from '@bun/instruments/selection';
import type { PreFormattedMaxOutput, PreFormattedStandardOutput } from '@bun/prompt/context-preservation';

/**
 * Builds song concept parts for LLM prompts.
 * Includes user description and optional lyrics topic section.
 */
function buildSongConceptParts(
  header: string,
  description: string,
  lyricsTopic?: string
): string[] {
  const trimmedTopic = lyricsTopic?.trim();
  
  const parts = [header, description];
  
  if (trimmedTopic) {
    parts.push('', `LYRICS TOPIC (use this topic for lyrics content, NOT the musical style above):`, trimmedTopic);
  }
  
  return parts;
}

export function buildSystemPrompt(
  maxChars: number,
  useSunoTags: boolean,
  preFormattedOutput?: PreFormattedStandardOutput
): string {
  // When pre-formatted output is provided, LLM only generates section content
  if (preFormattedOutput) {
    return `You are a creative music prompt writer for Suno V5. You are enhancing a pre-formatted prompt.

PRE-FORMATTED OUTPUT (these fields are ALREADY SET - do NOT modify):
- Genre: "${preFormattedOutput.genre}"
- BPM: "${preFormattedOutput.bpm}"
- Mood: "${preFormattedOutput.mood}"
- Instruments: "${preFormattedOutput.instruments}"

YOUR TASK: Generate evocative section descriptions using the pre-set context.

OUTPUT FORMAT - Return valid JSON:
{
  "intro": "<sparse instrumentation setting the scene>",
  "verse": "<weave instruments into narrative with emotion>",
  "chorus": "<peak energy, full arrangement, story climax>",
  "bridge": "<contrasting texture, optional>",
  "outro": "<resolution and fade>"
}

RULES:
- Use the pre-set genre, mood, and instruments as your creative foundation
- Write sections as natural flowing phrases, not word lists
- Reflect the chord progression feel and production style in section descriptions
- Output ONLY the JSON object - no explanations

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters

${JSON_OUTPUT_FORMAT_RULES}`;
  }

  const songStructure = useSunoTags ? `
OUTPUT FORMAT (follow this structure exactly):

Line 1 (MANDATORY): [Mood, Genre/Style, Key: key/mode]

Genre: <specific genre name>
BPM: <tempo RANGE from guidance, e.g., "between 80 and 160">
Mood: <use the mood suggestions from detected context>
Instruments: <2-4 items from suggested list with character adjectives>

[INTRO] <sparse instrumentation setting the scene>
[VERSE] <weave instruments into narrative with emotion>
[CHORUS] <peak energy, full arrangement, story climax>
[BRIDGE] <contrasting texture, optional>
[OUTRO] <resolution and fade>

RULES:
1. Line 1 bracket tag is MANDATORY - never omit it
2. Write sections as natural flowing phrases, not word lists
3. Only use instruments from SUGGESTED INSTRUMENTS in technical guidance
4. Backing vocals in (): wordless (ooh, ahh) or lyric echo (repeat key word from line)
5. Reflect chord progression feel and production style in section descriptions` : '';

  return `You are a creative music prompt writer for Suno V5. Transform user descriptions into evocative, inspiring music prompts.

${CONTEXT_INTEGRATION_INSTRUCTIONS}

CRITICAL RULES:
1. PRESERVE the user's narrative, story, and meaning - this is the soul of the song
2. Use technical guidance as creative COLOR, blending it naturally with the story
3. NEVER repeat words or phrases - each significant word should appear only ONCE
4. Create a cohesive, non-redundant prompt that flows naturally
${songStructure}
STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters.
- Output ONLY the prompt itself - no explanations or extra text.`;
}

// =============================================================================
// Contextual Prompt Helpers
// =============================================================================

type RhythmicInfo = ReturnType<typeof detectRhythmic>;
type PerformanceGuidanceType = NonNullable<ReturnType<typeof buildPerformanceGuidance>>;

/**
 * Early exit check - skips guidance assembly when no mode/genre/rhythm
 * is selected, avoiding unnecessary string building.
 */
function hasAnyGuidance(selection: ModeSelection, rhythmic: RhythmicInfo): boolean {
  return !!(
    selection.genre ||
    selection.combination ||
    selection.singleMode ||
    selection.polyrhythmCombination ||
    selection.timeSignature ||
    selection.timeSignatureJourney ||
    rhythmic
  );
}

/**
 * Build performance guidance section for a genre.
 * Extracts and formats vocal/production/instrument guidance from genre registry.
 * Adds multi-genre blending hints when compound genres are detected.
 */
function buildPerformanceGuidanceSection(
  genre: string,
  performanceGuidance: PerformanceGuidanceType | null | undefined
): string[] {
  const parts: string[] = [];
  const guidance = performanceGuidance ?? buildPerformanceGuidance(genre);
  
  if (guidance) {
    parts.push('', 'PERFORMANCE GUIDANCE:');
    parts.push(`Vocal style: ${guidance.vocal}`);
    parts.push(`Production: ${guidance.production}`);
    if (guidance.instruments.length > 0) {
      parts.push(`Suggested instruments: ${guidance.instruments.join(', ')}`);
    }
  }

  // Add multi-genre nuance guidance for compound genres (2+ components)
  const genreComponents = parseGenreComponents(genre);
  if (genreComponents.length > 1) {
    const nuanceGuidance = getMultiGenreNuanceGuidance(genre, Math.random);
    if (nuanceGuidance) {
      parts.push(nuanceGuidance);
    }
  }

  return parts;
}

/**
 * @internal
 * Used for refinement context - not part of public API
 */
export function buildContextualPrompt(
  description: string,
  selection: ModeSelection,
  lyricsTopic?: string,
  performanceGuidance?: PerformanceGuidanceType | null
): string {
  const rhythmic = detectRhythmic(description);
  const { found: userInstruments } = extractInstruments(description);

  const parts = buildSongConceptParts(
    `USER'S SONG CONCEPT (preserve this narrative and meaning):`,
    description,
    lyricsTopic
  );

  if (!hasAnyGuidance(selection, rhythmic)) {
    return parts.join('\n\n');
  }

  parts.push('', 'TECHNICAL GUIDANCE (use as creative inspiration, blend naturally):');

  const modeGuidance = buildGuidanceFromSelection(selection, { userInstruments });
  if (modeGuidance) parts.push(modeGuidance);

  if (rhythmic) parts.push(getRhythmicGuidance(rhythmic));

  if (selection.genre) {
    parts.push(...buildPerformanceGuidanceSection(selection.genre, performanceGuidance));
  }

  return parts.join('\n\n');
}

// Max Mode system prompt - uses metadata-style formatting for higher quality
export function buildMaxModeSystemPrompt(
  maxChars: number,
  preFormattedOutput?: PreFormattedMaxOutput
): string {
  // When pre-formatted output is provided, LLM only generates styleTags and recording
  if (preFormattedOutput) {
    return `You are a music prompt writer for Suno V5 MAX MODE. You are enhancing a pre-formatted prompt.

PRE-FORMATTED OUTPUT (these fields are ALREADY SET - do NOT modify):
- genre: "${preFormattedOutput.genre}"
- bpm: "${preFormattedOutput.bpm}"
- instruments: "${preFormattedOutput.instruments}"

YOUR TASK: Generate ONLY these two fields:
1. styleTags: Blend the detected mood, production style, and chord feel naturally
2. recording: A session description reflecting the production style and mood

OUTPUT FORMAT - Return valid JSON:
{
  "styleTags": "<mood + production + chord feel blended naturally>",
  "recording": "<session description reflecting production style and mood>"
}

STYLE TAGS GUIDANCE:
- Blend detected mood keywords, chord progression feel, production style, and texture
- Formula: "<mood keywords>, <chord progression feel>, <production style>, <texture descriptors>"
- Example: "smooth, laid back, bossa nova harmony, organic feel, studio reverb, natural dynamics"

RULES:
- Do NOT include genre, bpm, or instruments in your output - they are pre-set
- Focus on creative, evocative style tags and recording descriptions
- Style tags should feel cohesive and natural, not a list
- Output ONLY the JSON object - no explanations

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters

${JSON_OUTPUT_FORMAT_RULES}`;
  }

  return `You are a music prompt writer for Suno V5 MAX MODE. Generate prompts using the specific metadata format that triggers maximum quality output.

OUTPUT FORMAT (follow EXACTLY - this format is critical):

${MAX_MODE_HEADER}

genre: "<exact genre(s) from user input, comma separated>"
bpm: "<tempo RANGE from detected context, e.g., 'between 80 and 160'>"
instruments: "<instruments from suggested list with character adjectives>"
style tags: "<MUST include: mood keywords + production style + chord progression feel + texture>"
recording: "<session description reflecting production style and mood>"

${CONTEXT_INTEGRATION_INSTRUCTIONS}

MAX MODE STYLE TAGS:
- Style tags MUST blend detected mood, production style, chord feel, AND recording texture
- Formula: "<mood keywords>, <chord progression feel>, <production style>, <texture descriptors>"
- Example: "smooth, laid back, bossa nova harmony, organic feel, studio reverb, natural dynamics"

CRITICAL RULES:
1. ALWAYS start with the exact MAX MODE header tags shown above
2. Use metadata-style formatting with quoted values after colons
3. NO section tags like [VERSE] or [CHORUS] - these cause lyric bleed-through in max mode
4. Keep each field on its own line

STRICT CONSTRAINTS:
- Output MUST be under ${maxChars} characters
- Output ONLY the formatted prompt - no explanations
- Every line must follow the format shown above`;
}

/**
 * @internal
 * Used for refinement context - not part of public API
 */
export function buildMaxModeContextualPrompt(
  description: string,
  selection: ModeSelection,
  lyricsTopic?: string,
  performanceGuidance?: NonNullable<ReturnType<typeof buildPerformanceGuidance>> | null
): string {
  const { found: userInstruments } = extractInstruments(description);
  const detectedGenre = selection.genre || DEFAULT_GENRE;

  const parts = buildSongConceptParts(`USER'S SONG CONCEPT:`, description, lyricsTopic);

  parts.push(
    '',
    'DETECTED CONTEXT:',
    `Genre: ${detectedGenre}`,
  );

  // Add enhanced guidance if genre is detected
  if (selection.genre) {
    // Parse components once to check for multi-genre
    const genreComponents = parseGenreComponents(selection.genre);
    const isMultiGenre = genreComponents.length > 1;

    const genreDef = GENRE_REGISTRY[selection.genre];
    const guidance = performanceGuidance ?? buildPerformanceGuidance(selection.genre);
    
    // BPM
    if (genreDef?.bpm) {
      parts.push(`Tempo: ${genreDef.bpm.typical} BPM (range: ${genreDef.bpm.min}-${genreDef.bpm.max})`);
    }
    
    // Moods
    if (genreDef?.moods && genreDef.moods.length > 0) {
      const selectedMoods = [...genreDef.moods].sort(() => Math.random() - 0.5).slice(0, 3);
      parts.push(`Mood suggestions: ${selectedMoods.join(', ')}`);
    }
    
    if (guidance) {
      parts.push(`Vocal style: ${guidance.vocal}`);
      parts.push(`Production: ${guidance.production}`);
    }
    
    // Chord progression
    parts.push(`Chord progression: ${buildProgressionDescriptor(selection.genre)}`);
    
    // Suggested instruments with articulations
    const instruments = selectInstrumentsForGenre(selection.genre, { userInstruments });
    const articulatedInstruments = instruments.map(i => articulateInstrument(i, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE));
    if (articulatedInstruments.length > 0) {
      parts.push('');
      parts.push('Suggested instruments:');
      parts.push(...articulatedInstruments.map(i => `- ${i}`));
    }

    // Add multi-genre nuance guidance for compound genres (2+ components)
    if (isMultiGenre) {
      const nuanceGuidance = getMultiGenreNuanceGuidance(selection.genre, Math.random);
      if (nuanceGuidance) {
        parts.push(nuanceGuidance);
      }
    }
  }

  if (userInstruments.length > 0) {
    parts.push('');
    parts.push(`User mentioned instruments: ${userInstruments.join(', ')}`);
  }

  return parts.join('\n');
}

// Refinement context for refining existing prompts
export type RefinementContext = {
  currentPrompt: string;
  currentTitle: string;
  currentLyrics?: string;
  lyricsTopic?: string;
};

// Combined system prompt for generating style prompt + title in one call
export function buildCombinedSystemPrompt(
  maxChars: number, 
  useSunoTags: boolean, 
  maxMode: boolean,
  refinement?: RefinementContext
): string {
  const basePrompt = maxMode 
    ? buildMaxModeSystemPrompt(maxChars)
    : buildSystemPrompt(maxChars, useSunoTags);
  
  if (refinement) {
    return `${basePrompt}

REFINEMENT MODE:
You are refining an existing music prompt and title based on user feedback.
Apply the feedback to improve BOTH outputs while maintaining consistency between them.

CURRENT STYLE PROMPT:
${refinement.currentPrompt}

CURRENT TITLE:
${refinement.currentTitle}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the refined music prompt>",
  "title": "<the refined song title (1-5 words)>"
}

REFINEMENT RULES:
- Apply user feedback to all relevant parts (prompt, title)
- Maintain consistency between style prompt and title mood/theme
- Keep what works well, improve what the feedback targets
- If feedback only mentions one element, still return both (keep other mostly unchanged)

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
  }
  
  return `${basePrompt}

ADDITIONAL OUTPUT REQUIREMENT:
After generating the music prompt, also create a song title.

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the complete music prompt as described above>",
  "title": "<a short, evocative 1-5 word song title that matches the mood and genre>"
}

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
}

// Combined system prompt for generating style prompt + title + lyrics in one call
export function buildCombinedWithLyricsSystemPrompt(
  maxChars: number, 
  useSunoTags: boolean, 
  maxMode: boolean,
  refinement?: RefinementContext
): string {
  const basePrompt = maxMode 
    ? buildMaxModeSystemPrompt(maxChars)
    : buildSystemPrompt(maxChars, useSunoTags);

  const lyricsFormat = maxMode 
    ? `The lyrics MUST start with: ///*****///
Then section tags on subsequent lines.`
    : '';

  if (refinement) {
    const existingLyrics = refinement.currentLyrics?.trim();
    const lyricsSection = existingLyrics && existingLyrics.length > 0
      ? `CURRENT LYRICS:\n${existingLyrics}`
      : `CURRENT LYRICS: None - generate fresh lyrics based on the refined prompt and title`;
    
    const lyricsTopicSection = refinement.lyricsTopic 
      ? `\nLYRICS TOPIC (use this as the core subject for lyrics, NOT the musical style):\n${refinement.lyricsTopic}`
      : '';
    
    const freshLyricsRequirements = !(existingLyrics && existingLyrics.length > 0) ? `
LYRICS REQUIREMENTS FOR NEW LYRICS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Lyrics should be evocative, poetic, and emotionally resonant
- Match the genre's typical lyrical style` : '';

    const additionalInstructions = [lyricsFormat, freshLyricsRequirements].filter(Boolean).join('\n');

    return `${basePrompt}

REFINEMENT MODE:
You are refining an existing music prompt, title, and lyrics based on user feedback.
Apply the feedback to improve ALL THREE outputs while maintaining consistency between them.

CURRENT STYLE PROMPT:
${refinement.currentPrompt}

CURRENT TITLE:
${refinement.currentTitle}

${lyricsSection}${lyricsTopicSection}

${additionalInstructions}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the refined music prompt>",
  "title": "<the refined song title (1-5 words)>",
  "lyrics": "<the refined or newly generated lyrics with section tags>"
}

REFINEMENT RULES:
- Apply user feedback to all relevant parts (prompt, title, lyrics)
- Maintain consistency between style prompt and lyrics mood/theme
- Keep what works well, improve what the feedback targets
- If feedback only mentions one element, still return all three (keep others mostly unchanged)
- If no existing lyrics, generate fresh lyrics that match the refined prompt and title

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
  }
  
  return `${basePrompt}

ADDITIONAL OUTPUT REQUIREMENT:
After generating the music prompt, also create a song title and complete lyrics.

${lyricsFormat}

OUTPUT FORMAT - Return valid JSON:
{
  "prompt": "<the complete music prompt as described above>",
  "title": "<a short, evocative 1-5 word song title that matches the mood and genre>",
  "lyrics": "<complete song lyrics with section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]>"
}

LYRICS REQUIREMENTS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Lyrics should be evocative, poetic, and emotionally resonant
- Match the genre's typical lyrical style

IMPORTANT: Output ONLY the JSON object, no markdown code blocks or explanations.`;
}
