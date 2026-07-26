# PLAN37 — Split oversized AI-read files and extend the 400-line gate to cover them

**Status:** ✅ Implemented | All four oversized `.d.ts` files and six oversized `tools/**/*.mjs` modules split by
responsibility; the file-size gate widened to cover `plugin.mjs`, `tools/`, and `types/`; `npm run check:all` passes
with the widened gate active.

## Goal

Observable results after completion:

1. The file-size gate (`tools/check-file-size.mjs`, `npm run check:filesize`) scans every file class that AI reads as
   reference during normal work: JS source/tests, `.mjs` tooling, `.d.ts` type declarations, and Markdown — across
   `plugin.js`, `plugin.mjs`, `runtime`, `cluster`, `config`, `shared`, `widgets`, `tests`, `documentation`, `tools`,
   `types`, and the six root docs.
2. The only remaining exclusions are the defensible ones: `exec-plans/`, `.agents/skills/`, `*.config.*` files, `.css`,
   `.json`, and the tool fixture/test-input trees (`tools/lint-fixtures/`, `tools/test-data/`).
3. Every file newly brought into scope is at or under the 400-line hard limit. No file is split into meaningless `partN`
   fragments; each split produces responsibility-named modules.
4. `npm run check:all` passes with the extended gate active.
5. Documentation that states the gate's scope (`documentation/core-principles.md`,
   `documentation/conventions/coding-standards.md`, `documentation/conventions/quality-gates.md`,
   `documentation/conventions/smell-prevention.md`) matches the new behavior.

## Verified Baseline

Facts checked against the current repository (2026-07-26):

1. The gate lives in [tools/check-file-size.mjs](../../tools/check-file-size.mjs). `MAX_ALLOWED_LINES = 400`.
2. `SCAN_ROOTS` = `plugin.js`, `runtime`, `cluster`, `config`, `shared`, `widgets`, `tests`, `documentation`,
   `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`. `plugin.mjs`, `tools`, and
   `types` are absent.
3. `SCAN_EXTENSIONS = new Set([".js", ".md"])`. `.mjs` and `.ts`/`.d.ts` are not scanned at all.
4. `EXEMPT_PATTERNS` = `/\.css$/`, `/\.json$/`, `/^exec-plans\//`, `/^\.agents\/skills\//`, `/^tools\//`,
   `/\.config\./`. The blanket `/^tools\//` exempts all tooling.
5. `shouldCheckOneliners(relPath)` returns true only for `.js`. `countLinesByFileType` counts total lines for `.md` and
   non-empty lines otherwise.
6. Type declarations are not scanned and four exceed 400 lines: `types/misc-kit.d.ts` (3518), `types/dyni-globals.d.ts`
   (953), `types/radial-kit.d.ts` (781), `types/text-kit.d.ts` (470). Under-limit type files that stay as-is:
   `types/pending/html-kit.d.ts` (121), `types/bootstrap.d.ts` (61), `types/runtime-init.d.ts` (61).
7. Tool modules are exempt and six exceed 400 lines: `tools/check-file-size.mjs` (809),
   `tools/check-patterns/rules-failfast.mjs` (689), `tools/check-patterns/rules.mjs` (638),
   `tools/check-patterns/shared.mjs` (568), `tools/check-patterns/rules-mapper.mjs` (446),
   `tools/check-patterns/rules-core.mjs` (416).
8. `plugin.mjs` is 118 lines (under limit) but unenforced; its sibling `plugin.js` (110) is enforced.
9. The only non-`.mjs` files under `tools/` that a widened scan would reach are JSON policy baselines (already exempt by
   `/\.json$/`), `tools/actionlint.sh` (`.sh`, never a scan extension), and two deliberate fixtures:
   `tools/lint-fixtures/isfinite.js` (4) and `tools/test-data/check-patterns-failfast-cases.js` (634, intentionally
   oversized bad-pattern input). The fixtures must stay excluded.
10. `eslint.config.mjs` and `vitest.config.js` are at the repo root (never inside a `SCAN_ROOT`) and also match
    `/\.config\./`; they remain out of scope regardless of the `.mjs`/`.ts` additions.
11. `tsconfig.checkjs.json` enumerates type declarations in an explicit `"files": [ ... ]` array (lines 15-20, listing
    the six current `.d.ts`). It is not glob-based: new declaration files must be added to this array.
    `tsconfig.tests.json` uses `skipLibCheck: true` and does not enumerate the type files by name.
12. Gate self-tests: [tests/tools/check-file-size.test.js](../../tests/tools/check-file-size.test.js) (its "exempts
    css/json, exec-plans, .agents/skills, tools, and package-config paths" case asserts `tools/oversized.js` is
    skipped), [tests/tools/check-file-size-oneliner.test.js](../../tests/tools/check-file-size-oneliner.test.js), and
    [tests/tools/check-file-size-test-utils.js](../../tests/tools/check-file-size-test-utils.js).
13. Negative fact — the complexity budget and coverage inventory do **not** cover `tools/` or `types/`:
    `PRODUCTION_ROOTS = ["config", "runtime", "cluster", "shared", "widgets"]` in
    [tools/quality-policy/complexity-scan.mjs](../../tools/quality-policy/complexity-scan.mjs) (plus `plugin.js`/
    `plugin.mjs` entrypoints), and `coverage-floors.json` lists no `tools/`/`types/` paths. Splitting these files
    therefore requires **no** hash-locked complexity/coverage snapshot regeneration.
14. `check-patterns` scopes to the plugin source dirs, not `tools/`; splitting tool modules does not trip
    `npm run check:smells` on the tool source itself, but `tests/tools/*` import tool modules directly and must follow
    any moved exports.
15. `README.md` and `CONTRIBUTING.md` contain no file-size/400-line/`check:filesize` text (verified by grep). The gate
    scope is documented only under `documentation/`.

## Hard Constraints

1. **No behavioral change to the runtime plugin.** Only file organization (type/tool splits), the checker's scan
   configuration, its tests, and scope documentation change. No `runtime`/`cluster`/`config`/`shared`/`widgets` source
   is edited.
2. **No `partN` / numbered-fragment filenames.** Every split target is named for the responsibility it owns.
3. **Every file in the widened scope must be ≤400 lines** at the end of the plan (non-empty lines for code, total lines
   for Markdown), including the checker's own newly-split modules.
4. **Preserve the defensible exclusions exactly:** `exec-plans/`, `.agents/skills/`, `*.config.*`, `.css`, `.json`
   remain excluded. Do not bring `eslint.config.mjs` or `vitest.config.js` into scope.
5. **Fixtures stay excluded.** `tools/lint-fixtures/` and `tools/test-data/` must remain out of scope — replace the
   blanket `/^tools\//` exemption with narrow fixture-tree exemptions, never widen back to all of `tools/`.
6. **`.d.ts` files get the line limit but not one-liner detection.** One-liner/compression rules apply to authored
   JS/`.mjs` only; type declarations are legitimately dense and must not be flagged for collapsed literals or
   single-line bodies.
7. **No public type or tool API drift.** Every symbol exported/declared before a split remains reachable by its original
   consumers after the split (via updated imports or a re-export barrel). `npm run typecheck` and the full test suite
   must stay green after every phase.
8. **No plan/phase citations leak into shipped output** (filenames, comments, JSON notes). Split filenames describe the
   domain, not `PLAN37`/`Phase N` (per the Exec-Plan Citation Rule).

## Implementation Order

Phases are ordered so the repository stays green after each: the oversized files are split **before** the gate is
widened to enforce against them.

### Phase 1 — Split oversized type declarations

**Intent:** Break the four oversized `.d.ts` files into responsibility-named declaration modules, each ≤400 lines, wired
into TypeScript.

**Dependencies:** none.

**Deliverables:**

- Introduce a `types/kits/` subtree for the "pending widget-kit" declarations and a `types/globals/` subtree for the
  core-globals decomposition. Suggested domain boundaries (adjust so each file lands ≤400 and stays cohesive):
  - `types/misc-kit.d.ts` (3518) → split along its existing section banners and `Dyni*` prefix domains, e.g.
    `types/kits/host-helpers.d.ts` (shared context / value-math / host helper APIs), `types/kits/linear-gauge.d.ts`
    (GaugeToolkit + linear gauge helpers — sub-split into layout vs engine/drawing if it exceeds 400),
    `types/kits/xte.d.ts` (XTE layout kits + highway primitives), `types/kits/state-screen.d.ts`, and — because the
    `nav kits` section alone is ~1735 lines — per-domain nav files `types/kits/nav-route.d.ts`,
    `types/kits/nav-ais.d.ts`, `types/kits/nav-alarm.d.ts`, `types/kits/nav-regatta.d.ts`, `types/kits/nav-map.d.ts`,
    plus `types/kits/vessel.d.ts` and `types/kits/component-require.d.ts` (require() overloads).
  - `types/dyni-globals.d.ts` (953) → `types/globals/` files by concern, e.g. `ambients.d.ts` (define/module/Window/
    global vars), `cluster-config.d.ts` (routes, component registry, nav/vessel cluster config), `plugin-config.d.ts`
    (shared config, unit-format catalog, editable parameters), `runtime.d.ts` (runtime + plugin namespaces, loader,
    composed tree), `formatters-widgets.d.ts` (avnav/formatter API, widget lifecycle).
  - `types/radial-kit.d.ts` (781) → by its banners, e.g. `types/kits/radial-theme.d.ts`,
    `types/kits/radial-canvas.d.ts`, `types/kits/radial-layout.d.ts`, `types/kits/radial-engine.d.ts`.
  - `types/text-kit.d.ts` (470) → two cohesive files, e.g. `types/kits/text-measure.d.ts` and
    `types/kits/text-layout.d.ts`.
- Update `tsconfig.checkjs.json` `"files"` to remove each split original and add every new declaration file. If
  `npm run typecheck` (source or tests project) fails to resolve any new ambient file, add it to the failing tsconfig's
  `files`/`include`.
- Keep declaration-merge semantics intact: interfaces that merge into a shared interface may stay split across files; do
  not collapse merges.

**Exit conditions:**

- `wc -l` on every `types/**/*.d.ts` reports ≤400.
- No file named with a numbered fragment.
- `npm run typecheck` passes.

### Phase 2 — Split oversized tool modules

**Intent:** Break the six oversized `.mjs` tool modules into responsibility-named modules, each ≤400 lines, with all
imports and tool self-tests updated.

**Dependencies:** none (independent of Phase 1).

**Deliverables (suggested boundaries; keep each ≤400 and cohesive):**

- `tools/check-file-size.mjs` (809) → keep the orchestrator (scan config, `collectTargetFiles`/`walk`, line counting,
  exemption, CLI, summary/printing) in `tools/check-file-size.mjs`; move the one-liner detection family into a
  `tools/check-file-size/` subtree, e.g. `oneliner-rules.mjs` (the `detect*`/`isAllowed*` kind detectors) and
  `scan-helpers.mjs` (brace/paren/comma scanning + masking helpers).
- `tools/check-patterns/rules-failfast.mjs` (689) → group the nine rule runners by theme, e.g. keep the fallback/guard
  rules in `rules-failfast.mjs` and extract the legacy-support family (`runPrematureLegacySupportRule`,
  `runCanonicalHelperRedefinitionRule`, `runEditableThresholdInternalRule`) into `rules-legacy-support.mjs`.
- `tools/check-patterns/rules.mjs` (638) — the `RULES` registry array → move each category's rule definitions next to
  its runners (definitions grouped per category) and have `rules.mjs` compose the registry from those groups, so no
  single definitions file exceeds 400.
- `tools/check-patterns/shared.mjs` (568) → split by concern, e.g. lint-directive/suppression parsing into
  `shared-suppressions.mjs` and source masking/brace scanning (`maskCommentsAndStrings`, `findMatchingBrace/Paren`,
  `findTopLevelComma`, `readLiteralToken`) into `shared-source-scan.mjs`; keep `shared.mjs` re-exporting the stable
  public surface so existing importers (including `check-file-size.mjs`) resolve unchanged.
- `tools/check-patterns/rules-mapper.mjs` (446) → separate mapper-shape rules from the mapper-output-complexity rule,
  e.g. `rules-mapper.mjs` + `rules-mapper-complexity.mjs`.
- `tools/check-patterns/rules-core.mjs` (416) → extract the unsafe-HTML-DOM-sink rule family into
  `rules-unsafe-sink.mjs`, leaving the remaining core rules in `rules-core.mjs`.
- Update every importer of moved exports (`tools/check-patterns/rules.mjs`, sibling rule modules, and `tests/tools/*` —
  including `check-patterns.harness.js` and the `check-patterns.part*.test.js` suites) to the new module paths.

**Exit conditions:**

- `wc -l` on every `tools/**/*.mjs` reports ≤400 (excluding the fixture trees, which are unchanged).
- No numbered-fragment filenames.
- `npm run check:smells`, `npm run test:split` (or the targeted `tests/tools/*` runs), and `npm run typecheck` pass.

### Phase 3 — Widen the gate and enforce

**Intent:** Extend `check-file-size.mjs` to scan the newly-cohesive file classes, keep the defensible exclusions, and
lock the behavior with tests and documentation.

**Dependencies:** Phases 1 and 2 (all in-scope files must already be ≤400).

**Deliverables:**

- In `tools/check-file-size.mjs`:
  - `SCAN_ROOTS`: add `"plugin.mjs"`, `"tools"`, `"types"`.
  - `SCAN_EXTENSIONS`: add `".mjs"` and `".ts"` (`path.extname` yields `.ts` for `.d.ts`).
  - `EXEMPT_PATTERNS`: remove `/^tools\//`; add `/^tools\/lint-fixtures\//` and `/^tools\/test-data\//`. Keep
    `/\.css$/`, `/\.json$/`, `/^exec-plans\//`, `/^\.agents\/skills\//`, `/\.config\./`.
  - `shouldCheckOneliners`: return true for `.js` and `.mjs`; return false for `.ts`/`.d.ts`. Confirm
    `countLinesByFileType`/`getLineTypeLabel` treat `.mjs`/`.ts` as non-empty-line code (only `.md` uses total lines).
- Update the gate self-tests to lock the new contract:
  - In `check-file-size.test.js`, replace the tools-are-exempt assertion with: `tools/**/*.mjs` and `tools/**/*.js` are
    scanned and can violate, while `tools/lint-fixtures/**` and `tools/test-data/**` stay exempt. Add cases for a
    `types/**/*.d.ts` over-limit violation, an over-limit `plugin.mjs`, and confirmation that `.d.ts` files are
    line-limited but exempt from one-liner findings.
  - Extend `check-file-size-test-utils.js`/`check-file-size-oneliner.test.js` as needed to build `.mjs`/`.d.ts`
    fixtures.
- Update scope documentation to match: `documentation/core-principles.md` (rule 5), the "File Size Limits" section of
  `documentation/conventions/coding-standards.md`, the `check:filesize` rows in
  `documentation/conventions/quality-gates.md`, and the `check-file-size` entries in
  `documentation/conventions/smell-prevention.md` — stating the gate covers JS + `.mjs` + `.d.ts` type declarations +
  Markdown across source, tests, `tools` (excluding `lint-fixtures`/`test-data`), `types`, and root docs, with
  exclusions `exec-plans`, `.agents/skills`, `*.config.*`, `.css`, `.json`.

**Exit conditions:**

- `npm run check:filesize` passes with the widened scope (0 violations).
- The updated gate self-tests pass and fail correctly when a scanned `.mjs`/`.d.ts`/`plugin.mjs`/`tools` file is forced
  over 400 lines.
- `npm run check:all` passes end-to-end.

## User-Facing Documentation Impact

**`README.md`: no change required.** This is an internal quality-gate scope change with no effect on theming,
clusters/kinds, layouts, installation, configuration, requirements, or the user-visible runtime; verified that
`README.md`/`CONTRIBUTING.md` do not document the file-size gate (Baseline 15). Documentation updates are confined to
the `documentation/conventions/` and `documentation/core-principles.md` scope statements in Phase 3.

## Acceptance Criteria

**Coverage (the objective):**

- Every JS, `.mjs`, `.d.ts`, and Markdown file that AI reads as reference is subject to the 400-line gate, except
  `exec-plans/`, `.agents/skills/`, `*.config.*`, `.css`, `.json`, and the `tools/lint-fixtures`/`tools/test-data`
  fixture trees.
- `plugin.mjs`, all `types/**/*.d.ts`, and all `tools/**/*.mjs` (outside fixtures) are enforced.

**Splits:**

- All four oversized type files and all six oversized tool modules are ≤400 lines after splitting.
- Split filenames are responsibility-named; no `partN`/numbered fragments; declaration-merge and export surfaces
  preserved.

**Gates:**

- `npm run typecheck`, `npm run check:smells`, `npm run test:split`, `npm run check:filesize`, and `npm run check:all`
  all pass.
- Gate self-tests assert the new scope and the retained exclusions, and fail when a scanned file exceeds the limit.

**No collateral change:**

- No runtime plugin source edited; no complexity/coverage snapshot regeneration needed (Baseline 13).

## Related

- [tools/check-file-size.mjs](../../tools/check-file-size.mjs)
- [documentation/conventions/coding-standards.md](../../documentation/conventions/coding-standards.md#file-size-limits)
- [documentation/conventions/quality-gates.md](../../documentation/conventions/quality-gates.md)
- [documentation/conventions/smell-prevention.md](../../documentation/conventions/smell-prevention.md)
- [documentation/guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md)
- [tsconfig.checkjs.json](../../tsconfig.checkjs.json)
