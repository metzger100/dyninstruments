/**
 * @file DyniPlugin Route Activation Payload Builder - Route metadata and payload assembly helpers
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {DyniClusterRoute & { routeId: string }} DyniActivationRouteMeta */
  /** @typedef {{ translate: (props: DyniMapperProps, routeContext: DyniMapperRouteContextWithViewModel) => Record<string, unknown> }} DyniActivationMapper */
  /** @typedef {{ createToolkit: (props?: DyniMapperProps) => DyniMapperToolkit }} DyniActivationToolkitSpec */
  /** @typedef {{ mapper: DyniActivationMapper, viewModel: DyniMapperViewModel | null, rendererSpec: unknown }} DyniActivationRouteCache */
  /** @typedef {DyniMapperRouteContextWithViewModel & { routeId: string, cluster: string, kind: string }} DyniActivationRouteContext */
  /** @typedef {{ routeFrame: DyniRouteFrame, revision: unknown, rootEl: unknown, shellEl: unknown, hostContext: unknown }} DyniActivationSnapshot */
  /** @typedef {{ snapshot: DyniActivationSnapshot, routeMeta: DyniActivationRouteMeta, routeCache: DyniActivationRouteCache, toolkitSpec: DyniActivationToolkitSpec, surfaces: DyniSurfaceRuntimeApi }} DyniActivatedPayloadOptions */
  /** @typedef {{ areComponentsLoaded: (ids: string[]) => boolean }} DyniActivationLoader */
  /** @typedef {{ hasShadowCssText: (url: string) => boolean }} DyniActivationThemeRuntime */
  /** @typedef {{ snapshot: DyniActivationSnapshot, routeMeta: DyniActivationRouteMeta, routeCache: DyniActivationRouteCache, toolkitSpec: DyniActivationToolkitSpec }} DyniPayloadBuildRequest */

  const ns = /** @type {DyniPluginNamespace} */ (root.DyniPlugin);
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);
  const components = /** @type {{ DyniValueMath: { create: () => DyniValueMathApi } }} */ (root.DyniComponents);
  const valueMath = components.DyniValueMath.create();

  /** @param {unknown} value @param {string} name @returns {Record<string, unknown>} */
  const ensureObject = function (value, name) {
    return /** @type {Record<string, unknown>} */ (valueMath.ensureObject(value, "RouteActivationPayloadBuilder: " + name));
  };
  const trimText = valueMath.trimText;

  /** @param {unknown} routeMeta @param {string} routeId @returns {asserts routeMeta is DyniActivationRouteMeta} */
  function ensureRouteMeta(routeMeta, routeId) {
    if (!routeMeta || typeof routeMeta !== "object") {
      throw new Error("RouteActivationController: unknown route '" + routeId + "'");
    }
    const meta = /** @type {Record<string, unknown>} */ (routeMeta);
    if (typeof meta.mapperId !== "string" || !meta.mapperId) {
      throw new Error("RouteActivationController: route '" + routeId + "' requires mapperId");
    }
    if (typeof meta.rendererId !== "string" || !meta.rendererId) {
      throw new Error("RouteActivationController: route '" + routeId + "' requires rendererId");
    }
    if (meta.surface !== "html" && meta.surface !== "canvas-dom") {
      throw new Error("RouteActivationController: route '" + routeId + "' requires surface 'html' or 'canvas-dom'");
    }
  }

  /** @param {DyniRouteFrame|null|undefined} routeFrame @returns {DyniMapperProps} */
  function cloneRouteProps(routeFrame) {
    const props = routeFrame && typeof routeFrame === "object" ? routeFrame : {};
    const cleanProps = Object.assign({}, props);
    delete cleanProps.__dyniRouteId;
    delete cleanProps.__dyniRawProps;
    return /** @type {DyniMapperProps} */ (cleanProps);
  }

  /** @param {DyniRouteFrame|null|undefined} routeFrame @param {unknown} defaultCluster @returns {string} */
  function resolveRouteId(routeFrame, defaultCluster) {
    const props = routeFrame && typeof routeFrame === "object" ? routeFrame : {};
    const cluster = trimText(props.cluster || defaultCluster);
    const kind = trimText(props.kind);
    if (!cluster) {
      throw new Error("RouteActivationController: routeFrame.cluster must be a non-empty string");
    }
    if (!kind) {
      throw new Error("RouteActivationController: routeFrame.kind must be a non-empty string");
    }
    return cluster + "/" + kind;
  }

  /** @param {DyniActivationRouteMeta} routeMeta @returns {string[]} */
  function resolveRouteRoots(routeMeta) {
    const roots = [routeMeta.mapperId];
    if (routeMeta.viewModelId) {
      roots.push(routeMeta.viewModelId);
    }
    roots.push(routeMeta.rendererId);
    return roots;
  }

  /** @param {string} rendererId @returns {string[]} */
  function resolveShadowCssUrls(rendererId) {
    const components = ns.config && ns.config.components ? ns.config.components : null;
    const componentDef = components && components[rendererId] ? components[rendererId] : null;
    return componentDef && Array.isArray(componentDef.shadowCss)
      ? componentDef.shadowCss.filter(function (url) {
        return typeof url === "string" && !!url;
      })
      : [];
  }

  /** @param {DyniActivationRouteMeta} routeMeta @param {DyniActivationRouteCache} routeCache @param {DyniMapperProps} mapperProps @param {DyniActivationToolkitSpec} toolkitSpec @returns {DyniActivationRouteContext} */
  function createRouteContext(routeMeta, routeCache, mapperProps, toolkitSpec) {
    return {
      routeId: routeMeta.routeId,
      cluster: routeMeta.cluster,
      kind: routeMeta.kind,
      viewModel: routeMeta.viewModelId ? routeCache.viewModel : null,
      toolkit: toolkitSpec.createToolkit(mapperProps)
    };
  }

  /** @param {Record<string, unknown>} finalProps @param {Record<string, unknown>} mappedProps @returns {Record<string, unknown>} */
  function mergeRendererProps(finalProps, mappedProps) {
    if (mappedProps.rendererProps && typeof mappedProps.rendererProps === "object" && !Array.isArray(mappedProps.rendererProps)) {
      Object.assign(finalProps, mappedProps.rendererProps);
    }

    if (Object.prototype.hasOwnProperty.call(finalProps, "renderer")) {
      delete finalProps.renderer;
    }
    if (Object.prototype.hasOwnProperty.call(finalProps, "rendererProps")) {
      delete finalProps.rendererProps;
    }

    return finalProps;
  }

  /** @param {DyniActivatedPayloadOptions} options */
  function buildActivatedPayload(options) {
    const snapshot = /** @type {DyniActivationSnapshot} */ (ensureObject(options.snapshot, "snapshot"));
    const routeMeta = /** @type {DyniActivationRouteMeta} */ (/** @type {unknown} */ (ensureObject(options.routeMeta, "routeMeta")));
    const routeCache = /** @type {DyniActivationRouteCache} */ (ensureObject(options.routeCache, "routeCache"));
    const toolkitSpec = /** @type {DyniActivationToolkitSpec} */ (ensureObject(options.toolkitSpec, "toolkitSpec"));
    const surfaces = /** @type {DyniSurfaceRuntimeApi} */ (/** @type {unknown} */ (ensureObject(options.surfaces, "surfaces")));
    const routeFrame = snapshot.routeFrame;
    const mapperProps = cloneRouteProps(routeFrame);
    const routeContext = createRouteContext(routeMeta, routeCache, mapperProps, toolkitSpec);
    const mappedProps = routeCache.mapper.translate(mapperProps, routeContext) || {};
    var mappedSignature = JSON.stringify(mappedProps);
    const finalProps = mergeRendererProps(Object.assign({}, mapperProps, mappedProps), mappedProps);

    if (routeMeta.surface === "html") {
      surfaces.materializeSurfacePolicyProps({
        hostContext: snapshot.hostContext,
        rendererId: routeMeta.rendererId,
        props: finalProps
      });
    }

    return {
      routeId: routeMeta.routeId,
      route: routeMeta,
      surface: routeMeta.surface,
      rendererId: routeMeta.rendererId,
      rendererSpec: routeCache.rendererSpec,
      rootEl: snapshot.rootEl,
      shellEl: snapshot.shellEl,
      hostContext: snapshot.hostContext,
      props: finalProps,
      rawProps: mapperProps,
      revision: snapshot.revision,
      shadowCssUrls: routeMeta.surface === "html" ? resolveShadowCssUrls(routeMeta.rendererId) : [],
      __mappedSignature: mappedSignature
    };
  }

  /** @param {DyniActivationRouteMeta} routeMeta @param {DyniActivationLoader} loader @param {DyniActivationThemeRuntime} themeRuntime @returns {boolean} */
  function resolveWarmReady(routeMeta, loader, themeRuntime) {
    const routeRoots = resolveRouteRoots(routeMeta);
    if (!loader.areComponentsLoaded(routeRoots)) {
      return false;
    }
    if (routeMeta.surface !== "html") {
      return true;
    }
    const shadowCssUrls = resolveShadowCssUrls(routeMeta.rendererId);
    for (let i = 0; i < shadowCssUrls.length; i += 1) {
      if (!themeRuntime.hasShadowCssText(shadowCssUrls[i])) {
        return false;
      }
    }
    return true;
  }

  /** @param {{ loader: DyniActivationLoader, themeRuntime: DyniActivationThemeRuntime, surfaces: DyniSurfaceRuntimeApi }} options */
  function createPayloadBuilder(options) {
    const loader = /** @type {DyniActivationLoader} */ (ensureObject(options.loader, "loader"));
    const themeRuntime = /** @type {DyniActivationThemeRuntime} */ (ensureObject(options.themeRuntime, "themeRuntime"));
    const surfaces = /** @type {DyniSurfaceRuntimeApi} */ (/** @type {unknown} */ (ensureObject(options.surfaces, "surfaces")));

    if (typeof loader.areComponentsLoaded !== "function") {
      throw new Error("RouteActivationPayloadBuilder: loader.areComponentsLoaded must be a function");
    }
    if (typeof themeRuntime.hasShadowCssText !== "function") {
      throw new Error("RouteActivationPayloadBuilder: themeRuntime.hasShadowCssText must be a function");
    }
    if (typeof surfaces.materializeSurfacePolicyProps !== "function") {
      throw new Error("RouteActivationPayloadBuilder: surfaces.materializeSurfacePolicyProps must be a function");
    }

    return Object.freeze({
      ensureRouteMeta: ensureRouteMeta,
      cloneRouteProps: cloneRouteProps,
      resolveRouteId: resolveRouteId,
      resolveRouteRoots: resolveRouteRoots,
      resolveShadowCssUrls: resolveShadowCssUrls,
      /** @param {DyniActivationRouteMeta} routeMeta @returns {boolean} */
      resolveWarmReady: function (routeMeta) {
        return resolveWarmReady(routeMeta, loader, themeRuntime);
      },
      /** @param {DyniPayloadBuildRequest} options */
      buildActivatedPayload: function (options) {
        return buildActivatedPayload({
          snapshot: options.snapshot,
          routeMeta: options.routeMeta,
          routeCache: options.routeCache,
          toolkitSpec: options.toolkitSpec,
          surfaces: surfaces
        });
      }
    });
  }

  /** @type {DyniRuntimeNamespace & Record<string, unknown>} */ (runtime).routeActivationPayloadBuilder = Object.freeze({
    createPayloadBuilder: createPayloadBuilder
  });
}(this));
