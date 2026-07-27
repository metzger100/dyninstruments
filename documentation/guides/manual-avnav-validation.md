# Guide: Manual AvNav Validation Checklist

**Status:** ✅ Implemented | Profile-aware live-host checklist for release validation

## Overview

Automated gates (`npm run check:all`) prove code, contract, and coverage correctness, but they run under jsdom/VM
simulation and cannot prove the plugin actually loads and renders inside a real AvNav host. This checklist is the single
place to record that human evidence before a release is considered validated. `npm run release:prepare` prints this
file's path as a reminder; it does not run or complete the checklist automatically.

## Key Details

- Fill in every field for each validation pass; do not mark a release validated from a partially completed record.
- Keep the completed record in the release notes, the pull request description, or a dated entry appended to this file
  under **Validation Log** — whichever the reviewing human prefers, as long as it is durable and reviewable.
- If no live AvNav environment is available, do not claim this checklist passed. Record exactly what is unverified and
  request the manual validation explicitly.
- This checklist is local-first evidence, not a required-gate command; it is never invoked by `check:all`.

## Checklist Template

```markdown
### Manual AvNav validation - <YYYY-MM-DD>

- Date: <YYYY-MM-DD>
- AvNav version: <version>
- Plugin commit/version: <git short SHA or release version>
- Environment: <host/device, OS, browser>
- Results:
  - [ ] Install/activate/load: plugin installs and `dyninstruments_*` widgets appear in layout edit mode
  - [ ] Representative radial gauge renders and updates from live/simulated data
  - [ ] Representative linear gauge renders and updates from live/simulated data
  - [ ] Representative HTML widget (for example Active Route or AIS Target) renders and updates
  - [ ] Day/night theme switch updates all checked widgets correctly
  - [ ] Route/AIS interaction controls (selection, activation, click-through) behave as expected
  - [ ] Plugin package upgrade over a previous installed version succeeds without manual cleanup
  - [ ] Rollback to the previous package version succeeds without manual cleanup
- Limitations/unverified items: <explicit list, or "none">
```

## Coverage Areas

| Area                     | What to verify                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Install/activate/load    | Plugin installs from the packaged ZIP, activates, and its widgets are selectable             |
| Representative widgets   | One radial gauge, one linear gauge, and one native HTML widget render and update             |
| Day/night theme          | Switching AvNav's day/night mode updates gauge/HTML widget colors as designed                |
| Route/AIS interactions   | Route point selection/activation and AIS target interaction controls work end to end         |
| Package upgrade/rollback | Upgrading over an older installed version, and rolling back to it, both work without cleanup |

## Validation Log

Append dated entries using the template above, newest first, or link to where the record lives (release notes/PR).

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [release-workflow.md](release-workflow.md)
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
