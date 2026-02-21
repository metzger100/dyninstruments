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
    └── documentation-maintenance.md # Docs sync + validation workflow
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
❌ Read all documentation files and large source areas sequentially.
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

- [ ] Read TABLEOFCONTENTS.md to find relevant docs.
- [ ] Read only necessary documentation.
- [ ] Implementation complete.
- [ ] Updated relevant documentation.
- [ ] Updated TABLEOFCONTENTS.md if new docs added.
- [ ] Ran `npm run check:all` — no failures; strict `check-patterns` passed, and warn-mode findings reviewed.
- [ ] For behavior changes: ran `npm test`.

---

## 6. Known Issues

Known issues and tech debt: [TECH-DEBT.md](documentation/TECH-DEBT.md)
<!-- END SHARED_INSTRUCTIONS -->
