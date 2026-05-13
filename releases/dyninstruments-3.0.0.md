# dyninstruments v3.0.0

## Highlights
- AvNav can now offer two ready-made layouts through the plugin: `Dyni Motorboat` and `Dyni Sailboat`.
- The release zip now includes the bundled layout files and root `plugin.json`, so the layouts are available after installing the plugin.

## Breaking Changes
- Navigation widgets now use `wpEta` for waypoint ETA instead of the old `eta` kind. Existing custom layouts that still reference `kind: "eta"` must be updated to `kind: "wpEta"`.
- Route ETA fields are now labeled `RTE ETA` in active-route and edit-route displays, making waypoint ETA and route ETA distinct in the editor and on screen.

## Fixes
- Route Points now fills its assigned cell on normal GPS pages instead of being capped at 60vh.
- Route Points keeps the 60vh height cap only in vertical containers, where the list can still scroll inside the narrow panel.

## Notes
- The SignalK data paths are unchanged: waypoint ETA still reads `nav.wp.eta`, and route ETA still reads `nav.route.eta`.
