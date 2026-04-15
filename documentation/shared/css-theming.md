# CSS Theming

**Status:** ✅ Implemented | Input vars resolved by ThemeResolver + commit-time output materialization by runtime._theme

## Overview

dyninstruments theme flow has two layers:

1. input variables (raw --dyni-*) read from committed plugin root
2. output variables (--dyni-theme-*) overwritten on every commit and consumed by migrated CSS

Ownership:

- ThemeModel: canonical semantic token/preset owner
- ThemeResolver: strict root-only resolution boundary
- runtime._theme: commit-time output writer on committed .widget.dyniplugin roots

## Input Variables

Canonical shared inputs for migrated surface/typography tokens:

- --dyni-fg
- --dyni-bg
- --dyni-border
- --dyni-font
- --dyni-font-weight
- --dyni-label-weight

Raw --dyni-* inputs are input-only. They are not consumed by migrated renderer CSS directly.

## Output Variables

Mandatory materialized outputs:

- --dyni-theme-surface-fg
- --dyni-theme-surface-bg
- --dyni-theme-surface-border
- --dyni-theme-font-family
- --dyni-theme-font-weight
- --dyni-theme-font-label-weight

Outputs are written only as inline style on committed plugin roots and are overwritten every commit.

## Root Consumer Rule

The plugin root is the canonical light-DOM surface consumer:

- color: --dyni-theme-surface-fg
- background-color: --dyni-theme-surface-bg
- border-color: --dyni-theme-surface-border
- font-family: --dyni-theme-font-family

Root does not set one global font-weight.

## Shadow CSS Rule

Committed HTML renderer CSS is shadow-local and consumes migrated output vars.

- use --dyni-theme-font-weight and --dyni-theme-font-label-weight
- do not consume raw --dyni-font-weight / --dyni-label-weight in migrated renderer CSS
- do not use outer-document ancestry selectors in committed renderer shadow styles

## Vertical Shell Rule

Shared shell CSS must not override runtime-owned vertical reserved shell height on .widgetData.dyni-shell.

Inner mount/surface descendants may still fill inside the reserved shell.

## Preset Ingestion Rule

- startup reads --dyni-theme-preset once from document.documentElement
- runtime stores that normalized preset as fallback
- committed root can override preset via `--dyni-theme-preset`
- resolver normalizes committed-root override and falls back to runtime preset when unset
- no data-dyni-theme attribute path
- no public applyThemePreset API path

## Related

- theme-tokens.md
- ../architecture/runtime-lifecycle.md
- ../architecture/html-renderer-lifecycle.md
