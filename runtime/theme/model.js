/**
 * @file DyniPlugin Theme Model Runtime - Canonical semantic owner for theme token/preset metadata
 * Documentation: documentation/shared/theme-tokens.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown>} DyniThemeValues */
  /** @typedef {{ path: string, inputVar: string, type: string, default?: unknown, defaultByMode?: Record<string, unknown>, outputVar?: string, defaultFrom?: string, compatibilityInputVar?: string, [key: string]: unknown }} DyniThemeTokenDefinition */
  /** @typedef {{ base?: DyniThemeValues, day?: DyniThemeValues, night?: DyniThemeValues, [mode: string]: DyniThemeValues | undefined }} DyniThemePreset */
  /** @typedef {{ TOKEN_DEFS: readonly DyniThemeTokenDefinition[], PRESETS: Readonly<Record<string, DyniThemePreset>> }} DyniThemeTokenCatalog */
  /** @typedef {{ DEFAULT_PRESET_NAME: string, PRESETS: Readonly<Record<string, DyniThemePreset>>, BASE_DEFAULTS: DyniThemeValues, MODE_DEFAULTS: Readonly<Record<string, DyniThemeValues>>, normalizePresetName(presetName: unknown): string, getSupportedPresetNames(): string[], getSupportedModes(): string[], getPresetDefinition(presetName: unknown): DyniThemePreset, getPresetBase(presetName: unknown): DyniThemeValues, getPresetMode(presetName: unknown, mode: unknown): DyniThemeValues, getTokenDefinition(path: string): DyniThemeTokenDefinition | null, getTokenDefinitions(): DyniThemeTokenDefinition[], getOutputTokenDefinitions(): DyniThemeTokenDefinition[], getMergeOrder(): string[] }} DyniThemeModel */
  /** @typedef {DyniRuntimeNamespace & { createThemeModel?: () => DyniThemeModel, createThemeTokenCatalog: () => DyniThemeTokenCatalog }} DyniThemeModelRuntime */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { runtime: DyniThemeModelRuntime } }} DyniThemeModelRoot */

  const ns = /** @type {DyniThemeModelRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const runtime = ns.runtime;

  const DEFAULT_PRESET_NAME = "default";
  const SUPPORTED_MODES = ["day", "night"];

  const MERGE_ORDER = Object.freeze([
    "rootInputOverride",
    "presetModeOverride",
    "presetBaseOverride",
    "globalModeDefault",
    "globalBaseDefault",
    "parentCascade"
  ]);

  const tokenCatalog = runtime.createThemeTokenCatalog();
  const TOKEN_DEFS = tokenCatalog.TOKEN_DEFS;
  const PRESETS = tokenCatalog.PRESETS;

  /** @param {DyniThemeValues} target @param {string[]} pathSegments @param {unknown} value */
  function setByPath(target, pathSegments, value) {
    /** @type {DyniThemeValues} */
    let cursor = target;
    for (let i = 0; i < pathSegments.length - 1; i += 1) {
      const segment = pathSegments[i];
      if (!cursor[segment] || typeof cursor[segment] !== "object") {
        cursor[segment] = {};
      }
      cursor = /** @type {DyniThemeValues} */ (cursor[segment]);
    }
    cursor[pathSegments[pathSegments.length - 1]] = value;
  }

  /** @returns {DyniThemeValues} */
  function buildBaseDefaults() {
    /** @type {DyniThemeValues} */
    const out = {};
    TOKEN_DEFS.forEach(function (def) {
      if (typeof def.default === "undefined") {
        return;
      }
      setByPath(out, def.path.split("."), def.default);
    });
    return out;
  }

  /** @param {string} mode @returns {DyniThemeValues} */
  function buildModeDefaults(mode) {
    /** @type {DyniThemeValues} */
    const out = {};
    TOKEN_DEFS.forEach(function (def) {
      if (!def.defaultByMode || typeof def.defaultByMode[mode] === "undefined") {
        return;
      }
      setByPath(out, def.path.split("."), def.defaultByMode[mode]);
    });
    return out;
  }

  const BASE_DEFAULTS = Object.freeze(buildBaseDefaults());
  const MODE_DEFAULTS = Object.freeze({
    day: Object.freeze(buildModeDefaults("day")),
    night: Object.freeze(buildModeDefaults("night"))
  });

  /** @type {Record<string, DyniThemeTokenDefinition>} */
  const TOKEN_DEF_BY_PATH = {};
  TOKEN_DEFS.forEach(function (def) {
    TOKEN_DEF_BY_PATH[def.path] = def;
  });

  const OUTPUT_TOKEN_DEFS = TOKEN_DEFS.filter(function (def) {
    return typeof def.outputVar === "string" && def.outputVar.length > 0;
  });

  /** @param {unknown} presetName @returns {string} */
  function normalizePresetName(presetName) {
    if (typeof presetName !== "string") {
      return DEFAULT_PRESET_NAME;
    }
    const normalized = presetName.trim().toLowerCase();
    if (!normalized || normalized === "night") {
      return DEFAULT_PRESET_NAME;
    }
    return Object.prototype.hasOwnProperty.call(PRESETS, normalized) ? normalized : DEFAULT_PRESET_NAME;
  }

  /** @param {unknown} presetName @returns {DyniThemePreset} */
  function getPresetDefinition(presetName) {
    return PRESETS[normalizePresetName(presetName)];
  }

  /** @param {unknown} presetName @returns {DyniThemeValues} */
  function getPresetBase(presetName) {
    const preset = getPresetDefinition(presetName);
    return preset && preset.base ? preset.base : {};
  }

  /** @param {unknown} presetName @param {unknown} mode @returns {DyniThemeValues} */
  function getPresetMode(presetName, mode) {
    const preset = getPresetDefinition(presetName);
    if (!preset || typeof mode !== "string") {
      return {};
    }
    return preset[mode] && typeof preset[mode] === "object" ? preset[mode] : {};
  }

  /** @param {string} path @returns {DyniThemeTokenDefinition | null} */
  function getTokenDefinition(path) {
    return Object.prototype.hasOwnProperty.call(TOKEN_DEF_BY_PATH, path) ? TOKEN_DEF_BY_PATH[path] : null;
  }

  /** @returns {DyniThemeTokenDefinition[]} */
  function getTokenDefinitions() {
    return TOKEN_DEFS.slice();
  }

  /** @returns {DyniThemeTokenDefinition[]} */
  function getOutputTokenDefinitions() {
    return OUTPUT_TOKEN_DEFS.slice();
  }

  /** @returns {string[]} */
  function getMergeOrder() {
    return MERGE_ORDER.slice();
  }

  runtime.createThemeModel = function createThemeModel() {
    return {
      DEFAULT_PRESET_NAME: DEFAULT_PRESET_NAME,
      PRESETS: PRESETS,
      BASE_DEFAULTS: BASE_DEFAULTS,
      MODE_DEFAULTS: MODE_DEFAULTS,
      normalizePresetName: normalizePresetName,
      getSupportedPresetNames: function () {
        return Object.keys(PRESETS);
      },
      getSupportedModes: function () {
        return SUPPORTED_MODES.slice();
      },
      getPresetDefinition: getPresetDefinition,
      getPresetBase: getPresetBase,
      getPresetMode: getPresetMode,
      getTokenDefinition: getTokenDefinition,
      getTokenDefinitions: getTokenDefinitions,
      getOutputTokenDefinitions: getOutputTokenDefinitions,
      getMergeOrder: getMergeOrder
    };
  };
})(this);
