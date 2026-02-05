/**
 * Shared prompt instructions and constants used across all prompt builders.
 *
 * This file centralizes common instructions to prevent drift between different
 * generation modes (Full Prompt, Quick Vibes, Creative Boost).
 *
 * @module prompt/shared-instructions
 */

/**
 * Shared context integration instructions for all prompt modes.
 * Ensures LLM utilizes all detected context consistently across all builders.
 */
export const CONTEXT_INTEGRATION_INSTRUCTIONS = `CONTEXT INTEGRATION (use ALL detected context):
- BPM: Use the tempo RANGE provided (e.g., "between 80 and 160"), not just a single number
- Mood: Include mood suggestions directly (e.g., "smooth, groovy, laid back")
- Production: Include production style descriptors (e.g., "organic feel, studio reverb")
- Chord progression: Include harmony feel (e.g., "bossa nova harmony, ii-V-I movement")
- Vocal style: Weave vocal descriptors naturally into the output`;

/**
 * Standard output format instructions for JSON responses.
 * Used by all LLM-based generation modes.
 */
export const JSON_OUTPUT_FORMAT_RULES = `OUTPUT FORMAT RULES:
1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. Do NOT wrap the JSON in \`\`\`json or any other markers
3. The response must be parseable by JSON.parse()
4. Include all required fields in the schema`;
