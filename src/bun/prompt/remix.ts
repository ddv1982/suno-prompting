import { createLogger } from '@bun/logger';

const log = createLogger('Remix');

export function replaceFieldLine(prompt: string, field: 'Genre' | 'Mood' | 'Instruments' | 'BPM', value: string): string {
  // Try max mode format first (lowercase with quotes): genre: "value"
  const maxModeRegex = new RegExp(`^${field.toLowerCase()}:\\s*"[^"]*"`, 'mi');
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `${field.toLowerCase()}: "${value}"`);
  }
  
  // Try regular mode format (capitalized without quotes): Genre: value
  const regularRegex = new RegExp(`^${field}:.*$`, 'm');
  if (regularRegex.test(prompt)) {
    return prompt.replace(regularRegex, `${field}: ${value}`);
  }
  
  log.warn('replaceFieldLine:field_not_found', { field });
  return prompt;
}

export function replaceStyleTagsLine(prompt: string, value: string): string {
  // Try max mode format (lowercase): style tags: "value"
  const maxModeRegex = /^style tags:.*$/mi;
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `style tags: "${value}"`);
  }
  
  // Try standard mode format (capitalized): Style Tags: value
  const standardRegex = /^Style Tags:.*$/m;
  if (standardRegex.test(prompt)) {
    return prompt.replace(standardRegex, `Style Tags: ${value}`);
  }
  
  log.warn('replaceStyleTagsLine:field_not_found');
  return prompt;
}

export function replaceRecordingLine(prompt: string, value: string): string {
  // Try max mode format (lowercase): recording: "value"
  const maxModeRegex = /^recording:.*$/mi;
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `recording: "${value}"`);
  }
  
  // Try standard mode format (capitalized): Recording: value
  const standardRegex = /^Recording:.*$/m;
  if (standardRegex.test(prompt)) {
    return prompt.replace(standardRegex, `Recording: ${value}`);
  }
  
  log.warn('replaceRecordingLine:field_not_found');
  return prompt;
}
