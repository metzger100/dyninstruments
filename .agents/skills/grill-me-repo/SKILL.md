---
name: grill-me-repo
description:
  Interviews the user about a planned feature, grounded in the actual repository, and resolves design branches one by
  one with recommended answers.
---

# Skill: grill-me-repo

## Description

Interview the user relentlessly about every aspect of a planned feature, grounded in the actual repository. Walk down
each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide a
recommended answer based on codebase exploration. Ask questions one at a time. If a question can be answered by
exploring the codebase, explore the codebase instead of asking.

## When to Use

Before creating an execution plan (`create-plan` skill) for any medium-to-complex feature. Also useful when requirements
are ambiguous or when the user says "I want to add X" without specifying how.

## Instructions

### Interview Protocol

1. Ask ONE question at a time.
2. For each question, provide YOUR recommended answer based on codebase analysis.
3. Wait for the user to confirm, modify, or reject before proceeding.
4. If a question can be answered by reading the codebase, read the code instead of asking.
5. Track decisions in a structured log as you go.

### Decision Tree: Walk These Branches In Order

#### Branch 1: Archetype / Category Selection

**Explore first:** Read this repository's coding standards or conventions documentation for any documented catalog of
component archetypes, kinds, or categories.

Questions to resolve:

- What kind of output or behavior does this feature produce? (Identify the closest categories this repository already
  distinguishes between — e.g. different rendering styles, different processing modes, different output formats.)
- Does it match an existing archetype/category? Find and read at least one existing implementation of that archetype to
  confirm the match.
- If not, is a brand-new archetype/category justified? (Read existing implementations first to check whether one can be
  extended or generalized instead of creating a new one.)

**Codebase check:** Read any archetype/category catalog and at least one reference implementation. Recommend the closest
match.

#### Branch 2: Grouping / Placement

**Explore first:** Read the directories or config that define how this repository groups related components together
(modules, packages, feature groups, categories, sections — whatever the repository's own organizing unit is).

Questions to resolve:

- Which existing group does this feature belong to? Enumerate the groups that already exist and ask the user to pick
  one, or confirm none fit.
- If it belongs to an existing group: what related items already live there? Is there existing shared state,
  configuration, or data that can be reused?
- If a new group is needed: ask the user to identify the naming convention this repository uses for such groups and for
  the top-level items within them, by reading an existing example end-to-end.

**Codebase check:** Read the relevant grouping/config file and any file that maps or wires that group together.

#### Branch 3: Data Model

**Explore first:** Read how existing, similar features source their input data in this repository.

Questions to resolve:

- What is the underlying data source for this feature? (Ask the user to identify the equivalent concept in this project
  — e.g. a store, a service call, a config value, an event stream — by pointing at how a similar existing feature
  sources its data.)
- What normalization is needed? (numeric coercion, string trimming, null/undefined handling)
- Is a shared intermediate model needed? (Multiple consumers sharing the same normalized data → yes)
- What is the "no data" / stale / invalid state, and how should it be represented?

**Codebase check:** Read the directory or module where existing shared/normalized data models live, if one exists.

#### Branch 4: Output Surface and Rendering

**Explore first:** Read whatever file or config maps features/components to their output surface or rendering mechanism
in this repository.

Questions to resolve:

- What output surface does this feature use? (Ask the user to name the surfaces/mechanisms this repository already
  supports — e.g. distinct rendering backends, distinct output channels — and pick the closest fit.)
- If it reuses an existing rendering mechanism: which shared implementation handles it? Which extension points (hooks,
  callbacks, overrides) does this feature need to use?
- If it needs a new mechanism: what is the ownership split between the pieces involved (e.g. layout vs. sizing vs.
  drawing)? Does it need a dedicated module for each concern, following this repository's existing pattern for that
  split?

#### Branch 5: Layout / Presentation Modes

Questions to resolve:

- How many presentation modes does this feature need? (Ask the user to identify how many modes comparable existing
  features support, and what triggers switching between them — e.g. size, orientation, aspect ratio, context.)
- What are the thresholds or conditions that trigger each mode? (check existing similar features for precedent)
- Any special container or context behavior that forces a particular mode?
- Does the feature need to compute its own intrinsic size, or is that handled elsewhere?

**Codebase check:** Read a reference implementation's mode-switching logic end-to-end.

#### Branch 6: Configurable / User-Facing Parameters

**Explore first:** Read this repository's documentation or code for the mechanism it uses to expose user-configurable
settings (a schema, a params system, a settings file — whatever this project's equivalent is).

Questions to resolve:

- What user-configurable settings are needed for this feature?
- What types does the configuration mechanism support here, and which type fits each setting? (string, number, boolean,
  enum/select, reference-to-another-value, etc. — ask the user to confirm against what this repository's mechanism
  actually offers.)
- What are the sensible default values for each?
- Are there conditions under which a setting should or shouldn't apply? (e.g. only for a specific category/kind, or only
  in combination with another setting)
- Are there settings that repeat across multiple similar instances (e.g. a caption, a label, a unit)? Does this
  repository have an existing pattern for factoring those out, or should this be standalone?

#### Branch 7: Formatting / Presentation of Values

Questions to resolve:

- Ask the user to identify which existing formatting/presentation utilities in this repository apply to this feature's
  output values (e.g. number formatting, date/time formatting, unit conversion, string truncation).
- What formatter parameters or options are needed?
- Should the formatting choice be configurable/passed through by the caller, or hard-coded by the feature itself?

**Codebase check:** Read this repository's documentation or catalog of available formatting utilities, if one exists.

#### Branch 8: Interaction Model (For Interactive Kinds Only)

**Explore first:** Read whatever module in this repository centralizes dispatching of user-triggered actions or side
effects, if one exists.

Questions to resolve:

- Is this feature interactive or purely passive/display-only?
- If interactive: what actions or side effects does it trigger, and through what existing mechanism? Ask the user to
  name the equivalent action-dispatch pattern this repository already uses elsewhere.
- Context-specific behavior: are there contexts/screens/modes where interaction should be allowed vs. suppressed?
- How should permission/capability gating be structured, if this repository has a pattern for that?
- Does the feature need to isolate its own click/interaction handling from a surrounding container?
- What named handlers or callbacks are needed?

**Codebase check:** Read this repository's documentation on interactive components, and find one existing interactive
component to use as a reference pattern.

#### Branch 9: Theming and Visual Modes

Questions to resolve:

- Does the feature need to respond to this repository's theming mechanism (e.g. light/dark, day/night, or other visual
  modes)? Which tokens or variables does it need?
- Does it need new shared styling primitives, or does the existing shared styling already cover it?
- Is component-local styling needed? What should the feature own vs. what should a shared/parent layer own?

#### Branch 10: File Organization

Questions to resolve:

- What files need to be created? (List each with its ownership role.)
- Can any existing modules be reused without modification?
- Will any file risk exceeding this repository's size/complexity limits, if it has documented ones? (Plan the split
  early if so.)

### Output: Decision Log

After completing all branches, produce a structured decision log:

```markdown
## Design Decision Log

### Archetype / Category

- Match: {archetype/category}
- Shared implementation reused: {module/engine}
- Reference: {file path}

### Grouping

- Group: {name}
- Item/kind: {name}
- New group: {yes/no}

### Data Model

- Data sources: {list}
- Shared model: {yes/no, name}
- No-data / stale behavior: {description}

### Output Surface

- Type: {surface/mechanism}
- Layout owner: {module}
- Sizing owner: {module}

### Layout / Presentation Modes

- Modes: {list}
- Thresholds/conditions: {list}
- Special cases: {container behavior, intrinsic sizing, etc.}

### Configurable Parameters

- {name}: {type}, default {value}, condition {condition}

### Formatting

- Formatters/utilities used: {list with parameters}

### Interaction

- Model: {passive / context-aware dispatch}
- Actions/side effects: {list}
- Named handlers: {list}
- Permission/capability gate: {description}

### Files to Create

- {path}: {ownership role}

### Open Questions

- {Any unresolved decisions}
```

This log feeds directly into the `create-plan` skill's Verified Baseline and Implementation Order sections.
