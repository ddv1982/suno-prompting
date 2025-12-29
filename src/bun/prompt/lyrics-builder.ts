export function buildLyricsSystemPrompt(maxMode: boolean): string {
  const maxModeInstructions = maxMode 
    ? `CRITICAL REQUIREMENT: The VERY FIRST LINE of your output MUST be exactly:
///*****///

Then continue with the lyrics on subsequent lines.` 
    : '';

  return `You are a professional songwriter who writes evocative, poetic lyrics that match the mood and genre of the music.

${maxModeInstructions}

STRUCTURE REQUIREMENTS:
- Use section tags: [INTRO], [VERSE], [CHORUS], [BRIDGE], [OUTRO]
- Each section should have 2-4 lines
- Include at least: 1 intro, 2 verses, 2 choruses, 1 bridge, 1 outro
- Lyrics should be evocative, poetic, and emotionally resonant
- Match the genre's typical lyrical style and vocabulary
- The chorus should be memorable and repeatable

OUTPUT FORMAT:
${maxMode ? '///*****///\n' : ''}[INTRO]
<2-4 atmospheric opening lines>

[VERSE]
<2-4 narrative/emotional lines>

[CHORUS]
<2-4 memorable, singable lines>

[VERSE]
<2-4 continuing narrative lines>

[CHORUS]
<repeat or variation of chorus>

[BRIDGE]
<2-4 contrasting/transitional lines>

[OUTRO]
<2-4 closing/resolution lines>

OUTPUT ONLY THE LYRICS. No explanations, no titles, no additional text.`;
}

export function buildLyricsUserPrompt(description: string, genre: string, mood: string): string {
  return `Write lyrics for a song with these characteristics:

Description: ${description}
Genre: ${genre}
Mood: ${mood}

Create complete song lyrics that capture this essence. The lyrics should feel authentic to the genre and emotionally match the mood.`;
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

export function formatFullOutput(
  title: string | undefined,
  style: string,
  lyrics: string | undefined
): string {
  const parts: string[] = [];

  if (title) {
    parts.push(`=== TITLE ===\n${title.trim()}`);
  }

  parts.push(`=== STYLE ===\n${style.trim()}`);

  if (lyrics) {
    parts.push(`=== LYRICS ===\n${lyrics.trim()}`);
  }

  return parts.join('\n\n');
}

export function parseFullOutput(fullOutput: string): {
  title?: string;
  style?: string;
  lyrics?: string;
} {
  const result: { title?: string; style?: string; lyrics?: string } = {};

  const titleMatch = fullOutput.match(/=== TITLE ===\n([\s\S]*?)(?=\n=== |$)/);
  if (titleMatch) {
    result.title = titleMatch[1]?.trim();
  }

  const styleMatch = fullOutput.match(/=== STYLE ===\n([\s\S]*?)(?=\n=== |$)/);
  if (styleMatch) {
    result.style = styleMatch[1]?.trim();
  }

  const lyricsMatch = fullOutput.match(/=== LYRICS ===\n([\s\S]*?)$/);
  if (lyricsMatch) {
    result.lyrics = lyricsMatch[1]?.trim();
  }

  return result;
}

export function isLyricsModeOutput(text: string): boolean {
  return text.includes('=== STYLE ===') && text.includes('=== LYRICS ===');
}

export function extractStyleSection(text: string): string {
  if (!isLyricsModeOutput(text)) {
    return text;
  }
  const parsed = parseFullOutput(text);
  return parsed.style || text;
}

export function rebuildLyricsModeOutput(
  originalOutput: string,
  newStyle: string
): string {
  const parsed = parseFullOutput(originalOutput);
  return formatFullOutput(parsed.title, newStyle, parsed.lyrics);
}
