# dyninstruments v3.2.0

## Highlights
- Vessel instruments now include a Regatta timer kind with Start, Sync, and Reset controls for race countdowns.
- The Regatta timer supports 3, 5, and 6 minute starts, switches from countdown to elapsed time at 0:00, and keeps active timer state across renderer updates.
- Acoustic signals can mark the start press, whole-minute countdown marks, the final ten seconds, and the race start when browser audio is available.
- The bundled sailboat layout now includes a dedicated regatta page with the new timer, depth, wind, course, speed, and VMG instruments.

## Fixes
- Empty formatter input now resolves to the configured placeholder instead of leaking `NaN` into displays.
- Placeholder normalization now treats `NaN`, `undefined`, `null`, and infinite numeric text as missing values so widgets show the standard fallback.
- Regatta timer text fitting now scales more consistently across compact, normal, and wide widget shapes.
- Mapper memoization reduces unnecessary canvas repaint churn when translated widget output has not changed.

## Notes
- Regatta timer colors are theme-aware, including night-mode and high-contrast presets for the progress bar.
- Semicircle gauges now reuse cached static layers, layout calculations, and text fitting where possible for smoother redraws.
- New shared helper and smell checks make future widget work stricter about duplicated helpers, defensive fallbacks, and missing-value handling.
