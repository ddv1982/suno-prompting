# Suno Prompting App

The **Suno Prompting App** is a specialized desktop application designed to empower music creators by generating optimized "Style of Music" prompts for Suno V5. Built with a sleek, professional DAW (Digital Audio Workstation) aesthetic, the app bridges the gap between creative vision and the complex prompting requirements of Suno's latest models.

## Features

- **Simple Prompt Generation**: Transform plain English descriptions into professionally formatted Suno prompts using the "Top-Anchor Strategy" and "GM Formula".
- **Intelligent Mode Selection**: LLM-powered analysis of your description to select optimal harmonic modes based on emotional content, narrative arcs, and explicit requests.
- **Modal Combinations**: 10 pre-built combinations that journey through multiple modes with section-specific guidance.
- **Time Signature Detection**: 11 time signatures from standard (4/4, 3/4) to complex odd meters (5/4, 7/8, 11/8, 13/8) with 7 section-based journeys.
- **Polyrhythm Combinations**: 8 pre-built rhythmic journeys for layered, cross-rhythm complexity.
- **Lydian Chord Theory**: Complete diatonic chord reference for all 12 keys with triads, 7th chords, and extended voicings.
- **Dynamic Instrument Selection**: Pool-based instrument selection from 90+ instruments with automatic variety and exclusion rules.
- **12 Genre Palettes**: Curated instrument pools for jazz, electronic, rock, pop, classical, lofi, synthwave, cinematic, folk, R&B, video game, and ambient.
- **Synth Replacements**: Professional workstation-inspired synth alternatives for acoustic instruments.
- **User Instrument Prioritization**: Mention instruments in your description and they'll be automatically detected and prioritized in the output.
- **Iterative AI Refinement**: Tweak and refine your prompts through a chat-like interface.
- **Quick Remix Buttons**: Instantly randomize specific prompt elements:
  - **Mood**: Shuffle between 42 evocative mood descriptors (euphoric, haunting, whimsical, etc.)
  - **Genre**: Swap between all 12 genre palettes with one click
  - **Instruments**: Regenerate instrument selection from genre-appropriate pools
- **Smart Constraints & Validation**:
  - **1000-Character Limit**: Real-time enforcement and visual counter.
  - **Contradictory Tag Detection**: Warns about conflicting tags.
- **Local Session History**: Track generations and version history.
- **Secure API Key Management**: Manage Groq API keys within the app.
- **Shadcn UI**: A professional, component-based interface with dark mode support.

## Contextual Enhancement System

The app automatically detects musical characteristics from your description and injects expert guidance into the AI prompt.

### User Instrument Detection

When you mention instruments in your description, the app automatically:

1. **Detects** instruments using a registry of 90+ Suno-compatible instruments
2. **Converts aliases** to canonical Suno tags (e.g., "piano" → "felt piano", "fiddle" → "violin", "keys" → "felt piano")
3. **Prioritizes** your instruments in the "MUST use" section
4. **Fills remaining slots** (up to 4 total) from random pools

**Example:**
- Input: `"ambient track with piano and violin"`
- Output instruments:
  - User specified (MUST use): `felt piano`, `violin`
  - Suggested additions: `synth pad`, `kalimba`

Supported aliases include common names like "keys", "fiddle", "vibes", "sax", "drums", "bass", etc.

### Genre Detection

Detects **12 music genres** and selects appropriate instruments from curated pools:

| Genre | Keywords | Key Instruments |
|-------|----------|-----------------|
| Ambient | ambient, atmospheric, soundscape | felt piano, synth pad, strings, kalimba |
| Jazz | jazz, bebop, swing, fusion | Rhodes, Hammond organ, saxophone, upright bass |
| Electronic | edm, house, techno, dubstep | synth pad, 808, arpeggiator, vocoder |
| Rock | rock, alternative, punk, metal | guitar, drums, bass, Hammond organ |
| Pop | pop, mainstream, dance pop | felt piano, synth, bass, drums |
| Classical | classical, orchestral, symphony | strings, violin, cello, flute, french horn |
| Lo-fi | lofi, chill, study beats | felt piano, Rhodes, kalimba, jazz brushes |
| Synthwave | synthwave, retrowave, 80s, outrun | analog synth, arpeggiator, synth bass |
| Cinematic | cinematic, epic, trailer | strings, french horn, choir, taiko drums |
| Folk | folk, acoustic, country, americana | acoustic guitar, violin, banjo, mandolin |
| R&B | rnb, soul, neo-soul, motown | Rhodes, Wurlitzer, bass, saxophone |
| Video Game | video game, chiptune, 8-bit, rpg, arcade | strings, arpeggiator, FM synth, bells, taiko drums |

Each genre has:
- **Curated instrument pools** by category (harmonic, pad, color, movement, rare)
- **Exclusion rules** to prevent conflicting combinations
- **Random variety** on each generation

#### How Genre Selection Works

1. **User instruments first:** any instruments detected from your description are locked in as "MUST use".
2. **Pool selection (variety):** fills remaining slots from genre-specific pools by category.
3. **Exclusions:** prevents known-clashing combos (e.g., Rhodes + Wurlitzer, synth strings + strings).
4. **Prompt constraint:** the AI is instructed to use the provided tags on the final `Instruments:` line.

### Synth Replacements

Professional keyboard workstation-inspired synth alternatives for acoustic instruments:

| Acoustic | Synth Alternatives |
|----------|-------------------|
| strings | synth strings, mellotron |
| choir | synth choir, mellotron, vocoder |
| trumpet, trombone, french horn | synth brass |
| flute | synth flute |
| bells, glockenspiel | synth bells |
| bass | synth bass, sub-bass |
| felt piano | synth piano, electric piano |

**New synth instruments added:**
- synth strings, synth brass, synth choir, synth piano, synth flute, synth bells
- arpeggiator, 808, synth bass
- mellotron, theremin, vocoder
- harmonica, accordion, mandolin, banjo, timpani, organ

**Automatic exclusion:** The app prevents mixing real and synth versions of the same instrument type (e.g., no "strings" + "synth strings" together).

### Intelligent Mode Selection (LLM-Powered)

Before generating a prompt, the app uses an LLM to analyze your description and intelligently select the best harmonic approach. This understands:

- **Explicit requests**: "2 lydian chord types" → `lydian_exploration`
- **Emotional content**: "heartbreak turning to acceptance" → `minor_journey`
- **Narrative arcs**: "epic battle then victory" → `harmonic_major`
- **Imagery**: "floating through clouds, reality hits" → `lydian_minor`

Falls back to keyword detection if LLM selection fails.

### Harmonic Style Detection

Detects advanced harmonic vocabulary and provides chord theory guidance across **13 modes**:

**Lydian Variants:**
| Style | Keywords | Character |
|-------|----------|-----------|
| Lydian Dominant | jazzy, fusion, funk | Playful, mischievous |
| Lydian Augmented | mysterious, alien, space | Otherworldly, floating |
| Lydian #2 | exotic, enchanted, magic | Cinematic, evocative |
| Pure Lydian | lydian, #11, cinematic | Bright, ethereal |

**Major Modes:**
| Style | Keywords | Character |
|-------|----------|-----------|
| Ionian | major, happy, bright, pop | Resolved, joyful |
| Mixolydian | bluesy, rock, dominant | Driving, groovy |

**Minor Modes:**
| Style | Keywords | Character |
|-------|----------|-----------|
| Dorian | jazzy, soulful, minor groove | Sophisticated, hopeful |
| Aeolian | sad, melancholic, minor | Emotional, dramatic |
| Phrygian | spanish, flamenco, exotic | Tense, fiery |
| Locrian | horror, dissonant, unstable | Dread, experimental |
| Harmonic Minor | gothic, classical, vampire | Dramatic tension |
| Melodic Minor | jazz, noir, sophisticated | Bittersweet, smooth |

Each style includes: chord type, formula, characteristics, suggested progressions, key examples, and best instruments.

### Modal Combinations

10 pre-built combinations for songs that journey through multiple modes, each with **section-specific guidance**:

**Cross-Mode Combinations (2-phase):**
| Combination | Emotional Arc | Use For |
|-------------|---------------|---------|
| Major-Minor | Joy → Melancholy | Bittersweet, happy-sad |
| Lydian-Minor | Wonder → Shadow | Dreamy-dark, ethereal tension |
| Lydian-Major | Wonder → Joy | Uplifting, bright resolution |
| Dorian-Lydian | Groove → Float | Jazz fusion, sophisticated |
| Harmonic-Major | Tension → Triumph | Classical drama, victory |
| Phrygian-Major | Exotic → Liberation | Spanish triumph, flamenco |

**Within-Mode Combinations (3-phase):**
| Combination | Emotional Arc | Use For |
|-------------|---------------|---------|
| Minor Journey | Sadness → Drama → Resolution | Grief to acceptance |
| Lydian Exploration | Dream → Groove → Otherworldly | Multiple lydian colors |
| Major Modes | Wonder → Joy → Groove | Bright variety |
| Dark Modes | Melancholy → Danger → Dread | Horror, descent |

**Section Guide Example (Lydian Exploration):**
```
SECTION GUIDE:
- INTRO/VERSE: Pure Lydian dream, bright #11 shimmer, floating Imaj7#11
- CHORUS: Lydian Dominant groove, funky II7 edge, playful mystery
- BRIDGE/OUTRO: Lydian Augmented cosmos, #5 strangeness, alien shimmer
```

### Rhythmic Style Detection

Detects complex rhythmic patterns:

| Style | Keywords | Character |
|-------|----------|-----------|
| Polyrhythm | polyrhythm, cross-rhythm, 3:4, 5:4 | Hypnotic, interlocking |

Includes common ratios (2:3, 3:4, 4:3, 5:4, 7:4) and suggested instruments for layered percussion.

### Polyrhythm Combinations

8 pre-built polyrhythm combinations for songs that journey through different rhythmic feels, each with **section-specific guidance**:

**Cross-Rhythm Combinations (2-phase):**
| Combination | Emotional Arc | Use For |
|-------------|---------------|---------|
| Groove to Drive | Shuffle → Driving | Building energy, dance builds |
| Tension Release | Drive → Shuffle | Drops, resolution moments |
| Afrobeat Journey | Swing → Interlocking | World fusion, organic builds |
| Complex to Simple | Chaos → Grounded | Progressive resolution |

**Multi-Rhythm Combinations (3-phase):**
| Combination | Emotional Arc | Use For |
|-------------|---------------|---------|
| Complexity Build | Groove → Drive → Chaos | Progressive builds, EDM climax |
| Triplet Exploration | Shuffle → Tension → Flow | Jazz fusion, exploratory |
| Odd Journey | Hypnotic → Complex → Intricate | Prog rock, math rock |
| Tension Arc | Drive → Chaos → Resolution | Full tension/release arc |

**Section Guide Example (Complexity Build):**
```
POLYRHYTHM COMBINATION: Complexity Build

SECTION GUIDE:
- INTRO/VERSE: Hemiola groove (2:3), relaxed swing, establishes pulse
- CHORUS: Afrobeat drive (4:3), hypnotic intensity, building energy
- BRIDGE/OUTRO: Shifting chaos (5:4), peak complexity, rhythmic climax

Emotional Arc: Groove → Drive → Chaos
Best instruments: layered percussion, polyrhythmic bass, interlocking synths
```

**Note:** Polyrhythm combinations work **independently** of modal combinations. A track can have BOTH a modal combination AND a polyrhythm combination (e.g., `lydian_exploration` + `complexity_build`).

### Time Signature Detection

Detects standard, compound, and odd time signatures with beat groupings and section-based journeys:

**Standard & Compound:**
| Signature | Keywords | Feel |
|-----------|----------|------|
| 4/4 | common time, standard | Steady, grounded |
| 3/4 | waltz, triple meter | Elegant, dancing |
| 6/8 | jig, shuffle, compound | Rolling, swinging |

**Odd Time Signatures:**
| Signature | Keywords | Feel | Famous Examples |
|-----------|----------|------|-----------------|
| 5/4 | take five, quintuple | Off-balance drive | Take Five, Mission Impossible |
| 5/8 | balkan five | Quick, nimble | Balkan folk |
| 7/8 | balkan, aksak, limping | Urgent, limping | Money (Pink Floyd) |
| 7/4 | expansive odd | Spacious, epic | Solsbury Hill |
| 9/8 | slip jig, compound triple | Lilting, Celtic | Blue Rondo à la Turk |
| 11/8 | tool time, prog eleven | Complex, shifting | Lateralus (Tool) |
| 13/8 | king crimson | Extreme complexity | King Crimson |
| 15/8 | extreme odd | Extended compound | Experimental prog |

Each signature includes: beat count, grouping patterns (e.g., 7/8 as 2+2+3 or 3+2+2), feel description, characteristics, and best genres.

**Time Signature Journeys (7 combinations):**

| Journey | Signatures | Emotional Arc | Best For |
|---------|------------|---------------|----------|
| Prog Odyssey | 4/4 → 7/8 → 5/4 | Grounded → Urgent → Expansive | Prog rock, art rock |
| Balkan Fusion | 7/8 → 9/8 → 11/8 | Limping → Flowing → Hypnotic | World fusion, jazz |
| Jazz Exploration | 4/4 → 5/4 → 9/8 | Swing → Cool → Dance | Jazz, cool jazz |
| Math Rock Descent | 5/4 → 7/8 → 11/8 | Intellectual → Urgent → Labyrinthine | Math rock, prog metal |
| Celtic Journey | 6/8 → 9/8 → 3/4 | Rolling → Dancing → Elegance | Celtic, folk rock |
| Metal Complexity | 4/4 → 7/4 → 13/8 | Crushing → Epic → Chaotic | Prog metal, djent |
| Gentle Odd | 3/4 → 5/4 → 6/8 | Waltz → Thoughtful → Rolling | Indie, singer-songwriter |

**Section Guide Example (Prog Odyssey):**
```
TIME SIGNATURE JOURNEY: Prog Odyssey

SECTION GUIDE:
- INTRO/VERSE: 4/4 foundation - establish familiarity, build trust
- CHORUS: 7/8 urgency - add edge and drive, limping intensity
- BRIDGE/OUTRO: 5/4 resolution - intellectual satisfaction, unique landing

Emotional Arc: Grounded → Urgent → Expansive
Best genres: prog rock, art rock, prog metal
```

### Lydian Chord Theory Reference

Complete diatonic chord sets for Lydian mode across all 12 root notes:

**Scale Formula:** W-W-W-H-W-W-H (1-2-3-#4-5-6-7)

**Diatonic Chords:**
| Degree | Roman | Triad | 7th Chord | Example (C Lydian) |
|--------|-------|-------|-----------|-------------------|
| I | I | Major | Maj7 | Cmaj7 |
| II | II | Major | Dom7 | D7 |
| iii | iii | minor | min7 | Em7 |
| iv° | iv° | dim | m7b5 | F#m7b5 |
| V | V | Major | Maj7 | Gmaj7 |
| vi | vi | minor | min7 | Am7 |
| vii | vii | minor | min7 | Bm7 |

**Signature Sound:** The II major chord (e.g., D in C Lydian) creates the characteristic "floating" Lydian quality.

**Extended Chords:** Each scale degree also supports sus2, sus4, add9, and 6th chord voicings.

**Available for all 12 keys:** C, C#, D, D#, E, F, F#, G, G#, A, A#, B

### Dynamic Instrument Selection

Instruments are now **dynamically selected** from the registry based on mode and genre, providing variety on each generation:

**Category Pools (90+ instruments):**
- **Harmonic**: felt piano, prepared piano, harmonium, celesta, strings, guitars
- **Pad**: synth pad, analog synth, FM synth, Moog, crystalline pads, ambient pad, synth strings, synth brass, synth choir, synth piano, synth flute, synth bells, arpeggiator
- **Color**: Rhodes, Wurlitzer, cello, violin, vibraphone, oboe, harp, saxophone, choir, mellotron, organ, harmonica, accordion
- **Movement**: percussion, drums, bass, shaker, djembe, cajón, handpan, synth bass, 808, timpani
- **Rare**: taiko drums, steel pan, Hammond organ, theremin, vocoder, mandolin, banjo

**How It Works:**
1. Each mode/genre defines which category pools to draw from
2. Random instruments are selected within min/max constraints
3. Exclusion rules prevent conflicting combinations
4. Results vary on each generation for creative variety

**Exclusion Rules (30+ automatic rules):**
- No Rhodes + Wurlitzer together
- No bells + singing bowls together
- No felt piano + Rhodes together
- No violin + viola together (too similar)
- No synth strings + strings together (real vs synth)
- No synth brass + trumpet together
- No 808 + drums together
- And more...

## Quick Remix Buttons

The app provides instant remix buttons to quickly iterate on specific prompt elements without regenerating the entire prompt:

| Button | Action | Details |
|--------|--------|---------|
| **MOOD** | Randomizes mood descriptors | Selects 2-3 from 42 evocative options |
| **GENRE** | Swaps to a different genre | Cycles through all 12 genre palettes |
| **INSTRUMENTS** | Regenerates instrument selection | Picks new instruments from genre pools |
| **REMIX** | Full regeneration | Creates entirely new prompt from original input |

### Mood Pool (42 descriptors)

Organized by emotional category:

| Category | Moods |
|----------|-------|
| Energetic | euphoric, explosive, triumphant, exhilarating, electrifying, uplifting |
| Calm | serene, peaceful, tranquil, meditative, soothing, gentle |
| Dark | haunting, brooding, sinister, ominous, menacing, foreboding |
| Emotional | melancholic, wistful, bittersweet, yearning, nostalgic, tender |
| Playful | whimsical, mischievous, carefree, lighthearted, jovial, quirky |
| Intense | passionate, fierce, relentless, urgent, raw, visceral |
| Atmospheric | ethereal, dreamy, mysterious, hypnotic, otherworldly, cosmic |
| Additional | introspective, defiant, hopeful, rebellious, contemplative, cinematic |

Each click randomly selects 2-3 moods, ensuring variety while maintaining coherent emotional tone.

## Tech Stack

- **Runtime**: [Electrobun](https://electrobun.dev/) - Native desktop application framework.
- **UI Framework**: **React 19** + **Shadcn UI** - Modern component-based architecture.
- **AI Orchestration**: [AI SDK v5](https://sdk.vercel.ai/docs) - For streaming and structured AI responses.
- **LLM**: Multiple models via **Groq** including `openai/gpt-oss-120b` (default), `moonshotai/kimi-k2-instruct-0905`, and `llama-3.1-8b-instant`.
- **Styling**: **Tailwind CSS v4** + **Radix UI** primitives.
- **Runtime/Package Manager**: [Bun](https://bun.sh/)

## Setup & Installation

Ensure you have [Bun](https://bun.sh/) installed on your system.

1. Clone the repository:
   ```bash
   git clone git@github.com:ddv1982/groq-suno-prompter.git
   cd groq-suno-prompter
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure your API Key:
   Create a `.env` file based on `.env.example` or set up your Groq API key directly in the application's settings.

## Running the App

To start the application in development mode:

```bash
bun start
```

This command will build the CSS using Tailwind v4 and launch the Electrobun development environment.

## Packaging & Distribution

The Suno Prompting App can be packaged for multiple platforms using Electrobun's build system.

### Build Commands

To build the application for your current platform:
```bash
bun run build
```

To build for specific platforms:
- **macOS (Intel & Apple Silicon)**: `bun run build:macos`
- **Linux (x64)**: `bun run build:linux`
- **Windows (x64)**: `bun run build:windows`
- **All Platforms**: `bun run build:all`

### Artifacts
The build process generates optimized application bundles in the `build/` folder. Each target platform will have its own subfolder (e.g., `dev-macos-arm64`) containing the executable and necessary assets.

## Development & Testing

### Running Tests

The project uses Bun's built-in test runner. To execute the test suite:

```bash
bun test
```

Tests cover (254 total):
- Instrument registry and alias resolution (90+ instruments)
- User instrument extraction from descriptions
- Dynamic instrument selection and exclusion rules (30+ rules)
- 12 genre detection and instrument selection
- Synth replacement suggestions and mappings
- Harmonic/rhythmic style detection (13 modes)
- Modal combination detection and guidance (10 combinations)
- Polyrhythm combination detection and guidance (8 combinations)
- Time signature detection and guidance (11 signatures, 7 journeys)
- Lydian chord generation for all 12 keys (triads, 7ths, extended)
- Section-specific guidance for 2-phase and 3-phase combinations
- Genre-specific exclusion rules
- RPC communication bridge
- Prompt validation logic (character limits, contradictory tags)
- Session utilities

### Build for Production

To build the production-ready desktop application:

```bash
bun run build
```

## Knowledge Base

The application is grounded in expert Suno V5 prompting techniques, including:
- **Top-Anchor Strategy**: Mandatory formatting for consistent results.
- **GM Formula**: Ensuring Genre, Mood, Instruments, and Vocals are properly represented.
- **Fracture Prompting**: Supporting unique genre fusions.

---
*Developed for AI-driven music creation.*
