/**
 * Module: DyniPlugin Helpers - Shared helper functions for modules
 * Documentation: documentation/shared/helpers.md
 * Depends: avnav.api.formatter, window.DyniComponents
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;
  const TEXT_COLOR_VARS = ["--dyni-fg", "--instrument-fg", "--mainfg"];
  // dyni-lint-disable-next-line css-js-default-duplication -- Typography defaults are owned at the helper/CSS boundary and documented in shared/helpers.md.
  const DEFAULT_FONT_STACK = '"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';
  const layoutByCanvas = new WeakMap();
  const typographyByRoot = new WeakMap();

  function applyFormatter(raw, props) {
    const p = props || {};
    if (raw == null || Number.isNaN(raw)) {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      // dyni-lint-disable-next-line hardcoded-runtime-default -- Helpers.applyFormatter is the documented runtime owner of the generic missing-value placeholder.
      return "---";
    }

    const fpRaw = p.formatterParameters;
    const fp = Array.isArray(fpRaw) ? fpRaw
      : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
    try {
      if (typeof p.formatter === "function") {
        return p.formatter.apply(null, [raw].concat(fp));
      }
      if (
        typeof p.formatter === "string" &&
        root.avnav &&
        root.avnav.api &&
        root.avnav.api.formatter &&
        typeof root.avnav.api.formatter[p.formatter] === "function"
      ) {
        return root.avnav.api.formatter[p.formatter].apply(root.avnav.api.formatter, [raw].concat(fp));
      }
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Formatter dispatch is an external AvNav/custom boundary; documented fallback behavior must remain centralized here.
    catch (e) { /* intentional: formatter failures fall back to default/raw formatting */ }

    return String(raw);
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = root.devicePixelRatio || 1;

    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const cachedLayout = layoutByCanvas.get(canvas);
    const layout = cachedLayout &&
      cachedLayout.clientWidth === clientWidth &&
      cachedLayout.clientHeight === clientHeight
      ? cachedLayout
      : (function () {
        const rect = canvas.getBoundingClientRect();
        const nextLayout = {
          clientWidth: clientWidth,
          clientHeight: clientHeight,
          cssWidth: rect.width,
          cssHeight: rect.height
        };
        layoutByCanvas.set(canvas, nextLayout);
        return nextLayout;
      }());

    const w = Math.max(1, Math.round(layout.cssWidth * dpr));
    const h = Math.max(1, Math.round(layout.cssHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx: ctx,
      W: Math.max(1, Math.round(layout.cssWidth)),
      H: Math.max(1, Math.round(layout.cssHeight))
    };
  }

  function resolveWidgetRoot(target) {
    if (!target) {
      return null;
    }
    if (typeof target.closest === "function") {
      const found = target.closest(".widget, .DirectWidget");
      if (found) {
        return found;
      }
    }
    return target.parentElement || null;
  }

  function getNightModeState(rootEl) {
    const doc = rootEl && rootEl.ownerDocument;
    if (!doc) {
      return false;
    }

    const docRootEl = doc.documentElement;
    if (docRootEl && docRootEl.classList && docRootEl.classList.contains("nightMode")) {
      return true;
    }

    const body = doc.body;
    return !!(body && body.classList && body.classList.contains("nightMode"));
  }

  function resolveTypography(target) {
    const rootEl = resolveWidgetRoot(target) || target;
    const nightMode = getNightModeState(rootEl);
    const cached = typographyByRoot.get(rootEl);
    if (cached && cached.nightMode === nightMode) {
      return cached;
    }

    if (cached) {
      typographyByRoot.delete(rootEl);
    }

    const st = getComputedStyle(rootEl);

    let textColor = "";
    for (const cssVar of TEXT_COLOR_VARS) {
      const val = st.getPropertyValue(cssVar).trim();
      if (!val) {
        continue;
      }
      textColor = val;
      break;
    }
    if (!textColor) textColor = st.color || "#000"; /* dyni-lint-disable-line hardcoded-runtime-default -- Typography resolution owns the browser-level foreground fallback when dyni CSS vars are absent. */ /* dyni-lint-disable-line css-js-default-duplication -- Typography resolution is the CSS boundary for foreground color fallback; see documentation/shared/helpers.md. */

    // dyni-lint-disable-next-line css-js-default-duplication -- Typography resolution is the CSS boundary for the dyni font variable lookup.
    const fontVar = st.getPropertyValue("--dyni-font");
    // dyni-lint-disable-next-line css-js-default-duplication -- Typography resolution owns the documented default font stack when the CSS token is unset.
    const fontFamily = fontVar && fontVar.trim() ? fontVar.trim() : DEFAULT_FONT_STACK;

    const resolved = {
      nightMode: nightMode,
      textColor: textColor,
      fontFamily: fontFamily
    };
    typographyByRoot.set(rootEl, resolved);
    return resolved;
  }

  function resolveTextColor(canvas) {
    return resolveTypography(canvas).textColor;
  }

  function resolveFontFamily(canvas) {
    return resolveTypography(canvas).fontFamily;
  }

  function getHostActions() {
    return ns.state.hostActionBridge.getHostActions();
  }

  function createHelpers(getModule) {
    return {
      applyFormatter: applyFormatter,
      setupCanvas: setupCanvas,
      resolveTextColor: resolveTextColor,
      resolveFontFamily: resolveFontFamily,
      resolveWidgetRoot: resolveWidgetRoot,
      getHostActions: getHostActions,
      getModule: getModule
    };
  }

  runtime.applyFormatter = applyFormatter;
  runtime.setupCanvas = setupCanvas;
  runtime.resolveTextColor = resolveTextColor;
  runtime.resolveFontFamily = resolveFontFamily;
  runtime.resolveWidgetRoot = resolveWidgetRoot;
  runtime.getHostActions = getHostActions;
  runtime.createHelpers = createHelpers;
}(this));
