export type InstrumentCategory = 'harmonic' | 'pad' | 'color' | 'movement' | 'rare';

export type InstrumentEntry = {
  readonly canonical: string;
  readonly category: InstrumentCategory;
  readonly aliases: readonly string[];
};

export const INSTRUMENT_REGISTRY: readonly InstrumentEntry[] = [
  // Harmonic anchors
  { canonical: 'prepared piano', category: 'harmonic', aliases: ['prepared piano'] },
  { canonical: 'felt piano', category: 'harmonic', aliases: ['piano', 'keys', 'soft piano', 'muted piano'] },
  { canonical: 'grand piano', category: 'harmonic', aliases: ['concert grand', 'acoustic piano', 'grand'] },
  { canonical: 'honky tonk piano', category: 'harmonic', aliases: ['barroom piano', 'saloon piano', 'boogie piano'] },
  { canonical: 'harmonium', category: 'harmonic', aliases: ['pump organ'] },
  { canonical: 'harpsichord', category: 'harmonic', aliases: ['cembalo'] },
  { canonical: 'celesta', category: 'harmonic', aliases: ['celeste'] },
  { canonical: 'strings', category: 'harmonic', aliases: ['string section', 'orchestral strings', 'string ensemble'] },
  { canonical: 'pizzicato strings', category: 'harmonic', aliases: ['pizz strings', 'plucked strings', 'staccato strings'] },
  { canonical: 'guitar', category: 'harmonic', aliases: ['electric guitar', 'clean guitar'] },
  { canonical: 'distorted guitar', category: 'harmonic', aliases: ['overdriven guitar', 'crunch guitar', 'high-gain guitar', 'distortion guitar', 'power chords'] },
  { canonical: 'Fender Stratocaster', category: 'harmonic', aliases: ['Stratocaster', 'Strat', 'Fender Strat', 'Strat guitar'] },
  { canonical: 'Telecaster', category: 'harmonic', aliases: ['Fender Telecaster', 'Tele', 'twangy guitar', 'twangy electric guitar'] },
  { canonical: 'hollowbody guitar', category: 'harmonic', aliases: ['semi-hollow guitar', 'archtop guitar', 'jazz guitar'] },
  { canonical: 'acoustic guitar', category: 'harmonic', aliases: ['folk guitar', 'steel string guitar'] },
  { canonical: 'nylon string guitar', category: 'harmonic', aliases: ['classical guitar', 'spanish guitar', 'nylon guitar'] },
  { canonical: 'slide guitar', category: 'harmonic', aliases: ['bottleneck guitar', 'bottleneck slide'] },
  { canonical: 'wah guitar', category: 'harmonic', aliases: ['wah-wah guitar', 'wah pedal guitar'] },
  { canonical: 'tremolo guitar', category: 'harmonic', aliases: ['tremolo picking', 'surf guitar'] },
  { canonical: 'fretless guitar', category: 'harmonic', aliases: [] },
  { canonical: 'processed guitar', category: 'harmonic', aliases: ['ambient guitar', 'effected guitar'] },
  { canonical: 'e-bow guitar', category: 'harmonic', aliases: ['ebow guitar', 'e-bow', 'sustained guitar'] },

  // Extended-range guitars (metal/modern)
  { canonical: 'seven-string guitar', category: 'harmonic', aliases: ['7-string', '7 string guitar', '7-string electric'] },
  { canonical: 'eight-string guitar', category: 'harmonic', aliases: ['8-string', '8 string guitar', '8-string electric'] },
  { canonical: 'baritone guitar', category: 'harmonic', aliases: ['bari guitar', 'baritone electric'] },

  // Folk Traditional
  { canonical: 'hurdy gurdy', category: 'rare', aliases: ['hurdy-gurdy', 'wheel fiddle', 'vielle'] },
  { canonical: 'nyckelharpa', category: 'rare', aliases: ['keyed fiddle', 'swedish keyed fiddle'] },
  { canonical: 'concertina', category: 'color', aliases: ['english concertina', 'anglo concertina'] },
  { canonical: 'jaw harp', category: 'rare', aliases: ['jews harp', 'mouth harp', 'ozark harp'] },

  // Country/Americana
  { canonical: 'dobro', category: 'harmonic', aliases: ['resonator guitar', 'resophonic guitar', 'reso guitar'] },
  { canonical: 'lap steel guitar', category: 'harmonic', aliases: ['lap steel', 'hawaiian guitar', 'console steel'] },
  { canonical: 'autoharp', category: 'harmonic', aliases: ['auto harp', 'chord zither'] },
  { canonical: 'hammered dulcimer', category: 'harmonic', aliases: ['hammer dulcimer', 'cimbalom'] },
  { canonical: 'mountain dulcimer', category: 'harmonic', aliases: ['appalachian dulcimer', 'lap dulcimer'] },
  { canonical: 'washboard', category: 'movement', aliases: ['frottoir', 'rubboard'] },

  // Pads and synths
  { canonical: 'synth pad', category: 'pad', aliases: ['pad', 'pads', 'synth pads'] },
  { canonical: 'analog synth pads', category: 'pad', aliases: ['analog pads', 'warm pads'] },
  { canonical: 'analog synth', category: 'pad', aliases: ['analog synthesizer', 'analogue synth'] },
  { canonical: 'digital synth', category: 'pad', aliases: ['digital synthesizer'] },
  { canonical: 'FM synth', category: 'pad', aliases: ['FM synthesis', 'DX7'] },
  { canonical: 'Moog synth', category: 'pad', aliases: ['Moog', 'Minimoog'] },
  { canonical: 'synth', category: 'pad', aliases: ['synthesizer', 'synths'] },
  { canonical: 'crystalline synth pads', category: 'pad', aliases: ['crystal pads', 'glassy pads'] },
  { canonical: 'ambient pad', category: 'pad', aliases: ['atmospheric pad', 'drone pad'] },

  // Synth variants (workstation-inspired)
  { canonical: 'synth strings', category: 'pad', aliases: ['string synth', 'synthetic strings'] },
  { canonical: 'synth brass', category: 'pad', aliases: ['brass synth', 'synthetic brass'] },
  { canonical: 'synth choir', category: 'pad', aliases: ['choir synth', 'vocal synth'] },
  { canonical: 'synth piano', category: 'pad', aliases: ['electric grand', 'synth keys'] },
  { canonical: 'synth flute', category: 'pad', aliases: ['FM flute', 'digital flute'] },
  { canonical: 'synth bells', category: 'pad', aliases: ['bell synth', 'FM bells', 'digital bells'] },
  { canonical: 'arpeggiator', category: 'pad', aliases: ['arp', 'arpeggiated synth', 'sequenced synth'] },
  { canonical: 'supersaw', category: 'pad', aliases: ['detuned supersaw', 'supersaws', 'stacked saws'] },
  { canonical: 'pluck synth', category: 'pad', aliases: ['pluck', 'synth pluck', 'plucky synth'] },
  { canonical: 'sidechain pad', category: 'pad', aliases: ['sidechained pad', 'pumping pad'] },
  
  // Evolving textures (professional ambient)
  { canonical: 'granular synth', category: 'pad', aliases: ['granular pad', 'grain synth'] },
  { canonical: 'wavetable synth', category: 'pad', aliases: ['wavetable pad', 'morphing synth'] },
  { canonical: 'modular synth', category: 'pad', aliases: ['modular synthesizer', 'eurorack'] },
  { canonical: 'tape loops', category: 'pad', aliases: ['tape loop', 'tape texture'] },
  { canonical: 'drone', category: 'pad', aliases: ['sustained drone', 'drone texture'] },
  { canonical: 'shimmer pad', category: 'pad', aliases: ['shimmer synth', 'shimmer reverb pad'] },
  { canonical: 'field recordings', category: 'pad', aliases: ['field recording', 'environmental sounds', 'nature sounds'] },
  
  { canonical: 'synth bass', category: 'movement', aliases: ['bass synth', 'synthetic bass'] },
  { canonical: '808', category: 'movement', aliases: ['808 drums', 'TR-808', '808 kick', '808 sub bass', 'deep 808'] },

  // Rare instruments
  { canonical: 'taiko drums', category: 'rare', aliases: ['taiko', 'japanese drums'] },
  { canonical: 'steel pan', category: 'rare', aliases: ['steel drum', 'steelpan', 'steel drums'] },
  { canonical: 'Hammond organ', category: 'rare', aliases: ['Hammond', 'B3 organ'] },
  { canonical: 'organ', category: 'color', aliases: ['pipe organ', 'church organ'] },
  { canonical: 'mellotron', category: 'color', aliases: ['tape synth'] },
  { canonical: 'theremin', category: 'rare', aliases: [] },
  { canonical: 'waterphone', category: 'rare', aliases: ['ocean harp'] },
  { canonical: 'glass armonica', category: 'rare', aliases: ['glass harmonica', 'armonica'] },
  { canonical: 'vocoder', category: 'rare', aliases: ['voice synth', 'robot voice'] },
  { canonical: 'harmonica', category: 'color', aliases: ['blues harp', 'mouth organ', 'harp harmonica'] },
  { canonical: 'accordion', category: 'color', aliases: ['squeezebox', 'button accordion'] },
  { canonical: 'mandolin', category: 'rare', aliases: ['mando'] },
  { canonical: 'banjo', category: 'rare', aliases: ['5-string banjo'] },
  { canonical: 'fiddle', category: 'color', aliases: ['country fiddle', 'bluegrass fiddle', 'folk fiddle'] },
  { canonical: 'pedal steel', category: 'color', aliases: ['pedal steel guitar', 'steel guitar'] },
  { canonical: 'tin whistle', category: 'color', aliases: ['penny whistle', 'irish whistle'] },
  { canonical: 'bouzouki', category: 'rare', aliases: ['greek bouzouki', 'irish bouzouki'] },
  { canonical: 'bandoneon', category: 'rare', aliases: ['bandonion', 'tango accordion'] },
  { canonical: 'timpani', category: 'movement', aliases: ['kettledrums', 'orchestral drums'] },
  { canonical: 'braams', category: 'rare', aliases: ['braam', 'trailer brass', 'epic brass hit'] },
  { canonical: 'impacts', category: 'rare', aliases: ['impact hits', 'cinematic impacts', 'trailer impacts'] },
  { canonical: 'FX risers', category: 'rare', aliases: ['risers', 'build ups', 'tension risers'] },
  { canonical: 'vinyl noise', category: 'rare', aliases: ['vinyl crackle', 'lo-fi texture', 'record noise'] },

  // Reggae/Dub instruments
  { canonical: 'melodica', category: 'color', aliases: ['blow organ', 'keyboard harmonica'] },
  { canonical: 'nyabinghi drums', category: 'movement', aliases: ['rasta drums', 'nyabinghi'] },
  { canonical: 'spring reverb', category: 'rare', aliases: ['dub reverb', 'spring tank'] },
  { canonical: 'tape delay', category: 'rare', aliases: ['dub delay', 'analog delay'] },
  { canonical: 'dub siren', category: 'rare', aliases: ['siren', 'dub fx'] },

  // African instruments
  { canonical: 'talking drum', category: 'color', aliases: ['yoruba drum', 'dundun'] },
  { canonical: 'shekere', category: 'movement', aliases: ['shaker gourd', 'gourd shaker'] },
  { canonical: 'kora', category: 'color', aliases: ['african harp', 'kora harp'] },
  { canonical: 'balafon', category: 'color', aliases: ['african xylophone', 'balaphon'] },
  { canonical: 'log drums', category: 'movement', aliases: ['log drum', 'amapiano drums'] },

  // Hyperpop instruments
  { canonical: 'pitched vocals', category: 'color', aliases: ['pitched voice', 'chipmunk vocals', 'vocal pitch'] },
  { canonical: 'bitcrushed synth', category: 'pad', aliases: ['crushed synth', 'lo-fi synth', '8-bit synth'] },
  { canonical: 'glitched vocals', category: 'rare', aliases: ['vocal glitch', 'chopped vocals'] },
  { canonical: 'distorted 808', category: 'movement', aliases: ['clipped 808', 'saturated 808'] },

  // Drill instruments
  { canonical: 'sliding 808', category: 'movement', aliases: ['gliding 808', 'portamento bass'] },
  { canonical: 'drill hi hats', category: 'movement', aliases: ['triplet hi hats', 'rapid hi hats'] },
  { canonical: 'dark piano', category: 'harmonic', aliases: ['minor piano', 'ominous piano'] },

  // Color instruments
  { canonical: 'electric piano', category: 'color', aliases: ['e-piano', 'epiano'] },
  { canonical: 'Rhodes', category: 'color', aliases: ['Fender Rhodes', 'Rhodes piano'] },
  { canonical: 'Wurlitzer', category: 'color', aliases: ['Wurly', 'Wurlitzer piano'] },
  { canonical: 'Clavinet', category: 'color', aliases: ['Clav'] },
  { canonical: 'cello', category: 'color', aliases: ['violoncello'] },
  { canonical: 'violin', category: 'color', aliases: ['violins'] },
  { canonical: 'viola', category: 'color', aliases: ['violas'] },
  { canonical: 'vibraphone', category: 'color', aliases: ['vibes', 'vibraharp'] },
  { canonical: 'oboe', category: 'color', aliases: [] },
  { canonical: 'english horn', category: 'color', aliases: ['cor anglais'] },
  { canonical: 'bassoon', category: 'color', aliases: [] },
  { canonical: 'contrabassoon', category: 'color', aliases: ['contra bassoon', 'double bassoon'] },
  { canonical: 'bowed vibraphone', category: 'color', aliases: [] },
  { canonical: 'marimba', category: 'color', aliases: [] },
  { canonical: 'kalimba', category: 'color', aliases: ['thumb piano', 'mbira'] },
  { canonical: 'glockenspiel', category: 'color', aliases: ['glock', 'orchestra bells'] },
  { canonical: 'bells', category: 'color', aliases: ['bell', 'chimes'] },
  { canonical: 'glass bells', category: 'color', aliases: ['crystal bells'] },
  { canonical: 'congas', category: 'color', aliases: ['conga', 'conga drums'] },
  { canonical: 'singing bowls', category: 'color', aliases: ['tibetan bowls', 'meditation bowls'] },
  { canonical: 'choir', category: 'color', aliases: ['vocals', 'voices', 'choral', 'SATB choir', 'mixed choir'] },
  { canonical: 'wordless choir', category: 'color', aliases: ['aahs', 'oohs', 'vocal pads'] },
  { canonical: 'solo soprano', category: 'color', aliases: ['soprano soloist', 'soprano voice'] },
  { canonical: 'clarinet', category: 'color', aliases: [] },
  { canonical: 'bass clarinet', category: 'color', aliases: ['bass clari'] },
  { canonical: 'piccolo', category: 'color', aliases: ['piccolo flute'] },
  { canonical: 'shakuhachi', category: 'color', aliases: ['japanese flute'] },
  { canonical: 'duduk', category: 'color', aliases: ['armenian duduk'] },
  { canonical: 'bansuri', category: 'color', aliases: ['indian flute', 'bamboo flute'] },
  { canonical: 'koto', category: 'color', aliases: ['japanese koto'] },
  { canonical: 'erhu', category: 'color', aliases: ['chinese violin', 'chinese fiddle'] },
  { canonical: 'sitar', category: 'color', aliases: [] },
  { canonical: 'oud', category: 'color', aliases: ['arabic oud'] },
  { canonical: 'tongue drum', category: 'color', aliases: ['steel tongue drum', 'tank drum'] },
  { canonical: 'crystal bowls', category: 'color', aliases: ['crystal singing bowls', 'quartz bowls'] },
  { canonical: 'breathy EWI', category: 'color', aliases: ['EWI', 'wind controller'] },
  { canonical: 'flute', category: 'color', aliases: ['concert flute', 'western flute'] },
  { canonical: 'harp', category: 'color', aliases: ['concert harp', 'pedal harp'] },
  { canonical: 'trumpet', category: 'color', aliases: ['brass trumpet'] },
  { canonical: 'muted trumpet', category: 'color', aliases: ['harmon mute trumpet', 'wah-wah trumpet'] },
  { canonical: 'saxophone', category: 'color', aliases: ['sax'] },
  { canonical: 'tenor sax', category: 'color', aliases: ['tenor saxophone'] },
  { canonical: 'alto sax', category: 'color', aliases: ['alto saxophone'] },
  { canonical: 'soprano sax', category: 'color', aliases: ['soprano saxophone'] },
  { canonical: 'baritone saxophone', category: 'color', aliases: ['bari sax', 'baritone sax'] },
  { canonical: 'flugelhorn', category: 'color', aliases: ['flugel', 'fluegel horn'] },
  { canonical: 'french horn', category: 'color', aliases: ['horn', 'horns'] },
  { canonical: 'trombone', category: 'color', aliases: [] },
  { canonical: 'bass trombone', category: 'color', aliases: [] },
  { canonical: 'tuba', category: 'color', aliases: ['bass tuba', 'concert tuba'] },
  { canonical: 'low brass', category: 'color', aliases: ['brass section', 'horn section', 'horn stabs'] },
  { canonical: 'string ostinato', category: 'color', aliases: ['ostinato strings', 'driving strings'] },
  { canonical: 'orchestra', category: 'color', aliases: ['full orchestra', 'orchestral'] },

  // Movement instruments
  { canonical: 'percussion', category: 'movement', aliases: ['perc'] },
  { canonical: 'toms', category: 'movement', aliases: ['tom drums', 'floor toms'] },
  { canonical: 'shaker', category: 'movement', aliases: ['shakers', 'egg shaker'] },
  { canonical: 'rain stick', category: 'movement', aliases: ['rainstick'] },
  { canonical: 'ocean drum', category: 'movement', aliases: ['sea drum', 'wave drum'] },
  { canonical: 'frame drum', category: 'movement', aliases: ['bodhran', 'tar'] },
  { canonical: 'handpan', category: 'movement', aliases: ['hang drum', 'hang'] },
  { canonical: 'sub-bass', category: 'movement', aliases: ['sub bass', 'subbass', 'deep bass'] },
  { canonical: 'snare drum', category: 'movement', aliases: ['snare', 'snappy snare'] },
  { canonical: 'jazz brushes', category: 'movement', aliases: ['brushes', 'brush drums', 'brushed drums', 'brush kit'] },
  { canonical: 'cajón', category: 'movement', aliases: ['cajon', 'box drum'] },
  { canonical: 'djembe', category: 'movement', aliases: ['djembe drum'] },
  { canonical: 'doumbek', category: 'movement', aliases: ['darbuka', 'goblet drum'] },
  { canonical: 'surdo', category: 'movement', aliases: ['Brazilian bass drum'] },
  { canonical: 'bass', category: 'movement', aliases: ['bass guitar', 'electric bass', 'round bass'] },
  { canonical: 'slap bass', category: 'movement', aliases: ['slapped bass', 'funk bass'] },
  { canonical: 'walking bass', category: 'movement', aliases: ['walking bass line'] },
  { canonical: 'picked bass', category: 'movement', aliases: ['punk bass'] },
  { canonical: 'upright bass', category: 'movement', aliases: ['contrabass', 'double bass', 'acoustic bass', 'standup bass'] },
  { canonical: 'bongos', category: 'movement', aliases: ['bongo drums'] },
  { canonical: 'timbales', category: 'movement', aliases: ['timbale'] },
  { canonical: 'claves', category: 'movement', aliases: ['clave'] },
  { canonical: 'woodblock', category: 'movement', aliases: ['wood block'] },
  { canonical: 'castanet', category: 'movement', aliases: ['castanets', 'palmas'] },
  { canonical: 'tambourine', category: 'movement', aliases: ['tamb'] },
  { canonical: 'handclaps', category: 'movement', aliases: ['claps', 'hand claps', 'clapping'] },
  { canonical: 'finger snaps', category: 'movement', aliases: ['snaps', 'finger snap'] },
  { canonical: 'ride cymbal', category: 'movement', aliases: ['ride', 'jazz ride'] },
  { canonical: 'suspended cymbal', category: 'movement', aliases: ['sus cymbal', 'hanging cymbal'] },
  { canonical: 'crash cymbal', category: 'movement', aliases: ['piatti', 'crash'] },
  { canonical: 'tam tam', category: 'movement', aliases: ['gong', 'orchestral gong'] },
  { canonical: 'mark tree', category: 'movement', aliases: ['bar chimes', 'wind chimes', 'chime tree'] },
  { canonical: 'orchestral bass drum', category: 'movement', aliases: ['concert bass drum', 'gran cassa'] },
  { canonical: 'drums', category: 'movement', aliases: ['drum kit', 'drumkit', 'drum set', 'live drums'] },
  { canonical: 'hi-hat', category: 'movement', aliases: ['hi-hats', 'hihat', 'hihats'] },
  { canonical: 'trap hi hats', category: 'movement', aliases: ['rolling hi hats', 'trap hats', 'stuttering hi hats'] },
  { canonical: 'kick drum', category: 'movement', aliases: ['kick', 'bass drum', 'four on the floor'] },

  // World/Ethnic Instruments
  { canonical: 'tabla', category: 'movement', aliases: ['indian drums', 'tabla drums'] },
  { canonical: 'dholak', category: 'movement', aliases: ['dholki', 'two-headed drum'] },
  { canonical: 'santoor', category: 'color', aliases: ['santur', 'santour', 'persian dulcimer'] },
  { canonical: 'sarod', category: 'color', aliases: ['sarod lute'] },
  { canonical: 'didgeridoo', category: 'rare', aliases: ['didge', 'yidaki', 'drone pipe'] },
  { canonical: 'udu drum', category: 'movement', aliases: ['udu', 'clay pot drum', 'water pot'] },
  { canonical: 'ogene', category: 'movement', aliases: ['iron bell', 'igbo bell'] },

  // Electronic/Production
  { canonical: 'TR-909', category: 'movement', aliases: ['909', 'Roland 909', 'nine-oh-nine'] },
  { canonical: 'TB-303', category: 'movement', aliases: ['303', 'acid bass', 'acid synth', 'Roland 303'] },
  { canonical: 'talkbox', category: 'rare', aliases: ['talk box', 'voice box'] },
  { canonical: 'Linn drum', category: 'movement', aliases: ['LinnDrum', 'LM-1'] },

  // Latin Percussion
  { canonical: 'guiro', category: 'movement', aliases: ['scraper', 'guira', 'güiro'] },
  { canonical: 'cuica', category: 'movement', aliases: ['cuíca', 'friction drum', 'laughing drum'] },
  { canonical: 'agogo bells', category: 'movement', aliases: ['agogo', 'agogô', 'double bells'] },
  { canonical: 'cowbell', category: 'movement', aliases: ['cencerro', 'campana', 'cha-cha bell'] },
  { canonical: 'cabasa', category: 'movement', aliases: ['afuche', 'afuché'] },
  { canonical: 'pandeiro', category: 'movement', aliases: ['brazilian tambourine', 'pandero'] },
  { canonical: 'maracas', category: 'movement', aliases: ['rumba shakers'] },
  { canonical: 'repinique', category: 'movement', aliases: ['repique', 'repi'] },
] as const;

// Build lookup maps at module load time
function buildLookupMaps() {
  const canonicalSet = new Set<string>();
  const aliasToCanonical = new Map<string, string>();

  for (const entry of INSTRUMENT_REGISTRY) {
    const canonicalLower = entry.canonical.toLowerCase();
    canonicalSet.add(canonicalLower);
    aliasToCanonical.set(canonicalLower, entry.canonical);

    for (const alias of entry.aliases) {
      aliasToCanonical.set(alias.toLowerCase(), entry.canonical);
    }
  }

  return { canonicalSet, aliasToCanonical };
}

const { canonicalSet, aliasToCanonical } = buildLookupMaps();

export const CANONICAL_SET: ReadonlySet<string> = canonicalSet;
export const ALIAS_TO_CANONICAL: ReadonlyMap<string, string> = aliasToCanonical;

export function isValidInstrument(name: string): boolean {
  return aliasToCanonical.has(name.toLowerCase());
}

export function toCanonical(name: string): string | null {
  return aliasToCanonical.get(name.toLowerCase()) ?? null;
}

export function getCategory(canonical: string): InstrumentCategory | null {
  const entry = INSTRUMENT_REGISTRY.find(e => e.canonical === canonical);
  return entry?.category ?? null;
}

export function getInstrumentsByCategory(category: InstrumentCategory): readonly string[] {
  return INSTRUMENT_REGISTRY
    .filter(e => e.category === category)
    .map(e => e.canonical);
}
