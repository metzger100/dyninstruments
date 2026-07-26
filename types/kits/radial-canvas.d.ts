// Ambient types for the radial kit's canvas drawing primitives, frame
// renderer, RadialValueMath, and CanvasLayerCache.

// Canvas-2D state applied inside withCtx save/restore blocks. All values are
// host-supplied and narrowed inside the primitive before assignment.
interface DyniCtxStyle {
  alpha?: unknown;
  strokeStyle?: unknown;
  fillStyle?: unknown;
  lineWidth?: unknown;
  lineCap?: unknown;
  lineJoin?: unknown;
  dash?: unknown;
}

// Options bag shared by the radial draw primitives; every key is host input.
interface DyniRadialDrawOptions {
  angleCfg?: DyniAngleConfig;
  [key: string]: unknown;
}

interface DyniRadialCanvasPrimitivesApi {
  id: "RadialCanvasPrimitives";
  withCtx(ctx: CanvasRenderingContext2D, fn: () => void, style?: DyniCtxStyle): void;
  drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, opts?: DyniRadialDrawOptions): void;
  drawArcRing(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    startDeg: unknown,
    endDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawAnnularSector(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    opts?: DyniRadialDrawOptions
  ): void;
  drawArrow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawPointerAtRim(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawRimMarker(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
}

interface DyniRadialFrameRendererApi {
  id: "RadialFrameRenderer";
  drawTicksFromAngles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angles?: DyniRadialTickAngles,
    opts?: DyniRadialDrawOptions
  ): void;
  drawTicks(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOuter: number, opts?: DyniRadialDrawOptions): void;
  drawLabels(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOuter: number, opts?: DyniRadialDrawOptions): void;
  drawDialFrame(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    opts?: DyniRadialDrawOptions
  ): void;
}

// Combined draw facade exposed by the radial toolkit.
interface DyniRadialDrawApi {
  drawRing: DyniRadialCanvasPrimitivesApi["drawRing"];
  drawArcRing: DyniRadialCanvasPrimitivesApi["drawArcRing"];
  drawAnnularSector: DyniRadialCanvasPrimitivesApi["drawAnnularSector"];
  drawArrow: DyniRadialCanvasPrimitivesApi["drawArrow"];
  drawPointerAtRim: DyniRadialCanvasPrimitivesApi["drawPointerAtRim"];
  drawRimMarker: DyniRadialCanvasPrimitivesApi["drawRimMarker"];
  drawTicksFromAngles: DyniRadialFrameRendererApi["drawTicksFromAngles"];
  drawTicks: DyniRadialFrameRendererApi["drawTicks"];
  drawLabels: DyniRadialFrameRendererApi["drawLabels"];
  drawDialFrame: DyniRadialFrameRendererApi["drawDialFrame"];
}

interface DyniRadialToolkitApi extends DyniGaugeToolkitApi {
  angle: DyniRadialAngleMathApi;
  tick: DyniRadialTickMathApi;
  draw: DyniRadialDrawApi;
  text: DyniRadialTextApi;
}

interface DyniRadialValueMathApi extends DyniValueMathApi {
  id: "RadialValueMath";
  valueToAngle: DyniRadialAngleMathApi["valueToAngleFlat"];
  angleToValue(angleDeg: unknown, minV: unknown, maxV: unknown, arc: DyniArc, doClamp?: boolean): number;
  buildValueTickAngles(
    minV: number,
    maxV: number,
    majorStep: unknown,
    minorStep: unknown,
    arc: DyniArc
  ): DyniRadialTickAngles;
  sectorAngles: DyniRadialSectorMathApi["sectorAngles"];
  buildHighEndSectors: DyniRadialSectorMathApi["buildHighEndSectors"];
  buildLowEndSectors: DyniRadialSectorMathApi["buildLowEndSectors"];
}

type DyniLayerRebuildFn = (
  layerCtx: CanvasRenderingContext2D,
  layerName: string,
  layerCanvas: HTMLCanvasElement
) => void;

interface DyniCanvasLayerCacheLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface DyniCanvasLayerDrawSize {
  W: number;
  H: number;
}

interface DyniCanvasLayerCache {
  ensureLayer(canvas: unknown, key: unknown, rebuildFn: DyniLayerRebuildFn): void;
  blit(targetCtx: CanvasRenderingContext2D): void;
  blitLayer(targetCtx: CanvasRenderingContext2D, layerName: unknown): void;
  invalidate(): void;
}

type DyniCanvasLayerCacheInstance = DyniCanvasLayerCache;

interface DyniCanvasLayerCacheApi {
  id: "CanvasLayerCache";
  createLayerCache(spec?: unknown): DyniCanvasLayerCache;
}
