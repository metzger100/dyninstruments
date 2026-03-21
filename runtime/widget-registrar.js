/**
 * Module: DyniPlugin Widget Registrar - Widget definition composition and registration
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: runtime/editable-defaults.js, avnav.api.registerWidget
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;
  const LAYOUT_EDITING_HINT_KEY = "dyniLayoutEditing";

  function applyLayoutEditingHint(sourceValues, candidate) {
    if (!sourceValues || typeof sourceValues !== "object") {
      return candidate;
    }
    if (!hasOwn.call(sourceValues, "editing")) {
      return candidate;
    }
    const out = (candidate && typeof candidate === "object") ? candidate : {};
    out[LAYOUT_EDITING_HINT_KEY] = sourceValues.editing === true;
    return out;
  }

  function composeUpdates() {
    const fns = Array.prototype.slice.call(arguments).filter(function (fn) {
      return typeof fn === "function";
    });

    if (!fns.length) {
      return undefined;
    }

    return function (values) {
      const ctx = this;
      const next = fns.reduce(function (acc, fn) {
        const r = fn.call(ctx, acc);
        return (r && typeof r === "object") ? r : acc;
      }, values);
      return applyLayoutEditingHint(values, next);
    };
  }

  function registerWidget(component, widgetDef, Helpers) {
    const spec = component.create(widgetDef.def, Helpers) || {};

    const defaultClass = "dyniplugin";
    const wantsHide = !!spec.wantsHideNativeHead;
    const mergedClassName = Array.from(new Set([
      defaultClass,
      "dyni-host-html",
      widgetDef.def.className,
      spec.className,
      wantsHide ? "dyni-hide-native-head" : null
    ].filter(Boolean))).join(" ");

    const storeKeys = spec.storeKeys || widgetDef.def.storeKeys ||
      (widgetDef.def.storeKey ? { value: widgetDef.def.storeKey } : undefined);

    const renderHtml = typeof spec.renderHtml === "function" ? spec.renderHtml : undefined;
    const initFunction = typeof spec.initFunction === "function" ? spec.initFunction : undefined;
    const finalizeFunction = typeof spec.finalizeFunction === "function" ? spec.finalizeFunction : undefined;
    const translateFunction = typeof spec.translateFunction === "function" ? spec.translateFunction : undefined;

    const updateFunction = composeUpdates(spec.updateFunction, widgetDef.def.updateFunction);

    function attachHostActions(ctx) {
      ctx.hostActions = Helpers.getHostActions();
    }

    function wrapWidgetContext(fn) {
      if (!fn) {
        return undefined;
      }
      return function () {
        attachHostActions(this);
        return fn.apply(this, arguments);
      };
    }

    const defaultsFn = runtime.defaultsFromEditableParams;
    const perInstrumentDefaults = typeof defaultsFn === "function"
      ? defaultsFn(widgetDef.def.editableParameters)
      : {};
    const editableFn = runtime.editableParamsForRegistration;

    const baseDef = {
      name: widgetDef.def.name,
      description: hasOwn.call(widgetDef.def, "description") ? widgetDef.def.description : widgetDef.def.name,
      caption: hasOwn.call(widgetDef.def, "caption") ? widgetDef.def.caption : "",
      unit: hasOwn.call(widgetDef.def, "unit") ? widgetDef.def.unit : "",
      default: widgetDef.def.default,
      storeKeys: storeKeys,
      className: mergedClassName,

      cluster: widgetDef.def.cluster,
      ...perInstrumentDefaults,

      renderHtml: wrapWidgetContext(renderHtml),
      initFunction: wrapWidgetContext(initFunction),
      finalizeFunction: wrapWidgetContext(finalizeFunction),
      translateFunction: translateFunction,
      updateFunction: updateFunction
    };

    const editable = typeof editableFn === "function"
      ? editableFn(widgetDef.def.editableParameters)
      : (widgetDef.def.editableParameters || {});
    root.avnav.api.registerWidget(baseDef, editable);
  }

  runtime.registerWidget = registerWidget;
}(this));
