---
context_version: 0.1.0
status: active
updated: 2026-06-26
---

# Art Direction Sheet

## Scope

This note defines the current visual direction for the game and keeps the implementation anchored to concrete source files:

- [Scene.tsx](../src/Scene.tsx)
- [App.tsx](../src/App.tsx)
- [gameConstants.ts](../src/gameConstants.ts)

## Palette

- Base ground: deep green, muted grass, low-saturation brown.
- Road: charcoal gray with yellow lane markings.
- Water: saturated blue with subtle emissive tint.
- Frog and reward states: bright green with yellow/emerald accents.
- Danger states: red/orange accents with restrained bloom.

## Materials

- Prefer low-to-medium roughness on vehicles and frog body parts.
- Keep water slightly glossy and emissive, but not mirror-like.
- Use matte ground surfaces and restrained foliage contrast.
- Reuse materials where possible in [Scene.tsx](../src/Scene.tsx).

## Silhouettes

- Frog should remain the most readable character on the board.
- Vehicles should keep simple, arcade-like profiles with strong shape separation.
- Logs and turtles should be readable at a glance, with turtle shells acting as support platforms.
- HUD icons should be controlled SVG or asset-driven, not platform-dependent emoji.

## Heights And Motion

- Keep lane, frog, shadow, and water heights owned by named constants.
- Use a small bob on pads and light frog scale motion for life.
- Preserve partial camera follow on desktop. Phone-sized viewports should use a row-aligned camera with smooth player tracking, lower-third upward framing, downward look-ahead, and board-edge constraints that prevent empty space from displacing the playfield.

## FX Language

- Use subtle longitudinal water streaks that follow each lane's platform direction, screen shake on death, and bounce-in overlays.
- Keep contiguous river sections visually seamless; avoid circular ripple patterns and per-lane surface breaks.
- Keep water under the lily-pad goal row static and aligned to the main canal palette.
- Avoid excessive bloom, particle spam, or noisy post-processing.
- Reward feedback should be clear and short-lived, not cinematic.
- Level modifiers should read visually: rain should feel wet and lower contrast, night traffic should feel darker with stronger headlights, and current-heavy boards should keep the water motion readable.
- Temporary abilities should have distinct language: shield should stay warm/gold, slow time should stay cool/blue, current anchor should stay teal/green, super hop should stay amber/orange, and all of them should remain compact enough not to obscure the frog.

## UI Tone

- HUD should be compact, utilitarian, and easy to scan.
- Controls should be device-aware and avoid cluttering unsupported devices.
- End-state overlays should keep the same icon language as the HUD.

## Motion Tone

- Motion should feel crisp and arcade-like.
- Keep hops short and readable.
- Avoid slow or floaty transitions unless they are tied to a temporary ability or reward state.
- Respect reduced-motion preferences by suppressing non-essential bobbing, screen shake, and decorative oscillation.
