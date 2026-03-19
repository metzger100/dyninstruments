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

  function create(def, Helpers) {
    function renderSurfaceShell(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec;
      const props = opts.props;
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;

      let innerHtml = "";
      if (rendererSpec && typeof rendererSpec.renderHtml === "function") {
        const rendered = hostContext
          ? rendererSpec.renderHtml.call(hostContext, props)
          : rendererSpec.renderHtml(props);
        innerHtml = (typeof rendered === "string") ? rendered : "";
      }

      return '<div class="' + SURFACE_CLASS + '">' + innerHtml + "</div>";
    }

    function createSurfaceController(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec || null;
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;

      let attached = false;
      let destroyed = false;
      let rootEl = null;
      let shellEl = null;
      let props = undefined;
      let revision = 0;

      function attach(payload) {
        if (destroyed) {
          throw new Error("HtmlSurfaceController: attach() after destroy()");
        }
        ensurePayload("attach", payload);
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;
        attached = true;

        if (rendererSpec && typeof rendererSpec.initFunction === "function") {
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
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;

        return {
          updated: changed,
          changed: changed
        };
      }

      function detach(reason) {
        rootEl = null;
        shellEl = null;
        props = undefined;
        revision = 0;
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
