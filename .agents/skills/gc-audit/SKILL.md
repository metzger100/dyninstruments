---
name: gc-audit
description: Executes the structured garbage-collection audit workflow for the dyninstruments repository and handles baseline verification, commit review, structural checks, and baseline advancement.
---

# Skill: gc-audit

## Description

Executes the structured garbage-collection audit workflow for the dyninstruments repository. Handles baseline state reading, mandatory commit-by-commit review, structural checks, code-doc co-evolution verification, and baseline advancement.

## When to Use

During periodic cleanup sessions. When the user asks to "clean up", "audit", "gc", "garbage collect", or "update the baseline."

## Instructions

### Step 1: Read Baseline Status

```bash
npm run gc:status
```

Parse the output:
- **Baseline commit:** the stored commit hash
- **Range:** `{baseline}..HEAD` — the commits to audit
- **Candidate files:** files changed since baseline

If `gc:status` reports a missing baseline commit, STOP and ask the user to reset:

```bash
node tools/gc-baseline.mjs --set <commit>
```

### Step 2: Count and List Commits

```bash
RANGE="$(npm run -s gc:status | sed -n 's/^Range: //p')"
echo "Commits to audit: $(git rev-list --count "$RANGE")"
git rev-list --reverse "$RANGE"
```

### Step 3: Mandatory Commit-by-Commit Audit

For EACH commit in chronological order, review the diff:

```bash
for commit in $(git rev-list --reverse "$RANGE"); do
  echo "===== $commit ====="
  git show --stat --patch --find-renames "$commit"
done
```

For each commit, check these four audit criteria:

#### 3A: Code↔Doc Drift

- Was behavior changed without updating the linked documentation?
- Check: for each changed `.js` file, read its `Documentation:` header path
- If the header points to a `.md` file, verify that `.md` still describes the current behavior
- Flag: any `.js` behavior change where the linked `.md` was not updated in the same commit

#### 3B: Smell Regressions and Boundary Violations

- Was `window.avnav` or `avnav.api` used outside `runtime/` or `plugin.js`?
- Was a new `catch` block added without rethrowing or suppression comment?
- Was a mapper given helper functions beyond `create`/`translate`?
- Were redundant null/type guards, hardcoded defaults, or fallback wrappers introduced?
- Was a new `typeof` guard added for Canvas API or framework methods inside internal code?
- Was `||` used for defaults where `??` or property-presence checks are required?

#### 3C: Suspicious Test Changes

- Were test assertions weakened (e.g., `toEqual` → `toBeTruthy`, exact values → ranges)?
- Were tests removed without corresponding behavior removal?
- Were coverage thresholds lowered?

#### 3D: Naming and Structural Drift

- Were files renamed/moved but headers, docs, or naming references left stale?
- Do new component IDs follow naming conventions (`Dyni{ComponentName}`, `dyni_{Cluster}_Instruments`)?
- Do new files have the mandatory header block (`Module`, `Documentation`, `Depends`)?

### Step 4: Record Findings

Before making any changes, record all findings:

```markdown
## Audit Findings

### Commit {hash} - {summary}
- [ ] {Finding 1: category + description}
- [ ] {Finding 2: category + description}

### Commit {hash} - {summary}
- (clean)
```

### Step 5: Run Structural Checks

```bash
npm run check:filesize
node tools/check-headers.mjs
node tools/check-naming.mjs
node tools/check-patterns.mjs --warn
node tools/check-smell-contracts.mjs
```

Add any tool findings to the audit findings list.

### Step 6: Fix Findings

For each finding, apply the appropriate fix:

| Finding Type | Fix |
|---|---|
| Code↔doc drift | Update the linked documentation |
| Boundary violation | Move code to the correct boundary |
| Smell regression | Apply the fix playbook from `smell-prevention.md` |
| Test weakening | Restore strong assertions |
| Naming drift | Rename to match conventions |
| Stale headers | Update `Documentation:` path |
| Helper duplication | Extract to `shared/widget-kits/` |
| Empty catch | Add comment, logging, or suppression |
| Refactor leftover | Delete unreferenced code |

### Step 7: Consolidate Duplicate Helpers

Check for newly introduced duplicate logic:
- Run `node tools/check-patterns.mjs` — look for `duplicate-functions` and `duplicate-block-clones`
- Move reusable logic to `shared/widget-kits/`
- Keep widget files focused on widget-specific behavior

### Step 8: Enforce AvNav Boundary

Verify:
- Only `runtime/` and `plugin.js` access `window.avnav` / `avnav.api` directly
- Widgets/cluster/shared code calls `Helpers.applyFormatter()` and other runtime-safe helpers

### Step 9: Re-Run Checks

```bash
npm run check:all
```

All checks must pass. Fix any new failures introduced by cleanup.

### Step 10: Update Tracking Files

- Update `documentation/QUALITY.md` with current check outputs
- Update `documentation/TECH-DEBT.md`:
  - Move resolved items to Completed
  - Add any new items discovered during audit
  - Update warning counts for warn-only rules

### Step 11: Advance Baseline

**Only after ALL of these conditions are met:**
1. Every commit in the range was manually reviewed
2. All findings were fixed or explicitly tracked in docs/debt logs
3. `npm run check:all` passes

```bash
npm run gc:update-baseline
```

### Anti-Patterns

- ❌ Reviewing only `gc:status` candidate files without chronological commit audit
- ❌ Advancing the baseline before completing the full audit
- ❌ Fixing findings without re-running checks
- ❌ Weakening tests to make the gate pass
- ❌ Skipping QUALITY.md / TECH-DEBT.md updates after cleanup
