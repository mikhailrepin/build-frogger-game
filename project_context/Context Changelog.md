---
context_version: 0.2.0
status: active
updated: 2026-06-26
---

# Context Changelog

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
