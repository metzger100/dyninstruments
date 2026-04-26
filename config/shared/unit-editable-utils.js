/**
 * Module: DyniPlugin Unit Editable Utils - Shared generators for formatter-token and unit-label editables
 * Documentation: documentation/architecture/component-system.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js, shared/unit-format-families.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const makeKindCondition = shared.makeKindCondition;
  const kindMaps = shared.kindMaps;
  const catalog = shared.unitFormatFamilies;

  if (!kindMaps || typeof kindMaps !== "object") {
    throw new Error("dyninstruments: kind-defaults.js must load before config/shared/unit-editable-utils.js");
  }

  if (!catalog || typeof catalog !== "object" || !catalog.families || !catalog.metricBindings) {
    throw new Error("dyninstruments: shared/unit-format-families.js must load before config/shared/unit-editable-utils.js");
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function toConditionList(condition) {
    if (!condition) {
      return [];
    }
    return Array.isArray(condition) ? condition : [condition];
  }

  function mergeConditions(baseCondition, extraCondition) {
    const baseList = toConditionList(baseCondition);
    const extraList = toConditionList(extraCondition);

    if (!baseList.length && !extraList.length) {
      return undefined;
    }
    if (!baseList.length) {
      return extraList.length === 1 ? extraList[0] : extraList.slice();
    }
    if (!extraList.length) {
      return baseList.length === 1 ? baseList[0] : baseList.slice();
    }

    const merged = [];
    baseList.forEach(function (base) {
      extraList.forEach(function (extra) {
        merged.push(Object.assign({}, base, extra));
      });
    });
    return merged.length === 1 ? merged[0] : merged;
  }

  function resolveKindCondition(kindDef, fallbackKind) {
    if (kindDef && Object.prototype.hasOwnProperty.call(kindDef, "kind")) {
      return makeKindCondition(kindDef.kind, fallbackKind);
    }
    return makeKindCondition(undefined, fallbackKind);
  }

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

  function getBinding(metricKey, bindings) {
    const source = bindings && typeof bindings === "object" ? bindings : catalog.metricBindings;
    const binding = source[metricKey] || catalog.metricBindings[metricKey];
    if (!binding) {
      throw new Error("dyninstruments: missing unit binding for metric '" + metricKey + "'");
    }
    return binding;
  }

  function makePerKindCaptionParams(kindMap) {
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

  function makePerUnitStringParams(metricKey, binding, kindDef) {
    const family = getFamily(binding, metricKey);
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

  function makeUnitAwareTextParams(kindMap, bindings) {
    const out = {};
    Object.keys(kindMap || {}).forEach(function (metricKey) {
      const def = kindMap[metricKey] || {};
      const binding = getBinding(metricKey, bindings);
      Object.assign(out, makeFormatUnitSelectParam(metricKey, binding, def));
      Object.assign(out, makePerUnitStringParams(metricKey, binding, def));
    });
    return out;
  }

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

  function makePerUnitFloatParams(metricKey, binding, kindDef, fieldSpec) {
    const family = getFamily(binding, metricKey);
    const specDef = fieldSpec || {};
    const baseKey = toText(specDef.baseKey || specDef.key);
    if (!baseKey) {
      throw new Error("dyninstruments: makePerUnitFloatParams requires fieldSpec.baseKey for metric '" + metricKey + "'");
    }

    const baseDisplayName = toText(specDef.displayName || specDef.name || baseKey);
    const out = {};

    family.tokens.forEach(function (token) {
      const tokenSpec = resolveFloatTokenSpec(specDef, token);
      const label = family.labels[token];
      const field = {
        type: "FLOAT",
        min: tokenSpec.min,
        max: tokenSpec.max,
        step: tokenSpec.step,
        default: tokenSpec.default,
        displayName: baseDisplayName + " (" + label + ")",
        condition: mergeConditions(resolveKindCondition(kindDef, metricKey), mergeConditions(specDef.condition, {
          ["formatUnit_" + metricKey]: token
        }))
      };

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
