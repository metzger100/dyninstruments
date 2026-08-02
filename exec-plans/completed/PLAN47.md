# PLAN47 - Converge both proof repositories into one greenfield AvNav AI environment

## Status

Active as of 2026-08-02. This file is the single implementation authority for the remaining quality-system and
greenfield-environment work across both sibling repositories:

- **Repository V:** this `dyninstruments/` repository, starting at `54ac642ee3e3755bd7da108cf59347f1ae0a801f`.
- **Repository P:** the adjacent Python-plus-browser AvNav plugin repository, starting at
  `9d5751f564a94d2b33307e2c188c1ef47c64fe1d`.

Do not create an active or completed companion plan in Repository P. Implementers working in either repository must
update the progress and evidence in this file. Move only this file to `exec-plans/completed/` after every acceptance
criterion passes in both repositories and in freshly generated projects from both repositories.

This plan is prescriptive about alignment invariants, greenfield behavior, portable-core ownership, negative proofs,
documentation truthfulness, and phase exit conditions. Exact helper names and file splits are flexible when repository
limits or maintained-tool interfaces require a better decomposition. Any such adjustment must preserve the one-owner,
byte-identity, fail-closed, and independent-operation outcomes defined here.

The work succeeds only when the two mature repositories are interchangeable examples of the same environment contract.
Product-specific runtime differences are expected, but every difference must be explicit validated profile data or a
narrow product adapter. An unexplained byte, command, rule, dependency, generated artifact, or documentation difference
is an alignment failure.

## Goal

1. Preserve the already aligned signed portable core while closing every portability, profile-integrity, starter, and
   documentation defect found by the 2026-08-02 cross-repository audit.
2. Make Repository V and Repository P independently runnable product examples of one high-quality AvNav plugin AI
   environment, with identical generic semantics and intentionally different browser-only versus Python-plus-browser
   product profiles.
3. Make both repositories generate byte-identical output for the same inputs and provide two complete greenfield
   profiles:
   - `viewer-only`: a functional minimal AvNav browser plugin using a verified modern host boundary; and
   - `python-plus-viewer`: a functional thin AvNav Python boundary plus static browser surface, with complete Python and
     browser development quality checks.
4. Make generated projects fail closed as beginners add or split files. Every maintained file must be discovered,
   classified, and owned by the applicable formatting, linting, typing, smell, test, coverage, documentation, packaging,
   workflow, and file-size checks, or be rejected as unclassified.
5. Propagate generator inputs such as plugin ID and display name through every generated runtime, test, profile, schema,
   package, and documentation artifact without a fixed example identity remaining.
6. Make the generated environment teachable to novice and AI-assisted contributors: coherent instructions, reachable
   documentation, a small real plugin lesson, progressive quality layers, and exact guidance for adding files safely.
7. Make all required checks work without Git metadata, sibling checkouts, network access after setup, machine-local
   paths, or hidden transitive dependencies.
8. Replace copy-by-convention with one neutral portable environment distribution owner and mechanically verified
   vendored outputs in both proof repositories.
9. Remove accidental repeated work from the shared role graph and public command documentation while retaining
   deliberate coverage reruns and every current quality floor.

## Verified Baseline

The following facts were mechanically rechecked against the two repositories and disposable generated/archive copies
before this plan was written.

1. Both supplied migration bases exist and are ancestors of the starting revisions: Repository V
   `8a61a3794c3dc67549a0f5e580b58e25dfc80895`, Repository P `908bd5ad2e2a985b885bd0fc6de2be47298f3719`.
2. The starting working trees are clean. Repository V has completed plans through `PLAN46.md` and no active plan;
   Repository P has no active plan.
3. Both repositories attest portable-core version `3.2.0`, 44 mandatory signed paths, manifest digest
   `063b6043b352c0c69f4e8a0185c916c40abaa9a9b283307188d9a28082710a00`, and generic-rule digest
   `a3b6a22066d4fa19dadd86e64cc821f1549eb9f471afd124346b6360e165c313`.
4. Every currently contract-owned portable path is byte-identical between the two repositories, and mutation of a signed
   byte causes `check:shared-core` to fail with a digest mismatch.
5. Both `package.json` files expose the same canonical `check:core` role order:
   `standard,portable-core,generic-surface,standalone,suppressions,typing,packaging,focus,smells,product-contracts,`
   `test-split,complexity,scaling,documentation,file-size`; `check:all` appends the coverage role.
6. Both mature working-copy full gates pass. Repository V covers 470 Vitest files and 2,073 tests with 93.27 percent
   line and 79.86 percent branch coverage. Repository P passes 359 Python tests plus its viewer/plugin coverage suites,
   with 95.78 percent aggregate Python coverage and 92.46 percent viewer line coverage.
7. Repository P's existing mypy cache can make an otherwise valid gate fail to open its SQLite state. Strict mypy over
   all 80 source files succeeds with a fresh external cache, so the defect is generated-state sensitivity rather than a
   source typing failure.
8. Repository V passes `npm run setup` and `npm run check:all` in a filesystem copy with no `.git` directory and no
   sibling repository.
9. Repository P completes setup in the equivalent archive-only copy, but `test:tools` fails seven cases because
   `tools/quality-policy/generate-format-scope.mjs` executes `git ls-files` and `tests/js/setup.test.mjs` executes
   `git status`.
10. Repository P's `tools/quality-policy/project-profile.json` declares the nonexistent complexity policy path
    `tools/quality-policy/complexity-budget.mjs`; the live complexity command instead uses
    `tools/quality-policy/eslint.complexity.config.mjs`, and `check:profile` does not detect the stale path.
11. The signed core imports `jsonc-parser`. Repository V and the generated starter declare it directly; Repository P
    resolves it only through a transitive `markdownlint-cli2` installation.
12. All 15 standard development dependencies common to both repositories have identical exact versions. Both require
    Node 26 and npm 12.0.1; Repository P additionally owns its Python tooling and `js-yaml` workflow parser.
13. The starter generator and its two template modules are byte-identical between repositories. Their current SHA-256
    values are `77ca653c...a9546`, `92f80796...9c00`, and `f897eeb0...dee0`, respectively.
14. For identical inputs, the two repositories currently generate byte-identical 68-file `viewer-only` and 70-file
    `python-plus-viewer` quality trees.
15. A clean generated `viewer-only` tree installs from its lockfile and passes its full gate with 10 tests and 100
    percent coverage over the tiny generated runtime.
16. The generated `python-plus-viewer` gate never invokes a Python formatter, linter, type checker, test runner,
    compatibility checker, or coverage owner. A syntax-invalid `plugin.py` passes every generated npm quality role.
17. The generated Python test is named `tests/plugin_python.test.py`, outside the normal pytest discovery forms, and no
    generated command invokes it.
18. The generator writes its requested ID to `plugin.json`, but `plugin.js`, the browser tests, and `plugin.py`
    hard-code `generated-plugin`.
19. The generated browser entry calls optional `avnav.api.registerPlugin`; neither proof repository's documented and
    tested host contracts establish that call as the generic plugin boundary.
20. The generated Python file exposes only `plugin_name()` and is not a real AvNav lifecycle, request, or static-viewer
    boundary.
21. The generated profile hard-codes source roots mainly to `plugin.js` and optional `plugin.py`. Formatting, ESLint,
    TypeScript, tests, coverage, standalone, and smell checks likewise use narrow literal file lists.
22. Adding root `helper.js` containing `var` and `eval` to a generated quality tree leaves its complete `check:all`
    green. Only the file-size walker notices the file and does not reject it.
23. The generated `check:smells` command runs duplication only. A canonical `default-truthy-fallback` mutation in the
    generated runtime passes all quality roles, proving that the executable generic corpus is not applied to generated
    product source.
24. `tools/check-patterns/generic/namespace-policy.mjs` has three materially different implementations across Repository
    V, Repository P, and generated output although the path and naming imply one reusable generic owner.
25. Generated quality workflows use mutable `actions/checkout@v4` and `actions/setup-node@v4` references, omit the
    mature repositories' workflow contract validation, and do not establish an explicit read-only permission policy.
26. The generated project copies five agent skills whose instructions refer to a documentation index, coding standards,
    smell prevention, plan authoring, and documentation maintenance pages that the generator does not create.
27. Generated projects have no package/install/release proof for an AvNav-consumable artifact and no functional widget
    or user-app lesson.
28. The quality starter currently contains 68 files, including 38 tool files, 7 test files, 5 skills, and 4 schemas, and
    declares 21 direct development dependencies for a six-line runtime. Its installed dependency tree occupied about 171
    MB in the audit environment.
29. Several generated direct dependencies have no live generated command/config consumer, including the ESLint comments
    plugin, Acorn, fast-check, jsdom, YAML, and Stylelint. Their continued inclusion is not justified by the current
    generated contract.
30. Repository V runs generic-surface once as its dedicated role and again inside `check:smells`. Repository P runs
    duplicate-pattern checks in both `duplication:check` and its full pattern pass. Broad test projects also repeat some
    package, documentation, or scaling owner tests; the later product coverage rerun is intentional.
31. Repository P concatenates the opening shared-instruction marker and its first sentence, while Repository V and the
    canonical shared instruction source put them on separate lines.
32. Repository V's quality-gate documentation says `test:split` includes `contract`, but its package script runs only
    `unit-node` and `unit-dom`; contracts run separately through the `product-contracts` role.
33. Both READMEs describe the current quality starter as mutation-resistant despite the reproduced new-file, generic
    smell, Python, identity, and workflow escapes.
34. Both mature repositories use SHA-pinned actions, read-only quality jobs, full clone-local pre-push gates, and
    transport-only release workflows. The greenfield output does not yet inherit those delivery guarantees.
35. Both mature npm lockfiles reported zero advisories during the audit. There is no equivalent Python dependency audit
    command in the generated or Repository P developer workflow.
36. The migration replaced many custom rule implementations with maintained tools, but the net executable tool surface
    increased to approximately 100 files/13,583 lines in Repository V and 86 files/11,785 lines in Repository P. The
    environment is structured and tested, but not yet a low-maintenance or novice-small extraction.

## Hard Constraints

- Do not change either mature plugin's runtime behavior, visual output, learned data model, public AvNav API, user
  configuration, release payload, or platform floor merely to align development tooling.
- Keep product differences explicit. Repository V remains a browser/widget profile. Repository P remains a Python 3.9+
  standard-library runtime plus static browser profile with a Python 3.14 development environment. Do not force either
  product into the other's architecture.
- Do not create a second execution plan in Repository P. Do not split this work into repository-specific plans.
- Do not make either repository's setup, required gate, release, or generated output depend on the sibling checkout, a
  parent-directory layout, an absolute local path, Git metadata, uncommitted external state, or network access after the
  documented setup step.
- Do not lower coverage floors, complexity limits, duplication thresholds, type strictness, file-size limits, schema
  constraints, workflow checks, or lint severity. Do not add skips, ignored source roots, suppressions, warning-only
  substitutions, exceptions, or baseline debt to obtain green results.
- Preserve Repository V's immutable historical coverage and complexity captures and Repository P's frozen coverage
  capture/floor baseline. Generated greenfield profiles start without inherited product debt.
- Keep AvNav runtime output dependency-free and build-free. Development-only npm and Python tools are allowed, but the
  installed plugin must not require npm, a bundler, transpilation, or target-device Python packages.
- Verify any generated AvNav boundary against repository-local documented/tested contracts before implementing it. Do
  not invent a host method, optional compatibility call, or fake registration API as a teaching contract.
- Keep the signed core and neutral generator/distribution free of either source product's identity, namespace, product
  paths, complexity debt, release allowlists, and machine/environment tokens.
- Every canonical portable source, schema, fixture, skill, template, and generated lock input must have one source
  owner. Vendored copies in the two proof repositories must be deterministic outputs with signed provenance, not
  independently edited peers.
- Every contract-owned vendored byte must be identical in both repositories. All legitimate local behavior belongs in
  schema-validated profile data or narrow adapters with executable clean/failing tests.
- Prefer maintained tools as final owners. Custom code is limited to AvNav contracts, deterministic orchestration,
  profile/inventory composition, archive proof, distribution verification, or checks that maintained tools cannot
  express. Every new custom behavior requires positive and negative self-tests.
- Keep each phase small enough that both affected working repositories end with their full gate green. If a phase
  changes only one repository, that repository's full gate is required and the other repository's byte/provenance checks
  must still prove no unintended drift.
- Follow each repository's own mandatory preflight, documentation shape, file-size, coverage, and completion rules while
  editing it. Split non-exempt files before 400 non-empty lines; never compress code to evade the limit.
- Do not leave plan-number or phase-number authority citations outside `exec-plans/`. Permanent artifacts must explain
  their own current contract.
- Do not publish packages, push commits, create tags/releases, or modify remote repository settings as part of this
  plan.

## Affected Surfaces

The implementation is expected to touch these owners. File splits and new neutral distribution paths may vary, but the
ownership categories and resulting contracts are mandatory.

Shared, neutral, and byte-identical inputs or generated outputs in both repositories:

- `schemas/portable-core-contract.schema.json` and any added profile/inventory/distribution schemas.
- `tools/portable-core/**`, `tools/quality-policy/portable-core-contract.*`, role graph, shared manifest, manifest
  digest, profile schema/validator, generic conformance corpus, attestation fixtures, and generic check adapters.
- `tools/create-avnav-plugin-starter.mjs`, `tools/starter-templates.mjs`, `tools/starter-quality-templates.mjs`,
  lockfile template, starter schemas/configs/skills/docs, and generator tests.
- A neutral versioned distribution manifest and deterministic materialization verifier that makes the source/output
  relationship explicit.

Repository-specific adapters and evidence:

- Both `package.json` files and lockfiles, project quality profiles, format/source/coverage inventories, checker scopes,
  CI/hook contracts, and relevant tool tests.
- Repository V tests under `tests/portable-core/`, `tests/tools/`, and `tests/contract/`.
- Repository P tests under `tests/portable-core/` and `tests/js/`, plus Python tool tests when the generated Python
  profile reuses a Python policy.
- Repository P Git-dependent format-scope/setup tests, complexity profile path, direct dependency declaration, and mypy
  cache ownership.
- Both `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, quality-gate/coding/smell conventions, setup/testing/documentation
  guides, and navigation indices when pages are added or moved.

Generated acceptance fixtures for both profiles:

- Functional AvNav runtime/browser files, plugin metadata, package/install artifacts, tests, local quality profiles,
  inventories, CI, hooks, documentation, and agent instructions.
- Python development lock/setup and Python quality configuration only for `python-plus-viewer`; runtime remains Python
  3.9+ standard-library-only.

## Implementation Order

### 1. Freeze an executable alignment contract and audit matrix

Intent: turn the audit findings and the meaning of “perfectly aligned” into machine-checkable inventories before
changing shared behavior.

Dependencies: none.

Deliverables:

- Add a neutral alignment inventory that classifies every shared path, command role, generic rule, starter input,
  dependency, CI control, and documentation claim as `portable-identical`, `profile-owned`, `adapter-owned`, or
  `remove`.
- Extend the profile schema so every declared policy, schema, adapter, source root, test root, and documentation root
  must resolve to a repository-local path of the expected kind. Reject absolute paths, traversal, stale entries, unknown
  keys, duplicate ownership, and product tokens in neutral profiles.
- Add direct-dependency verification for imports made by the signed core and generated quality config. A transitive
  package must not satisfy a declared direct dependency.
- Add a cross-repository conformance command in Repository V that accepts Repository P through an explicit command-line
  path, compares only contract-declared neutral inventories, reports normalized differences, and is never required by
  either repository's independent `check:all`.
- Record the exact starting heads, attestation digests, shared generator hashes, package versions, and clean full-gate
  evidence in this plan's Progress Tracking section.

Exit conditions:

- Clean fixtures in both repositories validate; fixtures with a stale policy path, missing direct dependency,
  nonexistent source root, traversal, product token, or duplicate owner fail with the exact responsible field.
- Repository P's current complexity path and undeclared `jsonc-parser` are caught before their corrections are applied.
- The conformance command reports no unexplained current Tier 1 byte differences and reports the known namespace,
  instruction-format, and starter-contract differences in their intended categories.
- Targeted profile, schema, portable-core, and conformance tests pass in both repositories.

### 2. Repair independent-operation and profile-integrity defects

Intent: make the mature proof repositories truthful, deterministic, and archive-runnable before evolving the starter.

Dependencies: section 1.

Deliverables:

- Replace Repository P's required-gate `git ls-files` discovery with the same fail-closed filesystem/profile inventory
  model used by the gate. Remove `git status` from required tool tests; keep Git-specific release behavior isolated in
  release-only tests that are not needed to prove archive operation.
- Add a shared archive-proof harness that exports each working tree without `.git`, dependency directories, caches, or
  coverage output; provisions it from its own lock inputs; and runs its full gate with no sibling present.
- Correct Repository P's complexity policy path and add `jsonc-parser` as an exact direct development dependency.
- Give Repository P's mypy invocation an explicit repository-local cache policy or deterministic disposable cache so a
  stale SQLite cache cannot break an otherwise clean gate; exclude cache state from maintained inventories/artifacts.
- Normalize Repository P's shared instruction marker layout from the canonical source and make the contract test compare
  exact block rendering, not only semantic content.
- Correct Repository V's `test:split` documentation so it describes unit-node/unit-dom and the separate
  `product-contracts` role exactly.

Exit conditions:

- `check:profile`, dependency-owner tests, shared-instruction tests, format-scope tests, and setup tests pass in both
  repositories.
- Repository P's gate does not execute Git outside explicitly Git/release-scoped commands; a mechanical required-command
  search and the archive proof confirm this.
- Fresh archive-only copies of both mature repositories complete setup and `npm run check:all` without `.git`, a sibling
  checkout, or pre-existing caches.
- Both mature source working copies pass `npm run check:all` after the changes.

### 3. Establish one neutral distribution owner and canonical namespace policy

Intent: stop maintaining semantically shared quality and starter sources as independently editable copies.

Dependencies: sections 1 and 2.

Deliverables:

- Define one repository-neutral, versioned distribution source for the portable core, generic conformance corpus,
  profile schemas, starter templates, starter documentation/skills, and lock inputs. Materialize deterministic vendored
  outputs into both repositories and record source version plus per-file digests in a signed provenance manifest.
- Make local gates verify materialized outputs without reading the distribution source or sibling repository. Provide a
  maintainer-only regeneration/audit command that fails on local edits, omitted files, stale output, or nondeterminism.
- Consolidate namespace checking into one configurable canonical owner that can express browser global prefixes, CSS
  prefixes, filename/export/function naming, and enabled surfaces through schema-validated profile inputs.
- Delete or rename project-only namespace adapters so no three unrelated implementations remain behind the same
  `generic/namespace-policy.mjs` identity.
- Version-bump the portable environment contract when semantic or signed inventory changes warrant it, and regenerate
  both attestations/manifests together.

Exit conditions:

- A recursive comparison of all contract-owned materialized paths between repositories is empty.
- Both attestations report identical versions, manifest/generic/corpus/distribution digests, inventories, and canonical
  namespace owner.
- Editing a materialized byte, dropping a source file, introducing nondeterministic output, or changing semantics
  without the required version/provenance update fails both repositories' verifier tests.
- Neither repository's normal setup or full gate reads the sibling or distribution-source checkout.

### 4. Make generated file ownership and generic checks fail closed

Intent: ensure the first file a beginner adds cannot escape the quality environment.

Dependencies: section 3.

Deliverables:

- Replace literal starter file lists with a generated source/inventory profile that discovers all maintained runtime,
  test, tool, config, schema, workflow, CSS, Python, and Markdown paths under explicit roots and classifications.
- Define for each classification which owners must inspect it: formatter, language linter, type checker, generic smells,
  focus/suppression scan, tests/coverage, docs/link/format checks, schema/workflow validation, duplication, packaging,
  standalone boundary, and file size.
- Reject an unclassified maintained file, a stale classified path, a discovered file outside every applicable owner, or
  a check configured with a narrower scope than its profile claims.
- Wire the canonical generic rule registry and executable conformance behavior into generated product-source
  `check:smells`; make the configured namespace rule live.
- Add permanent generator mutation tests that create a new unsafe root `helper.js`, nested runtime file, CSS file,
  Markdown page, test, workflow, config, and profile-specific Python file. Each must be checked or rejected with a
  stable diagnostic.
- Add mutations for unsafe evaluation, truthy default clobbering, unowned suppression text, focused tests, unclassified
  coverage, stale inventory, and generic namespace drift.

Exit conditions:

- A clean generated tree passes its complete gate from both source repositories with identical normalized output.
- The exact `helper.js` plus unsafe-evaluation reproduction fails before product tests and identifies the missing or
  violating owner.
- Every added-file and generic-rule mutation fails in both generated profiles from both source repositories.
- No generated script, config, or inventory limits product checking to the original runtime filename.

### 5. Propagate identity and build a verified viewer-only AvNav archetype

Intent: turn the viewer profile from a quality demo into a small functional AvNav plugin lesson.

Dependencies: section 4.

Deliverables:

- Introduce one validated template data model for plugin ID, display name, namespace, package name, paths, and profile;
  render every generated artifact from that model and reject unsafe or inconsistent identifiers at the generator
  boundary.
- Remove every fixed `generated-plugin` value from generated output. Add a post-generation identity scan and contract
  tests covering distinct IDs/names, punctuation rules, namespace derivation, and deterministic reruns.
- Generate the verified modern `plugin.mjs` browser boundary plus the smallest real static widget or user-app surface
  supported by repository-local AvNav documentation/tests. Keep any legacy entry only when an actual supported host
  contract requires it.
- Generate executable host-boundary tests that use the verified API shape, plus one small user-visible behavior test
  suitable as the novice's first extension exercise.
- Add deterministic plugin metadata validation and a minimal install/package command that emits an AvNav-consumable
  artifact with an exact allowlist and no development files.
- Keep the runtime no-build and dependency-free; all generation and checks remain development-only.

Exit conditions:

- Generating with a non-default ID/name places the expected identity in every runtime, metadata, package, test, profile,
  schema, and document and leaves no fixed placeholder or conflicting identity.
- The generated host tests exercise only documented/tested AvNav APIs and fail when the boundary tuple or registration
  contract drifts.
- Package validation proves the install artifact contains exactly the functional runtime/metadata surface and runs
  without node dependencies.
- Fresh `viewer-only` generation, setup, `check:all`, package creation, and archive-only rerun pass from both proof
  repositories with byte-identical output.

### 6. Implement the Python-plus-viewer profile completely

Intent: make the Python label a real language-quality and AvNav-runtime contract rather than an unchecked extra file.

Dependencies: sections 4 and 5.

Deliverables:

- Generate a thin, functional Python 3.9-compatible AvNav plugin boundary that injects host services, serves or
  registers the static viewer through a verified local contract, and keeps domain/sample behavior outside the boundary.
- Generate a supported development setup with pinned/hash-locked Python tooling, an isolated environment, Ruff format
  and lint, strict mypy, pytest, branch coverage, Python compatibility, focus, suppression, file-size, and coverage
  inventory roles.
- Name Python tests for actual pytest discovery and prove discovery count is nonzero. Include both boundary behavior and
  a small pure domain example so beginners see where product logic belongs.
- Add Python source discovery to the same fail-closed maintained-file inventory used by viewer files. New Python files
  must be typed, formatted, linted, tested/covered or explicitly contract-owned, and package-classified.
- Keep target runtime standard-library-only and prevent development dependencies, virtual environments, caches, and
  coverage output from entering the AvNav package.
- Add generated CI Python provisioning using the same pinned-version and cache-independent rules as local setup.
- Add negative tests for invalid syntax, type errors, lint violations, skipped/focused tests, uncovered new modules,
  runtime dependency leakage, Python-version incompatibility, and malformed AvNav boundaries.

Exit conditions:

- A syntax-invalid `plugin.py` fails an early Python role; a deliberately undiscovered test makes the
  discovery/inventory contract fail.
- Ruff, strict mypy, pytest with branch coverage, compatibility, focus, suppression, inventory, and package proofs are
  all reachable exactly once from generated `check:all`.
- A clean generated Python profile passes locally and in an archive-only copy, and its install artifact runs on the
  Python 3.9-compatible standard-library contract without installed development packages.
- Generation and all mutations produce equivalent results from both proof repositories.

### 7. Align generated CI, hooks, packaging, and command ownership

Intent: give generated projects the same delivery guarantees as the mature examples without duplicate work.

Dependencies: sections 3 through 6.

Deliverables:

- Generate SHA-pinned checkout, Node setup, and Python setup actions; declare read-only default permissions; install
  dependencies exactly once; and run the same `check:all` authority used locally.
- Generate workflow schema/actionlint contracts that reject mutable action tags, unpinned third-party actions, excess
  permissions, duplicate setup, missing cache/lock inputs, or a CI-only quality command.
- Generate pre-push install/doctor commands equivalent in meaning to both mature repositories and test broken,
  uninstalled, and correctly installed states without requiring Git for the full quality gate itself.
- Align public command names and role meanings across Repository V, Repository P, `viewer-only`, and
  `python-plus-viewer`. Product-only roles attach through validated profile adapters.
- Remove duplicate generic-surface execution from Repository V, duplicate pattern execution from Repository P, and
  accidental package/docs/scaling test reruns where a single owner can provide the same proof. Retain the explicit
  product coverage rerun and document why it is intentional.
- Validate deterministic package contents and keep release/publish workflows transport-only; generating a publisher is
  optional unless a safe non-publishing local release contract is part of the novice workflow.

Exit conditions:

- Workflow mutation fixtures reject mutable action tags, permission expansion, duplicate dependency installation, and
  any divergence from local `check:all`.
- Role-graph tests prove shared roles execute once, in the canonical order, stop on first failure, and preserve product
  adapter output.
- Measured clean-gate command traces contain no accidental repeated shared owner; documented intentional coverage reruns
  remain present.
- Hook doctor, package checks, actionlint, and both mature full gates pass.

### 8. Generate coherent novice and AI-agent guidance, then reduce the starter surface

Intent: make the extracted environment understandable and internally navigable before calling it beginner-ready.

Dependencies: sections 4 through 7.

Deliverables:

- Generate a small documentation index, coding standards, smell-prevention guide, quality-gate guide, plan-authoring
  guide, documentation-maintenance guide, and architecture map, or reduce the generated skills so every instruction
  references only documents that exist. Prefer the smallest coherent set.
- Make `AGENTS.md` a routing map with a working mandatory preflight. Add contract tests for document presence,
  reachability, required shape, links, and skill references.
- Write a progressive README path: run the functional sample, make one behavior change, add one file safely, understand
  the fast/full gates, enable the Python profile where applicable, package for AvNav, and diagnose a failed owner.
- Explain portable versus profile-owned policy, how to classify a new file, how to update tests/coverage without
  lowering floors, and why runtime remains dependency-free.
- Mechanically map every generated direct dependency to a live script/config/import. Remove unused packages and quality
  files; keep optional advanced conformance tooling outside the beginner-critical path when it can be layered safely.
- Record file count, direct dependency count, installed size, setup time, fast-gate time, and full-gate time before and
  after reduction. Do not optimize by weakening coverage, generic rules, typing, CI, or archive proof.

Exit conditions:

- Every copied/generated skill completes its preflight against files present in the generated tree.
- Documentation checks prove no dead links, missing required sections, unreachable pages, stale commands, or false
  mutation-resistance/archive claims.
- Every remaining direct dependency has a verified live owner and undeclared transitive imports fail.
- The beginner path starts with functional plugin behavior rather than portable-core internals, while the full quality
  contract remains available and blocking.

### 9. Synchronize both proof repositories' public documentation

Intent: make both repositories describe the same environment contract and only the profile differences they actually
implement.

Dependencies: sections 2 through 8.

Deliverables:

- Update both READMEs' development/starter sections with exact profiles, setup prerequisites, archive guarantees,
  package/install flow, mutation scope, and current command meanings.
- Update both CONTRIBUTING guides with the aligned fast/full gate, hook, file-classification, generator, and
  cross-repository distribution-update workflows.
- Update both quality-gate, coding, smell, testing, setup, documentation-maintenance, and release guides wherever
  command ownership or generated behavior changed. Update navigation indices for every added/moved page.
- Describe the two mature repositories as product profiles/examples and the generated starter as the reusable greenfield
  basis. Do not claim perfect alignment, mutation resistance, Python coverage, Git-free operation, or AvNav
  compatibility unless its corresponding executable proof passes.
- Keep profile-specific product documentation local and avoid duplicating generic contract prose outside the neutral
  generated documentation owner.

Exit conditions:

- `docs:check` passes in both mature repositories and both generated profiles.
- Mechanical command/doc comparisons find no mismatched shared command role, starter option, supported tool version, or
  archive/CI claim.
- README-required categories are synchronized without changing mature user-facing plugin behavior.

### 10. Execute the complete cross-repository release-candidate proof

Intent: prove the mature examples and generated greenfield environment satisfy the same contract independently before
archiving this plan.

Dependencies: all previous sections.

Deliverables:

- From clean working trees, run the complete mature gate, dependency audit, hook doctor, attestation, and package
  dry-run in both repositories.
- Produce fresh archive-only copies of both mature repositories, provision only from their own committed lock inputs,
  and run their complete gates with no `.git`, sibling checkout, or inherited cache.
- Generate both profiles from both repositories using at least two distinct identity pairs; compare all output bytes
  except explicitly volatile generated-state directories, then provision and run full gates/package proofs in all four
  outputs.
- Run a table-driven mutation suite in a fresh disposable tree per mutation: new-file escape, unsafe JavaScript,
  canonical generic smell, invalid Python syntax, Python type/lint/coverage/discovery defects, identity drift, unpinned
  action, excessive workflow permission, stale profile path, undeclared direct dependency, missing package file, missing
  documentation, broken skill reference, suppression text, focused test, and signed-byte tampering.
- Capture normalized commands, exit statuses, test counts, coverage summaries, artifact inventories, versions, and
  digests in this file's Completion Evidence. Do not record machine-local absolute paths.
- Confirm Repository P contains no plan for this work, both working trees contain only intended changes, and all
  distribution/provenance checks are current.

Exit conditions:

- Every clean mature/archive/generated scenario passes; every mutation fails for the intended owner in outputs from both
  source repositories.
- Portable/distribution attestations and generated trees are byte-identical where the contract requires identity; every
  remaining difference appears in validated profile data and has a passing reason-specific test.
- Both source `npm run check:all` commands pass after all evidence updates.
- All acceptance criteria below are satisfied and the plan is moved, without content loss, to
  `exec-plans/completed/PLAN47.md`.

## Progress Tracking

- [x] 2026-08-02: Revalidated both mandatory repository preflights and execution-plan authoring guides.
- [x] 2026-08-02: Captured the starting heads, clean-tree state, signed-core identity, generator hashes, command graphs,
      profile contents, and audit mutation/archive evidence in Verified Baseline.
- [x] 2026-08-02: Re-ran both mature full gates, both-direction alignment/distribution proofs, hooks doctor,
      attestation, starter parity, all four generated full gates, package allowlist proofs, and npm advisory audits
      after the cache policy and manifest-anchor edits.
- [x] Section 1: executable alignment contract and audit matrix complete.
- [x] Section 2: independent-operation and profile-integrity defects complete.
- [ ] Section 3: neutral distribution metadata and namespace policy are implemented; an external canonical source
      checkout is still required before this section can be closed.
- [x] Section 4: generated file ownership and generic checks fail closed for the implemented inventory and mutation
      matrix.
- [x] Section 5: identity and functional viewer-only archetype complete.
- [x] Section 6: complete Python-plus-viewer profile complete.
- [x] Section 7: CI, hooks, packaging, and role ownership aligned.
- [x] Section 8: novice/AI guidance and dependency/surface reduction complete for the current starter contract.
- [x] Section 9: public documentation synchronized in both repositories.
- [ ] Section 10: release-candidate proof is substantially complete; the full mutation matrix and Python advisory
      command remain explicit follow-up work.

### Current implementation evidence (2026-08-02)

The following implementation increments are now present in both proof repositories and were validated without creating a
companion plan in Repository P:

- [x] The shared generator and quality sources are byte-identical: `tools/create-avnav-plugin-starter.mjs`
      (`02db27accd4bbeaf586acf4ef2f135627c1bd3249baa312bc817db2b5cc18f9e`), `tools/starter-templates.mjs`
      (`51e937bc25c4ede8891043b6480018f3c07eccd5391a8e24b0ead06c5a572abc`), `tools/starter-quality-templates.mjs`
      (`738ad02f65c232992e4db5507027e7910e527a8c8db9e7fd5610f90f11896fff`), and the split
      `tools/starter-quality-template-parts.mjs` (`b7eca6d1ea5d109b8f8c17113578ab5f19a7b3ae494b238133d7fef61be5e6f8`).
      The lock template is `80da70cc288f741af7e890b89dee134656202bd5ec1372ee5f02eb3fc0b1357b`; the suppression engine is
      `5dca9a94354d52746e1d14a0c65f1830063fc72d4bfee1ed9e9fc41fd31b1e2b`; and the canonical namespace adapter is
      `d29681678850b4a760a3039bab05d4eb03d52226eb1f5cbad1c5f0479bfadabc`.
- [x] Both repositories attest portable-core `3.2.0` with manifest digest
      `316222f0492f265fbe671b6c8585f6898eac37dee3474193b9bc245f2229fc16` and generic-rule digest
      `a3b6a22066d4fa19dadd86e64cc821f1549eb9f471afd124346b6360e165c313`; all 44 attestation entries match.
- [x] The explicit local and peer checks report zero findings in both repositories: `npm run check:alignment`,
      `node tools/check-alignment.mjs --peer=<Repository-P-path>` (and the reverse), `npm run check:distribution`, and
      both peer distribution invocations. The alignment inventory digest is
      `3769a80da23ee55dd663aafdcad9277a8d5612a1de64d038de6d78377d2b3eb5`; the alignment verifier digest is
      `7d73f085d395f478678fc94ac240d09308c856a27da21f296a742d17e5a862ef`; the distribution-source descriptor digest is
      `adda40439ccb3fa21dc3e80df2bad09bbe2e35606f9762ad226b61bb4028a06f`; the regenerator digest is
      `82dd3ae5ae1bf551fdf45e67c631098e27b0f244d271500ccde8a5c2f7525518`; the distribution verifier digest is
      `ef8933339171ab3861ed9c33ecd45e30f6b162b77dd40d924e46e697315d150f`; and the materialized manifest digest is
      `ed1ed9655c28df424c8d56f1f3008babe6e35bea6cc683ee733d0bd24be4fe9b`.
- [x] Final mature and archive gates pass after the cache-policy, workflow, advisory, and documentation edits.
      Dyninstruments reports 38 contract files/193 tests, 96 Node files/623 tests, 336 DOM files/1,259 tests, 92.28%
      statements, 79.86% branches, and 228 classified production files. Repository P reports 359 Python tests, 52 tool
      files/402 tests, 11 viewer files/47 tests, one plugin test, 95.78% Python coverage, and 92.46% viewer line
      coverage using a disposable external mypy cache. Both source trees and fresh archive-only copies pass.
- [x] Fresh identical generation from both repositories produces 77 `viewer-only` files and 81 `python-plus-viewer`
      files; normalized `diff -qr` comparisons report zero differences for both profiles. Both profiles then passed
      complete generated gates, package proofs, and (for Python) Ruff, strict mypy, pytest, and 95.12% Python coverage.
- [x] The generated Python profile has a typed AvNav user-app boundary, real pytest discovery, Ruff, strict mypy, branch
      coverage, compatibility, focus, suppression, inventory, package, and runtime dependency checks. The generated
      package proof contains exactly three runtime files for `viewer-only` and four for `python-plus-viewer`.
- [x] Generated workflows require read-only `contents: read` permissions and SHA-pinned checkout, Node, and Python
      actions. The generated `js-yaml` override is locked to `5.2.2`; clean generated `npm ci`/`npm audit` runs report
      zero vulnerabilities for both profiles.
- [x] The generated mutation suite passes in both source repositories with identity drift, stale profile path, mutable
      action, write permission, suppression text, signed-byte tampering, missing package file, and invalid Python syntax
      cases. This is a representative suite; the full mutation matrix in Section 10 is not yet implemented.
- [x] Both mature repositories pass `npm run hooks:doctor`; their final npm advisory reports have zero findings at every
      severity. Python development requirements are hash-locked and installed in isolation, but no Python advisory
      database command is currently part of the blocking gate.
- [x] Public `README.md` and `CONTRIBUTING.md` guidance in both repositories now describes the neutral source
      descriptor, source check/write commands, archive-safe gates, peer comparison using a neutral placeholder path, and
      the actual generated profiles. The peer contains no companion PLAN47 file.
- [x] The starter template was split into a shared helper to satisfy the immutable 400-line file-size gate without
      weakening or exempting the checker. The strict tools inventories, format scopes, alignment inventory, and
      distribution manifests now own the new path in both repositories.
- [x] The hardened profile validator has negative coverage for duplicate roots and stale policy paths. The direct
      dependency verifier caught and the peer repository now declares `acorn` directly. The peer command-graph fixture
      now contains valid browser profile, policy, and documentation fields and all 29 graph tests pass.

The plan remains active for two deliberate residuals: the current neutral distribution descriptor and regenerator are
byte-identical, deterministic repository-local contract owners, but a separately versioned canonical source checkout has
not been introduced; and the mutation suite is representative rather than the full matrix named in Section 10. The
Python development lock is hash-verified and npm advisories are zero, but no Python advisory database command is
currently installed or required. The cache policy is explicit: repository and generated quality scans ignore
`.quality-cache/`, Python type-check commands write to disposable cache state, and cache state is excluded from
packages.

When completing a section, append the date, exact changed owners, targeted/full commands, and relevant digests here. Do
not mark a section complete based only on a locally green happy path.

## User-Facing Documentation Impact

README changes are mandatory in both repositories because this plan changes contributor setup, generated installation
and packaging, profile requirements, CI/hooks, and the documented greenfield workflow. At minimum update:

- Repository V `README.md`: greenfield/starter usage, profile selection, generated AvNav install/package path,
  requirements, development commands, and exact quality guarantees.
- Repository P `README.md`: developer starter guidance, Python profile prerequisites, archive behavior, generated
  install/package path, and exact quality guarantees.
- Both `CONTRIBUTING.md` files: setup, hook installation/doctor, adding/classifying files, fast/full gates, updating the
  neutral distribution, and generator validation.
- Both quality-gate convention pages and any linked setup, testing, documentation-maintenance, or release page affected
  by changed commands or ownership.
- Generated README, `AGENTS.md`, documentation index, conventions, guides, and architecture map for each profile.

No mature plugin feature documentation should change unless implementation uncovers a false existing AvNav contract. Any
such correction must be evidence-based, limited to documentation/tests, and recorded in Progress Tracking before code
depends on it.

## Acceptance Criteria

### Single-plan and cross-repository authority

- This repository contains the only active/completed plan for this work; Repository P contains no duplicate plan.
- Progress and completion evidence cover both repositories and both generated profiles in this one file.

### Portable and distribution identity

- One neutral source owner deterministically materializes every portable core, generic rule/corpus, schema, starter,
  skill, documentation, and lock input that the contract declares shared.
- Both repositories report identical environment/core versions and manifest, generic, corpus, distribution, and
  provenance digests.
- Every contract-owned materialized byte is identical and tamper-evident; semantic changes without version/provenance
  updates fail closed.
- Neither independent gate requires the source owner, sibling checkout, Git metadata, or network after setup.

### Profile integrity and mature repositories

- Every profile path exists, has the expected kind, stays within the repository, and has exactly one declared owner.
- Every signed-core/config import has an exact direct dependency or a documented standard-library owner.
- Repository V retains all browser/widget obligations and immutable complexity/coverage ratchets.
- Repository P retains strict Python, Python 3.9 compatibility, viewer checks, package policy, and frozen coverage
  floors, without stale-cache or Git-metadata sensitivity.
- Both mature working copies and archive-only copies pass their complete gates.

### Generated fail-closed growth

- Every maintained generated file is discovered, classified, and checked by all applicable owners or rejected as
  unclassified.
- Adding a new runtime, test, Python, CSS, documentation, workflow, schema, config, or tool file cannot silently escape
  formatting, linting, typing, generic smells, tests/coverage, packaging, documentation, or file-size policy.
- The canonical generic rule corpus and configured namespace policy run against generated product source.
- All required mutation fixtures fail for the intended owner from outputs generated by both proof repositories.

### Functional AvNav profiles and identity

- `viewer-only` is a functional no-build AvNav plugin lesson using only verified host contracts.
- `python-plus-viewer` is a functional Python 3.9-compatible, standard-library runtime plus static viewer with complete
  Ruff, strict mypy, pytest branch coverage, focus, suppression, compatibility, inventory, and packaging checks.
- Plugin ID/name/namespace values propagate consistently through all artifacts; no fixed example identity remains.
- Both profiles create deterministic installable AvNav artifacts containing no development dependencies or generated
  state.

### CI, hooks, commands, and dependencies

- Generated CI uses SHA-pinned actions, read-only permissions, one setup owner, and the same local full-gate command.
- Shared role names/order/meaning match across mature and generated profiles; each common owner runs once except the
  documented product coverage rerun.
- Hook installation/doctor works in clone workflows while archive-only quality remains Git-independent.
- Every direct dependency has a live consumer; no signed/config import relies on accidental transitive hoisting.
- Npm and Python dependency advisory procedures are documented and automated where an authoritative maintained tool and
  reproducible lock format are available.

### Novice and AI-agent usability

- Generated instructions reference only reachable, structurally valid documentation that exists.
- The first tutorial path changes real plugin behavior and adds its test before exposing advanced portable-core detail.
- Adding a file, interpreting a failed owner, running fast/full gates, packaging for AvNav, and updating the shared
  distribution are documented with exact commands.
- Starter file/dependency/install-size and gate-time measurements improve or have an explicit evidence-backed reason to
  remain; no improvement comes from weakened enforcement.

### Documentation and completion

- Both mature READMEs, CONTRIBUTING files, quality conventions, and generated docs state only executable truths.
- Documentation indices, links, format, reachability, command snippets, and skill references pass in all four clean
  generated/source scenarios.
- No coverage floor, complexity limit, lint severity, test, or policy was weakened; no skip, suppression, ignored path,
  or new baseline debt was introduced to obtain green.
- All required validation evidence is recorded below before this plan is archived.

## Required Validation Commands

Run from each mature repository unless a command is explicitly profile-specific:

```bash
npm run check:shared-core
npm run portable-core:attest
npm run check:profile
npm run check:generic-surface
npm run check:standalone
npm run check:suppressions
npm run check:smells
npm run typecheck
npm run package:check
npm run test:focus:check
npm run check:complexity
npm run check:scaling
npm run docs:check
npm run check:filesize
npm run hooks:doctor
npm run test:coverage:check
npm run check:all
npm run dependencies:audit
```

Generated `viewer-only` evidence must include setup, full gate, package proof, hook doctor in a temporary Git clone, and
the complete applicable mutation suite. Generated `python-plus-viewer` evidence must additionally include Python setup,
Ruff, strict mypy, pytest discovery, branch coverage/inventory, compatibility, focus, suppression, and runtime-package
proofs.

Archive validation must copy only maintained repository files and committed lock inputs into a disposable directory,
omit `.git`, siblings, dependencies, caches, coverage, and prior artifacts, then run setup and the full gate. Cross-repo
comparison must use explicit disposable paths and compare only declared inventories. Record normalized evidence and
digests, never machine-local absolute paths.

## Completion Evidence

The following is the current evidence record. It is intentionally not an archive declaration because the full mutation
matrix and an external canonical source checkout remain open:

- Both migration-base histories are recorded above; both repositories contain only their expected working-tree edits,
  and Repository P contains no `PLAN47.md`.
- Both attestations report portable-core `3.2.0`, manifest digest
  `316222f0492f265fbe671b6c8585f6898eac37dee3474193b9bc245f2229fc16`, and generic-rule digest
  `a3b6a22066d4fa19dadd86e64cc821f1549eb9f471afd124346b6360e165c313`. The neutral alignment inventory is
  `3769a80da23ee55dd663aafdcad9277a8d5612a1de64d038de6d78377d2b3eb5`; the distribution-source descriptor is
  `adda40439ccb3fa21dc3e80df2bad09bbe2e35606f9762ad226b61bb4028a06f`; the regenerator is
  `82dd3ae5ae1bf551fdf45e67c631098e27b0f244d271500ccde8a5c2f7525518`; the verifier is
  `ef8933339171ab3861ed9c33ecd45e30f6b162b77dd40d924e46e697315d150f`; and the materialized distribution manifest is
  `ed1ed9655c28df424c8d56f1f3008babe6e35bea6cc683ee733d0bd24be4fe9b`.
- Local and both-direction peer alignment/distribution checks report zero findings. Mature source and archive copies
  pass `npm run check:all`; Dyninstruments records 193 contract, 623 Node, and 1,259 DOM tests, 92.28% statements and
  79.86% branches; Repository P records 359 Python, 402 tooling, 47 viewer, and one plugin test, 95.78% Python coverage
  and 92.46% viewer coverage.
- Both repositories generate byte-identical 77-file `viewer-only` and 81-file `python-plus-viewer` trees. All four
  generated profiles and their archive-derived copies pass setup, full gates, package allowlists, workflow policy, and
  npm advisory checks. Runtime package allowlists contain three and four files respectively; generated Python coverage
  is 95.12%.
- The representative mutation suite passes in both generators: identity drift, stale profile path, mutable action, write
  permission, suppression text, signed-byte tampering, missing package file, and invalid Python syntax each fail their
  intended owner. This does not yet cover every mutation listed in Section 10.
- Both hook doctors pass. Final npm advisory reports contain zero findings at every severity. Python development
  requirements are hash-locked and isolated, but no Python advisory database command is currently required.

## Related

- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Prior cross-repository alignment plan](../completed/PLAN46.md)
