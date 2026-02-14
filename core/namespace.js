/**
 * Module: DyniPlugin Namespace - Internal namespace container
 * Documentation: documentation/architecture/module-system.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin = root.DyniPlugin || {};
  ns.core = ns.core || {};
  ns.config = ns.config || {};
  ns.config.shared = ns.config.shared || {};
  ns.config.clusters = Array.isArray(ns.config.clusters) ? ns.config.clusters : [];
}(this));
