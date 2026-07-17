# Quality Gates

**Status:** ✅ Implemented | Command graph and checker ownership map

## Overview

This convention maps the repository quality commands to their checker scripts and rule ownership.
Use it to choose the smallest local gate during iteration and the required final gate before finishing work.
The local command graph is authoritative. Tag pushes rerun the complete gate
before GitHub publishes artifacts prepared and committed locally.

## Key Details

- `npm run check:all` is the default complete local gate.
- `.pre-commit-config.yaml` provides optional local fast-feedback hooks; it is
  not a replacement for the complete local gate.
- `check:core` starts with `check:standard`, `typecheck`, `package:check`,
  `test:contract`, and the focused-test configuration proof, then runs static
  docs, smell, and size checks.
- `check:standard` owns the additive standard-tool layer: scoped Prettier
  config/workflow formatting, ESLint flat config, Stylelint, pinned actionlint
  workflow validation, and fail-on-detection jscpd duplication checking.
- `typecheck` owns the scoped strict TypeScript `checkJs` baseline in `tsconfig.checkjs.json`.
- Prettier covers the migration-owned config/workflow/type/schema scope; runtime,
  test, tool, CSS, and Markdown surfaces have an explicit deferred disposition
  until each directory can be formatted without violating the absolute 400-line gate.
- `check:smells` runs the static pattern smell gate; semantic smell
  contracts live in `test:contract`.
- `docs:check` starts with markdownlint-cli2, then runs Linkinator for local
  Markdown links/fragments and the retained project-specific graph, stale-
  phrase, shape, and reachability contracts.
- `test:coverage:check` owns Vitest coverage generation and native global/glob
  threshold enforcement.
- Required local gates use Node/Vitest only; no command may require
  Playwright, a downloaded browser, or a browser driver.
- Release creation is locally gated by `check:all` before package creation.
- `.github/workflows/publish-release.yml` reruns `setup` and `check:all` in a
  read-only tag quality job; the write-privileged publisher depends on it and
  never rebuilds release artifacts.

## API/Interfaces

| Command | Expands To | Purpose |
|---|---|---|
| `npm run setup` | `npm ci` + actionlint provisioning | Locked Node tooling install and persistent actionlint cache |
| `npm run check:fast` | `check:standard` + `typecheck` + `test:node` | Fast local feedback without the full coverage gate |
| `npm run check:all` | `check:core` + `test:coverage:check` | Required final gate |
| `npm run check:core` | `check:standard` + `typecheck` + `package:check` + `test:contract` + `test:focus:check` + `check:smells` + docs + file size | Static repository gate |
| `npm run check:standard` | `format:check` + `lint` + `actions:lint` + `duplication:check` | Standard-tool static layer |
| `npm run typecheck` | `tsc -p tsconfig.checkjs.json` | Strict no-emit `checkJs` baseline |
| `npm run schema:check` | Ajv validation for `plugin.json` and bundled layouts | Declarative JSON contract gate |
| `npm run package:check` | `schema:check` + focused Node release/package tests | Release/package contract gate |
| `npm run test:package` | Release prepare/create/zip-builder Vitest files in `unit-node` | Focused package test suite |
| `npm run test:contract` | Vitest `contract` project | AVnav/plugin registry, source-shape, cluster config, bootstrap, bundled layout, and runtime loading contracts |
| `npm run test:focus:check` | Focused fixture through direct config and all configured projects | Fails if any real Vitest configuration permits `.only` |
| `npm run format:check` | `prettier --check` over config/workflow/package files | Scoped formatting gate |
| `npm run lint` | `eslint .` + `stylelint` over plugin/shared/widget/test CSS | Standard JS/CSS lint gate |
| `npm run actions:lint` | Pinned `rhysd/actionlint` binary over `.github/workflows/*.yml` | GitHub Actions workflow gate |
| `npm run duplication:check` | `jscpd --config jscpd.config.json --exit-code=1` | Zero-clone cross-file duplication gate |
| `npm run check:smells` | `npm run check:patterns` | Static smell policy gate |
| `npm run docs:check` | `docs:lint` + `docs:links` + project-specific docs contracts | Documentation-only shortcut |
| `npm run docs:links` | Linkinator with `linkinator.config.json` over root/docs/active-plan Markdown | Offline local link and fragment validation |
| `npm run check:docformat` | Documentation-format Vitest contract | Required docs shape gate |
| `npm run docs:lint` | `markdownlint-cli2` | Maintained Markdown lint baseline |
| `npm run test:coverage:check` | `vitest run --coverage` with native thresholds | Coverage gate |
| `npm run test:split` | Vitest configured `unit-node` + `contract` + `unit-dom` projects | Split environment regression gate |

| Checker | Rule Ownership |
|---|---|
| `tools/check-patterns.mjs` | Static smell rules, suppression validation, mapper complexity, clone detection |
| `tests/contract/*contract.test.js` | Semantic smell, AVnav, registry, source-shape, and repository contracts |
| `tools/check-file-size.mjs --oneliner=block` | 400-line limit and oneliner compression kinds |
| `tests/contract/documentation-links-contract.test.js` | JS `Documentation:` targets and stale/forbidden phrase detection |
| `tests/contract/documentation-format-contract.test.js` | Required doc sections and format exceptions |
| `tests/contract/documentation-reachability-contract.test.js` | Documentation reachability from `AGENTS.md` or `CLAUDE.md` |
| `tests/contract/ai-instruction-pointer-contract.test.js` | `CLAUDE.md` short-pointer ownership for canonical `AGENTS.md` guidance |

## Standard Tool Baselines

| Tool | Scope | Baseline |
|---|---|---|
| Prettier | `package.json`, workflow YAML, quality configs, declaration files, and schemas | Runtime, test, tool, CSS, and Markdown formatting remains an explicit deferred disposition until each directory can be formatted without violating the 400-line gate; negative quality fixtures are excluded by name and exercised by their owner tests |
| ESLint | Repository JS/MJS with script-mode runtime overrides and module-mode tools | `eslint-plugin-jsdoc` requires a leading `@file` overview on shipped JavaScript; `no-unused-vars` and `no-useless-assignment` are active for module/tooling owners; legacy UMD runtime/config surfaces and split test harnesses have explicit scoped exceptions |
| Stylelint | `plugin.css`, `shared/**/*.css`, `widgets/**/*.css`, `tests/css/**/*.css` | Formatting-preference rules disabled where they conflict with existing CSS contracts |
| actionlint | `.github/workflows/*.yml` through `tools/actionlint.sh` | Pins upstream `rhysd/actionlint` v1.7.12 and verifies official SHA-256 release digests |
| jscpd | Runtime/tool JS and CSS, excluding docs/tests/releases/artifacts | Zero known clones; the gate fails on newly detected duplication |
| markdownlint-cli2 | Root docs and `documentation/**/*.md` | Style-noisy rules disabled until docs cleanup can be reviewed separately |
| pre-commit | Local system hooks for `format:check`, `lint`, `actions:lint`, and `docs:check` | Fast feedback only; the complete local gate remains `check:all` |
| TypeScript `checkJs` | All 211 shipped production JavaScript files plus `vitest.config.js` and six declaration files: shared format/value/layout/geometry/responsive/canvas/text/radial/linear/nav/vessel/XTE/state/HTML helpers, widget renderers, editable/configuration and registry modules, cluster mappers/viewmodels, runtime/bootstrap/surface/theme/host services, and UMD ambient globals. Test sources remain outside this source check because split harness files intentionally share globals. | Strict no-emit `tsconfig.checkjs.json`; the inventory contract fails on omissions or unexpected source inclusions |
| fast-check property tests | Critical math/format invariants in the `unit-node` project | Clamp/lerp bounds, angle normalization, placeholder-to-string, finite tick angles |
| Ajv schema validation | `plugin.json` and `layouts/*.json` | Release artifact contents are covered by `package:check` |
| Registry contracts | Vitest `contract` project | Component ID/globalKey/path uniqueness, broad component-source UMD/create-export parity, cluster widget-name parity, dependency existence/direction/cycles, retired owner-path absence (including performance), and runtime-owned service exclusion |
| JS doc traceability | ESLint plus `docs:check` | Every shipped JavaScript file has one leading `@file`; existing `Documentation:` targets must resolve; registry entries, not comment text, own dependencies |
| Package contracts | Release prepare/create/zip-builder tests plus `test:contract` in `check:core` | Release contents and bootstrap/package behavior are covered without an external browser dependency |
| Browser-facing integration | Vitest `unit-dom` plus `contract` | jsdom lifecycle/DOM coverage and VM bootstrap/registry contracts; no external browser automation is part of the development environment |
| Vitest coverage thresholds | Global and critical-area groups in `vitest.config.js` | Replaces the retired coverage-summary parser |

## Migration parity ledger

| Rule/check | Previous owner | Final owner | Positive / negative proof | Status |
|---|---|---|---|---|
| `global-isfinite` | `check-patterns` | ESLint `no-restricted-globals` on maintained source | `lint:js` / `tests/tools/quality-owners.test.js` | migrated |
| CSS custom-property namespace | no maintained owner | Stylelint `custom-property-pattern` | `lint:css` / namespace fixtures | migrated |
| focused tests | no maintained owner | ESLint core `no-restricted-syntax` + Vitest `allowOnly: false` | direct, chained, and computed lint fixtures + required `test:focus:check` through every real config | migrated |
| disabled tests | no maintained owner | ESLint core `no-restricted-syntax` | direct, `skip.each`, computed `skip`, and `todo` fixtures | migrated |
| production file overview | `check-headers.mjs` | `eslint-plugin-jsdoc` plus documentation-target contract | `lint:js` / missing-overview fixture and broken-target contract | migrated; registry owns dependencies |
| local Markdown files/fragments | `markdown-docs.js` parser | Linkinator API with offline config | `docs:links` / `docs:links:proof` | migrated |
| doc graph/stale phrases/JS targets | `markdown-docs.js` | focused contract helper | `check:doclinks`, `check:reachability` / contract fixtures | retained: project-specific |
| production TypeScript inventory | manual `tsconfig` list | inventory contract + `tsc --noEmit` | `typecheck` / inventory drift fixture | migrated |
| checker clone | duplicate helper bodies | canonical `maskCommentsAndStrings` | `duplication:check` / below-threshold clone exit proof | migrated |
| file size/oneliners | custom checker | custom checker | `check:filesize` / 401-line and oneliner fixtures | retained: project-specific |
| AvNav/UMD/mapper smells | custom checker/contracts | custom checker/contracts | `check:patterns`, `test:contract` / rule fixtures | retained: project-specific |
| native coverage thresholds | coverage parser | Vitest/V8 native thresholds | `test:coverage:check` / under-coverage proof | migrated |
| actionlint provisioning | npm cache download | verified persistent cache script | `setup`, `actions:lint` / missing-cache/checksum proofs | migrated |
| shared AI instruction synchronization | `ai:check` block sync | short `CLAUDE.md` pointer plus contract | `test:contract` / missing-pointer or duplicated-block regression | retained: simplified ownership |
| performance benchmark gate | perf runner/baselines | none | approved deletion; no runtime consumer | removed: approved exception |
| mutation testing | Stryker | none | approved deletion; coverage/property tests retained | removed: approved exception |
| release manifest | custom schema candidate | executable ZIP/package contracts | `package:check` / package fixtures | retained: generated-data contract |

## Rule Groups

| Gate | Rule Reference |
|---|---|
| Smell rules | [smell-prevention.md](smell-prevention.md) |
| UMD/component naming | [coding-standards.md](coding-standards.md#umd-component-template) |
| Dependency direction | [../../ARCHITECTURE.md](../../ARCHITECTURE.md) |
| Documentation format | [documentation-format.md](documentation-format.md) |

## Related

- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [smell-prevention.md](smell-prevention.md)
- [coding-standards.md](coding-standards.md)
