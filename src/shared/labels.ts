// Concise labels for music theory elements - optimized for Suno prompt brevity

export const HARMONIC_LABELS: Record<string, string> = {
  // Lydian modes
  lydian: 'Lydian #11',
  lydian_dominant: 'Lydian b7',
  lydian_augmented: 'Lydian #5',
  lydian_sharp_two: 'Lydian #2',
  // Major modes
  ionian: 'Major',
  mixolydian: 'Mixolydian b7',
  // Minor modes
  dorian: 'Dorian',
  aeolian: 'Natural Minor',
  harmonic_minor: 'Harmonic Minor',
  melodic_minor: 'Melodic Minor',
  phrygian: 'Phrygian',
  locrian: 'Locrian',
};

export const COMBINATION_LABELS: Record<string, string> = {
  // Cross-mode combinations
  major_minor: 'Major↔Minor bittersweet',
  lydian_minor: 'Lydian→Minor dreamdark',
  lydian_major: 'Lydian→Major floating',
  dorian_lydian: 'Dorian↔Lydian fusion',
  harmonic_major: 'HarmMinor→Major triumph',
  phrygian_major: 'Phrygian→Major Spanish',
  // Within-mode combinations
  minor_journey: 'Minor journey (Nat→Harm→Mel)',
  lydian_exploration: 'Lydian exploration (Pure→Dom→Aug)',
  major_modes: 'Major spectrum (Lyd→Ion→Mix)',
  dark_modes: 'Dark descent (Aeol→Phryg→Loc)',
};

export const POLYRHYTHM_LABELS: Record<string, string> = {
  // Single polyrhythms
  hemiola: '2:3 swing',
  reverse_hemiola: '3:2 triplet',
  afrobeat: '4:3 Afrobeat',
  limping: '3:4 limping',
  shifting: '5:4 shifting',
  african_compound: '6:8 African',
  evolving: '7:4 evolving',
  // Combinations
  groove_to_drive: '2:3→4:3 groove→drive',
  tension_release: '4:3→2:3 tension→release',
  afrobeat_journey: '2:3→6:8 Afro journey',
  complex_simple: '5:4→2:3 complex→simple',
  complexity_build: '2:3→4:3→5:4 build',
  triplet_exploration: '2:3→3:4→3:2 triplet',
  odd_journey: '3:4→5:4→7:4 odd',
  tension_arc: '4:3→5:4→2:3 arc',
};

export const TIME_SIGNATURE_LABELS: Record<string, string> = {
  time_4_4: '4/4',
  time_3_4: '3/4 waltz',
  time_6_8: '6/8 compound',
  time_5_4: '5/4 (3+2)',
  time_5_8: '5/8 quick',
  time_7_8: '7/8 (2+2+3)',
  time_7_4: '7/4 expansive',
  time_9_8: '9/8 slip jig',
  time_11_8: '11/8 complex',
  time_13_8: '13/8 extreme',
  time_15_8: '15/8 extended',
};

export const TIME_JOURNEY_LABELS: Record<string, string> = {
  prog_odyssey: '4/4→7/8→5/4 prog',
  balkan_fusion: '7/8→9/8→11/8 Balkan',
  jazz_exploration: '4/4→5/4→9/8 jazz',
  math_rock_descent: '5/4→7/8→11/8 math',
  celtic_journey: '6/8→9/8→3/4 Celtic',
  metal_complexity: '4/4→7/4→13/8 metal',
  gentle_odd: '3/4→5/4→6/8 gentle',
};

// Genre labels for music phrase output
export const GENRE_LABELS: Record<string, string> = {
  ambient: 'Ambient',
  jazz: 'Jazz',
  electronic: 'Electronic',
  rock: 'Rock',
  pop: 'Pop',
  classical: 'Classical',
  lofi: 'Lo-Fi',
  synthwave: 'Synthwave',
  cinematic: 'Cinematic',
  folk: 'Folk',
  rnb: 'R&B',
  videogame: 'Videogame',
  country: 'Country',
  soul: 'Soul',
  blues: 'Blues',
  punk: 'Punk',
  latin: 'Latin',
  metal: 'Metal',
  trap: 'Trap',
  retro: 'Retro',
  symphonic: 'Symphonic',
  disco: 'Disco',
  funk: 'Funk',
  reggae: 'Reggae',
  afrobeat: 'Afrobeat',
  house: 'House',
  trance: 'Trance',
  downtempo: 'Downtempo',
  dreampop: 'Dream Pop',
  chillwave: 'Chillwave',
  newage: 'New Age',
  hyperpop: 'Hyperpop',
  drill: 'Drill',
  melodictechno: 'Melodic Techno',
  indie: 'Indie',
};

// Genre display names for UI dropdowns
export const GENRE_DISPLAY_NAMES: Record<string, string> = {
  ambient: 'Ambient',
  jazz: 'Jazz',
  electronic: 'Electronic',
  rock: 'Rock',
  pop: 'Pop',
  classical: 'Classical',
  lofi: 'Lo-Fi',
  synthwave: 'Synthwave',
  cinematic: 'Cinematic',
  folk: 'Folk',
  rnb: 'R&B',
  videogame: 'Videogame',
  country: 'Country',
  soul: 'Soul',
  blues: 'Blues',
  punk: 'Punk',
  latin: 'Latin',
  metal: 'Metal',
  trap: 'Trap',
  retro: 'Retro',
  symphonic: 'Symphonic',
  disco: 'Disco',
  funk: 'Funk',
  reggae: 'Reggae',
  afrobeat: 'Afrobeat',
  house: 'House',
  trance: 'Trance',
  downtempo: 'Downtempo',
  dreampop: 'Dream Pop',
  chillwave: 'Chillwave',
  newage: 'New Age',
  hyperpop: 'Hyperpop',
  drill: 'Drill',
  melodictechno: 'Melodic Techno',
  indie: 'Indie',
};

// Genre combination display names (as-is, already readable)
export const GENRE_COMBINATION_DISPLAY_NAMES: Record<string, string> = {
  'jazz fusion': 'Jazz Fusion',
  'jazz funk': 'Jazz Funk',
  'jazz hip-hop': 'Jazz Hip-Hop',
  'nu jazz': 'Nu Jazz',
  'acid jazz': 'Acid Jazz',
  'electronic rock': 'Electronic Rock',
  'electro pop': 'Electro Pop',
  'synth pop': 'Synth Pop',
  'future bass': 'Future Bass',
  'chillwave': 'Chillwave',
  'vaporwave': 'Vaporwave',
  'folk rock': 'Folk Rock',
  'folk pop': 'Folk Pop',
  'indie folk': 'Indie Folk',
  'chamber folk': 'Chamber Folk',
  'blues rock': 'Blues Rock',
  'southern rock': 'Southern Rock',
  'progressive rock': 'Progressive Rock',
  'psychedelic rock': 'Psychedelic Rock',
  'art rock': 'Art Rock',
  'indie rock': 'Indie Rock',
  'alternative rock': 'Alternative Rock',
  'neo soul': 'Neo Soul',
  'psychedelic soul': 'Psychedelic Soul',
  'funk soul': 'Funk Soul',
  'latin jazz': 'Latin Jazz',
  'bossa nova': 'Bossa Nova',
  'afrobeat': 'Afrobeat',
  'reggae fusion': 'Reggae Fusion',
  'progressive metal': 'Progressive Metal',
  'symphonic metal': 'Symphonic Metal',
  'doom metal': 'Doom Metal',
  'trip hop': 'Trip Hop',
  'lo-fi hip hop': 'Lo-Fi Hip Hop',
  'dark ambient': 'Dark Ambient',
  'space ambient': 'Space Ambient',
  'drone ambient': 'Drone Ambient',
  'disco funk': 'Disco Funk',
  'nu-disco': 'Nu-Disco',
  'disco house': 'Disco House',
  'deep house': 'Deep House',
  'tech house': 'Tech House',
  'afro house': 'Afro House',
  'melodic house': 'Melodic House',
  'dub techno': 'Dub Techno',
  'roots reggae': 'Roots Reggae',
  'dream pop shoegaze': 'Dream Pop Shoegaze',
  'chillhop': 'Chillhop',
  'downtempo electronica': 'Downtempo Electronica',
  'lo-fi chill': 'Lo-Fi Chill',
  'uk drill': 'UK Drill',
  'hyperpop trap': 'Hyperpop Trap',
  'drill rap': 'Drill Rap',
};

export type LabelCategory = 'harmonic' | 'combination' | 'polyrhythm' | 'time' | 'journey' | 'genre' | 'genreCombination';

export function getConciseLabel(category: LabelCategory, key: string): string {
  switch (category) {
    case 'harmonic':
      return HARMONIC_LABELS[key] ?? key;
    case 'combination':
      return COMBINATION_LABELS[key] ?? key;
    case 'polyrhythm':
      return POLYRHYTHM_LABELS[key] ?? key;
    case 'time':
      return TIME_SIGNATURE_LABELS[key] ?? key;
    case 'journey':
      return TIME_JOURNEY_LABELS[key] ?? key;
    case 'genre':
      return GENRE_LABELS[key] ?? key;
    case 'genreCombination':
      return GENRE_COMBINATION_DISPLAY_NAMES[key] ?? key;
    default:
      return key;
  }
}

// Display names for UI dropdowns (more readable than concise labels)
export const HARMONIC_DISPLAY_NAMES: Record<string, string> = {
  lydian: 'Lydian (dreamy, floating)',
  lydian_dominant: 'Lydian Dominant (funky, playful)',
  lydian_augmented: 'Lydian Augmented (alien, otherworldly)',
  lydian_sharp_two: 'Lydian #2 (enchanted, exotic)',
  ionian: 'Ionian / Major (happy, bright)',
  mixolydian: 'Mixolydian (bluesy, rock)',
  dorian: 'Dorian (jazzy, soulful)',
  aeolian: 'Aeolian / Natural Minor (sad, melancholic)',
  harmonic_minor: 'Harmonic Minor (gothic, dramatic)',
  melodic_minor: 'Melodic Minor (jazz, noir)',
  phrygian: 'Phrygian (Spanish, exotic)',
  locrian: 'Locrian (horror, unstable)',
};

export const COMBINATION_DISPLAY_NAMES: Record<string, string> = {
  major_minor: 'Major-Minor (bittersweet)',
  lydian_minor: 'Lydian-Minor (dream→dark)',
  lydian_major: 'Lydian-Major (floating→resolved)',
  dorian_lydian: 'Dorian-Lydian (jazz fusion)',
  harmonic_major: 'Harmonic Minor→Major (triumph)',
  phrygian_major: 'Phrygian-Major (Spanish triumph)',
  minor_journey: 'Minor Journey (sad→drama→resolve)',
  lydian_exploration: 'Lydian Exploration (all Lydian colors)',
  major_modes: 'Major Spectrum (wonder→joy→groove)',
  dark_modes: 'Dark Descent (melancholy→dread)',
};

export const POLYRHYTHM_DISPLAY_NAMES: Record<string, string> = {
  hemiola: 'Hemiola 2:3 (swing, shuffle)',
  reverse_hemiola: 'Reverse Hemiola 3:2 (triplet flow)',
  afrobeat: 'Afrobeat 4:3 (hypnotic drive)',
  limping: 'Limping 3:4 (tension, uneven)',
  shifting: 'Shifting 5:4 (complex, math rock)',
  african_compound: 'African 6:8 (interlocking)',
  evolving: 'Evolving 7:4 (never settling)',
  groove_to_drive: 'Groove→Drive (build energy)',
  tension_release: 'Tension→Release (satisfying drop)',
  afrobeat_journey: 'Afrobeat Journey (world fusion)',
  complex_simple: 'Complex→Simple (prog resolution)',
  complexity_build: 'Complexity Build (escalating)',
  triplet_exploration: 'Triplet Exploration (jazz fusion)',
  odd_journey: 'Odd Journey (prog/math rock)',
  tension_arc: 'Full Tension Arc (drive→chaos→resolve)',
};

export const TIME_SIGNATURE_DISPLAY_NAMES: Record<string, string> = {
  time_4_4: '4/4 Common Time',
  time_3_4: '3/4 Waltz',
  time_6_8: '6/8 Compound (rolling)',
  time_5_4: '5/4 Take Five',
  time_5_8: '5/8 Quick Balkan',
  time_7_8: '7/8 Limping (Money)',
  time_7_4: '7/4 Expansive',
  time_9_8: '9/8 Slip Jig',
  time_11_8: '11/8 Tool Time',
  time_13_8: '13/8 King Crimson',
  time_15_8: '15/8 Extended',
};

export const TIME_JOURNEY_DISPLAY_NAMES: Record<string, string> = {
  prog_odyssey: 'Prog Odyssey (4/4→7/8→5/4)',
  balkan_fusion: 'Balkan Fusion (7/8→9/8→11/8)',
  jazz_exploration: 'Jazz Exploration (4/4→5/4→9/8)',
  math_rock_descent: 'Math Rock Descent (5/4→7/8→11/8)',
  celtic_journey: 'Celtic Journey (6/8→9/8→3/4)',
  metal_complexity: 'Metal Complexity (4/4→7/4→13/8)',
  gentle_odd: 'Gentle Odd (3/4→5/4→6/8)',
};
