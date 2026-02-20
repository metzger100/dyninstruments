/**
 * Module: DyniPlugin Helpers - Shared helper functions for modules
 * Documentation: documentation/shared/helpers.md
 * Depends: avnav.api.formatter, window.DyniComponents
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function applyFormatter(raw, props) {
    const fpRaw = props && props.formatterParameters;
    const fp = Array.isArray(fpRaw) ? fpRaw
      : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
    try {
      if (props && typeof props.formatter === "function") {
        return props.formatter.apply(null, [raw].concat(fp));
      }
      if (
        props &&
        typeof props.formatter === "string" &&
        root.avnav &&
        root.avnav.api &&
        root.avnav.api.formatter &&
        typeof root.avnav.api.formatter[props.formatter] === "function"
      ) {
        return root.avnav.api.formatter[props.formatter].apply(root.avnav.api.formatter, [raw].concat(fp));
      }
    }
    catch (e) { /* intentional: formatter failures fall back to default/raw formatting */ }

    if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
    return String(raw);
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = root.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx: ctx,
      W: Math.max(1, Math.round(rect.width)),
      H: Math.max(1, Math.round(rect.height))
    };
  }

  function resolveTextColor(canvas) {
    const st = getComputedStyle(canvas);
    const vars = ["--dyni-fg", "--instrument-fg", "--mainfg"];
    for (const v of vars) {
      const val = st.getPropertyValue(v).trim();
      if (val) return val;
    }
    return st.color || "#000";
  }

  function resolveFontFamily(el) {
    const st = getComputedStyle(el);
    const varVal = st.getPropertyValue("--dyni-font");
    if (varVal && varVal.trim()) return varVal.trim();
    return '"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';
  }

  function createHelpers(getModule) {
    return {
      applyFormatter: applyFormatter,
      setupCanvas: setupCanvas,
      resolveTextColor: resolveTextColor,
      resolveFontFamily: resolveFontFamily,
      getModule: getModule
    };
  }

  runtime.applyFormatter = applyFormatter;
  runtime.setupCanvas = setupCanvas;
  runtime.resolveTextColor = resolveTextColor;
  runtime.resolveFontFamily = resolveFontFamily;
  runtime.createHelpers = createHelpers;
}(this));
