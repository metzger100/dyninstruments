# dyninstruments v3.2.0

## Highlights
- Vessel instruments now include a Regatta timer kind with Start, Sync, and Reset controls for race countdowns.
- The Regatta timer supports 3, 5, and 6 minute starts, switches from countdown to elapsed time at 0:00, and can keep its running state across renderer updates.
- Optional acoustic start signals now play whole-minute beeps, final ten-second beeps, and a longer start tone when browser audio is available.
- The bundled sailboat layout now includes a dedicated regatta page with the new timer, depth, wind, course, speed, and VMG instruments.

## Fixes
- Empty formatter input now resolves to the configured placeholder instead of leaking `NaN` into displays.
- Placeholder normalization now treats `NaN`, `undefined`, `null`, and infinite numeric text as missing values so widgets show the standard fallback.
- Mapper memoization reduces unnecessary canvas repaint churn when translated widget output has not changed.

## Notes
- Regatta timer colors are theme-aware, including night-mode and high-contrast presets for the progress bar.
- Semicircle gauges now reuse cached static layers, layout calculations, and text fitting where possible for smoother redraws.
- New shared helper and smell checks make future widget work stricter about duplicated helpers, defensive fallbacks, and missing-value handling.
