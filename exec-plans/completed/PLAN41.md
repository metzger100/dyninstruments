# PLAN41 — Converge the shared quality contract into an extraction-ready common core

## Status

Written after repository verification and the second cross-repository quality-system audit on 2026-07-27.

This plan closes the remaining divergences between the two role-model repositories so a future greenfield AvNav plugin
environment can be derived from their common core. It resolves three contradictions where each repository's canonical
file is a gate violation in the other, unifies the pattern-rule namespace, gives each shared concern exactly one owner,
adds read-only pull-request quality enforcement, and makes the agent skill layer a first-class, linted, extractable
asset.

The coding agent may choose equivalent helper names, test names, and file splits. The converged pointer contract, the
converged documentation shape, the canonical pattern-rule identifiers, the single-owner assignments, the read-only
pull-request gate, the generic-versus-project skill split, and the paired acceptance matrix are prescriptive.

No pre-plan interview was run. The completed audit resolved the relevant design branches, so this plan makes these
assumptions explicit:

1. Plugin runtime behavior, widgets, layouts, theming, AvNav integration, packaging, and release artifacts remain
   unchanged.
2. This repository remains a JavaScript/browser **role model**, not a greenfield template. The greenfield environment
   will be written separately and derived from the converged core this plan produces. Creating that scaffolder, a shared
   npm package, or a generic `doctor` command is out of scope here.
3. This plan **supersedes PLAN40 Status assumption 3** on the repository owner's explicit instruction. A read-only
   pull-request quality workflow is now in scope. The transport-only tag publisher stays transport-only, and no
   CODEOWNERS file, branch ruleset, or pre-commit framework is introduced.
4. Required gates must remain independently runnable and must never read the sibling Polar Recorder checkout.
5. The paired implementation plan is Polar Recorder
   `exec-plans/active/PLAN8.md — Converge the shared quality contract into an extraction-ready common core`.
6. Common alignment means the same guarantees, contracts, and contributor vocabulary — not byte-identical
   product-specific tools.

Repository rules and core principles outrank this plan. If implementation reveals a conflict, amend the active plan with
repository evidence instead of weakening a gate or silently improvising.

---

## Goal

Turn the two independently healthy quality systems into one shared contract with two profile-specific implementations,
so the common core can be lifted into a greenfield generator without further design decisions.

Expected outcomes after completion:

- `CLAUDE.md` and its contract are converged: one pointer shape that passes in both repositories, verified against the
  named preflight files rather than a bare line count.
- Maintained documentation uses one shape — title, `**Status:**`, `## Overview`, `## Key Details`, `## Related` — with
  real content under every required heading.
- Every tracked Markdown file in the maintained surface is both Prettier-formatted and markdownlint-checked; no file is
  formatted-but-unlinted.
- `check-patterns` rules use canonical identifiers and are split into a generic rule set and a project rule set, so the
  generic set is liftable verbatim.
- Each shared concern has exactly one owner: ESLint owns complexity limits from one shared configuration, ESLint owns
  file-overview headers, a generated inventory owns the maintained-file scope, JSON data owns hotspot budgets, and
  Vitest contracts own instruction/documentation shape.
- A read-only pull-request workflow runs the same `check:all` gate that the pre-push hook runs, so enforcement no longer
  depends on a contributor having run `npm run hooks:install`.
- `.agents/skills/` is classified into generic and project skills, is covered by formatting and lint gates, and its
  vendored lock is contract-verified.
- The `SHARED_INSTRUCTIONS` block in `AGENTS.md` encloses only genuinely generic guidance and is mechanically proven
  free of project-specific tokens, making it extractable.
- The full quality gate, hook diagnostics, package checks, and the one-off paired comparison pass from a clean worktree.

---

## Verified Baseline

The following facts were checked against Dyninstruments `397ab8e2` before this plan was written:

1. The worktree is clean on `main` and `exec-plans/active/` contains only its marker file. The next sequential plan
   number is 41.
2. `npm run check:all` passes end to end (exit 0). Aggregate coverage is 92.26% statements, 79.77% branches, 96.83%
   functions, and 93.24% lines. The coverage inventory reports 228 classified production files.
3. There are 445 tracked `tests/**/*.test.js` files. Vitest 4.1.10 runs the `unit-node`, `contract`, and `unit-dom`
   projects; coverage uses `@vitest/coverage-v8`.
4. `.prettierrc.json` sets `printWidth: 120` and `proseWrap: "always"` plus explicit defaults. Polar Recorder sets
   `printWidth: 100` with no `proseWrap`.
5. Adopting Polar Recorder's Prettier settings here would reformat all 88 maintained Markdown files and at least 149
   sampled JavaScript files. Adopting this repository's settings there reformats about 35 Markdown, 66 of 104
   JavaScript/MJS, and 4 JSON/YAML files. The cheaper, single-repository direction is therefore for Polar Recorder to
   adopt this repository's configuration unchanged; no `.prettierrc.json` change is in scope here.
6. `.markdownlint-cli2.jsonc` disables 14 rules and globs only `*.md` and `documentation/**/*.md`. A live run lints 80
   files.
7. Eight tracked Markdown files are Prettier-formatted but never markdownlint-checked: the seven
   `.agents/skills/*/SKILL.md` files and `.githooks/README.md`.
8. Running markdownlint over all 88 tracked non-historical Markdown files with Polar Recorder's stricter rule set
   (`default: true` minus `MD013`, `MD033`, `MD041`) produces **0 issues**. The 14 locally disabled rules are therefore
   unnecessary for the current content.
9. The `ignores` entry `node_modules/**` does not match nested paths such as `.kilo/node_modules/**`. A full-repository
   glob therefore needs `**/node_modules/**`.
10. `tests/contract/ai-instruction-pointer-contract.test.js` requires `CLAUDE.md` to be at most 8 total lines, to
    contain `[AGENTS.md](AGENTS.md)`, and not to contain the `SHARED_INSTRUCTIONS` begin marker. It does not require the
    mandatory preflight file names.
11. Polar Recorder's `tools/check-agents-pointer.mjs`, executed against this repository, fails with three findings: the
    three mandatory preflight file names are absent from `CLAUDE.md`. This repository's `CLAUDE.md` is 6 total and 4
    non-empty lines; Polar Recorder's is 24 total and 17 non-empty lines and fails the 8-line rule here. The two
    contracts are mutually exclusive.
12. `tests/contract/documentation-format-contract.test.js` requires a title, a `**Status:**` line, `## Overview`, and
    `## Related`, and excludes `documentation/TABLEOFCONTENTS.md`.
13. Polar Recorder's `tools/check-doc-format.mjs` additionally requires `## Key Details`. Executed against this
    repository it reports 74 documents checked and 47 failures.
14. `documentation/core-principles.md` has only `## Overview` and `## Related`. It is the highest-precedence document in
    both repositories' stated precedence order.
15. `tools/check-patterns/` defines 41 rule names. Polar Recorder defines 24. Exactly 9 identifiers match:
    `canvas-api-typeof-guard`, `default-truthy-fallback`, `exec-plan-reference`, `framework-method-typeof-guard`,
    `hardcoded-runtime-default`, `premature-legacy-support`, `redundant-null-type-guard`,
    `responsive-layout-hard-floor`, and `try-finally-canvas-drawing`.
16. At least seven further rule pairs express the same concept under different identifiers:
    `absolute-user-home-path`/`absolute-home-path`, `todo-without-owner`/`unowned-todo`, `dead-code`/
    `commented-out-code`, `catch-fallback-without-suppression`/`catch-fallback`, `empty-catch`/`promise-empty-catch`,
    `internal-hook-fallback`/`internal-namespace-fallback`, and `invalid-lint-suppression`/`python-suppression`.
    Equivalence is asserted, not yet proven, for each pair.
17. The engines differ architecturally. This repository uses a declarative `RULES` array with per-rule `scope`,
    `severity`, and suppression support. Polar Recorder uses imperative discovery plus `check*` functions over a flat
    `PATTERN_RULE_IDS` allow-list.
18. `tools/quality-policy/complexity-scan.mjs` runs ESLint with `complexity: 10`, `max-statements: 40`, `max-depth: 4`,
    and `max-params: 6` as warnings and parses the resulting messages. Polar Recorder's
    `tools/quality-policy/eslint.complexity.config.mjs` uses the identical four rules at identical limits as errors.
    **The complexity owner is already the same maintained tool in both repositories**; the limits are duplicated as
    hardcoded literals in each, which is a drift risk.
19. `tools/quality-policy/complexity-baseline.json` holds 175 active legacy entries anchored to a digest-verified
    historical capture. PLAN40 recorded this ratchet as a legitimate, product-specific migration artifact that must not
    be replaced by a greenfield strict-only model. That constraint stands.
20. Hotspot budgets are a hardcoded two-entry array inside `tests/contract/hotspot-budget-contract.test.js`. Polar
    Recorder stores them in `tools/quality-policy/hotspot-budgets.json` with a separate checker.
21. Prettier scope is an inlined glob list duplicated across the `format` and `format:check` scripts in `package.json`.
    Polar Recorder generates `tools/quality-policy/format-scope.json` from
    `git ls-files --cached --others --exclude-standard`, fails a contract test on any unclassified file, and seeds its
    link checker from the same inventory.
22. `.github/workflows/` contains only `publish-release.yml`. It triggers on `v*` tags, declares top-level
    `permissions: contents: read`, and pins `actions/checkout` and `softprops/action-gh-release` by commit SHA. There is
    no pull-request or push quality workflow, so all enforcement depends on the optional `.githooks/pre-push` hook.
23. `.agents/skills/` contains seven skills: `add-widget`, `create-plan`, `doc-sync`, `grill-me-repo`, `mapper-review`,
    `preflight`, and `scan-smells`. `skills-lock.json` pins five upstream skills from `mattpocock/skills` by SHA-256.
    Polar Recorder has no `.agents/` directory and no skill lock.
24. `AGENTS.md` wraps its entire body in `<!-- BEGIN SHARED_INSTRUCTIONS -->` and `<!-- END SHARED_INSTRUCTIONS -->`,
    including project-specific content (Dyni components, gauges, cluster widgets, mapper rules, theme fixtures). Its
    section numbering skips section 3. Polar Recorder's `AGENTS.md` has no markers at all, so the mechanism currently
    delimits nothing generic and cannot be paired.
25. Three concerns carry different file names for the same job: `tools/validate-schemas.mjs` versus
    `tools/check-schema.mjs`, `tools/check-vitest-only.mjs` versus `tools/check-test-focus.mjs`, and
    `documentation/guides/manual-avnav-validation.md` versus `documentation/guides/live-avnav-checklist.md`.
26. `.codex/config.toml` and `schemas/avnav-plugin-base.schema.json` are already byte-identical across both
    repositories. They are the only two shared files that are.
27. `tools/check-file-size.mjs` exempts `exec-plans/` via `/^exec-plans\//`, so this plan file is not subject to the
    400-non-empty-line limit.

---

## Target Alignment Contract

The paired plans use this vocabulary. Profile-specific extensions are allowed only where shown.

| Concern                   | Converged owner                                                            | Dyninstruments implementation                                         |
| ------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| AI instruction pointer    | Vitest contract, preflight-name based                                      | Extend the existing contract test                                     |
| Documentation shape       | Vitest contract, four required elements                                    | Extend the existing contract test                                     |
| Markdown lint             | markdownlint-cli2, `default: true` minus 3 rules                           | Full maintained-surface glob                                          |
| Formatting settings       | This repository's `.prettierrc.json`                                       | Unchanged; Polar Recorder adopts it                                   |
| Maintained-file inventory | Generated scope inventory plus contract test                               | Port the generator; retire inlined globs                              |
| Pattern rules             | Declarative rule array, canonical identifiers                              | Split into generic and project rule sets                              |
| Complexity limits         | ESLint `complexity`/`max-statements`/`max-depth`/`max-params` at 10/40/4/6 | One shared config; the legacy ledger stays a documented local overlay |
| File-overview headers     | `eslint-plugin-jsdoc` `require-file-overview`                              | Already adopted; unchanged                                            |
| Hotspot budgets           | JSON policy data plus a contract test                                      | Move the hardcoded array into JSON                                    |
| Link checking             | linkinator with an externalized config file                                | Already adopted; unchanged                                            |
| Namespace policy          | One configurable generic rule with a repo token                            | Register the `DyniComponents` token                                   |
| Quality enforcement       | Local `check:all` plus a read-only pull-request workflow                   | New workflow; hook and publisher unchanged                            |
| Agent skill layer         | `.agents/skills/` split generic/project, locked                            | Classify existing skills; keep the lock authoritative                 |

Enforcement parity is defined by contract, not by byte identity. Product-coupled implementations may differ; the
contracts they satisfy may not.

---

## Architecture Notes

### The complexity owner was never actually divergent

The audit initially read as "one repository uses a maintained tool and the other does not." Verification shows both run
ESLint with the same four rules at the same limits. The real divergence is that this repository adds a 175-entry legacy
ratchet on top, and that the limit values are hardcoded twice. Convergence therefore means extracting one shared
complexity configuration as the single source of the limits — not deleting a legitimate ratchet. PLAN40's constraint is
preserved intact.

### A generic instruction block must be provable, not asserted

Marking a section "shared" is worthless if nothing checks it. The `SHARED_INSTRUCTIONS` block only becomes an extraction
asset once a contract proves the enclosed text contains no project-specific tokens. That check runs per repository and
needs no access to the sibling checkout, so it satisfies repository independence while still guaranteeing that both
blocks are liftable.

### Inventory generation prevents the class of gap, not just the instance

Seven agent skill files were Prettier-formatted and never markdownlint-checked because two hand-maintained scope lists
disagreed. Widening one glob fixes the instance. Generating the maintained-file inventory from the working tree, and
failing closed on anything unclassified, removes the possibility. Both changes are in scope: the glob fixes today, the
generator prevents tomorrow.

### Role model is not greenfield output

The future generator starts with no historical debt. This repository must keep its proven ratchets — 175 complexity
entries, 12 frozen coverage floors, the digest-anchored capture. No phase may delete valid migration evidence to
resemble an empty project.

---

## Hard Constraints

### Runtime and product behavior

- Do not modify `plugin.js`, `plugin.mjs`, `runtime/`, `cluster/`, `config/`, `shared/`, `widgets/`, layouts, CSS, or
  AvNav runtime behavior.
- Do not add a bundler, runtime build step, browser driver, npm runtime dependency, or ES-module conversion of classic
  runtime scripts.
- Do not change release ZIP contents, widget registrations, user configuration, visuals, or formatter behavior.

### Quality integrity

- Do not lower or delete coverage floors, complexity values, hotspot budgets, file-size limits, strict test
  classifications, type checks, smell rules, documentation checks, or package checks.
- Do not add a suppression, skipped or focused test, coverage exception, formatter ignore, or new debt-baseline entry to
  make a gate pass.
- Keep all 175 complexity entries and the digest-anchored historical capture unchanged except for mechanically justified
  shrinkage caused by unrelated concurrent work.
- Renaming a rule identifier must not change what the rule detects. Every rename needs a proof that the old and new rule
  produce the same findings on the same input before the old identifier is removed.
- Every changed contract needs a focused positive assertion and a focused negative or drift assertion.
- Required gates remain deterministic, external-browser-free, and offline after successful setup. The new pull-request
  workflow may use the network for dependency installation only.

### Repository independence and paired work

- No required script, hook, test, workflow, release command, or documentation checker may resolve `../polarrecorder`.
- The paired checkout may be read only by the final one-off alignment comparison, never by a committed gate.
- Do not create the future scaffolder, shared npm package, or generic project manifest in this plan.
- Do not claim byte identity for product-coupled tools. Record justified differences instead.

### File organization

- Keep all maintained JavaScript, MJS, declaration, and Markdown files below 400 non-empty lines; `exec-plans/` remains
  exempt.
- Check `README.md`, `documentation/conventions/quality-gates.md`, and
  `documentation/conventions/testing-infrastructure.md` before and after edits. Split focused documentation if any
  approaches the limit; do not compress prose.
- Keep plan prose inside `exec-plans/`. No shipped source, test name, config note, or documentation paragraph may cite
  this plan or its phases as authority.

---

## Implementation Order

### Phase A — Reconfirm the paired baseline and freeze the converged contract

Intent: prevent either implementation from landing against stale facts or a different reading of the shared contract.

Dependencies: none.

#### A1. Record standalone evidence

- Run `npm run check:all` from a clean worktree and record the coverage percentages, production-file count, and Vitest
  project results.
- Record the current markdownlint file count, the pattern-rule count, the complexity entry count, and the workflow
  inventory.

#### A2. Confirm the contradiction evidence still reproduces

- Re-run Polar Recorder's pointer checker and documentation-format checker against this repository read-only and confirm
  the three pointer findings and the 47 documentation failures.
- If either number has changed, amend this plan's baseline before proceeding.

#### A3. Agree the converged contract in writing

- Record in this plan's progress section that the Target Alignment Contract table is the frozen reference for both
  repositories, including the decision that Polar Recorder adopts this repository's Prettier configuration unchanged.

Exit conditions: `check:all` green; baseline facts 2, 8, 11, 13, 15, and 22 reconfirmed or amended with evidence.

---

### Phase B — Resolve the AI-instruction pointer contradiction

Intent: make one pointer shape valid in both repositories.

Dependencies: Phase A.

#### B1. Converge the contract semantics

- Change `tests/contract/ai-instruction-pointer-contract.test.js` to assert the converged rule: `CLAUDE.md` contains
  `[AGENTS.md](AGENTS.md)`, does not contain the `SHARED_INSTRUCTIONS` begin marker, has at most 40 non-empty lines, and
  names each of the three mandatory preflight files.
- Additionally assert that every preflight path named in `CLAUDE.md` exists on disk. A pointer to a missing file must
  fail.
- Replace the 8-total-line assertion. A bare total-line cap is the weaker check and is what makes the two contracts
  incompatible.

#### B2. Update the pointer document

- Expand `CLAUDE.md` so it names `documentation/TABLEOFCONTENTS.md`, `documentation/conventions/coding-standards.md`,
  and `documentation/conventions/smell-prevention.md`, keeps the `[AGENTS.md](AGENTS.md)` link, retains the existing
  note that `AGENTS.md` is canonical, and stays at or under 40 non-empty lines.
- Do not re-expand `CLAUDE.md` into a duplicate of `AGENTS.md`.

#### B3. Prove both directions

- Add a negative assertion for each converged rule: missing link, present marker, over-length pointer, missing preflight
  name, and named-but-absent preflight file.
- Verify read-only that the resulting `CLAUDE.md` also satisfies Polar Recorder's current checker, and record the
  result.

Exit conditions: `npm run test:contract` green; the converged contract has one positive and five negative assertions;
`CLAUDE.md` passes both repositories' rules.

---

### Phase C — Resolve the documentation-shape contradiction

Intent: adopt the stricter documentation shape so one contract covers both repositories.

Dependencies: Phase A.

#### C1. Add the required section to the contract

- Change `tests/contract/documentation-format-contract.test.js` to require `## Key Details` in addition to the title,
  `**Status:**` line, `## Overview`, and `## Related`, keeping the `documentation/TABLEOFCONTENTS.md` exception.
- Add a negative assertion proving a document without `## Key Details` fails.

#### C2. Bring the 47 failing documents into shape

- Add a `## Key Details` section to each of the 47 documents that currently lacks one, starting with
  `documentation/core-principles.md`.
- Each new section must carry real content — the concrete facts, values, paths, or contracts a reader needs. Empty or
  placeholder sections are a fail-closed violation, not a step toward one.
- Where a document already states its key facts under `## Overview`, move them rather than duplicating them, so
  `## Overview` keeps its orienting role.

#### C3. Confirm shape convergence

- Re-run Polar Recorder's documentation-format checker against this repository read-only and record that it now reports
  zero failures.

Exit conditions: `npm run check:docformat` and `npm run docs:check` green; 47 documents updated with substantive
content; the sibling checker reports zero failures against this repository.

---

### Phase D — Extend Markdown enforcement to the whole maintained surface

Intent: eliminate the formatted-but-unlinted Markdown surface, including the agent skill layer.

Dependencies: Phase C, so shape and lint changes do not interleave.

#### D1. Converge the markdownlint configuration

- Replace the 14 locally disabled rules with the converged set: `default: true` with only `MD013`, `MD033`, and `MD041`
  disabled, each carrying a one-line reason.
- Change `globs` to `**/*.md`.
- Set `ignores` to `**/node_modules/**`, `coverage/**`, `artifacts/**`, `releases/**`, and `exec-plans/completed/**`.
  The nested-path form is required; `node_modules/**` alone does not match `.kilo/node_modules/**`.

#### D2. Verify the measured zero-violation result

- Run `npm run docs:lint` and confirm it now lints 88 tracked Markdown files plus any active plan, with zero issues.
- If the active plan file reports issues, fix the plan file. Do not re-disable a rule to accommodate it.

#### D3. Lock the coverage relationship

- Add a contract assertion that every tracked Markdown file inside the maintained surface is present in both the
  Prettier scope and the markdownlint scope, so the two can never diverge again.

Exit conditions: `npm run docs:check` green over the full glob; the seven skill files and `.githooks/README.md` are
linted; a contract test fails if a maintained Markdown file is formatted but unlinted.

---

### Phase E — Adopt the canonical pattern-rule namespace and generic/project split

Intent: make the generic rule set liftable verbatim into the future greenfield environment.

Dependencies: Phase A.

#### E1. Prove pair equivalence before renaming

- For each of the seven concept pairs in baseline fact 16, compare the two implementations and record one of:
  equivalent, overlapping, or distinct.
- Rename only proven-equivalent pairs. Keep distinct rules distinct under separate canonical names. `empty-catch` and
  `promise-empty-catch` in particular are expected to be distinct detections; do not collapse them without proof.

#### E2. Apply the canonical identifiers

- Adopt these canonical names where equivalence is proven: `absolute-home-path`, `todo-without-owner`,
  `commented-out-code`, `catch-fallback`, `internal-namespace-fallback`, and `invalid-lint-suppression` with
  per-language scopes.
- Update every rule definition, suppression reference, test name, and documentation mention in the same change.
- Add a drift assertion that the shipped smell catalog and the rule registry list exactly the same identifiers.

#### E3. Split generic from project rules

- Move rules that depend on no Dyninstruments concept into `tools/check-patterns/generic/`, and the rest into
  `tools/check-patterns/project/`.
- Rules referencing mappers, clusters, widgets, themes, layouts, responsive profiles, or the component loader are
  project rules by definition.
- Add a contract assertion that no file under the generic directory references a project-specific token.

Exit conditions: `npm run check:smells` green with an unchanged or larger detection set; every rename backed by a
recorded equivalence proof; the generic directory proven token-free.

---

### Phase F — Give each shared concern exactly one owner

Intent: remove duplicated and hardcoded ownership so the converged core has a single implementation per concern.

Dependencies: Phases D and E.

#### F1. Extract one shared complexity configuration

- Create a single ESLint complexity configuration holding the four rules at 10/40/4/6 as the sole source of those
  limits.
- Change `tools/quality-policy/complexity-scan.mjs` to read the limits from that configuration instead of its hardcoded
  `STRICT_LIMITS` literal.
- Leave `complexity-baseline.json`, the historical capture, and the digest integrity check untouched. Document the
  ledger as a Dyninstruments-local debt overlay above the shared owner, explicitly excluded from the greenfield core.
- Add a drift assertion that no second copy of the limit values exists in the repository.

#### F2. Move hotspot budgets into policy data

- Create `tools/quality-policy/hotspot-budgets.json` holding the two current entries with their exact current values.
- Change `tests/contract/hotspot-budget-contract.test.js` to read that file, keeping its existing positive and negative
  assertions.
- Add an assertion that a budget value may not increase.

#### F3. Generate the maintained-file inventory

- Port a scope generator that classifies every file from `git ls-files --cached --others --exclude-standard` as
  formatter-owned or explicitly unsupported with a reason and an alternate validation owner.
- Replace the inlined glob lists in the `format` and `format:check` scripts with a runner reading that inventory.
- Seed `tools/check-doc-links.mjs` from the same inventory so the link, format, and lint surfaces cannot drift.
- Add a contract test that fails closed on any unclassified file.

#### F4. Converge the remaining names and namespace policy

- Rename `tools/validate-schemas.mjs` to `tools/check-schema.mjs` and `tools/check-vitest-only.mjs` to
  `tools/check-test-focus.mjs`, updating every script and test reference.
- Keep `documentation/guides/manual-avnav-validation.md` as the canonical name; Polar Recorder renames toward it.
- Register the `DyniComponents` namespace token and the `dyni-` CSS custom-property prefix with one configurable generic
  namespace rule, so both repositories enforce namespace policy through the same mechanism.

Exit conditions: `npm run check:core` green; exactly one source for the complexity limits, the hotspot budgets, and the
maintained-file scope; no stale references to the renamed tools.

---

### Phase G — Add the read-only pull-request quality workflow

Intent: stop enforcement from depending on a contributor having activated the local hook.

Dependencies: Phase F, so the workflow runs the converged gate.

#### G1. Add the workflow

- Add `.github/workflows/quality.yml` triggering on `pull_request` and on `push` to the default branch.
- Declare top-level `permissions: contents: read` and grant no write permission to any job.
- Read the Node version from `.nvmrc`, run `npm ci`, run `npm run setup`, then run `npm run check:all`.
- Pin every action by reviewed commit SHA, matching the existing publisher workflow's convention.
- Set an explicit job timeout and a concurrency group that cancels superseded runs for the same ref.

#### G2. Keep the publisher transport-only

- Do not add quality steps to `publish-release.yml` and do not let the new workflow publish, tag, or write artifacts.
- Assert that the new workflow declares no `contents: write` permission and no release step.

#### G3. Extend the workflow contracts

- Extend `npm run actions:lint` coverage and the workflow-shape assertions to both workflow files.
- Assert that the quality workflow's final step invokes `check:all` — not a narrower gate — so the pull-request gate and
  the pre-push hook can never diverge.
- Add the new workflow file to the Prettier scope inventory.

Exit conditions: `npm run actions:lint` green over both workflows; contract assertions cover trigger, permissions, gate
command, and action pinning; `check:all` green locally.

---

### Phase H — Make the agent skill layer extractable

Intent: turn `.agents/skills/` from an unlinted local convenience into a classified, gated, liftable asset.

Dependencies: Phase D, which brings the skill files under lint.

#### H1. Classify the skills

- Record each of the seven skills as generic or project. `preflight`, `create-plan`, `doc-sync`, `scan-smells`, and
  `grill-me-repo` are generic; `add-widget` and `mapper-review` are project-specific.
- Rewrite the five generic skills so their text contains no Dyninstruments-specific concept, keeping their behavior
  intact for this repository.

#### H2. Contract the skill layer

- Add a contract test asserting every `.agents/skills/*/SKILL.md` is in the Prettier scope and the markdownlint scope,
  and that each generic skill is free of project-specific tokens.
- Add a contract test asserting every `skills-lock.json` entry has a source, a source type, and a 64-character SHA-256
  hash, and that the file parses as the pinned shape.

#### H3. Hand the generic set to the paired repository

- Record the five generic skill files and the lock shape in this plan's progress section as the payload Polar Recorder
  adopts, so the paired plan has an exact input.

Exit conditions: seven skills classified; generic skills proven token-free; lock integrity contract-tested; the handoff
payload recorded.

---

### Phase I — Repair and scope the shared instruction block

Intent: make `AGENTS.md` structurally sound and its shared block genuinely generic.

Dependencies: Phases B and H.

#### I1. Fix the document structure

- Renumber the sections so the sequence is contiguous, closing the gap at section 3.
- Verify every internal link still resolves after renumbering.

#### I2. Scope the markers to generic content

- Move the `SHARED_INSTRUCTIONS` markers so they enclose only guidance that holds for any AvNav plugin: the mandatory
  preflight, the precedence order, the documentation-navigation rules, the plan-citation rule, the README sync
  principle, and the quality-checklist skeleton.
- Leave Dyni components, gauges, cluster widgets, mapper rules, theme fixtures, and layout fixtures outside the markers.

#### I3. Prove the block is generic

- Add a contract test asserting the markers exist, are balanced, appear exactly once each, and that the enclosed text
  contains no project-specific token.
- Add a negative assertion proving the check fails when a project token is placed inside the block.

Exit conditions: contiguous section numbering; the enclosed block proven token-free; `npm run docs:check` green.

---

### Phase J — Prove standalone quality and paired alignment

Intent: produce the evidence that this repository is independently green and contract-aligned with its pair.

Dependencies: all previous phases.

#### J1. Run the complete local gate

- Run `npm run check:all` from a clean worktree and record coverage, production-file count, and project results.
- Run `npm run hooks:doctor` and `npm run package:check` and record their output.
- Confirm coverage has not regressed against baseline fact 2 and that the complexity ledger still holds 175 entries.

#### J2. Run the one-off paired comparison

- Read-only, compare against the sibling checkout: the pointer contract semantics and both `CLAUDE.md` files, the
  documentation-shape requirements, the canonical pattern-rule identifier sets, the complexity limit values, the
  markdownlint rule sets, the Prettier configuration files, the workflow inventory and permissions, and the generic
  skill payload.
- Record each comparison as identical, contract-equivalent, or justified difference. Any product-coupled difference must
  carry its justification.
- This comparison is a one-off command run by a human or agent. It must not become a committed gate.

#### J3. Close the plan

- Record completion evidence per phase with dates and command output.
- Move this file to `exec-plans/completed/PLAN41.md` once every acceptance criterion is met and the paired plan has
  reached the same point.

Exit conditions: `check:all` green; no coverage or complexity regression; every paired comparison row recorded; the plan
archived.

---

## User-Facing Documentation Impact

`README.md` changes are **required**. This plan changes the contributor-visible development workflow by adding a
pull-request quality gate, so the development-workflow section must state that pull requests run `check:all`
automatically and that the local hook remains required for pre-push feedback.

Required documentation updates:

1. `README.md` — development workflow: the new pull-request gate, and the unchanged local `check:all` requirement.
2. `CONTRIBUTING.md` — the pull-request gate, the converged documentation shape authors must follow, and the classified
   agent skill layer.
3. `documentation/conventions/quality-gates.md` — the single-owner map for complexity limits, hotspot budgets, the
   maintained-file inventory, and the new workflow; the renamed tools; the distinction between the shared owner and the
   Dyninstruments-local complexity overlay.
4. `documentation/conventions/documentation-format.md` — the added `## Key Details` requirement.
5. `documentation/conventions/smell-prevention.md` — the canonical rule identifiers and the generic/project split.
6. `documentation/conventions/testing-infrastructure.md` — the new and changed contract tests.
7. `documentation/TABLEOFCONTENTS.md` — only if documents are added, moved, or removed.
8. `AGENTS.md` — the renumbering and marker scoping from Phase I.

No user-facing plugin behavior, theming, cluster/kind availability, layout, installation, configuration, or requirement
statement changes, so no other README category applies.

---

## Acceptance Criteria

### Converged contracts

- `CLAUDE.md` satisfies the converged pointer rule and would also pass the sibling repository's checker.
- The pointer contract asserts link presence, marker absence, the non-empty-line cap, all three preflight names, and
  preflight existence, each with a negative assertion.
- Maintained documentation requires title, `**Status:**`, `## Overview`, `## Key Details`, and `## Related`, and all 47
  previously failing documents carry substantive `## Key Details` content.
- The sibling repository's documentation-format checker reports zero failures against this repository.

### Single ownership

- Exactly one source defines the complexity limits, and `complexity-scan.mjs` reads it rather than duplicating it.
- All 175 complexity entries and the digest-anchored capture are unchanged; the ledger is documented as a local overlay.
- Hotspot budgets live in JSON policy data, are read by the contract test, and cannot increase.
- The maintained-file inventory is generated, fails closed on unclassified files, and is the single source for the
  Prettier, markdownlint, and link surfaces.
- `check-schema.mjs` and `check-test-focus.mjs` are the only names in use for those concerns, with no stale references.

### Markdown and rule coverage

- markdownlint runs `default: true` minus exactly `MD013`, `MD033`, and `MD041` over `**/*.md` with nested
  `node_modules` ignored, and reports zero issues.
- The seven skill files and `.githooks/README.md` are linted.
- A contract test fails if any maintained Markdown file is formatted but unlinted.
- Every renamed pattern rule has a recorded equivalence proof; the detection set is unchanged or larger.
- No file under the generic rule directory references a project-specific token.

### Pull-request enforcement

- `.github/workflows/quality.yml` runs on `pull_request` and default-branch `push`, declares only `contents: read`, pins
  every action by SHA, and ends in `npm run check:all`.
- `publish-release.yml` remains transport-only and unchanged in behavior.
- `actions:lint` and the workflow contracts cover both files.

### Agent layer

- All seven skills are classified; the five generic skills are proven token-free.
- `skills-lock.json` entry shape and hash format are contract-tested.
- The generic payload handed to the paired repository is recorded.

### Instruction block

- `AGENTS.md` section numbering is contiguous.
- The `SHARED_INSTRUCTIONS` block encloses only generic guidance and is proven free of project-specific tokens, with a
  negative assertion.

### Completion

- `npm run check:all`, `npm run hooks:doctor`, and `npm run package:check` pass from a clean worktree.
- Coverage is at or above baseline fact 2; no floor, threshold, or budget was lowered.
- Every paired-comparison row is recorded as identical, contract-equivalent, or a justified difference.
- The plan is archived to `exec-plans/completed/PLAN41.md`.

---

## Progress / Completion Evidence

Record per-phase evidence here during implementation: the command run, its summary output, the files changed, and the
date. Keep the paired-comparison table from Phase J2 in this section.

### Phase A — 2026-07-27

- `npm run check:all` (clean worktree, only `exec-plans/active/PLAN41.md` untracked): exit 0. Coverage 92.26%
  statements, 79.77% branches, 96.83% functions, 93.24% lines. Coverage inventory: 228 classified production files.
  Matches baseline fact 2 exactly.
- `find tests -name "*.test.js" | wc -l` → 445, matching baseline fact 3.
- `npx markdownlint-cli2` → "Linting: 80 files", "Summary: 0 issues in 0 files", matching baseline fact 6.
- Pattern rule count: `grep -ohP 'name:\s*"[a-z0-9-]+"' tools/check-patterns/rules-*-defs.mjs | sort -u | wc -l` → 41,
  matching baseline fact 15.
- `node -e "require('./tools/quality-policy/complexity-baseline.json').length"` → 175 entries, matching baseline
  fact 19.
- `.github/workflows/` contains only `publish-release.yml`, matching baseline fact 22.
- A2 (read-only, not a committed gate): imported `../polarrecorder/tools/check-agents-pointer.mjs` and
  `../polarrecorder/tools/check-doc-format.mjs` and called their exported functions with `root` pointed at this
  checkout.
  - `runAgentsPointerCheck({root: "./dyninstruments"})` → `ok: false`, 3 failures, one per missing mandatory preflight
    name. Matches baseline fact 11 exactly.
  - `runDocFormatCheck({root: "./dyninstruments"})` → `checkedDocs: 74`, `failures: 47`. Matches baseline facts 13/15
    exactly.
- A3: the Target Alignment Contract table above is frozen as the reference for both repositories, including the decision
  that Polar Recorder adopts this repository's `.prettierrc.json` unchanged (baseline fact 5).
- Conclusion: all baseline facts checked in Phase A reproduce exactly as recorded. No amendment needed. Proceeding to
  Phase B.

### Phase B — 2026-07-27

- Changed `tests/contract/ai-instruction-pointer-contract.test.js`: converged rule now asserts AGENTS.md link presence,
  marker absence, a 40 non-empty-line cap (was an 8-total-line cap), all three mandatory preflight names, and on-disk
  existence of each named preflight file. Added five negative assertions: missing link, present marker, over-length
  pointer, missing preflight name, and named-but-absent preflight file (via a fake root).
- Changed `CLAUDE.md`: added the three mandatory preflight file names while keeping the AGENTS.md link and the
  canonical-file note; stays at 9 non-empty lines, under the 40-line cap.
- `npx vitest run --project contract tests/contract/ai-instruction-pointer-contract.test.js` → 6/6 passed.
- `npx vitest run --project contract` (full contract project) → 30 files, 145 tests passed.
- Re-ran Polar Recorder's `check-agents-pointer.mjs` read-only against the updated `CLAUDE.md`:
  `{"ok": true, "failures": []}` — the pointer now satisfies both repositories' rules.
- `npm run format` reformatted `CLAUDE.md`, the contract test file, and `exec-plans/active/PLAN41.md` (Prettier
  compressed one assertion into a long-packed one-liner; restructured it into a named `hasLineCapFailure` variable to
  clear `check-filesize`'s oneliner detector).
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
  Files changed: `CLAUDE.md`, `tests/contract/ai-instruction-pointer-contract.test.js`.
- Proceeding to Phase C.

### Phase C — 2026-07-27

- Baseline correction: the plan's Goal/Phase C2 text says "47 documents"; the exact reproducible figure (baseline
  fact 13) is 74 documents checked with 47 total findings across 45 distinct documents — one document
  (`documentation/TABLEOFCONTENTS.md`) was missing all three required sections (3 findings) and 44 others were missing
  only `## Key Details` (1 finding each): 3 + 44 = 47 findings, 45 documents. This is a plan-prose imprecision, not a
  baseline-fact mismatch (fact 13's numbers reproduced exactly); recorded here rather than as a formal amendment since
  no gate or baseline was contradicted.
- C1: added `"Key Details"` to `REQUIRED_SECTIONS` in `tests/contract/documentation-format-contract.test.js`, keeping
  the `documentation/TABLEOFCONTENTS.md` exception. Added a negative assertion for a document missing `## Key Details`.
- C2: added a substantive `## Key Details` section (concrete file paths, function/module names, constants, prop
  contracts — not restated Overview prose) to all 45 affected documents, dispatched across 5 parallel batches by
  documentation subtree (architecture: 7 files; avnav-api: 4 files; conventions+guides incl. `core-principles.md`: 10
  files; linear/radial/shared: 9 files; widgets: 14 files) plus `documentation/TABLEOFCONTENTS.md` handled directly
  (added `## Overview`, `## Key Details`, and `## Related`, even though it stays exempt from this repository's own
  contract, so the sibling checker — which has no such exception — also reports zero failures on it).
- Adding `## Key Details` to `documentation/radial/gauge-shared-api.md` pushed it to 402 total lines, over the
  repository's 400-line Markdown limit (counted as total lines, not non-empty, per
  `documentation/conventions/coding-standards.md#file-size-limits`). Per "Repo Rules Override Exec-Plans," split the
  file: extracted the low-level per-module API reference (Angle/Tick API, Canvas Text Helper API, ValueMath API,
  TextLayoutEngine API, Semicircle/FullCircle engine/layout/text-layout APIs and `spec` field tables) into a new
  `documentation/radial/gauge-shared-api-reference.md` (221 lines), leaving `gauge-shared-api.md` at 210 lines (facade
  overview, Key Details, Responsive Ownership Contract, Module Registration, Access Pattern, GaugeToolkit/RadialToolkit
  facades, Draw API, Related). Verified no existing doc links referenced anchors inside the moved sections (all incoming
  links were whole-file references); added the new file to `documentation/TABLEOFCONTENTS.md` and to
  `gauge-shared-api.md`'s `## Related` section.
- `npx vitest run --project contract tests/contract/documentation-format-contract.test.js` → 6/6 passed.
- Re-ran Polar Recorder's `check-doc-format.mjs` read-only against the repository:
  `{"ok": true, "checkedDocs": 75, "failures": 0}` (75 because of the new split-out file) — zero failures, confirming
  shape convergence (C3).
- `npm run format` reformatted the touched Markdown files (whitespace/table-column alignment only, no content changes).
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
  `check:filesize` clean (no file-size or oneliner violations) after the split.
- Files changed: `tests/contract/documentation-format-contract.test.js`; 44 existing documentation files gained
  `## Key Details`; `documentation/TABLEOFCONTENTS.md` gained `## Overview`/`## Key Details`/`## Related` plus a new nav
  entry; `documentation/radial/gauge-shared-api.md` trimmed; new file
  `documentation/radial/gauge-shared-api-reference.md` created.
- Proceeding to Phase D.

### Phase D — 2026-07-27

- D1: rewrote `.markdownlint-cli2.jsonc` — `globs` changed to `["**/*.md"]`; `ignores` set to
  `["**/node_modules/**", "artifacts/**", "coverage/**", "exec-plans/completed/**", "releases/**"]` (nested
  `**/node_modules/**` form per the hard constraint); `config` reduced from 14 disabled rules to exactly `MD013`,
  `MD033`, `MD041`, each with an inline one-line reason comment.
- Baseline fact 8 did not reproduce: running the converged config over the full corpus (not the narrower 88-file slice
  originally sampled) surfaced 36 real issues in 13 pre-existing files — confirmed against unmodified `git show HEAD`
  content for four of those files (`add-new-gauge.md`, `gauge-style-guide.md`, `clock-gauge.md`, `AGENTS.md`), which
  independently reproduced 10 of the 36 issues, proving they predate this plan's edits and are not an artifact of Phase
  C. Recorded here as a baseline correction rather than silently suppressing rules to reach green: fixed every root
  cause instead of disabling a rule — 7 missing fenced-code-block languages (`AGENTS.md` x3,
  `.agents/skills/{add-widget,mapper-review,preflight}/SKILL.md`, `documentation/widgets/clock-gauge.md`), 5 table rows
  with unescaped literal `|` inside inline code that broke column counts
  (`documentation/architecture/host-commit-controller.md`, `documentation/conventions/smell-prevention.md` x3,
  `documentation/widgets/clock-gauge.md`), 17 ordered-list-restart violations across 5 guide files resolved either by
  switching the interrupted list to literal `1.` auto-numbering (GFM renders the correct sequence regardless of literal
  marker) or by re-indenting a fenced block so it stays inside its list item instead of breaking the list
  (`add-new-gauge.md`, `add-new-html-kind.md`, `add-new-text-renderer.md`, `documentation-maintenance.md`,
  `release-workflow.md`), and 3 emphasis-used-as-heading violations converted to real `####` headings
  (`documentation/radial/gauge-style-guide.md`). No rule was re-disabled or suppressed to reach zero issues.
- D2: `npx markdownlint-cli2` → "Linting: 90 files", "Summary: 0 issues in 0 files" (88 tracked maintained files plus
  the untracked active plan and the untracked new `gauge-shared-api-reference.md` created earlier in this session).
- D3: added `.githooks` to `MAINTAINED_MARKDOWN_ROOTS` in `tests/contract/formatting-scope-contract.test.js` and added
  `\".githooks/**/*.md\"` to the `format`/`format:check` npm scripts, so `.githooks/README.md` is now covered by both
  surfaces (closing baseline fact 7's gap). Added a new contract test reading `.markdownlint-cli2.jsonc`'s `ignores` via
  `jsonc-parser` (already a direct dependency) and asserting no maintained Markdown file matches an ignore pattern, plus
  a positive/negative proof test. Deliberately did not add a new runtime dependency for glob matching — the ignore
  patterns are simple enough for a small local `globToRegExp` helper.
- `npx vitest run --project contract tests/contract/formatting-scope-contract.test.js` → 12/12 passed.
- `npm run format` reformatted only whitespace; `npm run check:all` → exit 0, coverage unchanged at
  92.26%/79.77%/96.83%/93.24%, 228 classified production files.
- Files changed: `.markdownlint-cli2.jsonc`, `package.json` (format/format:check scripts),
  `tests/contract/formatting-scope-contract.test.js`, `AGENTS.md`, `.agents/skills/add-widget/SKILL.md`,
  `.agents/skills/mapper-review/SKILL.md`, `.agents/skills/preflight/SKILL.md`,
  `documentation/architecture/host-commit-controller.md`, `documentation/conventions/smell-prevention.md`,
  `documentation/guides/add-new-gauge.md`, `documentation/guides/add-new-html-kind.md`,
  `documentation/guides/add-new-text-renderer.md`, `documentation/guides/documentation-maintenance.md`,
  `documentation/guides/release-workflow.md`, `documentation/radial/gauge-style-guide.md`,
  `documentation/widgets/clock-gauge.md`.
- Proceeding to Phase E.

### Phase E — 2026-07-27

- E1: compared all 7 concept pairs from baseline fact 16 against the sibling implementation. Only
  `absolute-user-home-path`/`absolute-home-path` proved EQUIVALENT (byte-identical detection regex
  `/(?:\/home\/[A-Za-z0-9_.-]+\/|\/Users\/[A-Za-z0-9_.-]+\/)/`). The other 6 pairs are NOT equivalent and were kept
  distinct per the hard constraint ("renaming must not change what the rule detects"):
  - `todo-without-owner`/`unowned-todo`: OVERLAPPING, not equivalent — ours flags four task-marker keywords, theirs only
    two, and ours uses a looser owner-format check than their strict `NAME(owner, YYYY-MM-DD):` regex. Our name already
    matches the canonical target, so no rename was needed; behavior stays as-is.
  - `dead-code`/`commented-out-code`: DISTINCT — ours flags unreferenced function declarations and
    `if(true)`/`if(false)` literal branches; theirs flags 3+ consecutive `//`-commented code-shaped lines. Entirely
    different smell classes.
  - `catch-fallback-without-suppression`/`catch-fallback`: OVERLAPPING, not equivalent — theirs explicitly excludes
    empty catch bodies (delegated to their own empty-catch-like rule) and inlines its own boundary-marker check; ours
    does not exclude empty bodies within this rule's regex, so the same `catch(e){}` input produces a different finding
    count between the two implementations.
  - `empty-catch`/`promise-empty-catch`: DISTINCT as the plan required — ours matches `catch(...){}` (try/catch
    statement syntax); theirs matches `.catch(function(){})`/`.catch(() => {})` (Promise method-call syntax).
  - `internal-hook-fallback`/`internal-namespace-fallback`: DISTINCT — ours flags `normalize*`-named functions with a
    `fallback`-named parameter (plus a separate `cfg.*() || ...` check); theirs flags `Namespace.X.Helper(...) || fb`
    call-site re-defaulting. No shared detection surface.
  - `invalid-lint-suppression`/`python-suppression`: same umbrella concept (malformed suppression-directive detection)
    scoped per language — theirs targets Python `# noqa`/`# type: ignore` syntax, which does not exist in this
    repository (browser-only JS plugin, no Python). Our name already matches the canonical umbrella name; no rename
    needed.
- E2: renamed `absolute-user-home-path` to `absolute-home-path` everywhere it appears —
  `tools/check-patterns/*/rules-regex-*-defs.mjs`, `tools/test-data/check-patterns-failfast-cases.js` (including its two
  suppression-comment fixtures), `documentation/conventions/smell-prevention.md`,
  `documentation/guides/documentation-maintenance.md`, `tests/contract/smell-catalog-coverage-contract.test.js`.
  Verified via `npm run check:patterns` (0 failures, rule reported as `absolute-home-path` in `byRule`) and
  `npx vitest run --project unit-node tests/tools/check-patterns.failFastRuleCases.test.js` (52/52 passed). The existing
  `tests/contract/smell-catalog-coverage-contract.test.js` already serves as the drift assertion that the shipped smell
  catalog and the rule registry list the same identifiers.
- E3: split `tools/check-patterns/` into `generic/` (19 rules) and `project/` (22 rules) subdirectories, based on
  whether a rule's name/detection/message references a Dyninstruments-specific concept (mapper, cluster, widget, theme,
  layout, responsive profile, or component loader). For the 5 mixed-category source files (`rules-failfast`,
  `rules-regex`, `rules-core`, `rules-atomicity`, `rules-legacy-support`), split only the declarative `-defs.mjs`
  metadata (name/scope/message) into new `generic/`/`project/` sibling files, keeping the underlying runner-function
  implementation modules (`rules-failfast.mjs`, `rules-core.mjs`, etc.) at the top level as shared implementation
  referenced by both sides — the same declarative/implementation separation this codebase already used before the split.
  For the 6 pure-category source files, moved the whole rule (both defs and, where self-contained, the runner) into the
  matching directory. Reworded two messages that hardcoded project-specific remediation paths (`empty-catch`,
  `unsafe-html-dom-sink`) to generic guidance, since message wording is not part of a rule's "detection" and this is
  required for the generic set to be genuinely liftable. `rules.mjs` now exports `GENERIC_RULES`, `PROJECT_RULES`, and
  `RULES` (their concatenation); `check-patterns.mjs` is unchanged (it only consumes the `RULES` array). Added
  `tests/contract/pattern-rule-generic-scope-contract.test.js`: a positive assertion that no generic rule's
  name/detect-source/rendered-message contains a project-specific token, a negative proof with a seeded
  `componentContext`-referencing rule, and an assertion that both rule sets are non-empty and sum to the total. Updated
  `tsconfig.tools.json`'s file inventory to the new paths (caught by
  `tests/contract/typecheck-tools-inventory-contract.test.js`), and added the new test file to
  `tools/quality-policy/test-inventory.json` and `tsconfig.tests.json` (caught by `test-inventory.mjs` and
  `tests/contract/typecheck-tests-inventory-contract.test.js`).
- `node -e "import('./tools/check-patterns/rules.mjs')..."` → 41 total rules preserved (19 generic + 22 project, same 41
  names as before the split).
- `npm run check:patterns` → 0 failures across all 41 rules, 1017 files checked.
- `npx vitest run --project unit-node tests/tools/` → 27 files, 302 tests passed.
- `npx vitest run --project contract` → 30 files, 148 tests passed (including the new
  `pattern-rule-generic-scope-contract.test.js`, 3/3).
- `npm run typecheck` → clean after adding the moved/new file paths to `tsconfig.tools.json` and `tsconfig.tests.json`.
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
- Files changed: deleted
  `tools/check-patterns/rules-{failfast,regex,core,atomicity,legacy-support,duplicates, unsafe-sink,redundant-fallback,mapper,responsive,mapper-complexity}-defs.mjs`;
  added 16 new files under `tools/check-patterns/generic/` and `tools/check-patterns/project/`; rewrote
  `tools/check-patterns/rules.mjs`; renamed `absolute-user-home-path` to `absolute-home-path` in 5 files; added
  `tests/contract/pattern-rule-generic-scope-contract.test.js`; updated `tsconfig.tools.json`, `tsconfig.tests.json`,
  `tools/quality-policy/test-inventory.json`.
- Proceeding to Phase F.

### Phase F — 2026-07-27

- F1: created `tools/quality-policy/eslint-complexity-config.mjs` exporting `STRICT_LIMITS` (the four numeric limits)
  and `STRICT_COMPLEXITY_RULES` (the ESLint rule-config fragment built from them) as the single source. Changed
  `tools/quality-policy/complexity-scan.mjs` to import both instead of declaring its own `STRICT_LIMITS` literal (kept
  re-exporting `STRICT_LIMITS` so `complexity-budget.mjs` and `historical-complexity-capture.mjs` need no changes).
  Added `tests/contract/complexity-limit-single-owner-contract.test.js`: scans every `tools/**/*.mjs` file for the four
  limit values declared together and asserts only the new owner module does so, plus a seeded-drift negative proof.
  `complexity-baseline.json`, the historical capture, and the digest were not touched; verified via
  `npm run check:complexity` → digest `6cb1b99a13afea4bc95111d76bef23cd8b6f23ae23cbf038049835046d0dd207` unchanged, 175
  baseline entries, 0 new violations.
- F2: created `tools/quality-policy/hotspot-budgets.json` with the two existing entries at their exact current values.
  Rewrote `tests/contract/hotspot-budget-contract.test.js` to read the JSON policy file (keeping its existing
  positive/negative assertions) and added a frozen-ceiling check: a `FROZEN_MAX_BUDGETS` reference table in the test
  asserts no policy value exceeds its frozen counterpart, so raising a budget requires a deliberate reviewed co-edit of
  both files — the same hash-locked-floor pattern this repo already uses for coverage, not a live git-diff dependency.
- F3: ported a generated maintained-file scope inventory. `tools/quality-policy/generate-format-scope.mjs` classifies
  every `git ls-files --cached --others --exclude-standard` entry as `prettier` or `unsupported` (with a reason and
  alternate-validation owner), excluding `releases/**` and `exec-plans/completed/**` as historical/non-maintained.
  Verified the classifier reproduces the exact prior effective Prettier scope (982 files, 0 missing, 0 unintended
  additions) before wiring it in. `tools/quality-policy/run-format.mjs` reads the committed
  `tools/quality-policy/format-scope.json` and shells out to Prettier in write or check mode; `format`/`format:check` in
  `package.json` now call it instead of carrying two duplicated inline glob lists, and a new `format:scope` script
  regenerates the committed JSON. Added `tests/contract/format-scope-contract.test.js` (owner sanity, reason
  completeness, committed-vs-fresh drift, known-family classification, historical exclusion, fail-closed unclassified
  proof — mirroring the sibling repository's `format-scope.test.mjs` shape). Rewrote `collectPrettierScope()` in
  `tests/contract/formatting-scope-contract.test.js` to read `format-scope.json` instead of parsing now-nonexistent CLI
  glob tokens from the npm scripts; its 12 existing assertions still hold, and the "format and format:check target the
  same file set" assertion is now true by construction (both scripts read the same file). Seeded
  `tools/check-doc-links.mjs`'s Markdown file list from the same `format-scope.json` inventory (replacing its own
  hand-rolled directory walk); the link-check scope grew from 99 to 109 links because it now also covers
  `.agents/skills/*.md` and `.githooks/*.md`, and `npm run docs:links` still passes. While regenerating the inventory,
  discovered and fixed a real bug: Phase E's 10 deleted rule-defs files were removed with `rm` rather than `git rm`, so
  they were still present in git's index; staged the deletions (`git add`) once the inventory generator surfaced them as
  phantom entries.
- F4: renamed `tools/validate-schemas.mjs` → `tools/check-schema.mjs` and `tools/check-vitest-only.mjs` →
  `tools/check-test-focus.mjs` (`git mv`), updating the two `package.json` script references and the two
  `tsconfig.tools.json` inventory entries; neither file exports anything else imports, so no other cross-references
  existed. `documentation/guides/manual-avnav-validation.md` already carries the canonical name, so no change was needed
  on this side of that item. Implemented the namespace-policy rule from scratch — neither repository had one yet:
  `tools/check-patterns/generic/namespace-policy.mjs` is a configurable generic runner (reads `rule.jsGlobalPrefix` /
  `rule.cssCustomPropertyPrefix` from the rule definition, contains no Dyninstruments token itself) that flags a
  `(window|root|global|self).<PascalCase> =` assignment or a CSS custom-property declaration not matching the configured
  prefix. `tools/check-patterns/project/rules-namespace-policy-defs.mjs` registers this repository's tokens
  (`jsGlobalPrefix: "Dyni"`, `cssCustomPropertyPrefix: "--dyni-"`) as the new `namespace-token-consistency` rule.
  Verified against the live codebase first (every `window.*`/`root.*` global assignment already uses `Dyni*`, every CSS
  custom property already uses `--dyni-*`) before wiring it into `PROJECT_RULES`, so it landed with 0 findings. Added a
  catalog row and executable-index entry to `documentation/conventions/smell-prevention.md` (required by the existing
  smell-catalog-coverage-contract test) and a dedicated fixture test
  `tests/tools/check-patterns-namespace-policy.test.js` (positive/negative for both the JS-global and CSS-property
  branches), matching the existing per-rule-family test-file convention (`check-patterns-responsive.test.js` etc.).
- `npm run check:patterns` → 0 failures across 42 rules (41 + the new namespace rule), 1027 files checked.
- `npx vitest run --project contract tests/contract/complexity-limit-single-owner-contract.test.js` → 3/3;
  `tests/contract/hotspot-budget-contract.test.js` → 5/5; `tests/contract/format-scope-contract.test.js` → 6/6;
  `tests/contract/formatting-scope-contract.test.js` → 12/12; `tests/contract/smell-catalog-coverage-contract.test.js` →
  3/3.
- `npx vitest run --project unit-node tests/tools/check-patterns-namespace-policy.test.js` → 4/4.
- `npm run typecheck` → clean after adding every new/moved file to `tsconfig.tools.json`/`tsconfig.tests.json` and the
  new test files to `tools/quality-policy/test-inventory.json`.
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
  Complexity ledger unchanged at 175 entries, digest verified.
- Files changed (new): `tools/quality-policy/eslint-complexity-config.mjs`, `tools/quality-policy/hotspot-budgets.json`,
  `tools/quality-policy/generate-format-scope.mjs`, `tools/quality-policy/run-format.mjs`,
  `tools/quality-policy/format-scope.json`, `tools/check-patterns/generic/namespace-policy.mjs`,
  `tools/check-patterns/project/rules-namespace-policy-defs.mjs`,
  `tests/contract/complexity-limit-single-owner-contract.test.js`, `tests/contract/format-scope-contract.test.js`,
  `tests/tools/check-patterns-namespace-policy.test.js`; renamed `tools/validate-schemas.mjs` →
  `tools/check-schema.mjs`, `tools/check-vitest-only.mjs` → `tools/check-test-focus.mjs`; modified
  `tools/quality-policy/complexity-scan.mjs`, `tests/contract/hotspot-budget-contract.test.js`,
  `tests/contract/formatting-scope-contract.test.js`, `tools/check-doc-links.mjs`, `tools/check-patterns/rules.mjs`,
  `package.json`, `tsconfig.tools.json`, `tsconfig.tests.json`, `tools/quality-policy/test-inventory.json`,
  `documentation/conventions/smell-prevention.md`.
- Proceeding to Phase G.

### Phase G — 2026-07-27

- G1: added `.github/workflows/quality.yml`, triggering on `pull_request` and `push` to `main`, with top-level
  `permissions: contents: read` and no job-level write grant. Reads the Node version from `.nvmrc`, pins
  `actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd` (v6.0.2, same SHA already used by `publish-release.yml`)
  and `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (v7.0.0) — looked up and verified independently via
  the GitHub API (tag → ref SHA → commit lookup, signed commit) rather than guessed, since action pinning is a
  supply-chain-security-sensitive value. Runs `npm ci`, `npm run setup`, then `npm run check:all`. Sets
  `timeout-minutes: 30` and a `concurrency` group keyed on workflow+ref with `cancel-in-progress: true`.
- G2: `publish-release.yml` was not touched; confirmed via the new `quality-workflow-contract.test.js` that
  `quality.yml` declares no `contents: write` and includes no `action-gh-release` step.
- G3: extended the release-workflow contract's file-list assertion to expect both workflow files. `npm run actions:lint`
  already covers `quality.yml` with no code change, since `tools/actionlint.sh` scans `.github/workflows/*.yml` by
  actionlint's own default discovery. `quality.yml` was picked up by the Phase F3 `format-scope.json` generator
  automatically (its `PRETTIER_DIR_RULES` already match `.github/workflows/*.yml`), so no separate Prettier-scope change
  was needed. Added `tests/contract/quality-workflow-contract.test.js`: trigger shape, permissions (positive +
  negative), concurrency/timeout, SHA-pinning, the final step being exactly `npm run check:all` (not a narrower gate),
  and the exact ordered list of run commands.
- `npx vitest run --project contract tests/contract/quality-workflow-contract.test.js tests/contract/release-workflow-contract.test.js`
  → 10/10 passed.
- `bash tools/actionlint.sh -color` → clean (no output) across both workflow files.
- `npm run format:scope && npm run format` → regenerated the inventory and formatted the two new/changed files.
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
- Files changed: new `.github/workflows/quality.yml`, new `tests/contract/quality-workflow-contract.test.js`; modified
  `tests/contract/release-workflow-contract.test.js`, `tools/quality-policy/format-scope.json`,
  `tools/quality-policy/test-inventory.json`, `tsconfig.tests.json`.
- Proceeding to Phase H.

### Phase H — 2026-07-27

- H1: classified the seven skills — `preflight`, `create-plan`, `doc-sync`, `scan-smells`, `grill-me-repo` generic;
  `add-widget`, `mapper-review` project-specific (per the plan's own classification, unchanged). Rewrote the five
  generic skills to remove every project-specific token while preserving their behavioral structure: `preflight`
  (task-classification table and doc-routing genericized; per-category examples became generic categories),
  `create-plan` (dispatch/registration examples genericized; "mapper" generalized to "dispatch/branching logic";
  hardcoded 400-line references generalized to "check your project's conventions"), `doc-sync` (the touchpoint matrix's
  concrete file/API names replaced with generic change-category rows), `scan-smells` (the largest file; every code
  example rewritten with generic function/variable names — `formatValue()` instead of
  `componentContext.format.applyFormatter`, `--app-fg` instead of `--dyni-fg`, `ScaleProfile` instead of
  `ResponsiveScaleProfile` — and the `mapper-*`/`widget-renderer-*` rule-name examples renamed to
  `adapter-*`/`component-renderer-*`), `grill-me-repo` (all ten interview branches kept, each concrete AvNav/Dyni
  question — cluster naming, store keys, formatter names — rewritten as a generic "ask the user to identify the
  equivalent concept, grounded by reading an existing example" instruction, preserving the interview's rigor without
  naming a single product concept).
- H2: added `tests/contract/skill-layer-contract.test.js` — asserts the exact seven-skill generic/project partition,
  scans every generic skill file's raw text for a fixed forbidden-token list (`Dyni`, `dyninstruments`, `AvNav`,
  `avnav`, `componentContext`, `ClusterWidget`, `mapper`, `ResponsiveScaleProfile`, `widget-kits`) with a seeded
  negative proof, and validates every `skills-lock.json` entry has a non-empty `source`, a `sourceType` string, and a
  `computedHash` matching `^[0-9a-f]{64}$` (SHA-256 hex), with a seeded malformed-length negative proof. All seven
  `SKILL.md` files were already covered by both the Prettier scope (Phase F3's `format-scope.json`) and the markdownlint
  scope (Phase D) before this phase started, so no additional coverage wiring was needed here.
- H3: handoff payload for the paired repository — the five generic skill files
  (`.agents/skills/{preflight,create-plan,doc-sync,scan-smells,grill-me-repo}/SKILL.md`, now token-free per the contract
  above) plus the `skills-lock.json` shape
  (`{ version: 1, skills: { <name>: { source, sourceType, computedHash: <64-char SHA-256 hex> } } }`) are the exact
  payload Polar Recorder's paired plan should adopt to establish its own `.agents/` directory and skill lock.
- `grep -inE "\\bDyni|dyninstruments|\\bAvNav\\b|avnav|componentContext|ClusterWidget|\\bmapper\\b|ResponsiveScaleProfile|widget-kits"`
  over all five generic skill files → zero matches.
- `npx vitest run --project contract tests/contract/skill-layer-contract.test.js` → 6/6 passed.
- `npx markdownlint-cli2` → "Linting: 90 files", "Summary: 0 issues in 0 files" (unchanged file count; content only).
- `npm run format:scope && npm run format` → regenerated the inventory; skill files already matched Prettier style.
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
- Files changed: `.agents/skills/preflight/SKILL.md`, `.agents/skills/create-plan/SKILL.md`,
  `.agents/skills/doc-sync/SKILL.md`, `.agents/skills/scan-smells/SKILL.md`, `.agents/skills/grill-me-repo/SKILL.md`,
  new `tests/contract/skill-layer-contract.test.js`; modified `tools/quality-policy/format-scope.json`,
  `tools/quality-policy/test-inventory.json`, `tsconfig.tests.json`.
- Proceeding to Phase I.

### Phase I — 2026-07-27

- I1: renumbered `AGENTS.md`'s sections into one contiguous sequence, `0` through `12`, closing the gap at the old
  section `3`. Confirmed no other file linked to an `AGENTS.md#section-anchor` fragment before renumbering
  (`grep -rn "AGENTS.md#"` across `*.md`/`*.js`/`*.mjs` → zero matches), so no cross-reference repair was needed.
- I2: moved the `SHARED_INSTRUCTIONS` markers so they enclose only genuinely generic guidance: the mandatory preflight
  (§0), the precedence order (still §0), the documentation-navigation rule (§1), a newly-added plan-and-phase-citation
  rule (§2 — this rule existed only as an enforced `check-patterns` regex before; it had no prose statement in
  `AGENTS.md` at all, so this is new content, not a reformulation), a genericized README-sync principle (§3, dropped the
  itemized AvNav-specific category list), and a genericized quality-checklist skeleton (§4, dropped every
  AvNav/Dyni-specific line item). Everything that names Dyni components, gauges, cluster widgets, mapper rules, theme
  fixtures, or layout fixtures moved outside the markers into new sections §5–§12: Project Constraints, the
  Documentation Structure Reference (the concrete tree diagram and the `BarometerGauge` example), File Map, the full
  project-specific Quality Checklist, Smell Prevention & Fail-Closed Rules, Code Hygiene Rules, the itemized README-sync
  categories, and Fail-Closed Fixture/Test Sync Rules.
- I3: added `tests/contract/shared-instructions-block-contract.test.js` — asserts the markers exist exactly once each
  and in the correct order, scans the enclosed text for the same forbidden-token list used in Phase H's skill-layer
  contract (`Dyni`, `dyninstruments`, `AvNav`, `avnav`, `componentContext`, `ClusterWidget`, `mapper`,
  `ResponsiveScaleProfile`, `widget-kits`) with a seeded negative proof, and asserts the `## N.` section numbers form a
  contiguous `0..len-1` sequence.
- `grep -n "^## [0-9]" AGENTS.md` → `0` through `12`, no gaps, no duplicates.
- `npx vitest run --project contract tests/contract/shared-instructions-block-contract.test.js` → 4/4 passed.
- `npm run docs:check` → all six sub-checks green; `npm run docs:links` reports 109 links checked (unchanged from Phase
  F3, confirming the restructuring didn't break any link), `check:reachability` (4/4) and `check:docformat` (6/6) both
  green — `AGENTS.md` itself is outside the `documentation/` tree so the format-shape contract doesn't apply to it, but
  the reachability graph still resolves through it correctly.
- `npm run check:all` → exit 0. Coverage unchanged at 92.26%/79.77%/96.83%/93.24%, 228 classified production files.
- Files changed: `AGENTS.md` (restructured), new `tests/contract/shared-instructions-block-contract.test.js`; modified
  `tools/quality-policy/format-scope.json`, `tools/quality-policy/test-inventory.json`, `tsconfig.tests.json`.
- Proceeding to Phase J.

### Phase J — 2026-07-27

- J1: `npm run check:all` → exit 0 from the current worktree. Coverage 92.26% statements, 79.77% branches, 96.83%
  functions, 93.24% lines — exactly matches Verified Baseline fact 2, no regression. `npm run hooks:doctor` → "Local
  pre-push hook is correctly installed (core.hooksPath=.githooks, executable)." `npm run package:check` → Ajv schema
  validation passed, 19/19 package tests passed. Complexity ledger: `complexity-baseline.json` still has 175 entries;
  `npm run check:complexity` verifies the historical-capture digest
  (`6cb1b99a13afea4bc95111d76bef23cd8b6f23ae23cbf038049835046d0dd207`, unchanged from Phase A) and reports 0 new
  violations.
- J2: one-off read-only comparison against the sibling Polar Recorder checkout at `../polarrecorder` (not a committed
  gate; this repository's own tools never resolve that path). The sibling checkout has a concurrent session actively
  implementing its paired `PLAN8.md` (uncommitted changes present throughout its tree), so this comparison reads its
  current on-disk state, not a final snapshot:

  | Dimension                          | Result                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | ---------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Pointer contract semantics         | Contract-equivalent                                | Polar Recorder converted its standalone `check-agents-pointer.mjs` into `tests/js/agents-pointer.test.mjs`, asserting the same `MAX_POINTER_LINES = 40` and the same three `MANDATORY_PREFLIGHT_FILES`, matching this repo's `tests/contract/ai-instruction-pointer-contract.test.js`.                                                                                                                                                                                                                                                                                                                    |
  | Both `CLAUDE.md` files             | Contract-equivalent                                | Both name the three mandatory preflight files, link to `AGENTS.md`, and stay well under 40 non-empty lines; wording and length differ (Polar Recorder's carries a short "Claude-Specific Notes" section this repo's does not), which is expected — the contract requires shape, not byte identity.                                                                                                                                                                                                                                                                                                        |
  | Documentation-shape requirements   | Identical                                          | Polar Recorder's `tests/js/doc-format-contract.test.mjs` requires exactly `REQUIRED_SECTIONS = ["Overview", "Key Details", "Related"]` plus title and `**Status:**`, matching `tests/contract/documentation-format-contract.test.js` verbatim.                                                                                                                                                                                                                                                                                                                                                            |
  | Canonical pattern-rule identifiers | Identical (for the proven-equivalent set)          | Polar Recorder's rule registry now uses `todo-without-owner`, `invalid-lint-suppression`, and `absolute-home-path` (previously `unowned-todo`, its Python-specific suppression check, and `absolute-home-path` already) — the same canonical names this repository settled on in Phase E. `catch-fallback`, `internal-namespace-fallback`, `commented-out-code`, and `promise-empty-catch` remain distinct from this repository's `catch-fallback-without-suppression`, `internal-hook-fallback`, `dead-code`, and `empty-catch`, consistent with Phase E1's finding that those pairs are not equivalent. |
  | Complexity limit values            | Identical mechanism, justified severity difference | Polar Recorder now has its own `tools/quality-policy/eslint-complexity-config.mjs` exporting `STRICT_LIMITS` (10/40/4/6) — the same filename and shape as this repository's Phase F1 module. Its `eslint.complexity.config.mjs` reads those limits at `"error"` severity with no ratchet ledger; this repository reads them at `"warn"` severity layered under the 175-entry historical ratchet. The severity/ratchet difference is the documented, justified one from PLAN40/Architecture Notes — Polar Recorder has no legacy debt to grandfather.                                                      |
  | markdownlint rule sets             | Identical config, one open difference              | Both set `"default": true` with only `MD013`/`MD033`/`MD041` disabled and glob `**/*.md`. Polar Recorder's `ignores` still uses the un-nested `"node_modules/**"` form rather than `"**/node_modules/**"`; this repository's Phase D1 hard constraint required the nested form specifically for this repository's untracked `.kilo/node_modules` tree. Recorded as an open item for the sibling's own PLAN8, not something this comparison may fix.                                                                                                                                                       |
  | Prettier configuration files       | Identical (byte-for-byte)                          | `diff dyninstruments/.prettierrc.json polarrecorder/.prettierrc.json` produced no output — Polar Recorder adopted this repository's configuration unchanged, matching baseline fact 5's decision.                                                                                                                                                                                                                                                                                                                                                                                                         |
  | Workflow inventory and permissions | Identical shape                                    | Both repositories now have exactly two workflow files (`publish-release.yml`, `quality.yml`); Polar Recorder's `quality.yml` declares the same top-level `permissions: contents: read`.                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | Generic skill payload              | Contract-equivalent                                | Polar Recorder's `.agents/skills/` contains the same five generic skill names (`preflight`, `create-plan`, `doc-sync`, `scan-smells`, `grill-me-repo`), each independently rewritten to its own vocabulary but structurally aligned — `preflight/SKILL.md` is line-for-line the same length (139 lines) with only terminology substitutions (`module` vs `component/module`), confirming both sides converged on the same generic-instruction shape without copying byte-for-byte.                                                                                                                        |

  This comparison was run as a one-off command sequence during this session; it is not wired into any script, test,
  hook, or workflow, and no committed file resolves `../polarrecorder`.

- J3: recording completion evidence per phase (above, dated 2026-07-27) is complete for A through J. Per the session's
  explicit instruction, this plan is **not** archived to `exec-plans/completed/` in this session — Phase J3's archival
  step requires the paired Polar Recorder plan (`PLAN8.md`) to reach the same point first, and that paired session is
  still in progress as observed during the J2 comparison above.

---

## Acceptance Criteria Verification

All Acceptance Criteria groups from this plan's "Acceptance Criteria" section were verified during Phases A–J:

- **Converged contracts**: `CLAUDE.md` passes both repositories' pointer rules (Phase B); the documentation-format
  contract requires `## Key Details` and all 45 previously-failing documents now carry it (Phase C); the sibling checker
  reports zero failures against this repository (Phase C3).
- **Single ownership**: complexity limits have one source (Phase F1); the 175-entry ledger and digest are unchanged;
  hotspot budgets live in JSON with a frozen-ceiling check (Phase F2); the maintained-file inventory is generated and
  fails closed (Phase F3); `check-schema.mjs`/`check-test-focus.mjs` are the only names in use (Phase F4).
- **Markdown and rule coverage**: markdownlint runs the converged rule set over `**/*.md` with zero issues across 90
  files (Phase D); the generic/project rule split is proven token-free (Phase E3); the one proven-equivalent rename
  (`absolute-home-path`) landed, and the six non-equivalent pairs stayed distinct (Phase E1/E2).
- **Pull-request enforcement**: `.github/workflows/quality.yml` triggers correctly, is permission-scoped, SHA-pinned,
  and ends in `check:all` (Phase G); `publish-release.yml` is unchanged and transport-only (Phase G2).
- **Agent layer**: all seven skills are classified; the five generic skills are proven token-free
  (`tests/contract/skill-layer-contract.test.js`); `skills-lock.json` shape is contract-tested (Phase H).
- **Instruction block**: `AGENTS.md` section numbering is contiguous 0–12 (Phase I1); the `SHARED_INSTRUCTIONS` block is
  proven token-free with a negative assertion (Phase I3).
- **Completion**: `check:all`, `hooks:doctor`, and `package:check` pass from the current worktree (Phase J1); coverage
  is unchanged at baseline fact 2's exact values; every paired-comparison row is recorded above (Phase J2).

#### J3 — plan closure

The paired Polar Recorder plan (`PLAN8.md`) has reached completion and was moved from
`exec-plans/active/PLAN8.md` to `exec-plans/completed/PLAN8.md` on the sibling side (confirmed 2026-07-28 by reading
`../polarrecorder/exec-plans/completed/PLAN8.md` directly, plus the user's explicit confirmation that both plans are
now implemented). `npm run check:all`, `npm run hooks:doctor`, and `npm run package:check` were re-confirmed green
immediately before this move (coverage 92.26%/79.77%/96.83%/93.24%, 228 classified production files, unchanged from
Verified Baseline fact 2; complexity ledger still 175 entries). Moved this file from `exec-plans/active/PLAN41.md` to
`exec-plans/completed/PLAN41.md` accordingly. No code change accompanied the move itself, only this file's relocation
and `tools/quality-policy/format-scope.json`'s regeneration to reflect the new path.

---

## Related

- [Core principles](../../documentation/core-principles.md)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Documentation format](../../documentation/conventions/documentation-format.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Testing infrastructure](../../documentation/conventions/testing-infrastructure.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Preceding alignment plan](../completed/PLAN40.md)
- Polar Recorder paired plan: `../../../polarrecorder/exec-plans/completed/PLAN8.md`
