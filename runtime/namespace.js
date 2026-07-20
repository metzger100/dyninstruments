/**
 * @file DyniPlugin Namespace - Internal namespace container
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = (root.DyniPlugin = root.DyniPlugin || {});
  const runtime = (ns.runtime = ns.runtime || {});
  ns.state = ns.state || {};
  ns.config = ns.config || {};
  ns.config.shared = ns.config.shared || {};
  ns.config.clusters = ns.config.clusters || [];

  /** @param {unknown} rootRef @returns {unknown} */
  runtime.getAvnavApi =
    runtime.getAvnavApi ||
    function (rootRef) {
      if (ns.avnavApi) {
        return ns.avnavApi;
      }
      return null;
    };
})(this);
