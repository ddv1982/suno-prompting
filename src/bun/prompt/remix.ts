export function replaceFieldLine(prompt: string, field: 'Genre' | 'Mood' | 'Instruments', value: string): string {
  const regex = new RegExp(`^${field}:.*$`, 'm');
  if (!regex.test(prompt)) return prompt;
  return prompt.replace(regex, `${field}: ${value}`);
}
