# suno-prompting-app

Desktop app that turns plain-English song ideas into **Suno V5-ready** prompts with enforced formatting, genre/mood/instrument guidance, and guardrails.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [AI Providers](#ai-providers)
- [Output Format](#output-format)
- [Features](#features)
- [Quick Vibes](#quick-vibes)
- [Advanced Mode](#advanced-mode)
- [Genre & Mode Detection](#genre--mode-detection)
- [Max Mode](#max-mode)
- [Title & Lyrics](#title--lyrics)
- [Prompt Enhancement System](#prompt-enhancement-system)
- [Reference Tables](#reference-tables)
- [Tech Stack](#tech-stack)

## Quick Start

Prereq: [Bun](https://bun.sh/)

```bash
bun install
bun start
```

Run tests: `bun test`

<details>
<summary><strong>Build Commands</strong></summary>

| Command | Description |
|---------|-------------|
| `bun run build` | Development build (outputs to `build/`) |
| `bun run build:macos` | macOS (Intel & Apple Silicon) |
| `bun run build:linux` | Linux (x64) |
| `bun run build:windows` | Windows (x64) |
| `bun run build:all` | All platforms |
| `bun run build:stable` | Production (current platform) |
| `bun run build:stable:all` | Production (all platforms) |
| `bun run build:canary` | Canary (current platform) |

</details>

## Configuration

Settings (including your AI provider API keys) are stored locally:

| Platform | Location |
|----------|----------|
| macOS | `~/.suno-prompting-app/config.json` |
| Linux | `~/.suno-prompting-app/config.json` |
| Windows | `C:\Users\<username>\.suno-prompting-app\config.json` |

API keys are encrypted at rest using AES-256-GCM.

## Architecture

| Module | Purpose |
|--------|---------|
| `src/bun/ai/` | AI engine, config, content generation, remix operations |
| `src/bun/prompt/` | Prompt builders, postprocessing, articulations, vocal descriptors, chord progressions |
| `src/bun/instruments/` | Instrument registry, genre pools, selection logic |

## AI Providers

| Provider | Models | Get API Key |
|----------|--------|-------------|
| Groq | GPT OSS 120B, Llama 3.1 8B | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenAI | GPT-5 Mini, GPT-5 | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5 | [console.anthropic.com](https://console.anthropic.com) |

Each provider's API key is stored separately and encrypted independently.

## Output Format

| Component | Format |
|-----------|--------|
| Line 1 | `[Mood, Genre/Style, Key: key/mode]` |
| Required fields | `Genre:`, `BPM:`, `Mood:`, `Instruments:` |
| Section tags | `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, `[Outro]` |

## Features

- Generates structured Suno prompts from plain English.
- Keyword + LLM-assisted detection for **genre / harmonic feel / rhythm / time signature**.
- **Dynamic instrument selection** from curated pools with exclusion rules.
- Quick remix buttons for **mood / genre / instruments**.
- Prompt validation: **1000-character limit** + contradictory tag warnings.
- **Max Mode**: Community-discovered prompt format for higher quality output (see below).
- **Quick Vibes mode**: Simplified generation for atmospheric/background music with category presets.
- **Advanced Mode**: Precise genre selection with 35 single genres and 53 genre combinations.

## Quick Vibes

Quick Vibes is a simplified mode for generating short, atmospheric prompts perfect for background music, study sessions, and ambient listening.

### How to Use

1. Switch to Quick Vibes mode using the mode toggle
2. Select a category preset OR enter a custom description
3. Optionally enable "Wordless Vocals" for instrumental-only output
4. Click Generate

### Category Presets

| Category | Description | Example Output |
|----------|-------------|----------------|
| Lo-fi / Study | Chill beats for studying and focus | "warm lo-fi beats to study to" |
| Cafe / Coffee shop | Cozy acoustic and jazz vibes | "relaxing cafe jazz on a sunday morning" |
| Ambient / Focus | Atmospheric soundscapes for deep work | "dreamy ambient soundscape for deep focus" |
| Late night / Chill | Mellow late-night listening | "late night chill hop vibes" |
| Cozy / Rainy day | Warm sounds for rainy days | "cozy acoustic music for a rainy afternoon" |
| Lo-fi chill | Classic lo-fi chill beats | "chill lo-fi beats with soft piano" |

### Quick Vibes Features

- **60 character limit**: Prompts are kept short and focused
- **Wordless Vocals**: Toggle to request instrumental-only output
- **Max Mode support**: When enabled, adds realism tags to output
- **Refinement**: Chat-style refinement to adjust the generated prompt

### Best For

- Background music for work/study
- Atmospheric playlists
- Quick inspiration without detailed configuration

## Advanced Mode

Advanced Mode provides precise control over genre selection with searchable dropdowns exposing all 35 genres and 53 genre combinations.

### Genre Selection

Two searchable dropdown selectors allow you to specify exact genres:

| Selector | Options | Behavior |
|----------|---------|----------|
| **Single Genre** | 35 genres | Direct genre selection (e.g., "Jazz", "Synthwave") |
| **Genre Combination** | 53 combinations | Fusion/hybrid genres (e.g., "Jazz Fusion", "Folk Rock") |

**Note**: Single Genre and Genre Combination are mutually exclusive - selecting one clears the other.

### How it Works

1. Enable Advanced Mode in the editor
2. Select a genre from either dropdown (searchable/filterable)
3. The selected genre appears at the start of the "Generated Music Phrase"
4. When you generate, your selection **overrides** auto-detected genre

### Single Genres (35)

Ambient, Jazz, Electronic, Rock, Pop, Classical, Lo-Fi, Synthwave, Cinematic, Folk, R&B, Videogame, Country, Soul, Blues, Punk, Latin, Metal, Trap, Retro, Symphonic, Disco, Funk, Reggae, Afrobeat, House, Trance, Downtempo, Dream Pop, Chillwave, New Age, Hyperpop, Drill, Melodic Techno, Indie

### Genre Combinations (53)

Jazz Fusion, Jazz Funk, Jazz Hip-Hop, Nu Jazz, Acid Jazz, Electronic Rock, Electro Pop, Synth Pop, Future Bass, Chillwave, Vaporwave, Folk Rock, Folk Pop, Indie Folk, Chamber Folk, Blues Rock, Southern Rock, Progressive Rock, Psychedelic Rock, Art Rock, Indie Rock, Alternative Rock, Neo Soul, Psychedelic Soul, Funk Soul, Latin Jazz, Bossa Nova, Afrobeat, Reggae Fusion, Progressive Metal, Symphonic Metal, Doom Metal, Trip Hop, Lo-fi Hip Hop, Dark Ambient, Space Ambient, Drone Ambient, Disco Funk, Nu-Disco, Disco House, Deep House, Tech House, Afro House, Melodic House, Dub Techno, Roots Reggae, Dream Pop Shoegaze, Chillhop, Downtempo Electronica, Lo-fi Chill, UK Drill, Hyperpop Trap, Drill Rap

### Other Advanced Options

In addition to genre, Advanced Mode includes:

- **Harmonic Style**: Single modes (Dorian, Lydian, Phrygian, etc.)
- **Harmonic Combination**: Modal journeys (Major-Minor, Lydian-Minor, etc.)
- **Polyrhythm**: Rhythmic complexity patterns
- **Time Signature**: Standard and odd meters (7/8, 5/4, etc.)
- **Time Signature Journey**: Multi-meter progressions

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

| Genre | Moods |
|-------|-------|
| Jazz | Smooth, Warm, Sophisticated, Intimate, Late Night, Elegant, Groovy, Laid Back, Cool |
| Rock | Driving, Powerful, Energetic, Rebellious, Raw, Intense, Confident, Gritty, Anthemic |
| Ambient | Dreamy, Ethereal, Meditative, Calm, Floaty, Spacious, Otherworldly, Serene, Hypnotic |
| Cinematic | Epic, Dramatic, Triumphant, Tense, Majestic, Heroic, Suspenseful, Powerful, Emotional |

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

<details>
<summary><strong>Chord Progressions (26 named)</strong></summary>

| Category | Name | Pattern | Best For |
|----------|------|---------|----------|
| Pop | The Standard | I-V-vi-IV | Radio hits, anthems |
| Pop | The Doo-Wop | I-vi-IV-V | Romantic, nostalgic |
| Pop | The Sensitive | vi-IV-I-V | Emotional ballads |
| Dark | The Andalusian | i-VII-VI-V | Dramatic, flamenco |
| Dark | The Phrygian | i-bII-i | Dark, exotic |
| Jazz | The 2-5-1 | ii-V-I | Jazz standards |
| Jazz | The Bossa Nova | Imaj7-ii7-V7 | Latin jazz |

</details>

## Reference tables

### Genres (keywords → palette)

<!-- GENRE_TABLE_START -->

| Genre | Keywords | Key Instruments |
|-------|----------|-----------------|
| Ambient | ambient, atmospheric, soundscape, drone, ethereal, textural | synth pad, ambient pad, analog synth pads, shimmer pad, crystalline synth pads, Moog synth, granular synth, wavetable synth, FM synth, modular synth, drone, tape loops, field recordings, guitar, processed guitar, e-bow guitar, glass bells, vibraphone, bowed vibraphone, singing bowls, crystal bowls, kalimba, handpan, tongue drum, bansuri, shakuhachi, felt piano, prepared piano, rain stick, suspended cymbal, mark tree, shaker, theremin, waterphone, glass armonica, didgeridoo |
| Jazz | jazz, bebop, swing, cool jazz, fusion, big band, smooth jazz | Rhodes, grand piano, hollowbody guitar, Hammond organ, Wurlitzer, saxophone, tenor sax, alto sax, soprano sax, baritone saxophone, trumpet, muted trumpet, flugelhorn, trombone, vibraphone, clarinet, flute, upright bass, walking bass, jazz brushes, drums, ride cymbal, congas, bongos |
| Electronic | edm, electronic, dubstep, drum and bass, dnb, electro, bass music | synth pad, analog synth, FM synth, arpeggiator, synth, synth choir, supersaw, pluck synth, 808, TR-909, synth bass, TB-303, kick drum, hi-hat, drums, vocoder, FX risers, impacts |
| Rock | rock, alternative, indie rock, hard rock, grunge, classic rock, heartland rock | distorted guitar, Fender Stratocaster, guitar, acoustic guitar, Telecaster, bass, drums, kick drum, toms, electric piano, organ, Clavinet, grand piano, Hammond organ, tambourine |
| Pop | pop, mainstream, top 40, dance pop, synth pop, electropop, future bass | felt piano, Fender Stratocaster, guitar, acoustic guitar, grand piano, synth pad, synth, analog synth, digital synth, arpeggiator, synth piano, supersaw, pluck synth, synth choir, bass, drums, 808, handclaps, kick drum, FX risers, strings |
| Classical | classical, orchestral, symphony, chamber, baroque, romantic, opera | strings, felt piano, violin, cello, viola, flute, alto flute, piccolo, oboe, english horn, clarinet, bass clarinet, bassoon, contrabassoon, french horn, tuba, trombone, bass trombone, harp, celesta, xylophone, triangle, tubular bells, timpani, orchestral bass drum, suspended cymbal, crash cymbal, tam tam, slapstick, recorder, lute, harpsichord, viola da gamba, theorbo, crotales |
| Lo-fi | lofi, lo-fi, study beats, chillhop, lofi hip hop, lofi beats | felt piano, Rhodes, electric piano, vibraphone, kalimba, guitar, cello, clarinet, jazz brushes, shaker, percussion, drums, synth pad, ambient pad |
| Synthwave | synthwave, retrowave, 80s, outrun, vaporwave, darksynth, cyberpunk | analog synth, analog synth pads, FM synth, digital synth, Moog synth, arpeggiator, synth pad, synth, supersaw, synth bass, 808, kick drum, hi-hat, drums, Linn drum |
| Cinematic | cinematic, epic, trailer, film score, soundtrack, orchestral, dramatic, hybrid orchestral | strings, grand piano, string ostinato, pizzicato strings, french horn, low brass, tuba, trombone, cello, choir, wordless choir, solo soprano, violin, celesta, glockenspiel, bells, harp, english horn, piccolo, alto flute, bass flute, tubular bells, xylophone, string tremolo, euphonium, taiko drums, percussion, toms, timpani, orchestral bass drum, tam tam, suspended cymbal, braams, impacts, FX risers, sub-bass, ondes Martenot, col legno, sul ponticello, crotales |
| Folk | folk, acoustic, singer-songwriter, celtic, traditional | acoustic guitar, felt piano, autoharp, mountain dulcimer, violin, harp, flute, harmonica, accordion, clarinet, concertina, cajón, percussion, frame drum, washboard, mandolin, banjo, hurdy gurdy, jaw harp, nyckelharpa |
| R&B | rnb, r&b, neo-soul, contemporary r&b, quiet storm | Rhodes, Wurlitzer, electric piano, grand piano, Clavinet, bass, drums, 808, trap hi hats, slap bass, saxophone, strings, guitar, wah guitar, handclaps, shaker |
| Video Game | video game, game music, gaming, chiptune, 8-bit, 8 bit, retro game, pixel, arcade, boss battle, level music, rpg, jrpg, adventure game, platformer, nintendo, sega | strings, felt piano, harp, synth pad, arpeggiator, FM synth, analog synth, synth strings, bells, glockenspiel, celesta, choir, french horn, trumpet, drums, percussion, taiko drums, timpani, 808, guitar, vocoder |
| Country | country, country rock, country pop, americana, bluegrass, country gospel, honky tonk, outlaw country, nashville | acoustic guitar, Telecaster, grand piano, dobro, lap steel guitar, pedal steel, fiddle, harmonica, mandolin, banjo, autoharp, bass, drums, upright bass, Hammond organ, accordion, washboard, mountain dulcimer |
| Soul | soul, motown, 60s soul, modern soul, gospel soul, northern soul, southern soul, classic soul, quiet storm | Rhodes, grand piano, Hammond organ, Wurlitzer, strings, trumpet, flugelhorn, saxophone, baritone saxophone, low brass, bass, drums, tambourine, handclaps, vibraphone, guitar |
| Blues | blues, electric blues, blues rock, delta blues, chicago blues, jazz blues, slow blues, blues shuffle, psychedelic blues | hollowbody guitar, guitar, grand piano, slide guitar, dobro, lap steel guitar, bass, drums, upright bass, walking bass, Hammond organ, harmonica, saxophone, wah guitar, washboard |
| Punk | punk, pop punk, emo, emo pop, punk rock, hardcore, y2k pop punk, indie pop punk, skate punk, melodic punk | distorted guitar, guitar, acoustic guitar, picked bass, bass, drums, kick drum, grand piano, organ |
| Latin | latin, bossa nova, latin jazz, latin pop, salsa, tango, flamenco, afro-cuban | nylon string guitar, Rhodes, grand piano, acoustic guitar, upright bass, bass, congas, bongos, timbales, claves, shaker, guiro, cowbell, maracas, agogo bells, cabasa, trumpet, saxophone, flute, bandoneon, castanet, vibraphone, cuica, pandeiro, surdo, repinique |
| Metal | metal, heavy metal, doom metal, progressive metal, industrial, death metal, black metal, thrash metal, nu metal, gothic metal | distorted guitar, guitar, seven-string guitar, eight-string guitar, baritone guitar, bass, drums, kick drum, timpani, synth pad, strings, choir, organ, orchestra, braams, low brass |
| Trap | trap, dark trap, emo rap, cloud rap, cinematic trap, trap soul, melodic trap, phonk | felt piano, guitar, pluck synth, strings, bells, 808, trap hi hats, kick drum, snare drum, synth pad, ambient pad, choir, vinyl noise, flute, pizzicato strings, braams, FX risers |
| Retro | retro, 50s, 60s, rock and roll, doo-wop, rockabilly, garage rock, surf rock, british invasion, oldies | guitar, tremolo guitar, grand piano, honky tonk piano, upright bass, slap bass, drums, tambourine, handclaps, organ, saxophone, harmonica, finger snaps, bells |
| Symphonic | symphonic, symphonic metal, symphonic rock, orchestral metal, orchestral rock, epic metal | distorted guitar, guitar, grand piano, strings, choir, french horn, low brass, tuba, trombone, violin, cello, orchestra, euphonium, string tremolo, bass, drums, timpani, kick drum, orchestral bass drum, harp, celesta, braams, wordless choir, solo soprano, tam tam, crash cymbal, tubular bells, xylophone |
| Disco | disco, nu-disco, nu disco, boogie, funky house, disco house, studio 54 | Rhodes, Wurlitzer, strings, Clavinet, slap bass, wah guitar, low brass, trumpet, saxophone, flute, kick drum, hi-hat, drums, tambourine, handclaps, congas, synth strings, analog synth pads, synth pad, orchestra hit |
| Funk | funk, funky, p-funk, parliament, funkadelic, groove | Clavinet, Rhodes, Wurlitzer, Hammond organ, slap bass, wah guitar, low brass, trumpet, tenor sax, trombone, talkbox, drums, hi-hat, handclaps, congas, bongos, tambourine, cowbell, vocoder, synth bass |
| Reggae | reggae, roots reggae, dancehall, ska, rocksteady, jamaican, dub music, dub reggae | organ, electric piano, Rhodes, melodica, guitar, bass, trumpet, trombone, saxophone, drums, nyabinghi drums, hi-hat, percussion, spring reverb, tape delay, dub siren |
| Afrobeat | afrobeat, afrobeats, amapiano, afropop, afro house, african, nigerian, south african | Rhodes, electric piano, synth, guitar, kora, talking drum, balafon, kalimba, shekere, saxophone, baritone saxophone, trumpet, ogene, djembe, percussion, drums, congas, shaker, 808, agogo bells, udu drum, synth pad, analog synth pads, log drums |
| House | house, deep house, tech house, progressive house, chicago house, garage, uk garage | synth pad, analog synth pads, sidechain pad, synth strings, Rhodes, electric piano, grand piano, organ, kick drum, hi-hat, 808, TR-909, handclaps, shaker, percussion, cowbell, congas, bongos, synth bass, bass, saxophone, choir, stabs, vocal chops |
| Trance | trance, psytrance, progressive trance, uplifting trance, vocal trance, goa, eurodance | supersaw, arpeggiator, synth pad, analog synth, pluck synth, gated pad, kick drum, hi-hat, 808, synth bass, grand piano, strings, synth strings, choir, wordless choir, solo soprano, synth choir, FX risers, impacts |
| Downtempo | downtempo, trip hop, trip-hop, triphop, chillout, chill out, slow electronic | synth pad, ambient pad, analog synth pads, shimmer pad, granular synth, Rhodes, electric piano, felt piano, vibraphone, drums, hi-hat, percussion, bass, synth bass, shaker, breakbeat, saxophone, trumpet, flute, wordless choir, strings, violin, vinyl noise, tape loops |
| Dream Pop | dream pop, dreampop, shoegaze, ethereal, dreamy, hazy | synth pad, shimmer pad, ambient pad, synth strings, guitar, tremolo guitar, synth, felt piano, drums, bass, hi-hat, shaker, tambourine, wordless choir, strings, glockenspiel, bells |
| Chillwave | chillwave, glo-fi, hypnagogic, bedroom pop, chillsynth | analog synth pads, synth pad, arpeggiator, synth, drums, synth bass, hi-hat, 808, shaker, guitar, Rhodes, felt piano, Wurlitzer, vinyl noise, tape loops, saxophone, wordless choir, glockenspiel |
| New Age | new age, newage, meditation, healing, spa, yoga, relaxation, wellness | synth pad, ambient pad, shimmer pad, drone, harp, grand piano, felt piano, nylon string guitar, kora, flute, shakuhachi, singing bowls, crystal bowls, kalimba, bansuri, bells, rain stick, ocean drum, shaker, frame drum, handpan |
| Hyperpop | hyperpop, hyper pop, pc music, bubblegum bass, glitchpop, digicore | supersaw, arpeggiator, synth, bitcrushed synth, pluck synth, pitched vocals, synth bells, glockenspiel, bells, distorted 808, 808, kick drum, trap hi hats, hi-hat, glitched vocals, vocoder, FX risers |
| Drill | drill, uk drill, chicago drill, ny drill, brooklyn drill | dark piano, strings, synth, guitar, sliding 808, drill hi hats, hi-hat, percussion, synth pad, ambient pad, synth strings, FX risers, impacts, brass stabs |
| Melodic Techno | melodic techno, techno, progressive techno, afterhours, peak time | synth pad, analog synth, arpeggiator, pluck synth, wavetable synth, Moog synth, kick drum, hi-hat, synth bass, percussion, ride cymbal, grand piano, strings, synth strings, wordless choir, solo soprano, breathy EWI, TB-303, FX risers, impacts, drone |
| Indie | indie, indie rock, indie pop, alt rock, alternative pop, bedroom indie | guitar, acoustic guitar, felt piano, grand piano, synth, drums, bass, hi-hat, tambourine, shaker, strings, glockenspiel, bells, trumpet, saxophone, synth pad, synth strings, ambient pad |

<!-- GENRE_TABLE_END -->

### Instrument Classification System

The app uses a 3-tier classification system to ensure variety while maintaining genre authenticity:

| Tier | Role | Count | Behavior |
|------|------|-------|----------|
| **Foundational** | Rhythm/harmony anchors | 14 | 0-1 injected to fill gaps |
| **Multi-genre** | Versatile wildcards | 53 | 1-2 injected for variety |
| **Orchestral Color** | Cinematic flavor | 22 | Gated to orchestral genres only |

**How selection works:**
1. Genre-specific pools are picked first (harmonic, pad, color, movement, rare)
2. Quota-based injection fills missing tiers without exceeding `maxTags`
3. Orchestral instruments only appear in cinematic/classical/videogame (or 15% chance in ambient)

This prevents "genre drift" while ensuring prompts have enough variety to produce interesting results.

<!-- INSTRUMENT_CLASSES_START -->

| Tier | Count | Instruments |
|------|-------|-------------|
| **Foundational** | 14 | drums, kick drum, hi-hat, snare drum, bass, sub-bass, strings, synth pad, synth, analog synth, digital synth, FM synth, arpeggiator, percussion |
| **Multi-genre** | 51 | 808, Clavinet, FX risers, Hammond organ, Moog synth, Rhodes, Wurlitzer, acoustic guitar, ambient pad, analog synth pads, baritone saxophone, bells, bongos, braams, congas, cowbell, distorted guitar, drone, electric piano, finger snaps, grand piano, guitar, handclaps, harmonica, impacts, kalimba, low brass, muted trumpet, organ, pedal steel, pluck synth, saxophone, shaker, shimmer pad, slap bass, supersaw, synth bass, synth choir, synth strings, tambourine, tape loops, trap hi hats, trombone, tubular bells, upright bass, vibraphone, vinyl noise, vocoder, wah guitar, washboard, xylophone |
| **Orchestral** | 22 | celesta, glockenspiel, harp, violin, cello, french horn, timpani, taiko drums, choir, wordless choir, piccolo, english horn, bass clarinet, contrabassoon, tuba, bass trombone, solo soprano, suspended cymbal, crash cymbal, tam tam, mark tree, orchestral bass drum |

<!-- INSTRUMENT_CLASSES_END -->

### Genre combinations
<!-- COMBINATIONS_START -->

jazz fusion, jazz funk, jazz hip-hop, nu jazz, acid jazz, electronic rock, electro pop, synth pop, future bass, chillwave, vaporwave, folk rock, folk pop, indie folk, chamber folk, blues rock, southern rock, progressive rock, psychedelic rock, art rock, indie rock, alternative rock, neo soul, psychedelic soul, funk soul, latin jazz, bossa nova, afrobeat, reggae fusion, progressive metal, symphonic metal, doom metal, trip hop, lo-fi hip hop, dark ambient, space ambient, drone ambient, disco funk, nu-disco, disco house, deep house, tech house, afro house, melodic house, dub techno, roots reggae, dream pop shoegaze, chillhop, downtempo electronica, lo-fi chill, uk drill, hyperpop trap, drill rap

<!-- COMBINATIONS_END -->

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
