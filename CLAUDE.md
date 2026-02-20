# CLAUDE.md - Project Standards & Workflow

This file is Claude Code-facing guidance for this repository.

<!-- BEGIN SHARED_INSTRUCTIONS -->
**Critical:** AGENTS.md is a routing map. Use it to find focused docs, not to store full implementation details.

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
├── README.md                       # Project overview
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
│   └── css-theming.md              # CSS vars, day/night, font stack
├── widgets/
│   ├── semicircle-gauges.md        # Speed/Depth/Temperature/Voltage shared 
│   ├── three-elements.md           # ThreeValueTextWidget numeric renderer
│   ├── wind-dial.md                # WindDialWidget full-circle wind compass
│   └── compass-gauge.md            # CompassGaugeWidget rotating compass card
└── guides/
    ├── add-new-gauge.md            # Step-by-step: create a new gauge
    ├── add-new-cluster.md          # Step-by-step: create a new cluster widget
    └── testing-regression.md       # Test and coverage workflow
```

### RULE: Always Start with TABLEOFCONTENTS.md

1. **Read `documentation/TABLEOFCONTENTS.md` FIRST**
2. Identify 1-3 relevant files for your task
3. Read ONLY those files
4. **Never read all files sequentially** (wastes tokens)

### Example Workflow

**Bad (Token wasteful):**
```
Task: Add new BarometerGauge
❌ Read all documentation files → all gauge source files → ...Navigation Rules

1. Read [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md) first.
2. Identify 1-3 relevant docs before deep code reads.
3. Read only those docs; do not read all docs sequentially.
4. Token budget target: 20-30% context gathering, 70-80% implementation.
5. Keep docs synchronized with code changes in the same task.
6. For doc or architecture changes, run `node tools/check-docs.mjs`.
7. For behavior/runtime changes, run `npm test` and `npm run test:coverage:check`.

Routing flow:
- `TABLEOFCONTENTS.md` is the lookup index for feature/API questions.
- `documentation/conventions/coding-standards.md` is the source of code structure rules.
- `documentation/conventions/documentation-format.md` is the source of doc writing rules.
- Gauge proportions/layout formulas stay in `documentation/gauges/gauge-style-guide.md`.
- For planned-but-missing paths, use plain-text pointers instead of markdown links.
- Replace planned pointers with links only after the target path exists.

```

**Good (Token efficient):**
```
Task: Add new BarometerGauge
✅ Read TABLEOFCONTENTS.md
✅ Identify: guides/add-new-gauge.md, gauges/gauge-style-guide.md
✅ Read only those 2 files
✅ Begin implementation
```

---

## 3. File Size Limits

- **Target: <=300 lines per JS file**
- Shared drawing/layout code → split reusable components in `shared/widget-kits/gauge/` (`GaugeAngleMath`, `GaugeTickMath`, `GaugeCanvasPrimitives`, `GaugeDialRenderer`)
- Gauge-specific code only in individual gauge component files
- Cluster configs live under `config/clusters/`
- If a legacy file exceeds 300 lines, keep new logic isolated and avoid increasing size further

---

## 3. File Map

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

## 4. Quality Checklist

- [ ] Started with TABLEOFCONTENTS and read only required docs.
- [ ] Followed `documentation/conventions/coding-standards.md`.
- [ ] Kept new/modified JS files at or below 300 lines, or isolated new logic from legacy oversized files.
- [ ] Added/updated JS header blocks with `Documentation:` path.
- [ ] Reused shared utilities (`shared/widget-kits/`) instead of duplicating widget-local helpers.
- [ ] Updated docs immediately after behavior or architecture changes.
- [ ] Updated `documentation/TABLEOFCONTENTS.md` for new or moved docs.
- [ ] Updated `documentation/README.md` when top-level documentation mapping changed.
- [ ] Ran `node tools/check-docs.mjs` and resolved failures.
- [ ] Ran `npm run check:headers` and resolved failures.
- [ ] Ran `npm run check:filesize` and resolved file size violations.
- [ ] Ran `npm run check:naming` and resolved naming registration violations.
- [ ] Ran `npm run check:patterns -- --warn` and reviewed pattern drift findings.
- [ ] Ran `npm test` for behavior/runtime changes.
- [ ] Ran `npm run test:coverage:check` for core logic changes.
- [ ] Verified AGENTS and CLAUDE shared sections are synced (`npm run ai:check`).
- [ ] Kept gauge formulas/layout guidance only in `documentation/gauges/gauge-style-guide.md`.
- [ ] Preserved existing information by moving details to mapped docs instead of deleting content.

---

## 5. Known Issues

See [TECH-DEBT.md](TECH-DEBT.md) for current technical debt and documentation drift notes.
Keep AGENTS/CLAUDE compact by updating debt items in `TECH-DEBT.md`, not in this routing map.
<!-- END SHARED_INSTRUCTIONS -->
