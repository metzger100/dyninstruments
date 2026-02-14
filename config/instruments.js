/**
 * Module: DyniPlugin Instruments - Final instrument list assembly
 * Documentation: documentation/architecture/cluster-system.md
 * Depends: config/clusters/*.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;

  config.instruments = config.clusters;
}(this));
