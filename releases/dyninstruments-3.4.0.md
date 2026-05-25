# dyninstruments v3.4.0

## Highlights
- The vessel cluster now includes an `Analog clock [Radial]` kind. It displays a 12-hour analog clock face with hour, minute, and second hands, major ticks at each hour, minor ticks every minute, and a cached static face layer for efficient redraws. The second hand can be hidden via the existing "Hide seconds" option.
- Full-circle dial tick lengths are now themeable through two new CSS variables: `--dyni-radial-fullcircle-tick-major-len-factor` and `--dyni-radial-fullcircle-tick-minor-len-factor`. This lets users fine-tune how long major and minor tick marks appear on compass, wind, and clock dials.

## Notes
- Voltage gauge editable parameters (min/max range, tick steps, end labels) for both linear and radial variants are now defined through a shared builder, reducing config duplication without changing user-facing behavior.
- The analog clock widget is included in the all-widgets showcase layout for visual regression coverage.
