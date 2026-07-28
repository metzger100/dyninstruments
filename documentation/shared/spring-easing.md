# Spring Easing

**Status:** ✅ Active | Critically damped spring smoothing for animated canvas values

## Overview

`SpringEasing` provides the shared motion primitive used by the phase 8 gauge and text renderers. It exposes a per-value
spring integrator plus a canvas-keyed motion controller so widgets can smooth pointer/heading/XTE changes without
duplicating animation state.

## Key Details

- Module: `shared/widget-kits/anim/SpringEasing.js`.
- `create(def, componentContext).createMotion(spec).isActive(canvas)` reports whether a follow-up animation frame is
  still needed for that canvas.
- Motion state is keyed per canvas, so multiple widgets can share the module without cross-talk.
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

- The spring snaps to the first finite target.
- Subsequent target changes are eased over time.
- `createMotion()` keeps per-canvas state isolated.
- `createMotion().isActive(canvas)` reports whether a follow-up frame is still needed.

## Related

- [SpringEasing module](../../shared/widget-kits/anim/SpringEasing.js)
- [Canvas DOM surface adapter](../architecture/canvas-dom-surface-adapter.md)
