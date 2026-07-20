# CSS Theming

**Status:** ✅ Implemented | Input vars resolved by `runtime.theme` + commit-time output materialization by
`runtime.theme`

## Overview

dyninstruments theme flow has two layers:

1. input variables (raw --dyni-*) read from committed plugin root
2. output variables (--dyni-theme-*) overwritten on every commit and consumed by migrated CSS

Ownership:

- `runtime.theme`: canonical semantic token/preset owner and strict root-only resolution boundary
- `runtime.theme.applyToRoot(...)`: commit-time output writer on committed `.widget.dyniplugin` roots

## Input Variables

Canonical shared inputs for migrated surface/typography tokens:

- --dyni-fg
- --dyni-bg
- --dyni-border
- --dyni-font
- --dyni-font-mono
- --dyni-font-weight
- --dyni-label-weight

Canonical semantic and scoped inputs:

- --dyni-pointer
- --dyni-warning
- --dyni-alarm
- --dyni-ok
- --dyni-info
- --dyni-alarm-widget-bg
- --dyni-alarm-widget-fg
- --dyni-alarm-widget-strip
- --dyni-layline-stb
- --dyni-layline-port
- --dyni-ais-warning
- --dyni-ais-nearest
- --dyni-ais-tracking
- --dyni-ais-normal
- --dyni-regatta-bar-warning
- --dyni-regatta-bar-critical
- --dyni-regatta-bar-default
- --dyni-regatta-button-stroke-weight

Raw --dyni-* inputs are input-only. They are not consumed by migrated renderer CSS directly.

Border-specific rule:

- `--dyni-border` is optional.
- If it is not set, `runtime.theme` derives `--dyni-theme-surface-border` from the resolved foreground token
  (`surface.fg`).
- If it is set, the explicit border value wins.

Scoped cascade rule:

- Scoped inputs can inherit from global semantic tokens when unset.
- Example: `--dyni-pointer` cascades from `--dyni-info`, `--dyni-layline-stb` cascades from `--dyni-ok`, and
  `--dyni-regatta-button-stroke-weight` cascades from `--dyni-stroke-weight`.
- Scoped explicit inputs still win over the inherited cascade.

## Output Variables

Mandatory materialized outputs:

- --dyni-theme-surface-fg
- --dyni-theme-surface-bg
- --dyni-theme-surface-border
- --dyni-theme-font-family
- --dyni-theme-font-family-mono
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

## Tabular Class

`.dyni-tabular` is the canonical class for tabular numeric rendering:

- `font-variant-numeric: tabular-nums`
- `font-family: var(--dyni-theme-font-family-mono), var(--dyni-theme-font-family)`

Use this class on spans that require column-stable digits (for example coordinate rows and stable-digit numeric cells).
StableDigits usage details and padded/plain behavior are documented in [stable-digits.md](stable-digits.md).

## Shadow CSS Rule

Committed HTML renderer CSS is shadow-local and consumes migrated output vars.

- use --dyni-theme-font-weight and --dyni-theme-font-label-weight
- do not consume raw --dyni-font-weight / --dyni-label-weight in migrated renderer CSS
- do not use outer-document ancestry selectors in committed renderer shadow styles

## Vertical Shell Rule

Shared shell CSS must not override runtime-owned vertical reserved shell height on .widgetData.dyni-shell for ratio
shell sizing only.

Natural shell sizing must not be forced by shared shell CSS. Inner mount/surface descendants may still fill inside the
reserved shell.

## Preset Ingestion Rule

- startup reads --dyni-theme-preset once from document.documentElement
- runtime stores that normalized preset as fallback
- committed root can override preset via `--dyni-theme-preset`
- resolver normalizes committed-root override and falls back to runtime preset when unset
- no data-dyni-theme attribute path
- no public applyThemePreset API path

## Related

- color-system.md
- theme-tokens.md
- ../architecture/runtime-lifecycle.md
- ../architecture/html-renderer-lifecycle.md
