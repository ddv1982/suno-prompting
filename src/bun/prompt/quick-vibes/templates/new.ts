/**
 * New Quick Vibes Templates (v3.0)
 *
 * 10 new category templates added in the v3.0 expansion.
 *
 * @module prompt/quick-vibes/templates/new
 */

import type { QuickVibesTemplate } from '../types';

// =============================================================================
// New v3.0 Category Templates
// =============================================================================

export const WORKOUT_ENERGY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'EDM',
    'drum and bass',
    'trap',
    'house',
    'hardstyle',
    'dubstep',
    'techno',
    'electro',
    'trance',
  ],
  instruments: [
    ['powerful synth', 'driving drums', 'bass drop'],
    ['808 bass', 'hi-hats', 'synth lead'],
    ['four on the floor kick', 'energy synth', 'claps'],
    ['breakbeat drums', 'reese bass', 'riser FX'],
    ['supersaw', 'punchy kick', 'snare'],
    ['wobble bass', 'aggressive synth', 'impacts'],
  ],
  moods: ['powerful', 'intense', 'driving', 'energetic', 'pumping', 'fierce', 'aggressive', 'unstoppable'],
  titleWords: {
    adjectives: ['Beast', 'Power', 'Fire', 'Iron', 'Heavy', 'Strong', 'Max', 'Savage'],
    nouns: ['Mode', 'Grind', 'Pump', 'Gains', 'Force', 'Energy', 'Fury', 'Drive'],
    contexts: ['Workout', 'Gym Session', 'Training', 'No Limits', 'Full Send', 'Go Hard'],
  },
};

export const MORNING_SUNSHINE_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'indie pop',
    'acoustic',
    'folk pop',
    'soft rock',
    'chamber pop',
    'dream pop',
    'lo-fi pop',
    'singer-songwriter',
  ],
  instruments: [
    ['acoustic guitar', 'light percussion', 'warm synth'],
    ['ukulele', 'handclaps', 'soft drums'],
    ['piano', 'strings', 'bells'],
    ['fingerpicked guitar', 'shaker', 'flute'],
    ['mandolin', 'soft pad', 'tambourine'],
    ['glockenspiel', 'acoustic bass', 'brushed drums'],
  ],
  moods: ['bright', 'hopeful', 'fresh', 'optimistic', 'cheerful', 'uplifting', 'sunny', 'radiant'],
  titleWords: {
    adjectives: ['Golden', 'Bright', 'Fresh', 'New', 'Warm', 'Clear', 'Sunny', 'Early'],
    nouns: ['Morning', 'Sunrise', 'Day', 'Light', 'Sky', 'Breeze', 'Rays', 'Glow'],
    contexts: ['Wake Up', 'First Light', 'New Day', 'Dawn', 'Good Morning', 'Rise and Shine'],
  },
};

export const SUNSET_GOLDEN_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'chillwave',
    'neo soul',
    'soft rock',
    'indie folk',
    'dream pop',
    'lo-fi',
    'ambient pop',
    'downtempo',
  ],
  instruments: [
    ['warm synth pad', 'soft drums', 'bass'],
    ['Rhodes', 'gentle guitar', 'shaker'],
    ['analog pad', 'fingerpicked guitar', 'light percussion'],
    ['ambient keys', 'bass guitar', 'brushed drums'],
    ['Wurlitzer', 'nylon guitar', 'soft cymbals'],
    ['vintage synth', 'acoustic guitar', 'bongos'],
  ],
  moods: ['warm', 'nostalgic', 'peaceful', 'reflective', 'golden', 'serene', 'mellow', 'dreamy'],
  titleWords: {
    adjectives: ['Golden', 'Warm', 'Amber', 'Fading', 'Soft', 'Gentle', 'Hazy', 'Glowing'],
    nouns: ['Sunset', 'Hour', 'Glow', 'Horizon', 'Sky', 'Light', 'Dusk', 'Coast'],
    contexts: ['by the Sea', 'on the Roof', 'Driving Home', 'Beach', 'Summer Evening', 'Last Light'],
  },
};

export const DINNER_PARTY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'jazz',
    'bossa nova',
    'soul',
    'lounge',
    'easy listening',
    'smooth jazz',
    'nu jazz',
    'soft jazz',
  ],
  instruments: [
    ['piano', 'upright bass', 'brushed drums'],
    ['nylon guitar', 'light percussion', 'flute'],
    ['Rhodes', 'walking bass', 'soft cymbals'],
    ['vibraphone', 'bass', 'bongos'],
    ['jazz guitar', 'stand-up bass', 'shaker'],
    ['grand piano', 'cello', 'gentle drums'],
  ],
  moods: ['elegant', 'sophisticated', 'warm', 'intimate', 'refined', 'smooth', 'classy', 'inviting'],
  titleWords: {
    adjectives: ['Elegant', 'Smooth', 'Fine', 'Warm', 'Classy', 'Subtle', 'Refined', 'Chic'],
    nouns: ['Evening', 'Soirée', 'Gathering', 'Night', 'Mood', 'Ambiance', 'Dinner', 'Affair'],
    contexts: ['at Eight', 'Candlelit', 'with Friends', 'Downtown', 'Uptown', 'in Style'],
  },
};

export const ROAD_TRIP_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'rock',
    'indie rock',
    'classic rock',
    'alternative',
    'folk rock',
    'americana',
    'heartland rock',
    'country rock',
  ],
  instruments: [
    ['electric guitar', 'bass', 'drums'],
    ['acoustic guitar', 'harmonica', 'tambourine'],
    ['jangly guitar', 'organ', 'driving drums'],
    ['slide guitar', 'bass', 'claps'],
    ['power chords', 'bass guitar', 'crashing cymbals'],
    ['12-string guitar', 'pedal steel', 'snare'],
  ],
  moods: ['adventurous', 'free', 'uplifting', 'energetic', 'open', 'wild', 'exhilarating', 'carefree'],
  titleWords: {
    adjectives: ['Open', 'Endless', 'Wild', 'Free', 'Rolling', 'Dusty', 'Winding', 'Long'],
    nouns: ['Road', 'Highway', 'Miles', 'Journey', 'Wheels', 'Wind', 'Horizon', 'Route'],
    contexts: ['to Nowhere', 'at Dawn', 'Cross Country', 'Windows Down', 'Coast to Coast', 'Headed West'],
  },
};

export const GAMING_FOCUS_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'electronic',
    'synthwave',
    'orchestral',
    'chiptune',
    'cinematic',
    'epic',
    'hybrid orchestral',
    'dubstep',
  ],
  instruments: [
    ['synth lead', 'orchestral hits', 'drums'],
    ['arpeggiator', 'strings', 'impacts'],
    ['chiptune synth', '808', 'brass'],
    ['epic choir', 'synth bass', 'percussion'],
    ['retro synth', 'battle drums', 'horn section'],
    ['glitchy synth', 'orchestral stabs', 'electronic drums'],
  ],
  moods: ['intense', 'immersive', 'epic', 'focused', 'dramatic', 'powerful', 'heroic', 'adrenaline'],
  titleWords: {
    adjectives: ['Epic', 'Final', 'Ultimate', 'Pixel', 'Digital', 'Cyber', 'Legendary', 'Elite'],
    nouns: ['Boss', 'Level', 'Quest', 'Battle', 'Arena', 'Victory', 'Champion', 'Mission'],
    contexts: ['Fight', 'Mode', 'Stage', 'Zone', 'Achievement Unlocked', 'Game On'],
  },
};

export const ROMANTIC_EVENING_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'R&B',
    'soul',
    'jazz',
    'neo soul',
    'quiet storm',
    'smooth jazz',
    'slow jams',
    'contemporary R&B',
  ],
  instruments: [
    ['Rhodes', 'bass', 'soft drums'],
    ['piano', 'strings', 'brushes'],
    ['saxophone', 'guitar', 'percussion'],
    ['synth pad', 'bass guitar', 'shaker'],
    ['Wurlitzer', 'upright bass', 'finger snaps'],
    ['electric piano', 'muted trumpet', 'light cymbals'],
  ],
  moods: ['intimate', 'sensual', 'tender', 'warm', 'romantic', 'smooth', 'sultry', 'passionate'],
  titleWords: {
    adjectives: ['Tender', 'Soft', 'Warm', 'Sweet', 'Close', 'Deep', 'Gentle', 'Quiet'],
    nouns: ['Touch', 'Night', 'Heart', 'Moment', 'Kiss', 'Love', 'Whisper', 'Embrace'],
    contexts: ['for Two', 'After Dark', 'Candlelight', 'Together', 'Just Us', 'Tonight'],
  },
};

export const MEDITATION_ZEN_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'ambient',
    'new age',
    'drone',
    'meditation',
    'spa',
    'healing',
    'soundscape',
    'nature sounds',
  ],
  instruments: [
    ['singing bowls', 'ambient pad', 'soft bells'],
    ['crystal bowls', 'drone', 'nature sounds'],
    ['handpan', 'soft synth', 'wind chimes'],
    ['shakuhachi', 'pad', 'gentle percussion'],
    ['Tibetan bowls', 'atmospheric textures', 'water sounds'],
    ['koto', 'evolving pad', 'rain sounds'],
  ],
  moods: ['peaceful', 'serene', 'transcendent', 'calm', 'healing', 'still', 'grounded', 'centered'],
  titleWords: {
    adjectives: ['Deep', 'Still', 'Calm', 'Sacred', 'Pure', 'Infinite', 'Quiet', 'Inner'],
    nouns: ['Breath', 'Peace', 'Stillness', 'Light', 'Space', 'Being', 'Mind', 'Spirit'],
    contexts: ['Within', 'Beyond', 'Eternal', 'Now', 'Awakening', 'Letting Go'],
  },
};

export const CREATIVE_FLOW_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'lo-fi',
    'ambient',
    'post-rock',
    'indie',
    'electronic',
    'downtempo',
    'trip hop',
    'neo-classical',
  ],
  instruments: [
    ['piano', 'ambient pad', 'soft drums'],
    ['guitar', 'synth', 'light percussion'],
    ['Rhodes', 'tape texture', 'bass'],
    ['modular synth', 'strings', 'shaker'],
    ['vibraphone', 'ambient synth', 'subtle drums'],
    ['prepared piano', 'textures', 'glitchy percussion'],
  ],
  moods: ['focused', 'inspired', 'flowing', 'contemplative', 'creative', 'open', 'imaginative', 'expansive'],
  titleWords: {
    adjectives: ['Clear', 'Open', 'Free', 'Fluid', 'Deep', 'Bright', 'Wide', 'Fresh'],
    nouns: ['Flow', 'Ideas', 'Canvas', 'Mind', 'Vision', 'Spark', 'Space', 'Process'],
    contexts: ['in Motion', 'Unfolding', 'Creating', 'Thinking', 'Making', 'in the Zone'],
  },
};

export const PARTY_NIGHT_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'house',
    'disco',
    'pop',
    'funk',
    'dance pop',
    'nu-disco',
    'electro house',
    'dance',
  ],
  instruments: [
    ['four on the floor kick', 'bass', 'synth'],
    ['disco strings', 'claps', 'funky guitar'],
    ['house piano', 'hi-hats', 'bass drop'],
    ['synth stabs', 'handclaps', 'cowbell'],
    ['arpeggiator', 'punchy bass', 'snare'],
    ['brass section', 'slap bass', 'groovy drums'],
  ],
  moods: ['euphoric', 'energetic', 'celebratory', 'fun', 'ecstatic', 'party', 'wild', 'pumped'],
  titleWords: {
    adjectives: ['All', 'Big', 'Hot', 'Wild', 'Electric', 'Blazing', 'Crazy', 'Epic'],
    nouns: ['Night', 'Party', 'Floor', 'Club', 'Lights', 'Fever', 'Dance', 'Groove'],
    contexts: ['Tonight', 'til Dawn', 'Downtown', 'All Night', "Let's Go", 'No Sleep'],
  },
};
