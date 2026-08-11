# dyninstruments v3.9.0

## Highlights

- Prerelease builds can now be published as GitHub prereleases and installed directly by pinning their full version
  with the installer `--version` option or `DYNINSTRUMENTS_VERSION`.

## Fixes

- Legacy AvNav startup failures are now written to the AvNav log, making bootstrap errors visible through the host's
  normal logging path.

## Notes

- Existing layouts, widget settings, and theme overrides require no migration.
