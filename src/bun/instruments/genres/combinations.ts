export const MULTI_GENRE_COMBINATIONS = [
  // Jazz blends
  'jazz fusion', 'jazz funk', 'jazz hip-hop', 'nu jazz', 'acid jazz', 'smooth jazz', 'jazz swing', 'electro swing',
  // Electronic blends
  'electronic rock', 'electro pop', 'synth pop', 'future bass', 'chillwave', 'vaporwave',
  // Electronic dance blends
  'bass house', 'future house', 'tropical house', 'minimal techno', 'hard techno', 'psy trance', 'vocal trance', 'liquid drum and bass', 'neurofunk', 'jersey club',
  // Folk blends
  'folk rock', 'folk pop', 'indie folk', 'chamber folk', 'bluegrass',
  // Rock blends
  'blues rock', 'southern rock', 'progressive rock', 'psychedelic rock', 'art rock', 'indie rock', 'alternative rock',
  'post-rock', 'shoegaze', 'grunge', 'stoner rock', 'post-punk', 'goth rock', 'industrial rock',
  // Ambient rock/metal blends
  'ambient rock', 'ambient metal', 'ambient symphonic rock', 'ambient symphonic metal',
  // Soul/R&B blends
  'neo soul', 'psychedelic soul', 'funk soul', 'country soul',
  // World/Latin blends
  'latin jazz', 'bossa nova', 'afrobeat', 'reggae fusion', 'reggaeton', 'dancehall', 'amapiano',
  // Country blends
  'country rock', 'country pop',
  // Metal blends
  'progressive metal', 'symphonic metal', 'symphonic rock', 'doom metal',
  'thrash metal', 'death metal', 'black metal', 'power metal', 'metalcore', 'post-metal',
  // Hip-hop blends
  'trip hop', 'lo-fi hip hop', 'g-funk', 'boom bap', 'conscious hip-hop', 'phonk',
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
