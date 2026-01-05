// Vocal descriptors based on professional prompt patterns
// These add specificity to vocal character in prompts

export const VOCAL_RANGES = {
  male: ['Tenor', 'Baritone', 'Bass'] as const,
  female: ['Soprano', 'Mezzo Soprano', 'Alto'] as const,
  neutral: ['Tenor', 'Alto', 'Baritone', 'Mezzo Soprano'] as const,
};

export type VocalRange = 
  | typeof VOCAL_RANGES.male[number]
  | typeof VOCAL_RANGES.female[number];

export const VOCAL_DELIVERIES = [
  'Belting',
  'Intimate',
  'Breathy',
  'Raspy',
  'Smooth',
  'Powerful',
  'Falsetto',
  'Crooner Style',
  'Melismatic',
  'Storytelling',
  'Soft Confident',
  'Emotional',
  'Soulful',
  'Gentle',
  'Urgent',
  'Laid Back',
  'Close Mic',
  'Airy',
  'Warm',
  'Theatrical',
] as const;

export type VocalDelivery = typeof VOCAL_DELIVERIES[number];

export const VOCAL_TECHNIQUES = [
  'Stacked Harmonies',
  'Call And Response',
  'Group Backing Vocals',
  'Ad Libs',
  'Occasional Falsetto',
  'Layered Ooh Harmonies',
  'Double Tracked Lead',
  'Gang Vocals',
  'Wordless Vocalise',
  'Tight Three Part Harmonies',
  'Gospel Style Backing',
  'Doo Wop Backing',
  'Singalong Chorus',
  'Shouted Hooks',
  'Whispered Phrases',
  'Scat Fills',
] as const;

export type VocalTechnique = typeof VOCAL_TECHNIQUES[number];

// Genre-specific vocal style suggestions
export const GENRE_VOCAL_STYLES: Record<string, {
  ranges: readonly VocalRange[];
  deliveries: readonly string[];
  techniques: readonly string[];
}> = {
  jazz: {
    ranges: ['Tenor', 'Baritone', 'Alto', 'Mezzo Soprano'],
    deliveries: ['Smooth', 'Crooner Style', 'Laid Back', 'Intimate', 'Melismatic'],
    techniques: ['Scat Fills', 'Stacked Harmonies', 'Ad Libs'],
  },
  pop: {
    ranges: ['Tenor', 'Mezzo Soprano', 'Alto'],
    deliveries: ['Belting', 'Powerful', 'Confident', 'Emotional', 'Breathy'],
    techniques: ['Stacked Harmonies', 'Singalong Chorus', 'Ad Libs', 'Layered Ooh Harmonies'],
  },
  rock: {
    ranges: ['Tenor', 'Baritone'],
    deliveries: ['Raspy', 'Powerful', 'Belting', 'Urgent', 'Emotional'],
    techniques: ['Gang Vocals', 'Shouted Hooks', 'Call And Response'],
  },
  electronic: {
    ranges: ['Soprano', 'Mezzo Soprano', 'Alto'],
    deliveries: ['Airy', 'Breathy', 'Smooth', 'Intimate'],
    techniques: ['Layered Ooh Harmonies', 'Wordless Vocalise', 'Ad Libs'],
  },
  rnb: {
    ranges: ['Tenor', 'Alto', 'Mezzo Soprano'],
    deliveries: ['Smooth', 'Melismatic', 'Soulful', 'Intimate', 'Falsetto'],
    techniques: ['Stacked Harmonies', 'Ad Libs', 'Call And Response', 'Occasional Falsetto'],
  },
  soul: {
    ranges: ['Tenor', 'Baritone', 'Alto', 'Mezzo Soprano'],
    deliveries: ['Soulful', 'Powerful', 'Belting', 'Emotional', 'Melismatic'],
    techniques: ['Gospel Style Backing', 'Call And Response', 'Ad Libs', 'Stacked Harmonies'],
  },
  country: {
    ranges: ['Tenor', 'Baritone', 'Mezzo Soprano'],
    deliveries: ['Storytelling', 'Warm', 'Honest', 'Emotional', 'Gentle'],
    techniques: ['Tight Three Part Harmonies', 'Singalong Chorus', 'Call And Response'],
  },
  folk: {
    ranges: ['Tenor', 'Alto', 'Baritone'],
    deliveries: ['Intimate', 'Storytelling', 'Warm', 'Gentle', 'Close Mic'],
    techniques: ['Tight Three Part Harmonies', 'Singalong Chorus', 'Group Backing Vocals'],
  },
  metal: {
    ranges: ['Tenor', 'Baritone', 'Bass'],
    deliveries: ['Powerful', 'Aggressive', 'Raspy', 'Theatrical'],
    techniques: ['Shouted Hooks', 'Gang Vocals', 'Wordless Vocalise'],
  },
  punk: {
    ranges: ['Tenor', 'Alto'],
    deliveries: ['Raspy', 'Urgent', 'Raw', 'Shouting', 'Melodic'],
    techniques: ['Gang Vocals', 'Shouted Hooks', 'Singalong Chorus'],
  },
  classical: {
    ranges: ['Soprano', 'Tenor', 'Baritone', 'Bass'],
    deliveries: ['Theatrical', 'Powerful', 'Dramatic', 'Operatic'],
    techniques: ['Wordless Vocalise', 'Stacked Harmonies'],
  },
  ambient: {
    ranges: ['Soprano', 'Alto'],
    deliveries: ['Airy', 'Breathy', 'Ethereal', 'Soft', 'Intimate'],
    techniques: ['Wordless Vocalise', 'Layered Ooh Harmonies'],
  },
  lofi: {
    ranges: ['Tenor', 'Alto'],
    deliveries: ['Intimate', 'Breathy', 'Soft', 'Laid Back', 'Close Mic'],
    techniques: ['Layered Ooh Harmonies', 'Ad Libs'],
  },
  blues: {
    ranges: ['Tenor', 'Baritone', 'Alto'],
    deliveries: ['Soulful', 'Raspy', 'Emotional', 'Melismatic', 'Storytelling'],
    techniques: ['Call And Response', 'Ad Libs', 'Shouted Hooks'],
  },
  latin: {
    ranges: ['Tenor', 'Baritone', 'Alto', 'Mezzo Soprano'],
    deliveries: ['Smooth', 'Passionate', 'Romantic', 'Warm'],
    techniques: ['Call And Response', 'Stacked Harmonies', 'Ad Libs'],
  },
  retro: {
    ranges: ['Tenor', 'Baritone', 'Mezzo Soprano'],
    deliveries: ['Crooner Style', 'Smooth', 'Warm', 'Theatrical'],
    techniques: ['Doo Wop Backing', 'Tight Three Part Harmonies', 'Singalong Chorus'],
  },
  synthwave: {
    ranges: ['Tenor', 'Baritone', 'Alto'],
    deliveries: ['Smooth', 'Breathy', 'Dramatic', 'Airy'],
    techniques: ['Layered Ooh Harmonies', 'Double Tracked Lead'],
  },
  cinematic: {
    ranges: ['Soprano', 'Tenor', 'Baritone'],
    deliveries: ['Theatrical', 'Powerful', 'Dramatic', 'Ethereal'],
    techniques: ['Wordless Vocalise', 'Stacked Harmonies', 'Gospel Style Backing'],
  },
  trap: {
    ranges: ['Tenor', 'Baritone'],
    deliveries: ['Laid Back', 'Melismatic', 'Emotional', 'Smooth'],
    techniques: ['Ad Libs', 'Layered Ooh Harmonies', 'Double Tracked Lead'],
  },
  videogame: {
    ranges: ['Soprano', 'Tenor', 'Alto'],
    deliveries: ['Theatrical', 'Dramatic', 'Ethereal', 'Powerful'],
    techniques: ['Wordless Vocalise', 'Stacked Harmonies'],
  },
  symphonic: {
    ranges: ['Soprano', 'Tenor', 'Baritone'],
    deliveries: ['Theatrical', 'Powerful', 'Dramatic', 'Operatic'],
    techniques: ['Wordless Vocalise', 'Stacked Harmonies', 'Gospel Style Backing'],
  },
};

// Default vocal style for unknown genres
export const DEFAULT_VOCAL_STYLE = {
  ranges: ['Tenor', 'Alto', 'Mezzo Soprano'] as VocalRange[],
  deliveries: ['Smooth', 'Emotional', 'Warm'],
  techniques: ['Stacked Harmonies', 'Ad Libs'],
};

// Get vocal suggestions for a genre
export function getVocalSuggestionsForGenre(
  genre: string,
  rng: () => number = Math.random
): { range: string; delivery: string; technique: string } {
  const style = GENRE_VOCAL_STYLES[genre.toLowerCase()] ?? DEFAULT_VOCAL_STYLE;
  
  const rangeIdx = Math.floor(rng() * style.ranges.length);
  const deliveryIdx = Math.floor(rng() * style.deliveries.length);
  const techniqueIdx = Math.floor(rng() * style.techniques.length);
  
  return {
    range: style.ranges[rangeIdx] ?? 'Tenor',
    delivery: style.deliveries[deliveryIdx] ?? 'Smooth',
    technique: style.techniques[techniqueIdx] ?? 'Stacked Harmonies',
  };
}

// Build vocal descriptor string
export function buildVocalDescriptor(
  genre: string,
  rng: () => number = Math.random
): string {
  const { range, delivery, technique } = getVocalSuggestionsForGenre(genre, rng);
  return `${range}, ${delivery} Delivery, ${technique}`;
}

// Genre-specific backing vocal suggestions
// These are actual singable sounds that work well as background harmonies
export const GENRE_BACKING_VOCALS: Record<string, {
  wordless: readonly string[];
  echoStyle: string;
}> = {
  pop: {
    wordless: ['(ooh)', '(oh-oh)', '(na na na)', '(hey)', '(woah)'],
    echoStyle: 'repeat the hook word',
  },
  rock: {
    wordless: ['(hey!)', '(woah)', '(oh)', '(go!)'],
    echoStyle: 'repeat with intensity',
  },
  rnb: {
    wordless: ['(ooh)', '(baby)', '(mmm)', '(oh)', '(ahh)'],
    echoStyle: 'smooth echo of key phrase',
  },
  soul: {
    wordless: ['(oh yeah)', '(mmm-hmm)', '(sing it)', '(ooh)', '(come on)'],
    echoStyle: 'call and response style',
  },
  hiphop: {
    wordless: ['(uh)', '(ayy)', '(what)', '(let\'s go)', '(aye)'],
    echoStyle: 'ad-lib the last word',
  },
  jazz: {
    wordless: ['(mmm)', '(ooh)', '(da da da)', '(doo)'],
    echoStyle: 'scat-style echo',
  },
  country: {
    wordless: ['(ooh)', '(mm-hmm)', '(whoa)', '(oh)'],
    echoStyle: 'harmony on key words',
  },
  folk: {
    wordless: ['(ooh)', '(ahh)', '(la la la)', '(mm)'],
    echoStyle: 'gentle word echo',
  },
  electronic: {
    wordless: ['(ooh)', '(ahh)', '(oh)', '(hey)'],
    echoStyle: 'rhythmic word chop',
  },
  metal: {
    wordless: ['(hey!)', '(go!)', '(woah)', '(oh!)'],
    echoStyle: 'gang vocal shout',
  },
  punk: {
    wordless: ['(hey!)', '(oh!)', '(go!)', '(oi!)'],
    echoStyle: 'crowd singalong',
  },
  latin: {
    wordless: ['(oye)', '(dale)', '(ooh)', '(ay)'],
    echoStyle: 'passionate echo',
  },
  ambient: {
    wordless: ['(ooh)', '(ahh)', '(mmm)'],
    echoStyle: 'ethereal sustain',
  },
  lofi: {
    wordless: ['(mmm)', '(ooh)', '(ahh)'],
    echoStyle: 'soft word repeat',
  },
};

export const DEFAULT_BACKING_VOCALS = {
  wordless: ['(ooh)', '(ahh)', '(oh)', '(mmm)', '(woah)'],
  echoStyle: 'repeat key word',
};

export function getBackingVocalsForGenre(genre: string): {
  wordless: readonly string[];
  echoStyle: string;
} {
  return GENRE_BACKING_VOCALS[genre.toLowerCase()] ?? DEFAULT_BACKING_VOCALS;
}
