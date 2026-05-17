const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");
const { flushPromises } = require("../../helpers/async");

describe("runtime/cluster/RouteActivationController.js", function () {
  const originalDyniPlugin = globalThis.DyniPlugin;

  function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });
    return { promise, resolve, reject };
  }

  function createLoaderHarness(options) {
    const opts = options || {};
    const loaded = new Set(opts.initialLoadedIds || []);
    const loadRecords = [];
    const createRecords = [];
    const modules = opts.modules || {};
    const deferredLoads = opts.deferredLoads || Object.create(null);
    const pendingLoads = Object.create(null);

    function getModule(id) {
      const mod = modules[id];
      if (!mod) {
        throw new Error("missing module: " + id);
      }
      return mod;
    }

    function resolveDependencyContext() {
      return {
        components: {
          require(id) {
            return createInstance(id, {});
          }
        }
      };
    }

    function createInstance(id, def) {
      createRecords.push({ id: id, def: def });
      if (!loaded.has(id)) {
        throw new Error("createInstance before load: " + id);
      }
      const mod = getModule(id);
      return typeof mod.create === "function" ? mod.create(def, resolveDependencyContext()) : mod;
    }

    function loadComponent(id) {
      loadRecords.push(id);
      if (loaded.has(id)) {
        return Promise.resolve(getModule(id));
      }
      const deferred = deferredLoads[id] || createDeferred();
      pendingLoads[id] = deferred;
      return deferred.promise.then(function () {
        loaded.add(id);
        return getModule(id);
      });
    }

    return {
      loaded,
      loadRecords,
      createRecords,
      pendingLoads,
      loadComponent,
      createInstance,
      areComponentsLoaded(ids) {
        return Array.isArray(ids) && ids.every(function (id) {
          return loaded.has(id);
        });
      },
      resolveLoad(id) {
        const deferred = pendingLoads[id];
        if (!deferred) {
          throw new Error("missing deferred load: " + id);
        }
        deferred.resolve();
      }
    };
  }

  function loadController(context) {
    runIifeScript("runtime/cluster/RouteActivationPayloadBuilder.js", context);
    runIifeScript("runtime/cluster/RouteActivationLatestWins.js", context);
    runIifeScript("runtime/cluster/RouteActivationController.js", context);
    return context.DyniPlugin.runtime.routeActivation;
  }

  function createBaseContext(extra) {
    const runtime = extra.runtime || {};
    return createScriptContext({
      DyniPlugin: {
        runtime: runtime,
        state: {},
        config: extra.config || { shared: {}, components: {}, clusterRoutes: { byRouteId: {} } }
      }
    });
  }

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
  });

  it("loads only the active route roots, preloads html shadow css, and merges rendererProps at the boundary", async function () {
    const mapperTranslate = vi.fn(function (props, routeContext) {
      expect(routeContext.routeId).toBe("nav/activeRoute");
      expect(routeContext.cluster).toBe("nav");
      expect(routeContext.kind).toBe("activeRoute");
      expect(routeContext.viewModel).toBe(viewModelInstance);
      expect(routeContext.toolkit).toEqual(expect.objectContaining({ fromToolkit: "ok" }));
      return {
        value: props.value,
        rendererProps: {
          mergedFromRendererProps: true
        },
        routeContextSnapshot: {
          routeId: routeContext.routeId,
          viewModel: !!routeContext.viewModel
        }
      };
    });
    const viewModelBuild = vi.fn(function (props, toolkit) {
      expect(toolkit).toEqual(expect.objectContaining({ fromToolkit: "ok" }));
      return {
        value: props.value,
        toolkitValue: toolkit.fromToolkit
      };
    });
    const viewModelInstance = {
      build: viewModelBuild
    };
    const rendererSpecInstance = {
      createCommittedRenderer: vi.fn(function () {
        return {
          mount: vi.fn(),
          update: vi.fn(),
          postPatch: vi.fn(() => false),
          detach: vi.fn(),
          destroy: vi.fn()
        };
      })
    };
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: "ok",
        echo: props
      };
    });

    const loader = createLoaderHarness({
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate
            };
          }
        },
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        ActiveRouteViewModel: {
          create: function () {
            return viewModelInstance;
          }
        },
        ActiveRouteTextHtmlWidget: {
          create: function () {
            return rendererSpecInstance;
          }
        }
      }
    });

    const materializeSurfacePolicyProps = vi.fn(function (options) {
      options.props.surfacePolicy = {
        rendererId: options.rendererId,
        hostContext: options.hostContext
      };
      options.props.viewportHeight = 777;
      return options.props;
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(function (url) {
        return url === "/css/active-route.css";
      })
    };

    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: materializeSurfacePolicyProps
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: ["/css/active-route.css"]
          }
        },
        clusterRoutes: {
          byRouteId: {
            "nav/activeRoute": {
              routeId: "nav/activeRoute",
              cluster: "nav",
              kind: "activeRoute",
              mapperId: "NavMapper",
              viewModelId: "ActiveRouteViewModel",
              rendererId: "ActiveRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 }
            }
          }
        }
      }
    });
    const routeMeta = context.DyniPlugin.config.clusterRoutes.byRouteId["nav/activeRoute"];
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const routeFrame = {
      cluster: "nav",
      kind: "activeRoute",
      value: "latest",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", value: "latest" }
    };
    const rootEl = { id: "root-1" };
    const shellEl = { id: "shell-1" };
    const hostContext = { hostActions: {} };

    const result = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 5,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext
    });

    expect(result).toBeInstanceOf(Promise);
    expect(loader.loadRecords).toEqual([
      "NavMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit"
    ]);

    loader.loaded.add("NavMapper");
    loader.loaded.add("ActiveRouteViewModel");
    loader.loaded.add("ActiveRouteTextHtmlWidget");
    loader.loaded.add("ClusterMapperToolkit");
    loader.resolveLoad("NavMapper");
    loader.resolveLoad("ActiveRouteViewModel");
    loader.resolveLoad("ActiveRouteTextHtmlWidget");
    loader.resolveLoad("ClusterMapperToolkit");

    await flushPromises();

    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith(["/css/active-route.css"]);
    expect(materializeSurfacePolicyProps).toHaveBeenCalledWith({
      hostContext: hostContext,
      rendererId: "ActiveRouteTextHtmlWidget",
      props: expect.objectContaining({
        value: "latest",
        mergedFromRendererProps: true
      })
    });
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "nav",
      kind: "activeRoute",
      value: "latest"
    });
    expect(mapperTranslate).toHaveBeenCalledTimes(1);
    expect(loader.createRecords.map(function (entry) {
      return entry.id;
    })).toEqual([
      "NavMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit"
    ]);
    expect(loader.createRecords.every(function (entry) {
      return entry.def === widgetDef;
    })).toBe(true);
    expect(loader.createRecords.every(function (entry) {
      return entry.def !== routeMeta;
    })).toBe(true);

    const payload = await result;
    expect(payload).toMatchObject({
      routeId: "nav/activeRoute",
      surface: "html",
      rendererId: "ActiveRouteTextHtmlWidget",
      revision: 5,
      rootEl: rootEl,
      shellEl: shellEl,
      hostContext: hostContext,
      rawProps: {
        cluster: "nav",
        kind: "activeRoute",
        value: "latest"
      }
    });
    expect(payload.props).toMatchObject({
      value: "latest",
      mergedFromRendererProps: true,
      surfacePolicy: {
        rendererId: "ActiveRouteTextHtmlWidget",
        hostContext: hostContext
      },
      viewportHeight: 777
    });
    expect(payload.shadowCssUrls).toEqual(["/css/active-route.css"]);
  });

  it("returns warm payloads synchronously and caches route root instances", function () {
    const mapperTranslate = vi.fn(function (props) {
      return {
        mappedValue: props.extra,
        rendererProps: {
          warm: true
        }
      };
    });
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: "warm",
        props: props
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate
            };
          }
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const firstRouteFrame = {
      cluster: "speed",
      kind: "sog",
      extra: "warm-a",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: { cluster: "speed", kind: "sog", extra: "warm-a" }
    };
    const secondRouteFrame = {
      cluster: "speed",
      kind: "sog",
      extra: "warm-b",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: { cluster: "speed", kind: "sog", extra: "warm-b" }
    };

    const first = controller.activateCommittedRoute({
      routeFrame: firstRouteFrame,
      revision: 11,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 12,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" }
    });

    expect(first).not.toBeInstanceOf(Promise);
    expect(second).not.toBeInstanceOf(Promise);
    expect(first).not.toBe(second);
    expect(loader.createRecords.map(function (entry) {
      return entry.id;
    })).toEqual([
      "SpeedMapper",
      "SpeedRadialWidget",
      "ClusterMapperToolkit"
    ]);
    expect(loader.createRecords.every(function (entry) {
      return entry.def === widgetDef;
    })).toBe(true);
    expect(loader.loadRecords).toEqual([]);
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "speed",
      kind: "sog",
      extra: "warm-a"
    });
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "speed",
      kind: "sog",
      extra: "warm-b"
    });
    expect(toolkitCreate).toHaveBeenCalledTimes(2);
    expect(mapperTranslate).toHaveBeenCalledTimes(2);
    expect(first.revision).toBe(11);
    expect(second.revision).toBe(12);
    expect(first.rootEl).toEqual({ id: "root-a" });
    expect(second.rootEl).toEqual({ id: "root-b" });
    expect(first.props).toMatchObject({
      warm: true
    });
    expect(JSON.parse(first.__mappedSignature)).toEqual({
      mappedValue: "warm-a",
      rendererProps: {
        warm: true
      }
    });
  });

  it("memoizes mapped activation output and discards spurious activations", function () {
    const mapperTranslate = vi.fn(function (props) {
      return {
        value: props.sourceValue,
        rendererProps: {
          mappedKind: "sog"
        }
      };
    });
    const toolkitCreate = vi.fn(function () {
      return {
        fromToolkit: "memo"
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate
            };
          }
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const steadyRootEl = { id: "root-steady" };
    const steadyShellEl = { id: "shell-steady" };
    const editingRootEl = { id: "root-editing" };
    const editingShellEl = { id: "shell-editing" };

    const first = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 1,
        nightMode: false,
        editing: false
      },
      revision: 1,
      rootEl: steadyRootEl,
      shellEl: steadyShellEl,
      hostContext: { marker: "a" }
    });
    const spurious = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 2,
        nightMode: false,
        editing: false
      },
      revision: 2,
      rootEl: steadyRootEl,
      shellEl: steadyShellEl,
      hostContext: { marker: "b" }
    });
    const nightToggle = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 3,
        nightMode: true,
        editing: false
      },
      revision: 3,
      rootEl: { id: "root-c" },
      shellEl: { id: "shell-c" },
      hostContext: { marker: "c" }
    });
    const editingToggle = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 4,
        nightMode: true,
        editing: true
      },
      revision: 4,
      rootEl: editingRootEl,
      shellEl: editingShellEl,
      hostContext: { marker: "d" }
    });
    const repeatedEditing = controller.activateCommittedRoute({
      routeFrame: {
        cluster: "speed",
        kind: "sog",
        sourceValue: 12.3,
        irrelevantStoreValue: 5,
        nightMode: true,
        editing: true
      },
      revision: 5,
      rootEl: editingRootEl,
      shellEl: editingShellEl,
      hostContext: { marker: "e" }
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(first.revision).toBe(1);
    expect(spurious).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(nightToggle).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(nightToggle.revision).toBe(3);
    expect(editingToggle).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(editingToggle.revision).toBe(4);
    expect(repeatedEditing).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(mapperTranslate).toHaveBeenCalledTimes(5);
  });

  it("keeps canvas-dom discard behavior for unchanged mapped output", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        value: 12.3,
        rendererProps: {
          mappedKind: "sog"
        }
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: function () {
                return {};
              }
            };
          }
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-canvas" };
    const stableShellEl = { id: "shell-canvas" };
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      sourceValue: 12.3,
      nightMode: false,
      editing: false
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "canvas-1" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "canvas-2" }
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).toBe(routeActivation.DISCARDED_ACTIVATION);
  });

  it("does not discard html routes when runtime policy props change with unchanged mapped output", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        stable: "mapped"
      };
    });
    const materializeSurfacePolicyProps = vi.fn(function (options) {
      options.props.surfacePolicy = {
        interaction: {
          mode: options.hostContext.mode
        }
      };
      options.props.viewportHeight = options.hostContext.viewportHeight;
      return options.props;
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "NavMapper",
        "RoutePointsTextHtmlWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: function () {
                return {};
              }
            };
          }
        },
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        RoutePointsTextHtmlWidget: {
          create: function () {
            return {
              createCommittedRenderer: vi.fn(function () {
                return {
                  mount: vi.fn(),
                  update: vi.fn(),
                  postPatch: vi.fn(() => false),
                  detach: vi.fn(),
                  destroy: vi.fn()
                };
              })
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: materializeSurfacePolicyProps
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {
          RoutePointsTextHtmlWidget: {
            shadowCss: []
          }
        },
        clusterRoutes: {
          byRouteId: {
            "nav/routePoints": {
              routeId: "nav/routePoints",
              cluster: "nav",
              kind: "routePoints",
              mapperId: "NavMapper",
              rendererId: "RoutePointsTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-html" };
    const stableShellEl = { id: "shell-html" };
    const routeFrame = {
      cluster: "nav",
      kind: "routePoints",
      marker: "stable",
      nightMode: false,
      editing: false
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: {
        mode: "dispatch",
        viewportHeight: 640
      }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: {
        mode: "passive",
        viewportHeight: 720
      }
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second.__mappedSignature).toBe(first.__mappedSignature);
    expect(first.props.surfacePolicy.interaction.mode).toBe("dispatch");
    expect(first.props.viewportHeight).toBe(640);
    expect(second.props.surfacePolicy.interaction.mode).toBe("passive");
    expect(second.props.viewportHeight).toBe(720);
  });

  it("does not discard nav dst/positionWp when disconnect toggles because mapped signature changes", function () {
    const mapperTranslate = vi.fn(function (props) {
      if (props.kind === "dst") {
        return {
          value: props.dst,
          caption: "DST",
          unit: "nm",
          formatter: "formatDistance",
          formatterParameters: ["nm"],
          disconnect: props.disconnect === true
        };
      }
      if (props.kind === "positionWp") {
        return {
          value: props.positionWp,
          caption: "WP",
          unit: "",
          formatter: "formatLonLats",
          formatterParameters: [],
          coordinateFormatter: "formatLonLatsDecimal",
          coordinateFormatterParameters: [],
          disconnect: props.disconnect === true
        };
      }
      return {};
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "NavMapper",
        "ThreeValueTextWidget",
        "PositionCoordinateWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: function () {
                return {};
              }
            };
          }
        },
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        ThreeValueTextWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        },
        PositionCoordinateWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "nav/dst": {
              routeId: "nav/dst",
              cluster: "nav",
              kind: "dst",
              mapperId: "NavMapper",
              rendererId: "ThreeValueTextWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            },
            "nav/positionWp": {
              routeId: "nav/positionWp",
              cluster: "nav",
              kind: "positionWp",
              mapperId: "NavMapper",
              rendererId: "PositionCoordinateWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-nav" };
    const stableShellEl = { id: "shell-nav" };
    const cases = [
      {
        kind: "dst",
        connected: { cluster: "nav", kind: "dst", dst: 4.2, disconnect: false },
        disconnected: { cluster: "nav", kind: "dst", dst: 4.2, disconnect: true }
      },
      {
        kind: "positionWp",
        connected: { cluster: "nav", kind: "positionWp", positionWp: { lon: 10.1, lat: 54.2 }, disconnect: false },
        disconnected: { cluster: "nav", kind: "positionWp", positionWp: { lon: 10.1, lat: 54.2 }, disconnect: true }
      }
    ];

    cases.forEach(function (entry, index) {
      const first = controller.activateCommittedRoute({
        routeFrame: entry.connected,
        revision: index * 10 + 1,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-connected" }
      });
      const second = controller.activateCommittedRoute({
        routeFrame: entry.disconnected,
        revision: index * 10 + 2,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-disconnected" }
      });
      const third = controller.activateCommittedRoute({
        routeFrame: entry.disconnected,
        revision: index * 10 + 3,
        rootEl: stableRootEl,
        shellEl: stableShellEl,
        hostContext: { marker: entry.kind + "-disconnected-repeat" }
      });

      expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
      expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
      expect(second.__mappedSignature).not.toBe(first.__mappedSignature);
      expect(third).toBe(routeActivation.DISCARDED_ACTIVATION);
    });
  });

  it("does not discard when mapped output is unchanged but committed host attachment target changed", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        value: 12.3,
        rendererProps: {
          mappedKind: "sog"
        }
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: function () {
                return {};
              }
            };
          }
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      nightMode: false,
      editing: false
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" }
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second.revision).toBe(2);
    expect(mapperTranslate).toHaveBeenCalledTimes(2);
  });

  it("clears memo discard state when invalidateMemoState() is called", function () {
    const mapperTranslate = vi.fn(function () {
      return {
        value: 12.3,
        rendererProps: {
          mappedKind: "sog"
        }
      };
    });
    const loader = createLoaderHarness({
      initialLoadedIds: [
        "ClusterMapperToolkit",
        "SpeedMapper",
        "SpeedRadialWidget"
      ],
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: function () {
                return {};
              }
            };
          }
        },
        SpeedMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        SpeedRadialWidget: {
          create: function () {
            return {
              renderCanvas: vi.fn()
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(),
      hasShadowCssText: vi.fn(() => true)
    };
    const widgetDef = { cluster: "speed" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn()
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {},
        clusterRoutes: {
          byRouteId: {
            "speed/sog": {
              routeId: "speed/sog",
              cluster: "speed",
              kind: "sog",
              mapperId: "SpeedMapper",
              rendererId: "SpeedRadialWidget",
              surface: "canvas-dom",
              shellSizing: { kind: "ratio", aspectRatio: 1 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const stableRootEl = { id: "root-stable" };
    const stableShellEl = { id: "shell-stable" };
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      nightMode: false,
      editing: false
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 1,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 2,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "b" }
    });
    controller.invalidateMemoState();
    const third = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 3,
      rootEl: stableRootEl,
      shellEl: stableShellEl,
      hostContext: { marker: "c" }
    });

    expect(first).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(second).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(third).not.toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(third.revision).toBe(3);
    expect(mapperTranslate).toHaveBeenCalledTimes(3);
  });

  it("reuses the same cold promise for a route and resolves with the latest snapshot, then discards cleanly on destroy", async function () {
    const mapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          marker: props.marker,
          routeId: routeContext.routeId
        }
      };
    });
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: props.marker,
        snapshot: props
      };
    });
    const deferredLoads = {
      NavMapper: createDeferred(),
      ActiveRouteViewModel: createDeferred(),
      ActiveRouteTextHtmlWidget: createDeferred(),
      ClusterMapperToolkit: createDeferred()
    };
    const loader = createLoaderHarness({
      deferredLoads: deferredLoads,
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate
            };
          }
        },
        NavMapper: {
          create: function () {
            return {
              translate: mapperTranslate
            };
          }
        },
        ActiveRouteViewModel: {
          create: function () {
            return {
              build: vi.fn(function (props) {
                return {
                  marker: props.marker
                };
              })
            };
          }
        },
        ActiveRouteTextHtmlWidget: {
          create: function () {
            return {
              createCommittedRenderer: vi.fn(function () {
                return {
                  mount: vi.fn(),
                  update: vi.fn(),
                  postPatch: vi.fn(() => false),
                  detach: vi.fn(),
                  destroy: vi.fn()
                };
              })
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(() => false)
    };
    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn(function (options) {
            options.props.surfacePolicy = { rendererId: options.rendererId };
            return options.props;
          })
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: ["/css/active-route.css"]
          }
        },
        clusterRoutes: {
          byRouteId: {
            "nav/activeRoute": {
              routeId: "nav/activeRoute",
              cluster: "nav",
              kind: "activeRoute",
              mapperId: "NavMapper",
              viewModelId: "ActiveRouteViewModel",
              rendererId: "ActiveRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 }
            }
          }
        }
      }
    });
    const routeMeta = context.DyniPlugin.config.clusterRoutes.byRouteId["nav/activeRoute"];
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const firstRouteFrame = {
      cluster: "nav",
      kind: "activeRoute",
      marker: "first",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", marker: "first" }
    };
    const secondRouteFrame = {
      cluster: "nav",
      kind: "activeRoute",
      marker: "second",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", marker: "second" }
    };

    const first = controller.activateCommittedRoute({
      routeFrame: firstRouteFrame,
      revision: 1,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" }
    });

    expect(first).toBe(second);

    deferredLoads.NavMapper.resolve();
    deferredLoads.ActiveRouteViewModel.resolve();
    deferredLoads.ActiveRouteTextHtmlWidget.resolve();
    deferredLoads.ClusterMapperToolkit.resolve();

    const payload = await first;
    expect(loader.createRecords.every(function (entry) {
      return entry.def === widgetDef;
    })).toBe(true);
    expect(loader.createRecords.every(function (entry) {
      return entry.def !== routeMeta;
    })).toBe(true);
    expect(payload.revision).toBe(2);
    expect(payload.rootEl).toEqual({ id: "root-b" });
    expect(payload.shellEl).toEqual({ id: "shell-b" });
    expect(payload.hostContext).toEqual({ marker: "b" });
    expect(payload.rawProps).toMatchObject({
      marker: "second"
    });
    expect(payload.props).toMatchObject({
      marker: "second",
      routeId: "nav/activeRoute"
    });

    const inFlight = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 3,
      rootEl: { id: "root-c" },
      shellEl: { id: "shell-c" },
      hostContext: { marker: "c" }
    });
    controller.destroy();

    expect(await inFlight).toBe(routeActivation.DISCARDED_ACTIVATION);
    expect(function () {
      controller.activateCommittedRoute({
        routeFrame: secondRouteFrame,
        revision: 4,
        rootEl: { id: "root-d" },
        shellEl: { id: "shell-d" },
        hostContext: { marker: "d" }
      });
    }).toThrow("RouteActivationError: controller destroyed");
  });

  it("keeps one current cold activation across route switches and hydrates the latest route snapshot", async function () {
    const activeMapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          routeLabel: "active",
          routeId: routeContext.routeId,
          marker: props.marker
        }
      };
    });
    const secondaryMapperTranslate = vi.fn(function (props, routeContext) {
      return {
        rendererProps: {
          routeLabel: "secondary",
          routeId: routeContext.routeId,
          marker: props.marker
        }
      };
    });
    const toolkitCreate = vi.fn(function (props) {
      return {
        fromToolkit: props.marker,
        snapshot: props
      };
    });
    const deferredLoads = {
      ActiveRouteMapper: createDeferred(),
      ActiveRouteViewModel: createDeferred(),
      ActiveRouteTextHtmlWidget: createDeferred(),
      SecondaryRouteMapper: createDeferred(),
      SecondaryRouteViewModel: createDeferred(),
      SecondaryRouteTextHtmlWidget: createDeferred(),
      ClusterMapperToolkit: createDeferred()
    };
    const loader = createLoaderHarness({
      deferredLoads: deferredLoads,
      modules: {
        ClusterMapperToolkit: {
          create: function () {
            return {
              createToolkit: toolkitCreate
            };
          }
        },
        ActiveRouteMapper: {
          create: function () {
            return {
              translate: activeMapperTranslate
            };
          }
        },
        ActiveRouteViewModel: {
          create: function () {
            return {
              build: vi.fn(function (props) {
                return {
                  marker: props.marker
                };
              })
            };
          }
        },
        ActiveRouteTextHtmlWidget: {
          create: function () {
            return {
              createCommittedRenderer: vi.fn(function () {
                return {
                  mount: vi.fn(),
                  update: vi.fn(),
                  postPatch: vi.fn(() => false),
                  detach: vi.fn(),
                  destroy: vi.fn()
                };
              })
            };
          }
        },
        SecondaryRouteMapper: {
          create: function () {
            return {
              translate: secondaryMapperTranslate
            };
          }
        },
        SecondaryRouteViewModel: {
          create: function () {
            return {
              build: vi.fn(function (props) {
                return {
                  marker: props.marker
                };
              })
            };
          }
        },
        SecondaryRouteTextHtmlWidget: {
          create: function () {
            return {
              createCommittedRenderer: vi.fn(function () {
                return {
                  mount: vi.fn(),
                  update: vi.fn(),
                  postPatch: vi.fn(() => false),
                  detach: vi.fn(),
                  destroy: vi.fn()
                };
              })
            };
          }
        }
      }
    });
    const themeRuntime = {
      preloadShadowCssUrls: vi.fn(function (urls) {
        return Promise.resolve(urls);
      }),
      hasShadowCssText: vi.fn(() => false)
    };
    const widgetDef = { cluster: "nav" };
    const context = createBaseContext({
      runtime: {
        componentLoader: loader,
        theme: themeRuntime,
        surfaces: {
          materializeSurfacePolicyProps: vi.fn(function (options) {
            options.props.surfacePolicy = { rendererId: options.rendererId };
            return options.props;
          })
        },
        perf: {
          startSpan: vi.fn(() => null),
          endSpan: vi.fn()
        }
      },
      config: {
        shared: {},
        components: {
          ActiveRouteTextHtmlWidget: {
            shadowCss: ["/css/active-route.css"]
          },
          SecondaryRouteTextHtmlWidget: {
            shadowCss: ["/css/secondary-route.css"]
          }
        },
        clusterRoutes: {
          byRouteId: {
            "nav/activeRoute": {
              routeId: "nav/activeRoute",
              cluster: "nav",
              kind: "activeRoute",
              mapperId: "ActiveRouteMapper",
              viewModelId: "ActiveRouteViewModel",
              rendererId: "ActiveRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 }
            },
            "nav/secondaryRoute": {
              routeId: "nav/secondaryRoute",
              cluster: "nav",
              kind: "secondaryRoute",
              mapperId: "SecondaryRouteMapper",
              viewModelId: "SecondaryRouteViewModel",
              rendererId: "SecondaryRouteTextHtmlWidget",
              surface: "html",
              shellSizing: { kind: "ratio", aspectRatio: 2 }
            }
          }
        }
      }
    });
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController(widgetDef);
    const firstRouteFrame = {
      cluster: "nav",
      kind: "activeRoute",
      marker: "first",
      __dyniRouteId: "nav/activeRoute",
      __dyniRawProps: { cluster: "nav", kind: "activeRoute", marker: "first" }
    };
    const secondRouteFrame = {
      cluster: "nav",
      kind: "secondaryRoute",
      marker: "second",
      __dyniRouteId: "nav/secondaryRoute",
      __dyniRawProps: { cluster: "nav", kind: "secondaryRoute", marker: "second" }
    };

    const first = controller.activateCommittedRoute({
      routeFrame: firstRouteFrame,
      revision: 1,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: secondRouteFrame,
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" }
    });

    expect(first).toBe(second);

    deferredLoads.ActiveRouteMapper.resolve();
    deferredLoads.ActiveRouteViewModel.resolve();
    deferredLoads.ActiveRouteTextHtmlWidget.resolve();
    deferredLoads.ClusterMapperToolkit.resolve();

    await flushPromises();

    expect(loader.createRecords).toEqual([]);
    expect(activeMapperTranslate).not.toHaveBeenCalled();
    expect(secondaryMapperTranslate).not.toHaveBeenCalled();
    expect(loader.loadRecords).toEqual([
      "ActiveRouteMapper",
      "ActiveRouteViewModel",
      "ActiveRouteTextHtmlWidget",
      "ClusterMapperToolkit",
      "SecondaryRouteMapper",
      "SecondaryRouteViewModel",
      "SecondaryRouteTextHtmlWidget",
      "ClusterMapperToolkit"
    ]);

    deferredLoads.SecondaryRouteMapper.resolve();
    deferredLoads.SecondaryRouteViewModel.resolve();
    deferredLoads.SecondaryRouteTextHtmlWidget.resolve();

    await flushPromises();

    const payload = await second;
    expect(loader.createRecords.every(function (entry) {
      return entry.def === widgetDef;
    })).toBe(true);
    expect(payload).toMatchObject({
      routeId: "nav/secondaryRoute",
      revision: 2,
      rootEl: { id: "root-b" },
      shellEl: { id: "shell-b" },
      hostContext: { marker: "b" },
      rawProps: {
        cluster: "nav",
        kind: "secondaryRoute",
        marker: "second"
      }
    });
    expect(payload.props).toMatchObject({
      marker: "second",
      routeId: "nav/secondaryRoute",
      routeLabel: "secondary",
      surfacePolicy: {
        rendererId: "SecondaryRouteTextHtmlWidget"
      }
    });
    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledTimes(1);
    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith(["/css/secondary-route.css"]);
    expect(loader.createRecords.map(function (entry) {
      return entry.id;
    })).toEqual([
      "SecondaryRouteMapper",
      "SecondaryRouteViewModel",
      "SecondaryRouteTextHtmlWidget",
      "ClusterMapperToolkit"
    ]);
    expect(secondaryMapperTranslate).toHaveBeenCalledTimes(1);
    expect(activeMapperTranslate).not.toHaveBeenCalled();
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "nav",
      kind: "secondaryRoute",
      marker: "second"
    });
  });
});
