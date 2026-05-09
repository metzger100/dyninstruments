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
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController({ cluster: "nav" });
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
    const mapperTranslate = vi.fn(function () {
      return {
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
    const controller = routeActivation.createWidgetController({ cluster: "speed" });
    const routeFrame = {
      cluster: "speed",
      kind: "sog",
      extra: "warm",
      __dyniRouteId: "speed/sog",
      __dyniRawProps: { cluster: "speed", kind: "sog", extra: "warm" }
    };

    const first = controller.activateCommittedRoute({
      routeFrame: routeFrame,
      revision: 11,
      rootEl: { id: "root-a" },
      shellEl: { id: "shell-a" },
      hostContext: { marker: "a" }
    });
    const second = controller.activateCommittedRoute({
      routeFrame: routeFrame,
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
    expect(loader.loadRecords).toEqual([]);
    expect(toolkitCreate).toHaveBeenCalledWith({
      cluster: "speed",
      kind: "sog",
      extra: "warm"
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
    const routeActivation = loadController(context);
    const controller = routeActivation.createWidgetController({ cluster: "nav" });
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
    const controller = routeActivation.createWidgetController({ cluster: "nav" });
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
