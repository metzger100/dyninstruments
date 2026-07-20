/**
 * @file DyniPlugin Cluster Routes CourseHeading - Route metadata for course-heading kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  var routes = root.DyniPlugin.config.clusterRoutes.routes;

  routes.push(
    {
      cluster: "courseHeading",
      kind: "cog",
      mapperId: "CourseHeadingMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "courseHeading",
      kind: "hdt",
      mapperId: "CourseHeadingMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "courseHeading",
      kind: "hdm",
      mapperId: "CourseHeadingMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "courseHeading",
      kind: "brg",
      mapperId: "CourseHeadingMapper",
      rendererId: "ThreeValueTextWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "courseHeading",
      kind: "hdtRadial",
      mapperId: "CourseHeadingMapper",
      rendererId: "CompassRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "courseHeading",
      kind: "hdmRadial",
      mapperId: "CourseHeadingMapper",
      rendererId: "CompassRadialWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 1 }
    },
    {
      cluster: "courseHeading",
      kind: "hdtLinear",
      mapperId: "CourseHeadingMapper",
      rendererId: "CompassLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    },
    {
      cluster: "courseHeading",
      kind: "hdmLinear",
      mapperId: "CourseHeadingMapper",
      rendererId: "CompassLinearWidget",
      surface: "canvas-dom",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    }
  );
})(this);
