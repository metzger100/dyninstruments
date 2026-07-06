# Guide: Release Workflow

**Status:** ✅ Implemented | Local-centric release process for dyninstruments

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
- Public installer contract: `install.sh` expects the GitHub Release asset name `dyninstruments-X.Y.Z.zip`.
- If release asset naming changes, update `install.sh` and the README installation command in the same release.

## Prerequisites

- Install dependencies: `npm install` (or `npm ci`).
- Ensure `zip` command is available in `PATH`.

## Step-By-Step Release Flow

1. Prepare release context.

```bash
npm run release:prepare
```

2. Review the JSON evidence and decide the next SemVer version from actual impact.
3. Write the release notes markdown directly in the canonical release notes file: `releases/dyninstruments-X.Y.Z.md`.
   - Each bullet must tell a user what changed in concrete terms.
   - Prefer "what it does now" over "what was improved".
   - If a bullet does not answer "what exactly changed?" or "why should I care?", rewrite it.
   - Name the affected widget, flow, or behavior when that helps the reader understand the change.
4. Create the release artifacts, commit, and annotated tag.

```bash
npm run release:create -- --version=X.Y.Z
```

`release:create` runs required gates (`check:core`, `test:coverage:check`), runs `perf:check` as advisory-only, builds the zip, reads `releases/dyninstruments-X.Y.Z.md` directly, commits both artifacts, and creates an annotated `vX.Y.Z` tag.

## SemVer Decision Guide

| Bump | Use when |
|---|---|
| Major (`X+1.0.0`) | Breaking user-facing behavior, incompatible widget/config/runtime contracts, or required migration |
| Minor (`X.Y+1.0`) | New user-facing capability, new widget behavior or config, or non-breaking runtime work that exposes new behavior |
| Patch (`X.Y.Z+1`) | Bug fixes, flicker/performance/stability fixes, documentation, tests, refactors, release tooling, and other non-breaking maintenance |

`release:prepare` intentionally does not infer SemVer from Conventional Commit prefixes. This repository uses natural-language commits, so strings like `feat:`, `fix:`, `BREAKING:`, or `!` are not treated as release rules. Decide the next version by reviewing the commit messages, inspecting the diffs, and researching the affected runtime/config/widget/documentation code paths.

Required evidence for the decision:
- Commit messages as natural-language context.
- Diff stat, name-status, and full diff views.
- Codebase research in the touched runtime/config/widget/documentation areas.

## Release Notes Writing Guide

- Write for end users first; avoid internal implementation jargon.
- Describe the visible change, the user impact, and the reason to update.
- Prefer specific before/after wording:
  - good: "Startup loads a single bootstrap bundle in release builds, reducing script requests."
  - bad: "Improved startup performance."
- Prefer concrete behavior over broad umbrella phrases:
  - good: "Route Points now keeps natural height in vertical containers."
  - bad: "Tightened shared layout behavior."
- Mention user action only when the upgrade requires it.
- Keep each bullet understandable without having to inspect the diff.

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

Practical checklist for each bullet:

- What did the user gain or lose?
- Where do they see the change?
- Is there any required upgrade step?
- Would the sentence still make sense without repo context?

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `release:create` fails on `check:core` | Lint/docs/contracts gate failure | Run `npm run check:core`, fix all failures, rerun release |
| `release:create` fails on notes file | Missing or empty `releases/dyninstruments-X.Y.Z.md` file | Create/populate the markdown file in `releases/` and rerun |
| `release:create` fails with duplicate tag | `vX.Y.Z` already exists | Choose next version or delete/retarget tag intentionally |
| Release zip/notes missing after run | Release command aborted before artifact stage | Fix earlier error and rerun full command |

## Related

- [documentation/TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
