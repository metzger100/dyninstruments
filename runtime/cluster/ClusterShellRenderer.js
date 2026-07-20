/**
 * @file DyniPlugin Cluster Shell Renderer - Startup-safe route-frame normalization and shell markup
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);
  const components = /** @type {Record<string, { create(): DyniValueMathApi }>} */ (root.DyniComponents);
  const valueMath = components.DyniValueMath.create();
  const CANVAS_INNER_HTML = '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>';
  const HTML_INNER_HTML =
    '<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>';
  const trimText = valueMath.trimText;

  /** @param {unknown} rawProps @param {unknown} def @param {unknown} clusterRoutes @returns {string} */
  function resolveCluster(rawProps, def, clusterRoutes) {
    const props = /** @type {DyniMapperProps} */ (rawProps && typeof rawProps === "object" ? rawProps : {});
    const cluster = trimText(props.cluster);
    if (cluster) {
      return cluster;
    }
    const definition = /** @type {DyniMapperProps} */ (def && typeof def === "object" ? def : {});
    return trimText(definition.cluster);
  }

  /** @param {unknown} rawProps @returns {string} */
  function resolveKind(rawProps) {
    const props = /** @type {DyniMapperProps} */ (rawProps && typeof rawProps === "object" ? rawProps : {});
    return trimText(props.kind);
  }

  /** @param {DyniRouteFrame|null|undefined} routeFrame @returns {boolean} */
  function isVerticalShell(routeFrame) {
    return !!(routeFrame && routeFrame.__dyniRawProps && routeFrame.__dyniRawProps.mode === "vertical");
  }

  /** @param {unknown} instanceId @param {DyniClusterShellHostContext|null|undefined} hostContext @returns {string} */
  function resolveInstanceId(instanceId, hostContext) {
    const direct = trimText(instanceId);
    if (direct) {
      return direct;
    }
    if (hostContext && typeof hostContext === "object" && hostContext.__dyniHostCommitState) {
      return trimText(hostContext.__dyniHostCommitState.instanceId);
    }
    return "";
  }

  /** @param {unknown} surface @returns {string} */
  function resolveInnerHtml(surface) {
    if (surface === "canvas-dom") {
      return CANVAS_INNER_HTML;
    }
    if (surface === "html") {
      return HTML_INNER_HTML;
    }
    return '<div class="dyni-shell-mount" data-dyni-shell-mount="1"></div>';
  }

  /** @param {DyniClusterRoute|null|undefined} routeMeta @param {DyniRouteFrame|null|undefined} routeFrame @returns {string} */
  function resolveShellStyle(routeMeta, routeFrame) {
    if (!routeMeta || !routeMeta.shellSizing || !isVerticalShell(routeFrame)) {
      return "";
    }
    if (routeMeta.shellSizing.kind === "ratio") {
      return ' style="aspect-ratio:' + String(routeMeta.shellSizing.aspectRatio) + ';"';
    }
    return "";
  }

  runtime.clusterShellRenderer = /** @type {DyniClusterShellRendererApi} */ ({
    normalizeRouteFrame: function (rawProps, def, clusterRoutes) {
      const source = /** @type {DyniMapperProps} */ (rawProps && typeof rawProps === "object" ? rawProps : {});
      const routeFrame = /** @type {DyniRouteFrame} */ (Object.assign({}, source));
      const cluster = resolveCluster(source, def, clusterRoutes);
      const kind = resolveKind(source);

      routeFrame.cluster = cluster;
      routeFrame.kind = kind;
      routeFrame.__dyniRouteId = cluster + "/" + kind;
      routeFrame.__dyniRawProps = source;

      return routeFrame;
    },
    renderRouteShell: function (routeFrame, routeMeta, instanceId, hostContext) {
      const frame = /** @type {DyniRouteFrame} */ (routeFrame && typeof routeFrame === "object" ? routeFrame : {});
      const routeId = trimText(frame.__dyniRouteId);
      const surface = routeMeta && typeof routeMeta.surface === "string" ? routeMeta.surface : "unknown";
      const clusterToken = trimText(frame.cluster)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");
      const kindToken = trimText(frame.kind)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");
      const surfaceToken =
        surface === "canvas-dom"
          ? "canvas"
          : surface === "html"
            ? "html"
            : trimText(surface)
                .replace(/[^a-zA-Z0-9_-]/g, "-")
                .replace(/-{2,}/g, "-")
                .replace(/^-+|-+$/g, "") || "unknown";
      const shellClasses = [
        "widgetData",
        "dyni-shell",
        "dyni-surface-" + surfaceToken,
        "dyni-kind-" + (kindToken || "unknown")
      ];
      const shellStyle = resolveShellStyle(routeMeta, frame);
      const shellInner = resolveInnerHtml(surface);
      const resolvedInstanceId = resolveInstanceId(instanceId, hostContext);

      if (!routeMeta) {
        shellClasses.push("dyni-shell-unknown");
      } else if (clusterToken) {
        shellClasses.push("dyni-cluster-" + clusterToken);
      }

      const instanceIdAttr = String(resolvedInstanceId)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const routeIdAttr = String(routeId)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const surfaceAttr = String(surface)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return (
        '<div class="' +
        shellClasses.join(" ") +
        '"' +
        ' data-dyni-instance="' +
        instanceIdAttr +
        '"' +
        ' data-dyni-route="' +
        routeIdAttr +
        '"' +
        ' data-dyni-surface="' +
        surfaceAttr +
        '"' +
        shellStyle +
        ">" +
        shellInner +
        "</div>"
      );
    }
  });
})(this);
