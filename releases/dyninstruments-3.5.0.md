# dyninstruments v3.5.0

## Highlights
- Depth text, linear, and radial widgets now include a `Depth store path` selector so you can read depth below keel, below transducer, below surface/waterline, or another AvNav store key.
- New depth widgets default to `nav.gps.depthBelowKeel` and use the `DBK` caption, making the displayed depth match the clearance below the boat by default.

## Notes
- Existing layouts that should keep the old transducer source can set `Depth store path` to `nav.gps.depthBelowTransducer`.
- The release gate now enforces the absolute 400-line limit across source, tests, and documentation, with extra checks for compressed one-line code.