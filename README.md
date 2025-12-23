# groq-suno-prompter

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

Artifacts land in `build/`.

## Output Format Contract

The generated prompt is constrained to a strict structure so Suno V5 responds consistently.

### Line 1 (mandatory)

```
[Mood, Genre/Style, Key: key/mode]
```

### Required metadata lines

- `Genre:`
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

## Architecture (high level)

### Prompt pipeline

- `src/bun/prompt/builders.ts`: constructs the system/context prompts.
- `src/bun/prompt/postprocess.ts`: strips leaked meta, enforces the output contract, truncates to limits.
- `src/bun/prompt/remix.ts`: field-line replacement helpers used by remix actions.

### Instruments + music “knowledge”

- `src/bun/instruments/registry.ts`: canonical instrument tags + aliases.
- `src/bun/instruments/genres/*`: per-genre instrument pools.
- `src/bun/instruments/datasets/*`: reusable datasets (harmonic/rhythm/time).
- `src/bun/instruments/services/*`:
  - `random.ts`: RNG utilities + deterministic seeded RNG for tests.
  - `select.ts`: pool selection logic.
  - `format.ts`: turns detected concepts into human-readable guidance.

### Import aliases

The project uses TS path aliases:

- `@bun/*` → `src/bun/*`
- `@shared/*` → `src/shared/*`
- `@/*` → `src/main-ui/*`

## Reference tables

### Genres (keywords → palette)

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

### Synth replacements

| Acoustic | Synth Alternatives |
|----------|-------------------|
| strings | synth strings, mellotron |
| choir | synth choir, mellotron, vocoder |
| trumpet, trombone, french horn | synth brass |
| flute | synth flute |
| bells, glockenspiel | synth bells |
| bass | synth bass, sub-bass |
| felt piano | synth piano, electric piano |

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
- AI: AI SDK v5 + Groq models
- Package manager/runtime: Bun
