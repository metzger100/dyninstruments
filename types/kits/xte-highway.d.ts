// Ambient types for XTE highway drawing primitives (geometry, colors, waypoint fit).

interface DyniHighwayGeomOptions {
  compactTop?: unknown;
}

interface DyniHighwayGeom {
  cx: number;
  horizonY: number;
  baseY: number;
  nearHalf: number;
  farHalf: number;
  primaryDim: number;
}

interface DyniHighwayColors {
  roadLine: string;
  stripeLine: string;
  pointer: string;
  alarm: string;
}

interface DyniXteWaypointLayout {
  nameRect?: DyniRect | null;
  responsive?: DyniResponsiveScaleProfile;
}

interface DyniXteWaypointFit {
  text?: unknown;
  px: number;
}

interface DyniXteHighwayPrimitivesApi {
  clamp: DyniValueMathApi["clamp"];
  highwayGeometry(rect: DyniRect, mode: string, primaryDim: unknown, options?: DyniHighwayGeomOptions): DyniHighwayGeom;
  drawStaticHighway(
    ctx: CanvasRenderingContext2D,
    geom: DyniHighwayGeom,
    colors: DyniHighwayColors,
    mode: string,
    primaryDim: unknown,
    strokeWeight: unknown
  ): void;
  drawDynamicHighway(
    ctx: CanvasRenderingContext2D,
    geom: DyniHighwayGeom,
    colors: DyniHighwayColors,
    xteNormalized: unknown,
    overflow: unknown,
    primaryDim: unknown,
    strokeWeight: unknown,
    pointerDepthWeight: unknown
  ): void;
  shouldShowWaypoint(
    mode: string,
    layout: DyniXteWaypointLayout | null | undefined,
    showWpName: unknown,
    name: unknown,
    fit: DyniXteWaypointFit | null | undefined
  ): boolean;
}
