---
context_version: 0.2.0
status: active
updated: 2026-06-26
---

# Context Index

This Obsidian vault is the primary documentation-context core and memory store for the Frogger game project. Agents must use `project_context` as the canonical context source before and during implementation.

## Start Here

- [[Agent Context Protocol]]
- [[Project Overview]]
- [[Architecture Map]]
- [[Implementation Notes]]
- [[Context Changelog]]

## Project Documents

- [Project audit](PROJECT.mdc)
- [Development iterations](ITERATIONS.mdc)
- [Agent manifest](AGENTS.mdc)

## Code Entry Points

- [App shell](../src/App.tsx)
- [Game state and loop](../src/useGame.ts)
- [R3F scene](../src/Scene.tsx)
- [Game constants and levels](../src/gameConstants.ts)
- [Audio system](../src/audio.ts)

## Maintenance Rule

When implementation changes behavior, architecture, gameplay rules, or stability assumptions, update this vault in the same change set. Keep links bidirectional where practical: context notes should point to related context documents and concrete source files.
