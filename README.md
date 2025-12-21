# Suno Prompting App

The **Suno Prompting App** is a specialized desktop application designed to empower music creators by generating optimized "Style of Music" prompts for Suno V5. Built with a sleek, professional DAW (Digital Audio Workstation) aesthetic, the app bridges the gap between creative vision and the complex prompting requirements of Suno's latest models.

## Features

- **Simple Prompt Generation**: Transform plain English descriptions into professionally formatted Suno prompts using the "Top-Anchor Strategy" and "GM Formula".
- **Iterative AI Refinement**: Tweak and refine your prompts through a chat-like interface.
- **Smart Constraints & Validation**:
  - **1000-Character Limit**: Real-time enforcement and visual counter.
  - **Contradictory Tag Detection**: Warns about conflicting tags.
- **Local Session History**: Track generations and version history.
- **Secure API Key Management**: Manage Groq API keys within the app.
- **Shadcn UI**: A professional, component-based interface with dark mode support.

## Contextual Enhancement System

The app automatically detects musical characteristics from your description and injects expert guidance into the AI prompt.

### Genre Detection

Scans for keywords like "ambient", "atmospheric", "soundscape" and injects **ambient instrument guidance** as a single list of **2–4 Suno-friendly instrument tags**.

Internally, the app selects from simple pools (harmonic anchor + pad/synth, with optional color/movement and a small rare pool), applies exclusion rules to avoid conflicts, and constrains the final prompt’s `Instruments:` line to use **only** the provided tags.

#### Ambient instrument selection (how it works)

1. **Pool selection (variety):** picks from `harmonicAnchor` + `padOrSynth`, then optionally from `rare` (~15%), `color`, and `movement`.
2. **Exclusions:** prevents known-clashing combos (e.g., acoustic piano + Rhodes, Rhodes + Wurlitzer, bells + singing bowls).
3. **Prompt constraint:** the AI is instructed to use **only** the 2–4 tags from `SUGGESTED INSTRUMENTS (Suno tags)` on the final `Instruments:` line.

**Currently Supported:** Ambient

### Harmonic Style Detection

Detects advanced harmonic vocabulary and provides chord theory guidance:

| Style | Keywords | Character |
|-------|----------|-----------|
| Lydian Dominant | jazzy, fusion, funk | Playful, mischievous |
| Lydian Augmented | mysterious, alien, space | Otherworldly, floating |
| Lydian #2 | exotic, enchanted, magic | Cinematic, evocative |
| Pure Lydian | lydian, #11 | Bright, ethereal |

Each style includes: chord type, formula, characteristics, suggested progressions, and key examples.

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

Tests cover:
- RPC communication bridge.
- Prompt validation logic (character limits, contradictory tags).

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
