const { loadFresh } = require("./load-umd");

function installUnitFormatFamilies(bindingOverrides) {
  const catalog = loadFresh("shared/unit-format-families.js");
  const overrides = bindingOverrides || {};
  const keys = Object.keys(overrides);

  if (keys.length === 0) {
    return catalog;
  }

  const metricBindings = Object.assign({}, catalog.metricBindings);
  keys.forEach(function (metricKey) {
    metricBindings[metricKey] = Object.assign({}, metricBindings[metricKey], overrides[metricKey]);
  });

  const root = globalThis;
  root.DyniPlugin = root.DyniPlugin || {};
  root.DyniPlugin.config = root.DyniPlugin.config || {};
  root.DyniPlugin.config.shared = root.DyniPlugin.config.shared || {};
  root.DyniPlugin.config.shared.unitFormatFamilies = {
    families: catalog.families,
    metricBindings: metricBindings
  };

  return root.DyniPlugin.config.shared.unitFormatFamilies;
}

module.exports = {
  installUnitFormatFamilies
};
