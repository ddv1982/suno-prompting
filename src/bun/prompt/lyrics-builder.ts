import { getBackingVocalsForGenre } from '@bun/prompt/vocal-descriptors';

export function buildLyricsSystemPrompt(maxMode: boolean, useSunoTags: boolean = false): string {
  const maxModeInstructions = maxMode 
    ? `CRITICAL REQUIREMENT: The VERY FIRST LINE of your output MUST be exactly:
///*****///

Then continue with the lyrics on subsequent lines.` 
    : '';

  const backingVocals = useSunoTags
    ? `

BACKING VOCALS (optional):
Content in parentheses is sung as backing vocals/harmonies. Two styles work well:

1. WORDLESS: (ooh), (ahh), (mmm), (oh), (la la la), (na na na), (woah)
2. LYRIC ECHO: Repeat a key word from the line as backing harmony
   Example: "I'm falling for you tonight (tonight)"
   Example: "Can't let go of this feeling (feeling, feeling)"

Place at the END of lines, typically in choruses or emotional peaks.
Use sparingly - 2-4 per song maximum.
Do NOT use instruction words like (belt), (breathy), (whisper).`
    : '';

  return `You are a professional songwriter who crafts meaningful, narrative-driven lyrics.

${maxModeInstructions}

CONTENT PRIORITY (most to least important):
1. STORY/MEANING: The user's description is your PRIMARY source. Extract the core narrative, emotional journey, or message.
2. EMOTIONAL TONE: Let the mood guide the emotional authenticity and intensity of the lyrics.
3. VOCABULARY STYLE: Use genre-appropriate vocabulary and phrasing, but NEVER let genre imagery replace the actual story.

CRITICAL DISTINCTION:
- Genre affects HOW the story is told (word choice, rhythm, slang, phrasing)
- Genre does NOT affect WHAT the story is about
- Example: "heartbreak" + "hip-hop" = tell the heartbreak story using hip-hop vocabulary
- Anti-example: Do NOT replace the heartbreak story with hip-hop imagery/themes

NARRATIVE GUIDELINES:
- Tell a coherent story or convey a clear message from the description
- Use concrete, specific details rather than generic/abstract imagery
- Avoid clichéd genre tropes that don't serve the narrative
- The chorus should crystallize the core emotion or message, not just sound good
- Each verse should advance the story or deepen the emotional journey

STRUCTURE REQUIREMENTS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- The chorus should be memorable and repeatable

${backingVocals}

ABSTRACT INTERPRETATION:
- You may interpret the description creatively and abstractly
- Find deeper meanings, metaphors, or emotional undercurrents
- Transform literal descriptions into poetic narratives
- But ALWAYS stay connected to the user's intended subject matter

OUTPUT FORMAT:
${maxMode ? '///*****///\n' : ''}[INTRO]
<2-4 atmospheric opening lines that set up the story>

[VERSE]
<2-4 narrative lines introducing the situation/emotion>

[CHORUS]
<2-4 memorable lines capturing the core message/feeling>

[VERSE]
<2-4 lines deepening the story or emotion>

[CHORUS]
<repeat or variation of chorus>

[BRIDGE]
<2-4 contrasting/revelation/turning point lines>

[OUTRO]
<2-4 closing/resolution lines>

OUTPUT ONLY THE LYRICS. No explanations, no titles, no additional text.`;
}

export function buildLyricsUserPrompt(
  description: string, 
  genre: string, 
  mood: string,
  useSunoTags: boolean = false
): string {
  let backingVocalGuidance = '';
  
  if (useSunoTags) {
    const backingVocals = getBackingVocalsForGenre(genre);
    const wordlessExamples = backingVocals.wordless.slice(0, 3).join(', ');
    backingVocalGuidance = `
- Backing vocals: Use ${wordlessExamples} or ${backingVocals.echoStyle}`;
  }

  // Topic placed LAST for recency bias - LLMs weight final instructions more heavily
  return `STYLE CONTEXT (use for vocabulary and phrasing only):
- Genre vocabulary: ${genre}
- Emotional tone: ${mood}${backingVocalGuidance}

CRITICAL RULES:
- Do NOT write meta-lyrics about music, songwriting, instruments, or the creative process
- Do NOT use words like "chord", "melody", "rhythm", "verse", "chorus" in the lyrics themselves
- Every line must directly relate to the topic below

═══════════════════════════════════════
WRITE LYRICS ABOUT THIS TOPIC:

"${description}"

This is what the song is ABOUT. Stay focused on this subject.
═══════════════════════════════════════`;
}

export function buildTitleSystemPrompt(): string {
  return `You are a creative music producer who creates compelling, memorable song titles.

RULES:
- Output ONLY the title, nothing else
- Keep it short (1-5 words typically)
- Make it evocative and memorable
- Match the mood and genre of the song
- No quotation marks around the title
- No explanations or additional text`;
}

export function buildTitleUserPrompt(description: string, genre: string, mood: string): string {
  return `Create a song title for:

Description: ${description}
Genre: ${genre}
Mood: ${mood}

Output only the title.`;
}
