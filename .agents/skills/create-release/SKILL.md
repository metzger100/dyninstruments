---
name: create-release
description:
  Prepares, audits, versions, packages, commits, tags, and optionally publishes dyninstruments releases through the
  repository's canonical release workflow. Use when asked to inspect changes since the last release, choose a SemVer
  version, write release notes, create release artifacts, create a release tag, or push a prepared release.
---

# Create Release

Create releases from repository evidence while preserving the exact local workflow and its fail-closed boundaries. Treat
the maintained release guide as the authority; this skill supplies execution order and safety checks.

## Load the Release Contract

1. Run the repository `preflight` skill before release work.
2. Read `documentation/guides/release-workflow.md` completely.
3. Re-read the guide if it changed during the task.

Do not copy guide details into other documentation. Update this skill only when agent behavior changes; update the guide
when the repository's release contract changes.

## Establish Authority and Scope

Determine which outcome the user authorized:

- **Prepare:** inspect evidence, recommend a version, and draft notes without committing or tagging.
- **Create:** run the local release command, which writes artifacts, commits them, and creates an annotated tag.
- **Publish:** push the release commit and tag after local creation.

Treat a request to create a release as authorization for the documented local commit and tag. Never infer authorization
to push from a prepare/create request. Ask before pushing unless the user explicitly requested publication.

Never stash, discard, delete, overwrite, force, retarget, or clean unrelated work to satisfy a release precondition.
Report the exact blocking paths instead.

## Prepare the Evidence

1. From the plugin root, inspect `git status --short`.
2. Run `npm run release:prepare` on a completely clean worktree.
3. Preserve its JSON output as the baseline evidence, including the last release tag, commits, changed paths, runtime
   paths, and review commands.
4. Run every diff-review command listed in `semverReview.reviewCommands`.
5. Inspect the full diff for each changed production path. Production scope is the payload derived by
   `tools/release-zip-builder.mjs`, not a guessed folder list.
6. Inspect changed tooling and documentation only for release-process impact and SemVer context; do not describe them as
   shipped plugin behavior.

Do not infer impact from commit prefixes. Natural-language commits are context, while the actual diff and affected
runtime contracts decide the version and notes.

## Audit the Packaged Runtime

Before recommending that release creation proceed:

1. Confirm the release manifest is derived from the bootstrap manifest, component registry resources, fixed runtime
   entrypoints, bundled fonts, and layouts.
2. Confirm changed/new production files needed by AvNav are present in that derived manifest and dev-only files are
   absent.

`release:create` owns the single canonical `npm run check:all` invocation. Do not run a redundant full gate immediately
before a normal creation attempt. Focused diagnostics are allowed when resolving a failure.

## Choose the Version

Apply the guide's SemVer table to actual impact:

- Major for an incompatible user-facing, config, widget, or runtime contract.
- Minor for a new non-breaking user-facing capability or behavior.
- Patch for fixes, stability/performance work, refactors, documentation, tests, and release tooling.
- Prerelease for staged validation of the intended major, minor, or patch line.

State the recommended full SemVer and the concrete evidence supporting it. Obtain the user's choice when they did not
already specify the version; version selection changes artifact names, the commit, and the tag.

Before writing notes, verify that `vVERSION` does not already exist. Never delete or move an existing tag as an
automatic recovery action.

## Write Canonical Release Notes

Create only `releases/dyninstruments-VERSION.md`. Use the guide's structure and write for users:

- Describe the visible before/after behavior and where users see it.
- Name affected widgets, flows, packaging behavior, or requirements.
- Include upgrade action only when one is required.
- Keep internal implementation details out unless they materially explain user impact.
- Do not claim a fix or capability that is absent from the packaged production diff.

After writing notes, confirm `git status --short` contains only the canonical notes path. Any other dirty path blocks
creation.

## Create and Verify the Local Release

Run exactly:

```bash
npm run release:create -- --version=VERSION
```

Do not split, bypass, or reimplement this command. If it fails, fix the reported cause and rerun the complete command as
the guide directs.

After success, verify all postconditions:

1. `releases/dyninstruments-VERSION.zip` and `releases/dyninstruments-VERSION.md` exist at `HEAD`.
2. `unzip -t releases/dyninstruments-VERSION.zip` succeeds.
3. The release commit contains the matching ZIP and notes and no unintended paths.
4. `git cat-file -t vVERSION` reports `tag`, proving it is annotated.
5. The tag resolves to the release commit.
6. `git status --short` is clean.

Report the version, artifact paths, gate result, commit, and tag.

## Publish Only When Authorized

Require explicit publication authorization, then push in the guide's order:

```bash
git push origin main
git push origin vVERSION
```

Verify both pushes succeeded. Never use force push. Explain that the tag workflow validates and publishes the committed
artifacts; it does not rebuild them or rerun quality.

## Stop Conditions

Stop and report evidence instead of mutating around any of these conditions:

- Dirty paths outside the one canonical notes file permitted by `release:create`.
- Missing prerequisites or an unknown last-release baseline.
- Ambiguous version with no user decision.
- Missing, extra, or unreadable packaged production files.
- Failed quality gate, ZIP integrity, commit, or annotated-tag verification.
- Existing tag or artifact collision.
- Push not explicitly authorized.
