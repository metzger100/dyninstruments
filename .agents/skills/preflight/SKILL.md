---
name: preflight
description: Mandatory session bootstrap for every task in the dyninstruments repository. Reads required docs, routes to task-relevant docs, and produces a structured context summary. Must run before any planning, coding, review, or documentation work.
---

# Skill: preflight

## Description

Mandatory session bootstrap for every task in the dyninstruments repository. Reads required docs, routes to task-relevant docs, and produces a structured context summary. Must run before any planning, coding, review, or documentation work.

## When to Use

Every single session. No exceptions. Before you write a single line of code, before you open a plan, before you touch documentation.

## Instructions

### Step 1: Read the Three Mandatory Files

Read these three files in this order. Do not skip any of them.

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

### Step 2: Classify the Task

Determine which category the task falls into:

| Category | Signal |
|---|---|
| New semicircle gauge | "gauge", "speedometer", "radial", semicircle instrument |
| New linear gauge | "linear", "bar gauge", horizontal instrument |
| New full-circle dial | "compass", "wind dial", full-circle, 360° |
| New text renderer | "text widget", "numeric display", "three-value" |
| New HTML kind | "HTML widget", "native HTML", "interactive", "list", "route points" |
| New cluster | "new cluster", entirely new instrument group |
| Refactor / cleanup | "refactor", "cleanup", "extract", "consolidate", "tech debt" |
| Documentation | "docs", "document", "update docs", "sync docs" |
| Bug fix | "fix", "broken", "regression", "failing" |
| Plan creation | "plan", "design", "architecture plan", "exec-plan" |
| Garbage collection | "gc", "garbage collection", "audit", "baseline" |

### Step 3: Route to Task-Specific Docs

Based on the category, read ONLY the additional docs listed below. Never read all docs sequentially.

**New semicircle gauge:**
- `documentation/guides/add-new-gauge.md`
- `documentation/radial/gauge-style-guide.md`
- Reference: `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js`

**New linear gauge:**
- `documentation/guides/add-new-linear-gauge.md`
- `documentation/linear/linear-gauge-style-guide.md`
- Reference: `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js`

**New full-circle dial:**
- `documentation/guides/add-new-full-circle-dial.md`
- `documentation/radial/full-circle-dial-style-guide.md`
- Reference: `widgets/radial/CompassRadialWidget/CompassRadialWidget.js`

**New text renderer:**
- `documentation/guides/add-new-text-renderer.md`
- `documentation/widgets/three-elements.md`
- Reference: `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`

**New HTML kind:**
- `documentation/guides/add-new-html-kind.md`
- `documentation/shared/html-widget-visual-style-guide.md`
- `documentation/widgets/active-route.md`
- Reference: `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`

**New cluster:**
- `documentation/guides/add-new-cluster.md`
- `documentation/architecture/cluster-widget-system.md`
- `documentation/architecture/component-system.md`

**Refactor / cleanup:**
- `documentation/guides/garbage-collection.md`
- `documentation/TECH-DEBT.md`
- `documentation/QUALITY.md`

**Documentation:**
- `documentation/guides/documentation-maintenance.md`
- `documentation/conventions/documentation-format.md`

**Bug fix:**
- `documentation/architecture/cluster-widget-system.md` (if cluster-related)
- The specific widget/module documentation referenced in the bug's file header

**Plan creation:**
- `documentation/core-principles.md`
- `ARCHITECTURE.md`
- The relevant guide for the widget archetype
- Existing plans in `exec-plans/completed/` (read structure only, not full content)

**Garbage collection:**
- `documentation/guides/garbage-collection.md`
- `documentation/QUALITY.md`
- `documentation/TECH-DEBT.md`

### Step 4: Produce Context Summary

After reading, produce a short structured summary for yourself (do not output this to the user unless asked):

```
TASK: [one-line description]
CATEGORY: [from Step 2]
ARCHETYPE: [widget archetype if applicable, else "N/A"]
SHARED ENGINE: [engine name if applicable, else "N/A"]
REFERENCE IMPL: [file path if applicable, else "N/A"]
KEY CONSTRAINTS:
- No bundler, no ES modules, UMD/IIFE only
- Host path is renderHtml-only
- File size <=400 lines
- [task-specific constraints from docs read]
RELEVANT SHARED UTILITIES: [list from coding-standards.md §Shared Utilities]
ACTIVE SMELL RULES: [list rules most likely to trigger for this task type]
COMPLETION GATE: npm run check:all
```

### Step 5: Verify Precedence

If any guidance conflicts during the task, apply this precedence:

1. `documentation/core-principles.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. Task-specific documentation

### Anti-Patterns

- ❌ Reading all documentation files sequentially
- ❌ Re-reading the same docs repeatedly within a session
- ❌ Starting implementation before completing preflight
- ❌ Skipping smell-prevention.md because "it's just a cleanup task"
- ❌ Reading verbose examples when not implementing a matching pattern
