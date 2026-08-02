// Ambient types for shared foundation geometry APIs: angle/arc/sector math,
// linear range/ticks, springs, rect/geometry-scale, and the responsive-scale
// profile and radial angle/tick/sector math.

type DyniZeroDirection = "north" | "east" | string;

interface DyniAngleConfig {
  zeroDegAt?: DyniZeroDirection;
  clockwise?: boolean;
}

interface DyniArc {
  startDeg: unknown;
  endDeg: unknown;
}

interface DyniAngleOptions {
  min?: unknown;
  max?: unknown;
  startDeg?: unknown;
  endDeg?: unknown;
  clamp?: boolean;
}

interface DyniAngleRange {
  a0: number;
  a1: number;
}

interface DyniColoredAngleRange extends DyniAngleRange {
  color?: unknown;
}

interface DyniSectorProps {
  warningFrom?: unknown;
  alarmFrom?: unknown;
}

interface DyniSectorOptions {
  warningColor?: unknown;
  alarmColor?: unknown;
  defaultWarningFrom?: unknown;
  defaultAlarmFrom?: unknown;
}

interface DyniRadialTickAngles {
  majors: number[];
  minors: number[];
}

interface DyniLinearRange {
  min: number;
  max: number;
}

interface DyniLinearTicks {
  major: number[];
  minor: number[];
}

interface DyniLatLon {
  lat: number;
  lon: number;
}

interface DyniCourseDistance {
  course: number;
  distance: number;
}

interface DyniCenterDisplayMathApi {
  id: "CenterDisplayMath";
  normalizePoint(value: unknown): DyniLatLon | null;
  computeCourseDistance(srcValue: unknown, dstValue: unknown, useRhumbLine: unknown): DyniCourseDistance | null;
  extractMeasureStart(activeMeasure: unknown): DyniLatLon | null;
}

interface DyniAisIdentityBandHeights {
  nameHeight: number;
  frontHeight: number;
  metricsHeight: number;
}

interface DyniAisTargetLayoutMathApi {
  id: "AisTargetLayoutMath";
  clampNumber: DyniValueMathApi["clampNumber"];
  resolveIdentityBandHeights(
    contentHeight: unknown,
    identityGapPx: unknown,
    identityMetricsGapPx: unknown,
    nameShare: unknown,
    frontShare: unknown,
    frontMinHeight: unknown
  ): DyniAisIdentityBandHeights;
}

interface DyniEditRouteLayoutMathApi {
  id: "EditRouteLayoutMath";
  toFiniteNumber: DyniValueMathApi["toFiniteNumber"];
  toOptionalFiniteNumber: DyniValueMathApi["toOptionalFiniteNumber"];
  clampNumber: DyniValueMathApi["clampNumber"];
}

interface DyniTextFitArgs {
  secondaryToValueRatio?: unknown;
  valueMaxPxRatio?: unknown;
  valuePx?: unknown;
  valueRect?: unknown;
}

interface DyniTextFitMathApi {
  id: "TextFitMath";
  resolveSecondaryMaxPx(args?: DyniTextFitArgs): number;
}

interface DyniLayoutSizingHelpersApi {
  id: "LayoutSizingHelpers";
  createInsetContentRectFactory(
    makeRect: DyniMakeRect,
    padXKey: string,
    padYKey: string
  ): (W: unknown, H: unknown, insets?: Record<string, unknown>) => DyniRect;
  createMetricTileSpacingFactory(
    profileApi: DyniResponsiveScaleProfileApi,
    tilePadRatio: unknown,
    captionRatio: unknown
  ): (
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ) => DyniIntrinsicTileSpacing;
}

interface DyniSpringSpec {
  stiffness?: unknown;
  maxDtMs?: unknown;
  epsilon?: unknown;
  epsilonVelocity?: unknown;
  wrap?: unknown;
}

interface DyniSpring {
  setTarget(value: unknown): number;
  advance(nowMs: unknown): number;
  isSettled(): boolean;
  reset(value: unknown): number;
}

interface DyniSpringMotionSpec {
  spring?: unknown;
  wrap?: unknown;
}

interface DyniSpringMotionState {
  spring: DyniSpring;
  ready: boolean;
}

interface DyniSpringMotion {
  resolve(canvas: object, target: unknown, easingEnabled: unknown, nowMs: unknown): number;
  isActive(canvas: object): boolean;
}

interface DyniSpringEasingApi {
  id: "SpringEasing";
  create(spec?: DyniSpringSpec): DyniSpring;
  createMotion(spec?: DyniSpringMotionSpec): DyniSpringMotion;
}

interface DyniRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DyniMakeRect = (x: number, y: number, w: number, h: number) => DyniRect;

interface DyniLayoutRectMathApi {
  id: "LayoutRectMath";
  makeRect: DyniMakeRect;
  splitRow(rect: DyniRect | undefined, gap: number, count: number, makeRectFn?: DyniMakeRect): DyniRect[];
  splitStack(rect: DyniRect | undefined, gap: number, count: number, makeRectFn?: DyniMakeRect): DyniRect[];
}

interface DyniGeometryScaleApi {
  id: "GeometryScale";
  scale(primaryDim: unknown, factor: unknown, floor?: unknown): number;
  scaleStroke(primaryDim: unknown, factor: unknown, strokeWeight: unknown, floor?: unknown): number;
  scalePointer(primaryDim: unknown, factor: unknown, weight: unknown, floor?: unknown): number;
  strokeFloor(strokeWeight: unknown): number;
  extentFloor(strokeWeight: unknown): number;
}

interface DyniResponsiveScaleSpec {
  scales?: Record<string, unknown>;
}

interface DyniResponsiveScaleProfile {
  minDim: number;
  t: number;
  textFillScale?: number;
  [key: string]: number | undefined;
}

interface DyniIntrinsicTileSpacing {
  padX: number;
  captionHeightPx: number;
}

interface DyniResponsiveScaleProfileApi {
  id: "ResponsiveScaleProfile";
  computeProfile(W: unknown, H: unknown, spec?: DyniResponsiveScaleSpec): DyniResponsiveScaleProfile;
  computeInsetPx(profile: DyniResponsiveScaleProfile | undefined, ratio: unknown, floor: unknown): number;
  computeInsetPair(
    W: unknown,
    H: unknown,
    spec: DyniResponsiveScaleSpec | undefined,
    padRatio: unknown,
    gapRatio: unknown
  ): { responsive: DyniResponsiveScaleProfile; pad: number; gap: number };
  computeIntrinsicSpacePx(
    profile: DyniResponsiveScaleProfile | undefined,
    spanPx: unknown,
    ratio: unknown,
    count: unknown,
    floor: unknown
  ): number;
  computeIntrinsicTileSpacing(
    profile: DyniResponsiveScaleProfile | undefined,
    rect: Partial<DyniRect> | undefined,
    padRatio: unknown,
    captionRatio: unknown
  ): DyniIntrinsicTileSpacing;
  scaleShare(base: unknown, scale: unknown, minValue: number, maxValue: number): number;
  scaleMaxTextPx(base: unknown, textFillScale: unknown): number;
}

interface DyniRadialAngleMathApi {
  mod(n: number, m: number): number;
  norm360(deg: number): number;
  norm180(deg: number): number;
  valueToAngleFlat(
    rawValue: unknown,
    minV: unknown,
    maxV: unknown,
    arc: DyniArc | undefined,
    doClamp?: boolean
  ): number;
  angleToValue(angleDeg: unknown, opts: DyniAngleOptions | undefined): number;
}

interface DyniRadialTickOptions {
  startDeg?: unknown;
  endDeg?: unknown;
  stepMajor?: unknown;
  stepMinor?: unknown;
  includeEnd?: boolean;
  majorMode?: unknown;
}

interface DyniRadialSweepInfo {
  s: number;
  e: number;
  sweep: number;
  dir: number;
}

interface DyniRadialTickMathApi {
  id: "RadialTickMath";
  computeSweep(startDeg: unknown, endDeg: unknown): DyniRadialSweepInfo;
  isBeyondEnd(curr: number, end: number, dir: unknown, includeEnd: boolean): boolean;
  buildTickAngles(opts?: DyniRadialTickOptions): DyniRadialTickAngles;
}

interface DyniRadialSectorMathApi {
  sectorAngles(from: unknown, to: unknown, minV: number, maxV: number, arc: DyniArc): DyniAngleRange | null;
  buildHighEndSectors(
    props: DyniSectorProps | undefined,
    minV: number,
    maxV: number,
    arc: DyniArc,
    options?: DyniSectorOptions
  ): DyniColoredAngleRange[];
  buildLowEndSectors(
    props: DyniSectorProps | undefined,
    minV: number,
    maxV: number,
    arc: DyniArc,
    options?: DyniSectorOptions
  ): DyniColoredAngleRange[];
}
