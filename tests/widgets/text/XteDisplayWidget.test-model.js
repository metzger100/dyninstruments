/** @param {Record<string, any>} [overrides] @returns {any} */
function makeProps(overrides) {
  const opts = overrides || {};
  const base = {
    display: {
      xte: 0.25,
      cog: 93,
      dtw: 0.72,
      btw: 92,
      wpName: "Fairway Buoy",
      disconnect: false
    },
    captions: {
      xte: "XTE",
      track: "COG",
      dtw: "DST",
      brg: "BRG"
    },
    units: {
      xte: "nm",
      track: "°",
      dtw: "nm",
      brg: "°"
    },
    formatUnits: {
      xte: "nm",
      dtw: "nm"
    },
    xteScale: 1,
    layout: {
      leadingZero: true,
      showWpName: true,
      hideTextualMetrics: false,
      easing: true,
      xteRatioThresholdNormal: 0.85,
      xteRatioThresholdFlat: 2.3
    },
    stableDigits: false
  };
  const out = /** @type {any} */ (Object.assign({}, base, opts));
  out.display = Object.assign({}, base.display, opts.display || {});
  out.captions = Object.assign({}, base.captions, opts.captions || {});
  out.units = Object.assign({}, base.units, opts.units || {});
  out.formatUnits = Object.assign({}, base.formatUnits, opts.formatUnits || {});
  out.layout = Object.assign({}, base.layout, opts.layout || {});
  if (Object.prototype.hasOwnProperty.call(opts, "xte")) out.display.xte = opts.xte;
  if (Object.prototype.hasOwnProperty.call(opts, "cog")) out.display.cog = opts.cog;
  if (Object.prototype.hasOwnProperty.call(opts, "dtw")) out.display.dtw = opts.dtw;
  if (Object.prototype.hasOwnProperty.call(opts, "btw")) out.display.btw = opts.btw;
  if (Object.prototype.hasOwnProperty.call(opts, "wpName")) out.display.wpName = opts.wpName;
  if (Object.prototype.hasOwnProperty.call(opts, "disconnect")) out.display.disconnect = opts.disconnect;
  if (Object.prototype.hasOwnProperty.call(opts, "leadingZero")) out.layout.leadingZero = opts.leadingZero;
  if (Object.prototype.hasOwnProperty.call(opts, "showWpName")) out.layout.showWpName = opts.showWpName;
  if (Object.prototype.hasOwnProperty.call(opts, "hideTextualMetrics"))
    out.layout.hideTextualMetrics = opts.hideTextualMetrics;
  if (Object.prototype.hasOwnProperty.call(opts, "easing")) out.layout.easing = opts.easing;
  if (Object.prototype.hasOwnProperty.call(opts, "xteRatioThresholdNormal"))
    out.layout.xteRatioThresholdNormal = opts.xteRatioThresholdNormal;
  if (Object.prototype.hasOwnProperty.call(opts, "xteRatioThresholdFlat"))
    out.layout.xteRatioThresholdFlat = opts.xteRatioThresholdFlat;
  return out;
}

/** @param {any} ctx @returns {string[]} */
function fillTextValues(ctx) {
  return ctx.calls
    .filter((/** @type {any} */ entry) => entry.name === "fillText")
    .map((/** @type {any} */ entry) => String(entry.args[0]));
}

module.exports = {
  makeProps,
  fillTextValues
};
