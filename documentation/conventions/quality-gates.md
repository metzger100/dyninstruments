# Quality Gates

**Status:** ✅ Implemented | Command graph and checker ownership map

## Overview

This convention maps the repository quality commands to their checker scripts and rule ownership.
Use it to choose the smallest local gate during iteration and the required final gate before finishing work.

## Key Details

- `npm run check:all` is the default completion gate and pre-push gate.
- `check:core` owns static docs, smell, size, header, dependency, UMD, naming, and AI-instruction checks.
- `check:smells` owns the executable smell-rule index documented in [smell-prevention.md](smell-prevention.md).
- `test:coverage:check` owns Vitest coverage generation and threshold enforcement.
- `perf:check` compares committed performance baselines in `perf/baselines/`.
- Release creation runs `check:core` and `test:coverage:check`; performance is advisory there, but blocking in `check:all`.

## API/Interfaces

| Command | Expands To | Purpose |
|---|---|---|
| `npm run check:all` | `check:core` + `test:coverage:check` + `perf:check` | Required final gate |
| `npm run check:core` | `check:smells` + docs + AI sync + file size + headers + deps + UMD + naming | Static repository gate |
| `npm run check:smells` | `node tools/check-patterns.mjs` + `node tools/check-smell-contracts.mjs` | Smell policy gate |
| `npm run docs:check` | `check-docs` + `check-doc-format --warn` + reachability + AI sync | Documentation-only shortcut |
| `npm run test:coverage:check` | `vitest run --coverage` + `node tools/check-coverage.mjs` | Coverage gate |
| `npm run perf:check` | `node tools/perf-check.mjs` | Performance baseline gate |

| Checker | Rule Ownership |
|---|---|
| `tools/check-patterns.mjs` | Static smell rules, suppression validation, mapper complexity, clone detection |
| `tools/check-smell-contracts.mjs` | Semantic smell contracts loaded/executed in VM contexts |
| `tools/check-file-size.mjs --oneliner=block` | 400-line limit and oneliner compression kinds |
| `tools/check-docs.mjs` | Markdown links/anchors, JS `Documentation:` headers, stale phrases |
| `tools/check-doc-format.mjs --warn` | Required doc sections and format exceptions |
| `tools/check-doc-reachability.mjs` | Documentation reachability from `AGENTS.md` or `CLAUDE.md` |
| `tools/check-ai-instructions.mjs` | Root agent-instruction synchronization |
| `tools/check-headers.mjs` | JS module header fields and documentation target existence |
| `tools/check-dependencies.mjs` | Component dependency directions and forbidden owner-module resurrection |
| `tools/check-umd.mjs` | UMD wrapper, `DyniComponents` registration, and `create` export shape |
| `tools/check-naming.mjs` | Component IDs, global keys, cluster widget names, registry/file parity |
| `tools/check-coverage.mjs` | Coverage thresholds for mapped source groups |
| `tools/perf-check.mjs` | Performance threshold comparison against committed baselines |

## Rule Groups

| Gate | Rule Reference |
|---|---|
| Smell rules | [smell-prevention.md](smell-prevention.md) |
| UMD/component naming | [coding-standards.md](coding-standards.md#umd-component-template) |
| Dependency direction | [../../ARCHITECTURE.md](../../ARCHITECTURE.md) |
| Documentation format | [documentation-format.md](documentation-format.md) |
| Performance baseline workflow | [../guides/performance-gate.md](../guides/performance-gate.md) |

## Related

- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
- [smell-prevention.md](smell-prevention.md)
- [coding-standards.md](coding-standards.md)
- [../guides/performance-gate.md](../guides/performance-gate.md)
