# Guide: Release Workflow

**Status:** ✅ Implemented | Local-first release process for dyninstruments

## Overview

Releases are created locally and committed into the repository first. GitHub Releases is a secondary copy target that publishes the already-created zip and notes. But don't push the release.

## Key Details

- Local authority: `npm run release:prepare` + `npm run release:create`.
- Version source of truth: git tag `vX.Y.Z`.
- `release:create` required gates: `npm run check:core` and `npm run test:coverage:check`.
- `release:create` advisory-only gate: `npm run perf:check` (failure warns and continues by design).
- Release artifacts written to `releases/`:
  - `releases/dyninstruments-X.Y.Z.zip`
  - `releases/dyninstruments-X.Y.Z.md`

## Prerequisites

- Install dependencies: `npm install` (or `npm ci`).
- Ensure `zip` command is available in `PATH`.

## Step-By-Step Release Flow

1. Prepare release context.

```bash
npm run release:prepare
```

2. Review the JSON output and decide the next SemVer version.
3. Write release notes markdown (for example: `tmp/release-notes-v1.4.0.md`).
4. Create the release artifacts, commit, and annotated tag.

```bash
npm run release:create -- --version=X.Y.Z --notes=path/to/notes.md
```

`release:create` runs required gates (`check:core`, `test:coverage:check`), runs `perf:check` as advisory-only, builds the zip, copies notes into `releases/`, commits both artifacts, and creates an annotated `vX.Y.Z` tag.

## SemVer Decision Guide

| Bump | Use when |
|---|---|
| Major (`X+1.0.0`) | Breaking behavior or contract changes for users/configurations |
| Minor (`X.Y+1.0`) | New user-facing features without breaking existing setups |
| Patch (`X.Y.Z+1`) | Fixes, refactors, docs, and non-breaking maintenance |

`release:prepare` outputs `semverHint` from commit messages (`feat:` -> minor, `fix:` -> patch, `BREAKING:` or `!` -> major). Treat this as a suggestion; override it if the real user impact differs.

## Release Notes Writing Guide

- Write for end users first; avoid internal implementation jargon.
- Summarize visible improvements and fixes.
- Include upgrade notes only when users must take action.

Suggested structure:

```markdown
# dyninstruments vX.Y.Z

## Highlights
- ...

## Fixes
- ...

## Notes
- ...
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `release:create` fails on `check:core` | Lint/docs/contracts gate failure | Run `npm run check:core`, fix all failures, rerun release |
| `release:create` fails on notes path | Missing or empty `--notes` file | Create/populate the markdown file and rerun |
| `release:create` fails with duplicate tag | `vX.Y.Z` already exists | Choose next version or delete/retarget tag intentionally |
| Release zip/notes missing after run | Release command aborted before artifact stage | Fix earlier error and rerun full command |

## Related

- [documentation/TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
