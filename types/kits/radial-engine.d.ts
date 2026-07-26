// Ambient types for the radial kit's engine APIs (full-circle and
// semicircle renderer specs/engines) and componentContext.components.require()
// overloads.

type DyniRadialRenderResult = { wantsFollowUpFrame: boolean } | undefined;

type DyniRadialRenderCanvas = (canvas: unknown, props: unknown) => DyniRadialRenderResult;

interface DyniFullCircleEngineState extends DyniFullCircleRenderState {
  canvas: unknown;
  W: number;
  H: number;
  mode: string;
  color: unknown;
  pad: number;
  gap: number;
  ratio: number;
  responsive: DyniResponsiveScaleProfile;
  draw: DyniRadialDrawApi;
  value: DyniValueMathApi;
  angle: DyniRadialAngleMathApi;
  staticKey: string;
  bufferW: number;
  bufferH: number;
  dpr: number;
}

interface DyniFullCircleRendererApi {
  drawFullCircleRing(targetCtx?: CanvasRenderingContext2D): void;
  drawFullCircleTicks(targetCtx?: CanvasRenderingContext2D, opts?: DyniRadialDrawOptions): void;
  drawFixedPointer(targetCtx?: CanvasRenderingContext2D, angleDeg?: unknown, opts?: DyniRadialDrawOptions): void;
  drawCachedLayer(layerName: unknown, opts?: DyniRadialDrawOptions): void;
  getCacheMeta(key: unknown): unknown;
  setCacheMeta(key: unknown, metaValue: unknown): unknown;
}

type DyniFullCircleRenderHook = (
  state: DyniFullCircleEngineState,
  props: Record<string, unknown>,
  api: DyniFullCircleRendererApi
) => DyniRadialRenderResult;

interface DyniFullCircleRendererSpec {
  ratioProps?: { normal: string; flat: string };
  ratioDefaults?: { normal: number; flat: number };
  hideTextualMetricsProp?: string;
  cacheLayers?: unknown;
  layout?: DyniRadialConfigMap;
  buildStaticKey?: (state: DyniFullCircleEngineState, props: Record<string, unknown>) => unknown;
  rebuildLayer?: (
    layerCtx: CanvasRenderingContext2D,
    layerName: string,
    state: DyniFullCircleEngineState,
    props: Record<string, unknown>,
    api: DyniFullCircleRendererApi
  ) => void;
  drawFrame?: DyniFullCircleRenderHook;
  drawMode?: Record<string, DyniFullCircleRenderHook>;
}

interface DyniFullCircleRadialEngineApi {
  id: "FullCircleRadialEngine";
  createRenderer(spec?: DyniFullCircleRendererSpec): DyniRadialRenderCanvas;
}

interface DyniSemicircleFormattedDisplay {
  num: unknown;
  text: string;
}

interface DyniSemicircleEngineProps {
  [key: string]: unknown;
}

interface DyniSemicirclePropKeys {
  min: string;
  max: string;
}

interface DyniSemicircleTickPropKeys {
  major: string;
  minor: string;
  showEndLabels: string;
}

interface DyniSemicircleRatioPropKeys {
  normal: string;
  flat: string;
}

interface DyniSemicircleRangeDefaults {
  min: number;
  max: number;
}

interface DyniSemicircleRatioDefaults {
  normal: number;
  flat: number;
}

interface DyniSemicircleTickPreset {
  major: unknown;
  minor: unknown;
}

type DyniSemicircleFormatDisplay = (
  rawValue: unknown,
  props: DyniSemicircleEngineProps,
  unitText: unknown,
  componentContext?: DyniComponentContext
) => DyniSemicircleFormattedDisplay;

type DyniSemicircleTickSteps = (range: number) => DyniSemicircleTickPreset;

type DyniSemicircleBuildSectors = (
  props: DyniSemicircleEngineProps,
  min: number,
  max: number,
  arc: DyniArc,
  sectorMath: Pick<DyniRadialSectorMathApi, "sectorAngles" | "buildHighEndSectors" | "buildLowEndSectors">,
  theme: DyniRadialResolvedTheme
) => DyniColoredAngleRange[];

interface DyniSemicircleRendererSpec {
  arc?: DyniArc;
  ratioDefaults?: DyniSemicircleRatioDefaults;
  rangeDefaults?: DyniSemicircleRangeDefaults;
  rangeProps?: DyniSemicirclePropKeys;
  tickProps?: DyniSemicircleTickPropKeys;
  ratioProps?: DyniSemicircleRatioPropKeys;
  hideTextualMetricsProp?: unknown;
  unitDefault?: unknown;
  rawValueKey?: string;
  formatDisplay?: DyniSemicircleFormatDisplay;
  tickSteps?: DyniSemicircleTickSteps;
  buildSectors?: DyniSemicircleBuildSectors;
}

interface DyniSemicircleMemoLayout {
  key: string;
  themeRef: DyniRadialResolvedTheme;
  mode: "flat" | "high" | "normal";
  insets: DyniRadialInsets;
  layout: DyniSemicircleLayout;
}

interface DyniSemicircleRadialEngineApi {
  id: "SemicircleRadialEngine";
  createRenderer(spec?: DyniSemicircleRendererSpec): DyniRadialRenderCanvas;
}

interface DyniComponentRequire {
  (id: "RadialCanvasPrimitives"): DyniRadialCanvasPrimitivesApi;
  (id: "RadialFrameRenderer"): DyniRadialFrameRendererApi;
  (id: "RadialToolkit"): DyniRadialToolkitApi;
  (id: "RadialValueMath"): DyniRadialValueMathApi;
  (id: "CanvasLayerCache"): DyniCanvasLayerCacheApi;
  (id: "FullCircleRadialLayout"): DyniFullCircleRadialLayoutApi;
  (id: "FullCircleRadialMeasure"): DyniFullCircleRadialMeasureApi;
  (id: "FullCircleRadialDrawing"): DyniFullCircleRadialDrawingApi;
  (id: "FullCircleRadialTextLayout"): DyniFullCircleRadialTextLayoutApi;
  (id: "FullCircleRadialEngine"): DyniFullCircleRadialEngineApi;
  (id: "SemicircleRadialLayout"): DyniSemicircleRadialLayoutApi;
  (id: "SemicircleRadialTextLayout"): DyniSemicircleRadialTextLayoutApi;
  (id: "RadialMajorValueLabels"): DyniRadialMajorValueLabelsApi;
  (id: "SemicircleRadialEngine"): DyniSemicircleRadialEngineApi;
}
