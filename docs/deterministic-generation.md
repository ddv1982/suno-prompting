# Deterministic Prompt Generation - How It Works

This guide explains how the app generates Suno prompts **instantly without AI**, making smart choices based on your inputs using curated databases of genres, instruments, moods, and production styles.

> **✨ v3.1.0 Update:** Enhanced deterministic system with genre aliases (70+ mappings), genre-specific tag weights (60 genres), coherence validation (5 conflict rules), and multi-genre auto-detection (up to 4 genres). See new sections for [Genre Aliases](#genre-aliases-v31), [Genre-Specific Tag Weights](#genre-specific-tag-weights-v31), [Coherence Validation](#coherence-validation-v31), and [Multi-Genre Detection](#multi-genre-detection-v31).

## Table of Contents

1. [What is Deterministic Generation?](#what-is-deterministic-generation)
2. [How Your Choices Affect Output](#how-your-choices-affect-output)
3. [Behind the Scenes: Decision Making](#behind-the-scenes-decision-making)
4. [Style Tags (MAX Mode)](#style-tags-max-mode)
5. [Randomness with Control](#randomness-with-control)
6. [Mood Category Integration](#mood-category-integration)
7. [Compound Moods (v3.0)](#compound-moods-v30)
8. [Mood Intensity (v3.0)](#mood-intensity-v30)
9. [Era-Based Instruments (v3.0)](#era-based-instruments-v30)
10. [Ensemble Presets (v3.0)](#ensemble-presets-v30)
11. [Genre Aliases (v3.1)](#genre-aliases-v31)
12. [Genre-Specific Tag Weights (v3.1)](#genre-specific-tag-weights-v31)
13. [Coherence Validation (v3.1)](#coherence-validation-v31)
14. [Multi-Genre Detection (v3.1)](#multi-genre-detection-v31)
15. [Performance: Why It's Instant](#performance-why-its-instant)
16. [Data Sources](#data-sources)
17. [User Control vs Automation](#user-control-vs-automation)
18. [Examples: Input → Output](#examples-input--output)
19. [Quality Assurance](#quality-assurance)

---

## What is Deterministic Generation?

**Deterministic generation** means the app creates prompts using pre-built databases instead of calling an AI service.

### Key Benefits

✅ **Instant** - Generates prompts in 0.03-0.04ms (100x faster than AI)  
✅ **Predictable** - Same inputs always produce the same outputs  
✅ **Offline** - Works without internet connection  
✅ **Consistent** - No AI randomness or hallucinations  
✅ **Testable** - Every combination is tested and validated

### When It's Used

- **Creative Boost Mode** - All creativity levels use deterministic generation
- **Quick Vibes Mode** - All 6 categories use deterministic templates
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

| Category | Genres | Moods | Instruments | Best For |
|----------|--------|-------|-------------|----------|
| **lofi-study** | lo-fi, chillhop, study beats | relaxed, focused, mellow | Rhodes, vinyl crackle, soft drums | Study sessions, concentration |
| **cafe-coffeeshop** | cafe jazz, bossa nova, smooth jazz | cozy, warm, intimate | acoustic guitar, upright bass, piano | Background ambiance, relaxation |
| **ambient-focus** | ambient, atmospheric, soundscape | meditative, spacious, serene | synth pad, field recordings, drones | Deep focus, meditation |
| **latenight-chill** | downtempo, chillout, nu jazz | nocturnal, smooth, sultry | electric piano, bass synth, soft drums | Late night listening, unwinding |
| **cozy-rainy** | acoustic, folk, indie folk | cozy, nostalgic, peaceful | acoustic guitar, piano, strings | Rainy days, comfort |
| **lofi-chill** | lo-fi chill, bedroom pop | chill, laid-back, dreamy | lo-fi piano, tape saturation, mellow drums | Easy listening, relaxation |
| **workout-energy** | EDM, trap, electronic | powerful, intense, driving | synth, 808, heavy drums | Workouts, high energy |
| **morning-sunshine** | indie pop, acoustic, folk | bright, fresh, optimistic | acoustic guitar, piano, bells | Morning routines, positivity |
| **sunset-golden** | chillwave, indie, downtempo | warm, nostalgic, peaceful | synth pad, guitar, soft drums | Golden hour, relaxation |
| **dinner-party** | jazz, bossa nova, soul | elegant, sophisticated, smooth | piano, upright bass, saxophone | Dinner parties, entertaining |
| **road-trip** | rock, indie, americana | free, adventurous, anthemic | electric guitar, drums, bass | Road trips, driving |
| **gaming-focus** | electronic, synthwave, cinematic | epic, immersive, intense | synth, orchestra, drums | Gaming sessions, immersion |
| **romantic-evening** | R&B, soul, smooth jazz | intimate, sensual, tender | Rhodes, strings, soft drums | Romance, intimacy |
| **meditation-zen** | ambient, new age, drone | peaceful, calm, healing | singing bowls, pads, nature sounds | Meditation, relaxation |
| **creative-flow** | ambient, electronic, lo-fi | inspired, focused, flowing | synth pad, piano, soft beats | Creative work, productivity |
| **party-night** | house, EDM, disco | energetic, fun, celebratory | synth, drums, bass | Parties, celebrations |

Each category has:
- **6-8 genre options** to randomly select from
- **6 instrument combinations** that fit the vibe
- **8 mood descriptors** aligned with the category feel

**v3.0 expansion:** 16 total categories (up from 6), covering diverse use cases from workouts to meditation.

---

## Behind the Scenes: Decision Making

Here's exactly how the app makes choices when you generate a prompt:

### Step 1: Genre Selection

```
YOUR INPUT:
Creativity = 75 (Adventurous level)

APP PROCESS:
1. Maps slider value → "adventurous" level
2. Loads adventurous genre pool: [ambient, jazz, electronic, rock, classical, folk, hip hop, r&b, metal, punk, world, experimental]
3. Decides blend count: 2 or 3 genres (30% chance for 3)
4. Random selection: picks "jazz" and "electronic"

OUTPUT:
Genre: "jazz electronic"
```

**With Seed Genres:**
If you provide seed genres (e.g., "jazz", "rock"), the app uses those instead and applies blending rules based on creativity level.

---

### Step 2: Instrument Selection

```
INPUT:
Genre: "jazz electronic"

APP PROCESS:
1. Looks up jazz instruments in GENRE_REGISTRY:
   → [Rhodes, piano, tenor sax, trumpet, upright bass, brushed drums, vibraphone]

2. Looks up electronic instruments:
   → [synth, synth pad, drum machine, bass synth, arpeggiator, sampler]

3. Smart blending algorithm:
   - Select 2 from jazz (Rhodes, tenor sax)
   - Select 2 from electronic (synth pad, drum machine)
   - Ensure coherence and avoid conflicts

OUTPUT:
Instruments: "Rhodes, synth pad, tenor sax, drum machine"
```

The app knows which instruments work together and avoids conflicts (e.g., never picks both Rhodes and Wurlitzer).

---

### Step 3: Mood Selection

```
INPUT:
Creativity level: Adventurous

APP PROCESS:
1. Loads adventurous mood pool: 
   [intense, chaotic, transcendent, primal, haunting, explosive]
   
2. Random selection from pool

OUTPUT:
Mood: "transcendent"
```

**With Mood Category Override:**

```
INPUT:
Creativity: Adventurous
Mood Category: "Energetic" (user selected)

APP PROCESS:
1. Ignores adventurous mood pool
2. Loads energetic category moods:
   [lively, vibrant, powerful, dynamic, vigorous, spirited, exhilarating]
   
3. Random selection from energetic pool

OUTPUT:
Mood: "vibrant" (from energetic category, not adventurous)
```

This allows you to override the mood while keeping the genre selection from the creativity level.

---

### Step 4: Title Generation (Enhanced v2.0)

The title generation system uses **269 unique words** across 5 categories with **159 genre-specific patterns** to create contextually appropriate, topic-aware song titles.

#### Title Vocabulary (269 words)

| Category | Count | Examples | Description |
|----------|-------|----------|-------------|
| **EMOTION_WORDS** | 60 | Dream, Memory, Shadow, Joy, Sorrow, Passion | Feelings, states, connections, intensity |
| **ACTION_WORDS** | 50 | Rising, Falling, Dancing, Soaring, Blazing | Movement, change, flow, impact (gerund form) |
| **TIME_WORDS** | 46 | Midnight, Dawn, Spring, Forever, Golden Hour | Seasons, time periods, poetic time, cycles |
| **NATURE_WORDS** | 65 | Ocean, Storm, Nebula, Blossom, Thunder | Weather, landscapes, celestial, flora, elements |
| **ABSTRACT_WORDS** | 48 | Infinity, Journey, Rhythm, Mystery, Cosmos | Concepts, philosophy, cosmic themes |

**Total combinations:** 100,000+ unique titles (4× expansion from v1.0)

---

#### Phase 1: Keyword Extraction (Topic-Aware)

If a description is provided, the system extracts keywords and maps them to word categories:

```
INPUT DESCRIPTION: "midnight rain and lost love"

KEYWORD EXTRACTION (word boundary matching):
1. "midnight" → TIME: ['Midnight', 'Night']
2. "rain" → NATURE: ['Rain', 'Storm', 'Water']
3. "lost" → EMOTION: ['Lost', 'Shadow', 'Memory']
4. "love" → EMOTION: ['Love', 'Heart', 'Dream']

RESULT: 
{
  time: ['Midnight', 'Night'],
  nature: ['Rain', 'Storm', 'Water'],
  emotion: ['Lost', 'Shadow', 'Memory', 'Love', 'Heart', 'Dream']
}
```

**Keyword mappings (170+ total):**
- TIME_KEYWORDS: 50+ (night, morning, seasons, forever, etc.)
- NATURE_KEYWORDS: 70+ (ocean, storm, celestial, flora, etc.)
- EMOTION_KEYWORDS: 50+ (love, grief, passion, wonder, etc.)
- ACTION_KEYWORDS: 11 (rise, fall, dance, etc.)
- ABSTRACT_KEYWORDS: 40+ (rhythm, journey, cosmic, mystery, etc.)

**Precision:** Uses word boundary regex to prevent false matches (e.g., "nightingale" won't match "night")

---

#### Phase 2: Pattern Selection

The system selects from **159 title patterns** (20 genre-specific sets + defaults):

**Pattern types:**

1. **2-word patterns** (classic):
   - `{emotion} {nature}` → "Shadow Ocean"
   - `{time} {emotion}` → "Midnight Dreams"
   - `{action} {nature}` → "Dancing Fire"

2. **3-word patterns** (new in v2.0):
   - `{emotion} of the {nature}` → "Shadow of the Moon"
   - `{action} Through {nature}` → "Dancing Through Fire"
   - `The {emotion} {action}` → "The Rising Shadow"
   - `{time} in {abstract}` → "Midnight in Eternity"

3. **Possessive patterns** (new in v2.0):
   - `{nature}'s {emotion}` → "Ocean's Memory"
   - `{time}'s {action}` → "Midnight's Rising"
   - `{emotion}'s {nature}` → "Dream's Fire"

4. **Complex patterns** (new in v2.0):
   - `When {nature} {action}s` → "When Thunder Strikes"
   - `{emotion} and {nature}` → "Shadow and Storm"
   - `Between {time} and {emotion}` → "Between Midnight and Dreams"

**Genre-specific patterns:**
- **Jazz** (11 patterns): "Blue {nature}", "The {emotion} of {time}", "{action} Through {nature}"
- **Electronic** (11 patterns): "{emotion}.exe", "System {abstract}", "Cyber {nature}"
- **Ambient** (10 patterns): "{emotion} in the {abstract}", "Whispers of {nature}"
- **Rock** (11 patterns): "Born to {action}", "{emotion} Never Dies"
- **16 other genres** with 6 patterns each

---

#### Phase 3: Word Selection

```
APP PROCESS (with topic awareness):

1. Pattern selected: "{nature}'s {emotion}"

2. Word selection for {nature}:
   IF keywords extracted:
     - 60% chance: Use keyword word (e.g., 'Ocean' from "ocean" keyword)
     - 40% chance: Use mood-filtered word from NATURE_WORDS
   ELSE:
     - Use mood-filtered word from NATURE_WORDS
     
3. Word selection for {emotion}:
   Same logic → 'Dream' (from "love" keyword mapping)
   
4. Apply mood weights:
   - Mood "melancholic" prefers: Shadow, Rain, Memory, Sorrow, Grief
   - Mood "melancholic" avoids: Joy, Bliss, Laughter, Summer

OUTPUT:
Title: "Ocean's Dream" (topic-aware, from extracted keywords)
```

**Without description:**
- Uses mood-filtered words from full vocabulary pools
- Example: "Crystal Serenity" (generic mood-based)

---

#### Phase 4: Assembly

```
INPUT:
Genre: "ambient"
Mood: "dreamy"
Description: "midnight ocean dreams under starlight"

FINAL ASSEMBLY:
1. Keywords extracted → {time: ['Midnight'], nature: ['Ocean'], emotion: ['Dream']}
2. Pattern selected → "{nature} {emotion}" (2-word ambient pattern)
3. Words selected → "Ocean" (from keywords), "Dreams" (from keywords)
4. Result assembled → "Ocean Dreams"

OUTPUT:
Title: "Ocean Dreams" (topic-aware, matches user's description theme)
```

**Title complexity scales with creativity:**
- **Low (0-10):** Simple 2-word patterns
- **Safe (11-30):** Mix of 2-word and possessive patterns
- **Normal (31-60):** All pattern types, 30% chance for complex
- **Adventurous (61-85):** Prefer 3-word and complex patterns
- **High (86-100):** Always use elaborate patterns

---

## Style Tags (MAX Mode)

When **MAX mode** is enabled, the app enriches your prompt with production descriptors organized into 7 categories:

### 1. Recording Context

**What it adds:** Production environment and recording technique with conflict prevention

**How it works (NEW in v2):**

1. **Genre-specific contexts**: 18 genres have authentic recording environments
   - Example: jazz → "intimate jazz club", "bebop era recording", "smoky club atmosphere"
   - Example: electronic → "modular synth setup", "professional edm studio", "hybrid analog-digital rig"
   - Example: rock → "live room tracking", "vintage rock studio", "garage band setup"
   - 141 unique genre-specific descriptors total

2. **Structured selection with conflict prevention**:
   - ONE production quality (professional/demo/raw)
   - ONE environment (studio/live/home/rehearsal/outdoor)
   - ONE technique (analog/digital/hybrid)
   - Optional characteristics (intimate/spacious/vintage/modern)

3. **Genre-aware intelligence**:
   - Electronic → digital production, studio environments
   - Jazz/blues → analog warmth, live venues
   - Lo-fi/bedroom pop → home recording, DIY aesthetic
   - Punk/garage → rehearsal space energy

**Benefits:**
- ✅ No more conflicting tags ("professional" + "demo")
- ✅ Genre-appropriate techniques (electronic gets digital, jazz gets analog)
- ✅ Musically coherent combinations
- ✅ Authentic production environments per genre

**Examples:**
- Jazz: "intimate jazz club" or "raw performance energy, live venue capture, warm analog console"
- Electronic: "digital production studio" or "professional polish, studio warmth, digital production clarity"
- Lo-fi: "bedroom r&b session" or "demo roughness, intimate bedroom recording, cassette tape saturation"

---

### 1a. Genre-Specific Recording Contexts (v2.0.0)

**NEW**: Each genre has 5-10 authentic recording environment descriptors:

| Genre | Example Contexts |
|-------|------------------|
| **Jazz** | "intimate jazz club", "blue note studio vibe", "smoky club atmosphere", "bebop era recording" |
| **Electronic** | "modular synth setup", "digital production studio", "hybrid analog-digital rig", "professional edm studio" |
| **Rock** | "live room tracking", "vintage rock studio", "garage band setup", "classic rock recording booth" |
| **Blues** | "delta blues porch recording", "juke joint atmosphere", "one-mic blues capture", "mississippi delta field recording" |
| **Classical** | "concert hall recording", "symphonic venue capture", "cathedral recording", "chamber music setting" |
| **Hip Hop** | "underground hip hop studio", "basement rap session", "boom bap production setup", "modern trap studio" |
| **Country** | "nashville studio session", "honky tonk recording", "country barn recording", "texas studio sound" |
| **Metal** | "metal studio production", "underground metal recording", "doom metal cave", "black metal forest session" |

**How selection works:**
1. If genre has specific contexts (jazz, rock, electronic, etc.) → picks from genre pool
2. If no genre-specific contexts → uses structured category selection
3. Result: Authentic production environments that match the musical style

**Total variety:** 141 genre-specific contexts + structured combinations = thousands of conflict-free possibilities

---

### 2. Vocal Performance

**What it adds:** Vocal style and delivery (only if vocals are enabled)

**Genre probability:**
- Pop/R&B: 80% chance of vocal tags
- Ambient/Instrumental: 20% chance
- Rock/Electronic: 50% chance

**Examples:**
- "smooth vocals"
- "breathy whisper"
- "powerful belt"
- "layered harmonies"

---

### 3. Spatial Audio

**What it adds:** Stereo field and spatial characteristics

**Examples:**
- "wide stereo field"
- "intimate mono"
- "spacious reverb"
- "tight centered mix"

---

### 4. Texture Descriptors

**What it adds:** Tonal qualities and sonic character

**Examples:**
- "warm saturation"
- "crisp highs"
- "vintage grain"
- "smooth polish"

---

### 5. Harmonic Descriptors

**What it adds:** Tonal richness and harmonic content

**Examples:**
- "rich harmonics"
- "lush overtones"
- "clean fundamental"
- "complex chord voicings"

---

### 6. Dynamic Range

**What it adds:** Loudness and dynamic processing

**Examples:**
- "compressed dynamics"
- "punchy transients"
- "wide dynamic range"
- "consistent levels"

---

### 7. Temporal Effects

**What it adds:** Time-based processing (reverb, delay, modulation)

**Examples:**
- "subtle reverb tail"
- "ping-pong delay"
- "chorus depth"
- "dry signal"

---

## Randomness with Control

The deterministic system uses **controlled randomness** - it makes random selections, but from carefully curated pools.

### How It Works

Every choice uses a random number between 0.0 and 1.0:

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

For testing and reproducibility, you can provide a **seed number**:

```typescript
// Same seed = same results every time
buildDeterministicCreativeBoost(75, [], false, true, {
  rng: seededRng(12345)
})

// Seed 12345 always produces:
// → "jazz electronic", "Rhodes, synth pad, bass, drums", "transcendent"

// Seed 67890 always produces:
// → "ambient rock", "synth pad, guitar, bass, drums", "intense"
```

This is used heavily in automated tests to verify consistent behavior.

---

## Mood Category Integration

**Mood categories** let you override the default mood selection while keeping the creativity-based genre selection.

### How It Works

```
SCENARIO 1: No Mood Category
→ Creativity level determines mood pool
→ Example: Adventurous → "transcendent"

SCENARIO 2: With Mood Category
→ Category overrides creativity mood pool
→ Example: Adventurous + "Calm" category → "peaceful"
```

### Available Mood Categories

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
| **Aggressive** | intense, fierce, raw | High energy |
| **Romantic** | tender, intimate, passionate | Love songs |
| **Focus** | concentrated, steady, meditative | Study music |
| **Nostalgic** | vintage, retro, reminiscent | Throwback |
| **Epic** | grandiose, cinematic, powerful | Big productions |
| **Minimalist** | sparse, clean, simple | Less is more |
| **Experimental** | avant-garde, unconventional | Pushing boundaries |
| **Spiritual** | sacred, meditative, transcendent | Spiritual |
| **Urban** | street, modern, contemporary | City vibes |
| **Nature** | organic, earthy, natural | Outdoor themes |
| **Futuristic** | sci-fi, digital, technological | Future sounds |
| **Vintage** | retro, classic, old-school | Throwback styles |

### Where It's Available

✅ **Creative Boost mode** - Override creativity-based mood  
✅ **Quick Vibes mode** - Override template-based mood  
✅ **Enrichment system** - Filter Suno V5 styles by mood category

---

## Compound Moods (v3.0)

**NEW in v3.0:** Compound moods blend two emotional qualities for richer, more nuanced prompts.

### What Are Compound Moods?

Instead of simple moods like "happy" or "sad", compound moods combine contrasting or complementary emotions:

| Type | Examples | Effect |
|------|----------|--------|
| **Contrasting** | bittersweet nostalgia, dark euphoria, chaotic joy | Emotional complexity |
| **Complex states** | melancholic triumph, restless serenity, gentle fury | Depth and nuance |
| **Atmospheric** | ethereal darkness, warm desolation, bright sorrow | Rich sonic texture |
| **Textural** | rough tenderness, sharp comfort, raw elegance | Unique character |

### Available Compound Moods (25 total)

```
bittersweet nostalgia    dark euphoria           aggressive hope
tender melancholy        chaotic joy             peaceful intensity
wistful optimism         haunting beauty         fierce tenderness
quiet desperation        melancholic triumph     restless serenity
gentle fury              luminous grief          defiant vulnerability
ethereal darkness        warm desolation         bright sorrow
somber celebration       anxious bliss           rough tenderness
sharp comfort            soft rage               delicate power
raw elegance
```

### How Selection Works

```
INPUT:
Genre: "jazz"

APP PROCESS:
1. Check genre-specific affinities
2. Jazz prefers: tender melancholy, wistful optimism, quiet desperation
3. Random selection from jazz-appropriate compound moods

OUTPUT:
Mood: "tender melancholy" (genre-appropriate compound mood)
```

### Genre Affinities

| Genre | Preferred Compound Moods |
|-------|-------------------------|
| **Jazz** | tender melancholy, wistful optimism, quiet desperation |
| **Electronic** | dark euphoria, chaotic joy, ethereal darkness |
| **Metal** | aggressive hope, fierce tenderness, raw elegance |
| **Ambient** | peaceful intensity, ethereal darkness, luminous grief |
| **Rock** | defiant vulnerability, restless serenity, raw elegance |

---

## Mood Intensity (v3.0)

**NEW in v3.0:** 3-level intensity scaling for mood words, allowing fine-tuned emotional expression.

### Intensity Levels

| Level | Description | Example (euphoric) |
|-------|-------------|-------------------|
| **Mild** | Subtle, understated | uplifted |
| **Moderate** | Standard, balanced | euphoric |
| **Intense** | Strong, powerful | ecstatic |

### How It Works

```
INPUT:
Base mood: "peaceful"
Intensity: "intense"

APP PROCESS:
1. Look up "peaceful" in MOOD_INTENSITY_MAP
2. Get intense variant: "blissful"

OUTPUT:
Mood: "blissful" (intense variant of peaceful)
```

### Intensity Mappings (60+ moods)

| Base Mood | Mild | Moderate | Intense |
|-----------|------|----------|---------|
| euphoric | uplifted | euphoric | ecstatic |
| peaceful | gentle | peaceful | blissful |
| haunting | mysterious | haunting | terrifying |
| melancholic | wistful | melancholic | devastated |
| passionate | ardent | passionate | fiercely passionate |
| ethereal | airy | ethereal | otherworldly |
| groovy | rhythmic | groovy | funky as hell |
| epic | grand | epic | monumental |

### Categories Covered

- **Energetic:** euphoric, energetic, uplifting, vibrant, dynamic
- **Calm:** serene, peaceful, relaxed, tranquil, calm
- **Dark:** haunting, dark, ominous, brooding, sinister
- **Emotional:** melancholic, sad, nostalgic, tender, bittersweet
- **Playful:** whimsical, playful, cheerful, fun, carefree
- **Intense:** passionate, fierce, aggressive, powerful, raw
- **Atmospheric:** ethereal, dreamy, mysterious, hypnotic, cosmic
- **And 13 more categories...**

---

## Era-Based Instruments (v3.0)

**NEW in v3.0:** Period-specific instrument selection for authentic decade-based sounds.

### Available Eras

| Era | Signature Instruments | Character |
|-----|----------------------|-----------|
| **70s** | Moog, Rhodes, clavinet, Mellotron, ARP Odyssey, Prophet-5 | Analog warmth, funk |
| **80s** | DX7, LinnDrum, Juno pads, Fairlight CMI, Jupiter-8, Simmons drums | Digital clarity, gated reverb |
| **90s** | TB-303, breakbeats, TR-909, Supersaw, Korg M1, Amen break | Dance, grunge, big beat |
| **Modern** | Serum, Omnisphere, Massive X, Kontakt, Vital, granular synth | Software synthesis, hybrid |

### Era Instruments (12 per era)

**70s:**
```
Moog synthesizer, Rhodes, disco strings, funk bass, wah guitar,
clavinet, Fender Rhodes, ARP Odyssey, Mellotron, Hohner clavinet,
analog strings, Prophet-5
```

**80s:**
```
DX7, LinnDrum, Juno pads, gated reverb drums, Simmons drums,
Fairlight CMI, Oberheim OB-X, Roland Jupiter-8, PPG Wave,
synth brass, Roland D-50, E-mu Emulator
```

**90s:**
```
TB-303, breakbeats, grunge distortion, jungle breaks, Roland TR-909,
Supersaw, Korg M1, sampled vocals, big beat drums, trip hop beats,
Roland JV-1080, Amen break
```

**Modern:**
```
Serum, Omnisphere, Massive X, Kontakt, Analog Lab, neural amp,
granular synth, wavetable, Vital, Splice samples,
Arturia V Collection, Plugin Alliance
```

### How Selection Works

```
INPUT:
Era: "80s"
Count: 3

APP PROCESS:
1. Load 80s instrument pool (12 instruments)
2. Fisher-Yates shuffle for fair selection
3. Pick first 3 from shuffled array

OUTPUT:
Instruments: ["DX7", "Juno pads", "LinnDrum"]
```

---

## Ensemble Presets (v3.0)

**NEW in v3.0:** Pre-defined instrument groupings that automatically expand to individual instruments with genre compatibility.

### Available Ensembles (10 presets)

| Ensemble | Instruments | Compatible Genres |
|----------|-------------|-------------------|
| **String Quartet** | violin, viola, cello, double bass | classical, cinematic, jazz, ambient, symphonic, folk |
| **Horn Section** | trumpet, trombone, saxophone | jazz, funk, soul, disco, rnb, latin, afrobeat |
| **Gospel Choir** | gospel vocals, Hammond organ, claps | gospel, soul, rnb, blues |
| **Brass Band** | trumpet, trombone, tuba, French horn | jazz, classical, cinematic, symphonic, latin |
| **Jazz Combo** | piano, upright bass, drums, saxophone | jazz, blues, lofi, soul, downtempo |
| **Rock Band** | electric guitar, bass guitar, drums | rock, punk, metal, indie, blues |
| **Chamber Orchestra** | strings, woodwinds, French horn | classical, cinematic, ambient, symphonic, newage |
| **Synth Stack** | lead synth, pad synth, bass synth | electronic, synthwave, house, trance, melodictechno, hyperpop |
| **World Percussion** | djembe, congas, shaker, tambourine | afrobeat, latin, reggae, folk, funk |
| **Electronic Kit** | 808, hi-hats, claps, snare | trap, drill, electronic, hyperpop, house, rnb |

### How Expansion Works

```
INPUT:
Ensemble: "horn section"
Genre: "jazz"

APP PROCESS:
1. Look up "horn section" in presets
2. Check genre compatibility (jazz ✓)
3. Expand to individual instruments

OUTPUT:
Instruments: ["trumpet", "trombone", "saxophone"]
```

### Genre-Based Selection

```
INPUT:
Genre: "funk"

APP PROCESS:
1. Find ensembles compatible with funk
2. Matches: horn section, world percussion
3. Random selection

OUTPUT:
Ensemble: "horn section" → ["trumpet", "trombone", "saxophone"]
```

---

## Genre Aliases (v3.1)

**NEW in v3.1:** 70+ genre alias mappings that automatically resolve common variations, misspellings, and alternate names to canonical genre types.

### What Are Genre Aliases?

Genre aliases map user-friendly terms to the internal genre system, enabling more flexible genre detection:

| User Input | Resolved Genre | Reason |
|------------|----------------|--------|
| "hip hop" | trap | Closest match in registry |
| "r&b" | rnb | Alternate spelling |
| "synth wave" | synthwave | Space variation |
| "doom metal" | stonerrock | Sonic characteristics |
| "dnb" | drumandbass | Common abbreviation |

### Alias Categories (70+ mappings)

**Hip-hop variants → trap:**
```
hip hop, hip-hop, hiphop, rap
```

**Boom bap/Lo-fi variants → lofi:**
```
boom bap, boombap, lofi hip hop, lofi hiphop
```

**R&B variants → rnb:**
```
r&b, r and b, r n b, rhythm and blues, r'n'b
```

**Synth variants:**
```
synth pop, synth-pop → synthpop
synth wave, synth-wave, retro wave, retrowave → synthwave
```

**Metal variants:**
```
heavy metal, thrash metal, death metal, black metal, nu metal, nu-metal → metal
doom metal, stoner metal, sludge metal, doom → stonerrock
```

**Electronic variants:**
```
edm, electro, electronica → electronic
techno music → melodictechno
tech house, deep house, progressive house → house
progressive trance, psytrance, psy-trance, goa trance → trance
```

**Rock variants:**
```
alternative, alt rock, alt-rock, alternative rock → indie
post-rock, post rock → shoegaze
math-rock, math rock → mathrock
```

**Drum & Bass variants:**
```
dnb, d&b, d n b, drum n bass, drum and bass, drum-n-bass, liquid dnb, neurofunk → drumandbass
```

**Jazz variants:**
```
nu jazz, nu-jazz, acid jazz, smooth jazz, bebop, bop, cool jazz → jazz
```

**And more:** soul variants, new wave, garage, dubstep, country, classical, ambient, world music

### API Functions

```typescript
// Exact alias lookup (case-insensitive, trimmed)
resolveGenreAlias('hip hop') // returns 'trap'
resolveGenreAlias('R&B') // returns 'rnb'
resolveGenreAlias('unknown') // returns null

// Find alias in longer text (substring matching)
findGenreAliasInText('I want hip hop beats') // returns 'trap'
findGenreAliasInText('some r&b vibes') // returns 'rnb'
findGenreAliasInText('random text') // returns null
```

### How It's Used

Genre aliases are automatically checked during genre resolution:

```
INPUT:
Description: "chill r&b vibes with smooth vocals"

APP PROCESS:
1. detectAllGenres() finds no direct genre match
2. findGenreAliasInText() finds "r&b" → resolves to 'rnb'
3. Genre set to 'rnb'

OUTPUT:
Genre: "rnb" (resolved from alias)
```

---

## Genre-Specific Tag Weights (v3.1)

**NEW in v3.1:** Tailored tag category weights for all 60 supported genres, controlling the probability of including specific production tag categories.

### What Are Tag Weights?

Each genre has custom probabilities (0.0 to 1.0) for five tag categories:

| Category | Description | Low Value | High Value |
|----------|-------------|-----------|------------|
| **vocal** | Vocal-related tags | Instrumental focus | Vocal-forward |
| **spatial** | Spatial/reverb tags | Dry/intimate | Expansive/wide |
| **harmonic** | Harmonic complexity tags | Simple | Complex |
| **dynamic** | Dynamic range tags | Compressed | Wide dynamic |
| **temporal** | Timing/groove tags | Steady | Rhythmic focus |

### Weight Design by Genre Family

**Jazz & Blues** - Vocal-forward, moderate spatial:
```typescript
jazz:   { vocal: 0.8, spatial: 0.4, harmonic: 0.5, dynamic: 0.3, temporal: 0.3 }
blues:  { vocal: 0.75, spatial: 0.35, harmonic: 0.4, dynamic: 0.35, temporal: 0.3 }
soul:   { vocal: 0.85, spatial: 0.4, harmonic: 0.45, dynamic: 0.4, temporal: 0.3 }
rnb:    { vocal: 0.85, spatial: 0.5, harmonic: 0.4, dynamic: 0.45, temporal: 0.35 }
gospel: { vocal: 0.9, spatial: 0.5, harmonic: 0.5, dynamic: 0.5, temporal: 0.25 }
```

**Electronic** - Spatial-forward, lower vocal:
```typescript
electronic:    { vocal: 0.4, spatial: 0.7, harmonic: 0.3, dynamic: 0.5, temporal: 0.4 }
house:         { vocal: 0.45, spatial: 0.65, harmonic: 0.3, dynamic: 0.55, temporal: 0.5 }
trance:        { vocal: 0.3, spatial: 0.8, harmonic: 0.35, dynamic: 0.4, temporal: 0.35 }
melodictechno: { vocal: 0.35, spatial: 0.75, harmonic: 0.4, dynamic: 0.45, temporal: 0.4 }
```

**Rock** - Balanced, dynamic-forward:
```typescript
rock:   { vocal: 0.6, spatial: 0.45, harmonic: 0.35, dynamic: 0.55, temporal: 0.35 }
metal:  { vocal: 0.45, spatial: 0.35, harmonic: 0.3, dynamic: 0.7, temporal: 0.35 }
punk:   { vocal: 0.6, spatial: 0.3, harmonic: 0.2, dynamic: 0.6, temporal: 0.3 }
indie:  { vocal: 0.65, spatial: 0.5, harmonic: 0.4, dynamic: 0.4, temporal: 0.35 }
```

**Ambient/Atmospheric** - Spatial-forward, low vocal:
```typescript
ambient:   { vocal: 0.15, spatial: 0.85, harmonic: 0.5, dynamic: 0.25, temporal: 0.2 }
dreampop:  { vocal: 0.5, spatial: 0.8, harmonic: 0.45, dynamic: 0.3, temporal: 0.25 }
shoegaze:  { vocal: 0.4, spatial: 0.85, harmonic: 0.45, dynamic: 0.35, temporal: 0.3 }
```

**Classical/Orchestral** - High harmonic, high spatial:
```typescript
classical: { vocal: 0.3, spatial: 0.75, harmonic: 0.7, dynamic: 0.55, temporal: 0.3 }
symphonic: { vocal: 0.25, spatial: 0.8, harmonic: 0.65, dynamic: 0.6, temporal: 0.3 }
cinematic: { vocal: 0.3, spatial: 0.85, harmonic: 0.6, dynamic: 0.65, temporal: 0.35 }
```

### API Function

```typescript
// Get weights for a genre (falls back to defaults if unknown)
const weights = getTagWeightsForGenre('jazz');
// { vocal: 0.8, spatial: 0.4, harmonic: 0.5, dynamic: 0.3, temporal: 0.3 }

// Unknown genres return defaults
const defaultWeights = getTagWeightsForGenre('unknown' as GenreType);
// { vocal: 0.5, spatial: 0.5, harmonic: 0.3, dynamic: 0.4, temporal: 0.3 }
```

### Impact on Style Tag Assembly

When MAX mode generates production tags, it uses genre weights to determine inclusion probability:

```
INPUT:
Genre: "ambient"
MAX mode: enabled

WEIGHT CHECK (ambient):
- vocal: 0.15 → 15% chance of vocal tags (instrumental focus)
- spatial: 0.85 → 85% chance of spatial tags (expansive soundscape)
- harmonic: 0.5 → 50% chance of harmonic tags
- dynamic: 0.25 → 25% chance of dynamic tags (minimal dynamics)
- temporal: 0.2 → 20% chance of temporal tags (less rhythmic)

OUTPUT:
Tags emphasize spatial characteristics, minimal vocal/dynamic content
```

---

## Coherence Validation (v3.1)

**NEW in v3.1:** Lightweight conflict detection ensures musically sensible instrument-production combinations with creativity-aware validation.

### What Is Coherence Validation?

Coherence validation detects obviously conflicting combinations between instruments and production tags. It prevents musically incoherent results while allowing experimental fusions at high creativity levels.

### Creativity-Aware Behavior

| Creativity Level | Mode | Behavior |
|------------------|------|----------|
| **0-60** | Strict | Validates and removes conflicting tags |
| **61-100** | Permissive | Allows experimental combinations |

### Conflict Rules (5 total)

**1. distorted-intimate**
- **Conflict:** Heavy/distorted sounds with intimate/gentle production
- **Instruments:** distorted, overdriven, fuzz, heavy guitar, crushing, screaming
- **Production:** intimate, bedroom, whisper, gentle, delicate, soft

**2. acoustic-digital**
- **Conflict:** Pure acoustic instruments with heavy digital processing
- **Instruments:** acoustic guitar, upright bass, acoustic piano, nylon string, ukulele
- **Production:** glitch, bitcrushed, digital distortion, vocoder, autotune, robotic

**3. orchestral-lofi**
- **Conflict:** Orchestral instruments with lo-fi production
- **Instruments:** symphony, orchestra, string section, philharmonic, chamber orchestra, full strings
- **Production:** lo-fi, vinyl crackle, tape hiss, dusty, bedroom production, cassette

**4. delicate-aggressive**
- **Conflict:** Delicate instruments with aggressive production
- **Instruments:** music box, celesta, harp, glockenspiel, kalimba, wind chimes, glass harmonica
- **Production:** crushing, aggressive, slamming, brutal, punishing, extreme compression

**5. vintage-futuristic**
- **Conflict:** Vintage instruments with futuristic production
- **Instruments:** phonograph, gramophone, 1920s, antique, victorian, baroque
- **Production:** futuristic, sci-fi, neural, ai-generated, cyber, space age

### API Functions

```typescript
// Check coherence (returns validation result)
const result = checkCoherence(
  ['distorted guitar', 'heavy bass'],
  ['intimate bedroom recording'],
  30 // creativity level
);
// result: { valid: false, conflicts: ['distorted-intimate'], suggestions: [...] }

// At high creativity, same inputs pass
const result2 = checkCoherence(
  ['distorted guitar', 'heavy bass'],
  ['intimate bedroom recording'],
  80 // high creativity - permissive mode
);
// result2: { valid: true, conflicts: [] }

// Validate and auto-fix conflicts
const fixedTags = validateAndFixCoherence(
  ['distorted guitar'],
  ['intimate bedroom recording', 'warm', 'wide stereo'],
  30
);
// Returns: ['warm', 'wide stereo'] - conflicting tag removed
```

### Example: Conflict Detection

```
INPUT:
Instruments: ["acoustic guitar", "upright bass"]
Production: ["glitch effects", "warm analog", "wide stereo"]
Creativity: 30 (strict mode)

APP PROCESS:
1. Check acoustic-digital rule
2. Instruments match: "acoustic guitar", "upright bass"
3. Production match: "glitch effects"
4. Conflict detected: acoustic-digital

VALIDATION RESULT:
{
  valid: false,
  conflicts: ['acoustic-digital'],
  suggestions: ['Consider adjusting instruments or production style for better coherence']
}

AUTO-FIX:
["warm analog", "wide stereo"] (glitch effects removed)
```

### Helper Functions

```typescript
// Get human-readable description of a conflict
getConflictDescription('distorted-intimate')
// "Distorted instruments with intimate production"

// Get all available conflict rule IDs
getAllConflictRuleIds()
// ['distorted-intimate', 'acoustic-digital', 'orchestral-lofi', 'delicate-aggressive', 'vintage-futuristic']
```

---

## Multi-Genre Detection (v3.1)

**NEW in v3.1:** Automatic detection of multiple genres in descriptions for intelligent genre blending (up to 4 genres).

### What Is Multi-Genre Detection?

Instead of detecting only the first/primary genre, the system now identifies all mentioned genres in a description for automatic blending.

### Detection Process

```
INPUT:
Description: "jazz rock fusion with electronic beats"

APP PROCESS:
1. Check priority genres first (most common)
2. Check remaining genres from registry
3. Check genre aliases as fallback
4. Limit to maximum 4 genres

OUTPUT:
Detected: ['jazz', 'rock', 'electronic'] (3 genres)
Display: "jazz rock electronic"
Primary: 'jazz' (first detected)
```

### Detection Priority

1. **Priority genres** - Most common/important genres checked first (from GENRE_PRIORITY)
2. **Registry genres** - All remaining genres from GENRE_REGISTRY
3. **Genre aliases** - Alias mappings checked if room remains (max 4)

### Maximum Genres

The system limits detection to **4 genres maximum** to prevent overly complex combinations:

```
INPUT:
Description: "ambient jazz metal house rock indie"

OUTPUT:
Detected: ['jazz', 'metal', 'house', 'rock'] (limited to 4)
```

### API Function

```typescript
// Detect all genres in a description
detectAllGenres('jazz rock fusion')
// returns ['jazz', 'rock']

detectAllGenres('chill lofi hip hop beats')
// returns ['lofi', 'trap'] (hip hop resolved via alias)

detectAllGenres('ambient jazz metal house rock')
// returns ['jazz', 'metal', 'house', 'rock'] (max 4)
```

### Genre Resolution Flow

The complete genre resolution now follows this priority:

```
1. Genre override (if provided)
   ↓ not provided
2. Multi-keyword detection (detectAllGenres)
   ↓ no genres found
3. Mood-based detection (detectGenreFromMood)
   ↓ no mood match
4. Random fallback (selectRandomGenre)
```

### ResolvedGenre Structure

```typescript
type ResolvedGenre = {
  detected: GenreType | null;     // Primary detected genre (null if override/random)
  displayGenre: string;           // Full genre string for display ("jazz rock")
  primaryGenre: GenreType;        // Primary genre for instrument selection
  components: GenreType[];        // All genre components for blending
};
```

### Example: Full Resolution

```
INPUT:
Description: "chill jazz vibes with electronic elements"
Genre override: undefined

APP PROCESS:
1. No override provided
2. detectAllGenres() finds: ['jazz', 'electronic']
3. Primary genre: 'jazz'
4. Display: "jazz electronic"
5. Components: ['jazz', 'electronic']

OUTPUT:
{
  detected: 'jazz',
  displayGenre: 'jazz electronic',
  primaryGenre: 'jazz',
  components: ['jazz', 'electronic']
}
```

### Integration with Instrument Selection

When multiple genres are detected, instruments are blended from all components:

```
DETECTED GENRES: ['jazz', 'electronic']

INSTRUMENT BLENDING:
1. Jazz pool: [Rhodes, piano, tenor sax, upright bass, brushed drums]
2. Electronic pool: [synth, synth pad, drum machine, bass synth]
3. Smart blend: Select proportionally from each pool
4. Coherence check: Ensure no conflicts

OUTPUT:
Instruments: "Rhodes, synth pad, tenor sax, drum machine"
```

---

## Performance: Why It's Instant

### Traditional AI Approach

```
1. Network request to OpenAI/Anthropic .... 100-500ms
2. AI processing (LLM inference) ........... 1-3 seconds
3. Response parsing ........................ 50-100ms
─────────────────────────────────────────────────────
TOTAL: 2-4 seconds per generation
```

### Deterministic Approach

```
1. Look up genre in database .............. 0.01ms
2. Select instruments from pool ........... 0.01ms
3. Pick mood from array ................... 0.01ms
4. Assemble prompt string ................. 0.01ms
─────────────────────────────────────────────────────
TOTAL: 0.03-0.04ms per generation

100x faster than AI! ⚡
```

### Benchmark Results

From automated performance tests:

- **Average:** 0.03-0.04ms
- **95th percentile:** 0.05ms
- **99th percentile:** 0.06ms
- **Maximum:** 0.15ms (still under 1ms)

**Performance target:** <50ms  
**Actual performance:** 0.03ms (1,600x better than target!)

---

## Data Sources

All choices come from carefully curated, tested databases maintained in code:

### Genre Registry

- **60 genres** with authentic instrument pools (25 new in v3.0)
- Each genre defines:
  - Core instruments (Rhodes for jazz, synth for electronic)
  - Secondary instruments (alternatives and variations)
  - Compatible multi-genre combinations

### Instrument Database

- **500+ instruments** organized by category
- **250+ aliases** (e.g., "sax" → "saxophone")
- **Categories:** harmonic, rhythmic, melodic, textural, color, bass, keys
- **Exclusion rules:** Prevents conflicts (Rhodes vs Wurlitzer)

### Mood Categories

- **20 mood categories** with distinct characteristics
- Each category contains **8-12 compatible moods**
- **Genre mappings:** Which genres fit each category
- **Style mappings:** Which Suno V5 styles match

### Style Descriptors

- **200+ production tags** across 7 categories
- Genre-specific probabilities ensure appropriate tags
- Electronic → digital descriptors
- Acoustic → analog descriptors
- Jazz → live/improvisation descriptors

### Recording Context Data

- **141 genre-specific contexts** across 18 genres (jazz, rock, electronic, blues, classical, hip hop, country, metal, etc.)
- **4 structured categories** with conflict prevention:
  - Production Quality: 3 subcategories × 3 descriptors = 9 options
  - Environment: 5 subcategories × 3 descriptors = 15 options  
  - Technique: 3 subcategories × 2-6 descriptors = 11 options
  - Character: 5 subcategories × 2-3 descriptors = 13 options
- **Genre-aware helpers** for intelligent selection (electronic→digital, jazz→analog)
- **Thousands of combinations** (all conflict-free)

### Title Generation Data (v2.0)

- **269 unique words** across 5 categories (emotions, actions, time, nature, abstract)
- **159 title patterns** (20 genre-specific sets + default patterns)
- **170+ keyword mappings** for topic-aware generation
- **Genre-specific patterns:**
  - Jazz: 11 patterns ("Blue {nature}", "The {emotion} of {time}", etc.)
  - Electronic: 11 patterns ("{emotion}.exe", "System {abstract}", "Cyber {nature}", etc.)
  - Ambient: 10 patterns ("{emotion} in the {abstract}", "Whispers of {nature}", etc.)
  - Rock: 11 patterns ("Born to {action}", "{emotion} Never Dies", etc.)
  - 16 other genres with 6 patterns each

**Pattern types:**
- **2-word templates:** `{emotion} {nature}` → "Shadow Ocean"
- **3-word templates:** `{emotion} of the {nature}` → "Shadow of the Moon"
- **Possessive templates:** `{nature}'s {emotion}` → "Ocean's Memory"
- **Complex templates:** `When {nature} {action}s` → "When Thunder Strikes", `Between {time} and {emotion}` → "Between Midnight and Dreams"

**Keyword extraction (topic-aware generation):**
- **Word boundary matching** for precision (prevents "nightingale" matching "night")
- **5 category mappings:** time (50+), nature (70+), emotion (50+), action (11), abstract (40+)
- **Deduplication and conflict resolution** (spirit, dream, hope, nebula duplicates fixed)
- **60% probability** to use extracted keywords when description provided

**Vocabulary breakdown:**
- EMOTION_WORDS: 60 (feelings, states, connections, intensity, memory types)
- ACTION_WORDS: 50 (movement, change, flow, impact, all in gerund form)
- TIME_WORDS: 46 (seasons, time periods, poetic time, cycles, specific times)
- NATURE_WORDS: 65 (weather, landscapes, celestial, flora, elements, water features)
- ABSTRACT_WORDS: 48 (concepts, philosophy, cosmic themes, musical terms, journeys)

### Multi-Genre Combinations

- **50+ pre-defined fusions** that work musically
- Examples: "jazz fusion", "trip hop", "electro pop"
- Used at "safe" creativity level (established combos)

### Compound Moods (v3.0)

- **25 compound moods** combining contrasting/complementary emotions
- **Genre affinities** for contextually appropriate mood selection
- Categories: contrasting, complex states, atmospheric, textural

### Mood Intensity (v3.0)

- **60+ base moods** with 3-level intensity scaling
- Levels: mild (subtle), moderate (standard), intense (powerful)
- Example: peaceful → gentle / peaceful / blissful

### Era-Based Instruments (v3.0)

- **4 eras** with 12 period-specific instruments each
- 70s: analog warmth (Moog, Rhodes, Mellotron)
- 80s: digital clarity (DX7, LinnDrum, Fairlight)
- 90s: dance/grunge (TB-303, breakbeats, Supersaw)
- Modern: software synthesis (Serum, Omnisphere, Vital)

### Ensemble Presets (v3.0)

- **10 ensembles** with genre compatibility mappings
- Auto-expansion to individual instruments
- Examples: string quartet, horn section, jazz combo, synth stack

### Genre Aliases (v3.1)

- **70+ alias mappings** for flexible genre input
- Categories: hip-hop, R&B, synth, metal, electronic, rock, drum & bass, jazz, and more
- Functions: `resolveGenreAlias()` for exact lookup, `findGenreAliasInText()` for substring matching
- Sorted by length for precise matching (longer aliases checked first)

### Genre-Specific Tag Weights (v3.1)

- **60 genres** with tailored `TagCategoryWeights`
- 5 weight categories: vocal, spatial, harmonic, dynamic, temporal
- Design by genre family (Jazz=vocal-forward, Electronic=spatial-forward, Rock=dynamic-forward)
- Default fallback weights for unknown genres

### Coherence Validation (v3.1)

- **5 conflict rules** for instrument-production coherence
- Rules: distorted-intimate, acoustic-digital, orchestral-lofi, delicate-aggressive, vintage-futuristic
- Creativity-aware: strict (0-60), permissive (61-100)
- Auto-fix capability with trace logging

### Multi-Genre Detection (v3.1)

- **Up to 4 genres** detected per description
- Priority-based detection: GENRE_PRIORITY → GENRE_REGISTRY → aliases
- `ResolvedGenre` structure with primary, display, and component genres
- Mood-based fallback detection (`detectGenreFromMood`)

**All data is:**
- ✅ Reviewed by developers
- ✅ Tested in 3,275 automated tests (24,241 assertions)
- ✅ Validated for musical coherence
- ✅ Regularly updated and expanded

---

## User Control vs Automation

Understanding what you control vs what the app decides:

### You Control

🎛️ **Creativity level** (0-100) - Determines genre pools, blending strategy, mood intensity  
🎵 **Seed genres** - App uses your genres if provided, applies creativity blending rules  
🎤 **Wordless vocals** - Enable/disable vocal elements  
🎚️ **MAX mode** - Simple vs detailed prompt with production tags  
🎭 **Mood category** - Override creativity-based mood with specific vibe  
✨ **Quick Vibes category** - Choose from 6 pre-made templates

### App Decides

🎲 **Which specific genres** from creativity-appropriate pool  
🎸 **Which instruments** fit the selected genre(s)  
🎨 **Which mood** fits creativity level or mood category  
🎬 **Which style tags** enhance the production (MAX mode)  
📝 **Title structure** and word selection  
🎯 **Blending strategy** when combining genres

### Result

**You guide the direction** → App handles expert details

Example: You set creativity to 75 (adventurous), the app:
- Picks adventurous-level genres (ambient, electronic, rock blends)
- Selects instruments that work with those genres
- Chooses intense/dramatic moods
- Generates elaborate titles with suffixes
- Adds appropriate production tags (MAX mode)

You get professional results without musical production knowledge!

---

## Examples: Input → Output

### Example 1: Creative Boost - Adventurous

```
─────────────────────────────────────────────
INPUT:
─────────────────────────────────────────────
Creativity: 85 (Adventurous)
Seed genres: None
Wordless vocals: No
MAX mode: No
Mood category: None

─────────────────────────────────────────────
APP DECISIONS:
─────────────────────────────────────────────
1. Map 85 → "adventurous" level
2. Select from adventurous pool → "ambient", "electronic", "rock"
3. Blend 3 genres → "ambient electronic rock"
4. Select adventurous mood → "transcendent"
5. Get instruments for multi-genre:
   - ambient: synth pad
   - electronic: drum machine
   - rock: electric guitar, bass
6. Generate adventurous title:
   - Adjective: "Cosmic"
   - Noun: "Horizons"
   - Suffix: "Ascending"

─────────────────────────────────────────────
OUTPUT:
─────────────────────────────────────────────
Genre: "ambient electronic rock"
Mood: "transcendent"
Instruments: "synth pad, electric guitar, bass, drum machine"
Title: "Cosmic Horizons Ascending"

PROMPT (Standard mode):
transcendent ambient electronic rock
Instruments: synth pad, electric guitar, bass, drum machine
```

---

### Example 2: Quick Vibes - lofi-study

```
─────────────────────────────────────────────
INPUT:
─────────────────────────────────────────────
Category: lofi-study
Wordless vocals: Yes
MAX mode: Yes
Mood category: "Focus"

─────────────────────────────────────────────
APP DECISIONS:
─────────────────────────────────────────────
1. Load lofi-study template
2. Select genre from template → "lo-fi hip hop"
3. Override template mood with Focus category → "concentrated"
4. Select instrument combo from template → Rhodes, vinyl crackle, soft drums
5. Add wordless vocals
6. Generate title from lofi-study words:
   - Adjective: "Warm"
   - Noun: "Beats"
   - Context: "to Study To"

─────────────────────────────────────────────
OUTPUT:
─────────────────────────────────────────────
Genre: "lo-fi hip hop"
Mood: "concentrated" (from Focus category)
Instruments: "Rhodes piano, vinyl crackle, soft drums, wordless vocals"
Title: "Warm Beats to Study To"

PROMPT (MAX mode):
Genre: "lo-fi hip hop"
Mood: "concentrated"
Instruments: "Rhodes piano, vinyl crackle, soft drums, wordless vocals"
```

---

### Example 3: Mood Category Override

```
─────────────────────────────────────────────
SCENARIO A: Without Mood Category
─────────────────────────────────────────────
Creativity: 40 (Normal level)
Mood category: None

→ Normal mood pool: [energetic, uplifting, melancholic, euphoric, contemplative, bittersweet]
→ Random selection: "melancholic"

OUTPUT: melancholic jazz
Instruments: piano, double bass, drums, trumpet

─────────────────────────────────────────────
SCENARIO B: With Mood Category
─────────────────────────────────────────────
Creativity: 40 (Normal level)
Mood category: "Energetic"

→ Ignores normal mood pool
→ Energetic mood pool: [lively, vibrant, powerful, dynamic, vigorous, spirited]
→ Random selection: "vibrant"

OUTPUT: vibrant jazz
Instruments: piano, double bass, drums, trumpet

────────────────────────────────────────────
COMPARISON:
────────────────────────────────────────────
Same creativity, same genre, same instruments
Different mood: "melancholic" vs "vibrant"
→ Completely different vibe!
```

---

### Example 4: High Creativity Experimental Fusion

```
─────────────────────────────────────────────
INPUT:
─────────────────────────────────────────────
Creativity: 95 (High)
Seed genres: None
MAX mode: Yes

─────────────────────────────────────────────
APP DECISIONS:
─────────────────────────────────────────────
1. High creativity → experimental fusions
2. Select from HIGH_BASE_GENRES → "hyperpop"
3. Select from HIGH_FUSION_GENRES → "bossa nova"
4. Combine → "hyperpop bossa nova"
5. High mood pool → "psychedelic"
6. Blend instruments from both:
   - hyperpop: distorted synth, glitch effects
   - bossa nova: nylon guitar, soft percussion
7. Add MAX mode tags:
   - Recording: "digital production"
   - Spatial: "wide stereo field"
   - Texture: "glitchy artifacts"

─────────────────────────────────────────────
OUTPUT:
─────────────────────────────────────────────
PROMPT (MAX mode):
Genre: "hyperpop bossa nova"
Mood: "psychedelic"
Instruments: "distorted synth, nylon guitar, glitch effects, soft percussion"
Recording: "digital production"
Spatial: "wide stereo field"
Texture: "glitchy artifacts"

Title: "Digital Dreams Ascending"
```

This is an example of high creativity producing unexpected but musically interesting fusions!

---

### Example 5: Genre-Aware Recording Context (v2.0.0)

```
─────────────────────────────────────────────
INPUT:
─────────────────────────────────────────────
Genre: "jazz"
MAX mode: Yes

─────────────────────────────────────────────
APP DECISIONS:
─────────────────────────────────────────────
1. Detect jazz genre
2. Check for genre-specific recording contexts
3. GENRE_RECORDING_CONTEXTS['jazz'] found → 10 authentic jazz contexts available:
   → "intimate jazz club"
   → "blue note studio vibe"
   → "smoky club atmosphere"
   → "bebop era recording"
   → "live jazz performance"
   → (and 5 more...)
4. Random selection → "intimate jazz club"

5. Genre-aware production tags (jazz preferences):
   → Jazz genres prefer: analog warmth, live venues
6. Structured selection with conflict prevention:
   → Quality: "raw performance energy" (authentic jazz feel)
   → Environment: "live venue capture" (jazz preference for live settings)
   → Technique: "warm analog console" (jazz prefers analog over digital)

─────────────────────────────────────────────
OUTPUT:
─────────────────────────────────────────────
PROMPT (MAX mode):
Genre: "jazz"
Recording: "intimate jazz club"
Additional tags: "raw performance energy, live venue capture, warm analog console"

─────────────────────────────────────────────
COMPARISON: v1 vs v2
─────────────────────────────────────────────
OLD system (v1):
→ "live studio recording, analog tape warmth"
→ Generic, could conflict ("studio" + "tape")

NEW system (v2):
→ "intimate jazz club" + conflict-free structured tags
→ Authentic, genre-appropriate, no conflicts! ✅
```

**Why v2 is Better:**
- ✅ Genre-specific contexts add authenticity ("intimate jazz club" vs generic "studio")
- ✅ Conflict prevention ensures coherent combinations (no "analog" + "digital")
- ✅ Genre-aware selection matches musical style (jazz → analog, electronic → digital)
- ✅ 141 genre contexts + structured categories = thousands of unique combinations

---

### Example 6: Topic-Aware Title from Description (v2.0)

```
─────────────────────────────────────────────
INPUT:
─────────────────────────────────────────────
Genre: "ambient"
Mood: "dreamy"
Description: "midnight ocean dreams under starlight"
Wordless vocals: No
MAX mode: No

─────────────────────────────────────────────
APP DECISIONS:
─────────────────────────────────────────────
1. Extract keywords from description (word boundary matching):
   - "midnight" → TIME: ['Midnight', 'Night']
   - "ocean" → NATURE: ['Ocean', 'Waves', 'Water']
   - "dreams" → EMOTION: ['Dream', 'Spirit', 'Hope']
   - "starlight" → TIME + NATURE: ['Starlight', 'Night', 'Stars']

2. Keyword extraction result:
   {
     time: ['Midnight', 'Night', 'Starlight'],
     nature: ['Ocean', 'Waves', 'Water', 'Stars'],
     emotion: ['Dream', 'Spirit', 'Hope']
   }

3. Select ambient pattern → "{nature} {emotion}" (2-word pattern)

4. Word selection with topic awareness (60% chance to use keywords):
   - {nature}: "Ocean" (selected from extracted keywords)
   - {emotion}: "Dreams" (selected from extracted keywords)

5. Apply mood filter (dreamy):
   - Both words pass dreamy mood filter ✅
   - Preferred words: Dream, Stars, Moon, Drifting, Wonder

─────────────────────────────────────────────
OUTPUT:
─────────────────────────────────────────────
Title: "Ocean Dreams" (topic-aware, matches description theme)

─────────────────────────────────────────────
ALTERNATIVE WITHOUT DESCRIPTION:
─────────────────────────────────────────────
Same inputs but NO description:
→ Pattern: "{nature} Drift" (ambient pattern)
→ Words: "Crystal Drift" (generic mood-based, from NATURE_WORDS + ACTION_WORDS)

─────────────────────────────────────────────
COMPARISON:
─────────────────────────────────────────────
WITH description:    "Ocean Dreams" (relevant to user's theme)
WITHOUT description: "Crystal Drift" (generic, still musically appropriate)

**Topic awareness impact:**
- ✅ Title reflects user's creative vision ("midnight ocean dreams")
- ✅ Higher relevance to song concept
- ✅ 170+ keyword mappings enable rich extraction
- ✅ Word boundary matching prevents false positives
```

This demonstrates how topic-aware generation creates titles that connect to the user's intended theme while maintaining musical appropriateness!

---

## Quality Assurance

The deterministic system is thoroughly tested to ensure high-quality outputs:

### Automated Testing

✅ **3,275 tests** verify all combinations work correctly  
✅ **24,241 assertions** validate expected behavior  
✅ **100% pass rate** maintained across all refactoring

### Test Categories

1. **Unit tests** - Each module tested independently
2. **Integration tests** - Systems work together correctly
3. **Performance tests** - Generation stays under 50ms (actual: 0.03ms)
4. **Variety tests** - Outputs show appropriate diversity
5. **Regression tests** - Prevent breaking changes

### Quality Checks

**Genre-Instrument Compatibility:**
- Every genre has validated instrument pools
- Multi-genre blends tested for coherence
- No conflicting instruments selected

**Mood Appropriateness:**
- Moods match creativity intensity levels
- Mood categories contain compatible moods only
- Mood-genre combinations make sense

**Production Tag Relevance:**
- Electronic genres get digital tags
- Acoustic genres get analog tags
- Probabilities tuned for genre appropriateness

**Recording Context Quality (v2.0.0):**
- ✅ Genre-specific context selection (141 contexts across 18 genres)
- ✅ Conflict prevention (no "analog" + "digital", no "professional" + "demo")
- ✅ Genre-aware selection (electronic → digital, jazz → analog + live)
- ✅ Structured category selection ensures coherence
- ✅ All genre contexts validated for authenticity

**Title Generation Quality (v2.0):**
- ✅ 269-word vocabulary (4× expansion from 77 words)
- ✅ 159 genre-specific patterns (+20% from v1.0)
- ✅ 170+ keyword mappings for topic-aware generation
- ✅ Word boundary regex prevents false positives
- ✅ Duplicate keyword mappings resolved (spirit, dream, hope, nebula)
- ✅ 100,000+ unique title combinations
- ✅ Title Case convention documented with JSDoc
- ✅ Pattern examples documented for maintainability
- ✅ 8 topic-aware tests with descriptive error messages
- ✅ All word combinations reviewed for coherence
- ✅ Title complexity scales with creativity (2-word → 3-word → complex)
- ✅ No nonsensical combinations

**Genre Aliases Quality (v3.1):**
- ✅ 70+ alias mappings covering all common variations
- ✅ Case-insensitive, trimmed lookup
- ✅ Length-sorted matching for precision (longer aliases first)
- ✅ Comprehensive coverage: hip-hop, R&B, metal, electronic, jazz, and more

**Genre Tag Weights Quality (v3.1):**
- ✅ 60 genres with tailored weights
- ✅ Genre family design rationale documented
- ✅ Default fallback for unknown genres
- ✅ 5 weight categories validated for musical appropriateness

**Coherence Validation Quality (v3.1):**
- ✅ 5 conflict rules with clear descriptions
- ✅ Creativity-aware validation (strict vs permissive)
- ✅ Auto-fix capability preserves non-conflicting tags
- ✅ Trace logging for debugging

**Multi-Genre Detection Quality (v3.1):**
- ✅ Up to 4 genres detected per description
- ✅ Priority-based detection prevents false positives
- ✅ Alias fallback extends detection coverage
- ✅ ResolvedGenre structure supports blending

### Performance Benchmarks

**Overall System Performance:**

```
Metric                  Target      Actual     Status
─────────────────────────────────────────────────────
Average generation      <50ms       0.03ms     ✅ 1,600x better
95th percentile         <50ms       0.05ms     ✅ 1,000x better
99th percentile         <50ms       0.06ms     ✅ 830x better
Maximum time            <50ms       0.15ms     ✅ 330x better
Test coverage           >80%        100%       ✅ Complete
```

**Title Generation Performance (v2.0):**

From automated tests (8 topic-aware title tests):
- **Pattern selection:** <0.01ms (array lookup)
- **Word selection:** <0.01ms (array access)
- **Keyword extraction:** <0.05ms (regex matching on description)
- **Total overhead:** Negligible (<1% of total generation time)

**Title Freshness:**
- **v1.0 (77 words):** ~1,000s combinations → stale after 10-20 generations
- **v2.0 (269 words):** 100,000+ combinations → fresh for 100+ generations

**Topic Awareness Impact:**
- 170+ keyword mappings enable rich description → title relevance
- Word boundary regex adds <0.01ms overhead
- 60% chance to use extracted keywords maintains variety

### Continuous Validation

- ✅ Pre-commit hooks run tests automatically
- ✅ CI/CD validates every change
- ✅ Type safety enforced with TypeScript strict mode
- ✅ Linting ensures code quality
- ✅ Performance regressions detected automatically

---

## Summary

The deterministic generation system provides:

🚀 **Speed** - 100x faster than AI (0.03ms vs 2-4 seconds)  
🎯 **Precision** - Same inputs = same outputs  
🎵 **Quality** - Curated data, tested combinations  
🎨 **Variety** - Controlled randomness from quality pools  
⚡ **Reliability** - Works offline, no API failures  
🧪 **Tested** - 3,275 tests validate correctness  
📝 **Topic-Aware** - 170+ keywords map descriptions to relevant titles (v2.0)  
🎼 **Rich Vocabulary** - 269 words × 159 patterns = 100,000+ unique titles (v2.0)  
🏷️ **Smart Aliases** - 70+ genre mappings for flexible input (v3.1)  
⚖️ **Genre Weights** - 60 genres with tailored tag probabilities (v3.1)

**Your role:** Guide the direction with creativity level, mood category, Quick Vibes, and optional description  
**App's role:** Make expert musical decisions from validated databases, extract keywords from descriptions

The result is professional-quality Suno prompts generated instantly, with full control over the creative direction but without needing deep music production knowledge.

**v2.0 enhancements:**
- 4× title vocabulary expansion (77 → 269 words)
- +20% more title patterns (132 → 159)
- Topic-aware generation from user descriptions
- 100,000+ unique title combinations (vs ~1,000s in v1.0)
- 141 genre-specific recording contexts with conflict prevention

**v3.0 enhancements:**
- 25 new genre definitions (35 → 60 total)
- 16 Quick Vibes categories (up from 6)
- Compound moods system (25 blended emotions)
- Mood intensity scaling (mild/moderate/intense)
- Era-based instruments (70s/80s/90s/modern)
- 10 ensemble presets with genre compatibility
- 550 additional tests (2,336 → 2,886)

**v3.1 enhancements:**
- Genre aliases system (70+ mappings for hip-hop, R&B, metal, electronic, etc.)
- Genre-specific tag weights (60 genres with tailored vocal/spatial/harmonic/dynamic/temporal weights)
- Coherence validation (5 conflict rules with creativity-aware strictness)
- Multi-genre detection (up to 4 genres auto-detected for blending)
- 389 additional tests (2,886 → 3,275)

---

**Questions or suggestions?** File an issue on GitHub or check the test files for more examples!
