---
context_version: 0.2.0
status: active
updated: 2026-06-26
---

# Agent Context Protocol

## Mandatory Context Check

Before implementation, every agent must read:

- [[00 Context Index]]
- [[Project Overview]]
- [[Architecture Map]]
- [[Implementation Notes]]
- [Agent manifest](AGENTS.mdc)
- the source files directly affected by the task

If the task touches audited debt, also read [Project audit](PROJECT.mdc). If the task changes the development process, also read [Development iterations](ITERATIONS.mdc).

## Link Maintenance

Agents must keep Obsidian links current while implementing:

- Add or update wiki links between related context notes.
- Add markdown links to source files when documentation mentions concrete code.
- Add markdown links to `project_context` documents when context decisions depend on them.
- Treat `project_context/.obsidian` as vault configuration and keep it intact unless the task explicitly targets vault settings.
- When a new module is introduced, add it to [[Architecture Map]] if it affects game flow, state, rendering, input, audio, storage, testing, or developer mode.
- When a decision changes project direction, add a short entry to [[Context Changelog]].

## Documentation References

Documentation must not describe code anonymously when a concrete file exists. Prefer explicit references:

- [Game state and loop](../src/useGame.ts)
- [R3F scene](../src/Scene.tsx)
- [App shell](../src/App.tsx)
- [Game constants and levels](../src/gameConstants.ts)
- [Viewport fitting math](../src/viewMath.ts)
- [Gameplay metrics](../src/gameMetrics.ts)
- [Gameplay metrics storage](../src/gameMetricsStorage.ts)
- [Replay capture and QA playback](../src/gameReplay.ts)
- [Challenge session and reward flow](../src/gameChallenge.ts)
- [Audio system](../src/audio.ts)

When referencing a function or concept, include both the code file and the context note that explains the decision, if one exists.

## Versioning

Use semantic context versions in frontmatter:

- Patch: clarifications, link fixes, small notes.
- Minor: new documented workflow, new subsystem, new agent rule.
- Major: architecture direction changes or context model changes.

Every meaningful documentation update must add an entry to [[Context Changelog]] with:

- context version;
- date;
- changed files or notes;
- reason for change;
- implementation impact.

## Stability Guardrails

- Do not implement against memory alone if context notes exist.
- If code and context disagree, inspect code first, then update the context or explicitly record the mismatch.
- Do not delete context links without replacing them with better links.
- Keep project context small enough to scan, but complete enough to preserve decisions across agent sessions.
