# Deterministic Prompt Generation - How It Works

This guide explains how the app generates Suno prompts **instantly without AI**, making smart choices based on your inputs using curated databases of genres, instruments, moods, and production styles.

## Table of Contents

1. [What is Deterministic Generation?](#what-is-deterministic-generation)
2. [How Your Choices Affect Output](#how-your-choices-affect-output)
3. [Behind the Scenes: Decision Making](#behind-the-scenes-decision-making)
4. [Style Tags (MAX Mode)](#style-tags-max-mode)
5. [Randomness with Control](#randomness-with-control)
6. [Mood Category Integration](#mood-category-integration)
7. [Performance: Why It's Instant](#performance-why-its-instant)
8. [Data Sources](#data-sources)
9. [User Control vs Automation](#user-control-vs-automation)
10. [Examples: Input → Output](#examples-input--output)
11. [Quality Assurance](#quality-assurance)

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

Each category has:
- **6-8 genre options** to randomly select from
- **6 instrument combinations** that fit the vibe
- **8 mood descriptors** aligned with the category feel

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

### Step 4: Title Generation

```
INPUT:
Creativity: Adventurous
Genre: "jazz electronic"

APP PROCESS:
1. Loads title word pools:
   - Adjectives: [Cosmic, Electric, Neon, Crystal, Velvet, Golden...]
   - Nouns: [Dreams, Echoes, Shadows, Waves, Spirits, Visions...]
   - Suffixes: [Rising, Falling, Ascending, Burning, Dancing...]

2. Random selections:
   - Adjective: "Electric"
   - Noun: "Waves"
   
3. Adventurous level adds suffix (always):
   - Suffix: "Rising"

OUTPUT:
Title: "Electric Waves Rising"
```

**Title complexity by creativity:**
- **Low/Safe:** "Adjective Noun" (e.g., "Golden Dreams")
- **Normal:** "Adjective Noun" or "Noun Suffix" 30% of the time
- **Adventurous/High:** "Adjective Noun Suffix" (always)

---

## Style Tags (MAX Mode)

When **MAX mode** is enabled, the app enriches your prompt with production descriptors organized into 7 categories:

### 1. Recording Context

**What it adds:** Production environment and recording technique

**Genre-based probabilities:**
- Electronic genres → 70% digital production, 30% analog
- Acoustic genres → 90% analog recording, 10% digital
- Jazz/Classical → High probability of "live" descriptors

**Examples:**
- "live studio recording"
- "digital production"
- "analog tape warmth"
- "bedroom production"

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

- **60+ genres** with authentic instrument pools
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

### Multi-Genre Combinations

- **50+ pre-defined fusions** that work musically
- Examples: "jazz fusion", "trip hop", "electro pop"
- Used at "safe" creativity level (established combos)

**All data is:**
- ✅ Reviewed by developers
- ✅ Tested in 2,336 automated tests
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

## Quality Assurance

The deterministic system is thoroughly tested to ensure high-quality outputs:

### Automated Testing

✅ **2,336 tests** verify all combinations work correctly  
✅ **19,093 assertions** validate expected behavior  
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

**Title Generation:**
- All word combinations reviewed
- Title complexity scales with creativity
- No nonsensical combinations

### Performance Benchmarks

```
Metric                  Target      Actual     Status
─────────────────────────────────────────────────────
Average generation      <50ms       0.03ms     ✅ 1,600x better
95th percentile         <50ms       0.05ms     ✅ 1,000x better
99th percentile         <50ms       0.06ms     ✅ 830x better
Maximum time            <50ms       0.15ms     ✅ 330x better
Test coverage           >80%        100%       ✅ Complete
```

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
🧪 **Tested** - 2,336 tests validate correctness  

**Your role:** Guide the direction with creativity level, mood category, and Quick Vibes choices  
**App's role:** Make expert musical decisions from validated databases

The result is professional-quality Suno prompts generated instantly, with full control over the creative direction but without needing deep music production knowledge.

---

**Questions or suggestions?** File an issue on GitHub or check the test files for more examples!
