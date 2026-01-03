export const MULTI_GENRE_COMBINATIONS = [
  // Fusion styles
  'jazz fusion', 'jazz funk', 'jazz hip-hop', 'nu jazz', 'acid jazz',
  // Electronic blends
  'electronic rock', 'electro pop', 'synth pop', 'future bass', 'chillwave', 'vaporwave',
  // Folk blends
  'folk rock', 'folk pop', 'indie folk', 'chamber folk',
  // Rock blends
  'blues rock', 'southern rock', 'progressive rock', 'psychedelic rock', 'art rock', 'indie rock', 'alternative rock',
  // Soul/R&B blends
  'neo soul', 'psychedelic soul', 'funk soul',
  // World/Latin blends
  'latin jazz', 'bossa nova', 'afrobeat', 'reggae fusion',
  // Metal blends
  'progressive metal', 'symphonic metal', 'symphonic rock', 'doom metal',
  // Hip-hop blends
  'trip hop', 'lo-fi hip hop',
  // Ambient blends
  'dark ambient', 'space ambient', 'drone ambient',
  // Disco/Funk blends
  'disco funk', 'nu-disco', 'disco house',
  // House/Techno blends
  'deep house', 'tech house', 'afro house', 'melodic house',
  // Reggae/Dub blends
  'dub techno', 'roots reggae',
  // Dream/Chill blends
  'dream pop shoegaze', 'chillhop', 'downtempo electronica', 'lo-fi chill',
  // Drill/Hyperpop blends
  'uk drill', 'hyperpop trap', 'drill rap',
] as const;

export type MultiGenreCombination = typeof MULTI_GENRE_COMBINATIONS[number];

export function isMultiGenre(genre: string): boolean {
  const words = genre.toLowerCase().trim().split(/\s+/);
  return words.length >= 2;
}
