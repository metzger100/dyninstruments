# PLAN32 — Strict 400-Line Limit Enforcement (No Workarounds)

## Status

Written after repository verification against the live codebase.

This plan hardens the 400-line file limit from a soft target into an absolute, mechanically enforced boundary across all code, test, and documentation files. It covers documentation updates (so agents understand the rule cannot be bypassed), linter hardening (so compression tricks are caught), scan-root expansion (so tests and docs are enforced too), and fallout remediation (so the gate is green after all changes). The coding agent may choose equivalent implementations for heuristic detection logic and test-file splitting strategies as long as the behavioral, structural, and documentation outcomes below are met. The new oneliner heuristics and the exemption list must be followed as specified.

---

## Goal

After PLAN32 is complete, no source, test, or documentation file in the repository can exceed 400 non-empty lines unless it belongs to an explicitly exempted category, the linter catches all known compression tricks that agents use to dodge the limit, and every agent-facing document makes clear that the 400-line rule is non-negotiable and overrides exec-plan assumptions.

Expected outcomes after completion:

1. `check:filesize` enforces a hard 400-line limit on all JS files (source and test) and all Markdown files, with no warning tier.
2. The oneliner detector catches chained ternaries, single-line function/arrow bodies, collapsed object/array literals, and collapsed if/else blocks — in addition to all existing heuristics.
3. An explicit exemption list excludes `.css`, `.json`, `exec-plans/`, `.agents/skills/`, `tools/`, and package config files from scanning.
4. `coding-standards.md`, `core-principles.md`, the preflight skill, and the plan-creation skill all use unambiguous mandatory language and state that repo rules override exec-plan assumptions.
5. The smell catalog entry for "Oneliner line-limit bypass" is updated to reference the expanded heuristic set.
6. All 30 test files currently over 400 non-empty lines are split into focused sub-files.
7. `npm run check:all` passes with zero violations and zero warnings from `check:filesize`.

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/core-principles.md`
5. `documentation/conventions/testing-infrastructure.md`

---

## Verified Baseline (Repository-Verified Facts)

### check-file-size.mjs — current behavior

1. `tools/check-file-size.mjs` defines `MAX_NON_EMPTY_LINES = 400` and `WARN_NON_EMPTY_LINES = 300`.
2. `SCAN_ROOTS` is `["plugin.js", "runtime", "cluster", "config", "shared", "widgets"]` — source JS only; no tests, no documentation.
3. `EXCLUDED_DIRS` is `new Set(["node_modules", "tests", "tools", ".git"])` — prevents the walker from recursing into these directories when encountered as children of a scan root.
4. Oneliner detection covers: multi-statement semicolons, stacked declarators, comma-sequence assignments, multiple statement leaders, comma-operator call chains, back-to-back block statements, packed for-headers, packed destructuring, long packed lines (>160 chars), operator-dense lines (>140 chars), and nested-parens lines (>80 chars with ≥14 parens).
5. The `--oneliner=block` flag is the default for `npm run check:filesize`.
6. `npm run check:filesize:warn` exists as an exploratory variant with `--oneliner=warn`.

### Current file-size state

7. `check:filesize` summary (2026-05-02): `warnings=30`, `violations=0`, `onelinerWarnings=0`.
8. All 30 warnings are source JS files in the 300–400 line range listed in `QUALITY.md` Known Drift Patterns.
9. 30 test files in `tests/` exceed 400 non-empty lines (39 exceed 400 total lines, but the linter checks non-empty). The largest is `tests/runtime/cluster/RouteActivationController.test.js` at 1750 total lines (1692 non-empty).
10. All documentation `.md` files are under 400 lines. The largest is `documentation/radial/gauge-shared-api.md` at 357 lines.
11. Root `.md` files (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`) are all under 200 lines.

### Documentation — current language

12. `coding-standards.md` §File Size Limits uses the word "Target" (`Target: <=400 lines`), which is soft.
13. `core-principles.md` Rule 5 says "Keep JavaScript files at or below 400 lines" — stronger but does not mention tests or docs, and does not state it overrides exec-plans.
14. The preflight skill (`SKILL.md`) mentions `File size <=400 lines` as one bullet among many in the context summary template. It does not call out that this rule is absolute or that repo rules override exec-plans.
15. The create-plan skill (`SKILL.md`) mentions "Each file must stay within the 400-line budget" in Hard Constraints but does not instruct plan authors to account for file growth or to mandate splitting in their plans.

### Tests — current structure

16. `tests/tools/check-file-size.test.js` is 384 lines (under 400) and covers all current heuristics with 16 test cases.
17. Test files use Vitest and follow `describe`/`it` conventions.

---

## Hard Constraints

### Architecture

- Do not change the AvNav host registration strategy.
- Do not add ES modules or a build step to runtime code.
- `check-file-size.mjs` must remain a standalone Node ESM script importable by the test suite.
- The exemption list must be declarative (a single `EXEMPT_PATHS` or `EXEMPT_PATTERNS` constant), not scattered conditionals.

### File organization

- `tools/check-file-size.mjs` owns all file-size and oneliner enforcement.
- `tests/tools/check-file-size.test.js` owns all unit tests for the checker. If this file exceeds 400 lines after adding new tests, split into `check-file-size.test.js` (core line-count tests) and `check-file-size-oneliner.test.js` (oneliner heuristic tests).
- Each non-exempt file must stay within the 400-line budget. (`tools/` files are exempt.)

### Behavioral

- The 400-line limit is absolute for all scanned files. There is no warning tier.
- The exemption list is: `.css` files, `.json` files, files under `exec-plans/`, files under `.agents/skills/`, files under `tools/`, and any file matching `.*.config.*` patterns.
- Oneliner detection must run in `block` mode by default. The `--oneliner=warn` exploratory variant may remain but must not be used by `check:core` or `check:all`.
- Splitting a test file must not lose any test cases. The `describe`/`it` count before and after must match.
- Documentation files scanned as `.md` are subject to the 400-line limit on total lines (not non-empty lines), because Markdown uses blank lines for structure. The agent may choose total-lines or non-empty-lines for `.md` as long as the intent (no giant monolith docs) is met.

### Scope

- Do not change runtime source code, widget code, mapper code, or cluster code unless the new oneliner heuristics flag existing lines that must be reformatted.
- Do not change test assertions or weaken test coverage.
- Do not change documentation content beyond the specific language/section updates listed in Phase 1.

---

## Implementation Order

### Phase 1 — Documentation Hardening

**Intent:** Make every agent-facing document unambiguous that the 400-line rule is absolute, applies to code/tests/docs, and overrides exec-plan assumptions.

**Dependencies:** None.

#### 1A. Update `documentation/conventions/coding-standards.md` §File Size Limits

Replace the current soft language:

```
- Target: `<=400` lines per JS file.
```

With hard mandatory language:

```
- **Hard limit: 400 non-empty lines per file.** This applies to all JS files (source and test) and all Markdown documentation files. There are no exceptions, no warning tier, and no workarounds. If a file approaches or reaches 400 lines, the agent must stop and split it before continuing — even if the current exec-plan does not mention splitting. Repo rules always override exec-plan assumptions.
- Exempt file types: `.css`, `.json` layout files, exec-plan files (`exec-plans/`), agent skill files (`.agents/skills/`), tool scripts (`tools/`), and package config files.
- One-liner compression (collapsing multiline code onto fewer lines to stay under the limit) is a blocking lint violation. The linter detects dense oneliners, long packed lines, chained ternaries, collapsed blocks, and other compression patterns. See `documentation/conventions/smell-prevention.md` §Oneliner line-limit bypass.
```

Add a new subsection immediately after:

```
## Repo Rules Override Exec-Plans

If an exec-plan's implementation phases would cause a file to exceed 400 lines, the agent must refactor and split the file as part of that phase. The plan does not need to mention splitting explicitly — the 400-line rule is always in effect. Do not wait for a later "cleanup" phase. Do not use one-liner compression to fit more logic into fewer lines.
```

#### 1B. Update `documentation/core-principles.md` Rule 5

Replace:

```
5. Rule: Keep JavaScript files at or below 400 lines; split before crossing the limit.
```

With:

```
5. Rule: Hard 400-line limit on all JS files (source and test) and Markdown documentation files. Split before crossing the limit. This rule is absolute and overrides exec-plan assumptions. Exempt: `.css`, `.json`, `exec-plans/`, `.agents/skills/`, `tools/`, package configs. → [conventions/coding-standards.md](conventions/coding-standards.md#file-size-limits)
```

#### 1C. Update preflight skill (`.agents/skills/preflight/SKILL.md`)

In the Step 4 context summary template, replace the bullet:

```
- File size <=400 lines
```

With:

```
- ABSOLUTE 400-line limit on all JS and MD files (repo rules override exec-plans; split before crossing; no one-liner compression)
```

Add a new Step 5.5 (between current Steps 5 and the Anti-Patterns section):

```
### Step 5.5: File-Size Awareness Check

Before starting implementation, check whether any file you will modify is already in the 300+ line range:

\`\`\`bash
wc -l <file>
\`\`\`

If a file is above 300 lines and your task will add significant code to it, plan the split upfront — do not defer it to "later" or assume the exec-plan will handle it. The 400-line limit is absolute and repo rules override exec-plans.
```

#### 1D. Update create-plan skill (`.agents/skills/create-plan/SKILL.md`)

In Step 6 (Hard Constraints), after the existing bullet "Each file must stay within the 400-line budget", add:

```
- The 400-line limit is absolute and overrides all other plan guidance. If any phase would push a file over 400 lines, that phase must include a split step. Plans must not assume agents will use one-liner compression as a workaround.
- For implementation phases that touch files already in the 300+ line range, include an explicit note: "Check file size before and after; split if approaching 400 lines."
```

#### 1E. Update `documentation/conventions/smell-prevention.md` — Oneliner entry

Update the "Oneliner line-limit bypass" row in the Smell Catalog table. Replace the current "Anti-Pattern" cell:

```
File-size limit is bypassed by collapsing multiline blocks into dense/very-long oneliners
```

With:

```
File-size limit is bypassed by collapsing multiline blocks into dense oneliners, chained ternaries, single-line function/arrow bodies, collapsed object/array literals, collapsed if/else blocks, or any other compression that reduces line count at the expense of readability
```

Update the "Enforcement" cell from:

```
`check-file-size` (`oneliner=dense`, `oneliner=long-packed`)
```

To:

```
`check-file-size` (`oneliner=dense`, `oneliner=long-packed`, `oneliner=chained-ternary`, `oneliner=collapsed-block`, `oneliner=collapsed-literal`, `oneliner=single-line-body`)
```

---

### Phase 2 — Linter Hardening

**Intent:** Expand `check-file-size.mjs` to scan tests and docs, remove the warning tier, add an exemption list, and add new oneliner heuristics that catch all known compression tricks.

**Dependencies:** None (can be done in parallel with Phase 1).

#### 2A. Remove the warning tier

Delete the `WARN_NON_EMPTY_LINES` constant and all code paths that reference it. Remove the `warnings` array and all warning-tier logic from `runFileSizeCheck`. The summary output should no longer include a `warnings` field. Files are either OK (≤400) or violations (>400). Update all error/log messages accordingly.

#### 2B. Add the exemption list

Add a declarative exemption constant:

```javascript
const EXEMPT_PATTERNS = [
  /\.css$/,
  /\.json$/,
  /^exec-plans\//,
  /^\.agents\/skills\//,
  /^tools\//,
  /\.config\./
];
```

Apply this filter in `collectTargetFiles` so exempt files are never checked. The filter applies to the relative path from the project root.

#### 2C. Expand scan roots

Expand `SCAN_ROOTS` to include `tests` and `documentation` directories, and extend the file walker to collect `.md` files in addition to `.js` files:

```javascript
const SCAN_ROOTS = ["plugin.js", "runtime", "cluster", "config", "shared", "widgets", "tests", "documentation"];
const SCAN_EXTENSIONS = new Set([".js", ".md"]);
```

Remove `"tests"` and `"tools"` from `EXCLUDED_DIRS` so they are no longer skipped during recursive walks. `"tests"` is now a first-class scan root; `"tools"` is already covered by `EXEMPT_PATTERNS` (`^tools/`), and leaving it in `EXCLUDED_DIRS` would incorrectly skip `tests/tools/` (test files for tool scripts, which are not exempt). Only `"node_modules"` and `".git"` should remain in `EXCLUDED_DIRS`.

Update the `walk` function to use `SCAN_EXTENSIONS` instead of hardcoded `.js` check.

Also scan root-level `.md` files: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`. These can be added as individual entries to `SCAN_ROOTS` or collected via a root-level glob for `.md` files.

For `.md` files, count total lines (not non-empty lines) since Markdown uses blank lines structurally. The agent may implement this as a separate counter or a file-type branch in the existing counter.

#### 2D. Add new oneliner heuristics

Add these four detection functions to the oneliner detection pipeline:

**1. Chained ternaries** (`detectChainedTernary`)

Flag any line (after masking strings/comments) that contains two or more `?` operators at the same nesting depth, indicating a chained ternary like `a ? b : c ? d : e`. The detection must not flag lines where `?` appears inside nested function calls or object literals at a deeper paren/brace depth.

Threshold: ≥2 ternary `?` operators at top-level or same-depth nesting on a single line.

**2. Single-line function/arrow bodies** (`detectSingleLineBody`)

Flag any line that matches a function declaration or arrow function with a brace-delimited body on the same line, where the body contains at least one semicolon or statement. Examples:

- `function foo(a, b) { return a + b; }`
- `const foo = (a, b) => { const x = a + b; return x; };`
- `create(def, ctx) { this.x = 1; this.y = 2; }`

Do NOT flag: arrow functions without braces (`const f = x => x + 1`), empty bodies (`function noop() {}`), or bodies that contain only a single `return` token with no semicolons before the closing brace when the total line length is under 100 characters (to allow trivially short one-line returns like `function id(x) { return x; }`).

**3. Collapsed object/array literals** (`detectCollapsedLiteral`)

Flag any line containing an object literal `{ ... }` or array literal `[ ... ]` with 4 or more comma-separated entries at the top level of that literal, where the line length exceeds 80 characters. This catches:

- `const cfg = { a: 1, b: 2, c: 3, d: 4, e: 5 };`
- `const arr = [foo, bar, baz, qux, quux];`

Do NOT flag: function parameter lists, destructuring on the left side of assignment (already covered by packed destructuring), or `import`/`require` statements.

**4. Collapsed if/else blocks** (`detectCollapsedBlock`)

Flag any line that contains an `if` (or `else if` or `else`) keyword followed by a brace-delimited body on the same line, where the body contains at least one semicolon. This catches:

- `if (x > 0) { doSomething(); }`
- `if (x) { a = 1; } else { a = 2; }`
- `} else if (y) { b = 3; }`

Do NOT flag: `if (x) return;` or `if (x) throw new Error(...)` without braces (single-statement guard clauses are acceptable style).

#### 2E. Wire new heuristics into the detection pipeline

Add the four new functions to `detectDenseOneliner` or as a parallel detection step. Each finding should include a `kind` field (`"chained-ternary"`, `"single-line-body"`, `"collapsed-literal"`, `"collapsed-block"`) for clear error messages.

Update `printOnelinerFindings` to print kind-specific messages, for example:

```
[file-size-oneliner] path:line: Chained ternary on one line (use separate if/else or intermediate variables). One-liners are not allowed.
[file-size-oneliner] path:line: Function body collapsed onto one line (use multiline formatting). One-liners are not allowed.
```

#### 2F. Update npm scripts

Remove `check:filesize:strict` (now redundant since the default is already strict and there is no warning tier). Keep `check:filesize:warn` as an exploratory tool but update its description in `package.json`. Verify that `check:core` and `check:all` still call `check:filesize` with `--oneliner=block`.

#### 2G. Update summary output

The summary JSON should no longer include `warnings` (removed with warning tier). It should include the new finding kinds in the oneliner breakdown:

```json
{
  "ok": true,
  "checkedFiles": 280,
  "violations": 0,
  "onelinerMode": "block",
  "onelinerFindings": 0,
  "onelinerByKind": {
    "dense": 0,
    "long-packed": 0,
    "chained-ternary": 0,
    "single-line-body": 0,
    "collapsed-literal": 0,
    "collapsed-block": 0
  }
}
```

---

### Phase 3 — Linter Test Coverage

**Intent:** Add unit tests for every new heuristic, for the expanded scan roots, for the exemption list, and for the removal of the warning tier.

**Dependencies:** Phase 2.

#### 3A. Update existing tests for warning-tier removal

Remove or update the test `"warns when file has exactly 300 non-empty lines"` — this behavior no longer exists. Replace with a test that confirms a 300-line file passes cleanly with no output.

Update any test that asserts on `summary.warnings` — the field no longer exists.

Update all tests that assert on `summary.onelinerDenseWarnings` or `summary.onelinerLongWarnings` (26 assertions total) to use the new `summary.onelinerByKind` structure from Phase 2G. For example, `expect(summary.onelinerDenseWarnings).toBe(1)` becomes `expect(summary.onelinerByKind.dense).toBe(1)`, and `expect(summary.onelinerLongWarnings).toBe(0)` becomes `expect(summary.onelinerByKind["long-packed"]).toBe(0)`.

#### 3B. Add tests for new oneliner heuristics

Add test cases for each new heuristic. Each test should verify both positive detection and negative (no false positive) cases:

**Chained ternary:**

- Positive: `const x = a ? b : c ? d : e;`
- Negative: `const x = a ? b : c;` (single ternary is fine)
- Negative: `foo(a ? b : c, d ? e : f)` (ternaries inside different argument positions, not chained)

**Single-line function body:**

- Positive: `function foo(a) { const x = a + 1; return x; }`
- Positive: `const f = (a) => { doStuff(); return a; };`
- Negative: `const f = x => x + 1;` (no braces)
- Negative: `function noop() {}` (empty body)
- Negative: `function id(x) { return x; }` (trivially short, under 100 chars)

**Collapsed object/array literal:**

- Positive: `const cfg = { a: 1, b: 2, c: 3, d: 4 };` (4+ entries, >80 chars)
- Negative: `const p = { x: 1, y: 2 };` (under 4 entries)
- Negative: `const { a, b, c, d } = obj;` (destructuring, not a literal)

**Collapsed if/else block:**

- Positive: `if (x > 0) { doSomething(); }`
- Positive: `if (x) { a = 1; } else { a = 2; }`
- Negative: `if (x) return;` (guard clause, no braces)
- Negative: `if (x) throw new Error("bad");` (guard clause)

#### 3C. Add tests for expanded scan roots

- Test that `.js` files under `tests/` are scanned and subject to the 400-line limit.
- Test that `.md` files under `documentation/` are scanned and subject to the 400-line limit (total lines for MD).
- Test that root-level `.md` files are scanned.

#### 3D. Add tests for exemption list

- Test that `.css` files are not scanned even if placed in a scan root.
- Test that `.json` files are not scanned.
- Test that files under `exec-plans/` are not scanned.
- Test that files under `.agents/skills/` are not scanned.
- Test that files under `tools/` are not scanned.

#### 3E. Verify test file stays under 400 lines

If `tests/tools/check-file-size.test.js` exceeds 400 lines after adding new tests, split into:

- `tests/tools/check-file-size.test.js` — core line-count tests, exemption tests, scan-root tests
- `tests/tools/check-file-size-oneliner.test.js` — all oneliner heuristic tests (existing + new)

---

### Phase 4 — Fix Fallout

**Intent:** Make `npm run check:all` pass with the new rules. This means splitting all files that now violate and reformatting any lines caught by new oneliner heuristics.

**Dependencies:** Phases 2 and 3.

#### 4A. Run the updated checker and collect violations

```bash
npm run check:filesize
```

Capture the full violation list. Based on the verified baseline, expect:

- 30 test files over 400 non-empty lines that need splitting
- Possible source JS files caught by new oneliner heuristics
- Zero documentation violations (all currently under 400)

#### 4B. Split test files

For each test file over 400 lines, split into focused sub-files by `describe` block or logical grouping. Naming convention: `{OriginalName}.test.js` keeps the primary group, additional files use `{OriginalName}.{aspect}.test.js`.

Example: `RouteActivationController.test.js` (1750 lines) might split into:

- `RouteActivationController.test.js` — core activation/deactivation tests
- `RouteActivationController.routing.test.js` — route resolution and kind-matching tests
- `RouteActivationController.lifecycle.test.js` — lifecycle and session management tests
- `RouteActivationController.edge.test.js` — edge cases and error paths

The split strategy is up to the implementing agent. The only hard requirement: total `it()` count across all split files must equal the original `it()` count, and `npm run test` must pass.

#### 4C. Reformat oneliner violations

For any source or test lines flagged by the new oneliner heuristics, expand to multiline formatting. Do not change logic, only formatting.

#### 4D. Gate verification

```bash
npm run check:all
```

Must pass with zero violations, zero oneliner findings, and all tests green.

---

### Phase 5 — Quality Gate Update

**Intent:** Update quality tracking to reflect the new enforcement state.

**Dependencies:** Phase 4.

#### 5A. Update `documentation/QUALITY.md`

1. Update the "Last updated" date.
2. In the Layer Health table, update `Size OK` column: layers with zero violations get `all` (there is no `check` grade anymore since warning tier is removed). Add rows for `tests/` if not already present.
3. Update the `check:filesize` summary note to reflect the new totals: `warnings=N/A (removed), violations=0, onelinerFindings=0`.
4. Update Known Drift Patterns: the "File-size hotspot growth near threshold" entry should be updated to reflect that the warning tier no longer exists and all files are under 400 lines.

#### 5B. Update `documentation/TECH-DEBT.md`

1. If any new debt items were created during Phase 4 (e.g., a test split that needs follow-up reorganization), add them.
2. Mark any resolved debt items as completed.

#### 5C. Run final gate

```bash
npm run check:all
```

Confirm green. Record the output in the completion summary.

---

## Acceptance Criteria

- [ ] `coding-standards.md` uses "Hard limit" language, not "Target", and includes the "Repo Rules Override Exec-Plans" subsection.
- [ ] `core-principles.md` Rule 5 covers JS, tests, and MD files and states the rule overrides exec-plans.
- [ ] The preflight skill includes the file-size awareness check and uses "ABSOLUTE" language in the context summary.
- [ ] The create-plan skill includes the 400-line override guidance in Hard Constraints.
- [ ] `smell-prevention.md` oneliner entry references all six heuristic categories.
- [ ] `check-file-size.mjs` has no warning tier — only pass/fail at 400 lines.
- [ ] `check-file-size.mjs` scans `tests/` and `documentation/` directories and root-level `.md` files.
- [ ] `check-file-size.mjs` exempts `.css`, `.json`, `exec-plans/`, `.agents/skills/`, `tools/`, and package configs.
- [ ] `check-file-size.mjs` detects chained ternaries, single-line function/arrow bodies, collapsed object/array literals, and collapsed if/else blocks.
- [ ] Every new heuristic has positive and negative unit tests.
- [ ] Exemption list has unit tests.
- [ ] Expanded scan roots have unit tests.
- [ ] All 30 test files previously over 400 non-empty lines are split, with no `it()` cases lost.
- [ ] No oneliner findings in the codebase.
- [ ] `QUALITY.md` reflects the new state (no warning tier, updated layer health).
- [ ] `npm run check:all` passes with zero violations.
