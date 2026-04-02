import { createLogger } from '@shared/logger';
import { getErrorMessage } from '@shared/errors';

import { generateTitle } from './content-generator';

import type { TraceCollector } from '@bun/trace';
import type { LanguageModel } from 'ai';

const log = createLogger('LLMUtils');

function inferMoodFromStyles(styles: string[]): string {
  const stylesLower = styles.map((s) => s.toLowerCase()).join(' ');

  if (/(dark|heavy|intense|aggressive|brutal|chaotic|doom)/i.test(stylesLower)) {
    return 'dark';
  }
  if (/(upbeat|energetic|fast|driving|vibrant|electric)/i.test(stylesLower)) {
    return 'energetic';
  }
  if (/(calm|peaceful|ambient|ethereal|atmospheric|gentle|soft)/i.test(stylesLower)) {
    return 'calm';
  }
  if (/(romantic|love|sweet|tender|intimate)/i.test(stylesLower)) {
    return 'romantic';
  }
  if (/(melanchol|sad|emotional|nostalgic|wistful)/i.test(stylesLower)) {
    return 'melancholic';
  }
  if (/(dreamy|psychedelic|surreal|hypnotic|spacey)/i.test(stylesLower)) {
    return 'dreamy';
  }

  return 'creative';
}

export async function generateDirectModeTitle(
  description: string,
  styles: string[],
  getModel: () => LanguageModel,
  ollamaEndpoint?: string,
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string }
): Promise<string> {
  try {
    const cleanDescription = description.trim();
    const styleText = styles.join(', ');
    const mood = inferMoodFromStyles(styles);
    const titleDescription = cleanDescription
      ? `${cleanDescription}\n\nSuno V5 styles: ${styleText}`
      : `Song with Suno V5 styles: ${styleText}`;
    const genre = styles[0] || 'music';

    log.info('generateDirectModeTitle', {
      stylesCount: styles.length,
      inferredMood: mood,
      hasDescription: !!cleanDescription,
      offline: !!ollamaEndpoint,
    });

    const result = await generateTitle({
      description: titleDescription,
      genre,
      mood,
      getModel,
      ollamaEndpoint,
      trace: traceRuntime?.trace,
      traceLabel: traceRuntime?.traceLabel,
    });
    return result.title;
  } catch (error: unknown) {
    log.warn('generateDirectModeTitle:failed', {
      error: getErrorMessage(error),
    });
    return 'Untitled';
  }
}
