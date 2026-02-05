/**
 * Mood Intensity Scaling
 *
 * Maps base moods to intensity variants for 3-level intensity scaling.
 * Each mood has mild, moderate, and intense variants.
 *
 * @module mood/intensity
 */

import type { MoodIntensity } from '@bun/mood/types';

/**
 * Intensity variant mapping for a single mood.
 * Maps intensity level to the appropriate mood word.
 */
export type IntensityVariants = Record<MoodIntensity, string>;

/**
 * Mood intensity map for all mood categories.
 * Maps base mood words to their intensity variants.
 *
 * Structure:
 * - mild: Subtle, understated expression
 * - moderate: Standard, balanced expression
 * - intense: Strong, powerful expression
 */
export const MOOD_INTENSITY_MAP: Record<string, IntensityVariants> = {
  // Energetic category
  euphoric: { mild: 'uplifted', moderate: 'euphoric', intense: 'ecstatic' },
  energetic: { mild: 'lively', moderate: 'energetic', intense: 'explosive' },
  uplifting: { mild: 'hopeful', moderate: 'uplifting', intense: 'triumphant' },
  vibrant: { mild: 'spirited', moderate: 'vibrant', intense: 'electrifying' },
  dynamic: { mild: 'animated', moderate: 'dynamic', intense: 'exhilarating' },

  // Calm category
  serene: { mild: 'quiet', moderate: 'serene', intense: 'transcendent' },
  peaceful: { mild: 'gentle', moderate: 'peaceful', intense: 'blissful' },
  relaxed: { mild: 'mellow', moderate: 'relaxed', intense: 'deeply tranquil' },
  tranquil: { mild: 'soft', moderate: 'tranquil', intense: 'profoundly calm' },
  calm: { mild: 'quiet', moderate: 'calm', intense: 'deeply serene' },

  // Dark category
  haunting: { mild: 'mysterious', moderate: 'haunting', intense: 'terrifying' },
  dark: { mild: 'shadowy', moderate: 'dark', intense: 'pitch black' },
  ominous: { mild: 'foreboding', moderate: 'ominous', intense: 'menacing' },
  brooding: { mild: 'pensive', moderate: 'brooding', intense: 'smoldering' },
  sinister: { mild: 'eerie', moderate: 'sinister', intense: 'malevolent' },

  // Emotional category
  melancholic: { mild: 'wistful', moderate: 'melancholic', intense: 'devastated' },
  sad: { mild: 'pensive', moderate: 'sad', intense: 'heartbroken' },
  nostalgic: { mild: 'reminiscent', moderate: 'nostalgic', intense: 'achingly nostalgic' },
  tender: { mild: 'gentle', moderate: 'tender', intense: 'deeply moving' },
  bittersweet: { mild: 'wistful', moderate: 'bittersweet', intense: 'poignant' },

  // Playful category
  whimsical: { mild: 'quirky', moderate: 'whimsical', intense: 'fantastical' },
  playful: { mild: 'lighthearted', moderate: 'playful', intense: 'exuberant' },
  cheerful: { mild: 'pleasant', moderate: 'cheerful', intense: 'gleeful' },
  fun: { mild: 'amusing', moderate: 'fun', intense: 'riotous' },
  carefree: { mild: 'easygoing', moderate: 'carefree', intense: 'wild and free' },

  // Intense category
  passionate: { mild: 'ardent', moderate: 'passionate', intense: 'fiercely passionate' },
  fierce: { mild: 'strong', moderate: 'fierce', intense: 'ferocious' },
  aggressive: { mild: 'assertive', moderate: 'aggressive', intense: 'savage' },
  powerful: { mild: 'strong', moderate: 'powerful', intense: 'overwhelming' },
  raw: { mild: 'honest', moderate: 'raw', intense: 'visceral' },

  // Atmospheric category
  ethereal: { mild: 'airy', moderate: 'ethereal', intense: 'otherworldly' },
  dreamy: { mild: 'hazy', moderate: 'dreamy', intense: 'surreal' },
  mysterious: { mild: 'enigmatic', moderate: 'mysterious', intense: 'cryptic' },
  hypnotic: { mild: 'mesmerizing', moderate: 'hypnotic', intense: 'entrancing' },
  cosmic: { mild: 'spacey', moderate: 'cosmic', intense: 'transcendent' },

  // Seasonal category
  autumnal: { mild: 'crisp', moderate: 'autumnal', intense: 'deeply autumnal' },
  wintry: { mild: 'cool', moderate: 'wintry', intense: 'frigid' },
  summery: { mild: 'warm', moderate: 'summery', intense: 'scorching' },
  nocturnal: { mild: 'evening', moderate: 'nocturnal', intense: 'midnight' },

  // Social category
  celebratory: { mild: 'festive', moderate: 'celebratory', intense: 'ecstatic' },
  joyful: { mild: 'happy', moderate: 'joyful', intense: 'elated' },
  festive: { mild: 'cheerful', moderate: 'festive', intense: 'raucous' },

  // Sophisticated category
  elegant: { mild: 'refined', moderate: 'elegant', intense: 'opulent' },
  sophisticated: { mild: 'polished', moderate: 'sophisticated', intense: 'exquisite' },
  majestic: { mild: 'stately', moderate: 'majestic', intense: 'regal' },
  graceful: { mild: 'poised', moderate: 'graceful', intense: 'sublime' },

  // Gritty category
  gritty: { mild: 'rough', moderate: 'gritty', intense: 'raw and unpolished' },
  rough: { mild: 'textured', moderate: 'rough', intense: 'abrasive' },
  earthy: { mild: 'grounded', moderate: 'earthy', intense: 'primal' },
  authentic: { mild: 'genuine', moderate: 'authentic', intense: 'unflinchingly real' },

  // Epic category
  epic: { mild: 'grand', moderate: 'epic', intense: 'monumental' },
  heroic: { mild: 'noble', moderate: 'heroic', intense: 'legendary' },
  cinematic: { mild: 'dramatic', moderate: 'cinematic', intense: 'blockbuster' },
  anthemic: { mild: 'rousing', moderate: 'anthemic', intense: 'stadium-sized' },

  // Vulnerable category
  vulnerable: { mild: 'open', moderate: 'vulnerable', intense: 'deeply exposed' },
  intimate: { mild: 'personal', moderate: 'intimate', intense: 'confessional' },
  heartfelt: { mild: 'sincere', moderate: 'heartfelt', intense: 'deeply moving' },
  introspective: { mild: 'thoughtful', moderate: 'introspective', intense: 'soul-searching' },

  // Tense category
  tense: { mild: 'uneasy', moderate: 'tense', intense: 'nail-biting' },
  anxious: { mild: 'restless', moderate: 'anxious', intense: 'paranoid' },
  suspenseful: { mild: 'anticipating', moderate: 'suspenseful', intense: 'nerve-wracking' },
  eerie: { mild: 'unsettling', moderate: 'eerie', intense: 'chilling' },

  // Groove category
  groovy: { mild: 'rhythmic', moderate: 'groovy', intense: 'funky as hell' },
  funky: { mild: 'bouncy', moderate: 'funky', intense: 'deeply funky' },
  danceable: { mild: 'rhythmic', moderate: 'danceable', intense: 'irresistible' },

  // Spiritual category
  spiritual: { mild: 'reflective', moderate: 'spiritual', intense: 'transcendent' },
  sacred: { mild: 'reverent', moderate: 'sacred', intense: 'divine' },
  mystical: { mild: 'enigmatic', moderate: 'mystical', intense: 'otherworldly' },
  healing: { mild: 'soothing', moderate: 'healing', intense: 'transformative' },

  // Eclectic category
  experimental: { mild: 'unconventional', moderate: 'experimental', intense: 'avant-garde' },
  eccentric: { mild: 'quirky', moderate: 'eccentric', intense: 'wildly unconventional' },
  abstract: { mild: 'unconventional', moderate: 'abstract', intense: 'completely abstract' },

  // Attitude category
  defiant: { mild: 'resolute', moderate: 'defiant', intense: 'rebellious' },
  hopeful: { mild: 'optimistic', moderate: 'hopeful', intense: 'triumphant' },
  confident: { mild: 'assured', moderate: 'confident', intense: 'bold' },

  // Texture category
  lush: { mild: 'warm', moderate: 'lush', intense: 'richly layered' },
  sparse: { mild: 'minimal', moderate: 'sparse', intense: 'stark' },
  layered: { mild: 'textured', moderate: 'layered', intense: 'densely layered' },

  // Movement category
  flowing: { mild: 'gentle', moderate: 'flowing', intense: 'surging' },
  driving: { mild: 'propulsive', moderate: 'driving', intense: 'relentless' },
  pulsating: { mild: 'rhythmic', moderate: 'pulsating', intense: 'throbbing' },

  // Ambient/Meditative category
  meditative: { mild: 'contemplative', moderate: 'meditative', intense: 'transcendent' },
  floaty: { mild: 'airy', moderate: 'floaty', intense: 'weightless' },
  spacious: { mild: 'open', moderate: 'spacious', intense: 'vast' },
  calming: { mild: 'soothing', moderate: 'calming', intense: 'deeply peaceful' },

  // Jazz/Sophisticated category
  smooth: { mild: 'silky', moderate: 'smooth', intense: 'buttery' },
  'late night': { mild: 'evening', moderate: 'late night', intense: 'after hours' },
  cool: { mild: 'relaxed', moderate: 'cool', intense: 'ice cold' },

  // Metal/Heavy category
  brutal: { mild: 'heavy', moderate: 'brutal', intense: 'pulverizing' },
  crushing: { mild: 'heavy', moderate: 'crushing', intense: 'devastating' },

  // Blues category
  smoky: { mild: 'hazy', moderate: 'smoky', intense: 'smoldering' },
  mournful: { mild: 'somber', moderate: 'mournful', intense: 'grief-stricken' },

  // World/Rhythmic category
  rhythmic: { mild: 'steady', moderate: 'rhythmic', intense: 'driving' },
  exotic: { mild: 'foreign', moderate: 'exotic', intense: 'otherworldly' },
  ornate: { mild: 'decorated', moderate: 'ornate', intense: 'lavishly ornate' },
  ancient: { mild: 'timeless', moderate: 'ancient', intense: 'primordial' },
  traditional: { mild: 'classic', moderate: 'traditional', intense: 'deeply rooted' },

  // Dreamy/Hazy category
  hazy: { mild: 'soft', moderate: 'hazy', intense: 'foggy' },
  breezy: { mild: 'light', moderate: 'breezy', intense: 'windswept' },
  'lo-fi': { mild: 'warm', moderate: 'lo-fi', intense: 'heavily distorted' },

  // Adventure/Action category
  adventurous: { mild: 'curious', moderate: 'adventurous', intense: 'daring' },
  exciting: { mild: 'interesting', moderate: 'exciting', intense: 'thrilling' },
  triumphant: { mild: 'victorious', moderate: 'triumphant', intense: 'gloriously triumphant' },

  // Complex/Intellectual category
  complex: { mild: 'nuanced', moderate: 'complex', intense: 'labyrinthine' },
  cerebral: { mild: 'thoughtful', moderate: 'cerebral', intense: 'intellectually dense' },
  glitchy: { mild: 'stuttering', moderate: 'glitchy', intense: 'fractured' },
  'avant-garde': {
    mild: 'unconventional',
    moderate: 'avant-garde',
    intense: 'radically experimental',
  },

  // Folk/Traditional category
  lively: { mild: 'animated', moderate: 'lively', intense: 'vivacious' },
  spirited: { mild: 'energetic', moderate: 'spirited', intense: 'exuberant' },
  rustic: { mild: 'simple', moderate: 'rustic', intense: 'ruggedly rustic' },

  // Sweet/Playful category
  sweet: { mild: 'gentle', moderate: 'sweet', intense: 'saccharine' },
  maximalist: { mild: 'full', moderate: 'maximalist', intense: 'overwhelming' },
  wild: { mild: 'untamed', moderate: 'wild', intense: 'feral' },
  exuberant: { mild: 'enthusiastic', moderate: 'exuberant', intense: 'overflowing' },

  // Deep/Underground category
  deep: { mild: 'profound', moderate: 'deep', intense: 'bottomless' },
  underground: { mild: 'alternative', moderate: 'underground', intense: 'subterranean' },

  // Chill/Cozy category
  chill: { mild: 'relaxed', moderate: 'chill', intense: 'ice cold chill' },
  cozy: { mild: 'comfortable', moderate: 'cozy', intense: 'deeply snug' },

  // Technical category
  technical: { mild: 'skilled', moderate: 'technical', intense: 'virtuosic' },
  angular: { mild: 'sharp', moderate: 'angular', intense: 'jagged' },
  intricate: { mild: 'detailed', moderate: 'intricate', intense: 'labyrinthine' },
  precise: { mild: 'accurate', moderate: 'precise', intense: 'surgically precise' },

  // Emotional/Vulnerable category
  confessional: { mild: 'personal', moderate: 'confessional', intense: 'soul-baring' },
  cathartic: { mild: 'releasing', moderate: 'cathartic', intense: 'purging' },

  // Funk/Groove category
  tight: { mild: 'locked in', moderate: 'tight', intense: 'airtight' },
  syncopated: { mild: 'off-beat', moderate: 'syncopated', intense: 'heavily syncopated' },
  swaggering: { mild: 'confident', moderate: 'swaggering', intense: 'outrageously cocky' },

  // Pop/Catchy category
  catchy: { mild: 'memorable', moderate: 'catchy', intense: 'earworm' },
  upbeat: { mild: 'positive', moderate: 'upbeat', intense: 'exhilarating' },
  polished: { mild: 'clean', moderate: 'polished', intense: 'immaculately polished' },

  // Bouncy/Party category
  bouncy: { mild: 'springy', moderate: 'bouncy', intense: 'hyperactive' },
  party: { mild: 'social', moderate: 'party', intense: 'raging party' },
  liquid: { mild: 'smooth', moderate: 'liquid', intense: 'flowing like water' },

  // Retro category
  retro: { mild: 'vintage', moderate: 'retro', intense: 'throwback' },
  'feel-good': { mild: 'pleasant', moderate: 'feel-good', intense: 'euphoric' },
  neon: { mild: 'bright', moderate: 'neon', intense: 'blindingly neon' },

  // Classical/Noble category
  noble: { mild: 'dignified', moderate: 'noble', intense: 'regal' },
  regal: { mild: 'stately', moderate: 'regal', intense: 'imperial' },
  soaring: { mild: 'rising', moderate: 'soaring', intense: 'sky-high' },

  // Story/Character category
  'story driven': { mild: 'narrative', moderate: 'story driven', intense: 'epic narrative' },
  hard: { mild: 'firm', moderate: 'hard', intense: 'uncompromising' },
  moody: { mild: 'temperamental', moderate: 'moody', intense: 'brooding' },

  // Futuristic category
  futuristic: { mild: 'modern', moderate: 'futuristic', intense: 'far future' },
  cyberpunk: { mild: 'digital', moderate: 'cyberpunk', intense: 'dystopian cyber' },

  // Night/Contemplative category
  contemplative: { mild: 'reflective', moderate: 'contemplative', intense: 'deeply philosophical' },

  // Energy category
  'high energy': { mild: 'energetic', moderate: 'high energy', intense: 'explosive' },
  pulsing: { mild: 'throbbing', moderate: 'pulsing', intense: 'relentlessly pulsing' },

  // Caribbean/Summer category
  caribbean: { mild: 'tropical', moderate: 'caribbean', intense: 'island fever' },
  infectious: { mild: 'catchy', moderate: 'infectious', intense: 'unstoppable' },
  summer: { mild: 'warm', moderate: 'summer', intense: 'scorching summer' },

  // Rebellion category
  rebellious: { mild: 'defiant', moderate: 'rebellious', intense: 'revolutionary' },
  urgent: { mild: 'pressing', moderate: 'urgent', intense: 'desperate' },
  youthful: { mild: 'fresh', moderate: 'youthful', intense: 'teenage' },

  // Nature/Positive category
  sunny: { mild: 'bright', moderate: 'sunny', intense: 'radiant' },
  rootsy: { mild: 'grounded', moderate: 'rootsy', intense: 'deeply rooted' },
  positive: { mild: 'optimistic', moderate: 'positive', intense: 'radiantly positive' },

  // Chaos/Tribal category
  chaotic: { mild: 'unpredictable', moderate: 'chaotic', intense: 'anarchic' },
  tribal: { mild: 'communal', moderate: 'tribal', intense: 'primal tribal' },
  primal: { mild: 'basic', moderate: 'primal', intense: 'raw and primal' },

  // Cold/Stark category
  cold: { mild: 'cool', moderate: 'cold', intense: 'frigid' },
  stark: { mild: 'bare', moderate: 'stark', intense: 'harshly stark' },

  // Heavy/Psychedelic category
  fuzzy: { mild: 'warm', moderate: 'fuzzy', intense: 'heavily distorted' },
  trippy: { mild: 'surreal', moderate: 'trippy', intense: 'mind-bending' },
  thunderous: { mild: 'rumbling', moderate: 'thunderous', intense: 'earth-shaking' },

  // Grand/Character category
  grand: { mild: 'impressive', moderate: 'grand', intense: 'magnificent' },
  honest: { mild: 'genuine', moderate: 'honest', intense: 'brutally honest' },
  charming: { mild: 'pleasant', moderate: 'charming', intense: 'enchanting' },

  // Smooth/Urban category
  slick: { mild: 'smooth', moderate: 'slick', intense: 'ultra-slick' },
  urban: { mild: 'city', moderate: 'urban', intense: 'street' },
  street: { mild: 'urban', moderate: 'street', intense: 'gritty street' },

  // Bright/Angry category
  bright: { mild: 'clear', moderate: 'bright', intense: 'dazzling' },
  angry: { mild: 'frustrated', moderate: 'angry', intense: 'furious' },
  angsty: { mild: 'restless', moderate: 'angsty', intense: 'tortured' },
  disaffected: { mild: 'detached', moderate: 'disaffected', intense: 'alienated' },

  // Romantic/Sensual category
  romantic: { mild: 'tender', moderate: 'romantic', intense: 'passionately romantic' },
  sensual: { mild: 'intimate', moderate: 'sensual', intense: 'seductive' },
};

/**
 * Get the intensity variant for a mood.
 * Falls back to the base mood if no mapping exists.
 *
 * @param baseMood - The base mood word to look up
 * @param intensity - The desired intensity level
 * @returns The mood word adjusted for intensity
 */
export function getIntensityVariant(baseMood: string, intensity: MoodIntensity): string {
  const variants = MOOD_INTENSITY_MAP[baseMood.toLowerCase()];
  if (variants) {
    return variants[intensity];
  }
  // Fall back to base mood if no mapping exists
  return baseMood;
}

/**
 * Check if a mood has intensity variants defined.
 *
 * @param mood - The mood word to check
 * @returns True if intensity variants exist for this mood
 */
export function hasIntensityVariants(mood: string): boolean {
  return mood.toLowerCase() in MOOD_INTENSITY_MAP;
}
