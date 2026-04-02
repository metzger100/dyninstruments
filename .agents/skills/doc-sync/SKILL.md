---
name: doc-sync
description: Ensures documentation stays synchronized with code changes, applies the touchpoint matrix, enforces the documentation format, and updates tracking files.
---

# Skill: doc-sync

## Description

Ensures documentation stays synchronized with code changes. Applies the touchpoint matrix from `documentation-maintenance.md`, enforces the documentation format from `documentation-format.md`, and updates tracking files (`TABLEOFCONTENTS.md`, `QUALITY.md`, `TECH-DEBT.md`).

## When to Use

After every code change, before running the completion gate. Core principle #6: "Documentation must be updated in the same task as code/architecture changes."

## Instructions

### Step 1: Identify Changed Files

List all files you have created or modified in this session.

### Step 2: Apply the Touchpoint Matrix

For each changed file, determine the minimum documentation updates required:

| Change Type | Minimum Docs to Update |
|---|---|
| New/changed module in `config/components/registry-*.js` or `config/components.js` | `documentation/architecture/component-system.md`, affected module doc in `documentation/widgets/` |
| New cluster or new cluster kind | `documentation/guides/add-new-cluster.md`, `documentation/architecture/cluster-widget-system.md`, relevant module docs |
| New gauge renderer | `documentation/guides/add-new-gauge.md`, `documentation/widgets/semicircle-gauges.md` or dedicated module doc |
| Changes in registration/lifecycle flow (`runtime/init.js`, `runtime/widget-registrar.js`) | `documentation/avnav-api/plugin-lifecycle.md`, `documentation/architecture/component-system.md` |
| Changes in helper API (`runtime/helpers.js`) | `documentation/shared/helpers.md` |
| CSS/theming changes (`plugin.css`) | `documentation/shared/css-theming.md` |
| Test setup or quality rule changes (tools, config, hooks) | `documentation/guides/documentation-maintenance.md`, `documentation/guides/garbage-collection.md`, `README.md`, `AGENTS.md`, `CLAUDE.md` |
| New documentation file | `documentation/TABLEOFCONTENTS.md` |
| New/changed mapper | Relevant cluster-widget-system.md section |
| New/changed shared utility | `documentation/conventions/coding-standards.md` §Shared Utilities |
| New/changed theme tokens | `documentation/shared/theme-tokens.md` |
| New/changed editable parameters | `documentation/avnav-api/editable-parameters.md` |
| New/changed cluster config | Relevant cluster doc under `documentation/` |

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

### Step 5: Update TABLEOFCONTENTS.md

If you created a new documentation file:

1. Open `documentation/TABLEOFCONTENTS.md`
2. Add a question→link entry in the appropriate section
3. Follow the existing format: `**"How do I ...?"** → [doc-name.md](path/doc-name.md)`

**Reachability rule:** Every new doc must be linked from at least one other doc that is itself reachable from `AGENTS.md`. The easiest way is adding an entry to `TABLEOFCONTENTS.md`.

### Step 6: Update Tracking Files (When Applicable)

**QUALITY.md** — Update when:
- Layer file counts change (new or removed files)
- Test counts change
- Check output summaries change (warnings, violations)
- A cleanup task was completed

**TECH-DEBT.md** — Update when:
- A new drift, inconsistency, or missing enforcement is discovered (add Active item)
- A debt item was resolved (move to Completed with date and resolution summary)
- A smell rule severity changes

**AGENTS.md / CLAUDE.md** — Update when:
- Architecture guidance changes
- New file map entries are needed
- New known issues are discovered
- After updating either, run `node tools/sync-ai-instructions.mjs --from=agents` (or `--from=claude`) to keep them synchronized

### Step 7: Validate

Run the documentation validation checks:

```bash
node tools/check-docs.mjs           # Link and anchor validation
node tools/check-doc-format.mjs     # Format enforcement
node tools/check-doc-reachability.mjs  # Reachability from AGENTS.md
npm run ai:check                     # AI instruction sync check
```

Or run everything at once:

```bash
npm run check:all
```

Non-zero exit means docs are not consistent. Fix all failures before proceeding.

### Anti-Patterns

- ❌ Changing code without updating linked docs
- ❌ Creating a new doc without adding it to TABLEOFCONTENTS.md
- ❌ Writing verbose "Why?" sections or "Future Enhancements"
- ❌ Using more than 1-2 examples per concept
- ❌ Leaving empty sections in docs
- ❌ Updating AGENTS.md without syncing to CLAUDE.md (or vice versa)
- ❌ Completing a cleanup task without updating QUALITY.md and TECH-DEBT.md
