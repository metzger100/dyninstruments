---
name: grill-me-repo
description: Interviews the user about a planned dyninstruments feature, grounded in the actual repository, and resolves design branches one by one with recommended answers.
---

# Skill: grill-me-repo

## Description

Interview the user relentlessly about every aspect of a planned feature, grounded in the actual dyninstruments repository. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide a recommended answer based on codebase exploration. Ask questions one at a time. If a question can be answered by exploring the codebase, explore the codebase instead of asking.

## When to Use

Before creating an execution plan (`create-plan` skill) for any medium-to-complex feature. Also useful when requirements are ambiguous or when the user says "I want to add X" without specifying how.

## Instructions

### Interview Protocol

1. Ask ONE question at a time.
2. For each question, provide YOUR recommended answer based on codebase analysis.
3. Wait for the user to confirm, modify, or reject before proceeding.
4. If a question can be answered by reading the codebase, read the code instead of asking.
5. Track decisions in a structured log as you go.

### Decision Tree: Walk These Branches In Order

#### Branch 1: Archetype Selection

**Explore first:** Read `documentation/conventions/coding-standards.md` §Widget Archetypes.

Questions to resolve:
- What type of visual output does this produce? (gauge, dial, text display, interactive HTML list, etc.)
- Does it match an existing archetype? (semicircle gauge, linear gauge, full-circle dial, text renderer, HTML kind)
- If not, is a new engine justified? (Read existing engines to check if any can be extended)

**Codebase check:** Read the archetype table and reference implementations. Recommend the closest match.

#### Branch 2: Cluster Placement

**Explore first:** Read `config/clusters/` to see existing clusters and their kinds.

Questions to resolve:
- Which cluster does this belong to? (speed, environment, nav, vessel, wind, courseHeading, anchor, map — or new?)
- If existing cluster: what kinds are already there? Are there store keys that can be reused?
- If new cluster: what is the cluster name? What widget name (`dyni_{Cluster}_Instruments`)?

**Codebase check:** Read the relevant `config/clusters/{cluster}.js` and `cluster/mappers/{Cluster}Mapper.js`.

#### Branch 3: Data Model

**Explore first:** Read relevant store key patterns in existing cluster configs.

Questions to resolve:
- What AvNav store keys provide the raw data?
- What normalization is needed? (numeric coercion, string trimming, null handling)
- Is a ViewModel needed? (Multiple renderers sharing domain normalization → yes)
- What is the disconnect state? (no data, stale data, invalid data)

**Codebase check:** Read `cluster/viewmodels/` for existing ViewModel patterns.

#### Branch 4: Surface and Rendering

**Explore first:** Read `cluster/rendering/ClusterKindCatalog.js` for existing surface assignments.

Questions to resolve:
- Surface type: `canvas-dom` or `html`?
- If canvas: does `SemicircleRadialEngine` / `LinearGaugeEngine` / `FullCircleRadialEngine` / `TextLayoutEngine` handle the rendering? Which callbacks does the widget override?
- If HTML: what is the layout/fit ownership split? Does the widget need a dedicated Layout module? A dedicated Fit module?

#### Branch 5: Layout Modes

Questions to resolve:
- How many layout modes? (typically: high, normal, flat — derived from aspect ratio thresholds)
- What ratio thresholds? (check existing clusters for precedent)
- Any special container behavior? (e.g., `.widgetContainer.vertical` forcing a specific mode)
- Does the widget compute intrinsic height?

**Codebase check:** Read the reference implementation's layout mode logic.

#### Branch 6: Editable Parameters

**Explore first:** Read `documentation/avnav-api/editable-parameters.md` for available types.

Questions to resolve:
- What user-configurable settings are needed?
- Types: `STRING`, `FLOAT`, `BOOLEAN`, `SELECT`, `KEY` (SignalK key selector)
- Default values for each
- Conditions: scoped to `{ kind: "{kindName}" }` or `[{ kind: "a" }, { kind: "b" }]`?
- Are there per-kind caption/unit params? (follow `makePerKindTextParams` pattern or standalone?)

#### Branch 7: Formatting

Questions to resolve:
- Which AvNav formatters are used? (`formatSpeed`, `formatDistance`, `formatDirection`, `formatLonLats`, etc.)
- What formatter parameters are needed?
- Does the mapper pass formatter keys through, or does the widget hard-code them?

**Codebase check:** Read `documentation/avnav-api/formatters.md` and `documentation/avnav-api/core-formatter-catalog.md`.

#### Branch 8: Interaction Model (HTML Kinds Only)

**Explore first:** Read `runtime/TemporaryHostActionBridge.js` for available host actions and capabilities.

Questions to resolve:
- Is this widget interactive or passive?
- If interactive: what host actions are dispatched? (e.g., `routePoints.activate`, `routeEditor.openActiveRoute`)
- Page-specific behavior: which pages allow interaction? Which are passive?
- How is the capability gate structured?
- Does the widget need `catchAll` for click isolation?
- What named handlers are needed?

**Codebase check:** Read `documentation/avnav-api/interactive-widgets.md` and the `activeRoute` pattern in `ActiveRouteTextHtmlWidget.js`.

#### Branch 9: Theming and Day/Night

Questions to resolve:
- Does the widget use theme tokens? Which ones?
- Does it need CSS variables beyond what `plugin.css` already provides?
- Is widget-local CSS needed? What does it own vs. what does the shared shell own?

#### Branch 10: File Organization

Questions to resolve:
- What files need to be created? (List each with its ownership role)
- Can any existing modules be reused without modification?
- Will any file risk exceeding 400 lines? (Plan the split early)

### Output: Decision Log

After completing all branches, produce a structured decision log:

```markdown
## Design Decision Log

### Archetype
- Match: {archetype}
- Shared engine: {engine}
- Reference: {file path}

### Cluster
- Cluster: {name}
- Kind: {kindName}
- New cluster: {yes/no}

### Data Model
- Store keys: {list}
- ViewModel: {yes/no, name}
- Disconnect behavior: {description}

### Surface
- Type: {canvas-dom / html}
- Layout owner: {module}
- Fit owner: {module}

### Layout Modes
- Modes: {high, normal, flat}
- Ratio thresholds: {normal: X, flat: Y}
- Special: {vertical container, intrinsic height, etc.}

### Editable Parameters
- {name}: {type}, default {value}, condition {condition}

### Formatting
- Formatters: {list with parameters}

### Interaction
- Model: {passive / page-aware dispatch}
- Host actions: {list}
- Named handlers: {list}
- Capability gate: {description}

### Files to Create
- {path}: {ownership role}

### Open Questions
- {Any unresolved decisions}
```

This log feeds directly into the `create-plan` skill's Verified Baseline and Implementation Order sections.
