---
context_version: 0.1.4
status: active
updated: 2026-06-26
---

# Architecture Map

## Runtime Layers

- React app shell: [App.tsx](../src/App.tsx)
- Gameplay hook and loop: [useGame.ts](../src/useGame.ts)
- Pure gameplay core and transition helpers: [gameCore.ts](../src/gameCore.ts)
- 3D scene and visual components: [Scene.tsx](../src/Scene.tsx)
- Constants and procedural level generation: [gameConstants.ts](../src/gameConstants.ts)
- Viewport fitting math: [viewMath.ts](../src/viewMath.ts)
- High score storage adapter: [highScoreStorage.ts](../src/highScoreStorage.ts)
- Gameplay metrics adapter: [gameMetrics.ts](../src/gameMetrics.ts)
- Gameplay metrics persistence sink: [gameMetricsStorage.ts](../src/gameMetricsStorage.ts)
- Replay capture and QA playback: [gameReplay.ts](../src/gameReplay.ts)
- Challenge session and reward flow: [gameChallenge.ts](../src/gameChallenge.ts)
- Procedural audio adapter: [audio.ts](../src/audio.ts)
- Styling: [index.css](../src/index.css)

## Current Flow

1. [App.tsx](../src/App.tsx) mounts the full-screen canvas and DOM HUD.
2. [useGame.ts](../src/useGame.ts) owns game state, input handling, the animation loop, collision checks, scoring, lives, level transitions, and audio triggers, while delegating pure rules to [gameCore.ts](../src/gameCore.ts) and persistence to [highScoreStorage.ts](../src/highScoreStorage.ts).
3. [Scene.tsx](../src/Scene.tsx) renders the playfield, frog, obstacles, platforms, water, particles, and lighting.
4. [gameConstants.ts](../src/gameConstants.ts) defines grid constants, lane types, lily pad positions, and deterministic level generation.
5. [viewMath.ts](../src/viewMath.ts) computes orthographic fit values from viewport and world bounds.
6. [gameMetrics.ts](../src/gameMetrics.ts) records gameplay events in an in-memory adapter.
7. [gameMetricsStorage.ts](../src/gameMetricsStorage.ts) drains the event buffer into a local persistent snapshot for later review.
8. [gameReplay.ts](../src/gameReplay.ts) records deterministic input and state snapshots for QA reproduction.
9. [gameChallenge.ts](../src/gameChallenge.ts) owns challenge-session state transitions and reward scoring helpers.
10. [audio.ts](../src/audio.ts) creates Web Audio effects and music.

## Stability Notes

- The most important architecture debt is that [useGame.ts](../src/useGame.ts) mixes simulation, input, timers, audio side effects, and React state updates.
- The renderer is already componentized, and a larger part of the gameplay rules are now isolated in [gameCore.ts](../src/gameCore.ts).
- The canvas renderer configuration in [App.tsx](../src/App.tsx) should keep an explicit shadow-map mode instead of the boolean `shadows` default, because the current React Three Fiber default still maps to Three.js `PCFSoftShadowMap`, which is deprecated.
- High-frequency frog and lane motion now stay in refs, while React state is limited to coarse UI and lifecycle updates.
- Runtime lane positions in [useGame.ts](../src/useGame.ts) must only be seeded from React state when level data is rebuilt; syncing the mutable lane ref from state on every render rewinds obstacle and platform motion during unrelated HUD updates.
- Camera framing for the playfield should keep the desktop orthographic zoom stable across level lengths and use damped X/Z follow offsets. Phone-sized viewports automatically switch to a row-aligned camera with a board width spanning `1.5` viewport widths and direction-aware framing; mobile X/Z movement is constrained by projected board edges so look-ahead cannot expose unnecessary empty space outside the level.
- Road markings in [Scene.tsx](../src/Scene.tsx) use a dedicated Y offset and non-writing depth material to avoid z-fighting shimmer during camera movement.
- Water in [Scene.tsx](../src/Scene.tsx) is rendered as one continuous shader surface per contiguous river section with `#0045A0` coloration; longitudinal current streaks follow each lane's platform direction and blend across lane boundaries, while the lily-pad goal lane uses static water. The general level background is `#072615` and the board plinth material remains separate.
- The DOM HUD in [App.tsx](../src/App.tsx) uses Figma-exported UI assets from `public/ui`, `Geologica` typography, and liquid-glass panel styling while keeping touch controls visible across pointer classes so mobile devices always have an input path.
- Active bonus state in [useGame.ts](../src/useGame.ts) includes a HUD-facing featured bonus timer, while the ability booleans remain separate gameplay state.
- [viewMath.ts](../src/viewMath.ts) is a pure helper and a good template for more visual-fit calculations.
- [gameMetrics.ts](../src/gameMetrics.ts) is intentionally adapter-only; storage or analytics consumers should live in separate modules such as [gameMetricsStorage.ts](../src/gameMetricsStorage.ts).
- [gameMetricsStorage.ts](../src/gameMetricsStorage.ts) should remain a consumer, not a source of gameplay truth.
- [gameReplay.ts](../src/gameReplay.ts) should remain a QA adapter around deterministic snapshots, not a gameplay-rules source.
- [gameChallenge.ts](../src/gameChallenge.ts) should remain a pure session helper around level rewards, not a new simulation sink.
- Developer mode and tests should be introduced through a domain layer, not by expanding [useGame.ts](../src/useGame.ts) indefinitely.

## Target Direction

- Extract pure simulation modules from [useGame.ts](../src/useGame.ts).
- Keep extending [gameCore.ts](../src/gameCore.ts) instead of putting more rule logic into [useGame.ts](../src/useGame.ts).
- Keep pure helpers like [viewMath.ts](../src/viewMath.ts) and [gameMetrics.ts](../src/gameMetrics.ts) narrow and adapter-friendly.
- Keep React/R3F as adapters around deterministic state transitions and runtime refs.
- Keep DOM HUD separate from the 3D playfield.
- Add testable collision policies for road, river, goals, and playable bounds.
- Keep this note updated when new modules become part of the game flow.

Related notes:

- [[Project Overview]]
- [[Implementation Notes]]
- [[Agent Context Protocol]]
