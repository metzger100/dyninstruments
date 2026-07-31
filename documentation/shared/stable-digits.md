# Stable Digits

**Status:** Current.

## Overview

`StableDigits` is the shared formatter-side normalizer used by numeric-rendering widgets.

- Module: `shared/widget-kits/format/StableDigits.js`
- Registry id: `StableDigits`
- Dependency: `PlaceholderNormalize`

It produces a two-output pair for a formatted numeric text:

- `padded`: alignment-friendly value (optional sign slot, zero-padded integer, optional reserved side slot)
- `plain`: accuracy-preserving unpadded value

## Key Details

- Module: `shared/widget-kits/format/StableDigits.js`; registry id `StableDigits`; depends on `PlaceholderNormalize`.
- Entry point: `normalize(rawFormattedText, options) -> { padded, plain }`.
- Options: `integerWidth` (number), `reserveSignSlot` (boolean), `sideSuffix` (`"R"` | `"L"` | `""`),
  `reserveSideSuffixSlot` (boolean), `suffix` (string override).
- Integer and fractional digits are never truncated, even when they exceed `integerWidth`.
- If `PlaceholderNormalize.isPlaceholder(rawFormattedText)` is true, both `padded` and `plain` return the input
  unchanged; placeholders are never padded.
- Two-pass fit convention: callers try `padded` first, and rerun the fit with `plain` only if `padded` clips.

## Contract

`normalize(rawFormattedText, options)` accepts formatter output text and returns:

```js
{ padded: string, plain: string }
```

Supported options:

- `integerWidth` (number): minimum integer digit width for `padded`
- `reserveSignSlot` (boolean): reserves a leading `" "` slot when value is non-negative
- `sideSuffix` (string): side marker input (`"R"`, `"L"`, or `""`)
- `reserveSideSuffixSlot` (boolean): reserves one suffix slot (`" "` when empty)
- `suffix` (string): explicit trailing suffix override

## Accuracy Rules

- Integer overflow is never truncated. If integer digits exceed `integerWidth`, all digits are kept.
- Fractional digits are never truncated.
- `plain` keeps the raw numeric value semantics (no synthetic sign slot, no synthetic side slot).

## Placeholder Short-Circuit

If `PlaceholderNormalize.isPlaceholder(rawFormattedText)` is true, both outputs are returned unchanged:

```js
{ padded: rawFormattedText, plain: rawFormattedText }
```

Placeholders are never padded.

## Two-Pass Fit Usage

Callers use `padded` first in the existing fit pipeline. If the result is clipped, callers rerun the fit with `plain`.

This keeps alignment when possible and preserves full numeric readability when width is constrained.

## Related

- [placeholder-normalize.md](placeholder-normalize.md)
- [css-theming.md](css-theming.md)
