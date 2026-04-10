# Vertical Container Contract

**Status:** ✅ Implemented | Widget-owned vertical shell sizing with runtime materialization

## Overview

Vertical sizing is a shell contract shared across HTML and canvas surfaces.

- outside .widgetContainer.vertical: host owns dimensions
- inside .widgetContainer.vertical: host owns width, widget owns height

Runtime owns request/materialization timing; widgets own height policy.

## Canonical Vertical Context

Pre-commit vertical context comes from props.mode.

- props.mode === vertical -> vertical policy
- otherwise non-vertical policy

Committed DOM ancestry checks are not canonical for pre-commit policy.

## Widget-Owned Sizing API

Widgets that support vertical mode expose:

getVerticalShellSizing(sizingContext, surfacePolicy)

sizingContext contains:

- payload (normalized routed payload)
- shellWidth (authoritative host width when available)
- viewportHeight (runtime-owned host fact)

Legal return shapes:

- ratio sizing: { kind: ratio, aspectRatio }
- natural sizing: { kind: natural, height }

Materialization rules:

- ratio -> shell aspect-ratio style
- natural -> shell height style

Runtime does not derive alternate formulas from returned height.

## RoutePoints Exception

RoutePoints is the only width-derived natural-height widget.

- first pass may not have authoritative width pre-commit
- exact width-derived natural height is finalized on first commit before surface attach
- viewport cap policy is widget-owned (currently 60vh)

## CSS Ownership Rule

Vertical shell reserved height is runtime-owned on the inert shell.

- shell CSS must not override reserved shell height with unconditional fill rules on .widgetData.dyni-shell
- inner surface descendants may still fill within the reserved shell

## Related

- html-renderer-lifecycle.md
- cluster-widget-system.md
- ../shared/responsive-scale-profile.md
