# Architecture

**Status:** ✅ Reference | Root structural map for AI sessions

## Layer Map

```text
.
├── plugin.js                    # entry point + bootstrap
├── runtime/                     # bootstrap/runtime framework layer
│   ├── init.js                  # registration + theme-preset application
│   ├── widget-registrar.js      # host widget definition composition
│   ├── HostCommitController.js  # deferred renderHtml host commit
│   └── SurfaceSessionController.js # per-instance surface lifecycle state
├── config/                      # declarations: components, widget defs, cluster configs
├── cluster/                     # cluster routing and ownership boundaries
│   ├── ClusterWidget.js         # host renderHtml lifecycle orchestrator
│   ├── mappers/                 # declarative cluster translation
│   ├── rendering/               # kind catalog + surface router + surface owners
│   └── viewmodels/              # shared domain normalization contracts
├── shared/widget-kits/          # reusable rendering/layout engines
├── widgets/                     # renderer implementations (canvas + html)
├── tests/                       # mirrors source structure
├── tools/                       # validation scripts
└── documentation/               # AI-optimized reference docs
```

## Dependency Direction Rule

| Layer | Allowed direction |
|---|---|
| `widgets/` | `widgets -> shared -> (no imports, UMD globals)` |
| `cluster/` | `cluster -> cluster/widgets/shared -> (no imports, UMD globals)` |
| `config/` | `config -> (pure data, no runtime imports)` |
| `runtime/` | `runtime -> (framework, no widget/cluster imports)` |

Widget feature code depends on shared code. Cluster orchestration code may depend on cluster/widgets/shared. Shared code depends only on shared. Config is pure data. Runtime is framework-only.

## Boundary Rule

1. Only `runtime/` may access `window.avnav` directly.
2. Widgets and cluster code must use `Helpers.applyFormatter()` for formatter dispatch/fallback behavior.
3. Cluster host registration is `renderHtml` on AvNav host; internal visual surface selection is owned by kind catalog + surface router.
4. Canvas rendering remains valid as an internal renderer contract via `CanvasDomSurfaceAdapter` (`renderCanvas(canvas, props)` callbacks).

## Component Registration Flow

1. `plugin.js` bootstraps internal scripts and starts `runtime.runInit()`.
2. `runtime/component-loader.js` loads required components declared in `config/components.js`.
3. `runtime/widget-registrar.js` composes widget definitions and registers via `avnav.api.registerWidget()`.
4. `ClusterWidget` drives host `renderHtml` lifecycle; deferred commit/surface switching is owned by `HostCommitController` + `SurfaceSessionController`.

## Cross-References

- [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- [documentation/architecture/component-system.md](documentation/architecture/component-system.md)
- [documentation/architecture/cluster-widget-system.md](documentation/architecture/cluster-widget-system.md)
- [documentation/architecture/host-commit-controller.md](documentation/architecture/host-commit-controller.md)
- [documentation/architecture/surface-session-controller.md](documentation/architecture/surface-session-controller.md)
