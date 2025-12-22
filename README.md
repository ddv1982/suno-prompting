# Suno Prompting App

The **Suno Prompting App** is a specialized desktop application designed to empower music creators by generating optimized "Style of Music" prompts for Suno V5. Built with a sleek, professional DAW (Digital Audio Workstation) aesthetic, the app bridges the gap between creative vision and the complex prompting requirements of Suno's latest models.

## Features

- **Simple Prompt Generation**: Transform plain English descriptions into professionally formatted Suno prompts using the "Top-Anchor Strategy" and "GM Formula".
- **Intelligent Mode Selection**: LLM-powered analysis of your description to select optimal harmonic modes based on emotional content, narrative arcs, and explicit requests.
- **Modal Combinations**: 10 pre-built combinations that journey through multiple modes with section-specific guidance.
- **User Instrument Prioritization**: Mention instruments in your description and they'll be automatically detected and prioritized in the output.
- **Iterative AI Refinement**: Tweak and refine your prompts through a chat-like interface.
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

1. **Detects** instruments using a registry of 70+ Suno-compatible instruments
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

Scans for keywords like "ambient", "atmospheric", "soundscape" and injects **ambient instrument guidance** as a single list of **2–4 Suno-friendly instrument tags**.

Internally, the app selects from simple pools (harmonic anchor + pad/synth, with optional color/movement and a small rare pool), applies exclusion rules to avoid conflicts, and constrains the final prompt’s `Instruments:` line to use **only** the provided tags.

#### Ambient instrument selection (how it works)

1. **User instruments first:** any instruments detected from your description are locked in as "MUST use".
2. **Pool selection (variety):** fills remaining slots from `harmonicAnchor` + `padOrSynth`, then optionally from `rare` (~25%), `color`, and `movement`.
3. **Exclusions:** prevents known-clashing combos (e.g., acoustic piano + Rhodes, Rhodes + Wurlitzer, bells + singing bowls).
4. **Prompt constraint:** the AI is instructed to use the provided tags on the final `Instruments:` line.

**Currently Supported:** Ambient

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

Tests cover (92 total):
- Instrument registry and alias resolution
- User instrument extraction from descriptions
- Ambient instrument selection and prioritization
- Harmonic/rhythmic style detection (13 modes)
- Modal combination detection and guidance (10 combinations)
- Section-specific guidance for 2-phase and 3-phase combinations
- Genre detection and registry
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
