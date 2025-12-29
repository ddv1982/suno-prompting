import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';

export function getRandomBpmForGenre(genre: string): number | null {
  // Handle multi-genre: "jazz fusion" → "jazz", "jazz, rock" → "jazz"
  const firstGenre = genre.split(',')[0]?.trim().toLowerCase() || '';
  const baseGenre = firstGenre.split(' ')[0] || firstGenre;
  
  const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
  if (!genreDef?.bpm) return null;
  
  const { min, max } = genreDef.bpm;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function injectBpm(prompt: string, genre: string): string {
  const bpm = getRandomBpmForGenre(genre);
  if (!bpm) return prompt;
  
  // Replace BPM line in max mode format: bpm: "value"
  const maxModeRegex = /^bpm:\s*"[^"]*"/mi;
  if (maxModeRegex.test(prompt)) {
    return prompt.replace(maxModeRegex, `bpm: "${bpm}"`);
  }
  
  // Replace BPM line in normal mode format: BPM: value
  const normalRegex = /^BPM:.*$/m;
  if (normalRegex.test(prompt)) {
    return prompt.replace(normalRegex, `BPM: ${bpm}`);
  }
  
  return prompt;
}
