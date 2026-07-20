/**
 * @file DyniPlugin Format Runtime - Runtime formatter dispatch service
 * Documentation: documentation/shared/helpers.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace & { getAvnavApi(rootRef: unknown): unknown }} */ (ns.runtime);
  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * @param {unknown} raw
   * @param {DyniFormatterOptions|null|undefined} props
   * @returns {unknown}
   */
  function applyFormatter(raw, props) {
    const p = /** @type {DyniFormatterOptions} */ (props || {});
    if (raw == null || Number.isNaN(raw)) {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      return "---";
    }
    if (typeof raw === "string" && raw.trim() === "") {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      return "---";
    }

    const fpRaw = p.formatterParameters;
    /** @type {unknown[]} */
    let fp;
    if (Array.isArray(fpRaw)) {
      fp = fpRaw;
    } else if (typeof fpRaw === "string") {
      fp = fpRaw.split(",");
    } else {
      fp = [];
    }
    const formatterArgs = /** @type {[unknown, ...unknown[]]} */ ([raw].concat(fp));
    const avnavApi = /** @type {DyniAvnavApi|null} */ (runtime.getAvnavApi(root));
    try {
      if (typeof p.formatter === "function") {
        const formatter = /** @type {DyniFormatterCallback} */ (p.formatter);
        return formatter.apply(null, formatterArgs);
      }
      if (typeof p.formatter === "string" && avnavApi && avnavApi.formatter) {
        const formatter = avnavApi.formatter[p.formatter];
        if (typeof formatter === "function") {
          return formatter.apply(avnavApi.formatter, formatterArgs);
        }
      }
      // dyni-boundary-next-line(category: avnav-host-boundary, owner: Metzger100, date: 2026-07-17) -- Formatter dispatch is an external AvNav/custom boundary; documented fallback behavior must remain centralized here.
    } catch (e) {
      /* intentional: formatter failures fall back to default/raw formatting */
    }

    return String(raw);
  }

  runtime.format = Object.freeze({
    applyFormatter: applyFormatter
  });
})(this);
