---
context_version: 0.5.3
status: active
updated: 2026-07-05
---

# Architecture Map

## Runtime Layers

- React app shell: [App.tsx](../src/App.tsx)
- Responsive localized start screen: [MainScreen.tsx](../src/MainScreen.tsx)
- Localized Bonus Guide dialog: [BonusGuideOverlay.tsx](../src/BonusGuideOverlay.tsx)
- Shared bonus mesh definitions: [BonusModel3D.tsx](../src/BonusModel3D.tsx)
- Bonus Guide ordering and cyclic navigation: [bonusGuide.ts](../src/bonusGuide.ts)
- Shared English/Russian UI copy: [localization.ts](../src/localization.ts)
- Mobile landscape blocker and viewport subscription: [OrientationGate.tsx](../src/OrientationGate.tsx)
- Pure phone-landscape viewport policy: [orientationPolicy.ts](../src/orientationPolicy.ts)
- Figma-aligned main-screen exit confirmation: [ConfirmExitOverlay.tsx](../src/ConfirmExitOverlay.tsx)
- Figma-aligned end-state overlays: [EndStateOverlay.tsx](../src/EndStateOverlay.tsx)
- Gameplay hook and loop: [useGame.ts](../src/useGame.ts)
- Physical keyboard-to-action mapping: [gameInput.ts](../src/gameInput.ts)
- Pure gameplay core and transition helpers: [gameCore.ts](../src/gameCore.ts)
- 3D scene and visual components: [Scene.tsx](../src/Scene.tsx)
- Constants and procedural level generation: [gameConstants.ts](../src/gameConstants.ts)
- Viewport fitting math: [viewMath.ts](../src/viewMath.ts)
- High score storage adapter: [highScoreStorage.ts](../src/highScoreStorage.ts)
- Gameplay metrics adapter: [gameMetrics.ts](../src/gameMetrics.ts)
- Gameplay metrics persistence sink: [gameMetricsStorage.ts](../src/gameMetricsStorage.ts)
- Replay capture and QA playback: [gameReplay.ts](../src/gameReplay.ts)
- Challenge session and reward flow: [gameChallenge.ts](../src/gameChallenge.ts)
- Shared procedural music, menu media, and decoded gameplay-sound adapter: [audio.ts](../src/audio.ts)
- Styling: [index.css](../src/index.css)

## Current Flow

1. [App.tsx](../src/App.tsx) first mounts the localized [MainScreen.tsx](../src/MainScreen.tsx), then mounts the full-screen canvas and DOM HUD after the start transition.
2. [useGame.ts](../src/useGame.ts) owns game state, input handling, the animation loop, collision checks, scoring, lives, level transitions, and audio triggers, while delegating pure rules to [gameCore.ts](../src/gameCore.ts) and persistence to [highScoreStorage.ts](../src/highScoreStorage.ts).
3. [Scene.tsx](../src/Scene.tsx) renders the playfield, frog, obstacles, platforms, water, particles, and lighting. Its pickups and [BonusGuideOverlay.tsx](../src/BonusGuideOverlay.tsx) both render [BonusModel3D.tsx](../src/BonusModel3D.tsx), so the guide cannot drift to separate bonus artwork.
4. [gameConstants.ts](../src/gameConstants.ts) defines grid constants, lane types, lily pad positions, and deterministic level generation.
5. [viewMath.ts](../src/viewMath.ts) computes orthographic fit values from viewport and world bounds.
6. [gameMetrics.ts](../src/gameMetrics.ts) records gameplay events in an in-memory adapter.
7. [gameMetricsStorage.ts](../src/gameMetricsStorage.ts) drains the event buffer into a local persistent snapshot for later review.
8. [gameReplay.ts](../src/gameReplay.ts) records deterministic input and state snapshots for QA reproduction.
9. [gameChallenge.ts](../src/gameChallenge.ts) owns challenge-session state transitions and reward scoring helpers.
10. [audio.ts](../src/audio.ts) preloads and decodes named gameplay MP3 effects, creates procedural gameplay music, and owns the main-menu media element.

## Stability Notes

- The most important architecture debt is that [useGame.ts](../src/useGame.ts) mixes simulation, input, timers, audio side effects, and React state updates.
- The renderer is already componentized, and a larger part of the gameplay rules are now isolated in [gameCore.ts](../src/gameCore.ts).
- The canvas renderer configuration in [App.tsx](../src/App.tsx) should keep an explicit shadow-map mode instead of the boolean `shadows` default, because the current React Three Fiber default still maps to Three.js `PCFSoftShadowMap`, which is deprecated.
- High-frequency frog and lane motion now stay in refs, while React state is limited to coarse UI and lifecycle updates.
- Runtime lane positions in [useGame.ts](../src/useGame.ts) must only be seeded from React state when level data is rebuilt; syncing the mutable lane ref from state on every render rewinds obstacle and platform motion during unrelated HUD updates.
- River landings in [useGame.ts](../src/useGame.ts) atomically acquire a stable `row + itemIndex` platform lock in the landing tick; [gameCore.ts](../src/gameCore.ts) uses a dedicated support tolerance, and subsequent carrying does not depend on repeating AABB overlap every frame.
- Camera framing for the playfield should keep the desktop orthographic zoom stable across level lengths and use damped X/Z follow offsets. Phone-sized viewports automatically switch to a row-aligned camera with a board width spanning `1.5` viewport widths and direction-aware framing; mobile X/Z movement is constrained by projected board edges so look-ahead cannot expose unnecessary empty space outside the level.
- Road markings in [Scene.tsx](../src/Scene.tsx) use a dedicated Y offset and non-writing depth material to avoid z-fighting shimmer during camera movement.
- Water in [Scene.tsx](../src/Scene.tsx) is rendered as one continuous shader surface per contiguous river section with `#0045A0` coloration; longitudinal current streaks follow each lane's platform direction and blend across lane boundaries, while the lily-pad goal lane uses static water. The general level background is `#072615` and the board plinth material remains separate.
- The DOM HUD in [App.tsx](../src/App.tsx) uses Figma-exported UI assets from `public/ui`, `Geologica` typography, and liquid-glass panel styling while keeping touch controls visible across pointer classes so mobile devices always have an input path.
- [MainScreen.tsx](../src/MainScreen.tsx) keeps the background, title art, and frog on separate responsive parallax layers; the game runtime is not mounted until Start Game completes its short fade-to-black transition. The looping `public/sounds/main-menu.mp3` track stays active across the `menu` and `menu-guide` phases, shares mute and volume settings with gameplay audio through [audio.ts](../src/audio.ts), and retries playback after the first user gesture when browser autoplay policy blocks the initial attempt. The footer reads the application version from `package.json`.
- [OrientationGate.tsx](../src/OrientationGate.tsx) covers every app phase on phone-sized landscape viewports, tracks window, orientation, and visual viewport changes, and uses [orientationPolicy.ts](../src/orientationPolicy.ts) for the same phone bounds as the mobile camera. While visible, [useGame.ts](../src/useGame.ts) holds the simulation and rejects gameplay input through a separate suspension flag without changing the player's pause state; menu audio continues under the shared mute and volume settings.
- [audio.ts](../src/audio.ts) preloads the named effects in [public/sounds](../public/sounds) once, caches decoded `AudioBuffer` instances, and creates a fresh one-shot source for each gameplay event. Per-sound voice limits prevent rapid input from building unbounded overlap; death, reward, and terminal groups replace only mutually exclusive cues with a short fade. Trailing silence is measured once after decode and omitted during playback, while restart, game exit, and unmount paths stop active sources.
- Level-complete and game-over sounds are driven by committed `gameWon` and `gameOver` state in [useGame.ts](../src/useGame.ts), with one-shot refs reset on the next round. Audio and metrics side effects must not run inside React state updater functions.
- [localization.ts](../src/localization.ts) is the shared source for English and Russian start-screen, gameplay, pause, Bonus Guide, level-complete, game-over, and exit-confirmation copy. [App.tsx](../src/App.tsx) owns the selected locale so it survives game entry and return to the main screen.
- [gameInput.ts](../src/gameInput.ts) maps physical `KeyboardEvent.code` values to semantic move, pause, restart, and dev-step actions, keeping controls independent from the active keyboard layout.
- Gameplay, pause, and game-over keyboard help remains in layout but is rendered at zero opacity on phone-sized portrait and landscape viewports.
- The Figma-aligned pause dialog in [PauseOverlay.tsx](../src/PauseOverlay.tsx) owns pause-only controls, opens [BonusGuideOverlay.tsx](../src/BonusGuideOverlay.tsx) without resuming the simulation, and opens [ConfirmExitOverlay.tsx](../src/ConfirmExitOverlay.tsx) before abandoning the current level for the main screen. [audio.ts](../src/audio.ts) exposes one `0..4` master-volume and mute adapter shared by music and effects.
- [BonusGuideOverlay.tsx](../src/BonusGuideOverlay.tsx) supports entry from the main menu and pause, cyclic pointer/keyboard navigation, pagination, and reduced motion. Its viewport-bounded flex layout keeps the card and footer stationary across description lengths, gives the card the available vertical space, and scrolls only the description when that space is insufficient; very short landscape viewports retain whole-dialog scrolling through the dialog's minimum height. Exit returns to the source surface; Back to Game is available only from pause.
- [EndStateOverlay.tsx](../src/EndStateOverlay.tsx) renders the Figma-aligned level-complete and game-over DOM surfaces; [App.tsx](../src/App.tsx) supplies existing score, bonus, best-score, completed-level, and restart data without moving lifecycle rules into the UI.
- Active bonus state in [useGame.ts](../src/useGame.ts) is exclusive: every pickup clears all prior effect refs, flags, fly charges, and timeouts before activating the collected bonus. [gameChallenge.ts](../src/gameChallenge.ts) resets the HUD timer on replacement, and [App.tsx](../src/App.tsx) renders one bonus icon plus the remaining seconds.
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
