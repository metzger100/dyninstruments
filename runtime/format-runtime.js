/**
 * Module: DyniPlugin Format Runtime - Runtime formatter dispatch service
 * Documentation: documentation/shared/helpers.md
 * Depends: runtime.getAvnavApi().formatter
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;

  function applyFormatter(raw, props) {
    const p = props || {};
    if (raw == null || Number.isNaN(raw)) {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      // dyni-lint-disable-next-line hardcoded-runtime-default -- runtime.format.applyFormatter is the documented runtime owner of the generic missing-value placeholder.
      return "---";
    }
    if (typeof raw === "string" && raw.trim() === "") {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      // dyni-lint-disable-next-line hardcoded-runtime-default -- runtime.format.applyFormatter is the documented runtime owner of the generic missing-value placeholder.
      return "---";
    }

    const fpRaw = p.formatterParameters;
    const fp = Array.isArray(fpRaw) ? fpRaw
      : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
    const avnavApi = runtime.getAvnavApi(root);
    try {
      if (typeof p.formatter === "function") {
        return p.formatter.apply(null, [raw].concat(fp));
      }
      if (
        typeof p.formatter === "string" &&
        avnavApi &&
        avnavApi.formatter &&
        typeof avnavApi.formatter[p.formatter] === "function"
      ) {
        return avnavApi.formatter[p.formatter].apply(avnavApi.formatter, [raw].concat(fp));
      }
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Formatter dispatch is an external AvNav/custom boundary; documented fallback behavior must remain centralized here.
    catch (e) { /* intentional: formatter failures fall back to default/raw formatting */ }

    return String(raw);
  }

  runtime.format = Object.freeze({
    applyFormatter: applyFormatter
  });
}(this));
