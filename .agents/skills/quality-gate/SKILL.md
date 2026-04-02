---
name: quality-gate
description: Runs the full completion gate and ensures quality tracking files are updated to reflect the current repo state. Closes the gap between checks passing and quality tracking being current.
---

# Skill: quality-gate

## Description

Runs the full completion gate and ensures quality tracking files (`QUALITY.md`, `TECH-DEBT.md`) are updated to reflect the current repo state. Closes the gap between "checks pass" and "quality tracking is current."

## When to Use

At the end of every task, after implementation and documentation are complete, before declaring the task done.

## Instructions

### Step 1: Run the Completion Gate

```bash
npm run check:all
```

This runs three sub-gates:
- `check:core` — headers, naming, dependencies, UMD, file size, patterns, smells, docs
- `test:coverage:check` — test suite + coverage threshold enforcement
- `perf:check` — performance regression gate against committed baselines

**If any check fails, fix the issue before proceeding.** Do not weaken assertions or skip checks.

### Step 2: Parse the Output

Capture and parse key metrics from the check output:

- **Test results:** `{N}/{N}` test files, `{N}/{N}` tests green
- **Coverage:** lines/statements `{X}%`, functions `{X}%`, branches `{X}%`
- **check:patterns:** failures=`{N}`, warnings=`{N}`
- **check:filesize:** warnings=`{N}`, violations=`{N}`, onelinerWarnings=`{N}`
- **perf:check:** pass/fail

### Step 3: Compare Against Last Recorded State

Read `documentation/QUALITY.md` and compare:

- Has the test count changed? (New test files or tests added/removed)
- Has the coverage percentage changed?
- Have check:patterns warnings changed?
- Have check:filesize warnings changed?
- Has any layer's file count changed?
- Has any layer's grade changed?

### Step 4: Update QUALITY.md (If State Changed)

If any metrics changed, update `documentation/QUALITY.md`:

1. Update the **Last updated** date
2. Update the **Layer Health** table:
   - File counts per layer
   - Header status
   - Size OK status (`all` = no warnings, `check` = warnings but no violations)
   - Test coverage status
   - Duplicate status
   - Grade (A = all clean, B = warnings but no violations)
3. Update the **Validation run** note with current test counts
4. Update the **check:patterns summary** note
5. Update the **check:filesize summary** note
6. Update the **Coverage summary** note
7. Update **Known Drift Patterns** if any files crossed warning thresholds

### Step 5: Update TECH-DEBT.md (If Applicable)

**Add new Active items when:**
- A new drift, inconsistency, or missing enforcement was discovered during the task
- A smell rule's warning count changed
- A new file-size warning appeared

**Move items to Completed when:**
- A debt item was resolved during this task
- Include: ID, date, and resolution summary

**Format:**
```markdown
| ID | Area | Description | Impact | Priority |
```

### Step 6: Update Model Selection Log (If Applicable)

If this task involved a notable model-choice outcome (good or bad), append a row to `documentation/QUALITY.md` §Model Selection Log:

```markdown
| Task Type | Model Used | Result | Notes |
|---|---|---|---|
| {description} | {model} | {Good/Mixed/Poor} | {brief outcome} |
```

### Step 7: For Cleanup Sessions Only

If this was a garbage-collection or cleanup session:

1. Verify that the manual commit audit was completed (per `gc-audit` skill)
2. Verify all findings were fixed or tracked in docs/debt logs
3. Verify `npm run check:all` passes with current state
4. Only then update the baseline:

```bash
npm run gc:update-baseline
```

### Step 8: Final Sync Check

If `AGENTS.md` or `CLAUDE.md` was modified during this task:

```bash
node tools/sync-ai-instructions.mjs --from=agents
# or --from=claude, depending on which was edited
```

Verify:

```bash
npm run ai:check
```

### Output Summary

Provide a brief completion summary:

```
TASK: {description}
GATE: npm run check:all — PASSED
TESTS: {N}/{N} files, {N}/{N} tests
COVERAGE: lines {X}%, functions {X}%, branches {X}%
PATTERNS: failures=0, warnings={N}
FILESIZE: warnings={N}, violations=0
DOCS UPDATED: {list of docs updated, or "none needed"}
QUALITY.MD: {updated/no change}
TECH-DEBT.MD: {updated/no change}
```
