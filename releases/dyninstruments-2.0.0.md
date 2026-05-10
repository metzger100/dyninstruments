# dyninstruments v2.0.0

## Highlights

- Release builds now load a generated `bootstrap-bundle.js` first, reducing the startup bootstrap waterfall from many sequential script requests to one bundled request when the release zip is installed.
- Cluster widgets now render an empty, correctly sized shell first and activate only the mapper, view model, renderer, shadow CSS, and assets needed for the selected instrument.
- Navigation and HTML-heavy widgets now hydrate through the same committed surface lifecycle, so route changes, vertical sizing, and theme application stay aligned with the committed AvNav widget root.
- Route metadata now lives in checked-in `config/cluster-routes/` files, keeping widget route ownership explicit while preserving the existing cluster widget names and kind selections.

## Fixes

- Same-widget route changes now detach stale shell-bound resources before activating the next renderer.
- Late async route activations are ignored when a newer committed route has already won, preventing stale content from replacing the current widget.
- Spring animation and surface detachment behavior from the runtime rebuild have been patched for the final release state.
- Release creation now validates the repository with the project gates, builds the zip, includes the bootstrap bundle in the staged artifact, and creates the local release commit and annotated tag.

## Compatibility

- Existing AvNav dashboard widgets continue to use the same `dyni_*_Instruments` widget names and kind options.
- This is a major release because internal runtime, component-loader, mapper, route, and surface contracts changed. Custom code that depended on removed internals such as `runtime.createHelpers()`, `Helpers.getModule()`, `ClusterRendererRouter`, `ClusterMapperRegistry`, `ClusterKindCatalog`, `SurfaceControllerFactory`, or `RendererPropsWidget` must be updated to the new runtime services and route metadata model.

## Notes

- Development mode still loads `config/bootstrap-manifest.js` and the individual raw scripts. The bootstrap bundle is generated only inside release artifacts.
- The release zip still includes the individual source files alongside the bundle for inspection and debugging.
