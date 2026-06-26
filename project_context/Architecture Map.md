---
context_version: 0.1.0
status: active
updated: 2026-06-26
---

# Architecture Map

## Runtime Layers

- React app shell: [App.tsx](../src/App.tsx)
- Gameplay hook and loop: [useGame.ts](../src/useGame.ts)
- 3D scene and visual components: [Scene.tsx](../src/Scene.tsx)
- Constants and procedural level generation: [gameConstants.ts](../src/gameConstants.ts)
- Procedural audio adapter: [audio.ts](../src/audio.ts)
- Styling: [index.css](../src/index.css)

## Current Flow

1. [App.tsx](../src/App.tsx) mounts the full-screen canvas and DOM HUD.
2. [useGame.ts](../src/useGame.ts) owns game state, input handling, the animation loop, collision checks, scoring, lives, level transitions, and audio triggers.
3. [Scene.tsx](../src/Scene.tsx) renders the playfield, frog, obstacles, platforms, water, particles, and lighting.
4. [gameConstants.ts](../src/gameConstants.ts) defines grid constants, lane types, lily pad positions, and deterministic level generation.
5. [audio.ts](../src/audio.ts) creates Web Audio effects and music.

## Stability Notes

- The most important architecture debt is that [useGame.ts](../src/useGame.ts) mixes simulation, input, timers, audio side effects, and React state updates.
- The renderer is already componentized, but gameplay rules are not yet isolated as pure functions.
- High-frequency lane movement currently updates React state every frame.
- Developer mode and tests should be introduced through a domain layer, not by expanding [useGame.ts](../src/useGame.ts) indefinitely.

## Target Direction

- Extract pure simulation modules from [useGame.ts](../src/useGame.ts).
- Keep React/R3F as adapters around deterministic state transitions.
- Keep DOM HUD separate from the 3D playfield.
- Add testable collision policies for road, river, goals, and playable bounds.
- Keep this note updated when new modules become part of the game flow.

Related notes:

- [[Project Overview]]
- [[Implementation Notes]]
- [[Agent Context Protocol]]
