/**
 * @file DyniPlugin Unit Editable Utils - Shared generators for formatter-token and unit-label editables
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  /** @typedef {{ min: number, max: number, step: number, default: number, internal?: boolean }} DyniUnitFloatTokenSpec */
  /** @typedef {{ baseKey?: unknown, key?: unknown, displayName?: unknown, name?: unknown, condition?: unknown, internal?: boolean, tokens?: Record<string, DyniUnitFloatTokenSpec>, perToken?: Record<string, DyniUnitFloatTokenSpec> }} DyniUnitFloatFieldSpec */
  /** @typedef {{ kind: unknown }} DyniUnitConditionItem */
  /** @typedef {DyniPluginSharedConfig & { kindMaps: Record<string, DyniPerKindTextParameterMap>, unitFormatFamilies: DyniUnitFormatCatalog, makeKindCondition: (kind: unknown, fallbackKind: string) => DyniEditableCondition, makeFormatUnitSelectParam: (metricKey: string, binding: DyniUnitFormatBinding, kindDef?: DyniPerKindTextParameterDescriptor) => DyniEditableParameters, makePerUnitStringParams: (metricKey: string, binding: DyniUnitFormatBinding, kindDef?: DyniPerKindTextParameterDescriptor) => DyniEditableParameters, makePerUnitFloatParams: (metricKey: string, binding: DyniUnitFormatBinding, kindDef: DyniPerKindTextParameterDescriptor | undefined, fieldSpec: DyniUnitFloatFieldSpec) => DyniEditableParameters }} DyniUnitEditableShared */

  const ns = /** @type {DyniPluginNamespace} */ (/** @type {unknown} */ (root.DyniPlugin));
  const config = ns.config;
  const shared = /** @type {DyniUnitEditableShared} */ (config.shared = config.shared || {});
  const makeKindCondition = shared.makeKindCondition;
  const kindMaps = shared.kindMaps;
  const catalog = shared.unitFormatFamilies;
  const valueMathModule = /** @type {{ create?: () => DyniValueMathApi } | undefined} */ (root.DyniComponents && root.DyniComponents.DyniValueMath);
  if (!valueMathModule || typeof valueMathModule.create !== "function") {
    throw new Error("dyninstruments: shared/widget-kits/value/ValueMath.js must load before config/shared/unit-editable-utils.js");
  }
  const valueMath = valueMathModule.create();
  if (!valueMath || typeof valueMath.toText !== "function") {
    throw new Error("dyninstruments: ValueMath.toText must exist before config/shared/unit-editable-utils.js");
  }
  const toText = valueMath.toText;

  if (!kindMaps || typeof kindMaps !== "object") {
    throw new Error("dyninstruments: kind-defaults.js must load before config/shared/unit-editable-utils.js");
  }

  if (!catalog || typeof catalog !== "object" || !catalog.families || !catalog.metricBindings) {
    throw new Error("dyninstruments: shared/unit-format-families.js must load before config/shared/unit-editable-utils.js");
  }

  /** @param {unknown} condition @returns {DyniUnitConditionItem[]} */
  function toConditionList(condition) {
    if (!condition) {
      return [];
    }
    return Array.isArray(condition) ? /** @type {DyniUnitConditionItem[]} */ (condition) : [/** @type {DyniUnitConditionItem} */ (condition)];
  }

  /** @param {unknown} baseCondition @param {unknown} extraCondition @returns {DyniEditableCondition | undefined} */
  function mergeConditions(baseCondition, extraCondition) {
    const baseList = toConditionList(baseCondition);
    const extraList = toConditionList(extraCondition);

    if (!baseList.length && !extraList.length) {
      return undefined;
    }
    if (!baseList.length) {
      return extraList.length === 1 ? /** @type {DyniEditableCondition} */ (extraList[0]) : extraList.slice();
    }
    if (!extraList.length) {
      return baseList.length === 1 ? /** @type {DyniEditableCondition} */ (baseList[0]) : baseList.slice();
    }

    /** @type {DyniUnitConditionItem[]} */
    const merged = [];
    baseList.forEach(function (base) {
      extraList.forEach(function (extra) {
        merged.push(Object.assign({}, base, extra));
      });
    });
    return merged.length === 1 ? /** @type {DyniEditableCondition} */ (merged[0]) : merged;
  }

  /** @param {DyniPerKindTextParameterDescriptor | undefined} kindDef @param {string} fallbackKind @returns {DyniEditableCondition} */
  function resolveKindCondition(kindDef, fallbackKind) {
    if (kindDef && Object.prototype.hasOwnProperty.call(kindDef, "kind")) {
      return makeKindCondition(kindDef.kind, fallbackKind);
    }
    return makeKindCondition(undefined, fallbackKind);
  }

  /** @param {DyniUnitFormatBinding} binding @param {string} metricKey @returns {DyniUnitFormatFamily} */
  function getFamily(binding, metricKey) {
    const familyId = binding && binding.family;
    const family = catalog.families[familyId];
    if (!family) {
      throw new Error("dyninstruments: missing unit family '" + familyId + "' for metric '" + metricKey + "'");
    }
    const defaultToken = binding.defaultToken;
    if (family.tokens.indexOf(defaultToken) === -1) {
      throw new Error("dyninstruments: invalid default token '" + defaultToken + "' for metric '" + metricKey + "'");
    }
    return family;
  }

  /** @param {string} metricKey @param {Readonly<Record<string, DyniUnitFormatBinding>> | undefined} bindings @returns {DyniUnitFormatBinding} */
  function getBinding(metricKey, bindings) {
    const source = bindings && typeof bindings === "object" ? bindings : catalog.metricBindings;
    const binding = source[metricKey] || catalog.metricBindings[metricKey];
    if (!binding) {
      throw new Error("dyninstruments: missing unit binding for metric '" + metricKey + "'");
    }
    return binding;
  }

  /** @param {DyniPerKindTextParameterMap} kindMap @returns {DyniEditableParameters} */
  function makePerKindCaptionParams(kindMap) {
    /** @type {DyniEditableParameters} */
    const out = {};
    Object.keys(kindMap || {}).forEach(function (metricKey) {
      const def = kindMap[metricKey] || {};
      out["caption_" + metricKey] = {
        type: "STRING",
        displayName: toText(def.captionName) || "Caption",
        default: typeof def.cap === "string" ? def.cap : "",
        condition: resolveKindCondition(def, metricKey)
      };
    });
    return out;
  }

  /** @param {string} metricKey @param {DyniUnitFormatBinding} binding @param {DyniPerKindTextParameterDescriptor | undefined} kindDef @returns {DyniEditableParameters} */
  function makeFormatUnitSelectParam(metricKey, binding, kindDef) {
    const family = getFamily(binding, metricKey);
    return {
      ["formatUnit_" + metricKey]: {
        type: "SELECT",
        list: family.selectorList,
        default: binding.defaultToken,
        displayName: "Formatter unit",
        condition: resolveKindCondition(kindDef, metricKey)
      }
    };
  }

  /** @param {string} metricKey @param {DyniUnitFormatBinding} binding @param {DyniPerKindTextParameterDescriptor | undefined} kindDef @returns {DyniEditableParameters} */
  function makePerUnitStringParams(metricKey, binding, kindDef) {
    const family = getFamily(binding, metricKey);
    /** @type {DyniEditableParameters} */
    const out = {};
    family.tokens.forEach(function (token) {
      const label = family.labels[token];
      out["unit_" + metricKey + "_" + token] = {
        type: "STRING",
        displayName: label + " unit",
        default: label,
        condition: mergeConditions(resolveKindCondition(kindDef, metricKey), {
          ["formatUnit_" + metricKey]: token
        })
      };
    });
    return out;
  }

  /** @param {DyniPerKindTextParameterMap} kindMap @param {Readonly<Record<string, DyniUnitFormatBinding>>} bindings @returns {DyniEditableParameters} */
  function makeUnitAwareTextParams(kindMap, bindings) {
    /** @type {DyniEditableParameters} */
    const out = {};
    Object.keys(kindMap || {}).forEach(function (metricKey) {
      const def = kindMap[metricKey] || {};
      const binding = getBinding(metricKey, bindings);
      Object.assign(out, makeFormatUnitSelectParam(metricKey, binding, def));
      Object.assign(out, makePerUnitStringParams(metricKey, binding, def));
    });
    return out;
  }

  /** @param {DyniUnitFloatFieldSpec | undefined} fieldSpec @param {string} token @returns {DyniUnitFloatTokenSpec} */
  function resolveFloatTokenSpec(fieldSpec, token) {
    const specDef = fieldSpec || {};
    const tokenSpecs = specDef.tokens || specDef.perToken || {};
    const spec = tokenSpecs[token];
    if (!spec || typeof spec !== "object") {
      const baseKey = toText(specDef.baseKey || specDef.key);
      throw new Error("dyninstruments: missing per-token float spec for '" + baseKey + "' token '" + token + "'");
    }
    return spec;
  }

  /** @param {string} metricKey @param {DyniUnitFormatBinding} binding @param {DyniPerKindTextParameterDescriptor | undefined} kindDef @param {DyniUnitFloatFieldSpec} fieldSpec @returns {DyniEditableParameters} */
  function makePerUnitFloatParams(metricKey, binding, kindDef, fieldSpec) {
    const family = getFamily(binding, metricKey);
    const specDef = fieldSpec || {};
    const baseKey = toText(specDef.baseKey || specDef.key);
    if (!baseKey) {
      throw new Error("dyninstruments: makePerUnitFloatParams requires fieldSpec.baseKey for metric '" + metricKey + "'");
    }

    const baseDisplayName = toText(specDef.displayName || specDef.name || baseKey);
    /** @type {DyniEditableParameters} */
    const out = {};

    family.tokens.forEach(function (token) {
      const tokenSpec = resolveFloatTokenSpec(specDef, token);
      const label = family.labels[token];
      const field = /** @type {DyniEditableParameterSpec} */ ({
        type: "FLOAT",
        min: tokenSpec.min,
        max: tokenSpec.max,
        step: tokenSpec.step,
        default: tokenSpec.default,
        displayName: baseDisplayName + " (" + label + ")",
        condition: mergeConditions(resolveKindCondition(kindDef, metricKey), mergeConditions(specDef.condition, {
          ["formatUnit_" + metricKey]: token
        }))
      });

      if (specDef.internal === true || tokenSpec.internal === true) {
        field.internal = true;
      }

      out[baseKey + "_" + token] = field;
    });

    return out;
  }

  shared.makePerKindCaptionParams = makePerKindCaptionParams;
  shared.makeUnitAwareTextParams = makeUnitAwareTextParams;
  shared.makeFormatUnitSelectParam = makeFormatUnitSelectParam;
  shared.makePerUnitStringParams = makePerUnitStringParams;
  shared.makePerUnitFloatParams = makePerUnitFloatParams;
}(this));
