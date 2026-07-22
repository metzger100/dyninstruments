# Guide: Release Workflow

**Status:** ✅ Implemented | Local-centric release process for dyninstruments

## Overview

Releases are created, validated, packaged, committed, and tagged locally. A tag push only validates release identity and
publishes the already-committed ZIP and notes.

## Key Details

- Local authority: `npm run release:prepare` + `npm run release:create`.
- `release:prepare -- --help` is side-effect free; normal preparation requires a completely clean tree, including
  `releases/`.
- `release:create -- --version=VERSION` accepts full SemVer, including prereleases such as `4.0.0-beta.1` and optional
  build metadata.
- Release creation permits only the canonical dirty notes path `releases/dyninstruments-VERSION.md`; existing/dirty ZIPs
  and every other path fail before the quality gate.
- Version source of truth: git tag `vVERSION`.
- `release:create` required gate: one blocking `npm run check:all` invocation.
- `check:core` includes `npm run package:check`, which validates plugin/layout schemas and focused release/package
  tests.
- `package:check` verifies release manifests exclude tests, tools, docs, schemas, CI files, type declarations, package
  files, and dev-only quality configs.
- Release artifacts written to `releases/`:
  - `releases/dyninstruments-VERSION.zip`
  - `releases/dyninstruments-VERSION.md`
- Public installer contract: `install.sh` expects the GitHub Release asset name `dyninstruments-VERSION.zip`; pinned
  prereleases use the same naming rule.
- `tools/release-version.mjs` validates tag SemVer and classifies tags with a prerelease segment for GitHub publication.
  Build metadata alone does not mark a release as a prerelease.
- If release asset naming changes, update `install.sh` and the README installation command in the same release.

## Prerequisites

- Use Node 26 with npm 12.0.1, then run `npm run setup` from the plugin root. The first actionlint acquisition requires
  network access; later gates reuse the checksum-verified persistent cache.
- Ensure `zip` command is available in `PATH`.

## Step-By-Step Release Flow

1. Prepare release context.

```bash
npm run release:prepare
```

2. Review the JSON evidence and decide the next SemVer version from actual impact.
3. Write the release notes markdown directly in the canonical release notes file: `releases/dyninstruments-VERSION.md`.
   - Each bullet must tell a user what changed in concrete terms.
   - Prefer "what it does now" over "what was improved".
   - If a bullet does not answer "what exactly changed?" or "why should I care?", rewrite it.
   - Name the affected widget, flow, or behavior when that helps the reader understand the change.
4. Create the release artifacts, commit, and annotated tag.

```bash
npm run release:create -- --version=X.Y.Z
```

`release:create` runs one blocking `check:all` gate, builds the ZIP, reads `releases/dyninstruments-VERSION.md`
directly, commits both artifacts, and creates an annotated `vVERSION` tag. A prerelease uses the same command, for
example `npm run release:create -- --version=4.0.0-beta.1`.

5. Push the release commit and annotated tag.

```bash
git push origin main
git push origin vVERSION
```

The tag workflow validates the tag with the same SemVer owner used by `release:create`, verifies matching committed ZIP
and notes paths, and publishes those files. It does not install dependencies, rerun quality, build, package, commit, or
tag. Tags with a SemVer prerelease segment become GitHub prereleases; plain versions and versions with build metadata
only become normal GitHub releases.

## SemVer Decision Guide

| Bump                        | Use when                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Major (`X+1.0.0`)           | Breaking user-facing behavior, incompatible widget/config/runtime contracts, or required migration                                   |
| Minor (`X.Y+1.0`)           | New user-facing capability, new widget behavior or config, or non-breaking runtime work that exposes new behavior                    |
| Patch (`X.Y.Z+1`)           | Bug fixes, flicker/performance/stability fixes, documentation, tests, refactors, release tooling, and other non-breaking maintenance |
| Prerelease (`X.Y.Z-beta.N`) | Staged validation of an upcoming major, minor, or patch release before publishing it as stable                                       |

`release:prepare` intentionally does not infer SemVer from Conventional Commit prefixes. This repository uses
natural-language commits, so strings like `feat:`, `fix:`, `BREAKING:`, or `!` are not treated as release rules. Decide
the next version by reviewing the commit messages, inspecting the diffs, and researching the affected
runtime/config/widget/documentation code paths.

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
# dyninstruments vVERSION

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

| Symptom                                          | Likely Cause                                                   | Fix                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `release:create` fails on `check:all`            | Complete local gate failure                                    | Run `npm run check:all`, fix all failures, rerun release                                                |
| `release:create` fails on notes file             | Missing or empty `releases/dyninstruments-VERSION.md` file     | Create/populate the matching markdown file in `releases/` and rerun                                     |
| Preparation/creation reports dirty release paths | Stale ZIP, unrelated notes, or another uncommitted file exists | Commit, stash, or remove every path except the current canonical notes file used by `release:create`    |
| `release:create` fails with duplicate tag        | `vVERSION` already exists                                      | Choose next version or delete/retarget tag intentionally                                                |
| Tag workflow cannot find ZIP/notes               | The tagged commit lacks matching committed release inputs      | Create the release locally, commit its ZIP/notes, create a new annotated tag, and push it intentionally |
| Release zip/notes missing after run              | Release command aborted before artifact stage                  | Fix earlier error and rerun full command                                                                |

## Related

- [documentation/TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
