/**
 * @file DyniPlugin Widget Registrar - Widget definition composition and registration
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace & { getAvnavApi(rootRef: unknown): unknown }} */ (ns.runtime);
  const hasOwn = Object.prototype.hasOwnProperty;
  const LAYOUT_EDITING_HINT_KEY = "dyniLayoutEditing";

  /**
   * @param {unknown} sourceValues
   * @param {unknown} candidate
   * @returns {unknown}
   */
  function applyLayoutEditingHint(sourceValues, candidate) {
    if (!sourceValues || typeof sourceValues !== "object") {
      return candidate;
    }
    if (!hasOwn.call(sourceValues, "editing")) {
      return candidate;
    }
    const source = /** @type {DyniWidgetValues} */ (sourceValues);
    const out = /** @type {DyniWidgetValues} */ (
      (candidate && typeof candidate === "object") ? candidate : {}
    );
    out[LAYOUT_EDITING_HINT_KEY] = source.editing === true;
    return out;
  }

  /**
   * @param {...unknown} updates
   * @returns {DyniWidgetUpdate|undefined}
   */
  function composeUpdates(...updates) {
    const fns = /** @type {DyniWidgetUpdate[]} */ (updates.filter(function (fn) {
      return typeof fn === "function";
    }));

    if (!fns.length) {
      return undefined;
    }

    return /** @type {DyniWidgetUpdate} */ (function (values) {
      const ctx = this;
      const next = fns.reduce(function (acc, fn) {
        const r = fn.call(ctx, acc);
        return (r && typeof r === "object") ? /** @type {DyniWidgetValues} */ (r) : acc;
      }, values);
      return applyLayoutEditingHint(values, next);
    });
  }

  /**
   * @param {DyniWidgetComponentSpec} componentSpec
   * @param {DyniWidgetDefinition} widgetDef
   */
  function registerWidget(componentSpec, widgetDef) {
    const spec = componentSpec || {};

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

    /** @param {DyniWidgetValues} ctx */
    function attachHostActions(ctx) {
      // Snapshot the current host action facade for this wrapped lifecycle call.
      ctx.hostActions = typeof runtime.hostActions === "function" ? runtime.hostActions() : null;
    }

    /** @param {unknown} fn @returns {DyniWidgetLifecycle|undefined} */
    function wrapWidgetContext(fn) {
      if (!fn) {
        return undefined;
      }
      const lifecycle = /** @type {DyniWidgetLifecycle} */ (fn);
      /**
       * @this {DyniWidgetValues}
       * @param {...unknown} args
       * @returns {unknown}
       */
      return function (...args) {
        attachHostActions(this);
        return lifecycle.apply(this, args);
      };
    }

    const defaultsFn = runtime.defaultsFromEditableParams;
    const perInstrumentDefaults = typeof defaultsFn === "function"
      ? defaultsFn(widgetDef.def.editableParameters)
      : {};
    const editableFn = runtime.editableParamsForRegistration;

    const baseDef = /** @type {Record<string, unknown>} */ ({
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
    });

    const editable = typeof editableFn === "function"
      ? editableFn(widgetDef.def.editableParameters)
      : (widgetDef.def.editableParameters || {});
    const avnavApi = /** @type {DyniAvnavApi & { registerWidget(definition: Record<string, unknown>, editable: Record<string, unknown>): void }} */ (runtime.getAvnavApi(root));
    avnavApi.registerWidget(baseDef, editable);
  }

  runtime.registerWidget = registerWidget;
}(this));
