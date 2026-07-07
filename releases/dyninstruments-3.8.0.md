# dyninstruments v3.8.0

## Highlights

- Current AvNav versions can now start dyninstruments through the modern `plugin.mjs` module entrypoint while older AvNav versions keep using the legacy `plugin.js` entrypoint.
- AvNav module reloads now start as a fresh dyninstruments generation, so timestamp reloads register widgets against the current AvNav API instead of reusing generation-bound runtime state.
- Component JavaScript and CSS requests now use bootstrap-scoped loaders during module startup, preventing stale script or stylesheet IDs from blocking updated runtime files after an AvNav reload.

## Fixes

- Startup now checks for the required AvNav API methods before initialization, producing clearer failures when the host API is incomplete.
- Failed script or stylesheet loads now remove the failed DOM element, allowing a later startup attempt to retry cleanly.

## Notes

- No migration is required for existing layouts, widgets, or theme files.
- Manual installation uses the `dyninstruments-3.8.0.zip` release asset.
