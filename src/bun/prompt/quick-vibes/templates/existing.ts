/**
 * Existing Quick Vibes Templates
 *
 * Original 6 category templates from the initial Quick Vibes implementation.
 *
 * @module prompt/quick-vibes/templates/existing
 */

import type { QuickVibesTemplate } from '@bun/prompt/quick-vibes/types';

// =============================================================================
// Original 6 Category Templates
// =============================================================================

export const LOFI_STUDY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'lo-fi',
    'lo-fi hip hop',
    'chillhop',
    'lo-fi beats',
    'study beats',
    'lo-fi jazz',
    'downtempo',
    'trip hop',
  ],
  instruments: [
    ['Rhodes piano', 'vinyl crackle', 'soft drums'],
    ['mellow synth pad', 'boom bap drums', 'bass'],
    ['jazz guitar', 'lo-fi drums', 'warm bass'],
    ['electric piano', 'tape hiss', 'snare'],
    ['soft keys', 'vinyl texture', 'kick drum'],
    ['Wurlitzer', 'ambient pad', 'brushed drums'],
  ],
  moods: ['relaxed', 'focused', 'mellow', 'dreamy', 'calm', 'peaceful', 'nostalgic', 'cozy'],
  titleWords: {
    adjectives: ['Warm', 'Soft', 'Mellow', 'Dreamy', 'Gentle', 'Quiet', 'Hazy', 'Dusty'],
    nouns: ['Beats', 'Vibes', 'Session', 'Study', 'Notes', 'Pages', 'Thoughts', 'Moments'],
    contexts: ['to Study To', 'for Focus', 'Late Night', 'Afternoon', 'Rainy Day', 'Sunday'],
  },
};

export const CAFE_COFFEESHOP_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'cafe jazz',
    'bossa nova',
    'acoustic jazz',
    'smooth jazz',
    'coffee shop',
    'easy listening',
    'soft jazz',
    'jazz lounge',
  ],
  instruments: [
    ['acoustic guitar', 'upright bass', 'brushed drums'],
    ['piano', 'double bass', 'soft percussion'],
    ['nylon guitar', 'stand-up bass', 'light drums'],
    ['jazz guitar', 'acoustic bass', 'bongos'],
    ['grand piano', 'bass', 'shaker'],
    ['classical guitar', 'cello', 'light cymbals'],
  ],
  moods: ['cozy', 'warm', 'intimate', 'relaxed', 'sophisticated', 'gentle', 'inviting', 'mellow'],
  titleWords: {
    adjectives: ['Cozy', 'Warm', 'Sunny', 'Morning', 'Golden', 'Soft', 'Gentle', 'Sweet'],
    nouns: ['Cafe', 'Coffee', 'Espresso', 'Latte', 'Morning', 'Corner', 'Brew', 'Jazz'],
    contexts: ['Sunday Morning', 'Afternoon', 'by the Window', 'Downtown', 'in Paris', 'Sessions'],
  },
};

export const AMBIENT_FOCUS_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'ambient',
    'atmospheric',
    'drone ambient',
    'space ambient',
    'dark ambient',
    'minimal ambient',
    'ethereal',
    'soundscape',
  ],
  instruments: [
    ['synthesizer pad', 'reverb textures', 'soft drones'],
    ['ambient synth', 'field recordings', 'subtle bells'],
    ['pad layers', 'atmospheric textures', 'gentle hum'],
    ['warm drone', 'glassy synth', 'distant chimes'],
    ['evolving pad', 'granular textures', 'soft noise'],
    ['modular synth', 'tape delay', 'subtle harmonics'],
  ],
  moods: [
    'meditative',
    'focused',
    'spacious',
    'ethereal',
    'deep',
    'contemplative',
    'serene',
    'expansive',
  ],
  titleWords: {
    adjectives: ['Deep', 'Floating', 'Drifting', 'Endless', 'Quiet', 'Still', 'Vast', 'Soft'],
    nouns: ['Space', 'Drift', 'Flow', 'Waves', 'Horizons', 'Depths', 'Light', 'Air'],
    contexts: ['for Focus', 'in Space', 'at Dawn', 'Through Clouds', 'Beyond', 'Within'],
  },
};

export const LATENIGHT_CHILL_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'chill',
    'downtempo',
    'chillout',
    'late night',
    'nocturnal',
    'night drive',
    'nu jazz',
    'lounge',
  ],
  instruments: [
    ['electric piano', 'bass synth', 'soft drums'],
    ['Rhodes', 'sub bass', 'electronic drums'],
    ['synth pad', 'warm bass', 'brushed snare'],
    ['mellow keys', 'deep bass', 'light percussion'],
    ['jazz organ', 'fretless bass', 'rim clicks'],
    ['ambient pad', 'bass guitar', 'hi-hats'],
  ],
  moods: ['nocturnal', 'mellow', 'smooth', 'sultry', 'relaxed', 'intimate', 'cool', 'laid-back'],
  titleWords: {
    adjectives: ['Late', 'Midnight', 'Night', 'Dark', 'Quiet', 'Urban', 'Cool', 'Slow'],
    nouns: ['Drive', 'City', 'Streets', 'Lights', 'Hours', 'Moon', 'Shadows', 'Vibes'],
    contexts: ['at 2AM', 'Downtown', 'After Hours', 'in the City', 'on Empty Streets', 'Alone'],
  },
};

export const COZY_RAINY_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'acoustic',
    'folk',
    'indie folk',
    'soft rock',
    'chamber folk',
    'singer-songwriter',
    'intimate acoustic',
    'warm acoustic',
  ],
  instruments: [
    ['acoustic guitar', 'soft piano', 'cello'],
    ['fingerpicked guitar', 'strings', 'light percussion'],
    ['piano', 'violin', 'acoustic bass'],
    ['nylon guitar', 'flute', 'soft drums'],
    ['mandolin', 'piano', 'upright bass'],
    ['acoustic guitar', 'clarinet', 'brushed snare'],
  ],
  moods: ['cozy', 'warm', 'nostalgic', 'comforting', 'peaceful', 'gentle', 'intimate', 'tender'],
  titleWords: {
    adjectives: ['Rainy', 'Cozy', 'Warm', 'Quiet', 'Soft', 'Grey', 'Misty', 'Gentle'],
    nouns: ['Window', 'Rain', 'Afternoon', 'Blanket', 'Tea', 'Fireplace', 'Home', 'Comfort'],
    contexts: ['by the Fire', 'at Home', 'on a Sunday', 'in Autumn', 'with Tea', 'Inside'],
  },
};

export const LOFI_CHILL_TEMPLATE: QuickVibesTemplate = {
  genres: [
    'lo-fi chill',
    'lo-fi',
    'chill beats',
    'chillhop',
    'lo-fi soul',
    'lo-fi r&b',
    'relaxing beats',
    'bedroom pop',
  ],
  instruments: [
    ['lo-fi piano', 'vinyl crackle', 'mellow drums'],
    ['soft synth', 'tape saturation', 'boom bap'],
    ['electric piano', 'lo-fi texture', 'snare'],
    ['sampled piano', 'warm bass', 'hi-hats'],
    ['Rhodes', 'subtle noise', 'kick drum'],
    ['soft keys', 'ambient texture', 'percussion'],
  ],
  moods: ['chill', 'relaxed', 'mellow', 'easy', 'laid-back', 'peaceful', 'dreamy', 'soft'],
  titleWords: {
    adjectives: ['Chill', 'Easy', 'Soft', 'Mellow', 'Lazy', 'Slow', 'Warm', 'Low'],
    nouns: ['Beats', 'Vibes', 'Days', 'Nights', 'Waves', 'Clouds', 'Dreams', 'Tapes'],
    contexts: ['at Sunset', 'on Repeat', 'Forever', 'for Days', 'All Night', 'Always'],
  },
};
