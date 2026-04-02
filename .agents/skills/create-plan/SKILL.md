---
name: create-plan
description: Creates multi-session execution plans for complex features in the dyninstruments repository and encodes the canonical plan structure with repository-verification safeguards.
---

# Skill: create-plan

## Description

Creates multi-session execution plans for complex features in the dyninstruments repository. Encodes the canonical plan structure derived from five completed plans (PLAN1–PLAN4) and one active plan (PLAN5). Includes automated baseline verification against the live repo to prevent the "rewritten after repository verification" failure mode.

## When to Use

When implementing a feature that involves:
- Multi-file changes with mapper/runtime/shared interactions
- A new cluster kind or new cluster
- Refactors touching boundaries, dependencies, or checks
- Any unclear requirement or high ambiguity

The developer must decide to use planning mode before prompting (per CONTRIBUTING.md §4).

## Instructions

### Step 0: Pre-Plan Interview (Recommended)

Before writing the plan, use the `grill-me-repo` skill to interview the user about every design decision. The interview should produce a structured decision log that feeds into this plan.

If the user declines the interview, proceed directly to Step 1 but flag any assumptions explicitly in the Verified Baseline.

### Step 1: Write the Plan Header

```markdown
# PLAN{N} — {Title}

## Status

Written after repository verification and concept review.

This plan includes [describe what the plan covers]. The coding agent may choose equivalent implementations for [describe flexibility areas] as long as the behavioral, structural, and documentation outcomes below are met. [List any plan-level contracts that must be followed as specified.]

---
```

Title should be: `{Feature Name} ({kind/cluster context})`

### Step 2: Write the Goal Section

```markdown
## Goal

{1-2 sentence goal statement.}

Expected outcomes after completion:

- {Outcome 1: What the widget/feature does}
- {Outcome 2: Layout modes and responsive behavior}
- {Outcome 3: Data contracts and formatting}
- {Outcome 4: Interaction model}
- {Outcome 5: Architectural compliance (UMD, shared layout/fit, lifecycle, fail-closed, smell-prevention, file-size)}
- {Outcome 6: Documentation and tests cover the new feature end-to-end}

---
```

### Step 3: Verify the Baseline Against the Live Repo

This is the critical step that prevents plan rewrites. For each assertion, **actually read the repo file** and confirm the fact.

```markdown
## Verified Baseline

The following points were rechecked against the repository before this plan:

1. {Reference implementation}: {What it does and how it's structured}
2. {Lifecycle owner}: {What it owns and its contract}
3. {Kind catalog}: {Current state, where new tuples must go}
4. {Renderer router}: {Current inventory, where new renderers must go}
5. {Mapper}: {Current branches, how new kinds are added}
6. {Shared utilities}: {Available helpers relevant to this feature}
7. {Config}: {Current store keys, editables, kind list}
8. {Theme/CSS}: {Relevant token contracts}
9. {Bridge/host actions}: {If interactive, what capabilities exist}
10. {Confirmed absence}: {No existing code for this feature exists}

---
```

**Verification checklist — read these files:**
- `cluster/rendering/ClusterKindCatalog.js` — current tuples
- `cluster/rendering/ClusterRendererRouter.js` — current renderer inventory
- `cluster/mappers/{Cluster}Mapper.js` — current branches
- `config/components/registry-widgets.js` — current widget registrations
- `config/components/registry-cluster.js` — current cluster registrations
- `config/clusters/{cluster}.js` — current store keys and editables
- `cluster/rendering/HtmlSurfaceController.js` — lifecycle contract (for HTML kinds)
- `shared/widget-kits/` — available shared utilities
- `runtime/TemporaryHostActionBridge.js` — if interactive, available host actions
- The reference implementation file for the chosen archetype

### Step 4: Write the Concept Specification (If Applicable)

For features with layout, interaction, or data-formatting complexity:

```markdown
## Concept Specification

This section is the authoritative layout/behavioral specification for the {feature}.

### Exposed Settings
{Each editable parameter: name, type, default, behavior, mode-specific effects}

### Layout Concept
{Mode resolution rules, geometry anchors, responsive behavior}

### Data Contracts
{Store keys, normalization rules, formatting rules}

### Interaction Model
{Click behavior per page, dispatch vs passive, handler names}
```

### Step 5: Write Architecture Notes

```markdown
## Architecture Notes

These notes anchor the plan. They are descriptive, not prescriptive.

### How {reference} serves as the template
{Describe the canonical flow and how this feature differs}

### {Technical concern 1}
{Description and consequence}

### {Technical concern 2}
{Description and consequence}

---
```

### Step 6: Write Hard Constraints

```markdown
## Hard Constraints

### Architecture
- Do not change the AvNav host registration strategy.
- Do not add ES modules or a build step.
- Follow the existing UMD component pattern.
- Do not add a second responsive scale profile; use `ResponsiveScaleProfile`.
- Do not duplicate shared utilities.
{Feature-specific architecture constraints}

### File organization
- {Renderer folder and file list with ownership descriptions}
- {ViewModel location}
- {Layout/fit owner locations}
- Each file must stay within the 400-line budget.

### Behavioral
- {Specific behavioral contracts that must be followed exactly}
- {Responsive rules}
- {Text sizing rules}
- {Formatting rules}
- {Interaction rules}

### Scope
- Do not change existing {reference implementation} code or tests.
- Do not change {lifecycle owner} internals.
- Do not perform source-code changes in the documentation phase.

---
```

### Step 7: Write the Implementation Order

Structure as phased steps with explicit dependencies:

```markdown
## Implementation Order

### Phase 1 — {Name}

**Intent:** {what this phase achieves}
**Dependencies:** {none / Phase N}

#### 1A. {Sub-step title}
{Detailed instructions: contract, file to create, code template}

#### 1B. {Test sub-step}
{What to test, coverage requirements}

#### 1C. {Registration sub-step}
{Where to register, code snippet}

### Phase 2 — {Name}
...

### Phase N — Documentation

**Intent:** create/update documentation without source-code changes.

#### NA. Create `documentation/widgets/{doc-name}.md`
{Content requirements following documentation-format.md}

#### NB. Update `documentation/TABLEOFCONTENTS.md`
{Entries to add}

#### NC. Update tracking files
{QUALITY.md, TECH-DEBT.md updates if applicable}

---
```

### Step 8: Write Acceptance Criteria

```markdown
## Acceptance Criteria

- [ ] {Feature works: specific testable behavior}
- [ ] {Layout modes: flat/normal/high transitions correct}
- [ ] {Interaction: dispatch/passive behavior per page}
- [ ] {Edge cases: empty data, disconnect, missing props}
- [ ] {Responsive: text sizing, compaction profile}
- [ ] {Day/night: theme token usage}
- [ ] All new files under 400 lines
- [ ] No smell-prevention violations
- [ ] Documentation complete and linked from TABLEOFCONTENTS.md
- [ ] `npm run check:all` passes (check:core + coverage + perf)
```

### Step 9: Save the Plan

Save to `exec-plans/active/PLAN{N}.md`.

After the plan is fully implemented and verified, move to `exec-plans/completed/PLAN{N}.md`.

### Anti-Patterns

- ❌ Writing a plan without reading the live repo (leads to "rewritten after verification")
- ❌ Making the plan prescriptive about code-level details when multiple solutions work
- ❌ Omitting the Verified Baseline section
- ❌ Omitting the Hard Constraints section
- ❌ Putting the Documentation Phase inside a coding phase
- ❌ Forgetting acceptance criteria
- ❌ Plans over 1500 lines (split into multiple phases/plans if needed)
