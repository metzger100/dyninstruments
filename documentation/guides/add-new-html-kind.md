# Add New HTML Kind

**Status:** ✅ Reference | Commit-driven HTML kind workflow

## Overview

This guide describes how to add a new native HTML kind under the commit-driven architecture.

Core rules:

- pre-commit renderHtml returns inert shell only
- committed renderer owns semantic DOM inside shadow root
- interaction is direct DOM listener ownership under dispatch/passive policy
- layout uses shellRect from mount host

## Steps

1. Add mapper output and kind catalog tuple
- map normalized payload in cluster mapper
- add cluster/kind tuple in ClusterKindCatalog with surface html
- point tuple rendererId to your renderer component

2. Register component
- add renderer entry in config/components/registry-widgets.js
- declare shadowCss bundle via shadowCss array
- include renderer in ClusterRendererRouter dependencies

3. Implement renderer component
- expose createCommittedRenderer(rendererContext)
- implement mount/update/postPatch/detach/destroy
- optionally implement layoutSignature(payload)
- if vertical mode is supported, implement getVerticalShellSizing(sizingContext, surfacePolicy)

4. Keep shell and committed DOM separated
- shell remains inert and payload-invariant except route/sizing metadata
- semantic markup is produced only in committed renderer mount/update

5. Implement interaction policy
- use payload.props.surfacePolicy.interaction.mode
- dispatch mode: attach listeners and suppress blank-space click propagation inside wrapper
- passive mode: no action listeners
- dispatch via normalized callbacks in surfacePolicy.actions

6. Implement shadow-local CSS
- root selectors under .dyni-html-root
- do not depend on outer-document ancestry selectors
- consume migrated output vars for typography weights

7. Validate layout contract
- use payload.shellRect as authoritative committed layout source
- use layoutSignature + bounded postPatch relayout for layout-sensitive updates
- avoid observer loops and triggerResize-style rerender shims

## Step 7: Required HTML Kind Test Matrix

- route resolves to html surface and committed renderer factory
- inert shell contains mount host and no semantic content
- committed renderer mount/update/detach/destroy behavior
- shadow CSS preload/injection for this renderer
- dispatch vs passive listener ownership
- dispatch-mode blank-space click suppression
- layoutSignature-driven relayout and bounded postPatch behavior
- vertical sizing behavior (if supported)

## Grouped Mapper Output for Complex Payloads

If a kind needs a larger payload, keep mapper output grouped and declarative instead of returning a flat oversized object.

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
