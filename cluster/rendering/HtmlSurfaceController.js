/**
 * Module: HtmlSurfaceController - Strict html-surface lifecycle owner for attach/update/detach/destroy
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniHtmlSurfaceController = factory(); }
}(this, function () {
  "use strict";

  const SURFACE_ID = "html";
  const SURFACE_CLASS = "dyni-surface-html";
  const PREBOUND_HANDLER_NAMES = "__dyniHtmlSurfacePreboundHandlers";
  const FORBIDDEN_HANDLER_NAME = "catchAll";

  function ensurePayload(methodName, payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires a payload object");
    }
    if (!Number.isFinite(payload.revision)) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires finite payload.revision");
    }
    if (!payload.rootEl) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.rootEl");
    }
    if (!payload.shellEl) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.shellEl");
    }
    if (payload.surface && payload.surface !== SURFACE_ID) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.surface === 'html'");
    }
  }

  function ensureHostContext(methodName, hostContext) {
    if (!hostContext || typeof hostContext !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires hostContext object");
    }
  }

  function ensureRendererSpec(methodName, rendererSpec) {
    if (!rendererSpec || typeof rendererSpec !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec object");
    }
    if (typeof rendererSpec.renderHtml !== "function") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec.renderHtml()");
    }
    if (typeof rendererSpec.namedHandlers !== "function") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec.namedHandlers()");
    }
    if (typeof rendererSpec.resizeSignature !== "function") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec.resizeSignature()");
    }
  }

  function ensureEventHandlerStore(hostContext) {
    if (!hostContext.eventHandler || typeof hostContext.eventHandler !== "object") {
      hostContext.eventHandler = [];
    }
    return hostContext.eventHandler;
  }

  function normalizeHandlerNames(handlerMap, methodName) {
    if (!handlerMap || typeof handlerMap !== "object" || Array.isArray(handlerMap)) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires namedHandlers() to return an object map");
    }
    const names = Object.keys(handlerMap);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      if (!name || typeof name !== "string") {
        throw new Error("HtmlSurfaceController: " + methodName + "() namedHandlers() returned invalid handler name");
      }
      if (name === FORBIDDEN_HANDLER_NAME) {
        throw new Error("HtmlSurfaceController: " + methodName + "() must not own '" + FORBIDDEN_HANDLER_NAME + "' handler");
      }
      if (typeof handlerMap[name] !== "function") {
        throw new Error("HtmlSurfaceController: " + methodName + "() namedHandlers()['" + name + "'] must be a function");
      }
    }
    return names;
  }

  function bindNamedHandlers(hostContext, handlerMap, previousNames, methodName) {
    const names = normalizeHandlerNames(handlerMap, methodName);
    const handlers = ensureEventHandlerStore(hostContext);
    const previous = previousNames;
    const nextLookup = Object.create(null);

    for (let i = 0; i < names.length; i += 1) {
      nextLookup[names[i]] = true;
      handlers[names[i]] = handlerMap[names[i]];
    }

    for (let i = 0; i < previous.length; i += 1) {
      const oldName = previous[i];
      if (oldName === FORBIDDEN_HANDLER_NAME || nextLookup[oldName]) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(handlers, oldName)) {
        delete handlers[oldName];
      }
    }

    return names;
  }

  function removeNamedHandlers(hostContext, names) {
    const handlers = ensureEventHandlerStore(hostContext);
    const list = names;
    for (let i = 0; i < list.length; i += 1) {
      const name = list[i];
      if (!name || name === FORBIDDEN_HANDLER_NAME) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(handlers, name)) {
        delete handlers[name];
      }
    }
  }

  function normalizeResizeSignature(signature, methodName) {
    if (signature == null) {
      return "null";
    }
    const t = typeof signature;
    if (t === "string" || t === "number" || t === "boolean") {
      return t + ":" + String(signature);
    }
    throw new Error("HtmlSurfaceController: " + methodName + "() resizeSignature() must return primitive signature");
  }

  function resolveNamedHandlers(rendererSpec, props, hostContext, methodName) {
    const handlerMap = rendererSpec.namedHandlers(props, hostContext);
    normalizeHandlerNames(handlerMap, methodName);
    return handlerMap;
  }

  function resolveResizeSignature(rendererSpec, props, hostContext, methodName) {
    return normalizeResizeSignature(rendererSpec.resizeSignature(props, hostContext), methodName);
  }

  function bindPreRenderHandlers(rendererSpec, props, hostContext) {
    const previous = Array.isArray(hostContext[PREBOUND_HANDLER_NAMES])
      ? hostContext[PREBOUND_HANDLER_NAMES]
      : [];
    const handlerMap = resolveNamedHandlers(rendererSpec, props, hostContext, "renderSurfaceShell");
    const names = bindNamedHandlers(hostContext, handlerMap, previous, "renderSurfaceShell");
    hostContext[PREBOUND_HANDLER_NAMES] = names.slice();
  }

  function create(def, Helpers) {
    function renderSurfaceShell(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec;
      const props = opts.props;
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;

      ensureRendererSpec("renderSurfaceShell", rendererSpec);
      ensureHostContext("renderSurfaceShell", hostContext);
      bindPreRenderHandlers(rendererSpec, props, hostContext);

      const rendered = rendererSpec.renderHtml.call(hostContext, props);
      if (typeof rendered !== "string") {
        throw new Error("HtmlSurfaceController: renderSurfaceShell() requires rendererSpec.renderHtml() to return string");
      }
      const innerHtml = rendered;

      return '<div class="' + SURFACE_CLASS + '">' + innerHtml + "</div>";
    }

    function createSurfaceController(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec || null;
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;
      ensureRendererSpec("createSurfaceController", rendererSpec);
      ensureHostContext("createSurfaceController", hostContext);

      let attached = false;
      let destroyed = false;
      let rootEl = null;
      let shellEl = null;
      let props = undefined;
      let revision = 0;
      let ownedHandlerNames = [];
      let resizeSignature = "null";

      function bindOwnedHandlers(nextProps, methodName) {
        const handlerMap = resolveNamedHandlers(rendererSpec, nextProps, hostContext, methodName);
        ownedHandlerNames = bindNamedHandlers(hostContext, handlerMap, ownedHandlerNames, methodName);
      }

      function refreshResizeSignature(nextProps, methodName) {
        const nextSignature = resolveResizeSignature(rendererSpec, nextProps, hostContext, methodName);
        if (nextSignature === resizeSignature) {
          return false;
        }
        resizeSignature = nextSignature;
        if (typeof hostContext.triggerResize === "function") {
          hostContext.triggerResize();
        }
        return true;
      }

      function attach(payload) {
        if (destroyed) {
          throw new Error("HtmlSurfaceController: attach() after destroy()");
        }
        ensurePayload("attach", payload);
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;
        bindOwnedHandlers(props, "attach");
        resizeSignature = resolveResizeSignature(rendererSpec, props, hostContext, "attach");
        attached = true;

        if (typeof rendererSpec.initFunction === "function") {
          if (hostContext) {
            rendererSpec.initFunction.call(hostContext, props);
          } else {
            rendererSpec.initFunction(props);
          }
        }
      }

      function update(payload) {
        ensurePayload("update", payload);
        if (!attached) {
          throw new Error("HtmlSurfaceController: update() requires an attached surface");
        }
        if (payload.shellEl !== shellEl) {
          throw new Error("HtmlSurfaceController: update() received a different shellEl; remount required");
        }

        const changed = props !== payload.props;
        bindOwnedHandlers(payload.props, "update");
        const resized = refreshResizeSignature(payload.props, "update");
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;

        return {
          updated: changed || resized,
          changed: changed
        };
      }

      function detach(reason) {
        removeNamedHandlers(hostContext, ownedHandlerNames);
        ownedHandlerNames = [];
        if (Array.isArray(hostContext[PREBOUND_HANDLER_NAMES])) {
          hostContext[PREBOUND_HANDLER_NAMES] = [];
        }
        rootEl = null;
        shellEl = null;
        props = undefined;
        revision = 0;
        resizeSignature = "null";
        attached = false;
      }

      function destroy() {
        if (destroyed) {
          return;
        }
        detach("destroy");
        destroyed = true;
      }

      return {
        attach: attach,
        update: update,
        detach: detach,
        destroy: destroy
      };
    }

    return {
      id: "HtmlSurfaceController",
      renderSurfaceShell: renderSurfaceShell,
      createSurfaceController: createSurfaceController
    };
  }

  return { id: "HtmlSurfaceController", create: create };
}));
