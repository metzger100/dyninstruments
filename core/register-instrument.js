/**
 * Module: DyniPlugin Register Instrument - Widget definition composition and registration
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: core/editable-defaults.js, avnav.api.registerWidget
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const core = ns.core || (ns.core = {});

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

  function registerInstrument(mod, inst, Helpers) {
    const spec = mod.create(inst.def, Helpers) || {};

    const defaultClass = "dyniplugin";
    const mergedClassName = [defaultClass, inst.def.className, spec.className]
      .filter(Boolean)
      .join(" ");

    const storeKeys = spec.storeKeys || inst.def.storeKeys ||
      (inst.def.storeKey ? { value: inst.def.storeKey } : undefined);

    const renderCanvas = typeof spec.renderCanvas === "function" ? spec.renderCanvas : undefined;
    const renderHtml = typeof spec.renderHtml === "function" ? spec.renderHtml : undefined;
    const initFunction = typeof spec.initFunction === "function" ? spec.initFunction : undefined;
    const finalizeFunction = typeof spec.finalizeFunction === "function" ? spec.finalizeFunction : undefined;
    const translateFunction = typeof spec.translateFunction === "function" ? spec.translateFunction : undefined;

    const updateFunction = composeUpdates(spec.updateFunction, inst.def.updateFunction);

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

    const defaultsFn = core.defaultsFromEditableParams;
    const perInstrumentDefaults = typeof defaultsFn === "function"
      ? defaultsFn(inst.def.editableParameters)
      : {};

    const baseDef = {
      name: inst.def.name,
      description: inst.def.description || inst.def.name,
      caption: inst.def.caption || "",
      unit: inst.def.unit || "",
      default: inst.def.default || "---",
      storeKeys: storeKeys,
      className: mergedClassName,

      cluster: inst.def.cluster,
      ...perInstrumentDefaults,

      renderCanvas: wrapRenderCanvas(renderCanvas),
      renderHtml: renderHtml,
      initFunction: initFunction,
      finalizeFunction: finalizeFunction,
      translateFunction: translateFunction,
      updateFunction: updateFunction
    };

    const editable = inst.def.editableParameters || {};
    root.avnav.api.registerWidget(baseDef, editable);
  }

  core.registerInstrument = registerInstrument;
}(this));
