# Add New HTML Kind

**Status:** Current.

## Prerequisites

Read first:

- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md)
- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)

Read also:

- [../shared/stable-digits.md](../shared/stable-digits.md)
- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md)
- [layout-file-conventions.md](layout-file-conventions.md)
- [../conventions/testing-infrastructure.md](../conventions/testing-infrastructure.md)

## Overview

This guide describes how to add a new native HTML kind under the commit-driven architecture.

Core rules:

- pre-commit renderHtml returns inert shell only
- committed renderer owns semantic DOM inside shadow root
- interaction is direct DOM listener ownership under dispatch/passive policy
- layout uses shellRect from mount host
- pre-activation shell sizing comes from route metadata in `config.clusterRoutes.byRouteId`
- route metadata `shellSizing` owns pre-activation sizing; committed renderer shadow CSS owns post-activation sizing

## Key Details

- Registration fragment depends on kind domain: `config/components/registry-widgets-nav.js` for nav/route HTML kinds,
  `config/components/registry-widgets-vessel.js` for vessel HTML kinds; declare the `shadowCss` array on the component
  entry, never on route metadata.
- Route entry in `config/cluster-routes/<cluster>.js` needs `mapperId`, `rendererId`, `surface: "html"`, optional
  `viewModelId`, and `shellSizing`.
- Renderer contract: expose `createCommittedRenderer(rendererContext)` implementing `mount`/`update`/`postPatch`/
  `detach`/`destroy`, and optionally `layoutSignature(payload)`.
- Interaction modes read from `payload.props.surfacePolicy.interaction.mode`: `dispatch` attaches listeners and
  suppresses blank-space click propagation; `passive` attaches no action listeners; dispatch calls go through normalized
  callbacks in `surfacePolicy.actions`.
- Shadow-local CSS must scope root selectors under `.dyni-html-root`, must not depend on outer-document ancestry
  selectors, and must consume migrated `--dyni-theme-*` output vars for typography weights.
- For payloads needing more than 8 mapper properties, use grouped mapper output with `domain`/`layout`/`formatting` keys
  instead of a flat object (`check-patterns` rule `mapper-output-complexity` blocks above 8 properties).
- Shared editable audit is required per new kind: `stableDigits` condition array (default `false`, controls
  `dyni-tabular` fixed-width digits), `captionUnitScale` condition list, and `caption_{kind}`/`unit_{kind}: false`
  overrides after `...makePerKindTextParams(KIND_MAP)` for kinds without caption/unit rendering.

## Steps

1. Add mapper output and route metadata

- map normalized payload in cluster mapper
- add route entry in `config/cluster-routes/<cluster>.js` with `mapperId`, `rendererId`, `surface: "html"`, optional
  `viewModelId`, and `shellSizing`
- point `rendererId` at your renderer component
- keep transitive dependencies in `config/components`; the route entry stays data-only

1. Register component

- add renderer entry in the appropriate fragment: `config/components/registry-widgets-nav.js` for nav/route HTML kinds
  or `config/components/registry-widgets-vessel.js` for vessel HTML kinds
- declare shadowCss bundle via shadowCss array
- do not move route-specific shadowCss into route metadata

1. Implement renderer component

- expose createCommittedRenderer(rendererContext)
- implement mount/update/postPatch/detach/destroy
- optionally implement layoutSignature(payload)
- if vertical mode is supported, keep sizing behavior in the renderer's shadow CSS and committed layout logic

1. Keep shell and committed DOM separated

- shell remains inert and payload-invariant except route/sizing metadata
- semantic markup is produced only in committed renderer mount/update
- route metadata owns the pre-activation shell size, and the committed renderer shadow CSS owns the post-activation size
  behavior

1. Implement interaction policy

- use payload.props.surfacePolicy.interaction.mode
- dispatch mode: attach listeners and suppress blank-space click propagation inside wrapper
- passive mode: no action listeners
- dispatch via normalized callbacks in surfacePolicy.actions

1. Implement shadow-local CSS

- root selectors under .dyni-html-root
- do not depend on outer-document ancestry selectors
- consume migrated output vars for typography weights

1. Validate layout contract

- use payload.shellRect as authoritative committed layout source
- use layoutSignature + bounded postPatch relayout for layout-sensitive updates
- avoid observer loops and triggerResize-style rerender shims
- do not add a renderer-spec vertical-sizing hook

## Step 7: Required HTML Kind Test Matrix

- [ ] route resolves to html surface and committed renderer factory
- [ ] inert shell contains mount host and no semantic content
- [ ] committed renderer mount/update/detach/destroy behavior
- [ ] shadow CSS preload/injection for this renderer
- [ ] dispatch vs passive listener ownership
- [ ] dispatch-mode blank-space click suppression
- [ ] layoutSignature-driven relayout and bounded postPatch behavior
- [ ] route metadata shellSizing and committed shadow CSS sizing behavior

## Step 8: Shared Editable Integration

When adding a new kind to an existing cluster, audit all shared editables in that cluster config and scope each one for
relevance.

- `stableDigits`:
  - If the kind displays numeric or time text, add the kind to the `stableDigits` condition array.
  - `stableDigits` defaults to `false` and controls the `dyni-tabular` fixed-width digit class behavior.
  - Contract reference: [../shared/stable-digits.md](../shared/stable-digits.md).
  - Use existing cluster condition arrays as reference examples.
- `captionUnitScale`:
  - If the kind does not render caption/unit text (for example interactive controls, timers, map zoom), exclude it from
    `captionUnitScale`.
  - If `captionUnitScale` is currently unconditional, add a condition list that includes only relevant kinds.
  - Pattern reference: `NAV_TEXT_KIND_CONDITION` in `config/clusters/nav.js`.
- `caption_{kind}` and `unit_{kind}` hiding:
  - `...makePerKindTextParams(KIND_MAP)` auto-generates per-kind caption/unit editables for every map entry.
  - For kinds that do not use caption/unit rendering, add explicit overrides after the spread:
    - `caption_{yourKind}: false`
    - `unit_{yourKind}: false`
- Other shared editables:
  - Audit shared `BOOLEAN`, `FLOAT`, and `SELECT` editables with broad or missing conditions.
  - Add condition arrays when those controls are irrelevant to the new kind.
- [ ] Shared editables audited and scoped (stableDigits, captionUnitScale, caption/unit hiding)

## Grouped Mapper Output for Complex Payloads

If a kind needs a larger payload, keep mapper output grouped and declarative instead of returning a flat oversized
object.

Recommended grouped keys:

- domain
- layout
- formatting

Renderer modules consume these grouped payload branches and keep presentation logic out of mappers.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/vertical-container-contract.md
- ../shared/html-widget-visual-style-guide.md
