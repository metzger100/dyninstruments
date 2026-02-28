# AGENTS.md - Project Standards & Workflow

This file is Codex-facing guidance for this repository.

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
- **Canvas 2D only** - All visual rendering via `renderCanvas(canvas, props)`
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
├── gauges/
│   ├── gauge-style-guide.md        # Proportions, colors, pointer, layout modes
│   └── gauge-shared-api.md         # Shared GaugeToolkit API documentation
├── shared/
│   ├── helpers.md                  # Helpers object (setupCanvas, resolveTextColor)
│   ├── css-theming.md              # CSS vars, day/night, font stack
│   └── theme-tokens.md             # ThemeResolver token schema + cache behavior
├── widgets/
│   ├── semicircle-gauges.md        # Speed/Depth/Temperature/Voltage shared 
│   ├── three-elements.md           # ThreeValueTextWidget numeric renderer
│   ├── wind-dial.md                # WindDialWidget full-circle wind compass
│   └── compass-gauge.md            # CompassGaugeWidget rotating compass card
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
✅ Identify: guides/add-new-gauge.md, gauges/gauge-style-guide.md
✅ Read only those 2 additional files
✅ Begin implementation
```

---

## 3. File Size Limits

- **Target: <=400 lines per JS file**
- Shared drawing/layout code → split reusable components in `shared/widget-kits/gauge/` (`GaugeAngleMath`, `GaugeTickMath`, `GaugeCanvasPrimitives`, `GaugeDialRenderer`)
- Gauge-specific code only in individual gauge component files
- Cluster configs live under `config/clusters/`
- If a legacy file exceeds 400 lines, keep new logic isolated and avoid increasing size further

---

## 4. File Map

- Feature and API lookups: [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- Non-negotiable project rules: [documentation/core-principles.md](documentation/core-principles.md)
- Root structural orientation map for AI sessions: [ARCHITECTURE.md](ARCHITECTURE.md)
- Coding patterns, naming, headers, and canonical examples: [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md)
- Documentation writing format and token budget: [documentation/conventions/documentation-format.md](documentation/conventions/documentation-format.md)
- Security and safety rules: `documentation/conventions/safety-guidelines.md` (planned, not yet implemented)
- Step-by-step implementation workflows: [documentation/guides/](documentation/guides/)
- Role definitions and task templates: `documentation/agentprompts/` (planned, not yet implemented)
- Multi-session active execution plans: `exec-plans/active/` (planned, not yet implemented)

---

## 5. Quality Checklist

- [ ] Completed mandatory preflight reads: TABLEOFCONTENTS.md + coding-standards.md + smell-prevention.md.
- [ ] Read only necessary additional documentation beyond mandatory preflight.
- [ ] Implementation complete.
- [ ] Updated relevant documentation.
- [ ] Updated TABLEOFCONTENTS.md if new docs added.
- [ ] Ran `npm run check:all` — no failures; required final gate (`check:core` plus coverage threshold enforcement).
- [ ] For cleanup sessions, ran `npm run gc:status` first and `npm run gc:update-baseline` last.

---

## 6. Known Issues

Known issues and tech debt: [TECH-DEBT.md](documentation/TECH-DEBT.md)

---

## 7. Smell Prevention & Fail-Closed Rules

- Mandatory on every task: follow `documentation/conventions/coding-standards.md` and `documentation/conventions/smell-prevention.md` as binding rules, not optional references.
- Required completion gate is `npm run check:all`.
- Smell rules and enforcement matrix are documented in [documentation/conventions/smell-prevention.md](documentation/conventions/smell-prevention.md).
- Duplicate detection is fail-closed via `tools/check-patterns.mjs` rules `duplicate-functions` (body/shape function clones) and `duplicate-block-clones` (long cross-file cloned blocks).
- Defaults must preserve explicit falsy values (`""`, `0`, `false`).
  - Never use truthy fallback for configured defaults (no `x.default || "...")`.
  - Use property-presence/nullish semantics instead.
- Cache-owning modules must expose invalidation API.
  - Required contract: expose invalidation methods and call them whenever state mutation changes cached values.
  - Theme token cache must be invalidated after runtime preset application.
- Pushes must be fail-closed.
  - Install tracked hooks once: `npm run hooks:install`
  - Verify hook setup: `npm run hooks:doctor`
  - Pre-push hook runs `npm run check:all` and blocks push on failures.
<!-- END SHARED_INSTRUCTIONS -->
