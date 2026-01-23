# Prompt Generation Guide

This guide explains how the app generates Suno-ready prompts, what output formats are available, and how your choices affect the final result. The app uses a **hybrid architecture** combining deterministic prompt building with optional LLM enrichment to create professional prompts **instantly**.

## Table of Contents

1. [Output Formats Overview](#output-formats-overview)
2. [Generation Architecture](#generation-architecture)
3. [Standard Mode Output](#standard-mode-output)
4. [MAX Mode Output](#max-mode-output)
5. [Quick Vibes Output](#quick-vibes-output)
6. [Lyrics Output](#lyrics-output)
7. [Direct Mode Output](#direct-mode-output)
8. [How Prompt Generation Works](#how-prompt-generation-works)
9. [How Your Choices Affect Output](#how-your-choices-affect-output)
10. [Behind the Scenes: Decision Making](#behind-the-scenes-decision-making)
11. [Style Tags (MAX Mode Details)](#style-tags-max-mode)
12. [Randomness with Control](#randomness-with-control)
13. [Performance](#performance-why-its-instant)
14. [Data Sources](#data-sources)
15. [User Control vs Automation](#user-control-vs-automation)
16. [Examples](#examples-input--output)
17. [Quality Assurance](#quality-assurance)

---

## Output Formats Overview

The app generates different prompt formats depending on your settings:

| Mode | Best For | Character Limit | Key Features |
|------|----------|-----------------|--------------|
| **Standard** | Most songs | ~800 chars | Structured sections, genre/mood/instruments |
| **MAX** | Organic/acoustic genres | ~1000 chars | Production tags, recording context, realism focus |
| **Quick Vibes** | Background/ambient | ~60 chars | Simple, category-based templates |
| **Direct** | Suno V5 experts | ~500 chars | Raw Suno V5 styles, minimal processing |

### Quick Comparison

```
STANDARD MODE:
[Melancholic, Jazz, Key: D minor]
Genre: jazz
BPM: 110
Mood: smooth, warm
Instruments: Rhodes, upright bass, brushed drums
[INTRO] Warm piano chords...

MAX MODE:
[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
genre: "jazz"
instruments: "Rhodes, upright bass, brushed drums"
style tags: "intimate performance, warm analog"
recording: "jazz club, vintage microphone"

QUICK VIBES:
lo-fi hip hop, Rhodes, vinyl crackle, relaxed, study beats

DIRECT MODE:
Smooth Jazz, Neo-Soul, Intimate
Rhodes, Upright Bass, Brushed Drums
warm, sophisticated, late-night
```

---

## Generation Architecture

The app uses a **hybrid architecture** combining deterministic prompt building with optional LLM enrichment:

### Core Components

| Component | Method | Speed | Purpose |
|-----------|--------|-------|---------|
| **Prompt Building** | Deterministic | <1ms | Genre, instruments, mood, structure |
| **Thematic Context** | LLM (optional) | ~500ms | Extract themes/moods from description |
| **Title Generation** | LLM or Deterministic | ~300ms or <1ms | Context-aware titles |
| **Lyrics Generation** | LLM only | ~1-2s | Full lyrics with structure |
| **Genre Detection** | Deterministic first, LLM fallback | <1ms or ~200ms | Keywords → LLM topic analysis |

### How It Works

1. **Prompt generation is ALWAYS deterministic** - Uses curated databases for instant, predictable results
2. **LLM enriches when available** - Extracts thematic context to inform deterministic choices
3. **Graceful fallback** - When LLM unavailable, falls back to pure deterministic (no degradation)

### Path Comparison

| Path | Deterministic | LLM (when available) |
|------|---------------|----------------------|
| **Lyrics OFF** | Prompt, genre detection | Thematic context, title |
| **Lyrics ON** | Prompt, genre keywords | Thematic context, genre from topic, title, lyrics |
| **Direct Mode** | Style formatting | Thematic context |

---

## Standard Mode Output

Standard mode generates structured prompts with clear sections for Suno to interpret.

### Output Structure

```
[Mood, Genre/Style, Key: key/mode]

Genre: {detected or selected genre}
BPM: {tempo range or specific value}
Mood: {2-3 mood descriptors}
Instruments: {3-5 instruments with optional articulations}

[INTRO] {opening description}
[VERSE] {verse character}
[CHORUS] {chorus energy}
[BRIDGE] {contrast or development}
[OUTRO] {closing}
```

### Field Breakdown

| Field | Description | Example |
|-------|-------------|---------|
| **Header** | Summary line with mood, genre, key | `[Melancholic, Jazz, Key: D minor]` |
| **Genre** | Primary genre (detected or overridden) | `jazz`, `rock`, `electronic` |
| **BPM** | Tempo guidance | `between 80 and 120`, `110` |
| **Mood** | Emotional descriptors | `smooth, warm, intimate` |
| **Instruments** | Curated from genre pools | `Rhodes, tenor sax, upright bass` |
| **Sections** | Song structure with descriptions | `[VERSE] Gentle melody enters...` |

### Example: Jazz Ballad

**Input:**
- Description: "smooth jazz ballad for a rainy evening"
- Mode: Standard
- Lyrics: OFF

**Output:**
```
[Smooth, Jazz, Key: Eb major]

Genre: jazz
BPM: between 80 and 110
Mood: smooth, warm, intimate
Instruments: Rhodes, tenor sax, upright bass, brushed drums

[INTRO] Gentle Rhodes chords with soft brushes
[VERSE] Tenor sax melody over walking bass
[CHORUS] Full band, emotional crescendo
[BRIDGE] Solo piano moment, introspective
[OUTRO] Fade with Rhodes and distant sax
```

---

## MAX Mode Output

MAX mode uses a community-discovered format that produces higher quality, more realistic output. Best for organic genres (jazz, blues, folk, country, rock).

### Output Structure

```
[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)

genre: "{genre}"
bpm: "{tempo}"
mood: "{mood descriptors}"
instruments: "{instrument list}"
style tags: "{production descriptors}"
recording: "{recording context}"
```

### Field Breakdown

| Field | Description | Example |
|-------|-------------|---------|
| **MAX Headers** | Quality flags for Suno | `[Is_MAX_MODE: MAX](MAX)` |
| **genre** | Quoted genre string | `"acoustic, folk singer-songwriter"` |
| **bpm** | Quoted tempo | `"95"` |
| **mood** | Emotional character | `"intimate, heartfelt, raw"` |
| **instruments** | Performance-focused | `"fingerpicked acoustic guitar, breathy vocals"` |
| **style tags** | Production qualities | `"raw performance, natural dynamics, tape warmth"` |
| **recording** | Environment context | `"one person, one guitar, vintage microphone"` |

### Style Tags Categories

| Category | Examples | When Used |
|----------|----------|-----------|
| **Vocal Performance** | breathy vocals, powerful belt, intimate whisper | Vocal tracks |
| **Spatial Audio** | wide stereo, intimate mono, spacious reverb | All genres |
| **Texture** | warm saturation, crisp highs, vintage grain | Production focus |
| **Dynamic Range** | compressed, punchy transients, wide dynamics | Energy control |
| **Temporal Effects** | subtle reverb, tape delay, chorus depth | Atmosphere |

### Example: Acoustic Folk

**Input:**
- Description: "intimate acoustic folk song"
- Mode: MAX
- Lyrics: OFF

**Output:**
```
[Is_MAX_MODE: MAX](MAX)
[QUALITY: MAX](MAX)
[REALISM: MAX](MAX)
[REAL_INSTRUMENTS: MAX](MAX)

genre: "acoustic, folk singer-songwriter"
bpm: "95"
mood: "intimate, heartfelt, nostalgic"
instruments: "fingerpicked acoustic guitar, soft vocals, light percussion"
style tags: "raw performance energy, natural room sound, warm analog console"
recording: "home studio, single microphone, authentic capture"
```

### When to Use MAX Mode

| Genre Type | Recommendation |
|------------|----------------|
| Jazz, Blues, Folk, Country | ✅ Highly recommended |
| Rock, Soul, Acoustic | ✅ Great results |
| Pop, Indie | ✅ Good results |
| EDM, House, Techno | ❌ Use Standard mode |
| Synthwave, Electronic | ❌ Use Standard mode |

---

## Quick Vibes Output

Quick Vibes generates simplified ~60-character prompts optimized for ambient and background music.

### Output Structure

```
{genre}, {instruments}, {mood}, {vibe descriptor}
```

### Category Presets

| Category | Output Style | Example |
|----------|--------------|---------|
| **Lo-fi / Study** | Chill beats focus | `lo-fi hip hop, Rhodes, vinyl crackle, relaxed, study beats` |
| **Cafe / Coffee** | Jazz ambiance | `cafe jazz, acoustic guitar, warm, cozy afternoon` |
| **Ambient / Focus** | Atmospheric | `ambient, synth pad, ethereal, meditative soundscape` |
| **Late Night** | Mellow vibes | `downtempo, Rhodes, mellow, nocturnal` |
| **Workout** | High energy | `EDM, driving synth, powerful, intense energy` |

### Example: Study Session

**Input:**
- Category: Lo-fi / Study
- Mood Override: Focus

**Output:**
```
lo-fi hip hop, Rhodes piano, vinyl crackle, soft drums, focused, study beats
```

---

## Lyrics Output

When Lyrics Mode is enabled, the app generates structured lyrics with Suno-compatible tags.

### Lyrics Structure Tags

| Tag | Purpose | Example Usage |
|-----|---------|---------------|
| `[VERSE]` | Main storytelling sections | `[VERSE]\nWalking down the empty street...` |
| `[CHORUS]` | Repeated hook/refrain | `[CHORUS]\nWe're gonna make it through...` |
| `[BRIDGE]` | Contrast section | `[BRIDGE]\nBut then I realized...` |
| `[INTRO]` | Opening (often instrumental) | `[INTRO]` |
| `[OUTRO]` | Closing section | `[OUTRO]\nFading into the night...` |
| `[PRE-CHORUS]` | Build to chorus | `[PRE-CHORUS]\nHere it comes...` |

### Example: With Lyrics

**Input:**
- Description: "uplifting pop song about new beginnings"
- Lyrics Mode: ON
- Topic: "starting fresh after heartbreak"

**Output (Prompt):**
```
[Uplifting, Pop, Key: G major]

Genre: pop
BPM: 118
Mood: hopeful, bright, empowering
Instruments: acoustic guitar, piano, drums, strings

[INTRO] Bright guitar arpeggios
[VERSE] Building energy, storytelling
[CHORUS] Full band, anthemic
[BRIDGE] Stripped back, emotional
[OUTRO] Triumphant finale
```

**Output (Lyrics):**
```
[VERSE]
I packed my bags and closed the door
Left behind what hurt before
The morning sun feels warm and new
A different view, a different you

[PRE-CHORUS]
No more looking back
I'm on a brand new track

[CHORUS]
Starting over, starting fresh
Leaving behind the mess
Every step I take is mine
Watch me rise and shine

[VERSE]
The road ahead is wide and clear
No room for doubt, no space for fear
With every mile I find my way
Today's the day, today's the day

[CHORUS]
Starting over, starting fresh
Leaving behind the mess
Every step I take is mine
Watch me rise and shine

[OUTRO]
Rise and shine...
```

---

## Direct Mode Output

Direct Mode bypasses genre detection and uses Suno V5 styles exactly as provided. For users who know exactly what Suno styles they want.

> **Note:** Direct Mode still uses LLM (when available) for thematic context extraction from your description, which enriches the mood descriptors in the output.

### Output Structure

```
{Suno V5 Style 1}, {Style 2}, {Style 3}
{Instruments}
{Mood descriptors}
```

### When to Use Direct Mode

- You know the exact Suno V5 style names
- You want precise control over style combinations
- You're experimenting with specific Suno features

### Example: Direct Mode

**Input:**
- Suno V5 Styles: ["Smooth Jazz", "Neo-Soul", "Intimate"]
- Description: "late night vibes"

**Output:**
```
Smooth Jazz, Neo-Soul, Intimate
Rhodes, Upright Bass, Brushed Drums
warm, sophisticated, late-night, smoky
```

### Available Suno V5 Styles

The app includes 900+ official Suno V5 styles searchable in Advanced Mode. Examples:

| Category | Styles |
|----------|--------|
| **Jazz** | Smooth Jazz, Bebop, Cool Jazz, Jazz Fusion, Acid Jazz |
| **Electronic** | Deep House, Tech House, Progressive House, Melodic Techno |
| **Rock** | Classic Rock, Indie Rock, Alternative Rock, Post-Rock |
| **Pop** | Synth Pop, Dream Pop, Indie Pop, Chamber Pop |

---

---

## How Prompt Generation Works

### The Deterministic Core

The app builds prompts using pre-built databases instead of generating them with AI:

- **Instant** - Generates prompts in 0.03-0.04ms (100x faster than AI)
- **Predictable** - Same inputs always produce the same outputs
- **Offline-capable** - Works without internet connection
- **Consistent** - No AI randomness or hallucinations
- **Testable** - Every combination is tested and validated

### Optional LLM Enrichment

When LLM is available, the app enhances the deterministic output:

- **Thematic Context** - Extracts themes, moods, and scenes from your description
- **Title Generation** - Creates titles that match the extracted themes
- **Genre Detection** - Analyzes lyrics topics when no genre keywords found in description
- **Lyrics** - Generates full structured lyrics (Lyrics ON mode only)

### Fallback Behavior

| LLM Status | Prompt | Title | Thematic Context |
|------------|--------|-------|------------------|
| **Available** | Deterministic + enriched | LLM-generated | Extracted |
| **Unavailable** | Pure deterministic | Deterministic | Skipped |

**Result:** Same quality prompts either way, with richer context when LLM available.

### When Deterministic Is Used

- **Creative Boost Mode** - All creativity levels use deterministic prompt building
- **Quick Vibes Mode** - All categories use deterministic templates
- **Standard Generation** - Deterministic prompt with optional LLM enrichment
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
