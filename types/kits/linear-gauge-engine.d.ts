// Ambient types for the linear gauge drawing/engine APIs
// (LinearGaugeEngine, LinearGaugeEngineDrawing/Frame/Support, drawing state and renderer spec).

interface DyniLinearGaugeProps {
  [key: string]: unknown;
}

interface DyniLinearMetricDisplay {
  caption: unknown;
  value: unknown;
  unit: unknown;
}

interface DyniLinearParsedDisplay {
  num: number;
  text: unknown;
  secScale?: number;
  left?: DyniLinearMetricDisplay;
  right?: DyniLinearMetricDisplay;
}

type DyniLinearFormatDisplay = (
  rawValue: unknown,
  props: DyniLinearGaugeProps,
  unitText: unknown,
  componentContext?: DyniComponentContext
) => DyniLinearParsedDisplay;

interface DyniLinearRichDisplay {
  num: number;
  text: unknown;
  secScale: number;
  parsed: DyniLinearParsedDisplay;
  raw?: unknown;
  easedNum?: number;
  unit?: unknown;
  caption?: unknown;
  rowBoxes?: { captionBox?: DyniRect | null; valueBox?: DyniRect | null };
}

interface DyniLinearDrawApi {
  text: DyniCanvasTextLayoutApi;
  textLayout: DyniLinearGaugeTextLayoutApi;
}

interface DyniLinearFrameDrawApi extends DyniLinearDrawApi {
  drawDefaultPointer(opts?: DyniLinearDrawOptions): void;
  drawMarkerAtValue(valueNum: unknown, opts?: DyniLinearDrawOptions): void;
}

type DyniLinearDrawMode = (
  state: DyniLinearGaugeDrawingState,
  props: DyniLinearGaugeProps,
  display: DyniLinearRichDisplay,
  api: DyniLinearDrawApi
) => DyniLinearRenderResult;

type DyniLinearFrameHook = (
  state: DyniLinearGaugeDrawingState,
  props: DyniLinearGaugeProps,
  display: DyniLinearRichDisplay,
  api: DyniLinearFrameDrawApi
) => DyniLinearRenderResult;

interface DyniLinearDrawModes {
  flat?: DyniLinearDrawMode;
  normal?: DyniLinearDrawMode;
  high?: DyniLinearDrawMode;
}

type DyniLinearBuildSectors = (
  props: DyniLinearGaugeProps,
  min: number,
  max: number,
  axis: DyniLinearRange,
  valueMath: DyniValueMathApi,
  theme: DyniLinearGaugeTheme
) => DyniLinearColoredRange[];

interface DyniLinearRendererSpec {
  axisMode?: string;
  ratioDefaults?: { normal: number; flat: number };
  ratioProps?: { normal: string; flat: string };
  rangeDefaults?: DyniLinearRange;
  rangeProps?: { min: string; max: string };
  tickProps?: { major: string; minor: string; showEndLabels: string };
  unitDefault?: unknown;
  rawValueKey?: string;
  hideTextualMetricsProp?: string;
  tickSteps?: (range: number) => { major: number; minor: number };
  formatDisplay?: DyniLinearFormatDisplay;
  buildSectors?: DyniLinearBuildSectors;
  resolveAxis?: (props: DyniLinearGaugeProps, range: DyniLinearRange, defaultAxis: DyniLinearRange) => DyniLinearRange;
  buildTicks?: (axis: DyniLinearRange, majorStep: unknown, minorStep: unknown) => DyniLinearTicks;
  drawMode?: DyniLinearDrawModes;
  layout?: Record<string, unknown> | null;
  springTarget?: string;
  springWrap?: number;
  labelEdgePolicy?: string;
  formatTickLabel?: (tickValue: unknown, state?: DyniLinearGaugeDrawingState) => string;
  drawFrame?: DyniLinearFrameHook;
}

type DyniLinearRenderResult = { wantsFollowUpFrame?: boolean } | undefined;

type DyniLinearRenderCanvas = (canvas: unknown, props: DyniLinearGaugeProps) => DyniLinearRenderResult;

interface DyniLinearGaugeEngineApi {
  id: "LinearGaugeEngine";
  createRenderer(spec?: DyniLinearRendererSpec): DyniLinearRenderCanvas;
}

interface DyniLinearColoredRange {
  from?: unknown;
  to?: unknown;
  color?: unknown;
}

interface DyniLinearScaleBounds {
  left: number;
  right: number;
}

interface DyniLinearLabelEntry {
  x: number;
  naturalX: number;
  clampedX: number;
  label: string;
  isStart: boolean;
  isEnd: boolean;
}

interface DyniLinearLabelPlacement {
  textAlign: CanvasTextAlign;
  drawX: number;
  left: number;
  right: number;
}

interface DyniLinearLabelClipRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

type DyniLinearLabelEdgePolicyResolver = (state: DyniLinearGaugeDrawingState) => "sliding" | "inset";

interface DyniLinearGaugeLabelFitApi {
  id: "LinearGaugeLabelFit";
  setCanvasFont: DyniCanvasTextFittingApi["setFont"];
  resolveScaleBounds(state: DyniLinearGaugeDrawingState): DyniLinearScaleBounds;
  resolveEdgePlacement(
    x: number,
    width: number,
    isStart: unknown,
    isEnd: unknown,
    isFirst: unknown,
    isLast: unknown,
    state: DyniLinearGaugeDrawingState,
    fontPx: number
  ): DyniLinearLabelPlacement;
  resolveLabelEdgePolicy: DyniHtmlWidgetUtilsApi["resolveLabelEdgePolicy"];
  resolveLabelPlacement(
    entry: DyniLinearLabelEntry,
    width: number,
    isStart: unknown,
    isEnd: unknown,
    isFirst: unknown,
    isLast: unknown,
    state: DyniLinearGaugeDrawingState,
    fontPx: number
  ): DyniLinearLabelPlacement;
  resolveLabelClipRect(state: DyniLinearGaugeDrawingState, labelY: unknown, fontPx: unknown): DyniLinearLabelClipRect;
  collectLabels(
    state: DyniLinearGaugeDrawingState,
    ticks: DyniLinearTicks,
    showEndLabels: unknown,
    math: DyniLinearGaugeMathApi,
    labelFormatter: DyniLinearTickLabelFormatter | null
  ): DyniLinearLabelEntry[];
  resolveLabelFontPx(
    layerCtx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    labels: DyniLinearLabelEntry[]
  ): number;
  resolveLabelY(state: DyniLinearGaugeDrawingState, fontPx: number): number;
}

interface DyniLinearGaugeTextLayoutApi {
  id?: "LinearGaugeTextLayout";
  resolveLabelBoost(mode: unknown): number;
  drawTickLabels(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    ticks: DyniLinearTicks,
    showEndLabels: unknown,
    math: DyniLinearGaugeMathApi,
    labelFormatter: DyniLinearTickLabelFormatter | null
  ): void;
  drawCaptionRow(
    state: DyniLinearGaugeDrawingState,
    textApi: DyniCanvasTextLayoutApi,
    caption: unknown,
    box: DyniRect | null | undefined,
    secScale: unknown,
    align: unknown
  ): void;
  drawValueUnitRow(
    state: DyniLinearGaugeDrawingState,
    textApi: DyniCanvasTextLayoutApi,
    valueText: unknown,
    unitText: unknown,
    box: DyniRect | null | undefined,
    secScale: unknown,
    align: unknown
  ): void;
  drawInlineRow(
    state: DyniLinearGaugeDrawingState,
    textApi: DyniCanvasTextLayoutApi,
    caption: unknown,
    valueText: unknown,
    unitText: unknown,
    box: DyniRect | null | undefined,
    secScale: unknown
  ): void;
}

type DyniLinearMapValueToX = (valueNum: unknown, doClamp?: boolean) => number;

type DyniLinearHookMapValueToX = (valueNum: unknown, axisOverride?: DyniLinearRange, doClamp?: boolean) => number;

type DyniLinearTickLabelFormatter = (tickValue: unknown, state: DyniLinearGaugeDrawingState) => string;

interface DyniLinearGaugeDrawingState {
  ctx: CanvasRenderingContext2D;
  canvas: object;
  nowMs: number;
  W: number;
  H: number;
  mode: unknown;
  textFillScale: unknown;
  axisMode: unknown;
  axis: DyniLinearRange;
  layout: DyniLinearGaugeLayout;
  primitives: DyniLinearCanvasPrimitivesApi;
  textLayout: DyniLinearGaugeTextLayoutApi;
  math: DyniLinearGaugeMathApi;
  color: unknown;
  theme: DyniLinearGaugeTheme;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  labelEdgePolicy: unknown;
  trackThickness: number;
  sectorBandY: number;
  labelFontPx: number;
  labelInsetPx: number;
  mapValueToX: DyniLinearMapValueToX;
}

interface DyniLinearGaugeStaticKeyOptions {
  tickMajor?: unknown;
  tickMinor?: unknown;
  showEndLabels?: unknown;
  labelEdgePolicy?: unknown;
  sectors?: unknown;
  widget?: unknown;
}

interface DyniLinearGaugeEngineDrawingApi {
  id: "LinearGaugeEngineDrawing";
  drawStaticBack(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    sectors: DyniLinearColoredRange[]
  ): void;
  drawStaticFront(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    ticks: DyniLinearTicks,
    showEndLabels: unknown,
    labelFormatter: DyniLinearTickLabelFormatter | null
  ): void;
  drawPointerAtValue(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    layout: DyniLinearGaugeLayout,
    theme: DyniLinearGaugeTheme,
    primitives: DyniLinearCanvasPrimitivesApi,
    mapValueToX: DyniLinearMapValueToX,
    markerValue: unknown,
    pointerDepthBase: number,
    markerSizeBase: number,
    opts?: DyniLinearDrawOptions
  ): void;
  drawMarkerAtValue(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    layout: DyniLinearGaugeLayout,
    theme: DyniLinearGaugeTheme,
    primitives: DyniLinearCanvasPrimitivesApi,
    mapValueToX: DyniLinearMapValueToX,
    markerValue: unknown,
    markerSizeBase: number,
    opts?: DyniLinearDrawOptions
  ): void;
}

interface DyniLinearGaugeEngineFrameParams {
  layout: DyniLinearGaugeLayout;
  theme: DyniLinearGaugeTheme;
  primitives: DyniLinearCanvasPrimitivesApi;
  drawing: DyniLinearGaugeEngineDrawingApi;
  easedDisplayNum: number;
  pointerDepthBase: number;
  markerSizeBase: number;
  cfg: DyniLinearRendererSpec;
  p: DyniLinearGaugeProps;
  displayState: DyniLinearRichDisplay;
  hookApi: {
    primitives: DyniLinearCanvasPrimitivesApi;
    math: DyniLinearGaugeMathApi;
    textLayout: DyniLinearGaugeTextLayoutApi;
    text: DyniCanvasTextLayoutApi;
    value: DyniValueMathApi;
    theme: DyniLinearGaugeTheme;
    mapValueToX: DyniLinearHookMapValueToX;
  };
  text: DyniCanvasTextLayoutApi;
  textLayout: DyniLinearGaugeTextLayoutApi;
  valueText: unknown;
  unit: unknown;
  rowBoxes: { captionBox?: DyniRect | null; valueBox?: DyniRect | null; top?: unknown; bottom?: unknown };
  secScale: unknown;
  layerCache: DyniCanvasLayerCache;
  springMotion: { isActive(canvasElement: unknown): boolean };
}

interface DyniLinearGaugeEngineFrameApi {
  id: "LinearGaugeEngineFrame";
  renderFrame(
    ctx: CanvasRenderingContext2D,
    state: DyniLinearGaugeDrawingState,
    canvasElement: HTMLCanvasElement,
    deps: DyniLinearGaugeEngineFrameParams
  ): DyniLinearRenderResult;
}

interface DyniLinearGaugeEngineSupportApi {
  id: "LinearGaugeEngineSupport";
  resolveLabelEdgePolicy: DyniHtmlWidgetUtilsApi["resolveLabelEdgePolicy"];
  buildStaticKey(
    math: Pick<DyniLinearGaugeMathApi, "keyToText">,
    state: DyniLinearGaugeDrawingState,
    options?: DyniLinearGaugeStaticKeyOptions
  ): string | undefined;
}
