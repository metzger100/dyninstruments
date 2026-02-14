/**
 * Module: DyniPlugin Namespace - Internal namespace container
 * Documentation: documentation/architecture/component-system.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin = root.DyniPlugin || {};
  ns.runtime = ns.runtime || {};
  ns.state = ns.state || {};
  ns.config = ns.config || {};
  ns.config.shared = ns.config.shared || {};
  ns.config.clusters = Array.isArray(ns.config.clusters) ? ns.config.clusters : [];
}(this));
