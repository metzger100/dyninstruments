# Guide: Testing and Regression Checks

**Status:** ✅ Active | Vitest + coverage workflow for dyninstruments

## Overview

Use this guide to run and interpret the plugin regression suite before or after feature work.

## Commands

Run from repository root:

```bash
npm test
npm run test:coverage
npm run test:coverage:check
npm run check:naming
npm run check:patterns -- --warn
```

## What Is Covered

- Cluster mapper logic (`cluster/mappers/*.js`)
- Cluster routing and renderer delegation (`cluster/ClusterWidget.js`, `cluster/rendering/ClusterRendererRouter.js`)
- Runtime bootstrap and registration (`plugin.js`, `runtime/*.js`)
- Cluster config update functions (`config/clusters/*.js`, focus on dynamic store key behavior)
- Shared gauge math/value/tick modules (`shared/widget-kits/gauge/GaugeAngleMath.js`, `GaugeTickMath.js`, `GaugeValueMath.js`)
- Registration naming contracts (`config/components.js`, `config/clusters/*.js`, and component UMD/`id` literals)
- Pattern drift rules (`tools/check-patterns.mjs`): duplicate helper declarations, forbidden `window.avnav`/`avnav.api`, empty catches, non-runtime console logging, and ownerless maintenance markers

## Coverage Gates

- Global thresholds are configured in `vitest.config.js` (`lines/functions/statements/branches`)
- Extra strict module-group checks are enforced by `tools/check-coverage.mjs`
- Registration naming checks are enforced by `tools/check-naming.mjs`
- Pattern drift checks are enforced by `tools/check-patterns.mjs`

`npm run test:coverage:check` runs the coverage layers.
`npm run check:naming` runs the naming registration linter.
`npm run check:patterns -- --warn` reports drift findings without failing CI while known violations are being refactored.

## Notes

- Tests run in jsdom with custom harness helpers under `tests/helpers/`
- AvNav globals are mocked explicitly (`avnav.api`, `AVNAV_BASE_URL`) for bootstrap/runtime contract testing
- Phase 1 intentionally excludes image snapshot testing

## Related

- [../README.md](../README.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
