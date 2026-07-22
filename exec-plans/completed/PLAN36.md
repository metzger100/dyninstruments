# PLAN36 — Restore Local-First Quality and Release Authority

## Status

Written after repository verification and review of the changes since `cb146da2535f86c2d23f51c934c5e86c88f935a1`.

This plan restores the repository's original local-first delivery priorities without rolling back the stronger
maintained-tool quality system. It covers tracked Git-hook activation and discoverability, removal of the competing
optional hook framework and GitHub branch governance added later, simplification of the tag workflow to a publisher of
already-committed artifacts, synchronization of contributor documentation, and closure of the superseded delivery items
in PLAN35.

The delivery topology is prescriptive: `npm run check:all` runs locally, the tracked pre-push hook is the automatic push
gate after one-time clone setup, and GitHub's only workflow publishes the committed release ZIP and release notes for a
locally created annotated tag. Equivalent implementations are allowed only for narrow test organization or wording
choices that preserve those outcomes.

The user did not request a separate pre-plan interview. This plan treats the user's stated original model, the request
that repository behavior and priorities must not change during the maintained-tool migration, and the follow-up request
to "fix that" as approval to remove branch/pull-request quality CI, quality-specific CODEOWNERS governance, the optional
Python pre-commit layer, and the tag workflow's second quality gate. If any of those remote or optional layers are meant
to remain, stop before Phase 1 and amend this plan rather than implementing a hybrid authority model.

---

## Goal

Keep the current ESLint, Prettier, Stylelint, TypeScript, Vitest/V8, actionlint, jscpd, schema, documentation, coverage,
complexity, and scaling protections, while making the repository's execution model local-first again.

Expected outcomes after completion:

1. `npm run check:all` remains the single complete quality gate and retains its current command graph and thresholds.
2. A clone that has run `npm run hooks:install` executes `npm run check:all` exactly once before every push and blocks
   the push on failure.
3. `npm run hooks:doctor` remains the explicit, fail-closed way to detect and repair missing clone-local hook setup.
4. Contributor guidance again makes tracked-hook installation part of normal one-time setup instead of directing users
   to an unrelated optional pre-commit framework.
5. GitHub does not run branch or pull-request quality checks and does not require quality-specific CODEOWNERS/ruleset
   governance.
6. `release:create` remains the local release authority: it validates, packages, commits the ZIP and notes, and creates
   the annotated tag.
7. The tag workflow performs no dependency installation, quality run, build, rebuild, packaging, commit, or tag
   creation. It validates publication metadata and uploads only the committed ZIP with the committed Markdown as the
   release body.
8. Stable and prerelease SemVer tags retain correct GitHub Release classification, immutable action pins,
   least-privilege permissions, bounded execution, and concurrency control.
9. No plugin runtime, widget behavior, user configuration, bundled layout, package contents, coverage floor, complexity
   budget, or test-quality policy changes.
10. PLAN35 is archived with a clear record that its remaining GitHub acceptance items were superseded, not silently
    completed.

---

## Mandatory Preflight for Implementers

Before each implementation session, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/core-principles.md`
5. `documentation/conventions/quality-gates.md`
6. `documentation/guides/documentation-maintenance.md`
7. `documentation/guides/release-workflow.md`
8. `documentation/guides/exec-plan-authoring.md`
9. This plan and the plans in Related

Run `git status --short` before each phase. Preserve unrelated user changes and never use destructive cleanup commands.
Use the `doc-sync` skill for Phase 4.

---

## Verified Baseline

The following facts were rechecked against the live repository before writing this plan:

1. The repository was on clean `main` at `bc201455acf4477de34d363e08790480cfca27f0` before this plan was added.
2. At `cb146da2535f86c2d23f51c934c5e86c88f935a1`, `.githooks/pre-push` ran `npm run check:all`, `.githooks/README.md`
   documented `npm run hooks:install` and `npm run hooks:doctor`, and `CONTRIBUTING.md` repeated those commands in the
   normal execution workflow and pre-merge checklist.
3. The current `.githooks/pre-push` still changes to the repository root and runs exactly `npm run check:all`; it is
   executable, uses fail-fast shell settings, and contains no remote operation.
4. `package.json` still exposes `hooks:install` through `tools/hooks-install.mjs` and `hooks:doctor` through
   `tools/hooks-doctor.mjs`.
5. `tools/hooks-install.mjs` sets the clone-local Git configuration `core.hooksPath=.githooks` and marks the pre-push
   file executable. `tools/hooks-doctor.mjs` verifies both conditions and prints `npm run hooks:install` as the repair.
6. `npm run hooks:doctor` currently fails in this clone because `core.hooksPath` is unset. The committed hook exists, so
   the observed missing push gate is an activation/discoverability failure, not a missing hook implementation.
7. Git does not activate a tracked hooks directory merely because it exists. Clone-local configuration or an explicit
   installer is required; repository files alone cannot guarantee hook execution.
8. The current `CONTRIBUTING.md` instead recommends optional `pre-commit install` and `pre-commit run --all-files`.
   `.githooks/README.md` is absent, and the tracked hook install/doctor commands are no longer in the contributor setup
   section.
9. `.pre-commit-config.yaml` runs only fast formatting, lint, actionlint, and documentation commands and deliberately
   does not run `check:all`. It has its own focused test and is listed explicitly in the Prettier command, CODEOWNERS,
   docs, and a release-manifest exclusion fixture.
10. `npm run check:all` currently expands exactly to `npm run check:core && npm run test:coverage:check`. It includes
    the maintained standard-tool layer plus repository-specific contract, coverage, complexity, scaling, package, and
    documentation checks.
11. The verified pre-plan aggregate run at the current commit passed 439 test files and 1,899 tests with 93.24% line and
    79.77% branch coverage. No quality-rule rollback is needed to restore the delivery model.
12. `.github/workflows/quality.yml` runs locked setup and `check:all` on pull requests targeting `main` and pushes to
    `main`. It does not run for ordinary feature-branch pushes.
13. `.github/CODEOWNERS` and `tests/contract/codeowners-contract.test.js` were added to support a GitHub ruleset and
    owner-review model. PLAN35 remains active only because a representative pull-request run and owner-enabled ruleset
    are still external acceptance items.
14. The immutable PLAN35 Phase 0 baseline records `publish-release.yml` as the sole workflow before the hardening plan;
    branch quality CI and CODEOWNERS were additive delivery governance, not prerequisites for the local quality tools.
15. `.github/workflows/publish-release.yml` currently has a read-only `quality` job that checks out the tag, configures
    Node/npm, runs `npm run setup`, and reruns `npm run check:all`. Its write-privileged publisher waits for that job.
16. The publisher job separately checks out the tag, uses the dependency-free `tools/release-version.mjs` to validate
    SemVer and classify prereleases, verifies the committed ZIP and Markdown paths, and invokes a pinned GitHub Release
    action. It does not rebuild the ZIP.
17. `tools/release-create.mjs` remains local and fail-closed: it accepts full SemVer, permits only the canonical notes
    file as pre-existing release dirt, runs `npm run check:all` exactly once before packaging, creates the deterministic
    ZIP, commits the ZIP and notes, and creates an annotated `vVERSION` tag.
18. `documentation/conventions/quality-gates.md`, `documentation/guides/release-workflow.md`,
    `documentation/guides/documentation-maintenance.md`, `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `CLAUDE.md`
    currently describe some combination of remote branch CI, CODEOWNERS/ruleset enforcement, optional pre-commit, or a
    tag-side quality rerun.
19. The three tests to delete with their retired owners are `tests/contract/quality-workflow-contract.test.js`,
    `tests/contract/codeowners-contract.test.js`, and `tests/tools/pre-commit-config.test.js`. All three are strict
    entries in `tsconfig.tests.json` and `tools/quality-policy/test-inventory.json`; none belongs to the immutable
    test-exception baseline.
20. No shipped runtime file, release artifact, layout, theme fixture, or AvNav-facing contract needs to change for this
    plan.

---

## Authority Model

This table is the target ownership contract.

| Event               | Required owner and behavior                                                                                                                      | Explicitly absent                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Install dev tooling | `npm run setup` installs locked local quality dependencies and provisions pinned actionlint                                                      | Hook activation as a hidden npm lifecycle side effect                                            |
| Configure a clone   | `npm run hooks:install`, followed by `npm run hooks:doctor`                                                                                      | Python pre-commit framework or an untracked manual hook copy                                     |
| Push any ref        | The tracked local pre-push hook runs one `npm run check:all` and propagates its exit status                                                      | GitHub branch/pull-request quality workflow                                                      |
| Create a release    | `npm run release:prepare`, manual AvNav validation, and `npm run release:create -- --version=VERSION` locally validate, package, commit, and tag | GitHub-side validation, packaging, commits, or tags                                              |
| Push a release tag  | One GitHub publisher checks tag/artifact identity and publishes the committed ZIP plus Markdown release body                                     | npm install/setup, `check:all`, tests, coverage, build/rebuild, ZIP creation, or source mutation |

### Intentional tradeoff

This model removes redundant remote enforcement and its network/runner/setup failure modes, but it also removes a
server-side safety net. A developer can bypass the local gate by never installing the tracked hook or by using Git's
explicit bypass mechanisms, and a manually forged tag can reach the minimal publisher. That is an accepted consequence
of restoring repository-owner local authority. The mitigation is transparent one-time hook setup, an executable doctor,
direct `check:all` guidance, a fail-closed local release command, and contract tests for all of those paths—not a second
remote authority.

Minimal tag and artifact validation remains in the publisher because it is required to map the tag to the two committed
release inputs and classify a GitHub prerelease. It is publication metadata handling, not a repeated quality gate.

---

## Architecture Notes

### Maintained tooling and delivery authority are separate concerns

ESLint, Prettier, Stylelint, TypeScript, Vitest/V8, Ajv, markdownlint, Linkinator, jscpd, fast-check, and actionlint can
remain the local implementations of generic checks without requiring GitHub to execute them. Repository-specific quality
policies remain only where generic tools cannot express the AvNav, UMD, package, inventory, coverage, complexity,
scaling, or documentation contracts.

### The tracked hook is a clone-local integration point

The committed shell file is versioned behavior, while `core.hooksPath` is intentionally local Git state. The installer
must remain explicit and idempotent; `setup`, package lifecycle scripts, tests, and documentation checks must not mutate
`.git/config` implicitly. This keeps CI and non-Git consumers predictable while making the required one-time developer
step prominent.

### The tag workflow is a transport boundary

The workflow necessarily depends on GitHub checkout and release-upload actions, but it must not become a second build or
quality environment. It may use the runner-provided Node executable for the dependency-free shared SemVer parser; it
must not install Node, npm, or repository dependencies. The committed ZIP and Markdown remain authoritative.

### Historical plans remain evidence

PLAN19 and PLAN34 document the original local-first intent and migration decisions. They must not be rewritten. PLAN35
is still active, so it may receive a concise supersession record before archival; its completed quality-policy work
remains valid, while only its delivery-governance additions and unfinished external acceptance items are revoked.

---

## Hard Constraints

### Runtime and package behavior

- Do not change `plugin.js`, `plugin.mjs`, `runtime/`, `cluster/`, `config/`, `shared/`, `widgets/`, `layouts/`,
  `plugin.css`, or runtime asset contents.
- Do not change AvNav registration, UMD/IIFE loading, render lifecycle, widget behavior, layout geometry, theming,
  editable parameters, or installation behavior.
- Do not alter the release manifest or the contents of any committed release ZIP.
- Do not add a bundler, runtime build step, runtime npm dependency, browser driver, or external service.

### Quality policy

- Keep `check:all` equal to `check:core` plus `test:coverage:check`.
- Do not remove, reorder to bypass, weaken, or rename the current maintained-tool and project-specific gates.
- Do not lower coverage thresholds, per-file floors, complexity values, strict test/source inventories, scaling
  contracts, clone detection, lint severity, or documentation checks.
- Do not edit immutable Phase 0 coverage, complexity, or test-exception captures.
- Deleting tests whose owned features are deleted requires removing only their live strict entries from
  `tsconfig.tests.json` and `tools/quality-policy/test-inventory.json`.
- Keep actionlint installed and executed locally through the current setup and `check:standard` paths; the remaining tag
  workflow must still pass it.

### Hooks and development setup

- Keep `.githooks/pre-push` versioned, executable, fail-closed, repository-rooted, and limited to one
  `npm run check:all` invocation.
- Keep `hooks:install` and `hooks:doctor` as explicit commands with focused tests.
- Do not make `npm run setup`, `npm install` lifecycle scripts, or ordinary checks write `.git/config`.
- Remove `.pre-commit-config.yaml` and its dedicated test instead of maintaining two hook installation stories.

### GitHub delivery

- After Phase 2, `.github/workflows/publish-release.yml` must be the only workflow.
- Remove branch and pull-request triggers, quality-specific CODEOWNERS, and required-ruleset instructions.
- The tag publisher must have one job, a bounded timeout, concurrency control, top-level read permissions, and
  job-scoped `contents: write` only where the release is created.
- Every `uses:` reference must remain pinned to a full commit SHA with a readable version comment.
- The tag publisher must not run npm, setup, `check:all`, tests, coverage, lint, build/rebuild, archive creation,
  commits, tags, or pushes.
- Preserve strict SemVer rejection, stable/prerelease classification, exact committed artifact path lookup, release
  notes as the GitHub Release body, and the ZIP as the uploaded asset.
- Do not add artifact transfer between jobs; there is only the checked-out committed state.

### Plans, documentation, and scope

- Do not edit completed PLAN19 or PLAN34.
- Preserve PLAN35's completed implementation record. Mark only its remaining external delivery items as superseded, then
  archive it.
- Phase 4 is documentation-only. Do not perform workflow, script, config, or test changes there.
- Update `README.md` because contributor and release workflow behavior is user-facing.
- Do not update `documentation/TABLEOFCONTENTS.md` unless a new file is added under `documentation/`; restoring
  `.githooks/README.md` does not require a TOC entry.
- The absolute 400-line and anti-compression rules continue to apply to non-exempt files. Check any touched non-exempt
  file before and after editing and split by responsibility if it would approach the limit.

---

## Implementation Order

### Phase 0 — Record the authority correction and close superseded PLAN35 work

**Intent:** Establish an auditable handoff from the completed quality hardening to the restored delivery policy before
changing enforcement files.

**Dependencies:** None.

#### 0A. Capture the implementation baseline

Record in this plan's implementation log:

```bash
git status --short
git rev-parse HEAD
npm run hooks:doctor
npm run check:all
```

The hook doctor is expected to fail only when the current clone has not been configured; record its exact reason. The
aggregate gate must be green before deletion work begins. If it is not, separate pre-existing failures from plan work
and stop rather than weakening policy.

#### 0B. Close PLAN35 without rewriting its history

Add a concise supersession note to the still-active PLAN35:

- Completed Phases 0–8 and the mechanical part of Phase 9 remain completed evidence.
- The representative pull-request run and GitHub ruleset activation are canceled by the owner-approved local-first
  policy in PLAN36; do not mark them as achieved.
- Branch/PR CI, quality-specific CODEOWNERS, and the tag-side quality rerun are removed by PLAN36.

Then move PLAN35 from `exec-plans/active/` to `exec-plans/completed/`. Do not rewrite its original decisions or progress
log. Confirm PLAN36 is the only active plan.

**Phase 0 exit conditions:**

- Baseline commit, hook state, and green aggregate-gate evidence are recorded.
- PLAN35 clearly distinguishes completed work from superseded external acceptance.
- PLAN35 is archived and PLAN36 is the sole active plan.

### Phase 1 — Make the tracked pre-push gate the only hook system

**Intent:** Remove the competing optional hook layer and mechanically preserve the existing local pre-push contract.

**Dependencies:** Phase 0.

#### 1A. Preserve explicit tracked-hook commands

Keep `.githooks/pre-push`, `tools/hooks-install.mjs`, and `tools/hooks-doctor.mjs` unless a focused test exposes a real
defect. Do not refactor working hook code merely because this plan touches its ownership.

Extend the existing focused tests only where needed to prove:

- `package.json` exposes `hooks:install` and `hooks:doctor` through the canonical tools;
- the committed hook is executable and shell-valid;
- it invokes exactly `npm run check:all` once and propagates the status;
- doctor fails with the exact repair command when `core.hooksPath` is missing or wrong;
- installer plus doctor succeeds in an isolated temporary Git repository;
- no test mutates the real repository's `.git/config`.

#### 1B. Remove the competing pre-commit framework

Delete:

- `.pre-commit-config.yaml`;
- `tests/tools/pre-commit-config.test.js`.

Remove the deleted config from the `format` and `format:check` command arguments. Remove the deleted test's strict
entries from `tsconfig.tests.json` and `tools/quality-policy/test-inventory.json`. Remove stale fixture references from
`tests/tools/release-zip-builder.test.js`; keep the underlying proof that development-only files never enter the runtime
ZIP.

Do not add a replacement dependency or hook manager. The existing tracked hook and Node installer are the replacement.

#### 1C. Run focused hook and inventory checks

Run:

```bash
npm exec vitest -- run --project unit-node tests/tools/hooks.test.js tests/tools/package-scripts.test.js tests/tools/release-zip-builder.test.js
npm run typecheck:tests
npm run format:check
```

**Phase 1 exit conditions:**

- There is one hook installation model: `.githooks` plus the two npm commands.
- The pre-push contract still runs the full gate and fails closed.
- No `.pre-commit-config.yaml` or dedicated pre-commit test/inventory entry remains.
- Focused tests, test inventory, typecheck, and formatting scope pass.

### Phase 2 — Remove remote branch governance

**Intent:** Restore the pre-migration GitHub topology in which normal branch and pull-request quality remains locally
owned.

**Dependencies:** Phase 1.

#### 2A. Remove branch/pull-request quality CI

Delete:

- `.github/workflows/quality.yml`;
- `tests/contract/quality-workflow-contract.test.js`.

Do not replace it with a renamed workflow, reusable workflow, status-check app, or workflow-call indirection.

#### 2B. Remove quality-specific review governance

Delete:

- `.github/CODEOWNERS`;
- `tests/contract/codeowners-contract.test.js`.

Remove both deleted tests from `tsconfig.tests.json` and `tools/quality-policy/test-inventory.json`. Do not edit the
immutable PLAN35 test-exception capture because these tests are strict entries, not captured exceptions.

#### 2C. Prove the remaining workflow inventory

Add or update the release workflow contract so it fails if another YAML workflow appears next to `publish-release.yml`.
This protects the restored single-workflow topology without hard-coding historical plan text into a general checker.

Run:

```bash
npm exec vitest -- run --project contract tests/contract/release-workflow-contract.test.js
npm run typecheck:tests
npm run actions:lint
```

**Phase 2 exit conditions:**

- `publish-release.yml` is the only file under `.github/workflows/`.
- No branch or pull-request GitHub Actions trigger remains.
- CODEOWNERS and its ruleset contract are absent.
- Live strict test inventory and TypeScript test includes contain no stale entries.
- The remaining workflow passes its contract and actionlint.

### Phase 3 — Reduce the tag workflow to committed-artifact publishing

**Intent:** Make GitHub a minimal release transport while preserving release identity, security, and prerelease
behavior.

**Dependencies:** Phase 2.

#### 3A. Collapse the workflow to one publisher job

Update `.github/workflows/publish-release.yml` to:

- keep only the `push.tags: ["v*"]` trigger;
- keep concurrency with cancellation disabled;
- keep top-level `contents: read` and publisher-job `contents: write`;
- use one timeout-bounded `publish-release` job with no `needs` dependency;
- check out the exact tag ref with the pinned checkout action;
- run `tools/release-version.mjs --github-output` with the runner-provided Node executable;
- verify the matching committed `releases/dyninstruments-VERSION.zip` and `releases/dyninstruments-VERSION.md` exist;
- publish the Markdown as the release body and the ZIP as the release asset;
- pass the shared parser's prerelease boolean to the pinned release action.

Remove the quality job, `actions/setup-node`, global npm installation, `npm run setup`, and `npm run check:all`. Do not
introduce a download/cache step or an equivalent second quality command under another name.

#### 3B. Make the workflow contract express the transport boundary

Update `tests/contract/release-workflow-contract.test.js` to prove semantically:

- the tag trigger is exclusive and the workflow inventory contains only this file;
- there is exactly one publisher job, no quality job, and no job dependency;
- permissions, timeout, concurrency, exact tag checkout, and full-SHA action pins remain correct;
- tag validation happens before artifact lookup;
- stable/prerelease classification comes from `tools/release-version.mjs`;
- the only release inputs are the matching committed ZIP and Markdown;
- executable step commands contain no package-manager install/setup, `check:all`, test, coverage, lint, build/rebuild,
  ZIP creation, commit, tag, push, or source-mutation command;
- the release action receives the correct tag, name, Markdown body path, ZIP file path, and prerelease flag.

Avoid a naive substring assertion that mistakes the artifact error message's local repair advice for an executed npm
command. Parse workflow steps and inspect executable command lines.

#### 3C. Reconfirm local release authority

Do not change `tools/release-create.mjs` unless a test reveals drift. Its focused tests must continue to prove one
blocking `check:all`, clean-tree handling, committed artifacts, and annotated-tag creation.

Run:

```bash
npm run actions:lint
npm exec vitest -- run --project contract tests/contract/release-workflow-contract.test.js
npm run test:package
```

**Phase 3 exit conditions:**

- The workflow contains one publishing job and no quality/setup/build job.
- It uses no repository dependency installation or network acquisition beyond GitHub checkout and release publication.
- Committed artifacts, SemVer validation, prerelease classification, immutable actions, and least privilege are intact.
- Local release-create/package tests remain green without changing package contents.

### Phase 4 — Synchronize contributor, quality, release, and agent guidance

**Intent:** Make the restored authority model discoverable and remove every stale claim about retired delivery layers.

**Dependencies:** Phase 3.

This phase is documentation-only. Use the `doc-sync` skill and do not change workflow, package, tool, config, or test
source here.

#### 4A. Restore tracked-hook discoverability

Restore `.githooks/README.md` with:

- one-time `npm run hooks:install` setup;
- `npm run hooks:doctor` verification and repair guidance;
- the exact `pre-push -> npm run check:all` behavior;
- the fact that hook activation is clone-local and must be repeated for each clone.

Update `CONTRIBUTING.md` so the normal setup/execution section and pre-merge checklist require the tracked-hook doctor.
Remove the optional `pre-commit` installation and checklist path.

#### 4B. Document the local quality authority

Update:

- `documentation/conventions/quality-gates.md`;
- `documentation/conventions/smell-prevention.md`;
- `documentation/guides/documentation-maintenance.md`.

The final text must distinguish:

- maintained local standard tools from project-specific local contracts;
- manual `check:all` as the completion gate;
- the tracked pre-push hook as automatic local enforcement after one-time setup;
- the absence of branch/PR CI, CODEOWNERS, and a required GitHub ruleset;
- actionlint as a local validator for the sole publisher workflow;
- the accepted bypass tradeoff when a clone does not install its hook.

Remove `.pre-commit-config.yaml` from the documentation touchpoint matrix and replace it with `.githooks/` and the hook
tools where appropriate.

#### 4C. Document the pure publisher release flow

Update `documentation/guides/release-workflow.md` to state:

- all quality, manual AvNav validation, packaging, commits, and annotated-tag creation happen locally;
- `release:create` runs `check:all` once;
- the pushed tag causes GitHub only to validate tag/artifact identity and publish the committed inputs;
- no GitHub job installs dependencies, reruns quality, rebuilds, packages, commits, or tags;
- prerelease and stable publication behavior remains unchanged.

Keep troubleshooting focused on the local release commands and missing committed artifacts.

#### 4D. Synchronize root and agent guidance

Update `README.md` development/release sections, `AGENTS.md`, and the shared `CLAUDE.md` instructions. Remove stale
claims about pull-request CI, tag-side `check:all`, CODEOWNERS protection, and optional pre-commit. Preserve the current
quality-tool, coverage, complexity, scaling, and manual AvNav validation descriptions.

Use the repository's AI-instruction synchronization command rather than manually allowing AGENTS/CLAUDE shared blocks to
diverge.

No `documentation/TABLEOFCONTENTS.md` change is expected because no documentation file is added beneath
`documentation/`.

Run:

```bash
npm run ai:check
npm run docs:check
npm run check:filesize
npm run format:check
git diff --check
```

Also run stale-term searches over active guidance. Historical completed plans and release notes are evidence and must be
excluded from stale-text cleanup.

**Phase 4 exit conditions:**

- A fresh contributor can find the tracked-hook setup and doctor commands from both CONTRIBUTING and `.githooks`.
- Every active guide describes local quality/release authority and the minimal publisher accurately.
- No active guidance recommends pre-commit, branch/PR quality CI, CODEOWNERS/rulesets, or a tag-side quality rerun.
- README and synchronized agent instructions match the live command/workflow graph.
- Documentation, AI sync, formatting, file-size, and diff-whitespace checks pass.

### Phase 5 — End-to-end validation and handoff

**Intent:** Prove the restored policy from an implementation-clean state without invoking remote GitHub behavior.

**Dependencies:** Phases 0–4.

#### 5A. Validate clone-local hook activation

Run:

```bash
npm run hooks:install
npm run hooks:doctor
```

Confirm `git config --get core.hooksPath` reports `.githooks`. The focused hook test remains the proof that a failing
`check:all` exit status blocks push; do not create a real failing push merely for validation.

#### 5B. Validate the complete repository

Run:

```bash
npm run test:split
npm run actions:lint
npm run package:check
npm run check:all
git diff --check
git status --short
```

Record the final test counts and V8 coverage in this plan. Inspect the final diff to confirm it contains only delivery,
hook, policy-test inventory, documentation, and plan-lifecycle changes.

#### 5C. Perform negative residue checks

Verify active repository state has:

- exactly one `.github/workflows/*.yml` file;
- no `.github/CODEOWNERS` or `.pre-commit-config.yaml`;
- no live references to the three deleted tests;
- no branch/pull-request quality or ruleset instruction outside historical completed plans;
- no executable `npm install`, `npm run setup`, `npm run check:all`, build, or ZIP command in the publisher workflow;
- unchanged `check:all`, coverage floors, complexity baselines, scaling contracts, and release manifest;
- no runtime or committed release-artifact diff.

#### 5D. Completion

When every acceptance item is satisfied, add the implementation evidence to PLAN36 and move it from `exec-plans/active/`
to `exec-plans/completed/`. No GitHub ruleset change, representative pull request, release tag, or remote API action is
required to complete this plan. The next real tag push is the operational confirmation of the publisher, not a
prerequisite for landing the repository changes.

**Phase 5 exit conditions:**

- Hook install/doctor passes in the implementation clone.
- Targeted, split, package, actionlint, documentation, and aggregate checks pass.
- Final diff contains no runtime, package-content, policy-threshold, or release-artifact change.
- PLAN36 contains reproducible evidence and is archived.

---

## User-Facing Documentation Impact

`README.md` changes are required because this plan changes contributor setup and release-workflow descriptions. Update
only the development, validation, and release guidance; do not advertise any new widget, configuration, layout,
installation, or runtime behavior.

`CONTRIBUTING.md` and `.githooks/README.md` are the primary clone-setup owners. The quality and release guides own the
detailed command and trust-boundary model. `AGENTS.md` and `CLAUDE.md` must mirror the same completion and release
checklists.

No user-facing plugin behavior changes, so widget, AvNav API, layout, theme, and configuration documentation must remain
unchanged.

---

## Acceptance Criteria

### Local hook and command authority

- [x] `npm run check:all` still expands exactly to `check:core` plus `test:coverage:check`.
- [x] `.githooks/pre-push` executes exactly one `npm run check:all` and propagates failure.
- [x] `hooks:install` configures `core.hooksPath=.githooks` and the executable bit.
- [x] `hooks:doctor` fails with the repair command when setup is absent and passes after installation.
- [x] Hook tests use temporary repositories and never mutate the real clone's Git config.
- [x] `.githooks/README.md` and CONTRIBUTING document the one-time per-clone setup prominently.
- [x] `.pre-commit-config.yaml`, its test, its inventory entries, and active documentation references are absent.

### GitHub topology and release publishing

- [x] `publish-release.yml` is the only GitHub Actions workflow.
- [x] No branch, pull-request, reusable, or renamed quality workflow remains.
- [x] `.github/CODEOWNERS`, its contract test, and required-ruleset guidance are absent.
- [x] The tag workflow has one publisher job and no quality-job dependency.
- [x] The workflow performs no Node/npm/repository setup, quality run, test, coverage, lint, build, rebuild, packaging,
      commit, tag, or push.
- [x] The publisher uses only the checked-out committed ZIP and Markdown for the validated tag version.
- [x] Stable tags create normal releases and prerelease tags create GitHub prereleases.
- [x] Every action is pinned to a full SHA; permissions, concurrency, tag ref, and timeout remain fail-closed.
- [x] Workflow contract tests reject a second workflow and every forbidden publisher operation.

### Local release preservation

- [x] `release:create` runs `check:all` exactly once before packaging.
- [x] Full SemVer, dirty-state, release-note, deterministic ZIP, release commit, and annotated-tag contracts remain
      green.
- [x] No release manifest entry, runtime ZIP content, committed artifact, or installer contract changes.
- [x] Manual AvNav validation remains a documented local prerequisite for release creation.

### Maintained quality preservation

- [x] ESLint, Prettier, Stylelint, TypeScript, Vitest/V8, actionlint, jscpd, schema, documentation, focused-test,
      coverage-inventory, complexity, scaling, and package checks remain active.
- [x] No coverage threshold/floor, complexity baseline, test-exception capture, lint severity, or scan root is weakened.
- [x] Deleted test files are removed cleanly from strict test inventory and typecheck includes only.
- [x] No production/runtime source file changes.
- [x] No new dependency, runtime build, browser automation, or remote quality service.

### Plan and documentation consistency

- [x] PLAN35 records its canceled external acceptance items as superseded and is archived without rewriting completed
      history.
- [x] PLAN36 is the sole active plan during implementation and is archived after completion.
- [x] README, CONTRIBUTING, AGENTS, CLAUDE, quality-gate, smell, maintenance, release, and hook guidance match live
      behavior.
- [x] Historical PLAN19, PLAN34, and completed PLAN35 remain available as evidence.
- [x] No active stale claim says GitHub reruns quality, checks branches/PRs, or enforces CODEOWNERS/rulesets.
- [x] `documentation/TABLEOFCONTENTS.md` remains unchanged unless implementation adds a new documentation file.

### Final validation

- [x] `npm run hooks:doctor` passes after explicit install.
- [x] `npm run test:split` passes.
- [x] `npm run actions:lint` passes.
- [x] `npm run package:check` passes.
- [x] `npm run docs:check` passes.
- [x] `npm run check:filesize` passes.
- [x] `npm run check:all` passes with final test counts and coverage recorded.
- [x] `git diff --check` passes.
- [x] Final diff contains no unrelated user change.

---

## Implementation Record

- **Phase 0 (2026-07-22):** started from `5b4849ecb23cdfcee99027c4c4a80e619e224dfd` with a clean worktree.
  `npm run hooks:doctor` correctly reported `core.hooksPath` as unset and named `npm run hooks:install` as the repair.
  PLAN35 now records that its remaining hosted pull-request/ruleset items were superseded, and it was archived without
  changing its completed evidence.
- **Phases 1–3:** removed the optional pre-commit layer, branch/PR workflow, CODEOWNERS, and their three retired
  strict tests/inventory entries. The retained hook contract remains clone-local and fail-closed. The sole workflow is
  a one-job, tag-only publisher that validates SemVer and committed artifacts without installing dependencies or
  rerunning quality. Focused hook/package/release and workflow contracts passed; the strict test inventory is now 472
  files.
- **Phase 4:** restored `.githooks/README.md`; synchronized contributor, root, agent, quality, smell, maintenance,
  and release guidance. The repository has no `ai:check` script; the existing AI instruction pointer contract passed
  as the live synchronization proof. Documentation checks, file-size checks, formatting, and whitespace validation
  passed.
- **Phase 5:** `npm run hooks:install` configured `core.hooksPath=.githooks`, and `npm run hooks:doctor` passed.
  `npm run test:split`, `npm run actions:lint`, `npm run package:check`, and `npm run check:all` passed. Focused
  package validation reported 3 files / 15 tests; the full contract project reported 28 files / 128 tests. The final
  split and coverage runs passed 436 test files / 1,892 tests. V8 coverage was 92.26% statements, 79.77% branches,
  96.83% functions, and 93.24% lines. Final residue checks confirmed one workflow and no
  CODEOWNERS/pre-commit/test-reference residue; runtime, layouts, release artifacts, coverage floors, complexity
  baselines, scaling contracts, and release manifest are unchanged.
- **Post-implementation audit (2026-07-22):** strengthened the publisher contract to reject any second workflow and
  every executable line outside the reviewed transport allowlist. Hook tests now prove one invocation by append-only
  capture and cover an incorrect `core.hooksPath`. Corrected the live test-inventory count to 472 and checked every
  acceptance item after the final green validation.

---

## Related

- [PLAN19 — Release Automation + Cleanup](../completed/PLAN19.md)
- [PLAN34 — Quality-System Migration Remediation and Finalization](../completed/PLAN34.md)
- [PLAN35 — AI Coding Quality Enforcement Hardening](../completed/PLAN35.md)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Release workflow](../../documentation/guides/release-workflow.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
