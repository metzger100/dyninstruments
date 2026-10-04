# Spring Easing

**Status:** Current.

## Overview

`SpringEasing` provides the shared motion primitive used by the gauge and text renderers. It exposes a per-value spring
integrator plus a canvas-keyed motion controller so widgets can smooth pointer/heading/XTE changes without duplicating
animation state.

## Key Details

- Module: `shared/widget-kits/anim/SpringEasing.js`.
- `create(def, componentContext).createMotion(spec).isActive(canvas)` reports whether a follow-up animation frame is
  still needed for that canvas.
- Motion state is keyed per canvas, so multiple widgets can share the module without cross-talk.
- `createMotion(spec).resolve(canvas, target, easingEnabled, nowMs)` returns the eased value for that canvas. With
  easing disabled it snaps to the target.
- A missing (non-finite) target makes `resolve()` return `NaN` and resets the motion: callers draw no pointer, marker,
  or rotated face for a missing value, and the next finite target snaps to its value instead of easing from the stale
  position.
- The spring snaps immediately to the first finite target value; only subsequent target changes are eased.
- `wrap` lets a spring take the shortest wrapped arc (e.g. heading values wrapping at 360).

## API

- `create(def, componentContext).create(spec)` creates a spring instance.
- `create(def, componentContext).createMotion(spec)` creates a canvas-keyed motion controller.
- Spring options:
  - `stiffness`
  - `maxDtMs`
  - `epsilon`
  - `epsilonVelocity`
  - `wrap`

## Behavior

- The spring snaps to the first finite target, and again to the first finite target after a missing one.
- Subsequent target changes are eased over time.
- A missing target returns `NaN` and resets the motion, so `isActive(canvas)` reports no follow-up frame.
- `createMotion()` keeps per-canvas state isolated.
- `createMotion().isActive(canvas)` reports whether a follow-up frame is still needed.

## Related

- [SpringEasing module](../../shared/widget-kits/anim/SpringEasing.js)
- [Canvas DOM surface adapter](../architecture/canvas-dom-surface-adapter.md)
