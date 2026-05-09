/**
 * Module: DyniPlugin Route Activation Payload Builder - Route metadata and payload assembly helpers
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: runtime/namespace.js, runtime/component-loader.js, runtime/theme-runtime.js, runtime/surface/index.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function ensureObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error("RouteActivationPayloadBuilder: " + name + " must be an object");
    }
    return value;
  }

  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }

  function ensureRouteMeta(routeMeta, routeId) {
    if (!routeMeta || typeof routeMeta !== "object") {
      throw new Error("RouteActivationController: unknown route '" + routeId + "'");
    }
    if (typeof routeMeta.mapperId !== "string" || !routeMeta.mapperId) {
      throw new Error("RouteActivationController: route '" + routeId + "' requires mapperId");
    }
    if (typeof routeMeta.rendererId !== "string" || !routeMeta.rendererId) {
      throw new Error("RouteActivationController: route '" + routeId + "' requires rendererId");
    }
    if (routeMeta.surface !== "html" && routeMeta.surface !== "canvas-dom") {
      throw new Error("RouteActivationController: route '" + routeId + "' requires surface 'html' or 'canvas-dom'");
    }
  }

  function cloneRouteProps(routeFrame) {
    const props = routeFrame && typeof routeFrame === "object" ? routeFrame : {};
    const cleanProps = Object.assign({}, props);
    delete cleanProps.__dyniRouteId;
    delete cleanProps.__dyniRawProps;
    return cleanProps;
  }

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

  function resolveRouteRoots(routeMeta) {
    const roots = [routeMeta.mapperId];
    if (routeMeta.viewModelId) {
      roots.push(routeMeta.viewModelId);
    }
    roots.push(routeMeta.rendererId);
    return roots;
  }

  function resolveShadowCssUrls(rendererId) {
    const components = ns.config && ns.config.components ? ns.config.components : null;
    const componentDef = components && components[rendererId] ? components[rendererId] : null;
    return componentDef && Array.isArray(componentDef.shadowCss)
      ? componentDef.shadowCss.filter(function (url) {
        return typeof url === "string" && !!url;
      })
      : [];
  }

  function createRouteContext(routeMeta, routeCache, mapperProps, toolkitSpec) {
    return {
      routeId: routeMeta.routeId,
      cluster: routeMeta.cluster,
      kind: routeMeta.kind,
      viewModel: routeMeta.viewModelId ? routeCache.viewModel : null,
      toolkit: toolkitSpec.createToolkit(mapperProps)
    };
  }

  function mergeRendererProps(finalProps, mappedProps) {
    if (mappedProps.rendererProps && typeof mappedProps.rendererProps === "object" && !Array.isArray(mappedProps.rendererProps)) {
      Object.assign(finalProps, mappedProps.rendererProps);
    }

    if (Object.prototype.hasOwnProperty.call(finalProps, "rendererProps")) {
      delete finalProps.rendererProps;
    }

    return finalProps;
  }

  function buildActivatedPayload(options) {
    const snapshot = ensureObject(options.snapshot, "snapshot");
    const routeMeta = ensureObject(options.routeMeta, "routeMeta");
    const routeCache = ensureObject(options.routeCache, "routeCache");
    const toolkitSpec = ensureObject(options.toolkitSpec, "toolkitSpec");
    const surfaces = ensureObject(options.surfaces, "surfaces");
    const routeFrame = snapshot.routeFrame;
    const mapperProps = cloneRouteProps(routeFrame);
    const routeContext = createRouteContext(routeMeta, routeCache, mapperProps, toolkitSpec);
    const mappedProps = routeCache.mapper.translate(mapperProps, routeContext) || {};
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
      shadowCssUrls: routeMeta.surface === "html" ? resolveShadowCssUrls(routeMeta.rendererId) : []
    };
  }

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

  function createPayloadBuilder(options) {
    const loader = ensureObject(options.loader, "loader");
    const themeRuntime = ensureObject(options.themeRuntime, "themeRuntime");
    const surfaces = ensureObject(options.surfaces, "surfaces");

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
      resolveWarmReady: function (routeMeta) {
        return resolveWarmReady(routeMeta, loader, themeRuntime);
      },
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

  runtime.routeActivationPayloadBuilder = Object.freeze({
    createPayloadBuilder: createPayloadBuilder
  });
}(this));
