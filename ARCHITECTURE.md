# Architecture

**Status:** ✅ Reference | Root structural map for AI sessions

## Layer Map

```text
.
├── plugin.js                 # entry point + bootstrap
├── runtime/                  # loader, registrar, helpers — framework layer
├── config/                   # component registry, widget definitions, cluster configs — declaration layer
├── cluster/                  # ClusterWidget orchestrator, mappers, renderer router — routing layer
├── shared/widget-kits/       # reusable gauge math/draw engine — shared library layer
├── widgets/                  # individual widget renderers — feature layer
├── tests/                    # mirrors source structure
├── tools/                    # validation scripts
└── documentation/            # AI-optimized reference docs
```

## Dependency Direction Rule

| Layer | Allowed direction |
|---|---|
| `widgets/` | `widgets -> shared -> (no imports, UMD globals)` |
| `cluster/` | `cluster -> shared -> (no imports, UMD globals)` |
| `config/` | `config -> (pure data, no runtime imports)` |
| `runtime/` | `runtime -> (framework, no widget/cluster imports)` |

Feature code depends on shared code. Shared code depends on nothing. Config is pure data. Runtime is framework-only.

## Boundary Rule

1. Only `runtime/` may access `window.avnav` directly.
2. Widgets and cluster code must use `Helpers.applyFormatter()` for all formatting.
3. This is the single API boundary to the host application.

## Component Registration Flow

1. `plugin.js` bootstraps internal scripts and starts `runtime.runInit()`.
2. `runtime/component-loader.js` loads required components declared in `config/components.js`.
3. `runtime/widget-registrar.js` registers widget definitions via `avnav.api.registerWidget()`; details: [documentation/architecture/component-system.md](documentation/architecture/component-system.md).

## Cross-References

- [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- [documentation/architecture/component-system.md](documentation/architecture/component-system.md)
- [documentation/architecture/cluster-widget-system.md](documentation/architecture/cluster-widget-system.md)
