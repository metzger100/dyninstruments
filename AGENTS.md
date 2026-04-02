# AGENTS.md - Project Standards & Workflow
This file is guidance for agents working in this repository.

<!-- BEGIN SHARED_INSTRUCTIONS -->
**Critical:** AGENTS.md is a routing map. Use it to find focused docs, not to store full implementation details.

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

## 1. Project Constraints (AvNav Plugin Environment)

- **No bundler, no runtime build step** - Raw JS loaded via `<script>` tags at runtime
- **Dev-only npm tooling is allowed** - used for tests and quality checks; not part of plugin runtime loading
- **UMD component pattern** - All components register on `window.DyniComponents.{globalKey}`
- **avnav.api** - Only external dependency. Plugin API provided by AvNav host app
- **AVNAV_BASE_URL** - Global string set by AvNav, used to construct module URLs
- **Host path is renderHtml-only** - Cluster widgets register `renderHtml` on AvNav host
- **Internal dual-surface model** - `surface: "html"` for native HTML kinds, `surface: "canvas-dom"` for internal canvas kinds
- **Canvas 2D remains internal** - Existing gauges/text canvas renderers run through `CanvasDomSurfaceAdapter` and `renderCanvas(canvas, props)` callbacks
- **No ES modules, no import/export** - Must use IIFE or UMD wrappers
- **HiDPI** - `Helpers.setupCanvas()` handles devicePixelRatio scaling
- **Plugin runtime is browser-only** - No server-side runtime code
- **Testing stack available** - Vitest + jsdom for regression and coverage checks

---

## 2. Token-Efficient Documentation System

### Documentation Structure

```
documentation/
├── TABLEOFCONTENTS.md              # Navigation index (read THIS FIRST)
├── core-principles.md              # Non-negotiable project rules
├── avnav-api/
│   ├── plugin-lifecycle.md         # registerWidget, render cycle, props
│   ├── editable-parameters.md      # Types, conditions, defaults
│   └── formatters.md               # formatSpeed, formatDistance, etc.
├── architecture/
│   ├── component-system.md            # UMD loader, dependencies, config/components.js
│   └── cluster-widget-system.md       # ClusterWidget, kind→renderer routing
├── radial/
│   ├── gauge-style-guide.md        # Proportions, colors, pointer, layout modes
│   └── gauge-shared-api.md         # Shared RadialToolkit API documentation
├── shared/
│   ├── helpers.md                  # Helpers object (setupCanvas, resolveTextColor)
│   ├── css-theming.md              # CSS vars, day/night, font stack
│   └── theme-tokens.md             # ThemeResolver token schema + cache behavior
├── widgets/
│   ├── semicircle-gauges.md        # Speed/Depth/Temperature/Voltage shared 
│   ├── three-elements.md           # ThreeValueTextWidget numeric renderer
│   ├── wind-dial.md                # WindRadialWidget full-circle wind compass
│   └── compass-gauge.md            # CompassRadialWidget rotating compass card
└── guides/
    ├── add-new-gauge.md            # Step-by-step: create a new gauge
    ├── add-new-cluster.md          # Step-by-step: create a new cluster widget
    └── documentation-maintenance.md # Docs sync + validation workflow
```

### RULE: Always Start with TABLEOFCONTENTS.md

1. **Read `documentation/TABLEOFCONTENTS.md` FIRST**
2. **Read `documentation/conventions/coding-standards.md` and `documentation/conventions/smell-prevention.md` for every task**
3. Identify 1-3 additional relevant files for your task
4. Read ONLY those additional files
5. **Never read all files sequentially** (wastes tokens)

### Example Workflow

**Bad (Token wasteful):**
```
Task: Add new BarometerGauge
❌ Read all documentation files and large source areas sequentially.
```

**Good (Token efficient):**
```
Task: Add new BarometerGauge
✅ Read TABLEOFCONTENTS.md
✅ Read conventions/coding-standards.md and conventions/smell-prevention.md
✅ Identify: guides/add-new-gauge.md, radial/gauge-style-guide.md
✅ Read only those 2 additional files
✅ Begin implementation
```

---

## 4. File Map

- Feature and API lookups: [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- Non-negotiable project rules: [documentation/core-principles.md](documentation/core-principles.md)
- Root structural orientation map: [ARCHITECTURE.md](ARCHITECTURE.md)
- HTML renderer lifecycle patterns: [documentation/architecture/html-renderer-lifecycle.md](documentation/architecture/html-renderer-lifecycle.md)
- Step-by-step implementation workflows: [documentation/guides/](documentation/guides/)
- Multi-session active execution plans: [exec-plans/active/](exec-plans/active/)

---

## 5. Quality Checklist

- [ ] Completed mandatory preflight reads: TABLEOFCONTENTS.md + coding-standards.md + smell-prevention.md.
- [ ] Read only necessary additional documentation beyond mandatory preflight.
- [ ] Implementation complete.
- [ ] Updated relevant documentation.
- [ ] Updated TABLEOFCONTENTS.md if new docs added.
- [ ] Ran `npm run check:all` — no failures; required final gate (`check:core` plus coverage threshold enforcement plus `perf:check`).
- [ ] For cleanup sessions, ran `npm run gc:status` first and `npm run gc:update-baseline` last.

---

## 6. Known Issues

Known issues and tech debt: [TECH-DEBT.md](documentation/TECH-DEBT.md)

---

## 7. Smell Prevention & Fail-Closed Rules

- Mandatory on every task: follow `documentation/conventions/coding-standards.md` and `documentation/conventions/smell-prevention.md` as binding rules.
- Required completion gate: `npm run check:all` (`check:core` + `test:coverage:check` + `perf:check`).
- Full smell catalog, enforcement matrix, and suppression syntax: [documentation/conventions/smell-prevention.md](documentation/conventions/smell-prevention.md).
- Fail-fast / keep-it-simple is mandatory. Details: [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md#fail-fast-keep-it-simple).
<!-- END SHARED_INSTRUCTIONS -->
