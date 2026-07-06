# dyninstruments v3.7.0

## Highlights

- Linux AvNav servers can now install or update dyninstruments directly from the latest GitHub Release with the bundled `install.sh` script.
- The installer supports explicit release versions, local or remote zip files, custom AvNav data directories, final plugin directories, system plugin installs, dry runs, and restart control.
- Regatta timer buttons now use the theme-controlled `--dyni-regatta-button-stroke-weight` token, so their outline thickness can be tuned independently of the global stroke weight.

## Fixes

- Depth widgets now keep the selected live depth key connected at runtime instead of falling back to the default keel-depth key when a custom source is configured.
- Temperature widgets now keep custom live temperature key values connected through the same environment update path.
- The bundled sailing layout now includes bearing and time status widgets in the repeated vessel/navigation section.

## Notes

- Manual installation still works with the `dyninstruments-3.7.0.zip` release asset; the new installer is optional.
- No migration is required for existing layouts or theme files.
