# Vertical Container Contract

**Status:** ✅ Implemented | Route-owned vertical shell sizing with renderer shadow CSS

## Overview

Vertical sizing is a shell contract shared across HTML and canvas surfaces.

- outside .widgetContainer.vertical: host owns dimensions
- inside .widgetContainer.vertical: host owns width, widget owns height

Runtime owns request/materialization timing; route metadata owns pre-activation shell sizing, and committed renderers own post-activation sizing in shadow CSS.

## Canonical Vertical Context

Pre-commit vertical context comes from props.mode.

- props.mode === vertical -> vertical policy
- otherwise non-vertical policy

Committed DOM ancestry checks are not canonical for pre-commit policy.

## Route Metadata Sizing Contract

`config.clusterRoutes.byRouteId[routeId].shellSizing` owns the pre-activation shell sizing contract.

- route metadata is read by `ClusterShellRenderer`
- route metadata is applied to the inert shell before activation
- the committed renderer does not expose a renderer-spec vertical-sizing hook

Supported route metadata forms:

- ratio sizing: `{ kind: "ratio", aspectRatio: number }`
- natural sizing: `{ kind: "natural" }`
- `shellSizing.kind === "natural"` emits no inline height or aspect-ratio and reserves no cold-load height; the committed renderer shadow CSS owns the final size after activation

## RoutePoints Exception

RoutePoints is the only width-derived natural-height widget.

- first pass may not have authoritative width pre-commit
- exact width-derived natural height is owned by the committed renderer shadow CSS after activation
- viewport cap policy is widget-owned (currently 60vh)

## CSS Ownership Rule

Vertical shell reserved height for ratio sizing is runtime-owned on the inert shell.

- shell CSS must not override reserved shell height with unconditional fill rules on .widgetData.dyni-shell
- inner surface descendants may still fill within the reserved shell

## Related

- html-renderer-lifecycle.md
- cluster-widget-system.md
- runtime-lifecycle.md
- ../shared/responsive-scale-profile.md
