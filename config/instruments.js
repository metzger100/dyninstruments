/**
 * Module: DyniPlugin Instruments - Final instrument list assembly
 * Documentation: documentation/architecture/cluster-system.md
 * Depends: config/clusters/*.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const config = ns.config || (ns.config = {});

  const EXPOSE_LEGACY = false;
  const LEGACY = [];
  const CLUSTERS = Array.isArray(config.clusters) ? config.clusters : [];

  config.exposeLegacy = EXPOSE_LEGACY;
  config.legacy = LEGACY;
  config.instruments = EXPOSE_LEGACY ? CLUSTERS.concat(LEGACY) : CLUSTERS;
}(this));
