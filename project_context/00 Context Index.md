---
context_version: 0.3.2
status: active
updated: 2026-07-04
---

# Context Index

This Obsidian vault is the primary documentation-context core and memory store for the Frogger game project. Agents must use `project_context` as the canonical context source before and during implementation, and treat `project_context/.obsidian` as vault configuration.

## Start Here

- [[Agent Context Protocol]]
- [[Project Overview]]
- [[Architecture Map]]
- [[Art Direction Sheet]]
- [[Implementation Notes]]
- [[Context Changelog]]

## Project Documents

- [Project audit](PROJECT.mdc)
- [Development iterations](ITERATIONS.mdc)
- [Agent manifest](AGENTS.mdc)

## Code Entry Points

- [App shell](../src/App.tsx)
- [Localized start screen](../src/MainScreen.tsx)
- [Shared UI localization](../src/localization.ts)
- [Exit confirmation overlay](../src/ConfirmExitOverlay.tsx)
- [End-state overlays](../src/EndStateOverlay.tsx)
- [Game state and loop](../src/useGame.ts)
- [Keyboard action mapping](../src/gameInput.ts)
- [Pure gameplay core](../src/gameCore.ts)
- [R3F scene](../src/Scene.tsx)
- [Game constants and levels](../src/gameConstants.ts)
- [Viewport fitting math](../src/viewMath.ts)
- [High score storage](../src/highScoreStorage.ts)
- [Gameplay metrics](../src/gameMetrics.ts)
- [Gameplay metrics storage](../src/gameMetricsStorage.ts)
- [Replay capture and QA playback](../src/gameReplay.ts)
- [Challenge session and reward flow](../src/gameChallenge.ts)
- [Audio system](../src/audio.ts)

## Maintenance Rule

When implementation changes behavior, architecture, gameplay rules, or stability assumptions, update this vault in the same change set. Keep links bidirectional where practical: context notes should point to related context documents and concrete source files.
