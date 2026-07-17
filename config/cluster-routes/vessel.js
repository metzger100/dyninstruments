/**
 * @file DyniPlugin Cluster Routes Vessel - Route metadata for vessel kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "vessel",
      kind: "voltage",
      mapperId: "VesselMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "voltageLinear",
      mapperId: "VesselMapper",
      rendererId: "VoltageLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "voltageRadial",
      mapperId: "VesselMapper",
      rendererId: "VoltageRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "vessel",
      kind: "alarm",
      mapperId: "VesselMapper",
      viewModelId: "AlarmViewModel",
      rendererId: "AlarmTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "regattaTimer",
      mapperId: "VesselMapper",
      rendererId: "RegattaTimerTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "clock",
      mapperId: "VesselMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "clockRadial",
      mapperId: "VesselMapper",
      rendererId: "ClockRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "vessel",
      kind: "dateTime",
      mapperId: "VesselMapper",
      rendererId: "PositionCoordinateWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "timeStatus",
      mapperId: "VesselMapper",
      rendererId: "PositionCoordinateWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "pitch",
      mapperId: "VesselMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "vessel",
      kind: "roll",
      mapperId: "VesselMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
}(this));
