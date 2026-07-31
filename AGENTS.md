# AGENTS.md - Project Standards & Workflow

This file is guidance for agents working in this repository.

<!-- BEGIN SHARED_INSTRUCTIONS -->

**Critical:** This file is a routing map. Use it to find focused documentation, not to store implementation details.

---

## 0. Mandatory Session Preflight (No Exceptions)

Before planning, coding, review, or documentation edits, always read:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

These three reads are mandatory for every task. Start implementation only after this preflight is complete.

If guidance conflicts, precedence is:

1. `documentation/core-principles.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. Task-specific documentation

---

## 1. Documentation Navigation Rule

1. **Read `documentation/TABLEOFCONTENTS.md` FIRST**
2. **Read `documentation/conventions/coding-standards.md` and `documentation/conventions/smell-prevention.md` for every
   task**
3. Identify 1-3 additional relevant files for your task
4. Read ONLY those additional files
5. **Never read all files sequentially** (wastes tokens)

---

## 2. Plan and Phase Citation Rule

A comment, docstring, config note, or documentation paragraph outside `exec-plans/` must not cite a historical exec-plan
number (`PLANn`) or phase identifier (`Phase N`) as authority. Describe the code or config standalone instead; a literal
pointer to a real `PLANn.md` file (for example in a "related plans" list) is still fine. Plan prose belongs only inside
`exec-plans/`.

---

## 3. README Sync Principle

`README.md` is mandatory documentation when user-facing behavior changes. Do not treat it as optional. Update
`README.md` in the same task whenever a change affects theming/configuration, user-selectable options, installation or
packaging, bundled assets, requirements/platform support, or contributor-visible workflow. For execution plans, include
explicit README deliverables and exit conditions for these categories.

---

## 4. Quality Checklist Skeleton

- [ ] Completed the mandatory preflight reads.
- [ ] Read only necessary additional documentation beyond mandatory preflight.
- [ ] Implementation complete.
- [ ] Updated relevant documentation, including the navigation index if a doc was added, moved, or removed.
- [ ] Updated `README.md` when the change is user-facing (see the README sync principle above).
- [ ] Ran the project's full quality gate — no failures.
- [ ] New/changed tests and coverage/complexity policy stay within this project's checked floors, budgets, and
      classifications; no suppression, skip, or lowered threshold was added to reach green.
- [ ] For releases, followed this project's release workflow exactly, without rerunning quality inside the publish step.

---

## Required Documentation Shape

Every maintained documentation page has a title, a plain `**Status:** Current.` line, and `## Overview`,
`## Key Details`, and `## Related` sections. Additional interface material is optional when it helps explain a public
contract. Keep documentation concise, concrete, and linked from the navigation index when it is new.
<!-- END SHARED_INSTRUCTIONS -->

---

## 5. Project Constraints (AvNav Plugin Environment)

- The signed portable quality core is local and standalone: `npm run check:shared-core` verifies the contract-derived
  manifest, `npm run check:generic-surface` is blocking, `npm run check:suppressions` owns the independent zero-comment
  scan, and `npm run portable-core:attest` emits only anonymous content digests. Required completion checks must also
  pass from an isolated copy containing only this repository.
- **No bundler, no runtime build step** - Raw JS loaded via `<script>` tags at runtime
- **Dev-only npm tooling is allowed** - used for tests and quality checks; not part of plugin runtime loading
- **UMD component pattern** - All components register on `window.DyniComponents.{globalKey}`
- **avnav.api** - Only external dependency. Plugin API provided by AvNav host app
- **AVNAV_BASE_URL** - Global string set by AvNav, used to construct module URLs
- **Host path is renderHtml-only** - Cluster widgets register `renderHtml` on AvNav host
- **Internal dual-surface model** - `surface: "html"` for native HTML kinds, `surface: "canvas-dom"` for internal canvas
  kinds
- **Canvas 2D remains internal** - Existing gauges/text canvas renderers run through `CanvasDomSurfaceAdapter` and
  `renderCanvas(canvas, props)` callbacks
- **No ES modules, no import/export** - Must use IIFE or UMD wrappers
- **HiDPI** - `componentContext.canvas.setupCanvas()` handles devicePixelRatio scaling
- **Plugin runtime is browser-only** - No server-side runtime code
- **Testing stack available** - Vitest configured projects for Node/jsdom tests, with native V8 coverage thresholds;
  required local/CI gates must not require an external browser binary or driver
- **Development toolchain** - Use Node 26 with npm 12.0.1; run `npm run setup` to install the lockfile and provision the
  checksum-verified actionlint cache before gates

---

## 6. Documentation Structure Reference

Use [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md) as the maintained documentation map. It is the
only source of the directory structure and canonical documentation links.

---

## 7. File Map

- Feature and API lookups: [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- Non-negotiable project rules: [documentation/core-principles.md](documentation/core-principles.md)
- Root structural orientation map: [ARCHITECTURE.md](ARCHITECTURE.md)
- User-facing documentation: [README.md](README.md)
- HTML renderer lifecycle patterns:
  [documentation/architecture/html-renderer-lifecycle.md](documentation/architecture/html-renderer-lifecycle.md)
- Step-by-step implementation workflows: [documentation/guides/](documentation/guides/)
- New stable or prerelease requests: start with
  [documentation/guides/release-workflow.md](documentation/guides/release-workflow.md) and follow
  `npm run release:prepare` -> `npm run release:create`
- Multi-session active execution plans: [exec-plans/active/](exec-plans/active/)

---

## 8. Quality Checklist (Project Detail)

- [ ] Completed mandatory preflight reads: TABLEOFCONTENTS.md + coding-standards.md + smell-prevention.md.
- [ ] Read only necessary additional documentation beyond mandatory preflight.
- [ ] Implementation complete.
- [ ] Updated relevant documentation.
- [ ] Updated user-facing `README.md` when changes touch theming, clusters/kinds, layouts, installation, configuration,
      requirements, or development workflow.
- [ ] Updated `tests/css/theme-token-extremes.user.css` when theme tokens/input vars/default theming behavior changes.
- [ ] Updated `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js` when adding or
      changing a kind with new user-visible visuals/layout behavior.
- [ ] Updated TABLEOFCONTENTS.md if new docs added.
- [ ] Ran `npm run check:all` — no failures; required final gate (`check:core` plus native coverage threshold
      enforcement).
- [ ] New production files use a recognized coverage classification and do not lower the immutable per-file floor; new
      tests enter the strict inventory; only paths in the hash-locked test-exception capture may retain a checked
      temporary-fragment or negative-fixture classification.
- [ ] Coverage/complexity policy edits preserve the hash-locked coverage snapshot and the digest-anchored historical
      complexity capture (portable, Git-free proof; `npm run complexity:regenerate-audit` is the maintainer-only
      Git-based regeneration audit); only the 12 frozen legacy coverage paths may retain their exact below-default
      values, and every active complexity value exactly matches its current finding.
- [ ] For releases, pushed only a locally created annotated tag; the tag workflow validates and publishes committed
      artifacts with the correct stable/prerelease classification without rerunning quality.
- [ ] Completed the profile-aware manual AvNav validation checklist before release:
      [documentation/guides/manual-avnav-validation.md](documentation/guides/manual-avnav-validation.md) (install/load,
      representative radial/linear/HTML widgets, day/night switch, route/AIS interactions, package upgrade/rollback).

---

## 9. Smell Prevention & Fail-Closed Rules

- Mandatory on every task: follow `documentation/conventions/coding-standards.md` and
  `documentation/conventions/smell-prevention.md` as binding rules.
- Required completion gate: `npm run check:all` (`check:core` + `test:coverage:check`).
- `check:core` includes `check:standard` (Prettier over maintained code/docs, agent skills, the lockfile, and active
  plans, checked against Prettier's real effective ignore resolution, plus ESLint, Stylelint, actionlint, and jscpd),
  `typecheck` (production/config `checkJs`, inventory-owned tests, and every maintained `tools/**/*.mjs` script),
  `package:check` (Ajv validation of the generic AvNav `plugin.json` base schema composed with the Dyninstruments
  layouts profile, plus bootstrap-derived registry dependency/resource closure and exact release staging contracts),
  `test:focus:check`, `check:complexity` (a portable, Git-free digest proof of the historical capture plus the
  complexity no-regression budget), `check:scaling` (validated non-negative integer operation-count contracts, never
  timing), and `docs:check` before the remaining project-specific gates.
- `npm run dependencies:audit` (networked `npm audit`) and `npm run complexity:regenerate-audit` (Git-based historical
  capture regeneration) are maintainer-only commands; neither runs inside `check:all`.
- `test:coverage:check` runs native Vitest/V8 global and critical-area thresholds.
- `test:split` runs the Vitest configured split: `unit-node`, `contract`, and `unit-dom` projects.
- Full smell catalog, enforcement matrix, and suppression syntax:
  [documentation/conventions/smell-prevention.md](documentation/conventions/smell-prevention.md).
- Fail-fast / keep-it-simple is mandatory. Details:
  [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md#fail-fast--keep-it-simple).

---

## 10. Code Hygiene Rules for AI Agents

### Before creating any helper function

1. Read `documentation/conventions/shared-helpers.md` to check whether a canonical helper already exists.
2. Search the codebase for the function name: `grep -rn "function <name>" --include="*.js"`.
3. If a canonical version exists, require and use it. Do not create a local copy.
4. If no canonical version exists but the helper is generic (not widget-specific), propose adding it to the appropriate
   canonical module.

### Forbidden patterns

- Never create `X.member || function(value) { ... }` fallback code. Internal module exports are contract-owned.
- Never create `X.memberA || X.memberB` cross-member fallbacks.
- Never re-normalize a value that was already normalized by the mapper (`rendererProps` are mapper-guaranteed).
- Never use `NaN` as a sentinel for absent optionals. Use `undefined`.
- Never wrap mapper-guaranteed string props in `String()` or `.trim()`.
- Never use `props && props.X` after `const p = props || {}`.

### Value boundary rules

- `applyFormatter` is the formatter boundary and handles `null`, `undefined`, `NaN`, and empty strings.
- Pair formatter output with `PlaceholderNormalize.normalize()` at the render boundary.
- Use `ValueMath.toOptionalFiniteNumber(raw)` for live sensor data from the AvNav store.
- Use `ValueMath.toFiniteNumber(raw)` only for config/default coercion where `null -> 0` is explicitly intended.

---

## 11. User-Facing README Sync Categories (Project Detail)

Update `README.md` in the same task whenever changes affect any of:

1. Theming or configurable theme/token inputs
2. Cluster/kind availability or user-selectable widget options
3. Bundled layouts or layout usage guidance
4. Installation steps, plugin packaging, or activation workflow
5. Configuration keys/defaults users set in AvNav
6. Requirements/platform support statements
7. Development setup or contributor workflow visible to users/contributors

---

## 12. Fail-Closed Fixture/Test Sync Rules

When changing user-facing theming or user-visible kind visuals, update the related fixtures/tests in the same task:

1. Theme token/input var/default changes: update `tests/css/theme-token-extremes.user.css` (and related `tests/css`
   fixtures when relevant) so manual/theming fixture coverage stays current.
2. New or visually changed kind (for example a new renderer variant such as `xteDisplayLinear`): update
   `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js` so showcase coverage
   includes the new visual behavior.
