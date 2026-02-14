/**
 * Module: DyniPlugin LargeTime Cluster - Local time widget config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/common-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const config = ns.config || (ns.config = {});
  const shared = config.shared || (config.shared = {});

  const commonThreeElementsEditables = shared.commonThreeElementsEditables;

  config.clusters = Array.isArray(config.clusters) ? config.clusters : [];

  config.clusters.push({
    module: "ClusterHost",
    def: {
      name: "dyninstruments_LargeTime",
      description: "Local time (large clock, HH:MM:SS)",
      caption: "TIME", unit: "", default: "---",
      cluster: "time",
      storeKeys: { value: "nav.gps.rtime" },
      editableParameters: {
        caption: true,
        unit: true,
        formatter: false,
        formatterParameters: false,
        value: true,
        className: true,
        ...commonThreeElementsEditables
      }
    }
  });
}(this));
