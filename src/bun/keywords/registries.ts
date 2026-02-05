/**
 * Unified Keyword Registries
 *
 * Centralizes all keyword data used for extraction across the application.
 * Re-exports from existing modules where possible to maintain single source of truth.
 *
 * @module keywords/registries
 */

import { MOOD_POOL } from '@bun/instruments/datasets/mood-pool';
import { MOOD_TO_GENRE } from '@bun/instruments/detection';

import type { KeywordRegistry, KeywordMapping, Intent } from '@bun/keywords/types';
import type { Era, Tempo } from '@shared/schemas/thematic-context';

// =============================================================================
// Mood Keywords (re-exported from existing modules)
// =============================================================================

/** Combined mood vocabulary from MOOD_POOL (200+) and MOOD_TO_GENRE keys (50+) */
export const MOOD_KEYWORDS: readonly string[] = [
  ...new Set([...MOOD_POOL, ...Object.keys(MOOD_TO_GENRE)]),
];

// =============================================================================
// Harmonic Complexity Keywords
// =============================================================================

/**
 * Keywords indicating harmonic complexity in music descriptions.
 * Used to boost harmonic tag selection probability for sophisticated compositions.
 */
export const HARMONIC_COMPLEXITY_KEYWORDS: readonly string[] = [
  'jazz',
  'progressive',
  'modal',
  'chromatic',
  'sophisticated',
  'complex',
  'advanced',
  'extended chords',
  'polytonal',
];

// =============================================================================
// Era Keywords
// =============================================================================

/**
 * Mapping of era-indicating keywords to production eras.
 */
export const ERA_KEYWORDS: KeywordRegistry<Era> = {
  // Vintage/retro terms
  vintage: '70s',
  retro: '80s',
  'old-school': '70s',
  oldschool: '70s',
  classic: '70s',
  tape: '70s',
  vinyl: '70s',
  analog: '70s',
  analogue: '70s',
  // Synth-era terms
  synth: '80s',
  synthwave: '80s',
  neon: '80s',
  synthpop: '80s',
  'new wave': '80s',
  newwave: '80s',
  // 90s terms
  digital: '90s',
  grunge: '90s',
  rave: '90s',
  jungle: '90s',
  'trip-hop': '90s',
  triphop: '90s',
  britpop: '90s',
  // Modern terms
  modern: 'modern',
  contemporary: 'modern',
  current: 'modern',
  // Explicit decade mentions
  '1950s': '50s-60s',
  '50s': '50s-60s',
  '1960s': '50s-60s',
  '60s': '50s-60s',
  '1970s': '70s',
  '70s': '70s',
  '1980s': '80s',
  '80s': '80s',
  '1990s': '90s',
  '90s': '90s',
  '2000s': '2000s',
  '2010s': 'modern',
  '2020s': 'modern',
};

// =============================================================================
// Tempo Keywords
// =============================================================================

/** Keywords indicating slower tempo/energy */
export const TEMPO_SLOWER_KEYWORDS: readonly string[] = [
  'slow',
  'relaxed',
  'calm',
  'meditation',
  'meditative',
  'peaceful',
  'gentle',
  'soft',
  'chill',
  'ambient',
  'dreamy',
  'lullaby',
  'soothing',
  'lazy',
  'tranquil',
  'mellow',
  'easy',
  'laid-back',
  'laidback',
];

/** Keywords indicating faster tempo/energy */
export const TEMPO_FASTER_KEYWORDS: readonly string[] = [
  'fast',
  'energetic',
  'intense',
  'chase',
  'driving',
  'powerful',
  'explosive',
  'upbeat',
  'high-energy',
  'uptempo',
  'aggressive',
  'frantic',
  'racing',
  'rush',
  'hyper',
  'dynamic',
  'pumping',
  'pounding',
];

/** Tempo result for slower keywords */
export const TEMPO_SLOW: Tempo = { adjustment: -15, curve: 'steady' };

/** Tempo result for faster keywords */
export const TEMPO_FAST: Tempo = { adjustment: 15, curve: 'explosive' };

// =============================================================================
// Intent Keywords
// =============================================================================

/**
 * Mapping of intent-indicating keywords to listening intents.
 */
export const INTENT_KEYWORDS: KeywordRegistry<Intent> = {
  // Background/ambient intent
  background: 'background',
  ambient: 'background',
  study: 'background',
  studying: 'background',
  work: 'background',
  working: 'background',
  focus: 'background',
  concentration: 'background',
  meditation: 'background',
  meditative: 'background',
  sleep: 'background',
  sleeping: 'background',
  relax: 'background',
  relaxing: 'background',
  lounge: 'background',
  spa: 'background',
  yoga: 'background',
  chill: 'background',
  // Dancefloor intent
  dance: 'dancefloor',
  dancing: 'dancefloor',
  party: 'dancefloor',
  club: 'dancefloor',
  rave: 'dancefloor',
  festival: 'dancefloor',
  dancefloor: 'dancefloor',
  clubbing: 'dancefloor',
  disco: 'dancefloor',
  edm: 'dancefloor',
  // Cinematic intent
  film: 'cinematic',
  movie: 'cinematic',
  trailer: 'cinematic',
  epic: 'cinematic',
  cinematic: 'cinematic',
  soundtrack: 'cinematic',
  score: 'cinematic',
  orchestral: 'cinematic',
  dramatic: 'cinematic',
  theatrical: 'cinematic',
  blockbuster: 'cinematic',
  hollywood: 'cinematic',
  // Emotional intent
  emotional: 'emotional',
  sad: 'emotional',
  heartfelt: 'emotional',
  melancholic: 'emotional',
  nostalgic: 'emotional',
  bittersweet: 'emotional',
  touching: 'emotional',
  moving: 'emotional',
  sentimental: 'emotional',
  poignant: 'emotional',
  tender: 'emotional',
  intimate: 'emotional',
  // Focal/active listening intent
  concert: 'focal',
  live: 'focal',
  performance: 'focal',
  showcase: 'focal',
  audiophile: 'focal',
  'hi-fi': 'focal',
  hifi: 'focal',
  headphones: 'focal',
};

// =============================================================================
// Theme Keywords (for title generation - maps input to output words)
// =============================================================================

/** Maps time-related keywords to title words */
export const TIME_KEYWORDS: KeywordMapping = {
  // Core time of day
  night: ['Midnight', 'Night', 'Evening', 'Dusk'],
  morning: ['Morning', 'Dawn', 'Daybreak'],
  day: ['Morning', 'Daybreak', 'Sun'],
  sunset: ['Sunset', 'Dusk', 'Twilight'],
  twilight: ['Twilight', 'Dusk'],
  dawn: ['Dawn', 'Daybreak', 'Morning'],
  midnight: ['Midnight', 'Night'],
  evening: ['Evening', 'Dusk', 'Twilight'],
  noon: ['Noon', 'Daylight', 'Sun'],
  afternoon: ['Afternoon', 'Daylight'],
  // Celestial
  star: ['Starlight', 'Night', 'Stars'],
  moon: ['Moon', 'Night', 'Midnight'],
  // Compound time words
  nightfall: ['Night', 'Dusk', 'Evening'],
  nighttime: ['Night', 'Midnight'],
  sunrise: ['Morning', 'Dawn', 'Sun'],
  moonlight: ['Moon', 'Night', 'Starlight'],
  moonrise: ['Moon', 'Evening', 'Dusk'],
  starlight: ['Starlight', 'Night', 'Stars'],
  // Seasons
  spring: ['Spring', 'Morning', 'Blossom'],
  summer: ['Summer', 'Sun', 'Daylight'],
  autumn: ['Autumn', 'Dusk', 'Twilight'],
  fall: ['Autumn', 'Dusk', 'Twilight'],
  winter: ['Winter', 'Night', 'Snow'],
  // Temporal concepts
  yesterday: ['Yesterday', 'Memory', 'Past'],
  tomorrow: ['Tomorrow', 'Hope', 'Future'],
  today: ['Moment', 'Present', 'Now'],
  forever: ['Forever', 'Eternity', 'Always'],
  never: ['Never', 'Lost', 'Silence'],
  always: ['Always', 'Forever', 'Eternity'],
  // Duration/moments
  hour: ['Hour', 'Moment', 'Time'],
  moment: ['Moment', 'Instant', 'Second'],
  instant: ['Instant', 'Moment', 'Second'],
  century: ['Century', 'Era', 'Ages'],
  era: ['Era', 'Epoch', 'Ages'],
  age: ['Ages', 'Era', 'Eternity'],
};

/** Maps nature-related keywords to title words */
export const NATURE_KEYWORDS: KeywordMapping = {
  // Core nature elements
  ocean: ['Ocean', 'Waves', 'Water'],
  sea: ['Ocean', 'Waves', 'Water'],
  water: ['Ocean', 'River', 'Rain', 'Waves'],
  rain: ['Rain', 'Storm', 'Water'],
  storm: ['Storm', 'Thunder', 'Rain', 'Wind'],
  wind: ['Wind', 'Storm'],
  sky: ['Sky', 'Stars', 'Moon', 'Sun'],
  mountain: ['Mountain', 'Sky'],
  forest: ['Forest', 'Wind'],
  fire: ['Fire', 'Sun'],
  snow: ['Snow', 'Wind'],
  thunder: ['Thunder', 'Storm'],
  river: ['River', 'Water', 'Waves'],
  beach: ['Ocean', 'Waves', 'Sun'],
  desert: ['Sun', 'Fire', 'Sand'],
  city: ['Sky', 'Fire', 'Thunder'],
  urban: ['Sky', 'Fire', 'Thunder'],
  // Compound nature words
  rainfall: ['Rain', 'Water', 'Storm'],
  rainstorm: ['Rain', 'Storm', 'Thunder'],
  snowfall: ['Snow', 'Wind'],
  snowstorm: ['Snow', 'Storm', 'Wind'],
  windstorm: ['Wind', 'Storm', 'Thunder'],
  riverside: ['River', 'Water'],
  waterfall: ['Cascade', 'Water', 'River'],
  wildfire: ['Fire', 'Storm'],
  // Weather
  fog: ['Fog', 'Mist', 'Shadow'],
  mist: ['Mist', 'Fog', 'Rain'],
  cloud: ['Sky', 'Storm', 'Rain'],
  lightning: ['Thunder', 'Storm', 'Fire'],
  breeze: ['Breeze', 'Wind', 'Air'],
  gale: ['Gale', 'Wind', 'Storm'],
  hurricane: ['Hurricane', 'Storm', 'Wind'],
  tornado: ['Tornado', 'Storm', 'Wind'],
  // Landscapes
  valley: ['Valley', 'Mountain', 'River'],
  canyon: ['Canyon', 'Mountain', 'Stone'],
  cliff: ['Cliff', 'Mountain', 'Stone'],
  peak: ['Peak', 'Summit', 'Mountain'],
  summit: ['Summit', 'Peak', 'Mountain'],
  horizon: ['Horizon', 'Sky', 'Sun'],
  prairie: ['Prairie', 'Sky', 'Wind'],
  jungle: ['Jungle', 'Forest', 'Rain'],
  // Water bodies
  lake: ['Lake', 'Water', 'Moon'],
  pond: ['Pond', 'Lake', 'Water'],
  stream: ['Stream', 'River', 'Water'],
  brook: ['Brook', 'Stream', 'Water'],
  creek: ['Creek', 'Stream', 'Water'],
  cascade: ['Cascade', 'Water', 'River'],
  wave: ['Waves', 'Ocean', 'Water'],
  tide: ['Waves', 'Ocean', 'Moon'],
  // Celestial
  comet: ['Comet', 'Stars', 'Sky'],
  meteor: ['Meteor', 'Stars', 'Fire'],
  nebula: ['Nebula', 'Stars', 'Cosmos', 'Galaxy'],
  // Elements
  earth: ['Earth', 'Stone', 'Mountain'],
  air: ['Air', 'Wind', 'Sky'],
  ash: ['Ash', 'Fire', 'Dust'],
  dust: ['Dust', 'Wind', 'Sand'],
  sand: ['Sand', 'Desert', 'Dust'],
  stone: ['Stone', 'Mountain', 'Earth'],
  crystal: ['Crystal', 'Ice', 'Stone'],
  ice: ['Ice', 'Snow', 'Crystal'],
  // Flora
  flower: ['Blossom', 'Petal', 'Spring'],
  blossom: ['Blossom', 'Petal', 'Spring'],
  petal: ['Petal', 'Blossom', 'Flower'],
  tree: ['Branch', 'Root', 'Forest'],
  leaf: ['Leaf', 'Branch', 'Forest'],
  seed: ['Seed', 'Root', 'Earth'],
};

/** Maps emotion-related keywords to title words */
export const EMOTION_KEYWORDS: KeywordMapping = {
  // Core emotions
  love: ['Love', 'Heart', 'Dream'],
  heart: ['Heart', 'Love', 'Soul'],
  dream: ['Dream', 'Spirit', 'Hope'],
  hope: ['Hope', 'Light', 'Dream'],
  lost: ['Lost', 'Shadow', 'Memory'],
  found: ['Found', 'Light', 'Hope'],
  memory: ['Memory', 'Echo', 'Dream'],
  remember: ['Memory', 'Echo', 'Dream'],
  forget: ['Lost', 'Shadow', 'Silence'],
  sad: ['Shadow', 'Lost', 'Cry'],
  happy: ['Light', 'Hope', 'Found'],
  lonely: ['Silence', 'Shadow', 'Lost'],
  alone: ['Silence', 'Solitude', 'Shadow'],
  together: ['Heart', 'Love', 'Found'],
  break: ['Breaking', 'Cry', 'Lost'],
  heal: ['Hope', 'Light', 'Found'],
  pain: ['Cry', 'Shadow', 'Lost'],
  joy: ['Light', 'Hope', 'Dream'],
  soul: ['Soul', 'Spirit', 'Heart'],
  // Compound emotion words
  heartbreak: ['Heart', 'Cry', 'Lost', 'Shadow'],
  heartache: ['Heart', 'Cry', 'Lost'],
  loneliness: ['Silence', 'Lost', 'Shadow'],
  happiness: ['Light', 'Hope', 'Found'],
  sadness: ['Shadow', 'Lost', 'Cry'],
  // Intense emotions
  anger: ['Rage', 'Fury', 'Fire'],
  rage: ['Rage', 'Fury', 'Chaos'],
  fury: ['Fury', 'Rage', 'Storm'],
  fear: ['Fear', 'Dread', 'Shadow'],
  courage: ['Courage', 'Hope', 'Light'],
  brave: ['Courage', 'Hope', 'Light'],
  peaceful: ['Peace', 'Serenity', 'Calm'],
  excited: ['Elation', 'Euphoria', 'Joy'],
  passion: ['Passion', 'Desire', 'Fire'],
  passionate: ['Passion', 'Desire', 'Yearning'],
  desire: ['Desire', 'Yearning', 'Passion'],
  longing: ['Longing', 'Yearning', 'Desire'],
  // Grief and tears
  grief: ['Grief', 'Sorrow', 'Tears'],
  sorrow: ['Sorrow', 'Grief', 'Despair'],
  tears: ['Tears', 'Cry', 'Sorrow'],
  cry: ['Cry', 'Tears', 'Grief'],
  // Joy and wonder
  laugh: ['Laughter', 'Joy', 'Bliss'],
  laughter: ['Laughter', 'Joy', 'Elation'],
  wonder: ['Wonder', 'Awe', 'Dream'],
  awe: ['Awe', 'Wonder', 'Mystery'],
  // Trust and faith
  trust: ['Trust', 'Faith', 'Bond'],
  faith: ['Faith', 'Trust', 'Hope'],
  doubt: ['Doubt', 'Fear', 'Shadow'],
  // Regret and pride
  regret: ['Regret', 'Remorse', 'Memory'],
  shame: ['Shame', 'Regret', 'Shadow'],
  pride: ['Pride', 'Courage', 'Light'],
};

/** Maps action-related keywords to title words */
export const ACTION_KEYWORDS: KeywordMapping = {
  rise: ['Rising', 'Flying'],
  rising: ['Rising', 'Flying'],
  fall: ['Falling', 'Fading'],
  falling: ['Falling', 'Fading'],
  run: ['Running', 'Chasing'],
  running: ['Running', 'Chasing'],
  dance: ['Dancing', 'Flying'],
  dancing: ['Dancing', 'Flying'],
  fly: ['Flying', 'Rising'],
  flying: ['Flying', 'Rising'],
  burn: ['Burning', 'Fire'],
  burning: ['Burning', 'Fire'],
  fade: ['Fading', 'Falling'],
  fading: ['Fading', 'Falling'],
  drift: ['Drifting', 'Floating'],
  drifting: ['Drifting', 'Floating'],
  chase: ['Chasing', 'Running'],
  chasing: ['Chasing', 'Running'],
  break: ['Breaking', 'Falling'],
  breaking: ['Breaking', 'Falling'],
};

/** Maps abstract keywords to title words */
export const ABSTRACT_KEYWORDS: KeywordMapping = {
  // Eternity concepts
  forever: ['Eternity', 'Infinity'],
  eternal: ['Eternity', 'Infinity'],
  infinity: ['Infinity', 'Eternity'],
  eternity: ['Eternity', 'Infinity'],
  // Freedom
  free: ['Freedom', 'Flying'],
  freedom: ['Freedom', 'Liberty'],
  // Fate/destiny
  destiny: ['Destiny', 'Fate'],
  fate: ['Destiny', 'Fate'],
  // Balance
  chaos: ['Chaos', 'Storm'],
  peace: ['Serenity', 'Harmony'],
  calm: ['Serenity', 'Peace'],
  balance: ['Balance', 'Harmony'],
  harmony: ['Harmony', 'Balance'],
  truth: ['Truth', 'Light'],
  // Musical terms
  rhythm: ['Rhythm', 'Pulse', 'Beat'],
  beat: ['Beat', 'Pulse', 'Rhythm'],
  pulse: ['Pulse', 'Beat', 'Rhythm'],
  melody: ['Resonance', 'Harmony'],
  music: ['Rhythm', 'Harmony', 'Resonance'],
  song: ['Resonance', 'Harmony'],
  tempo: ['Rhythm', 'Pulse', 'Beat'],
  // Journey/Path
  journey: ['Journey', 'Quest', 'Voyage'],
  quest: ['Quest', 'Journey', 'Path'],
  voyage: ['Voyage', 'Journey', 'Quest'],
  path: ['Path', 'Road', 'Journey'],
  road: ['Road', 'Path', 'Journey'],
  wander: ['Journey', 'Path', 'Quest'],
  // Space/Cosmic
  space: ['Cosmos', 'Universe', 'Void'],
  cosmic: ['Cosmos', 'Universe', 'Galaxy'],
  universe: ['Universe', 'Cosmos', 'Infinity'],
  galaxy: ['Galaxy', 'Cosmos', 'Universe'],
  cosmos: ['Cosmos', 'Universe', 'Galaxy'],
  void: ['Void', 'Abyss', 'Nothingness'],
  abyss: ['Abyss', 'Void', 'Nothingness'],
  // Mystical/Spiritual
  mystery: ['Mystery', 'Enigma', 'Riddle'],
  enigma: ['Enigma', 'Mystery', 'Paradox'],
  magic: ['Mystery', 'Illusion', 'Wonder'],
  spirit: ['Spirit', 'Soul', 'Essence', 'Dream'],
  divine: ['Transcendence', 'Nirvana', 'Serenity'],
  transcend: ['Transcendence', 'Ascension'],
  // Conflict
  battle: ['Chaos', 'Storm', 'Thunder'],
  war: ['Chaos', 'Storm', 'Fury'],
  fight: ['Chaos', 'Fury', 'Rage'],
  // Reality/illusion
  reality: ['Reality', 'Truth', 'Existence'],
  illusion: ['Illusion', 'Dream', 'Mystery'],
  // Time concepts
  time: ['Eternity', 'Infinity', 'Timeless'],
  timeless: ['Timeless', 'Eternity', 'Immortality'],
  immortal: ['Immortality', 'Eternity', 'Timeless'],
  fleeting: ['Fleeting', 'Ephemeral', 'Mortality'],
};
