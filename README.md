# suno-prompting-app

Desktop app that turns plain-English song ideas into **Suno V5-ready** prompts with enforced formatting, genre/mood/instrument guidance, and guardrails.

## Quick Start

Prereq: [Bun](https://bun.sh/)

```bash
bun install
bun start
```

Run tests:

```bash
bun test
```

Build:

```bash
bun run build
```

Platform builds:

- macOS (Intel & Apple Silicon): `bun run build:macos`
- Linux (x64): `bun run build:linux`
- Windows (x64): `bun run build:windows`
- All: `bun run build:all`

Production builds (canary/stable):

- Canary (current platform): `bun run build:canary`
- Canary (all platforms): `bun run build:canary:all`
- Stable (current platform): `bun run build:stable`
- Stable (all platforms): `bun run build:stable:all`

Platform-specific production builds:

- macOS stable: `bun run build:stable:macos`
- Linux stable: `bun run build:stable:linux`
- Windows stable: `bun run build:stable:windows`

Development builds output to `build/`. Production builds generate artifacts for distribution.

## Configuration

Settings (including your AI provider API keys) are stored locally:

| Platform | Location |
|----------|----------|
| macOS | `~/.suno-prompting-app/config.json` |
| Linux | `~/.suno-prompting-app/config.json` |
| Windows | `C:\Users\<username>\.suno-prompting-app\config.json` |

API keys are encrypted at rest using AES-256-GCM.

## Architecture (high level)

### AI engine

- `src/bun/ai/engine.ts`: main AIEngine class orchestrating generation.
- `src/bun/ai/config.ts`: AIConfig class for provider/model/settings management.
- `src/bun/ai/content-generator.ts`: title and lyrics generation.
- `src/bun/ai/llm-rewriter.ts`: condense/rewrite helpers for post-processing.
- `src/bun/ai/remix.ts`: remix operations (genre, mood, instruments, etc.).

### Prompt pipeline

- `src/bun/prompt/builders.ts`: constructs the system/context prompts (normal + max mode).
- `src/bun/prompt/postprocess.ts`: strips leaked meta, enforces the output contract, truncates to limits.
- `src/bun/prompt/remix.ts`: field-line replacement helpers used by remix actions.
- `src/bun/prompt/realism-tags.ts`: max mode header tags, realism descriptors, and genre-to-tag mapping.
- `src/bun/prompt/articulations.ts`: instrument articulation system (10 categories, 100+ articulations).
- `src/bun/prompt/vocal-descriptors.ts`: vocal ranges, deliveries, and techniques per genre.
- `src/bun/prompt/production-elements.ts`: reverb types and recording textures per genre.
- `src/bun/prompt/chord-progressions.ts`: 26 named chord progressions with genre mappings.

### Instruments + music “knowledge”

- `src/bun/instruments/registry.ts`: canonical instrument tags + aliases.
- `src/bun/instruments/genres/*`: per-genre instrument pools.
- `src/bun/instruments/datasets/*`: reusable datasets (harmonic/rhythm/time).
- `src/bun/instruments/services/*`:
  - `random.ts`: RNG utilities + deterministic seeded RNG for tests.
  - `select.ts`: pool selection logic.
  - `format.ts`: turns detected concepts into human-readable guidance.

## AI Providers

The app supports multiple AI providers. Configure your preferred provider in Settings.

| Provider | Models | Get API Key |
|----------|--------|-------------|
| Groq | GPT OSS 120B, Llama 3.1 8B | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenAI | GPT-5 Mini, GPT-5 | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5 | [console.anthropic.com](https://console.anthropic.com) |

Each provider's API key is stored separately and encrypted independently.

## Output Format Contract

The generated prompt is constrained to a strict structure so Suno V5 responds consistently.

### Line 1 (mandatory)

```
[Mood, Genre/Style, Key: key/mode]
```

### Required metadata lines

- `Genre:`
- `BPM:`
- `Mood:`
- `Instruments:` (comma-separated)

### Song sections

The body uses section tags like:

- `[Intro]`
- `[Verse]`
- `[Pre-Chorus]`
- `[Chorus]`
- `[Bridge]`
- `[Outro]`

## Features

- Generates structured Suno prompts from plain English.
- Keyword + LLM-assisted detection for **genre / harmonic feel / rhythm / time signature**.
- **Dynamic instrument selection** from curated pools with exclusion rules.
- Quick remix buttons for **mood / genre / instruments**.
- Prompt validation: **1000-character limit** + contradictory tag warnings.
- **Max Mode**: Community-discovered prompt format for higher quality output (see below).

## Genre & Mode Detection

The app uses a 3-tier detection system to identify genre and select harmonic/rhythmic modes:

### Tier 1: Keyword Matching

Direct match against genre names and keywords. Genres are checked in priority order (first match wins):

```
videogame → synthwave → lofi → cinematic → jazz → classical → folk → rnb →
country → soul → blues → punk → latin → symphonic → metal → trap → retro →
electronic → rock → pop → ambient
```

Example: "symphonic rock retro ballad" matches `symphonic` first (higher priority than `retro`).

### Tier 2: Spelling Correction

If no keyword match, the LLM attempts to correct potential typos and re-matches against keywords.

### Tier 3: LLM Selection

Full LLM analysis selects:
- **Genre** (if not already detected in Tier 1/2)
- **Harmonic combination** (e.g., `major_minor`, `lydian_exploration`) OR **single mode** (e.g., `dorian`, `phrygian`)
- **Polyrhythm combination** (e.g., `complexity_build`, `tension_arc`)
- **Reasoning** for the selection

**Important**: Keyword-detected genre (Tier 1) always takes precedence over LLM-selected genre.

### Detection Priority

The system detects multiple musical concepts independently:

| Concept | Detection Method | Example Keywords |
|---------|------------------|------------------|
| Genre | Keywords → LLM | "jazz", "synthwave", "cinematic" |
| Harmonic Mode | Keywords + LLM | "lydian", "dorian", "harmonic minor" |
| Modal Combination | Keywords + LLM | "bittersweet", "happy-sad", "emotional arc" |
| Polyrhythm | Keywords + LLM | "building rhythm", "complex throughout" |
| Time Signature | Keywords | "7/8", "waltz", "take five" |

## Max Mode

Max Mode uses a community-discovered prompt technique that triggers higher quality output in Suno V5. Enable it in Settings.

### How it works

When enabled, prompts are generated with special header tags:

```
[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)

genre: "acoustic, country singer-songwriter"
bpm: "95"
instruments: "single acoustic guitar, vocal grit, emotional phrasing"
style tags: "tape recorder, raw performance texture, narrow mono image"
recording: "one person, one guitar, natural dynamics"
```

### Best for

- **Organic genres**: Country, folk, acoustic, blues, jazz, soul, rock
- **Realism-focused**: Live recordings, authentic performances, analog warmth

### Not recommended for

- **Electronic genres**: EDM, house, techno, synthwave (use normal mode instead)

### Key differences from normal mode

| Aspect | Normal Mode | Max Mode |
|--------|-------------|----------|
| Format | Section tags `[VERSE]`, `[CHORUS]` | Metadata style `genre:`, `instruments:` |
| Focus | Song structure | Recording quality & realism |
| Tags | Performance tags `(breathy)`, `(belt)` | Realism tags (tape saturation, room acoustics) |

Note: Song Structure Tags are automatically disabled when Max Mode is enabled, as they can cause "lyric bleed-through" in this format.

## Title & Lyrics

The app always generates an AI-powered song title alongside your style prompt. Optionally enable Lyrics Mode to also generate structured song lyrics.

### Output Format

| Mode | Output |
|------|--------|
| Normal | Title + Style Prompt |
| Lyrics Mode | Title + Style Prompt + Lyrics |

Enable Lyrics Mode in Settings or via the toggle in the input area.

### Lyrics Structure

```
[VERSE]
First verse lyrics here...

[PRE-CHORUS]
Building anticipation...

[CHORUS]
Main hook and memorable lines...

[VERSE]
Second verse continues the story...

[BRIDGE]
Emotional shift or new perspective...

[CHORUS]
Repeat the hook...

[OUTRO]
Closing the song...
```

### Section Buttons

Each output section (Title, Style Prompt, Lyrics) has consistent button controls:

| Button | Function |
|--------|----------|
| **REMIX** | Regenerates that section's content |
| **COPY** | Copies content to clipboard (shows "COPIED" on success) |

**Style Prompt** has additional field-specific remix buttons:
- GENRE, INSTRUMENTS, STYLE, RECORDING - Remix individual fields
- DEBUG - View generation details (when debug mode enabled)

### Best For

- Songs where you want AI-generated lyrics
- Quick songwriting inspiration
- Complete song packages ready for Suno

## Prompt Enhancement System

The app includes a comprehensive prompt enhancement system based on professional prompt patterns. When a genre is detected, the guidance includes:

### Example Output

```
SUGGESTED INSTRUMENTS (Suno tags):
Jazz: Sophisticated, improvisational music with complex harmonies

Tempo: 110 BPM (range: 80-160)
Mood suggestions: Smooth, Warm, Sophisticated
Vocal style: Tenor, Crooner Style Delivery, Scat Fills
Production: Analog Warmth, Long Hall Reverb
Chord progression: The 2-5-1 (ii-V-I): The cornerstone of jazz harmony

- Arpeggiated Rhodes
- Walking upright bass
- Brushed drums
- tenor sax
```

### BPM Ranges

Each genre has a defined tempo range with a typical BPM (researched from industry sources):

| Genre | Typical BPM | Range |
|-------|-------------|-------|
| Ambient | 65 | 50-80 |
| Blues | 88 | 68-132 |
| Classical | 90 | 60-140 |
| Country | 110 | 90-140 |
| Electronic | 128 | 120-150 |
| Folk | 100 | 80-120 |
| Jazz | 110 | 80-160 |
| Latin | 98 | 80-140 |
| Lo-fi | 80 | 70-90 |
| Metal | 140 | 100-180 |
| Pop | 118 | 100-130 |
| Punk | 175 | 160-200 |
| R&B | 88 | 70-100 |
| Rock | 120 | 100-160 |
| Soul | 96 | 80-110 |
| Synthwave | 115 | 100-130 |
| Trap | 145 | 130-170 |

### Mood Pools

Genre-specific mood vocabulary (8-9 moods per genre):

- **Jazz**: Smooth, Warm, Sophisticated, Intimate, Late Night, Elegant, Groovy, Laid Back, Cool
- **Rock**: Driving, Powerful, Energetic, Rebellious, Raw, Intense, Confident, Gritty, Anthemic
- **Ambient**: Dreamy, Ethereal, Meditative, Calm, Floaty, Spacious, Otherworldly, Serene, Hypnotic
- **Cinematic**: Epic, Dramatic, Triumphant, Tense, Majestic, Heroic, Suspenseful, Powerful, Emotional

### Instrument Articulations

40% of suggested instruments receive articulation prefixes:

| Category | Example Articulations |
|----------|----------------------|
| Guitar | Arpeggiated, Strummed, Palm Muted, Jangly, Fingerpicked |
| Piano | Comping, Rolling, Gentle, Dramatic |
| Bass | Walking, Slapped, Round, Deep, Groovy |
| Drums | Brushed, Tight, Punchy, Laid Back, Driving |
| Strings | Legato, Staccato, Pizzicato, Swelling, Lush |
| Brass | Muted, Bold, Fanfare, Stabs, Swells |

### Vocal Descriptors

Genre-appropriate vocal suggestions:

- **Ranges**: Soprano, Mezzo Soprano, Alto, Tenor, Baritone, Bass
- **Deliveries**: Belting, Intimate, Breathy, Raspy, Smooth, Falsetto, Crooner Style, Melismatic
- **Techniques**: Stacked Harmonies, Call And Response, Ad Libs, Gospel Style Backing, Scat Fills

### Production Elements

Recording character suggestions per genre:

- **Reverb types**: Long Hall, Plate, Spring, Cathedral, Studio, Chamber
- **Textures**: Polished Production, Analog Warmth, Lo-Fi Dusty, Vintage Warmth, Raw Performance

### Chord Progressions

26 named progressions organized by category:

**Pop Essentials**
| Name | Pattern | Best For |
|------|---------|----------|
| The Standard | I-V-vi-IV | Radio hits, anthems |
| The Doo-Wop | I-vi-IV-V | Romantic, nostalgic |
| The Sensitive | vi-IV-I-V | Emotional ballads |
| The Rock & Roll | I-IV-V | High energy, party |
| The Jazz Pop | ii-V-I | Sophisticated, smooth |

**Dark & Cinematic**
| Name | Pattern | Best For |
|------|---------|----------|
| The Andalusian | i-VII-VI-V | Dramatic, flamenco |
| The Phrygian | i-bII-i | Dark, exotic |
| The Sad Loop | i-VI-i-VII | Trap, melancholic |
| The Suspense | V-VI-V-VI | Tension building |

**Jazz & Soul**
| Name | Pattern | Best For |
|------|---------|----------|
| The 2-5-1 | ii-V-I | Jazz standards |
| The Soul Vamp | i-IV | Groovy, hypnotic |
| The Blues | I-IV-I-V | Blues, rock |
| The Bossa Nova | Imaj7-ii7-V7 | Latin jazz |

## Reference tables

### Genres (keywords → palette)

<!-- GENRE_TABLE_START -->

| Genre | Keywords | Key Instruments |
|-------|----------|-----------------|
| Ambient | ambient, atmospheric, soundscape, meditative, ethereal | Rhodes, Wurlitzer, electric piano, mellotron, harmonium, celesta, strings, nylon string guitar, fretless guitar, synth pad, ambient pad, crystalline synth pads, analog synth pads, synth strings, wordless choir, singing bowls, crystal bowls, kalimba, glass bells, bansuri, shakuhachi, duduk, tongue drum, handpan, koto, bowed vibraphone, mark tree, tam tam, english horn, oboe, solo soprano, granular synth, wavetable synth, tape loops, drone, shimmer pad, FM synth, Moog synth, sitar, erhu, oud, marimba, steel pan, vibraphone, cello, harp, rain stick, ocean drum, shaker, frame drum, jazz brushes, suspended cymbal, finger snaps, felt piano, prepared piano, waterphone, glass armonica, theremin |
| Jazz | jazz, bebop, swing, cool jazz, fusion, big band, smooth jazz | Rhodes, grand piano, hollowbody guitar, Hammond organ, Wurlitzer, saxophone, tenor sax, trumpet, muted trumpet, trombone, vibraphone, clarinet, flute, upright bass, walking bass, jazz brushes, drums, ride cymbal, congas, bongos |
| Electronic | edm, electronic, house, techno, trance, dubstep, drum and bass, dnb | synth pad, analog synth, FM synth, arpeggiator, synth, 808, synth bass, kick drum, hi-hat, drums, vocoder |
| Rock | rock, alternative, indie rock, hard rock, grunge, classic rock, heartland rock | distorted guitar, Fender Stratocaster, guitar, acoustic guitar, Telecaster, bass, drums, kick drum, toms, electric piano, organ, Clavinet, grand piano, Hammond organ, tambourine |
| Pop | pop, mainstream, top 40, dance pop, synth pop, electropop, future bass | felt piano, Fender Stratocaster, guitar, acoustic guitar, grand piano, synth pad, synth, analog synth, digital synth, arpeggiator, synth piano, supersaw, pluck synth, bass, drums, 808, handclaps, kick drum, FX risers, strings |
| Classical | classical, orchestral, symphony, chamber, baroque, romantic, opera | strings, felt piano, violin, cello, viola, flute, piccolo, oboe, english horn, clarinet, bass clarinet, bassoon, contrabassoon, french horn, tuba, trombone, bass trombone, harp, celesta, timpani, orchestral bass drum, suspended cymbal, crash cymbal, tam tam |
| Lo-fi | lofi, lo-fi, chill, study beats, chillhop, bedroom pop | felt piano, Rhodes, electric piano, vibraphone, kalimba, guitar, cello, clarinet, jazz brushes, shaker, percussion, drums, synth pad, ambient pad |
| Synthwave | synthwave, retrowave, 80s, outrun, vaporwave, darksynth, cyberpunk | analog synth, analog synth pads, FM synth, digital synth, Moog synth, arpeggiator, synth pad, synth, synth bass, 808, kick drum, hi-hat, drums |
| Cinematic | cinematic, epic, trailer, film score, soundtrack, orchestral, dramatic, hybrid orchestral | strings, grand piano, string ostinato, pizzicato strings, french horn, low brass, tuba, trombone, cello, choir, wordless choir, solo soprano, violin, celesta, glockenspiel, bells, harp, english horn, piccolo, taiko drums, percussion, toms, timpani, orchestral bass drum, tam tam, suspended cymbal, braams, impacts, FX risers, sub-bass |
| Folk | folk, acoustic, singer-songwriter, celtic, traditional | acoustic guitar, felt piano, violin, harp, flute, harmonica, accordion, clarinet, cajón, percussion, frame drum, mandolin, banjo |
| R&B | rnb, r&b, neo-soul, contemporary r&b, funk, quiet storm | Rhodes, Wurlitzer, electric piano, grand piano, Clavinet, bass, drums, 808, trap hi hats, slap bass, saxophone, strings, guitar, wah guitar, handclaps, shaker |
| Video Game | video game, game music, gaming, chiptune, 8-bit, 8 bit, retro game, pixel, arcade, boss battle, level music, rpg, jrpg, adventure game, platformer, nintendo, sega | strings, felt piano, harp, synth pad, arpeggiator, FM synth, analog synth, synth strings, bells, glockenspiel, celesta, choir, french horn, trumpet, drums, percussion, taiko drums, timpani, 808, guitar, vocoder |
| Country | country, country rock, country pop, americana, bluegrass, country gospel, honky tonk, outlaw country, nashville | acoustic guitar, Telecaster, grand piano, pedal steel, fiddle, harmonica, mandolin, banjo, bass, drums, upright bass, Hammond organ, accordion |
| Soul | soul, motown, 60s soul, modern soul, gospel soul, northern soul, southern soul, classic soul, quiet storm | Rhodes, grand piano, Hammond organ, Wurlitzer, strings, trumpet, saxophone, low brass, bass, drums, tambourine, handclaps, vibraphone, guitar |
| Blues | blues, electric blues, blues rock, delta blues, chicago blues, jazz blues, slow blues, blues shuffle, psychedelic blues | hollowbody guitar, guitar, grand piano, slide guitar, bass, drums, upright bass, walking bass, Hammond organ, harmonica, saxophone, wah guitar |
| Punk | punk, pop punk, emo, emo pop, punk rock, hardcore, y2k pop punk, indie pop punk, skate punk, melodic punk | distorted guitar, guitar, acoustic guitar, picked bass, bass, drums, kick drum, grand piano, organ |
| Latin | latin, bossa nova, latin jazz, reggae, reggae fusion, latin pop, salsa, tango, flamenco, afro-cuban | nylon string guitar, Rhodes, grand piano, acoustic guitar, upright bass, bass, congas, bongos, timbales, claves, shaker, trumpet, saxophone, flute, bandoneon, castanet, vibraphone |
| Metal | metal, heavy metal, doom metal, progressive metal, industrial, death metal, black metal, thrash metal, nu metal, gothic metal | distorted guitar, guitar, bass, drums, kick drum, timpani, synth pad, strings, choir, organ, orchestra, braams, low brass |
| Trap | trap, dark trap, emo rap, cloud rap, cinematic trap, trap soul, melodic trap, drill, phonk | felt piano, guitar, pluck synth, strings, 808, trap hi hats, kick drum, snare drum, synth pad, ambient pad, choir, vinyl noise, pizzicato strings, braams, FX risers |
| Retro | retro, 50s, 60s, rock and roll, doo-wop, rockabilly, garage rock, surf rock, british invasion, oldies | guitar, tremolo guitar, grand piano, honky tonk piano, upright bass, slap bass, drums, tambourine, handclaps, organ, saxophone, harmonica, finger snaps, bells |
| Symphonic | symphonic, symphonic metal, symphonic rock, orchestral metal, orchestral rock, epic metal | distorted guitar, guitar, grand piano, strings, choir, french horn, low brass, tuba, trombone, violin, cello, orchestra, bass, drums, timpani, kick drum, orchestral bass drum, harp, celesta, braams, wordless choir, solo soprano, tam tam, crash cymbal |

<!-- GENRE_TABLE_END -->

### Instrument layers

<!-- INSTRUMENT_CLASSES_START -->

**Foundational instruments** (anchors): drums, kick drum, hi-hat, snare drum, bass, sub-bass, strings, synth pad, synth, analog synth, digital synth, FM synth, arpeggiator, percussion

**Multi-genre instruments** (wildcards): 808, Clavinet, FX risers, Hammond organ, Rhodes, Wurlitzer, acoustic guitar, ambient pad, bells, braams, distorted guitar, electric piano, grand piano, guitar, handclaps, harmonica, low brass, organ, saxophone, shaker, tambourine, trombone, upright bass, vibraphone

**Orchestral color instruments** (gated): celesta, glockenspiel, harp, violin, cello, french horn, timpani, taiko drums, choir, wordless choir, piccolo, english horn, bass clarinet, contrabassoon, tuba, bass trombone, solo soprano, suspended cymbal, crash cymbal, tam tam, mark tree, orchestral bass drum

<!-- INSTRUMENT_CLASSES_END -->

<details>
  <summary><strong>More references (modes, combinations, rhythms, time signatures, Lydian chords)</strong></summary>

  
  ### Harmonic styles
  
  **Lydian variants**
  
  | Style | Keywords | Character |
  |-------|----------|-----------|
  | Lydian Dominant | jazzy, fusion, funk | Playful, mischievous |
  | Lydian Augmented | mysterious, alien, space | Otherworldly, floating |
  | Lydian #2 | exotic, enchanted, magic | Cinematic, evocative |
  | Pure Lydian | lydian, #11, cinematic | Bright, ethereal |
  
  **Major modes**
  
  | Style | Keywords | Character |
  |-------|----------|-----------|
  | Ionian | major, happy, bright, pop | Resolved, joyful |
  | Mixolydian | bluesy, rock, dominant | Driving, groovy |
  
  **Minor modes**
  
  | Style | Keywords | Character |
  |-------|----------|-----------|
  | Dorian | jazzy, soulful, minor groove | Sophisticated, hopeful |
  | Aeolian | sad, melancholic, minor | Emotional, dramatic |
  | Phrygian | spanish, flamenco, exotic | Tense, fiery |
  | Locrian | horror, dissonant, unstable | Dread, experimental |
  | Harmonic Minor | gothic, classical, vampire | Dramatic tension |
  | Melodic Minor | jazz, noir, sophisticated | Bittersweet, smooth |
  
  ### Modal combinations
  
  **Cross-mode (2-phase)**
  
  | Combination | Emotional Arc | Use For |
  |-------------|---------------|---------|
  | Major-Minor | Joy → Melancholy | Bittersweet, happy-sad |
  | Lydian-Minor | Wonder → Shadow | Dreamy-dark, ethereal tension |
  | Lydian-Major | Wonder → Joy | Uplifting, bright resolution |
  | Dorian-Lydian | Groove → Float | Jazz fusion, sophisticated |
  | Harmonic-Major | Tension → Triumph | Classical drama, victory |
  | Phrygian-Major | Exotic → Liberation | Spanish triumph, flamenco |
  
  **Within-mode (3-phase)**
  
  | Combination | Emotional Arc | Use For |
  |-------------|---------------|---------|
  | Minor Journey | Sadness → Drama → Resolution | Grief to acceptance |
  | Lydian Exploration | Dream → Groove → Otherworldly | Multiple lydian colors |
  | Major Modes | Wonder → Joy → Groove | Bright variety |
  | Dark Modes | Melancholy → Danger → Dread | Horror, descent |
  
  ### Polyrhythm combinations
  
  **Cross-rhythm (2-phase)**
  
  | Combination | Emotional Arc | Use For |
  |-------------|---------------|---------|
  | Groove to Drive | Shuffle → Driving | Building energy, dance builds |
  | Tension Release | Drive → Shuffle | Drops, resolution moments |
  | Afrobeat Journey | Swing → Interlocking | World fusion, organic builds |
  | Complex to Simple | Chaos → Grounded | Progressive resolution |
  
  **Multi-rhythm (3-phase)**
  
  | Combination | Emotional Arc | Use For |
  |-------------|---------------|---------|
  | Complexity Build | Groove → Drive → Chaos | Progressive builds, EDM climax |
  | Triplet Exploration | Shuffle → Tension → Flow | Jazz fusion, exploratory |
  | Odd Journey | Hypnotic → Complex → Intricate | Prog rock, math rock |
  | Tension Arc | Drive → Chaos → Resolution | Full tension/release arc |
  
  ### Time signatures
  
  **Standard & compound**
  
  | Signature | Keywords | Feel |
  |-----------|----------|------|
  | 4/4 | common time, standard | Steady, grounded |
  | 3/4 | waltz, triple meter | Elegant, dancing |
  | 6/8 | jig, shuffle, compound | Rolling, swinging |
  
  **Odd time signatures**
  
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
  
  **Journeys (7)**
  
  | Journey | Signatures | Emotional Arc | Best For |
  |---------|------------|---------------|----------|
  | Prog Odyssey | 4/4 → 7/8 → 5/4 | Grounded → Urgent → Expansive | Prog rock, art rock |
  | Balkan Fusion | 7/8 → 9/8 → 11/8 | Limping → Flowing → Hypnotic | World fusion, jazz |
  | Jazz Exploration | 4/4 → 5/4 → 9/8 | Swing → Cool → Dance | Jazz, cool jazz |
  | Math Rock Descent | 5/4 → 7/8 → 11/8 | Intellectual → Urgent → Labyrinthine | Math rock, prog metal |
  | Celtic Journey | 6/8 → 9/8 → 3/4 | Rolling → Dancing → Elegance | Celtic, folk rock |
  | Metal Complexity | 4/4 → 7/4 → 13/8 | Crushing → Epic → Chaotic | Prog metal, djent |
  | Gentle Odd | 3/4 → 5/4 → 6/8 | Waltz → Thoughtful → Rolling | Indie, singer-songwriter |
  
  ### Lydian chord theory (C Lydian example)
  
  Scale formula: W-W-W-H-W-W-H (1-2-3-#4-5-6-7)
  
  | Degree | Roman | Triad | 7th Chord | Example |
  |--------|-------|-------|-----------|---------|
  | I | I | Major | Maj7 | Cmaj7 |
  | II | II | Major | Dom7 | D7 |
  | iii | iii | minor | min7 | Em7 |
  | iv° | iv° | dim | m7b5 | F#m7b5 |
  | V | V | Major | Maj7 | Gmaj7 |
  | vi | vi | minor | min7 | Am7 |
  | vii | vii | minor | min7 | Bm7 |

</details>

## Tech stack

- Runtime: [Electrobun](https://electrobun.dev/)
- UI: React 19 + shadcn/ui + Tailwind CSS v4
- AI: AI SDK v6 (Groq, OpenAI, Anthropic)
- Package manager/runtime: Bun
