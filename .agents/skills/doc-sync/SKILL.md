---
name: doc-sync
description:
  Ensures documentation stays synchronized with code changes, applies the touchpoint matrix, and enforces the
  documentation format.
---

# Skill: doc-sync

## Description

Ensures documentation stays synchronized with code changes. Applies the touchpoint matrix from
`documentation-maintenance.md` and enforces the documentation format from `documentation-format.md`.

## When to Use

After every code change, before running the completion gate. Core principle #6: "Documentation must be updated in the
same task as code/architecture changes."

## Instructions

### Step 1: Identify Changed Files

List all files you have created or modified in this session.

### Step 2: Apply the Touchpoint Matrix

For each changed file, determine the minimum documentation updates required. The categories below are examples — adapt
them to this repository's actual module/documentation layout, then keep the matrix itself up to date as new categories
emerge.

| Change Type                                                                                   | Minimum Docs to Update                                                                        |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| New/changed core module or its registration entry point                                       | The relevant architecture doc, plus the affected module's own doc                             |
| New instance of a repeated/pluggable pattern (e.g. a new plugin, driver, or renderer variant) | The "how to add a new X" guide, the architecture doc for that subsystem, relevant module docs |
| New rendering/formatting strategy for an existing subsystem                                   | The "how to add a new X" guide, the module doc, or a dedicated new module doc                 |
| Changes in startup/registration/lifecycle flow                                                | The platform integration doc, the architecture doc for the component system                   |
| Changes in shared helper/formatter contracts                                                  | The shared helpers doc                                                                        |
| Styling/theming changes                                                                       | The CSS/theming doc                                                                           |
| Test setup or quality rule changes (tools, config, hooks)                                     | The documentation-maintenance guide, `README.md`, `AGENTS.md`, `CLAUDE.md`                    |
| New documentation file                                                                        | The table of contents doc                                                                     |
| New/changed transformation or mapping logic between data representations                      | Relevant subsystem architecture doc section                                                   |
| New/changed shared utility                                                                    | The coding-standards doc, "Shared Utilities" section                                          |
| New/changed theme tokens                                                                      | The theme-tokens doc                                                                          |
| New/changed user-editable parameters                                                          | The editable-parameters doc                                                                   |
| New/changed configuration entry for a pluggable component                                     | Relevant doc under the documentation root                                                     |

### Step 3: Update Each Affected Doc

For each doc identified in Step 2:

1. Read the current doc
2. Update sections that describe the changed behavior
3. Verify the doc still follows the mandatory format (see Step 4)
4. Ensure file paths, config keys, and API signatures are current

### Step 4: Enforce Documentation Format

Every documentation file MUST follow this structure:

```markdown
# [Title]

**Status:** [✅ Implemented / ⏳ In Progress / ❌ Not Started] [Brief]

## Overview

[1-2 sentences max]

## Key Details

- Compact bullet lists
- API signatures
- Data types and values
- Configuration keys

## API/Interfaces

[Tables or compact code blocks]

## Related

[links to other docs]
```

**Forbidden content — do NOT include:**

- Verbose prose explanations
- "Why?" sections (keep rationale brief and implementation-tied)
- Large ASCII diagrams
- Excessive examples (max 1-2)
- "Future Enhancements" sections
- Empty sections
- Decorative formatting

**Required content — do NOT omit:**

- API function signatures with parameters
- Props/config keys with types and defaults
- File paths and code locations
- Color values, proportions, constants (where relevant)
- Critical implementation details

### Step 5: Update the Table of Contents

If you created a new documentation file:

1. Open the repository's table-of-contents doc
2. Add a question→link entry in the appropriate section
3. Follow the existing format: `**"How do I ...?"** → [doc-name.md](path/doc-name.md)`

**Reachability rule:** Every new doc must be linked from at least one other doc that is itself reachable from
`AGENTS.md`. The easiest way is adding an entry to the table-of-contents doc.

### Step 6: Update Root Agent Instructions (When Applicable)

**AGENTS.md / CLAUDE.md** — Update when:

- Architecture guidance changes
- New file map entries are needed
- Keep `AGENTS.md` canonical. Keep `CLAUDE.md` as a short pointer unless genuinely tool-specific notes are required.

### Step 7: Validate

Run the documentation validation checks:

```bash
npm run check:doclinks     # Link, anchor, and doc-comment target validation
npm run check:docformat    # Required doc section/format enforcement
npm run check:reachability # Reachability from AGENTS.md or CLAUDE.md
```

Or run everything at once:

```bash
npm run check:all
```

Non-zero exit means docs are not consistent. Fix all failures before proceeding.

### Anti-Patterns

- ❌ Changing code without updating linked docs
- ❌ Creating a new doc without adding it to the table of contents
- ❌ Writing verbose "Why?" sections or "Future Enhancements"
- ❌ Using more than 1-2 examples per concept
- ❌ Leaving empty sections in docs
- ❌ Duplicating the full AGENTS.md rule catalog into CLAUDE.md
