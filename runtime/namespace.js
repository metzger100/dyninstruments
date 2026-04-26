/**
 * Module: DyniPlugin Namespace - Internal namespace container
 * Documentation: documentation/architecture/component-system.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin = root.DyniPlugin || {};
  const runtime = ns.runtime = ns.runtime || {};
  ns.state = ns.state || {};
  ns.config = ns.config || {};
  ns.config.shared = ns.config.shared || {};
  ns.config.clusters = ns.config.clusters || [];

  runtime.getAvnavApi = runtime.getAvnavApi || function (rootRef) {
    if (ns.avnavApi) {
      return ns.avnavApi;
    }
    const fallbackRoot = rootRef || root;
    if (fallbackRoot && fallbackRoot.avnav && fallbackRoot.avnav.api) {
      return fallbackRoot.avnav.api;
    }
    return null;
  };
}(this));
