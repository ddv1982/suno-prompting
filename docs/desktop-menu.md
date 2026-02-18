# Desktop Menu Initialization

This project uses a deterministic, bounded-resilience menu bootstrap in the main process to handle macOS startup races where the app menu (especially `Edit`) can disappear.

## Invariant

- Install the application menu before any async startup work and before the first `BrowserWindow` is created.
- On macOS only, apply bounded startup retries and bounded focus-triggered reapply during early startup.
- Never run unbounded background menu reapply loops.

## Current Implementation

- Menu template and low-level installer live in `src/bun/menu.ts`.
- Resilience policy lives in `src/bun/menu-bootstrap.ts`.
- Main process wires bootstrap in `src/bun/index.ts`:
  - `menuBootstrap.installInitial()` before async initialization.
  - `menuBootstrap.attachWindow(mainWindow)` after window creation.
- Main window uses `titleBarStyle: "default"` for deterministic native menu behavior.

## Tuning Constants

- `RETRY_DELAYS_MS = [75, 200, 500, 1200]`
- `FOCUS_REAPPLY_WINDOW_MS = 60000`
- `MAX_FOCUS_REAPPLIES = 6`
- `FOCUS_DEBOUNCE_MS = 300`

## Why this matters

- Electrobun has an open upstream macOS async/menu issue, so a single-shot install can still fail intermittently.
- Bounded retries and bounded focus reapply improve robustness while keeping behavior predictable.
- A pure, data-only template keeps menu composition testable and side-effect free.

## Verification

- `tests/bun/menu.test.ts` validates menu structure and install behavior.
- `tests/bun/menu-bootstrap.test.ts` validates retries, focus policy bounds, and disposal behavior.
- `tests/rpc-wiring.test.ts` enforces bootstrap order (`installApplicationMenu` before `new BrowserWindow`).
