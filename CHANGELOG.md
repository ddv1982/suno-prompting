# Changelog

All notable changes to the suno-prompting-app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `createHandlerRunner()` utility function to eliminate duplicate handler patterns
- `formatMaxModePrompt()` shared function to consolidate MAX mode formatting
- `validateOllamaEndpoint()` function to enforce localhost-only access
- `InvalidOllamaEndpointError` error class for endpoint validation failures
- Session ID UUID format validation with `DeleteSessionSchema`

### Changed
- Refactored all RPC handlers to use `createHandlerRunner()` pattern
- Updated Ollama client and availability check to validate endpoints
- Enhanced SetOllamaSettingsSchema with localhost whitelist validation
- Updated `validate` script to use `test:coverage` instead of `test:precommit`

### Removed
- DOMPurify dependency (unused in codebase)
- @types/dompurify dev dependency

### Security
- Added localhost whitelist validation for Ollama endpoints to prevent SSRF attacks
- Added UUID format validation for session IDs to prevent invalid storage operations

## [0.1.0] - 2025-01-27

### Added
- Initial release
- Desktop app for generating Suno V5 prompts
- Local LLM support with Ollama (100% offline, private)
- Three generation modes: Full Prompt, Quick Vibes, Creative Boost
- Max Mode for higher quality output
- Story Mode for narrative prose generation
- AI providers: Ollama, Groq, OpenAI, Anthropic
- Comprehensive genre/mood/instrument guidance
- 60 single genres, 108 multi-genre combinations
- 20 mood categories (~150 moods)
- 1,000+ Suno V5 styles support
- Encrypted local storage for API keys
- Session history management
- Debug trace collection
- 4,670 tests with 100% pass rate

---

## Version Guide

### Major (X.0.0)
- Breaking changes to the public API
- Removed or renamed functionality
- Requires manual migration

### Minor (x.Y.0)
- New features (backward compatible)
- Enhancements to existing functionality

### Patch (x.y.Z)
- Bug fixes
- Non-breaking changes
- Documentation updates
