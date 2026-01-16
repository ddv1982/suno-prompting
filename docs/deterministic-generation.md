# Deterministic Prompt Generation - How It Works

This guide explains how the app generates Suno prompts **instantly without AI**, making smart choices based on your inputs using curated databases of genres, instruments, moods, and production styles.

## Table of Contents

1. [What is Deterministic Generation?](#what-is-deterministic-generation)
2. [How Your Choices Affect Output](#how-your-choices-affect-output)
3. [Behind the Scenes: Decision Making](#behind-the-scenes-decision-making)
4. [Style Tags (MAX Mode)](#style-tags-max-mode)
5. [Randomness with Control](#randomness-with-control)
6. [Performance](#performance-why-its-instant)
7. [Data Sources](#data-sources)
8. [User Control vs Automation](#user-control-vs-automation)
9. [Examples](#examples-input--output)
10. [Quality Assurance](#quality-assurance)

---

## What is Deterministic Generation?

**Deterministic generation** means the app creates prompts using pre-built databases instead of calling an AI service.

### Key Benefits

- **Instant** - Generates prompts in 0.03-0.04ms (100x faster than AI)
- **Predictable** - Same inputs always produce the same outputs
- **Offline** - Works without internet connection
- **Consistent** - No AI randomness or hallucinations
- **Testable** - Every combination is tested and validated

### When It's Used

- **Creative Boost Mode** - All creativity levels use deterministic generation
- **Quick Vibes Mode** - All categories use deterministic templates
- **Standard Generation** - When you don't need AI creativity
- **MAX Mode** - Adds production tags deterministically

---

## How Your Choices Affect Output

### Creative Boost Mode

When you move the **creativity slider** (0-100), the app changes which genre pools, mood intensities, and blending strategies it uses:

#### Creativity Levels

| Level | Range | Strategy | Example Genres |
|-------|-------|----------|----------------|
| **Low** | 0-10 | Single pure genres only | jazz, rock, ambient, classical |
| **Safe** | 11-30 | Established combinations | jazz fusion, trip hop, indie folk |
| **Normal** | 31-60 | Mix of singles + blends (40% blend chance) | rock, electronic, or "jazz electronic" |
| **Adventurous** | 61-85 | Always blends 2-3 genres | "ambient electronic rock" |
| **High** | 86-100 | Experimental fusions | "doom metal bossa nova" |

#### What the App Selects

For each creativity level, the app automatically chooses:

1. **Genre(s)** - From creativity-appropriate pool
2. **Mood** - Intensity scales with creativity (calm → psychedelic)
3. **Instruments** - 4 instruments from genre's authentic palette
4. **Title** - Generated from word pools (more elaborate at higher levels)

#### Example Outputs

**Creativity 15 (Safe):**
```
Genre: "jazz fusion"
Mood: "warm"
Instruments: "Rhodes, tenor sax, upright bass, brushed drums"
Title: "Cozy Jazz Sessions"
```

**Creativity 75 (Adventurous):**
```
Genre: "ambient electronic rock"
Mood: "transcendent"
Instruments: "synth pad, electric guitar, bass, electronic drums"
Title: "Cosmic Horizons Ascending"
```

---

### Quick Vibes Categories

When you pick a **Quick Vibes category**, you get a pre-configured template optimized for that vibe:

| Category | Genres | Moods | Best For |
|----------|--------|-------|----------|
| **lofi-study** | lo-fi, chillhop, study beats | relaxed, focused, mellow | Study sessions, concentration |
| **cafe-coffeeshop** | cafe jazz, bossa nova, smooth jazz | cozy, warm, intimate | Background ambiance, relaxation |
| **ambient-focus** | ambient, atmospheric, soundscape | meditative, spacious, serene | Deep focus, meditation |
| **latenight-chill** | downtempo, chillout, nu jazz | nocturnal, smooth, sultry | Late night listening, unwinding |
| **cozy-rainy** | acoustic, folk, indie folk | cozy, nostalgic, peaceful | Rainy days, comfort |
| **lofi-chill** | lo-fi chill, bedroom pop | chill, laid-back, dreamy | Easy listening, relaxation |
| **workout-energy** | EDM, trap, electronic | powerful, intense, driving | Workouts, high energy |
| **morning-sunshine** | indie pop, acoustic, folk | bright, fresh, optimistic | Morning routines, positivity |
| **sunset-golden** | chillwave, indie, downtempo | warm, nostalgic, peaceful | Golden hour, relaxation |
| **dinner-party** | jazz, bossa nova, soul | elegant, sophisticated, smooth | Dinner parties, entertaining |
| **road-trip** | rock, indie, americana | free, adventurous, anthemic | Road trips, driving |
| **gaming-focus** | electronic, synthwave, cinematic | epic, immersive, intense | Gaming sessions, immersion |
| **romantic-evening** | R&B, soul, smooth jazz | intimate, sensual, tender | Romance, intimacy |
| **meditation-zen** | ambient, new age, drone | peaceful, calm, healing | Meditation, relaxation |
| **creative-flow** | ambient, electronic, lo-fi | inspired, focused, flowing | Creative work, productivity |
| **party-night** | house, EDM, disco | energetic, fun, celebratory | Parties, celebrations |

Each category has 6-8 genre options, 6 instrument combinations, and 8 mood descriptors aligned with the category feel.

---

## Behind the Scenes: Decision Making

Here's exactly how the app makes choices when you generate a prompt:

### Genre Selection

The genre system includes **60 genres** with support for aliases and multi-genre detection.

#### Basic Selection

```
YOUR INPUT:
Creativity = 75 (Adventurous level)

APP PROCESS:
1. Maps slider value → "adventurous" level
2. Loads adventurous genre pool
3. Decides blend count: 2 or 3 genres (30% chance for 3)
4. Random selection: picks "jazz" and "electronic"

OUTPUT:
Genre: "jazz electronic"
```

#### Genre Aliases

90+ alias mappings resolve common variations to canonical genres:

| User Input | Resolved Genre | Reason |
|------------|----------------|--------|
| "hip hop" | trap | Closest match in registry |
| "r&b" | rnb | Alternate spelling |
| "synth wave" | synthwave | Space variation |
| "doom metal" | stonerrock | Sonic characteristics |
| "dnb" | drumandbass | Common abbreviation |

**Alias categories include:** hip-hop variants, R&B variants, synth variants, metal variants, electronic variants, rock variants, drum & bass variants, jazz variants, and more.

#### Multi-Genre Detection

The system automatically detects up to 4 genres in descriptions:

```
INPUT:
Description: "jazz rock fusion with electronic beats"

OUTPUT:
Detected: ['jazz', 'rock', 'electronic'] (3 genres)
Display: "jazz rock electronic"
Primary: 'jazz' (first detected)
```

---

### Instrument Selection

#### Basic Selection

```
INPUT:
Genre: "jazz electronic"

APP PROCESS:
1. Looks up jazz instruments: [Rhodes, piano, tenor sax, trumpet, upright bass, brushed drums, vibraphone]
2. Looks up electronic instruments: [synth, synth pad, drum machine, bass synth, arpeggiator, sampler]
3. Smart blending: Select 2 from jazz, 2 from electronic
4. Ensure coherence and avoid conflicts

OUTPUT:
Instruments: "Rhodes, synth pad, tenor sax, drum machine"
```

The app knows which instruments work together and avoids conflicts (e.g., never picks both Rhodes and Wurlitzer).

#### Era-Based Instruments

Period-specific instrument selection for authentic decade-based sounds:

| Era | Signature Instruments | Character |
|-----|----------------------|-----------|
| **70s** | Moog, Rhodes, clavinet, Mellotron, ARP Odyssey | Analog warmth, funk |
| **80s** | DX7, LinnDrum, Juno pads, Fairlight CMI, Jupiter-8 | Digital clarity, gated reverb |
| **90s** | TB-303, breakbeats, TR-909, Supersaw, Amen break | Dance, grunge, big beat |
| **Modern** | Serum, Omnisphere, Massive X, Kontakt, Vital | Software synthesis, hybrid |

#### Ensemble Presets

10 pre-defined instrument groupings with genre compatibility:

| Ensemble | Instruments | Compatible Genres |
|----------|-------------|-------------------|
| **String Quartet** | violin, viola, cello, double bass | classical, cinematic, jazz, ambient |
| **Horn Section** | trumpet, trombone, saxophone | jazz, funk, soul, disco, latin |
| **Jazz Combo** | piano, upright bass, drums, saxophone | jazz, blues, lofi, soul |
| **Rock Band** | electric guitar, bass guitar, drums | rock, punk, metal, indie |
| **Synth Stack** | lead synth, pad synth, bass synth | electronic, synthwave, house, trance |
| **World Percussion** | djembe, congas, shaker, tambourine | afrobeat, latin, reggae, folk |

---

### Mood Selection

#### Basic Selection

```
INPUT:
Creativity level: Adventurous

APP PROCESS:
1. Loads adventurous mood pool: [intense, chaotic, transcendent, primal, haunting, explosive]
2. Random selection from pool

OUTPUT:
Mood: "transcendent"
```

#### Mood Category Override

20 mood categories let you override the default mood selection:

| Category | Moods | Best Used For |
|----------|-------|---------------|
| **Energetic** | lively, vibrant, powerful, dynamic | Upbeat tracks |
| **Calm** | peaceful, tranquil, serene, gentle | Relaxation |
| **Melancholic** | wistful, pensive, bittersweet | Emotional depth |
| **Joyful** | cheerful, uplifting, bright, playful | Happy vibes |
| **Dark** | ominous, brooding, mysterious | Atmospheric |
| **Atmospheric** | ethereal, ambient, spacious | Soundscapes |
| **Groove** | funky, rhythmic, danceable | Rhythmic tracks |
| **Dreamy** | surreal, hypnotic, floating | Psychedelic |
| **Epic** | grandiose, cinematic, powerful | Big productions |
| **Nostalgic** | vintage, retro, reminiscent | Throwback |

#### Compound Moods

25 compound moods blend two emotional qualities for richer prompts:

| Type | Examples | Effect |
|------|----------|--------|
| **Contrasting** | bittersweet nostalgia, dark euphoria, chaotic joy | Emotional complexity |
| **Complex states** | melancholic triumph, restless serenity, gentle fury | Depth and nuance |
| **Atmospheric** | ethereal darkness, warm desolation, bright sorrow | Rich sonic texture |

Genre affinities ensure contextually appropriate selection:
- **Jazz** prefers: tender melancholy, wistful optimism, quiet desperation
- **Electronic** prefers: dark euphoria, chaotic joy, ethereal darkness
- **Metal** prefers: aggressive hope, fierce tenderness, raw elegance

#### Mood Intensity

3-level intensity scaling for mood words:

| Level | Description | Example (peaceful) |
|-------|-------------|-------------------|
| **Mild** | Subtle, understated | gentle |
| **Moderate** | Standard, balanced | peaceful |
| **Intense** | Strong, powerful | blissful |

---

### Title Generation

The title system uses **269 unique words** across 5 categories with **200 genre-specific patterns**.

#### Vocabulary

| Category | Count | Examples |
|----------|-------|----------|
| **EMOTION_WORDS** | 60 | Dream, Memory, Shadow, Joy, Sorrow, Passion |
| **ACTION_WORDS** | 50 | Rising, Falling, Dancing, Soaring, Blazing |
| **TIME_WORDS** | 46 | Midnight, Dawn, Spring, Forever, Golden Hour |
| **NATURE_WORDS** | 65 | Ocean, Storm, Nebula, Blossom, Thunder |
| **ABSTRACT_WORDS** | 48 | Infinity, Journey, Rhythm, Mystery, Cosmos |

**Total combinations:** 100,000+ unique titles

#### Topic-Aware Generation

If a description is provided, the system extracts keywords:

```
INPUT DESCRIPTION: "midnight rain and lost love"

KEYWORD EXTRACTION:
1. "midnight" → TIME: ['Midnight', 'Night']
2. "rain" → NATURE: ['Rain', 'Storm', 'Water']
3. "lost" → EMOTION: ['Lost', 'Shadow', 'Memory']
4. "love" → EMOTION: ['Love', 'Heart', 'Dream']
```

#### Pattern Types

- **2-word:** `{emotion} {nature}` → "Shadow Ocean"
- **3-word:** `{emotion} of the {nature}` → "Shadow of the Moon"
- **Possessive:** `{nature}'s {emotion}` → "Ocean's Memory"
- **Complex:** `When {nature} {action}s` → "When Thunder Strikes"

#### Genre-Specific Patterns

- **Jazz:** "Blue {nature}", "The {emotion} of {time}"
- **Electronic:** "{emotion}.exe", "System {abstract}", "Cyber {nature}"
- **Ambient:** "{emotion} in the {abstract}", "Whispers of {nature}"
- **Rock:** "Born to {action}", "{emotion} Never Dies"

---

## Style Tags (MAX Mode)

When **MAX mode** is enabled, the app enriches your prompt with production descriptors.

### Recording Context

Genre-specific recording environments (141 contexts across 18 genres):

| Genre | Example Contexts |
|-------|------------------|
| **Jazz** | "intimate jazz club", "blue note studio vibe", "smoky club atmosphere" |
| **Electronic** | "modular synth setup", "digital production studio", "hybrid analog-digital rig" |
| **Rock** | "live room tracking", "vintage rock studio", "garage band setup" |
| **Blues** | "delta blues porch recording", "juke joint atmosphere", "one-mic blues capture" |

**Conflict prevention** ensures coherent combinations (no "analog" + "digital", no "professional" + "demo").

### Production Tag Categories

| Category | What It Adds | Examples |
|----------|--------------|----------|
| **Vocal Performance** | Vocal style and delivery | smooth vocals, breathy whisper, powerful belt |
| **Spatial Audio** | Stereo field characteristics | wide stereo field, intimate mono, spacious reverb |
| **Texture Descriptors** | Tonal qualities | warm saturation, crisp highs, vintage grain |
| **Harmonic Descriptors** | Tonal richness | rich harmonics, lush overtones, complex chord voicings |
| **Dynamic Range** | Loudness processing | compressed dynamics, punchy transients, wide dynamic range |
| **Temporal Effects** | Time-based processing | subtle reverb tail, ping-pong delay, chorus depth |

### Genre-Specific Tag Weights

Each of the 60 genres has tailored probabilities for tag categories:

| Genre Family | Vocal | Spatial | Harmonic | Dynamic | Temporal |
|--------------|-------|---------|----------|---------|----------|
| **Jazz/Blues** | High (0.8) | Moderate | Moderate | Low | Low |
| **Electronic** | Low (0.4) | High (0.7) | Low | Moderate | Moderate |
| **Rock** | Moderate | Moderate | Low | High (0.55) | Moderate |
| **Ambient** | Very Low (0.15) | Very High (0.85) | Moderate | Low | Low |
| **Classical** | Low | High (0.75) | High (0.7) | Moderate | Low |

### Coherence Validation

5 conflict rules ensure musically sensible combinations:

| Rule | Conflict | Example |
|------|----------|---------|
| **distorted-intimate** | Heavy sounds + gentle production | distorted guitar + whisper vocal |
| **acoustic-digital** | Acoustic instruments + heavy digital processing | acoustic guitar + glitch effects |
| **orchestral-lofi** | Orchestral instruments + lo-fi production | symphony + vinyl crackle |
| **delicate-aggressive** | Delicate instruments + aggressive production | music box + crushing compression |
| **vintage-futuristic** | Vintage instruments + futuristic production | gramophone + sci-fi effects |

**Creativity-aware:** Strict validation at 0-60 creativity, permissive at 61-100 (allows experimental combinations).

---

## Randomness with Control

The deterministic system uses **controlled randomness** - random selections from carefully curated pools.

### How It Works

```javascript
// Genre blending decision (normal creativity)
if (randomNumber < 0.4) {
  // 40% chance: blend 2 genres
  genres = [selectRandom(pool), selectRandom(pool)]
} else {
  // 60% chance: single genre
  genres = [selectRandom(pool)]
}
```

### Seeded Randomness (Testing)

For reproducibility, you can provide a seed number:

```typescript
// Same seed = same results every time
buildDeterministicCreativeBoost(75, [], false, true, {
  rng: seededRng(12345)
})

// Seed 12345 always produces:
// → "jazz electronic", "Rhodes, synth pad, bass, drums", "transcendent"
```

---

## Performance: Why It's Instant

### Comparison

**Traditional AI Approach:**
```
Network request ............... 100-500ms
AI processing ................. 1-3 seconds
Response parsing .............. 50-100ms
TOTAL: 2-4 seconds
```

**Deterministic Approach:**
```
Genre lookup .................. 0.01ms
Instrument selection .......... 0.01ms
Mood selection ................ 0.01ms
Prompt assembly ............... 0.01ms
TOTAL: 0.03-0.04ms (100x faster!)
```

### Benchmark Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Average | <50ms | 0.03ms | 1,600x better |
| 95th percentile | <50ms | 0.05ms | 1,000x better |
| 99th percentile | <50ms | 0.06ms | 830x better |
| Maximum | <50ms | 0.15ms | 330x better |

---

## Data Sources

All choices come from carefully curated, tested databases:

| Data Source | Size | Description |
|-------------|------|-------------|
| **Genre Registry** | 60 genres | Authentic instrument pools, compatible combinations |
| **Instrument Database** | 500+ instruments | 250+ aliases, exclusion rules, category organization |
| **Mood Categories** | 20 categories | 8-12 compatible moods each, genre mappings |
| **Compound Moods** | 25 moods | Genre affinities for contextual selection |
| **Mood Intensity** | 60+ base moods | 3-level scaling (mild/moderate/intense) |
| **Era Instruments** | 4 eras × 12 | Period-specific sounds (70s/80s/90s/modern) |
| **Ensemble Presets** | 10 presets | Genre compatibility mappings |
| **Genre Aliases** | 90+ mappings | Hip-hop, R&B, metal, electronic, jazz variants |
| **Tag Weights** | 60 genres | 5 weight categories per genre |
| **Conflict Rules** | 5 rules | Instrument-production coherence |
| **Title Words** | 269 words | 5 categories, 220+ keyword mappings |
| **Title Patterns** | 200 patterns | 23 genre-specific sets + defaults |
| **Recording Contexts** | 141 contexts | 18 genres with authentic environments |
| **Style Descriptors** | 200+ tags | 7 categories with genre probabilities |

**All data is:**
- Reviewed by developers
- Tested in 3,689 automated tests (24,863 assertions)
- Validated for musical coherence
- Regularly updated and expanded

---

## User Control vs Automation

### You Control

- **Creativity level** (0-100) - Determines genre pools, blending strategy, mood intensity
- **Seed genres** - App uses your genres if provided
- **Wordless vocals** - Enable/disable vocal elements
- **MAX mode** - Simple vs detailed prompt with production tags
- **Mood category** - Override creativity-based mood with specific vibe
- **Quick Vibes category** - Choose from 16 pre-made templates

### App Decides

- **Which specific genres** from creativity-appropriate pool
- **Which instruments** fit the selected genre(s)
- **Which mood** fits creativity level or mood category
- **Which style tags** enhance the production (MAX mode)
- **Title structure** and word selection
- **Blending strategy** when combining genres

**Result:** You guide the direction → App handles expert details

---

## Examples: Input → Output

### Example 1: Creative Boost - Adventurous

```
INPUT:
Creativity: 85, MAX mode: No

APP DECISIONS:
1. Map 85 → "adventurous" level
2. Select 3 genres → "ambient electronic rock"
3. Select mood → "transcendent"
4. Blend instruments from all genres
5. Generate elaborate title

OUTPUT:
Genre: "ambient electronic rock"
Mood: "transcendent"
Instruments: "synth pad, electric guitar, bass, drum machine"
Title: "Cosmic Horizons Ascending"
```

### Example 2: Quick Vibes - lofi-study

```
INPUT:
Category: lofi-study, Mood override: "Focus", MAX mode: Yes

APP DECISIONS:
1. Load lofi-study template
2. Select genre → "lo-fi hip hop"
3. Override mood with Focus category → "concentrated"
4. Select instrument combo → Rhodes, vinyl crackle, soft drums
5. Add MAX mode production tags

OUTPUT:
Genre: "lo-fi hip hop"
Mood: "concentrated"
Instruments: "Rhodes piano, vinyl crackle, soft drums"
Title: "Warm Beats to Study To"
```

### Example 3: Mood Category Override

```
SCENARIO A: Creativity 40, No mood category
→ Normal mood pool selection → "melancholic"
OUTPUT: melancholic jazz

SCENARIO B: Creativity 40, Mood category: "Energetic"
→ Energetic mood pool selection → "vibrant"
OUTPUT: vibrant jazz

Same creativity, same genre, different mood = completely different vibe!
```

### Example 4: Topic-Aware Title

```
INPUT:
Description: "midnight ocean dreams under starlight"

KEYWORD EXTRACTION:
- "midnight" → TIME: ['Midnight', 'Night']
- "ocean" → NATURE: ['Ocean', 'Waves']
- "dreams" → EMOTION: ['Dream', 'Spirit']

PATTERN: "{nature} {emotion}"
WORDS: "Ocean" + "Dreams" (from keywords)

OUTPUT:
Title: "Ocean Dreams" (matches description theme)
```

### Example 5: Genre-Aware Recording Context

```
INPUT:
Genre: "jazz", MAX mode: Yes

APP DECISIONS:
1. Check for genre-specific contexts
2. Jazz contexts available → "intimate jazz club", "blue note studio vibe", etc.
3. Select: "intimate jazz club"
4. Add conflict-free structured tags: "raw performance energy, live venue capture, warm analog console"

OUTPUT:
Recording: "intimate jazz club"
Tags: "raw performance energy, live venue capture, warm analog console"
```

---

## Quality Assurance

### Automated Testing

- **3,689 tests** verify all combinations work correctly
- **24,863 assertions** validate expected behavior
- **100% pass rate** maintained across all refactoring

### Test Categories

1. **Unit tests** - Each module tested independently
2. **Integration tests** - Systems work together correctly
3. **Performance tests** - Generation stays under 50ms (actual: 0.03ms)
4. **Variety tests** - Outputs show appropriate diversity
5. **Regression tests** - Prevent breaking changes

### Quality Checks

- **Genre-Instrument Compatibility** - Every genre has validated instrument pools
- **Mood Appropriateness** - Moods match creativity intensity levels
- **Production Tag Relevance** - Electronic gets digital tags, acoustic gets analog
- **Recording Context Quality** - 141 genre-specific contexts, all conflict-free
- **Title Generation Quality** - 100,000+ combinations, no nonsensical outputs
- **Coherence Validation** - 5 conflict rules with creativity-aware strictness

### Continuous Validation

- Pre-commit hooks run tests automatically
- CI/CD validates every change
- Type safety enforced with TypeScript strict mode
- Performance regressions detected automatically

---

## Summary

The deterministic generation system provides:

- **Speed** - 100x faster than AI (0.03ms vs 2-4 seconds)
- **Precision** - Same inputs = same outputs
- **Quality** - Curated data, tested combinations
- **Variety** - Controlled randomness from quality pools
- **Reliability** - Works offline, no API failures
- **Tested** - 3,689 tests validate correctness
- **Topic-Aware** - 220+ keywords map descriptions to relevant titles
- **Rich Vocabulary** - 269 words × 200 patterns = 50,000+ unique titles
- **Smart Aliases** - 90+ genre mappings for flexible input
- **Genre Weights** - 60 genres with tailored tag probabilities

**Your role:** Guide the direction with creativity level, mood category, Quick Vibes, and optional description

**App's role:** Make expert musical decisions from validated databases

The result is professional-quality Suno prompts generated instantly, with full control over the creative direction but without needing deep music production knowledge.

---

**Questions or suggestions?** File an issue on GitHub or check the test files for more examples!
