---
context_version: 0.2.0
status: active
updated: 2026-06-26
---

# Context Changelog

## 1.26.14 - 2026-06-27

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [viewMath.ts](../src/viewMath.ts)
- [viewMath.test.ts](../src/viewMath.test.ts)
- [Architecture Map](Architecture%20Map.md)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)

Reason:

- Centered mobile framing could place the frog too close to the bottom controls and did not reserve view space based on vertical travel direction.
- The mobile board span needed to decrease from `2.5` to `1.5` viewport widths for a better visibility-to-scale balance.

Implementation impact:

- Upward and neutral mobile movement place the frog on the lower-third screen line.
- Downward movement smoothly shifts framing toward screen center to expose more space below; horizontal movement preserves the latest vertical look direction.
- Screen-space target placement is converted through tested orthographic ground-projection math, while desktop framing remains unchanged.

## 1.26.13 - 2026-06-27

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [viewMath.ts](../src/viewMath.ts)
- [viewMath.test.ts](../src/viewMath.test.ts)
- [Architecture Map](Architecture%20Map.md)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)

Reason:

- The desktop-oriented diagonal camera clipped the frog near horizontal board edges on phone screens and reduced tactical visibility.
- Mobile camera selection, board screen-span zoom, and orientation needed an automatic viewport-driven policy.

Implementation impact:

- Phone-sized portrait and landscape viewports automatically use a row-aligned orthographic camera.
- Mobile camera follow tracks the frog across the full X/Z board range with frame-rate-independent damping and no manual mode toggle.
- Mobile board width projects across `2.5` viewport widths; desktop camera orientation, zoom, and bounded follow remain unchanged.

## 1.26.12 - 2026-06-27

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [Architecture Map](Architecture%20Map.md)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)

Reason:

- A single dominant flow direction made platforms in opposing river lanes appear to move against the current.
- The lily-pad goal lane still exposed the dark board surface instead of the current blue water palette.

Implementation impact:

- Preserve one water mesh per contiguous river section, but drive and smoothly blend shader flow from each lane's signed platform speed.
- Render the lily-pad goal lane as static `#0045A0` water without animated current detail.
- Keep the board plinth separate and unchanged.

## 1.26.11 - 2026-06-27

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [Architecture Map](Architecture%20Map.md)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)

Reason:

- Separate water meshes and independent wave phases exposed visible seams between adjacent river lanes.
- Circular ripple shading moved across the canal and did not communicate the horizontal current.

Implementation impact:

- Render each contiguous river section as one flat water surface instead of one deforming mesh per lane.
- Keep water motion in the fragment shader as restrained longitudinal current streaks driven by river speed and direction.
- Preserve static water detail when reduced-motion mode disables flow animation.

## 1.26.10 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [Architecture Map](Architecture%20Map.md)

Reason:

- The requested palette split sets the general level background to `#072615` and canal water to `#0045A0`.
- The previous full-board water surface made blue read as the whole level background, so water is now scoped to river lanes only.
- River water now uses a lightweight shader wave surface for a more dynamic look.

Implementation impact:

- Do not use the water surface as a full-board underlay while this palette split is active.
- Keep the board plinth material separate from background and water color changes.
- Water animation should stay shader-driven and respect reduced-motion mode.

## 1.26.9 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)

Reason:

- Level background now matches the water color for a flatter temporary visual baseline.
- Lily pad flowers are now centered on the leaf and scaled up to better match the reference crop.

Implementation impact:

- Agents should keep the temporary level background color aligned with the canal water color until a new art direction overrides it.
- Lily pad flower placement should remain centered and use the `1.5x` scale unless a newer Figma reference supersedes it.

## 1.26.8 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [Scene.tsx](../src/Scene.tsx)
- [Architecture Map](Architecture%20Map.md)

Reason:

- The top HUD needed to enforce the Figma width range of `380px` minimum and `720px` maximum.
- Road markings shimmered during camera movement because thin line meshes sat too close to the road surface.

Implementation impact:

- Top HUD sizing should stay on the `380px` to `720px` clamp unless a newer design node supersedes it.
- Road-detail changes should preserve the dedicated marking height and non-writing depth material to avoid z-fighting.

## 1.26.7 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [Scene.tsx](../src/Scene.tsx)
- [Architecture Map](Architecture%20Map.md)

Reason:

- The Figma-aligned HUD needed a smaller `18px` top-panel text treatment.
- Touch controls needed the same liquid-glass backing as the top HUD.
- Camera follow needed horizontal movement as well as vertical/depth movement to reduce overlap between the player and persistent HUD controls.

Implementation impact:

- Agents should keep top HUD text at `18px` unless a newer Figma spec supersedes it.
- Control buttons should retain the shared `liquid-glass` surface, not only transparent icon SVGs.
- Camera tuning in [Scene.tsx](../src/Scene.tsx) should preserve damped X/Z follow with bounded shifts.

## 1.26.6 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [index.css](../src/index.css)
- [Architecture Map](Architecture%20Map.md)
- [PROJECT.mdc](PROJECT.mdc)
- [Figma UI assets](../public/ui)

Reason:

- The HUD and touch controls were aligned to the accessible Figma `HMI Studio` nodes for element sizing, `Geologica` typography, and liquid-glass interface treatment.

Implementation impact:

- Agents should preserve the `public/ui` Figma assets, `Geologica` font treatment, `48px` navigation buttons, and liquid-glass HUD styling when changing game UI.

## 1.26.5 - 2026-06-26

Changed files and notes:

- [.gitignore](../.gitignore)
- [Context Changelog](Context%20Changelog.md)

Reason:

- The repository had no root `.gitignore`, so installed Node dependencies, Vite caches, and build output were tracked by git.

Implementation impact:

- Agents should keep `node_modules/`, `.vite/`, and `dist/` as local generated artifacts and commit dependency changes through `package.json` and `package-lock.json` only.

## 1.26.4 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [useGame.ts](../src/useGame.ts)
- [Scene.tsx](../src/Scene.tsx)
- [package.json](../package.json)
- [Architecture Map](Architecture%20Map.md)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The HUD was rebuilt to match the current prototype direction with a compact top status capsule, lucide icons, and active bonus countdown display.
- Touch controls now remain visible instead of being gated only by coarse-pointer detection, giving mobile users a reliable input path.
- Camera follow now runs on all levels and adds a bottom-safe offset so the player is less likely to sit under the control cluster.

Implementation impact:

- Agents should use lucide icons for DOM HUD controls instead of custom SVG or emoji glyphs.
- Bonus UI should read `activeBonus` from [useGame.ts](../src/useGame.ts) for HUD display and keep ability booleans for gameplay effects.
- Camera work in [Scene.tsx](../src/Scene.tsx) must account for persistent bottom controls when calibrating follow offsets.

## 1.26.3 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [Architecture Map](Architecture%20Map.md)

Reason:

- River turtle visuals now follow the same runtime lane positions as their collision bodies instead of rendering at stale spawn coordinates.
- Camera framing no longer shrinks the board as levels become taller, and the follow motion now uses a softer damped offset to preserve readability.
- Super-hop movement now applies its longer stride consistently in all directions and falls back to a normal hop at board limits instead of blocking movement.

Implementation impact:

- Agents should keep moving river-platform visuals bound to runtime lane refs, not spawn-time item snapshots.
- Camera changes in [Scene.tsx](../src/Scene.tsx) should preserve the fixed baseline zoom budget and adjust follow behavior through damping, not by scaling the whole board down per level.
- Bonus movement changes should remain reversible and test-covered in [gameCore.ts](../src/gameCore.ts) and [gameCore.test.ts](../src/gameCore.test.ts).

## 1.26.2 - 2026-06-26

Changed files and notes:

- [useGame.ts](../src/useGame.ts)
- [Architecture Map](Architecture%20Map.md)

Reason:

- Runtime obstacle and platform positions were being reset from React state on unrelated rerenders, including the once-per-second HUD timer tick.
- Lane-motion refs now keep ownership of live positions between renders and are only reseeded when lane state is intentionally rebuilt.

Implementation impact:

- Agents should treat mutable lane motion in [useGame.ts](../src/useGame.ts) as ref-owned runtime state.
- UI timers or HUD state changes must not write stale lane snapshots back into the runtime ref during render.

## 1.26.1 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [Architecture Map](Architecture%20Map.md)

Reason:

- The canvas renderer now uses an explicit percentage-closer shadow mode instead of the React Three Fiber boolean default.
- This removes the repeated Three.js deprecation warning caused by the boolean default mapping to `PCFSoftShadowMap`.

Implementation impact:

- Agents should keep shadow-map selection explicit in [App.tsx](../src/App.tsx) when changing canvas configuration, rather than relying on the boolean `shadows` shortcut.

## 1.26.0 - 2026-06-26

Changed files and notes:

- [gameChallenge.ts](../src/gameChallenge.ts)
- [gameChallenge.test.ts](../src/gameChallenge.test.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)
- [00 Context Index](00%20Context%20Index.md)
- [Architecture Map](Architecture%20Map.md)
- [Implementation Notes](Implementation%20Notes.md)
- [Project Overview](Project%20Overview.md)
- [Agent Context Protocol](Agent%20Context%20Protocol.md)
- [AGENTS.mdc](AGENTS.mdc)

Reason:

- Challenge-session state and reward scoring helpers were extracted out of the main hook into a dedicated pure module.
- This reduces the central coupling in `useGame.ts` and gives the reward flow its own testable surface.

Implementation impact:

- Agents should use `gameChallenge.ts` for level reward/session calculations instead of reintroducing the same logic into `useGame.ts`.
- Future reward or objective work should extend the helper module and its tests, not create another hook-local score accumulator.

## 1.25.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [Project Overview](Project%20Overview.md)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- Time-challenge bonuses now exist as a visible short-objective reward for fast level clears.
- The HUD now surfaces level elapsed time, which makes the timer objective legible during play instead of being a hidden scoring rule.

Implementation impact:

- Agents should treat timer-challenge bonuses as current gameplay behavior.
- Future objective work should extend the same visible reward pattern rather than leaving timer rewards implicit.

## 1.24.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- Perfect-clear bonuses now reward level completion with zero deaths, which gives the player a concrete clean-run objective on top of the fly combo system.
- The level-complete overlay now surfaces the bonus explicitly so the reward loop is visible instead of hidden in score drift.

Implementation impact:

- Agents should treat perfect-clear bonuses as current gameplay behavior.
- Future challenge work should extend this pattern with timer-based objectives or additional visible reward states instead of reintroducing hidden score modifiers.

## 1.23.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [Scene.tsx](../src/Scene.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- The bonus system gained a fifth collectible class: fly pickups that open a temporary combo scoring window.
- Score handling now applies the combo window to row progress, goal captures, and bonus pickups, which makes the bonus loop more legible and more rewarding.

Implementation impact:

- Agents should treat fly combo pickups as a current gameplay baseline, not as a future idea.
- Future bonus work should extend the existing collectible/temporary-effect pattern with new score rules or objectives instead of adding another unlabeled pickup branch.

## 1.22.0 - 2026-06-26

Changed files and notes:

- [gameReplay.ts](../src/gameReplay.ts)
- [gameReplay.test.ts](../src/gameReplay.test.ts)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [00 Context Index](00%20Context%20Index.md)
- [Architecture Map](Architecture%20Map.md)
- [Implementation Notes](Implementation%20Notes.md)
- [Project Overview](Project%20Overview.md)
- [AGENTS.mdc](AGENTS.mdc)
- [Agent Context Protocol](Agent%20Context%20Protocol.md)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- Deterministic replay and seed-log capture now exist as a QA reproduction layer, with seed, input sequence, and state summaries persisted through a dedicated module.
- The context graph now needs to name replay explicitly so agents do not treat it as an undocumented ad hoc helper.

Implementation impact:

- Agents should treat `gameReplay.ts` as a QA adapter around deterministic snapshots, not as a gameplay rules source.
- Future bug-repro work should extend the same capture/playback path instead of inventing a parallel logging mechanism.

## 1.21.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- The bonus system now has a fourth temporary ability baseline: super hop, which extends hop range for a limited duration.
- The runtime, HUD, scene, and documentation now distinguish super hop from the other temporary abilities instead of leaving it as a future idea.

Implementation impact:

- Agents should treat shield, slow time, current anchor, and super hop as current baseline abilities.
- Future bonus work should extend the same deterministic pickup/runtime/visual/test pattern rather than inventing an uncategorized pickup path.

## 1.20.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- The bonus system now has a third temporary ability baseline, current anchor, which suppresses river drift for a limited duration.
- The visual language and backlog now distinguish shield, slow time, and current anchor as separate temporary abilities.

Implementation impact:

- Agents should treat current anchor as a current capability baseline alongside shield and slow time.
- Future ability work should extend this pattern rather than reintroducing vague, uncategorized pickup effects.

## 1.19.0 - 2026-06-26

Changed files and notes:

- [gameMetricsStorage.ts](../src/gameMetricsStorage.ts)
- [gameMetricsStorage.test.ts](../src/gameMetricsStorage.test.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)
- [00 Context Index](00%20Context%20Index.md)
- [Architecture Map](Architecture%20Map.md)
- [Implementation Notes](Implementation%20Notes.md)
- [AGENTS.mdc](AGENTS.mdc)
- [Agent Context Protocol](Agent%20Context%20Protocol.md)
- [Project Overview](Project%20Overview.md)

Reason:

- The in-memory metrics adapter now has a downstream persistence sink that flushes gameplay events into local storage snapshots.
- This makes the event pipeline actionable without coupling the core game loop to analytics infrastructure.

Implementation impact:

- Agents should keep `gameMetrics.ts` as the event source and `gameMetricsStorage.ts` as the consumer.
- If remote analytics is added later, it should layer on top of the same adapter pattern instead of folding back into the game loop.

## 1.18.0 - 2026-06-26

Changed files and notes:

- [gameConstants.ts](../src/gameConstants.ts)
- [gameConstants.test.ts](../src/gameConstants.test.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Generated levels now run through a pure validation guard that checks structural fairness and modifier compatibility before the level is accepted.
- The guard has explicit unit tests for both valid generated levels and invalid modifier/layout combinations.

Implementation impact:

- Agents should treat level validation as part of the generation pipeline, not as optional documentation-only intent.
- Future level or modifier changes must keep the validator and its tests in sync with the expected fairness contract.

## 1.17.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)
- [ITERATIONS.mdc](ITERATIONS.mdc)

Reason:

- The bonus system now has a second temporary ability baseline: slow-time pickups that reduce hazard speed for a limited duration.
- The runtime, HUD, 3D scene, tests, and documentation all need to understand the new ability so it remains visible, reversible, and easy to extend.

Implementation impact:

- Agents should treat shield and slow time as current capability baselines when extending bonuses or abilities.
- Future abilities should follow the same pattern: deterministic pickup generation, explicit runtime state, visible scene feedback, and unit coverage.

## 1.16.0 - 2026-06-26

Changed files and notes:

- [00 Context Index](00%20Context%20Index.md)
- [Agent Context Protocol](Agent%20Context%20Protocol.md)
- [AGENTS.mdc](AGENTS.mdc)
- [Project Overview](Project%20Overview.md)
- [Architecture Map](Architecture%20Map.md)
- [Implementation Notes](Implementation%20Notes.md)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The project context now treats `project_context` as the canonical memory store with Obsidian vault configuration preserved in `.obsidian`.
- The documentation graph now includes `viewMath.ts` and `gameMetrics.ts` so agents can follow the current implementation surface without relying on stale memory.
- Agent instructions now explicitly require linked references, context verification, and versioned documentation updates.

Implementation impact:

- Agents should read the Obsidian context before making behavior changes and keep code references linked in any note that mentions implementation details.
- Future changes should continue to record structural or workflow changes in this changelog when they alter the context model or the source-of-truth graph.

## 1.15.0 - 2026-06-26

Changed files and notes:

- [gameConstants.ts](../src/gameConstants.ts)
- [Scene.tsx](../src/Scene.tsx)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)

Reason:

- Level generation now emits deterministic modifiers for rain, night traffic, fast currents, and narrow platforms.
- The visual and project docs now describe those modifiers as real current-state behavior rather than future intent.

Implementation impact:

- Agents should keep modifiers deterministic and ensure they remain legible in both gameplay and art-direction notes.
- Future level variety should build on the current modifier baseline instead of reintroducing only raw speed scaling.

## 1.14.0 - 2026-06-26

Changed files and notes:

- [gameMetrics.ts](../src/gameMetrics.ts)
- [gameMetrics.test.ts](../src/gameMetrics.test.ts)
- [useGame.ts](../src/useGame.ts)
- [gameCore.ts](../src/gameCore.ts)
- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The game now has deterministic shield pickups plus an in-memory metrics adapter that records core gameplay events.
- This advances both the bonus system and the product instrumentation backlog without coupling analytics to domain rules.

Implementation impact:

- Agents should treat shield pickups as the current bonus baseline and the metrics adapter as the current instrumentation baseline.
- Event recording should remain adapter-driven and separate from core gameplay logic.

## 1.13.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The game now has deterministic collectible shield pickups that award bonus score and a temporary protection state.
- The gameplay docs should no longer describe the project as having no bonus system.

Implementation impact:

- Agents should treat shield pickups as the current bonus baseline and continue extending toward richer pickup variants and ability classes.
- The shield system is implemented through core helpers, runtime state, renderer feedback, and HUD status.

## 1.12.0 - 2026-06-26

Changed files and notes:

- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Step mode now keeps the simulation paused across restart and level transition flows until an explicit step is requested.
- This makes the QA control sticky enough to be useful during repeated testing passes.

Implementation impact:

- Agents should preserve pause state in step mode when resetting or advancing levels.
- The step button and step hotkey now act as the only explicit advancement path while the mode is enabled.

## 1.11.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [useGame.ts](../src/useGame.ts)
- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Dev mode now includes a single-step simulation control that advances the paused game one tick at a time.
- The new control is covered by the dev-flag parser test and exposed in the HUD for QA use.

Implementation impact:

- Agents should keep step-mode paused by default and preserve time-freezing behavior while waiting for the next step.
- Developer-mode QA can now inspect one simulation tick at a time without browser automation.

## 1.10.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [Scene.tsx](../src/Scene.tsx)
- [Art Direction Sheet](Art%20Direction%20Sheet.md)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The game now respects reduced-motion preferences by damping screen shake and major decorative oscillation.
- The art direction sheet now explicitly calls out reduced-motion behavior so future visual work stays aligned.

Implementation impact:

- Agents should preserve reduced-motion behavior when adding new motion-heavy visuals or overlays.
- Non-essential movement should remain suppressible when the system preference is enabled.

## 1.9.0 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Decorative grass tufts now use `InstancedMesh`, reducing scene node count without changing the visual language.
- This is a concrete performance-oriented visual cleanup that stays within the current Three.js stack.

Implementation impact:

- Agents should prefer instancing for repeated decorative geometry before adding more one-off meshes.
- The scene is now cheaper to render in dense safe-lane areas.

## 1.8.0 - 2026-06-26

Changed files and notes:

- [Art Direction Sheet](Art%20Direction%20Sheet.md)
- [00 Context Index](00%20Context%20Index.md)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- A stable visual reference note now exists for palette, materials, silhouettes, FX, UI tone, and motion tone.
- The context index now links the new note so agents can find it before making visual changes.

Implementation impact:

- Agents should consult the art direction sheet before changing scene materials, heights, effects, or HUD iconography.
- Visual changes should stay aligned with the documented palette and motion tone.

## 1.7.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The game-over and level-complete overlays now use controlled SVG icons instead of emoji glyphs.
- This keeps the most visible end-state UI consistent across platforms and aligns with the HUD icon policy.

Implementation impact:

- Agents should prefer controlled SVG or asset-based icons for critical overlays instead of platform-specific emoji.
- The title, lives, and end-state screens now share the same visual icon language.

## 1.6.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The primary HUD frog indicators now use a controlled SVG icon instead of emoji glyphs.
- This improves cross-platform consistency for the most visible status markers without changing the stack.

Implementation impact:

- Agents should prefer controlled icons for critical HUD status markers when a glyph would vary by platform.
- The game now renders the title and lives through the same icon component, keeping the visual language consistent.

## 1.5.0 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [viewMath.ts](../src/viewMath.ts)
- [viewMath.test.ts](../src/viewMath.test.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The camera now computes orthographic zoom from viewport size and board bounds through a pure helper.
- This closes the explicit camera-fit item from the visual improvement plan without changing the stack.

Implementation impact:

- Agents should use `computeOrthographicZoom` for future ortho viewport-fit adjustments rather than hard-coding zoom values.
- The camera still preserves the existing z-follow behavior, but its base zoom now responds to viewport size.

## 1.4.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The top HUD now wraps on narrow screens so the title and counters do not force a single crowded row.
- This is a small but real responsive improvement and should be reflected in the project context.

Implementation impact:

- Agents should keep top-level HUD bands wrap-aware and preserve the compact mobile layout.
- Responsive layout changes should continue to be documented as actual behavior, not just intent.

## 1.3.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Lane classification and row lookup now live in explicit helpers rather than inline string checks in the game loop.
- This tightens the collision-policy boundary and adds deterministic unit coverage for the helper layer.

Implementation impact:

- Agents should prefer `getLaneAtRow`, `isRoadLane`, `isRiverLane`, and `isGoalLane` when branching on lane behavior.
- The helper layer makes it easier to adjust collision policy without scattering string comparisons across the loop.

## 1.2.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- Row-progress and goal score transitions now use named constants instead of raw literals.
- This keeps scoring rules explicit in the core and reduces the risk of accidental drift across call sites.

Implementation impact:

- Agents should read score thresholds from `gameCore.ts` when extending scoring logic.
- Future score adjustments should change the named constants, not local numeric literals.

## 1.1.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The developer-mode overlay now exposes the frog's current row and column through a dedicated query flag.
- This closes another QA convenience gap without affecting normal gameplay state.

Implementation impact:

- Agents should keep debug overlays gated by explicit flags and covered by unit tests where the flag parser is involved.
- The runtime cell debug overlay should remain disabled in normal play.

## 1.0.0 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The scene now uses named render constants for lane surfaces, frog lift, water, shadow, and board shell geometry.
- This reduces hard-coded height duplication and makes the visual tuning surface easier to maintain.

Implementation impact:

- Future visual adjustments should reuse the named scene constants instead of adding new literals for the same heights.
- The render offsets remain behaviorally equivalent; only the ownership of the values changed.

## 0.9.0 - 2026-06-26

Changed files and notes:

- [gameConstants.ts](../src/gameConstants.ts)
- [gameCore.ts](../src/gameCore.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The playable top boundary and river edge buffer now use named constants instead of repeating raw `CELL_SIZE` math.
- Context should record the boundary constants so future refactors keep the same movement and collision semantics.

Implementation impact:

- Agents should prefer named bounds from `gameConstants.ts` instead of recomputing hard-coded half-cell or top-row offsets in downstream code.
- Collision and movement rules remain the same; only the constants ownership changed.

## 0.8.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [audio.ts](../src/audio.ts)
- [gameCore.ts](../src/gameCore.ts)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [useGame.ts](../src/useGame.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- The current turn added pointer-aware HUD controls, one-shot audio node cleanup, and a dev-mode level-jump flag.
- Context should track the active runtime and developer-mode surface, not just the earlier collision diagnostics step.

Implementation impact:

- Agents should keep pointer-sensitive HUD hints conditional and continue to treat one-shot audio nodes as explicit cleanup targets.
- Dev-mode startup level should remain covered by unit tests and documented in the project notes.

## 0.7.0 - 2026-06-26

Changed files and notes:

- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- HUD controls now react to pointer capabilities, so touch buttons and keyboard hints are no longer always rendered together.
- The context should describe the current responsive behavior instead of the earlier always-on control overlay.

Implementation impact:

- Agents should keep HUD affordances device-aware and avoid showing unsupported input hints at the same time.
- Responsive control visibility should stay documented in `project_context` when changed.

## 0.6.0 - 2026-06-26

Changed files and notes:

- [audio.ts](../src/audio.ts)
- [PROJECT.mdc](PROJECT.mdc)

Reason:

- One-shot audio graphs now disconnect after playback, and music cleanup now disconnects active ambient nodes on stop.
- The context should no longer describe these audio nodes as an open cleanup leak.

Implementation impact:

- Agents should keep procedural audio nodes explicitly disconnected after use, especially in long-running sessions.
- Hook cleanup should continue to stop music and release active node references.

## 0.5.0 - 2026-06-26

Changed files and notes:

- [Scene.tsx](../src/Scene.tsx)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [PROJECT.mdc](PROJECT.mdc)
- [Architecture Map](Architecture%20Map.md)

Reason:

- Runtime frog and lane motion moved out of React state and into refs, reducing per-frame reconciliation while keeping the HUD state-driven.
- The source-of-truth context must describe the current runtime boundary, not the earlier per-frame React state path.

Implementation impact:

- Agents should keep high-frequency entity motion in refs or a simulation object and reserve React state for coarse UI and lifecycle transitions.
- Scene rendering should continue to read from runtime refs instead of assuming React state is the canonical animation source.

## 0.4.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [Scene.tsx](../src/Scene.tsx)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [PROJECT.mdc](PROJECT.mdc)
- [Architecture Map](Architecture%20Map.md)

Reason:

- The technical-debt plan advanced with transition helpers and developer collision diagnostics.
- The documentation core should reflect the current source-of-truth structure and the remaining hot-loop debt.

Implementation impact:

- Agents should continue extracting gameplay transitions into `gameCore.ts` rather than embedding them in `useGame.ts`.
- Developer mode now has a visible collision diagnostics path in the scene and should remain gated by explicit flags.

## 0.3.0 - 2026-06-26

Changed files and notes:

- [gameCore.ts](../src/gameCore.ts)
- [highScoreStorage.ts](../src/highScoreStorage.ts)
- [useGame.ts](../src/useGame.ts)
- [App.tsx](../src/App.tsx)
- [gameCore.test.ts](../src/gameCore.test.ts)
- [highScoreStorage.test.ts](../src/highScoreStorage.test.ts)
- [Project audit](PROJECT.mdc)
- [Architecture Map](Architecture%20Map.md)
- [Implementation Notes](Implementation%20Notes.md)

Reason:

- The project implemented the first layer of the technical-debt plan by extracting pure gameplay helpers, adding a storage adapter, and adding unit tests.
- Restart handling now uses an explicit action.
- The context must reflect the new source-of-truth modules and test coverage.

Implementation impact:

- Agents should extend `gameCore.ts` for rules and `highScoreStorage.ts` for persistence instead of putting more logic into `useGame.ts`.
- Future technical-debt work should continue from the new core/helper modules and the existing Vitest test suite.

## 0.2.0 - 2026-06-26

Changed files and notes:

- [Project audit](PROJECT.mdc)
- [Development iterations](ITERATIONS.mdc)
- [Agent manifest](AGENTS.mdc)
- [Root agent entry point](../AGENTS.md)
- [[00 Context Index]]
- [[Agent Context Protocol]]
- [[Project Overview]]
- [[Implementation Notes]]
- [[Context Changelog]]

Reason:

- `project_context` is now the primary documentation-context core and memory store for agents.
- The former `project_info` documents were moved into `project_context`.
- The `project_info` directory was removed after migration.

Implementation impact:

- Agents must use `project_context` as the canonical context source for implementation, control, and file edits.
- All implementation documentation should link to files and code through `project_context`.
- New stable decisions, workflow rules, and architecture notes must be versioned in this changelog.

## 0.1.0 - 2026-06-26

Changed files and notes:

- [[00 Context Index]]
- [[Agent Context Protocol]]
- [[Project Overview]]
- [[Architecture Map]]
- [[Implementation Notes]]
- [[Context Changelog]]
- [Agent manifest](AGENTS.mdc)
- [Development iterations](ITERATIONS.mdc)

Reason:

- The project now uses `project_context` as an Obsidian vault for agent-readable project context.
- Agents need a stable protocol for checking context, maintaining links, referencing code, and versioning documentation decisions.

Implementation impact:

- Agents must check Obsidian context before code changes.
- Documentation must link to related notes, project docs, and concrete source files.
- Meaningful context changes must be versioned in this changelog.
