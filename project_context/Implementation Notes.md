---
context_version: 0.2.1
status: active
updated: 2026-07-04
---

# Implementation Notes

## Required Before Code Changes

- Read [[Agent Context Protocol]].
- Check [Agent manifest](AGENTS.mdc).
- Check [Project audit](PROJECT.mdc) when touching stability, UI/UX, gameplay, product metrics, or technical debt.
- Check [Development iterations](ITERATIONS.mdc) when changing roadmap, testing strategy, developer mode, or visual improvement plans.

## Code Reference Policy

When documentation mentions implementation details, include links to the relevant files:

- Gameplay state: [useGame.ts](../src/useGame.ts)
- Pure gameplay core: [gameCore.ts](../src/gameCore.ts)
- Storage adapter: [highScoreStorage.ts](../src/highScoreStorage.ts)
- Rendering: [Scene.tsx](../src/Scene.tsx)
- UI shell: [App.tsx](../src/App.tsx)
- Start screen: [MainScreen.tsx](../src/MainScreen.tsx)
- Level constants: [gameConstants.ts](../src/gameConstants.ts)
- Viewport fitting math: [viewMath.ts](../src/viewMath.ts)
- Gameplay metrics: [gameMetrics.ts](../src/gameMetrics.ts)
- Gameplay metrics persistence: [gameMetricsStorage.ts](../src/gameMetricsStorage.ts)
- Replay capture and QA playback: [gameReplay.ts](../src/gameReplay.ts)
- Challenge session and reward flow: [gameChallenge.ts](../src/gameChallenge.ts)
- Audio: [audio.ts](../src/audio.ts)

## Implementation Checklist

- Confirm whether the task changes gameplay rules, rendering, UI, audio, tests, or docs.
- Read the matching context notes and source files.
- Keep behavior changes testable without browser automation unless browser testing is explicitly allowed.
- Prefer pure helper modules and unit tests for any new gameplay rule or storage behavior.
- Update [[Architecture Map]] for structural changes.
- Update [[Context Changelog]] for meaningful context or decision changes.
- Link new docs to [[00 Context Index]] if they become stable project context.
- If documentation mentions a concrete behavior, include the source file and the related context note in the same change set.
- Keep metrics adapters and metrics storage separate from the core gameplay loop.

## Version-Control Discipline

- Keep context updates in the same branch/change set as implementation changes when they explain that implementation.
- Do not make undocumented behavior changes.
- Do not leave context docs pointing at deleted or renamed files.
- In final work summaries, mention both code changes and context/documentation changes.
