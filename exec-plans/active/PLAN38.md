# PLAN38 — Regroup numeric `*.partN.test.js` splits into topic-named strict test files

**Status:** 🚧 Active | Prescriptive on the target file-naming convention, the shared-setup extraction rule, and the
`test-inventory.json` migration mechanics. Flexible on the exact topic names and per-file test membership chosen for
each family (execution decides those from the actual `it()` contents), and on family batching order beyond the pilot.

## Goal

Observable results after completion:

1. No test file under `tests/**` is named by an arbitrary numeric fragment (`*.part2.test.js`, `*.part3.test.js`, …).
   Every former fragment lives in a file whose name states the topic it covers (for example
   `NavMapper.activeRoute.test.js`, `NavMapper.xteDisplay.test.js`), so a reader can find the right test from the
   filename alone.
2. `find tests -name '*.part[0-9]*.test.js'` returns zero results.
3. `tools/quality-policy/test-inventory.json` contains **zero** `"split-spec-fragment"` entries. Every migrated file is
   `strict` (the default) and passes the strict tests lint/typecheck boundary.
4. Shared setup/harness code that numeric fragments previously duplicated verbatim is defined once — in a typed helper
   under `tests/helpers/` or a sibling `*.harness.js` (`harness-fragment`) — and imported, not copy-pasted.
5. Every resulting test file is at or under the 400-line hard limit enforced by `tools/check-file-size.mjs`.
6. `tools/quality-policy/test-exception-baseline.json` is **byte-identical** to its pre-plan state (the immutable
   hash-locked snapshot is never edited).
7. `npm run check:all` passes, and coverage line/branch numbers for every affected production file are **at or above**
   their pre-plan values (no test is silently dropped during a move).

## Verified Baseline

Facts checked against the current repository (2026-07-26):

1. There are **209** files matching `tests/**/*.part[0-9]*.test.js`, spanning **58** base families. Largest families:
   `tests/shared/linear/LinearGaugeEngine` (23 parts), `tests/widgets/text/CenterDisplayTextWidget` (11),
   `tests/shared/radial/SemicircleRadialEngine` (11), `tests/cluster/rendering/RoutePointsRenderModel` (10),
   `tests/cluster/mappers/NavMapper` (7 parts + base).
2. The splits are numeric, not topical. Every `NavMapper.partN.test.js` opens the identical top-level
   `describe("NavMapper", …)` block; the distinguishing content is the `it()` titles inside
   ([tests/cluster/mappers/NavMapper.part2.test.js](../../tests/cluster/mappers/NavMapper.part2.test.js) covers VMG +
   activeRoute, `.part3` covers positions + disconnect, `.part4` covers xteDisplay).
3. Setup duplication is real and forced by the split. Bytes 1–193 of `NavMapper.part2/3/4.test.js` are
   **byte-identical** (`md5sum` matches) — the `makeToolkit`/config-fixture helper is copy-pasted into every fragment.
   Other families instead share a factory: `LinearGaugeEngine.partN` call `createHarness()` and duplicate less.
4. The 400-line cap is the cause. [tools/check-file-size.mjs](../../tools/check-file-size.mjs) sets
   `MAX_ALLOWED_LINES = 400` and scans `tests`. A test file that grows past 400 lines was historically split into
   `.partN` fragments rather than regrouped by topic.
5. The fragments are already tracked as recognized debt.
   [tools/quality-policy/test-inventory.json](../../tools/quality-policy/test-inventory.json) classifies **209** entries
   as `"split-spec-fragment"`, each with `parent` (the sibling `*.test.js`), a `reason`, and a `removalPath` reading
   "Move shared declarations into typed helpers, then migrate `<file>` into the strict test project."
6. The inventory is enforced by
   [tools/quality-policy/test-inventory.mjs](../../tools/quality-policy/test-inventory.mjs).
   `checkSplitSpecFragmentEntries` requires each fragment path to match `*.partN.test.js` and to name its sibling
   parent; `checkInventoryCompleteness` requires every live `tests/**/*.js` to be classified (new files default to
   `strict`).
7. `ALLOWED_CLASSIFICATIONS = {strict, harness-fragment, split-spec-fragment, fixture}`. `harness-fragment` is a valid
   destination for extracted shared setup and must be a non-spec `*.harness.js` file naming a `parent`
   (`checkHarnessFragmentEntries`). There are already **16** `harness-fragment` entries in use.
8. [tools/quality-policy/test-exception-baseline.json](../../tools/quality-policy/test-exception-baseline.json) is
   **hash-locked**: `test-inventory.mjs` holds `CAPTURED_EXCEPTION_BASELINE_SHA256` and
   `checkImmutableExceptionBaseline` fails if the file's bytes change. It currently holds 229 entries (209 of them
   `split-spec-fragment`).
9. Critical mechanic — migrating to `strict` does **not** require editing the hash-locked baseline.
   `checkExceptionProvenance` only iterates `test-inventory.json` entries and errors on a non-strict classification that
   is absent from the captured baseline; it never requires a baseline entry to have a live file. So the correct
   resolution is: delete the fragment's entry from `test-inventory.json` (the new topic-named file is `strict` by
   default) and **leave `test-exception-baseline.json` untouched**. Stale baseline rows for deleted paths are inert.
10. Existing test helpers live in [tests/helpers/](../../tests/helpers/) (e.g. `load-umd.js`, `mapper-route-context.js`,
    `unit-format-families.js`, `component-context-mock.js`). This is the canonical home for extracted shared setup.
11. A partially-migrated precedent exists: `tests/shared/linear/LinearGaugeEngineFrame.test.js` is a topic-named sibling
    of the `LinearGaugeEngine` family, showing the intended `Base.<topic>.test.js` shape is already accepted here.
12. The complexity ratchet, fail-closed coverage rule, and hash-locked exception capture are governed by
    [AGENTS.md](../../AGENTS.md); the exec-plan section contract is
    [documentation/guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md).

## Hard Constraints

- **Do not edit `tools/quality-policy/test-exception-baseline.json`.** It is hash-locked (Baseline fact 8). Migration is
  achieved only by removing entries from `test-inventory.json`. If any change appears to require editing the baseline,
  stop — the approach is wrong.
- **No behavior change to tests.** This is a pure regrouping/rename. Every `it()`/`describe()` assertion that exists
  before the plan must still execute after it, with the same expectation. No test may be deleted, weakened, or
  `.skip`ped to make a move fit. Net test count is conserved per family (extraction of a shared harness does not remove
  a spec).
- **Coverage must not drop (fail-closed).** Per AGENTS fail-closed coverage: production-file line/branch coverage after
  each family migration must be ≥ its pre-migration value. A move that loses coverage means a spec was dropped — revert.
- **Every resulting file ≤ 400 lines.** Topic files that would still exceed 400 lines must be split into finer topics,
  never into a numeric `.partN` fragment.
- **No new `*.partN.test.js` files, ever.** The numeric-fragment convention is being retired, not relocated.
- **Shared setup is extracted, not re-duplicated.** When two or more topic files in a family need the same setup, it
  goes into one typed helper (`tests/helpers/**`) or one `*.harness.js` (`harness-fragment`). Copy-paste across the new
  topic files is prohibited.
- **No plan/phase citations in shipped output.** Per the Exec-Plan Citation Rule, no new filename, test name, or comment
  may reference `PLAN38` or `Phase N`. Topic names describe the code standalone. Run `npm run check:smells` to confirm.
- **In scope:** `tests/**` files matching `*.partN.test.js`, their parent `*.test.js` siblings, extracted helpers, and
  the `test-inventory.json` entries for those files. **Out of scope:** production code under
  `config/runtime/cluster/shared/widgets`, the 400-line gate itself, and any non-fragment test file.

## Implementation Order

### Phase 1 — Pilot: establish the pattern on the `NavMapper` family

Intent: prove the end-to-end regrouping mechanic on one representative family (inline-duplicated setup, clearly
separable topics) and lock the conventions the remaining families will follow.

Dependencies: none.

Deliverables:

- A typed shared helper (extend `tests/helpers/mapper-route-context.js` or add a `tests/cluster/mappers/*.harness.js`
  classified `harness-fragment`) that owns the setup currently duplicated across `NavMapper.part2–8` (Baseline fact 3).
- Topic-named strict files replacing `NavMapper.test.js` + `NavMapper.part2–8.test.js`, e.g.
  `NavMapper.activeRoute.test.js`, `NavMapper.xteDisplay.test.js`, `NavMapper.positions.test.js`,
  `NavMapper.vmg.test.js`, `NavMapper.disconnect.test.js` — final names chosen from the actual `it()` groupings, each ≤
  400 lines.
- All 8 `NavMapper` `split-spec-fragment` entries removed from `test-inventory.json`; `test-exception-baseline.json`
  untouched.
- A short subsection appended to this plan (or to
  [documentation/guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md) if it generalizes)
  recording the exact naming convention `Base.<topic>.test.js`, the helper-extraction rule, and the inventory-migration
  steps, so later phases are mechanical.

Exit conditions:

- `find tests/cluster/mappers -name 'NavMapper.part*'` returns nothing.
- `npm run check:filesize`, `npm run check:smells`, and the NavMapper test files pass.
- NavMapper production coverage (per `tools/quality-policy`) ≥ pre-phase values.
- `node tools/quality-policy/test-inventory.mjs` (via `npm run check:all`) passes with zero NavMapper fragment entries.

### Phase 2 — Migrate the remaining families, batched by directory area

Intent: apply the Phase 1 pattern to all 57 remaining families, one family fully migrated at a time, batched by area so
each batch is independently reviewable and gate-checkable.

Dependencies: Phase 1 conventions are locked.

Deliverables (per family, repeated): shared setup extracted to one helper/harness; numeric fragments replaced by
topic-named strict files ≤ 400 lines; that family's `split-spec-fragment` entries removed from `test-inventory.json`.

Suggested batch order (largest/most-duplicated first to retire the most debt early):

1. `tests/shared/**` (`LinearGaugeEngine` ×23, `SemicircleRadialEngine` ×11, radial/nav/vessel HtmlFit + layout
   families).
2. `tests/cluster/**` (`RoutePointsRenderModel` ×10, `*TextHtmlWidget` families, `VesselMapper`).
3. `tests/widgets/**` (`CenterDisplayTextWidget` ×11, radial/linear/text widget families).
4. `tests/runtime/**`, `tests/integration/**`, `tests/config/**`, `tests/tools/**` (the remaining small families).

Exit conditions:

- After each batch: `find tests -name '*.part[0-9]*.test.js'` no longer lists any file from that batch's directories;
  `npm run check:all` passes; affected-file coverage ≥ pre-batch values.
- After the final batch: `find tests -name '*.part[0-9]*.test.js'` returns **zero** results and
  `grep -c '"split-spec-fragment"' tools/quality-policy/test-inventory.json` returns **0**.

### Phase 3 — Documentation sync and debt-marker retirement

Intent: update the docs that describe the fragment convention so they match the retired state, without editing the
immutable baseline.

Dependencies: Phases 1–2 complete.

Deliverables:

- Update the `test-inventory.json` `note` field and any convention doc that describes `split-spec-fragment` as an
  active/expected classification (e.g. testing-conventions docs referenced from
  [documentation/TABLEOFCONTENTS.md](../../documentation/TABLEOFCONTENTS.md)) to state that numeric fragments are
  retired and new oversized tests are split by topic into strict files.
- Confirm no remaining doc, comment, or test name instructs authors to create `*.partN.test.js`.

Exit conditions:

- `npm run check:all` passes.
- Grep across `documentation/**` and `tests/**` finds no guidance to author numeric fragments.

## User-Facing Documentation Impact

`README.md` changes are **not required**: this plan touches only the test suite's internal organization and quality
tooling — no theming, cluster/kind, layout, installation, configuration, requirement, or development-workflow change is
user-visible. Documentation work is confined to internal testing-convention docs and the `test-inventory.json` note
(Phase 3). If a batch surfaces a `README.md`-referenced testing instruction, add the specific section update to that
batch's deliverables.

## Acceptance Criteria

Structure and naming:

- `find tests -name '*.part[0-9]*.test.js'` → zero results.
- Every former fragment's tests live in a `Base.<topic>.test.js` file whose name states its topic; each file ≤ 400 lines
  (`npm run check:filesize` passes).

Inventory and immutability:

- `grep -c '"split-spec-fragment"' tools/quality-policy/test-inventory.json` → `0`.
- `tools/quality-policy/test-exception-baseline.json` sha256 is unchanged from pre-plan
  (`checkImmutableExceptionBaseline` passes).
- All migrated files are `strict` and pass the strict lint/typecheck boundary.

Behavior and coverage (fail-closed):

- No test deleted, weakened, or skipped; net per-family spec count conserved.
- Every affected production file's line/branch coverage ≥ its pre-plan value.
- Shared setup exists once per family (no verbatim-duplicated setup blocks remain across the new topic files).

Gates:

- `npm run check:all` passes (includes `test-inventory.mjs`, file-size, smells, coverage).
- `npm run check:smells` confirms no `PLAN38`/`Phase N` citation leaked into shipped filenames, test names, or comments.

## Related

- [tools/quality-policy/test-inventory.json](../../tools/quality-policy/test-inventory.json) — the `split-spec-fragment`
  debt ledger this plan retires.
- [tools/quality-policy/test-inventory.mjs](../../tools/quality-policy/test-inventory.mjs) — enforcement
  (classification, immutable baseline, fragment/harness rules).
- [tools/quality-policy/test-exception-baseline.json](../../tools/quality-policy/test-exception-baseline.json) —
  hash-locked; must remain byte-identical.
- [tools/check-file-size.mjs](../../tools/check-file-size.mjs) — the 400-line cap that forced the original splits.
- [tests/helpers/](../../tests/helpers/) — canonical home for extracted shared setup.
- [documentation/guides/exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md) — plan section
  contract.
- [AGENTS.md](../../AGENTS.md) — fail-closed coverage, hash-locked exception capture, complexity ratchet.
