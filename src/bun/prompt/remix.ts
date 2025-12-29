export function replaceFieldLine(prompt: string, field: 'Genre' | 'Mood' | 'Instruments', value: string): string {
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
  
  return prompt;
}

export function replaceStyleTagsLine(prompt: string, value: string): string {
  const regex = /^style tags:.*$/mi;
  if (!regex.test(prompt)) return prompt;
  return prompt.replace(regex, `style tags: "${value}"`);
}

export function replaceRecordingLine(prompt: string, value: string): string {
  const regex = /^recording:.*$/mi;
  if (!regex.test(prompt)) return prompt;
  return prompt.replace(regex, `recording: "${value}"`);
}
