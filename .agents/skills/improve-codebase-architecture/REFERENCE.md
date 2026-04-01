# Reference

## Architecture Evaluation Lens for dyninstruments

When proposing a deeper or simpler interface, classify the dominant boundary involved.

### 1. Pure in-process boundary

Pure computation, layout math, formatting, config normalization, or other logic that can be exercised entirely in memory.

Recommendation pattern:

- merge shallow helpers behind one clear owner
- expose one small stable interface
- test behavior at that interface

### 2. Browser / DOM boundary

Logic depends on DOM measurement, CSS classes, resize handling, or widget lifecycle, but is still local to the browser runtime.

Recommendation pattern:

- keep DOM-touching code at the boundary
- move decision-making and normalization behind a testable facade
- use jsdom-friendly seams where practical

### 3. Host integration boundary

Logic depends on AvNav host capabilities, `window.avnav`, host actions, or page-specific dispatch behavior.

Recommendation pattern:

- isolate host coupling behind a small adapter or capability facade
- make the rest of the logic consume normalized host capabilities
- test core logic without requiring real host runtime access

### 4. Registry / configuration boundary

Behavior is spread across kind catalogs, config registries, editables, or mapper wiring.

Recommendation pattern:

- reduce duplication in registration and normalization flows
- keep the source of truth obvious
- avoid introducing a generic layer that obscures ownership

### 5. True external boundary

Rare in this repo, but applies when a dependency cannot be exercised directly in tests.

Recommendation pattern:

- inject a narrow boundary
- use a focused test double
- keep the interface centered on repo behavior, not vendor API shape

## Testing Strategy

Core principle: test the deepest stable interface you can justify.

- Prefer behavior tests over implementation-detail tests.
- Replace shallow redundant tests once stronger boundary tests cover the behavior.
- For refactors, add regression protection before moving ownership.
- Keep tests aligned with stable contracts so internal reorganization stays cheap.

## PLAN Template

```md
# PLAN<N> — <Architecture Improvement Name>

## Status

Why the architectural review / refactor proposal exists.

## Problem

Describe the friction clearly.

## Verified Baseline

Concrete repo facts checked before proposing changes.

## Candidate Interface Designs

### Option A — Minimal interface
- interface signature
- usage example
- complexity hidden internally
- dependency strategy
- trade-offs

### Option B — Flexible interface
...

### Option C — Common-case optimized interface
...

### Option D — Ports / adapters boundary (only if applicable)
...

## Recommendation

Strong opinion on which design best fits this repo and why.

## Migration Strategy

How callers move to the recommended interface safely.

## Testing Strategy

New boundary tests, obsolete tests, and regression coverage to add first.

## Documentation Impact

Docs that should change if the design lands.

## Out of Scope

What this architecture work intentionally does not solve.

## Validation

- `npm run check:all`
- any cleanup commands if relevant
```
