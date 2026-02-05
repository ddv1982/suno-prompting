export type Subdivision = 'quarter' | 'eighth';
export type Complexity = 'standard' | 'moderate' | 'complex' | 'very_complex';

export interface TimeSignatureDefinition {
  readonly name: string;
  readonly signature: string;
  readonly beats: number;
  readonly subdivision: Subdivision;
  readonly keywords: readonly string[];
  readonly groupings: readonly string[];
  readonly description: string;
  readonly feel: string;
  readonly characteristics: readonly string[];
  readonly famousExamples: readonly string[];
  readonly bestGenres: readonly string[];
  readonly complexity: Complexity;
}

export const TIME_SIGNATURES = {
  time_4_4: {
    name: 'Common Time',
    signature: '4/4',
    beats: 4,
    subdivision: 'quarter' as const,
    keywords: ['4/4', 'common time', 'four four', 'standard'],
    groupings: ['2+2', '4'],
    description: 'Standard pulse - the foundation of most popular music',
    feel: 'Steady, predictable, grounded',
    characteristics: [
      'Most natural and familiar meter',
      'Strong beats on 1 and 3',
      'Backbeat on 2 and 4 in rock/pop',
      'Universal foundation for most genres',
    ],
    famousExamples: ['Most pop, rock, electronic music'],
    bestGenres: ['pop', 'rock', 'electronic', 'hip-hop', 'R&B'],
    complexity: 'standard' as const,
  },
  time_3_4: {
    name: 'Waltz Time',
    signature: '3/4',
    beats: 3,
    subdivision: 'quarter' as const,
    keywords: ['3/4', 'waltz', 'three four', 'triple meter'],
    groupings: ['3'],
    description: 'Elegant triple meter - the waltz feel',
    feel: 'Dancing, lilting, elegant',
    characteristics: [
      'Strong downbeat followed by two lighter beats',
      'Natural swaying, dancing quality',
      'Classical elegance meets folk simplicity',
      'Creates circular, flowing motion',
    ],
    famousExamples: [
      'Waltz of the Flowers',
      'Norwegian Wood (Beatles)',
      'Manic Depression (Hendrix)',
    ],
    bestGenres: ['classical', 'folk', 'country', 'jazz waltz'],
    complexity: 'standard' as const,
  },
  time_6_8: {
    name: 'Compound Duple',
    signature: '6/8',
    beats: 6,
    subdivision: 'eighth' as const,
    keywords: ['6/8', 'six eight', 'compound', 'jig', 'shuffle'],
    groupings: ['3+3'],
    description: 'Two groups of three - rolling, compound feel',
    feel: 'Rolling, swinging, maritime',
    characteristics: [
      'Feels like 2 beats with triplet subdivision',
      'Natural shuffle and swing quality',
      'Sea shanty and Irish jig territory',
      'Smooth, rolling momentum',
    ],
    famousExamples: ['House of the Rising Sun', 'We Are the Champions', 'Nothing Else Matters'],
    bestGenres: ['folk', 'rock ballads', 'irish', 'blues'],
    complexity: 'standard' as const,
  },
  time_5_4: {
    name: '5/4 Time',
    signature: '5/4',
    beats: 5,
    subdivision: 'quarter' as const,
    keywords: ['5/4', 'five four', 'take five', 'quintuple', 'five time'],
    groupings: ['3+2', '2+3'],
    description: 'Off-balance drive with unique momentum',
    feel: 'Asymmetrical anticipation, intellectual groove',
    characteristics: [
      '3+2 feels like "long-short" (DA-da-da DA-da)',
      '2+3 feels like "short-long" (DA-da DA-da-da)',
      'Creates constant forward motion',
      'Intellectual yet danceable when mastered',
      'Signature sound of cool jazz',
    ],
    famousExamples: ['Take Five (Dave Brubeck)', 'Mission Impossible Theme', '15 Step (Radiohead)'],
    bestGenres: ['jazz', 'prog rock', 'film scores', 'math rock'],
    complexity: 'moderate' as const,
  },
  time_5_8: {
    name: '5/8 Time',
    signature: '5/8',
    beats: 5,
    subdivision: 'eighth' as const,
    keywords: ['5/8', 'five eight', 'quick five', 'balkan five'],
    groupings: ['3+2', '2+3'],
    description: 'Quick, agile asymmetry',
    feel: 'Nimble, dancing, Eastern European flavor',
    characteristics: [
      'Faster feel than 5/4 due to eighth note pulse',
      'Common in Balkan and Turkish music',
      'Light, skipping quality',
      'Great for intricate melodic lines',
    ],
    famousExamples: ['Balkan folk dances', 'Seven Days (Sting - alternates)'],
    bestGenres: ['balkan', 'world', 'prog', 'fusion'],
    complexity: 'moderate' as const,
  },
  time_7_8: {
    name: '7/8 Time',
    signature: '7/8',
    beats: 7,
    subdivision: 'eighth' as const,
    keywords: ['7/8', 'seven eight', 'balkan', 'aksak', 'limping'],
    groupings: ['2+2+3', '3+2+2', '2+3+2'],
    description: 'Limping, urgent propulsion',
    feel: 'Urgent, driving, slightly off-kilter',
    characteristics: [
      '2+2+3 is most common (short-short-long)',
      'Creates a "limping" or galloping feel',
      'Foundational to Balkan music',
      'Adds urgency and edge to rock',
      'Pink Floyd made it mainstream',
    ],
    famousExamples: [
      'Money (Pink Floyd)',
      'Balkan folk music',
      'Solsbury Hill (Peter Gabriel - 7/4)',
    ],
    bestGenres: ['prog rock', 'balkan', 'metal', 'fusion'],
    complexity: 'moderate' as const,
  },
  time_7_4: {
    name: '7/4 Time',
    signature: '7/4',
    beats: 7,
    subdivision: 'quarter' as const,
    keywords: ['7/4', 'seven four', 'expansive odd', 'prog seven'],
    groupings: ['4+3', '3+4', '2+2+3'],
    description: 'Expansive odd meter with room to breathe',
    feel: 'Spacious yet asymmetrical, epic',
    characteristics: [
      'More spacious than 7/8',
      '4+3 feels like 4/4 with extra beat',
      '3+4 feels like waltz extending into rock',
      'Epic, cinematic quality',
    ],
    famousExamples: ['Money (Pink Floyd)', 'Solsbury Hill (Peter Gabriel)'],
    bestGenres: ['prog rock', 'art rock', 'film scores'],
    complexity: 'moderate' as const,
  },
  time_9_8: {
    name: '9/8 Time',
    signature: '9/8',
    beats: 9,
    subdivision: 'eighth' as const,
    keywords: ['9/8', 'nine eight', 'slip jig', 'compound triple'],
    groupings: ['3+3+3', '2+2+2+3', '2+3+2+2'],
    description: 'Lilting triple compound or additive patterns',
    feel: 'Flowing, dancing, Celtic magic',
    characteristics: [
      '3+3+3 creates smooth compound triple feel',
      'Additive patterns (2+2+2+3) add edge',
      'Signature of Irish slip jigs',
      'Blue Rondo showed jazz possibilities',
      'Can feel like extended waltz',
    ],
    famousExamples: [
      'Blue Rondo à la Turk (Brubeck)',
      'Irish slip jigs',
      'Paranoid Android section (Radiohead)',
    ],
    bestGenres: ['irish', 'jazz', 'prog', 'folk'],
    complexity: 'moderate' as const,
  },
  time_11_8: {
    name: '11/8 Time',
    signature: '11/8',
    beats: 11,
    subdivision: 'eighth' as const,
    keywords: ['11/8', 'eleven eight', 'tool time', 'prog eleven'],
    groupings: ['3+3+3+2', '2+3+3+3', '3+3+2+3', '2+2+3+2+2'],
    description: 'Complex, constantly shifting meter',
    feel: 'Intellectual, hypnotic, never settling',
    characteristics: [
      'Multiple valid grouping patterns',
      'Tool made this signature famous',
      'Creates hypnotic, trance-like complexity',
      'Challenges both performer and listener',
      'Mathematical beauty in motion',
    ],
    famousExamples: ['Lateralus (Tool)', 'Unsquare Dance (Brubeck - 7/4)'],
    bestGenres: ['prog metal', 'prog rock', 'jazz fusion'],
    complexity: 'complex' as const,
  },
  time_13_8: {
    name: '13/8 Time',
    signature: '13/8',
    beats: 13,
    subdivision: 'eighth' as const,
    keywords: ['13/8', 'thirteen eight', 'king crimson', 'extreme prog'],
    groupings: ['3+3+3+2+2', '3+3+2+3+2', '2+3+3+3+2'],
    description: 'Extreme complexity for the adventurous',
    feel: 'Disorienting, virtuosic, avant-garde',
    characteristics: [
      'Prime number creates maximum asymmetry',
      'Multiple subdivision strategies possible',
      'King Crimson territory',
      'Requires deep commitment from listener',
      'Peak progressive complexity',
    ],
    famousExamples: ['King Crimson works', 'Advanced prog metal'],
    bestGenres: ['prog rock', 'prog metal', 'avant-garde'],
    complexity: 'very_complex' as const,
  },
  time_15_8: {
    name: '15/8 Time',
    signature: '15/8',
    beats: 15,
    subdivision: 'eighth' as const,
    keywords: ['15/8', 'fifteen eight', 'extreme odd'],
    groupings: ['3+3+3+3+3', '4+4+4+3', '3+3+3+2+2+2'],
    description: 'Extended compound or complex additive',
    feel: 'Expansive, flowing or fractured',
    characteristics: [
      '3+3+3+3+3 feels like extended compound',
      'Additive patterns create jagged feel',
      'Can feel like 5 groups of triplets',
      'Rare but powerful when used well',
    ],
    famousExamples: ['Experimental prog works'],
    bestGenres: ['prog', 'experimental', 'avant-garde'],
    complexity: 'very_complex' as const,
  },
} as const;

export type TimeSignatureType = keyof typeof TIME_SIGNATURES;

export interface TimeSignatureJourneyDefinition {
  readonly name: string;
  readonly signatures: readonly TimeSignatureType[];
  readonly keywords: readonly string[];
  readonly description: string;
  readonly emotionalArc: string;
  readonly sectionGuide: {
    readonly introVerse: string;
    readonly chorus?: string;
    readonly chorusBridgeOutro?: string;
    readonly bridgeOutro?: string;
  };
  readonly bestGenres: readonly string[];
}

export const TIME_SIGNATURE_JOURNEYS = {
  prog_odyssey: {
    name: 'Prog Odyssey',
    signatures: ['time_4_4', 'time_7_8', 'time_5_4'] as const,
    keywords: ['prog odyssey', 'meter journey', 'time signature journey', 'prog exploration'],
    description: 'Familiar ground to odd territory to resolution',
    emotionalArc: 'Grounded → Urgent → Expansive',
    sectionGuide: {
      introVerse: '4/4 foundation - establish familiarity, build trust',
      chorus: '7/8 urgency - add edge and drive, limping intensity',
      bridgeOutro: '5/4 resolution - intellectual satisfaction, unique landing',
    },
    bestGenres: ['prog rock', 'art rock', 'prog metal'],
  },
  balkan_fusion: {
    name: 'Balkan Fusion',
    signatures: ['time_7_8', 'time_9_8', 'time_11_8'] as const,
    keywords: ['balkan fusion', 'eastern meters', 'aksak journey', 'odd meter fusion'],
    description: 'Journey through Balkan-influenced odd meters',
    emotionalArc: 'Limping → Flowing → Hypnotic',
    sectionGuide: {
      introVerse: '7/8 drive - establish the Balkan feel, 2+2+3 pulse',
      chorus: '9/8 flow - open up into lilting dance, 3+3+3 smoothness',
      bridgeOutro: '11/8 hypnosis - peak complexity, trance-like resolution',
    },
    bestGenres: ['world fusion', 'jazz fusion', 'prog'],
  },
  jazz_exploration: {
    name: 'Jazz Time Exploration',
    signatures: ['time_4_4', 'time_5_4', 'time_9_8'] as const,
    keywords: ['jazz exploration', 'brubeck style', 'cool jazz meters', 'jazz odd time'],
    description: 'Classic jazz journey through Brubeck-influenced meters',
    emotionalArc: 'Swing → Cool → Dance',
    sectionGuide: {
      introVerse: '4/4 swing - classic jazz foundation, familiar groove',
      chorus: '5/4 cool - Take Five territory, intellectual cool',
      bridgeOutro: '9/8 dance - Blue Rondo energy, Turkish-jazz fusion',
    },
    bestGenres: ['jazz', 'cool jazz', 'jazz fusion'],
  },
  math_rock_descent: {
    name: 'Math Rock Descent',
    signatures: ['time_5_4', 'time_7_8', 'time_11_8'] as const,
    keywords: ['math rock', 'math descent', 'increasing complexity', 'odd descent'],
    description: 'Progressively deeper into mathematical complexity',
    emotionalArc: 'Intellectual → Urgent → Labyrinthine',
    sectionGuide: {
      introVerse: '5/4 entry - accessible odd meter, 3+2 groove',
      chorus: '7/8 intensity - ratchet up the urgency, limping drive',
      bridgeOutro: '11/8 labyrinth - full complexity, mathematical climax',
    },
    bestGenres: ['math rock', 'prog metal', 'experimental'],
  },
  celtic_journey: {
    name: 'Celtic Journey',
    signatures: ['time_6_8', 'time_9_8', 'time_3_4'] as const,
    keywords: ['celtic journey', 'irish meters', 'jig to waltz', 'celtic fusion'],
    description: 'Through the compound meters of Celtic tradition',
    emotionalArc: 'Rolling → Dancing → Elegance',
    sectionGuide: {
      introVerse: '6/8 roll - sea shanty energy, compound duple swing',
      chorus: '9/8 slip jig - nimble Celtic dance, flowing triplets',
      bridgeOutro: '3/4 waltz - elegant resolution, sweeping finale',
    },
    bestGenres: ['celtic', 'folk', 'folk rock', 'irish'],
  },
  metal_complexity: {
    name: 'Metal Complexity',
    signatures: ['time_4_4', 'time_7_4', 'time_13_8'] as const,
    keywords: ['metal complexity', 'djent journey', 'prog metal meters', 'heavy odd time'],
    description: 'From crushing foundation to extreme complexity',
    emotionalArc: 'Crushing → Epic → Chaotic',
    sectionGuide: {
      introVerse: '4/4 crush - heavy foundation, establish the weight',
      chorus: '7/4 epic - expansive odd feel, breathing room in chaos',
      bridgeOutro: '13/8 chaos - maximum disorientation, virtuosic climax',
    },
    bestGenres: ['prog metal', 'djent', 'technical metal'],
  },
  gentle_odd: {
    name: 'Gentle Odd',
    signatures: ['time_3_4', 'time_5_4', 'time_6_8'] as const,
    keywords: ['gentle odd', 'soft odd time', 'accessible odd', 'subtle complexity'],
    description: 'Accessible odd meters for softer genres',
    emotionalArc: 'Waltz → Thoughtful → Rolling',
    sectionGuide: {
      introVerse: '3/4 waltz - gentle sway, classic elegance',
      chorus: '5/4 thought - subtle complexity, intellectual depth',
      bridgeOutro: '6/8 resolution - smooth compound, satisfying roll',
    },
    bestGenres: ['indie', 'folk', 'singer-songwriter', 'ambient'],
  },
} as const;

export type TimeSignatureJourneyType = keyof typeof TIME_SIGNATURE_JOURNEYS;
