---
context_version: 0.2.0
status: active
updated: 2026-06-26
---

# Project Overview

The project is a browser Frogger-style game built with React, Vite, Tailwind CSS, Three.js, and React Three Fiber.

## Primary Loop

The player moves a frog across road and river lanes, avoids vehicles, rides platforms, reaches unique lily pads, fills all goals, and advances to the next level.

Related code:

- [Game state and loop](../src/useGame.ts)
- [Game constants and levels](../src/gameConstants.ts)
- [R3F scene](../src/Scene.tsx)

Related docs:

- [Project audit](PROJECT.mdc)
- [Development iterations](ITERATIONS.mdc)
- [[Architecture Map]]

## Current Priorities

- Stabilize simulation and collision rules.
- Extract testable pure gameplay logic.
- Add unit test coverage without Playwright when browser tests are forbidden.
- Improve responsive HUD and camera fit.
- Add developer mode for faster QA.
- Keep Obsidian context and project docs linked during implementation.

## Non-Goals Unless Explicitly Requested

- Do not migrate to another renderer or game engine.
- Do not add Playwright/browser testing when the task forbids it.
- Do not replace core gameplay rules without documenting the decision in [[Context Changelog]].
