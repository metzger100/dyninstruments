# PLAN46 - Perfect cross-repository quality-system alignment

## Status

Completed 2026-08-01. This is the single implementation authority for coordinated quality-system work in both sibling
repositories. The plan is archived in `exec-plans/completed/PLAN46.md`; Repository P has no duplicate plan. For this
plan, **Repository V** means this viewer/widget repository, and **Repository P** means the sibling Python-plus-viewer
AvNav plugin repository. Their verified starting points are:

- `dyninstruments/` at `6782cf8eeef48d1153dfabe88b964c1140fac6ee`; and
- Repository P at `bb882b3036f564a1adb5c2601768b1f7cbaed109`.

Do not create a second execution plan in Repository P. Implementers must update this file's progress and evidence while
working in either repository, and move only this file to `exec-plans/completed/` after every cross-repository acceptance
criterion passes.

This plan is prescriptive about semantic parity, portable-core ownership, command roles, generated-project quality,
negative proof, documentation truthfulness, and completion evidence. Exact helper names and internal file splits are
flexible when repository limits or maintained-tool interfaces require a better decomposition, provided the resulting
portable files are byte-identical and the profile boundary remains explicit.

## Goal

1. Make Repository V and Repository P two independently runnable product profiles of one quality environment rather than
   two locally green systems with partially similar tooling.
2. Make one portable-core version identify one exact set of executable semantics: identical signed bytes, identical
   generic-rule behavior, identical conformance results, and identical gate-role orchestration.
3. Keep every legitimate product difference in validated local profiles or product adapters: Dyninstruments' browser
   widget architecture and legacy complexity ratchet; Repository P's Python 3.9 runtime boundary, Python 3.14 developer
   toolchain, pytest/mypy/Ruff checks, and viewer/server packaging.
4. Ensure every engine claimed by the portable contract is the engine reached by the live `check:all` graph in both
   repositories; shipping an attested but bypassed implementation is forbidden.
5. Close the discovered suppression, generic-conformance, starter CLI, generated-project safety, and CI-provisioning
   gaps without weakening any existing product check, floor, baseline, or test.
6. Make both repositories credible examples and extraction sources for a future greenfield AvNav plugin AI environment,
   including quality-grade viewer-only and Python-plus-viewer starter profiles.
7. Preserve independent operation: neither committed repository gate may read the sibling checkout, a machine-local
   path, Git history, or a future central repository.

## Verified Baseline (pre-implementation)

1. Both working trees are clean on `main` and match `origin/main` at the HEADs recorded in Status.
2. Both `npm run portable-core:attest` commands report `coreVersion: 3.0.0` and manifest SHA-256
   `fa86af9cf2457ab9b247cb60790cb639cb64db9f369a6634234ab6ce1aa31998`.
3. All 28 current manifest entries have identical content digests in both repositories, including 14 engines under
   `tools/portable-core/`, the verifier/attester/contract loaders, schema, generic-surface checker, self-test, and five
   agent skills.
4. The current attested generic-rule trees are not equal:
   - Dyninstruments: `a93602e5a4d59d095cc3158f9770ca2772604256cb4679b79cbcf37f8d3bf8a7`.
   - Repository P: `8652974e7318eb99d1973c6b5929b40fbe71b8c36c3c19ebd0652eb2a85ef696`.
5. The current contract fixes 21 canonical generic rule identifiers but does not sign one canonical implementation for
   every rule.
6. Repository P's `tools/check-patterns/rules.mjs` classifies four rules as generic by filtering definitions imported
   from `tools/check-patterns/project/`; the attester hashes only `tools/check-patterns/generic/`, so its generic digest
   does not cover all behavior registered as generic.
7. Dyninstruments' `tests/portable-core/generic-rule-corpus.json` stores clean/failing description strings, but
   `tests/portable-core/portable-core-contract.test.js` checks only that those strings are non-empty.
8. Repository P's `tests/js/generic-rule-corpus.test.mjs` runs each generic rule only against an empty clean input and
   has no per-rule failing invocation.
9. Both repositories' local full gates pass, and both gates also pass from detached copies containing their provisioned
   dependencies. This proves strong project-local quality and post-provisioning independence, not semantic parity.
10. Both repositories share the exact same `tools/create-avnav-plugin-starter.mjs` SHA-256
    `1225dc7c6743990a960b66ebf54ec094683087d57916dd345a65cbf7d9dc7381` and generate the same seven-file minimal project.
11. Both READMEs document starter arguments with `--key=value`, but the parser accepts only alternating `--key value`
    pairs; the documented invocation fails with `Use --output, --id, and --name pairs.`
12. Both starter tests call `createStarter()` directly and therefore do not cover the CLI parser or the exact README
    command.
13. The generated starter's `check:all` accepts an uncovered function containing `eval`, `var`, and `console.log`, so it
    is a smoke scaffold rather than the quality environment demonstrated by the product repositories.
14. A JavaScript suppression directive inside a Markdown code fence passes both live `check:suppressions` and
    `check:patterns` commands despite documentation claiming that maintained documentation examples are covered.
15. Dyninstruments' live `check:suppressions` uses `tools/check-suppressions.mjs`, not the signed
    `tools/portable-core/suppression-engine.mjs`; on a generated Python suppression fixture, the live checker scans zero
    files while the signed engine rejects the fixture.
16. Repository P's live suppression command uses the signed engine, and its standalone adapter imports the signed path
    policy; Dyninstruments still has independent local implementations at those boundaries.
17. Both packages define `check:all` as `check:core && test:coverage:check`, but their common command API is not fully
    aligned: `check:standalone-boundary` versus `check:standalone`, different suppression entrypoints, and different
    ordering/placement of generic-surface, focus, smell, product-contract, and test roles.
18. Both repositories pin Node 26/npm 12.0.1 and exact common maintained-tool versions for ESLint, TypeScript,
    Vitest/V8, Prettier, Stylelint, markdownlint-cli2, Linkinator, jscpd, Ajv, globals, and eslint-plugin-jsdoc.
19. Both quality workflows run `npm ci` and then `npm run setup`, while each `setup` command itself begins with
    `npm ci`; dependency installation is duplicated.
20. Repository V has no active execution plan; its next sequential plan name is `PLAN46.md`. Repository P has no active
    plan, and this file intentionally remains the only plan for the coordinated work.

## Hard Constraints

- Do not change product runtime behavior, AvNav integration contracts, user configuration, visual output, learned-model
  behavior, persisted data, or release payload contents except where a generic starter profile requires new generated
  example files outside product runtime.
- Do not make either repository's required gate depend on a sibling checkout, an absolute checkout path, Git metadata,
  network access after setup, or uncommitted/generated state outside its own root.
- Do not create a second active or completed plan in Repository P for this work. Cross-repository progress and evidence
  belong only here.
- Do not lower coverage floors, complexity limits, duplication thresholds, file-size limits, type strictness, schema
  constraints, or lint severity. Do not add skips, focus markers, suppressions, warning-only substitutions, ignored
  paths, or grandfathered entries to reach green.
- Preserve Repository V's immutable historical coverage/complexity captures and Repository P's existing coverage-floor
  baseline. Project debt remains profile data; it must never enter the portable default for a new repository.
- The portable core and its conformance fixtures must contain no source-product identity, namespace, path, release
  payload, or machine/environment token.
- Product-specific source roots, namespaces, Python requirements, coverage floors, complexity debt, documentation
  topology, package schemas, and release contents must remain in validated Tier 2 profiles or narrow adapters.
- Every portable source, schema, fixture, and skill included by the new contract must be byte-identical in both
  repositories. Equality by similar behavior or same filename is insufficient.
- One core version must map to one manifest digest, one canonical generic-rule digest, one executable conformance corpus
  digest, one gate-role schema, and one required export surface. Any semantic change requires a core-version bump.
- Use maintained tools as the final owner whenever they can enforce the rule directly. Custom portable code is allowed
  only for AvNav/repository contracts, profile composition, deterministic orchestration, or gaps that maintained tools
  cannot express; each custom rule needs clean and failing self-tests.
- Keep runtime dependency-free: no bundler or runtime build step in either product or generated AvNav plugin.
- Follow each repository's own preflight, file-size, documentation, release, and full-gate rules while editing it.
- All maintained JS/MJS/Python/Markdown files outside exempt fixture/plan/config paths remain below 400 lines. Split
  implementation files during the phase that would exceed the limit; never compress code to evade it.
- Do not leave plan-number or phase-number authority citations outside `exec-plans/`. Standalone documentation must
  explain the resulting contract without historical-plan language.
- Do not publish, tag, push, open a pull request, or create release artifacts as part of this plan.

## Affected Surfaces

The exact diff will be driven by extraction and file-size constraints, but implementation is expected to touch these
owners in both repositories.

Portable, byte-identical owners:

- `schemas/portable-core-contract.schema.json` and any new portable profile/gate/conformance schema.
- `tools/portable-core/**`, including a canonical gate engine and canonical generic-rule implementations.
- `tools/quality-policy/portable-core-contract.json` and `.mjs`, `profile-schema.mjs`, `read-json-policy.mjs`,
  `shared-core-manifest.json`, and `shared-core-manifest.sha256`.
- `tools/check-shared-core.mjs`, `tools/check-generic-surface.mjs`, and `tools/portable-core-attest.mjs`.
- `tests/portable-core/portable-policy-engines.test.mjs` plus a shared executable generic-rule corpus and runner.
- `tools/create-avnav-plugin-starter.mjs` and product-neutral starter templates/fixtures.
- Shared agent skills only if their portable workflow contract changes.

Repository adapters and profiles:

- `package.json`, lockfiles, `.github/workflows/quality.yml`, actionlint provisioning, hook adapters, and tool configs.
- `tools/check-patterns.mjs`, `tools/check-patterns/rules.mjs`, generic/project rule adapters, scope/context profiles,
  and their repository-specific tests.
- Suppression, standalone-boundary, format, file-size, focus, coverage, complexity, schema, documentation,
  test-inventory, and release adapters/profiles.
- Dyninstruments tests under `tests/portable-core/`, `tests/tools/`, and `tests/contract/`.
- Repository P tests under `tests/portable-core/`, `tests/js/`, and Python checker tests where Python profile behavior
  is affected.
- `README.md`, `CONTRIBUTING.md`, `documentation/conventions/quality-gates.md`,
  `documentation/conventions/coding-standards.md`, `documentation/conventions/smell-prevention.md`, and relevant setup,
  testing, documentation-maintenance, or release guides in both repositories.

## Implementation Order

### 1. Freeze the alignment contract and classify every difference

Intent: define a machine-readable boundary between portable semantics and legitimate product profiles before moving
code.

Dependencies: none.

Deliverables:

- Produce a current cross-repository inventory of common quality commands, portable paths, generic rule IDs and source
  owners, direct engine consumers, schemas, profiles, dependencies, CI steps, and documentation claims.
- Classify every difference as one of: `portable-must-match`, `profile-required`, `adapter-required`, or `remove`.
- Add a versioned portable profile schema that validates product identity/tokens, source scopes, language capabilities,
  test projects, coverage/complexity policy references, documentation roots, package/release adapters, and optional
  product-contract roles without embedding either product's values in portable code.
- Define a canonical gate-role graph with required order, required roles, permitted profile extensions, and explicit
  prevention of duplicate execution. The public roles must include setup, standard checks, portable-core verification,
  generic-surface, standalone, suppressions, typing, packaging, focus, smells, product contracts, test split,
  complexity, scaling, documentation, file size, and coverage.
- Add schema/contract negative tests for unknown versions, unknown fields, missing roles, reordered required roles,
  duplicate roles, invalid commands, external paths, product tokens in portable data, and self-recursive command graphs.

Exit conditions:

- Both repositories accept the same portable contract/profile schema bytes and the same canonical role graph.
- Every current difference is recorded in validated data or eliminated; no behavior is classified only in prose.
- Clean and failing contract fixtures pass in both repositories.
- Targeted schema, shared-core, generic-surface, and command-graph tests pass in both repositories.

### 2. Canonicalize and sign all generic rule semantics

Intent: make every canonical generic rule one byte-identical, signed implementation with no project-module
reach-through.

Dependencies: section 1.

Deliverables:

- Move or rewrite all 21 canonical generic rule implementations behind one product-neutral interface under the signed
  portable tree. The interface must accept explicit file descriptors/profile scopes and return deterministic findings.
- Move reusable parsing, source masking, static-name resolution, duplicate detection, and namespace-policy primitives
  needed by generic rules into signed portable modules; keep product names and source globs in profiles.
- Remove Repository P's filtering of generic IDs from project rule modules and remove any Repository V generic file that
  embeds product scope or local exception behavior.
- Make the portable contract enumerate the exact implementation owner for every canonical rule and fail on missing,
  duplicate, reordered, project-owned, or unmanifested owners.
- Derive `genericRulesSha256` from the complete contract-owned implementation set, not an incompletely representative
  directory convention.
- Bump the portable core to `4.0.0` only when the complete new semantic boundary and migration tests are present.

Exit conditions:

- `portable-core:attest` outputs the same `coreVersion`, manifest digest, generic-rule digest, entry map, and rule-owner
  map in both repositories.
- A recursive byte comparison of every contract-owned generic implementation is empty.
- Removing, changing, duplicating, or moving any generic owner fails `check:shared-core` and changes attestation.
- `check:generic-surface` proves the entire canonical implementation set is product-neutral.
- Existing repository-specific clean/failing rule tests remain green without weakening their assertions.

### 3. Replace descriptive corpus checks with executable semantic conformance

Intent: prove that the same generic inputs produce the same findings in both repositories and future generated projects.

Dependencies: section 2.

Deliverables:

- Replace the current descriptive/empty-input tests with one byte-identical, schema-validated executable corpus.
- Give every canonical rule at least one clean case and one failing case containing real relative paths, source text,
  profile inputs, expected normalized finding fields, and expected finding count.
- Add multi-file cases for duplicate functions/blocks and composed/static-name cases for unsafe sinks.
- Add language-neutral cases plus JS-, Markdown-, CSS-, shell-, JSONC-, TOML-, YAML-, and Python-shaped inputs wherever
  the rule claims those surfaces.
- Execute the same corpus through the portable registry in both repositories and compare normalized results to a shared
  golden result. Do not maintain separate expected results.
- Add tamper tests proving a rule implementation, corpus case, expected result, or corpus schema cannot change without
  manifest/attestation and core-version consequences.

Exit conditions:

- Every canonical rule demonstrably accepts at least one clean fixture and rejects at least one failing fixture.
- Both repositories emit byte-identical normalized conformance output and digest.
- Omitting a rule, skipping a case, returning an extra finding, changing line/path normalization, or accepting a failing
  seed breaks both gates.
- The corpus and runner contain no product token and are suitable for direct inclusion in a future greenfield project.

### 4. Make live gate ownership and command semantics identical

Intent: ensure the signed engines—not parallel local implementations—own the live quality graph in both products.

Dependencies: sections 1 through 3.

Deliverables:

- Add a byte-identical portable gate orchestrator that reads the validated local profile, executes the canonical role
  graph exactly once, preserves stdout/stderr and exit status, and rejects missing, duplicate, recursive, reordered, or
  undeclared roles.
- Make `check:all`, `check:core`, `check:fast`, `check:standalone`, and `check:suppressions` use the same public command
  names and portable entrypoints in both `package.json` files. Product-specific work runs through declared profile
  roles, not by changing the portable order.
- Remove the obsolete `check:standalone-boundary` public alias after documentation/tests migrate, unless a short
  deprecation alias is mechanically proven not to create a second owner; the final acceptance state has one canonical
  name.
- Route Dyninstruments suppression and standalone scanning through the signed engines. Delete superseded local engines
  rather than retaining dormant alternatives.
- Audit all portable engines and prove each is reached from the appropriate live command in both repositories. Reject
  attested-but-unreachable and live-but-unattested engine implementations.
- Keep language/product differences in adapters: Repository P's Ruff/mypy/pytest/Python contracts and Repository V's
  Vitest projects/legacy complexity ratchet remain required, but the profile declares where they attach.
- Normalize summary result shapes and stable machine-readable evidence for shared roles while permitting
  product-specific detail payloads.

Exit conditions:

- Package command-graph tests in both repositories prove the same canonical role order and exactly-once execution.
- A generated fake-command fixture proves first-failure propagation and prevents later-role execution after failure.
- Every signed engine has a live reachability proof; every live portable owner is signed.
- Searches find no obsolete parallel suppression, standalone, command-graph, or generic-rule owner.
- Targeted standard, shared-core, standalone, suppression, typecheck, focus, smell, package, and test-split commands
  pass in both repositories.

### 5. Close suppression and maintained-source coverage gaps

Intent: make the documented zero-suppression policy true across every claimed maintained surface.

Dependencies: section 4.

Deliverables:

- Extend the canonical suppression engine to parse comments in JS/MJS/CJS/TS, CSS, HTML, Markdown HTML comments, fenced
  Markdown code examples, Python, shell, JSONC, TOML, YAML, and workflow/config files without matching ordinary string
  literals or explanatory prose.
- Define supported fenced-code languages and comment syntax in profile-neutral data; unknown fenced languages must not
  silently broaden suppression semantics.
- Add runtime-generated negative fixtures for every supported comment surface, including the previously escaping fenced
  JavaScript directive and Python `noqa`/typed-ignore forms.
- Keep negative directives out of maintained repository text by constructing them from neutral fragments at test time.
- Reconcile the portable suppression owner with ESLint/Ruff/mypy/coverage native suppression owners; prove independent
  detection where two-owner policy is claimed and document single-owner cases honestly.
- Audit documentation claims in both repositories so scan scope, exclusions, and exception mechanisms exactly match
  executable behavior.

Exit conditions:

- Both live `check:suppressions` commands reject every generated negative fixture and accept clean lookalike strings.
- Adding a directive to a valid, indexed Markdown page's fenced example fails the targeted suppression check before any
  unrelated documentation-shape contract is considered.
- Repository V and Repository P report identical normalized findings for the shared suppression corpus.
- No maintained suppression directive or new exception exists in either working tree.

### 6. Produce one quality-grade, profile-driven greenfield starter

Intent: turn the shared generator into a trustworthy future extraction path while retaining an explicitly minimal first
lesson.

Dependencies: sections 1 through 5.

Deliverables:

- Keep the existing seven-file output only as an explicitly named minimal/smoke level; do not describe it as the
  high-quality environment.
- Add a quality level generated from byte-identical templates and portable-core bytes, with at least:
  - a viewer-only AvNav plugin profile; and
  - a Python-plus-viewer profile with Python 3.9-compatible stdlib-only runtime boundaries.
- Support both documented `--key=value` and conventional `--key value` CLI forms, reject duplicates/unknowns/unsafe
  paths, and print stable help text with profile/level choices.
- Give generated quality projects the canonical command names/role graph, maintained formatter/linter/type/test/schema/
  coverage/duplication/documentation tooling, read-only quality CI, pre-push hook, deterministic package/release checks,
  zero-suppression policy, and a concise beginner workflow.
- Use strict greenfield defaults: no legacy complexity or coverage debt, no baseline exceptions, no product token, no
  generated source copied from either product, and no runtime dependency or build step.
- Add executable mutation tests that generate each quality profile and prove `check:all` rejects unsafe evaluation,
  direct unsafe DOM sinks, `var`, console leftovers, focused/skipped tests, uncovered behavior, malformed metadata,
  duplicate logic, excessive complexity/file size, suppression directives, broken documentation, invalid package
  contents, external-root references, and profile/manifest tampering.
- Prove clean generated projects pass their complete quality gate from isolated directories. Keep starter tests bounded
  by sharing a prepared template/tool cache rather than weakening the generated gate.

Exit conditions:

- Both repositories generate byte-identical trees for the same arguments and distinct deterministic trees for each
  supported profile/level.
- The exact README CLI examples run successfully end to end in both repositories.
- Clean generated quality projects pass their own `check:all`; every mutation fixture fails at the intended owner with
  no unrelated prerequisite failure.
- A token scan proves generated output contains neither source product's names, paths, namespaces, baselines, release
  formats, or runtime behavior.
- The generated quality environment can be copied outside both checkouts and run after documented provisioning without
  reading either source repository.

### 7. Synchronize developer documentation and CI workflow

Intent: make both repositories teach the same quality workflow and accurately distinguish portable policy from product
profiles.

Dependencies: sections 1 through 6.

Deliverables:

- Update both `README.md` files with the canonical commands, minimal-versus-quality starter distinction, supported
  profiles, exact CLI examples, provisioning requirements, and extraction-readiness statement.
- Update both quality-gate conventions with the same portable-core version, manifest/rule/corpus attestation fields,
  canonical role graph, live-engine reachability rule, profile boundary, isolation meaning, and generated-project gates.
- Update coding standards and smell-prevention catalogs for canonical generic ownership, executable conformance,
  suppression scope, no parallel owner, and generated-project mutation requirements.
- Update both `CONTRIBUTING.md` files and relevant setup/testing/documentation-maintenance/release guides without
  duplicating canonical policy prose.
- Keep each documentation index current if pages are added, moved, or removed; preserve required page shape.
- Remove the duplicate CI `npm ci` by making workflow provisioning call one documented owner. Keep Node/Python setup
  differences explicit and keep quality CI read-only with pinned actions.
- Ensure the tag publisher remains transport-only and does not reinstall dependencies, rerun quality, build, commit, or
  tag.

Exit conditions:

- README and contributor instructions in both repositories describe the same command names and starter semantics.
- Documentation contains no stale `3.0.0` claim, old starter syntax, old standalone command, bypassed engine owner, or
  statement that the minimal scaffold supplies the full quality system.
- Documentation lint, link, format, TOC/reachability, smell-catalog, pointer, and workflow contract checks pass in each
  repository.
- Each quality workflow performs one Node dependency installation and then runs the same canonical quality role graph.

### 8. Prove perfect parity, independent operation, and migration safety

Intent: finish only with reproducible evidence that both examples are aligned and remain independently complete.

Dependencies: sections 1 through 7.

Deliverables:

- Run a cross-repository parity audit over the complete contract-owned inventory, generic rule/corpus output, core
  version, manifest, attestation, command-role schema, public command names, common maintained-tool versions, starter
  generator/templates, CI role sequence, and documentation contract claims.
- Run each repository's targeted portable self-tests, project product tests, coverage inventories, complexity/scaling
  gates, package checks, documentation checks, smell scans, and complete `npm run check:all`.
- Run `npm run check:all` again from separate isolated copies containing only each provisioned repository; do not use
  symlinks or sibling paths.
- Generate every starter profile from both repositories into separate isolated roots, compare outputs byte-for-byte,
  provision as documented, run their complete gates, and run the mutation suite.
- Review both diffs against the smell catalogs and confirm no test, floor, baseline, schema, or policy was weakened.
- Record exact HEADs, command results, counts, coverage summaries, core/manifest/rule/corpus digests, isolated-copy
  paths, starter tree digests, and the zero-diff inventory result in this plan's completion evidence.

Exit conditions:

- Both original repositories and every clean generated quality profile pass their canonical full gates.
- The cross-repository portable inventory and generated trees have zero unexplained byte differences.
- Both attestations are identical for all portable semantic fields; local profile digests differ only where the
  validated product data differs.
- Both repositories pass with the sibling directory absent/unavailable after provisioning.
- Working-tree review shows only intentional implementation/documentation changes and no policy escape.
- This plan is marked complete and moved to `exec-plans/completed/`; no Repository P plan is created.

## Progress Tracking

- [x] Section 1: alignment contract, profile schema, and canonical role graph are shared and validated in both
      repositories.
- [x] Section 2: all 21 canonical generic rules now dispatch to the byte-identical signed implementation set; the four
      former Repository P project definitions are no longer owners. The contract signs 44 paths, including the four
      focused generic-rule modules, and core version 3.2.0 records the semantic/attestation boundary.
- [x] Section 3: executable shared conformance corpus covers all 21 rules with clean/failing cases and shared golden
      output.
- [x] Section 4: public command names, role order, suppression/standalone entrypoints, and live signed generic dispatch
      are aligned; targeted role and reachability checks pass.
- [x] Section 5: suppression and maintained-source gaps are covered by the signed scanner and profile-aware checks.
- [x] Section 6: the quality starter now embeds the signed portable core, real pinned formatter/linter/type/schema/test/
      coverage/duplication/documentation tools, deterministic lockfile generation, generic profile adapters, and a
      strict role graph. Viewer-only and Python-plus-viewer outputs are byte-identical between repositories.
- [x] Section 7: README, contributor docs, conventions, guides, and CI synchronization deliverables are present and
      documentation gates pass in the latest completed runs.
- [x] Section 8: both source repositories and both generated quality profiles pass complete gates after the final 3.2.0
      implementation, with fresh isolated dependency provisioning, zero portable-tree differences, and recorded coverage
      summaries. This plan is complete and is archived without a Repository P plan.

## User-Facing Documentation Impact

`README.md` changes are mandatory in both repositories because this work changes contributor setup, canonical command
names, starter invocation/options, generated environment capabilities, CI provisioning, and the claimed reusable-core
contract. At minimum update:

- Dyninstruments `README.md` Development section.
- Repository P `README.md` For developers section.
- Both `CONTRIBUTING.md` setup, fast/full gate, hook, and starter guidance.
- Both quality-gate convention pages and any linked testing/setup/documentation-maintenance pages whose commands or
  ownership change.
- Both coding/smell conventions where generic-rule or suppression ownership changes.

Do not add user-facing product feature claims: product runtime behavior is out of scope. Documentation must clearly say
that the products are profiles/examples of the shared environment and that future central extraction is not yet a
runtime dependency.

## Acceptance Criteria

### Portable identity

- The two repositories report the same new core version and identical manifest, generic-rule, conformance-corpus,
  gate-schema, and portable-entry digests.
- Every portable path is byte-identical; every portable semantic owner is signed; every signed executable owner is live.
- A semantic change without a core-version/manifest update fails closed.

### Semantic parity

- All canonical generic rules have executable clean/failing cases and identical normalized results in both products.
- No generic rule imports a project module or embeds product identity/scope.
- Shared suppression fixtures, including Markdown fences and Python comments, produce identical findings.

### Profile integrity

- Product-specific paths, languages, checks, floors, baselines, schemas, and release payloads exist only in validated
  profiles/adapters.
- Dyninstruments keeps every current browser/widget quality obligation and historical ratchet.
- Repository P keeps every current Python/viewer/server quality obligation and runtime compatibility check.

### Command and delivery parity

- Public quality command names and canonical role order match across repositories.
- Each required role runs exactly once, propagates failure, and reaches the signed owner.
- Quality CI is read-only, action-pinned, and provisions dependencies once; publishing remains transport-only.

### Greenfield readiness

- Both source repositories generate identical minimal, viewer-quality, and Python-viewer-quality outputs.
- Generated quality profiles pass isolated full gates and reject the complete mutation catalog.
- Generated output is product-neutral, runtime dependency-free, no-build, documented for beginners, and independently
  usable after setup.

### Non-regression and completion

- No coverage/complexity/test inventory floor or immutable capture is lowered or bypassed.
- Both `npm run check:all` commands pass locally and from isolated copies.
- Documentation and README contracts are synchronized in both repositories.
- One completed plan in Repository V contains all evidence; Repository P contains no duplicate plan.

## Required Validation Commands

Run from each repository unless explicitly described as a cross-repository comparison:

```bash
npm run check:shared-core
npm run portable-core:attest
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
npm run test:coverage:check
npm run check:all
```

Cross-repository and generated-project validation must use explicit temporary paths, compare only contract-declared
inventories, and leave neither product repository dependent on the comparison location. Record the concrete commands and
digests in Completion Evidence rather than committing machine-local paths.

## Completion Evidence

Evidence snapshot captured 2026-08-01. The acceptance state is **Complete**.

Implemented and verified:

- The migration working-tree HEADs are `6782cf8eeef48d1153dfabe88b964c1140fac6ee` (Repository V) and
  `bb882b3036f564a1adb5c2601768b1f7cbaed109` (Repository P). Changes are intentionally uncommitted for handoff;
  Repository P contains no execution plan.
- Both attestations are identical: `coreVersion: 3.2.0`,
  `manifestSha256: 063b6043b352c0c69f4e8a0185c916c40abaa9a9b283307188d9a28082710a00`, and
  `genericRulesSha256: a3b6a22066d4fa19dadd86e64cc821f1549eb9f471afd124346b6360e165c313`.
- The signed contract contains 44 mandatory paths and 21 canonical rules. A direct comparison of every contract path,
  the role graph, attestation records, generic corpus, and generic implementation tree is byte-identical (zero
  mismatches). The five generic-rule implementation modules are all below 400 lines and live dispatch reaches each
  signed owner.
- The executable conformance corpus covers all 21 rules with 23 clean/failing cases, including multi-file duplicate
  cases. `check:generic-surface` and `check:generic-conformance` report zero findings in both repositories. Signed
  suppression and standalone owners are live; targeted suppression, focus, smell, packaging, typing, scaling, and
  documentation checks pass.
- Fresh source full gates pass with escalation enabled for nested process proofs: Repository V `npm run check:all` exits
  0 (96 Node files/621 tests, 336 DOM files/1,258 tests, 92.28% statements, 79.86% branches, 96.84% functions, 93.27%
  lines; coverage inventory 228 files); Repository P exits 0 (359 Python tests, 400 tool tests, 47 viewer tests, 1
  plugin test, 95.78% Python coverage, 91.19% viewer statements / 74.35% branches / 85.99% functions / 92.46% lines).
  Both source file-size gates report zero violations and both `git diff --check` checks are clean.
- The quality starter is a real maintained-toolchain extraction, not a policy-only scaffold: it embeds the signed
  portable core and generic adapter, pinned Prettier/ESLint/TypeScript/Ajv/Vitest/V8/jscpd/Markdownlint/Linkinator
  tooling, deterministic lockfile template, CI, hooks, schema, coverage, focus, complexity, scaling, suppression,
  documentation, and file-size checks. Product names were removed from the generated token inventory after the
  standalone audit; only neutral project/host placeholders remain.
- Fresh generation from both repositories is byte-identical for both supported quality profiles. Viewer-only trees have
  68 files and digest `4b7d18dcc362718902d7e595c5d7038afd8d28c719611d93e4b958ae14b81525`; Python-plus-viewer trees have
  70 files and digest `505c2f4a2b33a2ea28c08bc80fce921b4f3e4e0c63be026f569b0b612bc4ac1e` (digests exclude
  `node_modules/` and coverage output). Each pair was provisioned with `npm ci --ignore-scripts --no-audit --no-fund`
  and passed isolated `npm run check:all` with 100% generated runtime coverage (4/4 statements, 4/4 branches, 1/1
  functions, 3/3 lines). The generated quality trees contain no Dyninstruments/Polarrecorder token, path, namespace,
  baseline, or release payload.
- The quality CI has one dependency-install owner, public standalone/suppression names are normalized, and no second
  Repository P plan was created. The required mutation/negative fixtures remain owned by the source repositories' live
  tests; no floor, baseline, suppression, skip, focus, or warning-only escape was added.

Residual scope note: the Python-plus-viewer starter intentionally keeps its runtime stdlib-only and uses the shared Node
quality graph for generated policy enforcement; adding a Python package manager/toolchain is outside the portable
starter contract. The generated `plugin.py` boundary is included and file-size/type policy covers the copied source.

## Related

- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Prior portable-core foundation](../completed/PLAN45.md)
