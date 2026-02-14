/**
 * Module: DyniPlugin Widget Registrar - Widget definition composition and registration
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: runtime/editable-defaults.js, avnav.api.registerWidget
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function composeUpdates() {
    const fns = Array.prototype.slice.call(arguments).filter(function (fn) {
      return typeof fn === "function";
    });

    if (!fns.length) return undefined;

    return function (values) {
      const ctx = this;
      return fns.reduce(function (acc, fn) {
        const r = fn.call(ctx, acc);
        return (r && typeof r === "object") ? r : acc;
      }, values);
    };
  }

  function registerWidget(component, widgetDef, Helpers) {
    const spec = component.create(widgetDef.def, Helpers) || {};

    const defaultClass = "dyniplugin";
    const mergedClassName = [defaultClass, widgetDef.def.className, spec.className]
      .filter(Boolean)
      .join(" ");

    const storeKeys = spec.storeKeys || widgetDef.def.storeKeys ||
      (widgetDef.def.storeKey ? { value: widgetDef.def.storeKey } : undefined);

    const renderCanvas = typeof spec.renderCanvas === "function" ? spec.renderCanvas : undefined;
    const renderHtml = typeof spec.renderHtml === "function" ? spec.renderHtml : undefined;
    const initFunction = typeof spec.initFunction === "function" ? spec.initFunction : undefined;
    const finalizeFunction = typeof spec.finalizeFunction === "function" ? spec.finalizeFunction : undefined;
    const translateFunction = typeof spec.translateFunction === "function" ? spec.translateFunction : undefined;

    const updateFunction = composeUpdates(spec.updateFunction, widgetDef.def.updateFunction);

    const wantsHide = !!spec.wantsHideNativeHead;

    function wrapRenderCanvas(fn) {
      if (!fn) return undefined;
      return function (canvas, props) {
        if (wantsHide && !canvas.__dyniMarked) {
          const rootEl = canvas.closest(".widget, .DirectWidget") || canvas.parentElement;
          if (rootEl && !rootEl.hasAttribute("data-dyni")) rootEl.setAttribute("data-dyni", "");
          canvas.__dyniMarked = true;
        }
        return fn.apply(this, [canvas, props]);
      };
    }

    const defaultsFn = runtime.defaultsFromEditableParams;
    const perInstrumentDefaults = typeof defaultsFn === "function"
      ? defaultsFn(widgetDef.def.editableParameters)
      : {};

    const baseDef = {
      name: widgetDef.def.name,
      description: widgetDef.def.description || widgetDef.def.name,
      caption: widgetDef.def.caption || "",
      unit: widgetDef.def.unit || "",
      default: widgetDef.def.default || "---",
      storeKeys: storeKeys,
      className: mergedClassName,

      cluster: widgetDef.def.cluster,
      ...perInstrumentDefaults,

      renderCanvas: wrapRenderCanvas(renderCanvas),
      renderHtml: renderHtml,
      initFunction: initFunction,
      finalizeFunction: finalizeFunction,
      translateFunction: translateFunction,
      updateFunction: updateFunction
    };

    const editable = widgetDef.def.editableParameters || {};
    root.avnav.api.registerWidget(baseDef, editable);
  }

  runtime.registerWidget = registerWidget;
}(this));
