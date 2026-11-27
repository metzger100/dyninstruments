# dyninstruments v3.9.2

## Highlights

- The Regatta Timer's Sync button snaps to a countdown mark up to one second ahead. After a pause in browser updates,
  elapsed time starts from the scheduled start, and the timer skips stale signal bursts.
- Regatta Timer audio stays available when AvNav recreates the widget after the user has enabled audio on the page.
- Release ZIPs include the plugin version in `plugin.json` for the AvNav Plugin Catalog.

## Fixes

- Gauges clear their pointers when sensor data drops out. Widgets show the missing-value placeholder when AvNav still
  holds a sensor value from a previously selected widget type.
- Configured depth, temperature, pitch, and roll sources are used by their corresponding instruments. Navigation
  instruments that require a waypoint show the disconnected state when the waypoint server is unavailable.
- The linear wind gauge moves across ±180° by the shorter path. Signed angle readouts show rounded zero without a minus
  sign and display the 180° boundary consistently.
- Route Points refits its rows when route or waypoint text changes. Active Route, Map Zoom, and the Regatta Timer
  recalculate text sizing when fonts finish loading.
- Edit Route shows the total distance as unknown if a leg cannot be calculated.
- AvNav's log identifies failing script URLs and affected widget routes when startup or widget activation fails.
