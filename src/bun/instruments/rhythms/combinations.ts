export const CROSS_RHYTHM_COMBINATIONS = {
  groove_to_drive: {
    name: 'Groove to Drive',
    rhythms: ['hemiola', 'afrobeat'] as const,
    keywords: ['building rhythm', 'energy build', 'groove to drive', 'dance build'],
    description: 'Relaxed shuffle building to hypnotic drive',
    emotionalArc: 'Groove → Drive',
    sectionGuide: {
      introVerse: 'Hemiola groove (2:3), relaxed swing, laid-back shuffle',
      chorusBridgeOutro: 'Afrobeat drive (4:3), hypnotic pulse, relentless energy',
    },
    bestInstruments: ['layered percussion', 'syncopated bass', 'cross-rhythm hi-hats'],
  },
  tension_release: {
    name: 'Tension Release',
    rhythms: ['afrobeat', 'hemiola'] as const,
    keywords: ['tension release', 'drop', 'build and release', 'satisfying rhythm'],
    description: 'Driving tension resolving to groovy satisfaction',
    emotionalArc: 'Tension → Release',
    sectionGuide: {
      introVerse: 'Afrobeat drive (4:3), building tension, anticipation',
      chorusBridgeOutro: 'Hemiola groove (2:3), satisfying release, swing resolution',
    },
    bestInstruments: ['building drums', 'tension bass', 'release percussion'],
  },
  afrobeat_journey: {
    name: 'Afrobeat Journey',
    rhythms: ['hemiola', 'african_compound'] as const,
    keywords: ['afrobeat journey', 'world rhythm', 'african fusion', 'organic build'],
    description: 'Western swing meeting African compound rhythms',
    emotionalArc: 'Swing → Interlocking',
    sectionGuide: {
      introVerse: 'Hemiola swing (2:3), accessible groove, familiar feel',
      chorusBridgeOutro: 'African 6/8, interlocking patterns, trance-like weaving',
    },
    bestInstruments: ['djembe', 'shaker', 'kalimba', 'bass'],
  },
  complex_simple: {
    name: 'Complex to Simple',
    rhythms: ['shifting', 'hemiola'] as const,
    keywords: ['complex to simple', 'prog resolution', 'math to groove', 'settle down'],
    description: 'Disorienting complexity resolving to grounded groove',
    emotionalArc: 'Chaos → Ground',
    sectionGuide: {
      introVerse: 'Shifting complex (5:4), disorienting, challenging',
      chorusBridgeOutro: 'Hemiola groove (2:3), grounded resolution, satisfying landing',
    },
    bestInstruments: ['prog drums', 'electric guitar', 'bass', 'synth'],
  },
} as const;

export const MULTI_RHYTHM_COMBINATIONS = {
  complexity_build: {
    name: 'Complexity Build',
    rhythms: ['hemiola', 'afrobeat', 'shifting'] as const,
    keywords: ['complexity build', 'building polyrhythm', 'evolving rhythm', 'progressive build'],
    description: 'Groove → Drive → Chaos - escalating rhythmic intensity',
    emotionalArc: 'Groove → Drive → Chaos',
    sectionGuide: {
      introVerse: 'Hemiola groove (2:3), relaxed swing, establishes pulse',
      chorus: 'Afrobeat drive (4:3), hypnotic intensity, building energy',
      bridgeOutro: 'Shifting chaos (5:4), peak complexity, rhythmic climax',
    },
    bestInstruments: ['layered percussion', 'polyrhythmic bass', 'interlocking synths'],
  },
  triplet_exploration: {
    name: 'Triplet Exploration',
    rhythms: ['hemiola', 'limping', 'reverse_hemiola'] as const,
    keywords: ['triplet exploration', 'jazzy rhythm', 'fusion rhythm', 'triplet journey'],
    description: 'Exploring the triplet family - shuffle to tension to flow',
    emotionalArc: 'Shuffle → Tension → Flow',
    sectionGuide: {
      introVerse: 'Hemiola shuffle (2:3), jazzy swing, comfortable groove',
      chorus: 'Limping tension (3:4), uneven anticipation, building',
      bridgeOutro: 'Reverse hemiola flow (3:2), liquid resolution, triplet cascade',
    },
    bestInstruments: ['brushes', 'upright bass', 'Rhodes', 'vibraphone'],
  },
  odd_journey: {
    name: 'Odd Time Journey',
    rhythms: ['limping', 'shifting', 'evolving'] as const,
    keywords: ['odd journey', 'prog rhythm', 'math rock', 'complex throughout', 'odd time'],
    description: 'Journey through increasingly complex odd-time feels',
    emotionalArc: 'Hypnotic → Complex → Intricate',
    sectionGuide: {
      introVerse: 'Limping feel (3:4), uneven but graspable, tension',
      chorus: 'Shifting complex (5:4), disorienting, intellectual',
      bridgeOutro: 'Evolving intricate (7:4), peak complexity, never settling',
    },
    bestInstruments: ['prog drums', 'distorted guitar', 'synth bass', 'complex percussion'],
  },
  tension_arc: {
    name: 'Full Tension Arc',
    rhythms: ['afrobeat', 'shifting', 'hemiola'] as const,
    keywords: ['tension arc', 'full journey', 'build and resolve', 'complete rhythm arc'],
    description: 'Drive → Chaos → Resolution - complete rhythmic journey',
    emotionalArc: 'Drive → Chaos → Resolution',
    sectionGuide: {
      introVerse: 'Afrobeat drive (4:3), propulsive energy, forward motion',
      chorus: 'Shifting chaos (5:4), disorienting peak, maximum tension',
      bridgeOutro: 'Hemiola resolution (2:3), satisfying groove, earned release',
    },
    bestInstruments: ['dynamic drums', 'tension bass', 'release percussion', 'synth pads'],
  },
} as const;

export const ALL_POLYRHYTHM_COMBINATIONS = {
  ...CROSS_RHYTHM_COMBINATIONS,
  ...MULTI_RHYTHM_COMBINATIONS,
} as const;

export type CrossRhythmCombination = keyof typeof CROSS_RHYTHM_COMBINATIONS;
export type MultiRhythmCombination = keyof typeof MULTI_RHYTHM_COMBINATIONS;
export type PolyrhythmCombinationType = keyof typeof ALL_POLYRHYTHM_COMBINATIONS;
