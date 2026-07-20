// Ambient types for miscellaneous widget-kit modules pending promotion into
// types/dyni-globals.d.ts. Declaration merges extend the shared interfaces.

// Minimal Node-style process shim for dev-mode detection guards.
declare const process:
  | undefined
  | {
      env?: {
        NODE_ENV?: string;
      };
    };

// --- shared context / value-math extensions -------------------------------

interface DyniCanvasSurface {
  W: number;
  H: number;
  ctx: CanvasRenderingContext2D;
}

interface DyniCanvasHostApi {
  setupCanvas(canvas: unknown): DyniCanvasSurface | null;
}

interface DyniComponentContext {
  theme?: {
    tokens?: Record<string, unknown>;
  };
  canvas?: DyniCanvasHostApi;
}

interface DyniValueMathApi {
  isObject(value: unknown): value is Record<string, unknown>;
  toObject(value: unknown): Record<string, unknown>;
  trimText(value: unknown): string;
  clampPositive(value: unknown, defaultValue: number): number;
  hasText(value: unknown): boolean;
}

// --- host helper APIs required by the target modules ----------------------

interface DyniHtmlShellRect {
  width: number;
  height: number;
}

interface DyniHtmlSurfaceRendererSpec {
  id?: unknown;
  createCommittedRenderer(options: unknown): DyniHtmlSurfaceRendererInstance;
}

interface DyniHtmlSurfaceRendererInstance {
  mount(shadowRoot: ShadowRoot, payload: DyniHtmlSurfacePayload): void;
  update(payload: DyniHtmlSurfacePayload): void;
  postPatch(payload: DyniHtmlSurfacePayload): unknown;
  detach(reason: string): void;
  destroy(): void;
  layoutSignature?: (payload: DyniHtmlSurfacePayload) => unknown;
}

interface DyniHtmlSurfacePayload {
  revision: number;
  rootEl: HTMLElement;
  shellEl: HTMLElement;
  props?: Record<string, unknown>;
  surface?: unknown;
  route?: Record<string, unknown> | null;
  mountEl?: HTMLElement | null;
  shadowRoot?: ShadowRoot | null;
  shellRect?: DyniHtmlShellRect | null;
  hostContext?: unknown;
  layoutChanged?: boolean;
  relayoutPass?: number;
  fontMetricsEpoch?: number;
}

interface DyniHtmlSurfaceState {
  hostContext: unknown;
  shellEl: HTMLElement | null;
  mountEl: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
  renderer: DyniHtmlSurfaceRendererInstance | null;
  latestPayload: DyniHtmlSurfacePayload | null;
  fontMetricsEpoch: number;
  fontMetricsRefreshToken: number;
}

type DyniHtmlSurfaceOptions = DyniSurfaceControllerOptions & {
  rendererSpec: DyniHtmlSurfaceRendererSpec;
  shadowCssUrls?: string[];
};

interface DyniThemeRuntime {
  getShadowCssText(url: string): string;
}

type DyniHtmlRuntime = DyniRuntimeNamespace & {
  theme?: DyniThemeRuntime;
  _createHtmlSurfaceController: () => DyniSurfaceControllerFactory;
};

interface DyniHtmlTextOptions {
  captionOpacity: unknown;
  unitOpacity: unknown;
}

interface DyniHostCommitState {
  instanceId: string;
  renderRevision: number;
  mountedRevision: number;
  lastProps: unknown;
  rootEl: Element | null;
  shellEl: Element | null;
  scheduledRevision: number | null;
  rafHandle: number | null;
  observer: MutationObserver | null;
  timeoutHandle: number | null;
  commitPending: boolean;
}

interface DyniHostCommitControllerOptions {
  instancePrefix?: unknown;
  document?: Document | null;
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
  setTimeout?: (callback: () => void, delay: number) => number;
  clearTimeout?: (handle: number) => void;
  MutationObserver?: typeof MutationObserver;
}

interface DyniHostCommitCallbackPayload {
  instanceId: string;
  revision: number;
  props: unknown;
  rootEl: Element;
  shellEl: Element;
  state: DyniHostCommitState;
}

interface DyniHostCommitCallbacks {
  onCommit?: (payload: DyniHostCommitCallbackPayload) => void;
}

interface DyniHostCommitControllerApi {
  initState(): DyniHostCommitState;
  recordRender(props: unknown): number;
  scheduleCommit(callbacks?: DyniHostCommitCallbacks): boolean;
  cleanup(): void;
  getState(): DyniHostCommitState;
}

interface DyniHostRuntime extends DyniRuntimeNamespace {
  createHostCommitController(options?: DyniHostCommitControllerOptions): DyniHostCommitControllerApi;
}

type DyniHostDispatchHandler = (event: unknown) => unknown;

interface DyniHostActionDiscoveryApi {
  detectPageId(): string;
  findPageDispatchHandler(pageId: string, propNames?: string[]): DyniHostDispatchHandler | null;
  dispatchPageAction(
    actionName: string,
    pageId: string,
    avnavData: Record<string, unknown>,
    propNames: string[],
    missingLabel: string
  ): boolean;
  hasAlarmDispatch(): boolean;
  dispatchAlarmStopAll(): boolean;
}

interface DyniTemporaryRoutePointSnapshot {
  idx: number;
  name: string;
  lat: number;
  lon: number;
  routeName: string;
  course?: number;
  distance?: number;
  selected?: boolean;
}

interface DyniTemporaryRoutePointsApi {
  activate(index: number): boolean | void;
}

interface DyniTemporaryAvnavApi {
  routePoints?: DyniTemporaryRoutePointsApi;
}

interface DyniTemporaryCapabilities {
  pageId: string;
  routePoints: { activate: string };
  map: { checkAutoZoom: string };
  routeEditor: { openActiveRoute: string; openEditRoute: string };
  ais: { showInfo: string };
  alarm: { stopAll: string };
}

interface DyniTemporaryHostActions {
  getCapabilities(): DyniTemporaryCapabilities;
  routePoints: { activate(payload: unknown): boolean };
  map: { checkAutoZoom(): boolean };
  routeEditor: { openActiveRoute(): boolean; openEditRoute(): boolean };
  ais: { showInfo(mmsi: unknown): boolean };
  alarm: { stopAll(): boolean };
}

type DyniTemporaryBridgeRuntime = DyniRuntimeNamespace & {
  createTemporaryHostActionBridgeDiscovery(
    rootRef: unknown,
    createBridgeError: (message: string) => Error
  ): DyniHostActionDiscoveryApi;
  getAvnavApi(rootRef: unknown): DyniTemporaryAvnavApi | null;
  createTemporaryHostActionBridge(): unknown;
};

interface DyniCanvasTextFittingApi {
  id: "CanvasTextFitting";
  setFont(ctx: CanvasRenderingContext2D, px: number, weight?: unknown, family?: unknown): void;
  measureTextWidth(ctx: CanvasRenderingContext2D, text: string): number;
}

interface DyniHtmlWidgetUtilsApi {
  id: "HtmlWidgetUtils";
  toFiniteNumber: DyniValueMathApi["toFiniteNumber"];
  toText: DyniValueMathApi["toText"];
  trimText: DyniValueMathApi["trimText"];
  escapeHtml(value: unknown): string;
  toStyleAttr(style: unknown): string;
  toStyleText(colorKey: string, value: unknown): string;
  resolveHostCommitTarget(hostContext: unknown, targetEl?: unknown): HTMLElement | null | undefined;
  resolveShellRect(hostContext: unknown, targetEl?: unknown): DyniHtmlShellRect | null;
  resolveRatioMode(options?: unknown): string;
  resolveRatioModeForRect(options?: unknown): string;
  resolveMetricValueFamily(model: unknown, tokens: unknown, baseFamily?: unknown): unknown;
  toFontStyle(px: unknown): string;
  resolveLabelEdgePolicy(cfg: unknown): "sliding" | "inset";
  resolveSurfacePolicy(props: unknown): Record<string, unknown> | null;
  joinStyles(...styles: unknown[]): string;
  buildTextOptions(state: unknown): DyniHtmlTextOptions;
  toPx(value: unknown): string;
  resolveDefaultText(props: unknown): string | undefined;
  applyMirroredContext(rootEl: unknown, props: unknown): void;
  patchInnerHtml(rootEl: unknown, nextHtml: unknown): Element | null;
  isEditingMode(props: unknown): boolean;
  canDispatchSurfaceInteraction(props: unknown): boolean;
}

interface DyniHtmlMeasureUtilsApi {
  id: "HtmlMeasureUtils";
  APPROX_CHAR_WIDTH_RATIO: number;
  parseFontPx(fontString: unknown): number;
  createApproximateMeasureContext(): DyniTextMeasureContext;
  resolveMeasureContext(hostContext: unknown, targetElOrOwnerDocument: unknown): CanvasRenderingContext2D | null;
  measurePx(
    args: unknown,
    htmlUtils: DyniHtmlWidgetUtilsApi,
    tileLayout: DyniTextTileLayoutApi
  ): DyniHtmlMeasureResult | 0 | null;
  measureStyle(args: unknown, htmlUtils: DyniHtmlWidgetUtilsApi, tileLayout: DyniTextTileLayoutApi): string;
  toStyle(px: unknown, htmlUtils: DyniHtmlWidgetUtilsApi): string;
  resolveOwnerDocument(targetEl: unknown): Document | null;
  resolveFitCache(hostContext: unknown, cacheKey: unknown): DyniHtmlFitCache | null;
}

interface DyniHtmlDomPatchUtilsApi {
  id: "HtmlDomPatchUtils";
  patchInnerHtml(rootEl: Element | null | undefined, nextHtml: unknown): Element | null;
}

interface DyniTextMeasureContext {
  font: string;
  measureText(text: unknown): { width: number };
}

interface DyniHtmlMeasureResult {
  px: number;
  text: string;
  width: number;
}

interface DyniHtmlFitCache {
  signature: string;
  result: unknown;
}

// --- GaugeToolkit ----------------------------------------------------------

interface DyniGaugeToolkitApi {
  id: "GaugeToolkit";
  theme: Record<string, unknown> | undefined;
  text: DyniCanvasTextLayoutApi;
  value: DyniValueMathApi;
  resolveSurface(canvas: unknown): DyniCanvasSurface | null;
}

// --- Linear gauge helpers --------------------------------------------------

interface DyniLinearDrawOptions {
  [key: string]: unknown;
}

interface DyniLinearCanvasPrimitivesApi {
  id: "LinearCanvasPrimitives";
  drawTrack(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, opts?: DyniLinearDrawOptions): void;
  drawBand(
    ctx: CanvasRenderingContext2D,
    x0: number,
    x1: number,
    y: number,
    thickness: unknown,
    opts?: DyniLinearDrawOptions
  ): void;
  drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, len: unknown, opts?: DyniLinearDrawOptions): void;
  drawPointer(ctx: CanvasRenderingContext2D, x: number, y: number, opts?: DyniLinearDrawOptions): void;
}

interface DyniLinearGaugeMathApi {
  id: "LinearGaugeMath";
  keyToText: DyniValueMathApi["keyToText"];
  clamp: DyniValueMathApi["clamp"];
  mapValueToX(value: unknown, minV: number, maxV: number, x0: number, x1: number, doClamp?: boolean): number;
  resolveAxisDomain(axisMode: string, range: DyniLinearRange): DyniLinearRange;
  buildTicks(minV: number, maxV: number, majorStepRaw: unknown, minorStepRaw: unknown): DyniLinearTicks;
  formatTickLabel(value: number): string;
}

interface DyniLinearGaugeLayout {
  mode: unknown;
  responsive: DyniResponsiveScaleProfile;
  captionBox?: DyniRect | null;
  valueBox?: DyniRect | null;
  scaleX0: number;
  scaleX1: number;
  trackY: number;
  trackBox: DyniRect;
  inlineBox?: DyniRect | null;
  trackThickness: number;
  trackLineWidth: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  pointerDepth: number;
  pointerSide: number;
  labelFontPx: number;
  labelInsetPx: number;
  dualRowGap?: number;
  textTopBox?: DyniRect | null;
  textBottomBox?: DyniRect | null;
}

interface DyniLinearGaugeLayoutVariantsApi {
  id: "LinearGaugeLayoutVariants";
  computeFlatLayout(
    contentRect: DyniRect,
    right: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
  computeStackedLayout(
    contentRect: DyniRect,
    bottom: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
  computeSplitHighLayout(contentRect: DyniRect, gap: number): DyniLinearLayoutBlock;
  computeGraphicsOnlyFlatLayout(contentRect: DyniRect): DyniLinearLayoutBlock;
  computeGraphicsOnlyNormalLayout(contentRect: DyniRect, right: number): DyniLinearLayoutBlock;
  computeGraphicsOnlyHighLayout(contentRect: DyniRect): DyniLinearLayoutBlock;
  computeInlineLayout(
    contentRect: DyniRect,
    right: number,
    bottom: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
}

interface DyniLinearGaugeLayoutApi {
  id: "LinearGaugeLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): "flat" | "high" | "normal";
  computeInsets(W: unknown, H: unknown): { pad: number; gap: number; responsive: DyniResponsiveScaleProfile };
  createContentRect(W: unknown, H: unknown, insets: { pad: number }): DyniRect;
  computeLayout(args?: unknown): DyniLinearGaugeLayout;
  splitCaptionValueRows(
    captionBox: DyniRect | null | undefined,
    valueBox: DyniRect | null | undefined,
    secScale: unknown
  ): { captionBox: DyniRect | null | undefined; valueBox: DyniRect | null | undefined };
}

interface DyniLinearLayoutThemeSection {
  track: { widthFactor: unknown; lineWidthFactor: unknown };
  ticks: {
    majorLenFactor: unknown;
    majorWidthFactor: unknown;
    minorLenFactor: unknown;
    minorWidthFactor: unknown;
  };
  pointer: { depthFactor: unknown; sideFactor: unknown };
  labels: { fontFactor: unknown; insetFactor: unknown };
}

interface DyniLinearLayoutTheme {
  strokeWeight: unknown;
  pointerDepthWeight: unknown;
  pointerSideWeight: unknown;
  linear: DyniLinearLayoutThemeSection;
}

interface DyniLinearLayoutConfig {
  contentRect?: DyniRect;
  insets?: DyniLinearLayoutInsets;
  W?: unknown;
  H?: unknown;
  gap?: unknown;
  responsive?: DyniResponsiveScaleProfile;
  theme: DyniLinearLayoutTheme;
  mode?: "flat" | "high" | "normal";
  layoutConfig?: Record<string, unknown>;
  hideTextualMetrics?: boolean;
}

interface DyniLinearLayoutBlock {
  scaleX0: number;
  scaleX1: number;
  trackY: number;
  trackBox: DyniRect;
  captionBox: DyniRect | null;
  valueBox: DyniRect | null;
  inlineBox: DyniRect | null;
  dualRowGap: number;
  inlineDualGap: number;
  textTopBox: DyniRect | null;
  textBottomBox: DyniRect | null;
}

interface DyniLinearLayoutInsets {
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniLinearGaugeTheme {
  colors: { pointer: unknown; warning: unknown; alarm: unknown; laylinePort?: unknown; laylineStb?: unknown };
}

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

// --- XTE layout kits -------------------------------------------------------

type DyniXteMode = "flat" | "high" | "normal";

interface DyniXteMetricRects {
  cog: DyniRect;
  btw: DyniRect;
  xte: DyniRect;
  dtw: DyniRect;
}

interface DyniXteLayoutArgs {
  contentRect?: DyniRect;
  responsive?: DyniResponsiveScaleProfile;
  gap?: unknown;
  mode?: unknown;
  hideTextualMetrics?: unknown;
  showWpName?: unknown;
  hasWaypointName?: unknown;
  flatHighwayShare?: unknown;
  flatGaugeShare?: unknown;
  flatHeaderRatio?: unknown;
  highTopRatio?: unknown;
  highHighwayRatio?: unknown;
  highGaugeRatio?: unknown;
  normalHighwayRatio?: unknown;
  normalGaugeRatio?: unknown;
  normalNameHeightRatio?: unknown;
}

interface DyniXteHighwayInsets {
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniXteHighwayLayoutResult {
  mode: DyniXteMode;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  contentRect: DyniRect;
  highway: DyniRect;
  nameRect: DyniRect | null;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteHighwayLayoutApi {
  id: "XteHighwayLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): DyniXteMode;
  computeInsets(W: unknown, H: unknown): DyniXteHighwayInsets;
  createContentRect(W: number, H: number, insets: { pad: number }): DyniRect;
  computeLayout(args?: unknown): DyniXteHighwayLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

interface DyniXteLinearInsets {
  padX: number;
  padY: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniXteLinearLayoutResult {
  mode: DyniXteMode;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  contentRect: DyniRect;
  gaugeBar: DyniRect;
  nameRect: DyniRect | null;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteLinearLayoutApi {
  id: "XteLinearLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): DyniXteMode;
  computeInsets(W: unknown, H: unknown): DyniXteLinearInsets;
  createContentRect(W: unknown, H: unknown, insets?: Record<string, unknown>): DyniRect;
  computeLayout(args?: unknown): DyniXteLinearLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

type DyniXteLinearData = Record<string, unknown> & {
  disconnect?: unknown;
  wpName?: unknown;
  xte?: unknown;
  cog?: unknown;
  dtw?: unknown;
  btw?: unknown;
};

type DyniXteLinearLayoutConfig = Record<string, unknown> & {
  easing?: unknown;
  hideTextualMetrics?: unknown;
  showWpName?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  tickMajor?: unknown;
  tickMinor?: unknown;
  showEndLabels?: unknown;
  leadingZero?: unknown;
};

interface DyniXteLinearThemeSection {
  widthFactor?: unknown;
  lineWidthFactor?: unknown;
  majorLenFactor?: unknown;
  majorWidthFactor?: unknown;
  minorLenFactor?: unknown;
  minorWidthFactor?: unknown;
  depthFactor?: unknown;
  sideFactor?: unknown;
  fontFactor?: unknown;
  insetFactor?: unknown;
}

type DyniXteLinearTheme = DyniRadialResolvedTheme & {
  surface: { fg: string };
  colors: { pointer: string; alarm: string };
  linear: {
    track: DyniXteLinearThemeSection;
    ticks: DyniXteLinearThemeSection;
    pointer: DyniXteLinearThemeSection;
    labels: DyniXteLinearThemeSection;
  };
};

interface DyniXteLinearThemeResolver {
  resolveForRoot(rootEl: unknown): DyniXteLinearTheme;
}

type DyniXteLinearToolkit = DyniGaugeToolkitApi & {
  theme: DyniXteLinearThemeResolver;
};

type DyniXteLinearContext = DyniComponentContext & {
  canvas: DyniCanvasHostApi;
};

interface DyniXteLinearGeometry {
  primaryDim: number;
  trackThickness: number;
  trackLineWidth: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  pointerDepth: number;
  pointerSide: number;
  x0: number;
  x1: number;
  trackY: number;
  labelFontPx: number;
  labelInset: number;
}

interface DyniXteDisplayNormalizedProps {
  display: Record<string, unknown>;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  formatUnits: Record<string, unknown>;
  layoutConfig: Record<string, unknown>;
  easingEnabled: boolean;
  hideTextualMetrics: boolean;
  xteScale: number;
}

interface DyniXteDisplayPropsNormalizeApi {
  read(p: DyniWidgetValues): DyniXteDisplayNormalizedProps;
}

interface DyniXteRenderThemeView {
  family: unknown;
  labelWeight: unknown;
  [key: string]: unknown;
}

interface DyniXteRenderSetupArgs {
  componentContext: DyniComponentContext & {
    canvas: DyniCanvasHostApi;
    dom: { requirePluginRoot(target: unknown): unknown };
  };
  toolkit: { theme: { resolveForRoot(rootEl: unknown): unknown } };
  canvas: HTMLCanvasElement;
  props: DyniWidgetValues;
  resolveThemeView(theme: unknown, stableDigitsEnabled: boolean): DyniXteRenderThemeView;
  resolveStateKind(props: DyniWidgetValues): string;
  stateScreenLabels: { KINDS: Readonly<Record<string, string>> };
  stateScreenCanvasOverlay: { drawStateScreen(args: Record<string, unknown>): void };
  stateScreenColor(theme: unknown, themeView: DyniXteRenderThemeView): string;
}

interface DyniXteRenderSetupResult {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  theme: unknown;
  themeView: DyniXteRenderThemeView;
}

interface DyniXteDisplayRenderSetupApi {
  resolveRenderSetup(args: DyniXteRenderSetupArgs): DyniXteRenderSetupResult | null;
}

interface DyniXteDynamicXteResult {
  xteNumber: number | undefined;
  xteAvailable: boolean;
  xteDistance: string;
  xteDistanceMissing: boolean;
  xteSide: string;
  defaultText: string;
  dtwDistance: string;
  cogRaw: unknown;
  btwRaw: unknown;
  headingParams: [boolean];
}

interface DyniXteDisplayMetricsBuildResult {
  metricSpacing: Record<"cog" | "xte" | "dtw" | "btw", DyniIntrinsicTileSpacing>;
  metrics: Record<"cog" | "xte" | "dtw" | "btw", { caption: unknown; value: string; unit: unknown }>;
}

interface DyniXteDynamicOptions {
  springMotion: DyniSpringMotion;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  geom: DyniHighwayGeom;
  colors: DyniHighwayColors;
  primaryDim: number;
  theme: DyniRadialResolvedTheme;
  display: Record<string, unknown>;
  formatUnits: Record<string, unknown>;
  layoutConfig: Record<string, unknown>;
  props: DyniWidgetValues;
  xteScale: number;
  easingEnabled: boolean;
}

interface DyniXteStableDigitsOptions {
  ctx: CanvasRenderingContext2D;
  xteDistance: string;
  xteSide: string;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  layout: DyniXteHighwayLayoutResult;
  metricSpacing: Record<"cog" | "xte" | "dtw" | "btw", DyniIntrinsicTileSpacing>;
  metricRects: DyniXteMetricRects;
}

interface DyniXteMetricsOptions {
  ctx: CanvasRenderingContext2D;
  dyn: DyniXteDynamicXteResult;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  stableDigitsEnabled: boolean;
  themeView: DyniXteRenderThemeView;
  layout: DyniXteHighwayLayoutResult;
  metricRects: DyniXteMetricRects;
}

interface DyniXteDisplayMetricsApi {
  resolveAndDrawDynamicXte(options: DyniXteDynamicOptions): DyniXteDynamicXteResult;
  buildXteMetrics(options: DyniXteMetricsOptions): DyniXteDisplayMetricsBuildResult;
}

interface DyniXteLinearEndLabelOptions {
  ctx: CanvasRenderingContext2D;
  theme: DyniXteLinearTheme;
  geom: DyniXteLinearGeometry;
  ticks: DyniLinearTicks;
  showEndLabels: boolean;
  family: unknown;
  labelWeight: unknown;
}

interface DyniXteLinearPrimitivesApi {
  resolveGeometry(layout: DyniXteLinearLayoutResult, theme: DyniXteLinearTheme): DyniXteLinearGeometry;
  drawEndLabels(options: DyniXteLinearEndLabelOptions): void;
  drawPointerUpward(ctx: CanvasRenderingContext2D, x: number, geom: DyniXteLinearGeometry, color: string): void;
  drawTrackLayer(ctx: CanvasRenderingContext2D, geom: DyniXteLinearGeometry, color: string): void;
  drawTicksLayer(
    ctx: CanvasRenderingContext2D,
    geom: DyniXteLinearGeometry,
    ticks: DyniLinearTicks,
    xteScale: number,
    color: string
  ): void;
}

interface DyniXteLinearDynamicResult {
  xteNumber: number | undefined;
  xteHasValue: boolean;
  defaultText: string;
  xteDistance: string;
  xteDistanceMissing: boolean;
}

interface DyniXteLinearMetricsResult {
  cog: { caption: unknown; value: string; unit: unknown };
  xte: { caption: unknown; value: string; unit: unknown };
  dtw: { caption: unknown; value: string; unit: unknown };
  btw: { caption: unknown; value: string; unit: unknown };
}

interface DyniXteLinearPointerOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  geom: DyniXteLinearGeometry;
  theme: DyniXteLinearTheme;
  display: DyniXteLinearData;
  formatUnits: DyniXteLinearData;
  props: DyniWidgetValues;
  xteScale: number;
  easingEnabled: boolean;
}

interface DyniXteLinearStableDigitsOptions {
  ctx: CanvasRenderingContext2D;
  xteDistance: string;
  xteSide: string;
  captions: DyniXteLinearData;
  units: DyniXteLinearData;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  layout: DyniXteLinearLayoutResult;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteLinearMetricsOptions {
  display: DyniXteLinearData;
  formatUnits: DyniXteLinearData;
  layoutConfig: DyniXteLinearLayoutConfig;
  defaultText: string;
  xteValueText: string;
  captions: DyniXteLinearData;
  units: DyniXteLinearData;
}

interface DyniXteLinearDynamicMetricsApi {
  isPointerMotionActive(canvas: HTMLCanvasElement): boolean;
  resolveAndDrawLinearPointer(options: DyniXteLinearPointerOptions): DyniXteLinearDynamicResult;
  resolveStableDigitsXteTextLinear(options: DyniXteLinearStableDigitsOptions): string;
  buildLinearMetrics(options: DyniXteLinearMetricsOptions): DyniXteLinearMetricsResult;
}

// --- XteHighwayPrimitives --------------------------------------------------

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

// --- state-screen kits -----------------------------------------------------

interface DyniStateScreenDrawArgs {
  kind?: unknown;
  ctx?: CanvasRenderingContext2D | null;
  W?: unknown;
  H?: unknown;
  color?: unknown;
  label?: unknown;
  labelWeight?: unknown;
  family?: unknown;
}

interface DyniStateScreenCanvasOverlayApi {
  id: "StateScreenCanvasOverlay";
  drawStateScreen(args?: unknown): void;
  setFont: DyniCanvasTextFittingApi["setFont"];
}

interface DyniStateScreenRenderArgs {
  htmlUtils?: DyniHtmlWidgetUtilsApi;
  kind?: unknown;
  wrapperClasses?: unknown;
  label?: unknown;
  extraAttrs?: unknown;
  labelStyle?: unknown;
  fitStyle?: unknown;
  shellRect?: unknown;
  availableRect?: unknown;
  textApi?: unknown;
  measureCtx?: unknown;
  fontFamily?: unknown;
  fontWeight?: unknown;
  hostContext?: unknown;
  targetEl?: unknown;
  ownerDocument?: unknown;
}

interface DyniStateScreenMarkupApi {
  id: "StateScreenMarkup";
  renderStateScreen(args?: unknown): string;
}

interface DyniStateScreenSizeRect {
  width?: unknown;
  height?: unknown;
}

interface DyniStateScreenTextFitArgs {
  label?: unknown;
  shellRect?: DyniStateScreenSizeRect | null;
  availableRect?: DyniStateScreenSizeRect | null;
  measureCtx?: CanvasRenderingContext2D | null;
  textApi?: DyniStateScreenTextApi | null;
  family?: unknown;
  weight?: unknown;
  hostContext?: unknown;
  targetEl?: unknown;
  ownerDocument?: unknown;
}

interface DyniStateScreenTextApi {
  fitSingleTextPx(
    ctx: CanvasRenderingContext2D,
    text: unknown,
    basePx: unknown,
    maxW: unknown,
    maxH: unknown,
    family: unknown,
    weight: unknown
  ): number;
}

interface DyniStateScreenTextFitApi {
  id: "StateScreenTextFit";
  compute(args?: unknown): string;
}

// --- nav kits --------------------------------------------------------------

interface DyniNavInteractionPolicyApi {
  id: "NavInteractionPolicy";
  canDispatchWhenNotEditing(props: unknown): boolean;
  openActiveRoute(props: unknown): boolean;
}

type DyniActiveRouteLayoutMode = "flat" | "high" | "normal";

interface DyniActiveRouteInsets {
  padX: number;
  innerY: number;
  gap: number;
  namePadX: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniActiveRouteMetricRects {
  remain?: DyniRect;
  rteEta?: DyniRect;
  next?: DyniRect;
  [key: string]: DyniRect | undefined;
}

interface DyniActiveRouteLayoutResult {
  mode: DyniActiveRouteLayoutMode;
  gap: number;
  namePadX: number;
  responsive: DyniResponsiveScaleProfile;
  nameRect: DyniRect;
  metricRects: DyniActiveRouteMetricRects;
}

interface DyniActiveRouteLayoutArgs {
  contentRect?: DyniRect;
  responsive?: DyniResponsiveScaleProfile;
  gap?: unknown;
  namePadX?: unknown;
  mode?: unknown;
  isApproaching?: unknown;
  flatNameShare?: unknown;
  highNameBandRatio?: unknown;
  normalNameBandRatio?: unknown;
}

interface DyniActiveRouteLayoutApi {
  id: "ActiveRouteLayout";
  computeInsets(W: unknown, H: unknown): DyniActiveRouteInsets;
  createContentRect(W: unknown, H: unknown, insets?: Partial<DyniActiveRouteInsets>): DyniRect;
  computeLayout(args?: DyniActiveRouteLayoutArgs): DyniActiveRouteLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

interface DyniActiveRouteDisplayProps {
  display: DyniActiveRouteData;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  formatUnits?: Record<string, unknown>;
  wpServer?: unknown;
  stableDigits?: unknown;
  default: unknown;
  [key: string]: unknown;
}

interface DyniActiveRouteData {
  disconnect?: unknown;
  routeName?: unknown;
  isApproaching?: unknown;
  hideSeconds?: unknown;
  remain?: unknown;
  rteEta?: unknown;
  nextCourse?: unknown;
  [key: string]: unknown;
}

interface DyniActiveRouteRenderModel {
  kind: string;
  stateLabel: string;
  mode: DyniActiveRouteLayoutMode;
  isApproaching: boolean;
  disconnect?: boolean;
  stableDigitsEnabled: boolean;
  routeNameText: string;
  remainCaption: string;
  remainText: string;
  remainPlainText: string;
  remainUnit: string;
  etaCaption: string;
  etaText: string;
  etaPlainText: string;
  etaUnit: string;
  nextCourseCaption: string;
  nextCourseText: string;
  nextCoursePlainText: string;
  nextCourseUnit: string;
  interactionState: unknown;
}

interface DyniActiveRouteMetricSpec extends DyniMetricTileSpec {}

interface DyniActiveRouteMetricStyle {
  captionStyle: string;
  valueStyle: string;
  unitStyle: string;
  gapStyle: string;
}

interface DyniActiveRouteMarkupFit {
  routeNameStyle: string;
  metrics: Record<string, DyniActiveRouteMetricStyle>;
  metricValues?: Record<string, string>;
}

interface DyniActiveRouteHtmlFitArgs {
  model?: DyniActiveRouteRenderModel | null;
  shellRect?: DyniHtmlShellRect | null;
  hostContext?: unknown;
  targetEl?: unknown;
}

interface DyniActiveRouteFitSignatureArgs {
  width?: number;
  height?: number;
  family?: string;
  valueFamily?: string;
  valueWeight?: unknown;
  labelWeight?: unknown;
  model?: DyniActiveRouteRenderModel | null;
}

interface DyniActiveRouteFitCache {
  signature?: string;
  result?: DyniActiveRouteMarkupFit;
}

interface DyniActiveRouteThemeTokens {
  font: {
    weight: unknown;
    labelWeight: unknown;
    family: string;
    familyMono?: string;
  };
}

interface DyniActiveRouteThemeResolver {
  resolveForRoot(rootEl: unknown): DyniActiveRouteThemeTokens;
}

type DyniActiveRouteContext = DyniComponentContext & {
  theme: { tokens: DyniActiveRouteThemeResolver };
};

interface DyniActiveRouteHtmlFitApi {
  id: "ActiveRouteHtmlFit";
  compute(args?: DyniActiveRouteHtmlFitArgs): DyniActiveRouteMarkupFit | null;
  ensureDisplayProps(props: unknown): DyniActiveRouteDisplayProps;
  resolveDisplayMode(
    props: unknown,
    shellRect: DyniHtmlShellRect | null | undefined,
    htmlUtils: DyniHtmlWidgetUtilsApi
  ): DyniActiveRouteLayoutMode;
  formatActiveRouteMetric(
    rawValue: unknown,
    formatter: unknown,
    formatterParameters: unknown,
    defaultText: unknown,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): string;
  textLength: DyniValueMathApi["textLength"];
  normalizeStableValue(
    rawText: string,
    stableDigitsEnabled: boolean,
    stableDigits: DyniStableDigitsApi,
    minWidth: number
  ): DyniStableDigitsTextPair;
}

interface DyniActiveRouteHtmlFitModule {
  id: "ActiveRouteHtmlFit";
  create(def: unknown, componentContext: DyniComponentContext): DyniActiveRouteHtmlFitApi;
}

type DyniAisTargetLayoutMode = "flat" | "high" | "normal";

type DyniAisTargetMetricId = "dst" | "cpa" | "tcpa" | "brg";

interface DyniAisTargetVerticalShellProfileArgs {
  W?: unknown;
  H?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetVerticalShellProfile {
  isVerticalCommitted: boolean;
  forceHigh: boolean;
  effectiveLayoutHeight: number;
  wrapperStyle: "";
  aspectRatio: "" | "7/8";
  minHeight: "" | "8em";
}

interface DyniAisTargetModeArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
}

interface DyniAisTargetAccentChrome {
  accentWidth: number;
  accentGap: number;
  accentReserve: number;
}

interface DyniAisTargetInsets extends DyniAisTargetAccentChrome {
  padX: number;
  padY: number;
  identityGap: number;
  identityMetricsGap: number;
  metricGridGap: number;
  responsive: DyniResponsiveScaleProfile;
}

type DyniAisTargetMetricVisibility = Record<DyniAisTargetMetricId, boolean>;

interface DyniAisTargetVisualChromeArgs extends DyniAisTargetModeArgs {
  W?: unknown;
  H?: unknown;
  hasAccent?: unknown;
  mode?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetVisualChrome {
  mode: DyniAisTargetLayoutMode;
  shellWidth: number;
  shellHeight: number;
  effectiveLayoutHeight: number;
  isVerticalCommitted: boolean;
  padX: number;
  padY: number;
  accentWidth: number;
  accentGap: number;
  accentReserve: number;
  stripLeft: number;
  stripTop: number;
  stripBottom: number;
  stripWidth: number;
  stripRadius: number;
  contentLeft: number;
  contentRight: number;
  contentTop: number;
  contentBottom: number;
}

interface DyniAisTargetLayoutSizingApi {
  id: "AisTargetLayoutSizing";
  computeVerticalShellProfile(args?: DyniAisTargetVerticalShellProfileArgs): DyniAisTargetVerticalShellProfile;
  resolveMode(args?: DyniAisTargetModeArgs): DyniAisTargetLayoutMode;
  computeInsets(
    W: unknown,
    H: unknown,
    isVerticalCommitted: boolean,
    mode: DyniAisTargetLayoutMode,
    hasAccent: boolean
  ): DyniAisTargetInsets;
  createContentRect(W: unknown, H: unknown, insets?: DyniAisTargetInsets): DyniRect;
  resolveVisualChrome(args?: DyniAisTargetVisualChromeArgs): DyniAisTargetVisualChrome;
  resolveMetricVisibility(renderState: unknown): DyniAisTargetMetricVisibility;
  resolveMetricOrder(renderState: unknown): DyniAisTargetMetricId[];
  constants: {
    METRIC_ORDER: DyniAisTargetMetricId[];
    VERTICAL_ASPECT_RATIO: { width: number; height: number };
    VERTICAL_MIN_HEIGHT: string;
    RESPONSIVE_SCALES: Record<string, number>;
  };
}

interface DyniAisTargetLayoutArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  renderState?: unknown;
  showTcpaBranch?: unknown;
  hasAccent?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetComputedLayout {
  mode: DyniAisTargetLayoutMode;
  renderState: DyniAisTargetRenderState;
  showTcpaBranch: boolean;
  responsive: DyniResponsiveScaleProfile;
  isVerticalCommitted: boolean;
  verticalShell: DyniAisTargetVerticalShellProfile;
  shellWidth: number;
  shellHeight: number;
  effectiveLayoutHeight: number;
  hasAccent: boolean;
  insets: DyniAisTargetInsets;
  contentRect: DyniRect;
  accentRect: DyniRect | null;
  placeholderRect: DyniRect;
  identityRect: DyniRect | null;
  wrapperStyle: string;
  inlineGeometry: DyniAisTargetInlineGeometry | null;
  nameRect: DyniRect | null;
  frontRect: DyniRect | null;
  metricsRect: DyniRect | null;
  metricBoxes: Partial<Record<DyniAisTargetMetricId, DyniAisTargetMetricBox>>;
  metricVisibility: DyniAisTargetMetricVisibility;
  metricOrder: DyniAisTargetMetricId[];
}

type DyniAisTargetRenderState = "data" | "hidden" | "placeholder";

interface DyniAisTargetIdentityLayout {
  identityRect: DyniRect;
  nameRect: DyniRect;
  frontRect: DyniRect;
  metricsRect: DyniRect;
}

interface DyniAisTargetLayoutApi {
  id: "AisTargetLayout";
  computeVerticalShellProfile: DyniAisTargetLayoutSizingApi["computeVerticalShellProfile"];
  resolveMode: DyniAisTargetLayoutSizingApi["resolveMode"];
  computeInsets: DyniAisTargetLayoutSizingApi["computeInsets"];
  createContentRect: DyniAisTargetLayoutSizingApi["createContentRect"];
  computeLayout(args?: DyniAisTargetLayoutArgs): DyniAisTargetComputedLayout;
  constants: DyniAisTargetLayoutSizingApi["constants"];
}

interface DyniAisTargetLayoutModule {
  id: "AisTargetLayout";
  create(def: unknown, componentContext: DyniComponentContext): DyniAisTargetLayoutApi;
}

interface DyniAisTargetShellSize {
  width: number;
  height: number;
}

interface DyniAisTargetFormatterArgs {
  value?: unknown;
  formatter?: unknown;
  formatterParameters?: unknown;
  defaultText?: unknown;
}

interface DyniAisTargetStateArgs {
  domain?: unknown;
  isEditingMode?: unknown;
  pageId?: unknown;
  isVerticalContainer?: unknown;
  disconnect?: unknown;
}

interface DyniAisTargetInteractionArgs {
  kind?: unknown;
  canDispatch?: unknown;
  isEditingMode?: unknown;
}

interface DyniAisTargetNormalizedMetricValue {
  valueText: unknown;
  plainValueText: unknown;
}

interface DyniAisTargetBuildModelArgs {
  props?: unknown;
  shellRect?: unknown;
  mode?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetRenderModel {
  kind: string;
  stateLabel: string;
  mode: DyniAisTargetLayoutMode;
  interactionState: string;
  showTcpaBranch: boolean;
  shellWidth: number;
  shellHeight: number;
  isVerticalCommitted: boolean;
  effectiveLayoutHeight: number;
  wrapperStyle: string;
  inlineGeometry: Partial<DyniAisTargetInlineGeometry>;
  layout: DyniAisTargetComputedLayout;
  captureClicks: boolean;
  showHotspot: boolean;
  stableDigitsEnabled: boolean;
  dispatchMmsi: string;
  nameText: string;
  frontText: string;
  metrics: Record<DyniAisTargetMetricId, DyniAisTargetMetricText & DyniAisTargetNormalizedMetricValue>;
  metricVisibility: DyniAisTargetMetricVisibility;
  visibleMetricIds: DyniAisTargetMetricId[];
  colorRole: string;
  hasAccent: boolean;
  wrapperClasses: string[];
  resizeSignatureParts: Array<string | number>;
}

interface DyniAisTargetRenderModelApi {
  id: "AisTargetRenderModel";
  buildModel(args?: DyniAisTargetBuildModelArgs): DyniAisTargetRenderModel;
  buildResizeSignatureParts(model?: Partial<DyniAisTargetRenderModel>): Array<string | number>;
}

interface DyniAisTargetThemeColors {
  ais?: Record<string, unknown>;
}

interface DyniAisTargetThemeFont {
  family: unknown;
  familyMono?: unknown;
  weight: unknown;
  labelWeight: unknown;
}

interface DyniAisTargetThemeTokens {
  colors?: DyniAisTargetThemeColors;
  font: DyniAisTargetThemeFont;
}

interface DyniAisTargetThemeResolver {
  resolveForRoot(rootEl: unknown): DyniAisTargetThemeTokens;
}

interface DyniAisTargetTypography {
  tokens: DyniAisTargetThemeTokens;
  family: unknown;
  monoFamily: unknown;
}

interface DyniAisTargetMetricValueFitArgs {
  rect: DyniRect;
  valueText?: unknown;
  plainText?: unknown;
  textApi?: DyniCanvasTextLayoutApi;
  ctx?: CanvasRenderingContext2D;
  family?: unknown;
  weight?: unknown;
  textFillScale?: unknown;
}

interface DyniAisTargetMetricValueFit {
  valueText: string;
  valuePx: number;
}

interface DyniAisTargetMetricBoxDetails {
  captionRect: DyniRect | null;
  labelRect: DyniRect | null;
  valueRect: DyniRect | null;
  valueTextRect: DyniRect | null;
  unitRect: DyniRect | null;
}

interface DyniAisTargetMetricBox extends DyniAisTargetMetricBoxDetails, DyniRect {}

interface DyniAisTargetStackedMetricRects {
  captionRect: DyniRect;
  valueRect: DyniRect;
  unitRect: DyniRect;
}

interface DyniAisTargetInlineMetricRects {
  labelRect: DyniRect;
  valueRect: DyniRect;
  valueTextRect: DyniRect;
  unitRect: DyniRect;
}

interface DyniAisTargetInlineMetricSettings {
  labelShare: number;
  labelMinRatio: number;
  labelMaxRatio: number;
  unitShare: number;
  unitMinPx: number;
  unitMaxRatio: number;
  gapRatio: number;
  padXRatio: number;
  padYRatio: number;
  padXFloorPx: number;
  padYFloorPx: number;
  maxPadXTileRatio: number;
  maxPadYTileRatio: number;
}

interface DyniAisTargetInlineMetricBoxOptions {
  mode?: unknown;
}

interface DyniAisTargetWrapperPaddings {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface DyniAisTargetGeometryLayout {
  contentRect?: DyniRect | null;
  shellWidth?: unknown;
  effectiveLayoutHeight?: unknown;
  renderState?: unknown;
  mode?: DyniAisTargetLayoutMode | unknown;
  identityRect?: DyniRect | null;
  nameRect?: DyniRect | null;
  frontRect?: DyniRect | null;
  metricsRect?: DyniRect | null;
  metricBoxes?: Partial<Record<DyniAisTargetMetricId, DyniAisTargetMetricBox>>;
  metricOrder?: DyniAisTargetMetricId[];
  accentRect?: DyniRect | null;
  hasAccent?: unknown;
}

interface DyniAisTargetLayoutGeometryApi {
  id: "AisTargetLayoutGeometry";
  createInlineMetricBox(
    tileRect: DyniRect,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi,
    makeRect: DyniMakeRect,
    options?: DyniAisTargetInlineMetricBoxOptions
  ): DyniAisTargetMetricBox;
  createStackedMetricBox(
    tileRect: DyniRect,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi,
    makeRect: DyniMakeRect
  ): DyniAisTargetMetricBox;
  computeInlineGeometry(layout: unknown): DyniAisTargetInlineGeometry;
}

interface DyniAisTargetLayoutGeometryStylesApi {
  id: "AisTargetLayoutGeometryStyles";
  computeInlineGeometry(layout?: DyniAisTargetGeometryLayout): DyniAisTargetInlineGeometry;
}

interface DyniAisTargetHtmlFitArgs {
  model?: DyniAisTargetRenderModel;
  shellRect?: DyniHtmlShellRect;
  targetEl?: unknown;
  hostContext?: unknown;
}

interface DyniAisTargetHtmlFitApi {
  id: "AisTargetHtmlFit";
  compute(args?: DyniAisTargetHtmlFitArgs): DyniAisTargetMarkupFit | null;
}

interface DyniAisTargetMetricText {
  captionText?: unknown;
  valueText?: unknown;
  unitText?: unknown;
}

interface DyniAisTargetMetricGeometry {
  metricStyle?: unknown;
  valueRowStyle?: unknown;
}

interface DyniAisTargetInlineGeometry {
  wrapperStyle?: unknown;
  identityStyle?: unknown;
  metricsStyle?: unknown;
  accentStyle?: unknown;
  metricStyles: Record<string, DyniAisTargetMetricGeometry>;
}

interface DyniAisTargetMarkupModel {
  kind?: unknown;
  mode?: unknown;
  stateLabel?: unknown;
  showHotspot?: unknown;
  hasAccent?: unknown;
  stableDigitsEnabled?: unknown;
  wrapperStyle?: unknown;
  wrapperClasses: string[];
  inlineGeometry: DyniAisTargetInlineGeometry;
  nameText?: unknown;
  frontText?: unknown;
  visibleMetricIds: string[];
  metrics: Record<string, DyniAisTargetMetricText>;
}

interface DyniAisTargetMetricFit {
  captionStyle?: unknown;
  valueRowStyle?: unknown;
  valueStyle?: unknown;
  unitStyle?: unknown;
  valueText?: unknown;
}

interface DyniAisTargetMarkupFit {
  nameStyle?: unknown;
  frontStyle?: unknown;
  placeholderStyle?: unknown;
  accentStyle?: unknown;
  metrics: Record<string, DyniAisTargetMetricFit>;
}

interface DyniAisTargetMetricRenderArgs {
  metricId: string;
  mode?: unknown;
  metric?: DyniAisTargetMetricText;
  metricFit?: DyniAisTargetMetricFit;
  metricGeometry?: DyniAisTargetMetricGeometry;
  stableDigitsEnabled?: unknown;
  htmlUtils: DyniHtmlWidgetUtilsApi;
}

interface DyniAisTargetMarkupRenderArgs {
  model: DyniAisTargetMarkupModel;
  fit: DyniAisTargetMarkupFit;
  htmlUtils: DyniHtmlWidgetUtilsApi;
  shellRect?: unknown;
  fontFamily?: unknown;
  fontWeight?: unknown;
}

interface DyniAisTargetMarkupApi {
  id: "AisTargetMarkup";
  render(args?: unknown): string;
}

interface DyniRoutePointsRowPolicy {
  showOrdinal: boolean;
}

interface DyniRoutePointsRowPolicyArgs {
  mode?: unknown;
  isVerticalContainer?: unknown;
  policy?: { showOrdinal?: unknown };
}

interface DyniRoutePointsRowCells {
  rowRect: DyniRect;
  showOrdinal: boolean;
  ordinalRect: DyniRect;
  middleRect: DyniRect;
  nameRect: DyniRect;
  infoRect: DyniRect;
  markerRect: DyniRect;
  markerDiameter: number;
}

interface DyniRoutePointsRowCellsArgs extends DyniRoutePointsRowPolicyArgs {
  rowRect?: DyniRect;
  innerRect?: DyniRect;
  squareSize?: unknown;
  markerCellWidth?: unknown;
  markerDiameter?: unknown;
  innerGap?: unknown;
  rowPadding?: unknown;
  rowGap?: unknown;
  trailingGutterPx?: unknown;
  showOrdinal?: unknown;
}

interface DyniRoutePointsRowGeometryApi {
  id: "RoutePointsRowGeometry";
  resolveRowPolicy(args?: DyniRoutePointsRowPolicyArgs): DyniRoutePointsRowPolicy;
  buildRowCells(args?: DyniRoutePointsRowCellsArgs): DyniRoutePointsRowCells;
}

interface DyniRoutePointsLayoutSizingConstants {
  HEADER_HEIGHT_FLOOR_ROWS_NORMAL: number;
  HEADER_HEIGHT_FLOOR_ROWS_HIGH: number;
  HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_NORMAL: number;
  HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_HIGH: number;
  HEADER_NARROW_VERTICAL_WIDTH_TO_ROW_RATIO: number;
  MARKER_DIAMETER_RATIO: number;
  MARKER_DIAMETER_MIN_PX: number;
  MARKER_DIAMETER_MAX_PX: number;
  MARKER_CELL_PADDING_X_RATIO: number;
  MARKER_CELL_PADDING_X_MIN_PX: number;
  MARKER_CELL_PADDING_X_MAX_PX: number;
}

interface DyniRoutePointsMarkerCellWidthArgs {
  markerDiameter?: unknown;
  maxWidth?: unknown;
}

interface DyniRoutePointsHeaderHeightArgs {
  mode?: unknown;
  existingHeaderHeight?: unknown;
  rowHeight?: unknown;
  isVerticalContainer?: unknown;
  contentWidth?: unknown;
}

interface DyniRoutePointsLayoutSizingApi {
  id: "RoutePointsLayoutSizing";
  constants: DyniRoutePointsLayoutSizingConstants;
  clampNumber: DyniValueMathApi["clampNumber"];
  toCount(value: unknown): number;
  toSizeStyle(rect?: Pick<DyniRect, "w" | "h"> | null): string;
  resolveWindowViewportHeight(): number;
  computeMarkerDiameter(rowHeight: unknown): number;
  computeMarkerCellPaddingX(markerDiameterPx: unknown): number;
  computeMarkerCellWidth(args?: DyniRoutePointsMarkerCellWidthArgs): number;
  toMarkerDotStyle(markerDiameterPx: unknown): string;
  computeHeaderHeight(args?: DyniRoutePointsHeaderHeightArgs): number;
}

interface DyniRoutePointInfoPoint {
  lat?: unknown;
  lon?: unknown;
}

interface DyniRoutePointsInfoTextArgs {
  index: number;
  showLatLon: boolean;
  previousPoint: DyniRoutePointInfoPoint | null;
  currentPoint: DyniRoutePointInfoPoint;
  previousValid: boolean;
  currentValid: boolean;
  useRhumbLine: boolean;
  formatDistanceUnit: unknown;
  distanceUnit: string;
  courseUnit: string;
  defaultText: string;
  centerMath: DyniCenterDisplayMathApi;
  stableDigitsEnabled: boolean;
  stableDigits: DyniStableDigitsApi;
  placeholderValue: string;
}

interface DyniRoutePointsInfoTextResult {
  valueText: string;
  plainValueText: string;
}

interface DyniRoutePointsInfoTextApi {
  id: "RoutePointsInfoText";
  buildRowInfoText(args?: unknown): DyniRoutePointsInfoTextResult;
}

interface DyniRoutePointsInfoFitArgs {
  rect: DyniRect;
  valueText?: unknown;
  plainText?: unknown;
  maxPxRatio?: unknown;
  textApi: DyniCanvasTextLayoutApi;
  ctx: CanvasRenderingContext2D;
  textFillScale?: unknown;
  family?: unknown;
  weight?: unknown;
}

interface DyniRoutePointsInfoFit {
  text: string;
  px: number;
}

interface DyniRoutePointsHeaderTexts {
  routeNameText: string;
  metaText: string;
}

interface DyniRoutePointsRowTexts {
  ordinalText: string;
  nameText: string;
  infoText: string;
  infoPlainText: string;
}

interface DyniRoutePointsHtmlFitModel {
  mode: "flat" | "high" | "normal";
  points?: unknown;
  pointCount?: unknown;
  routeNameText?: unknown;
  routeName?: unknown;
  metaText?: unknown;
  waypointsText?: unknown;
  layoutShellHeight?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalContainer?: unknown;
  showHeader?: unknown;
  scrollbarGutterPx?: unknown;
  stableDigitsEnabled?: unknown;
  showLatLon?: unknown;
  hasRoute?: unknown;
  emptyText?: unknown;
}

interface DyniRoutePointsThemeTokens {
  font: {
    family: string;
    familyMono?: string;
    weight: unknown;
    labelWeight: unknown;
  };
}

interface DyniRoutePointsThemeResolver {
  resolveForRoot(rootEl: unknown): DyniRoutePointsThemeTokens;
}

interface DyniRoutePointsFitEnvironmentArgs {
  componentContext: DyniComponentContext;
  theme: DyniRoutePointsThemeResolver;
  targetEl: unknown;
  hostContext: unknown;
  htmlMeasureUtils: DyniHtmlMeasureUtilsApi;
}

interface DyniRoutePointsFitEnvironment {
  measureCtx: CanvasRenderingContext2D;
  family: string;
  monoFamily: string;
  valueWeight: unknown;
  labelWeight: unknown;
}

interface DyniRoutePointsLayoutRow {
  ordinalRect: DyniRect;
  nameRect: DyniRect;
  infoRect: DyniRect;
}

interface DyniRoutePointsLayoutResult {
  responsive: DyniResponsiveScaleProfile;
  showHeader: boolean;
  headerLayout: { routeNameRect: DyniRect; metaRect: DyniRect } | null;
  rows: DyniRoutePointsLayoutRow[];
}

interface DyniRoutePointsLayoutApi {
  id: "RoutePointsLayout";
  computeInsets(W: unknown, H: unknown): { responsive: DyniResponsiveScaleProfile; [key: string]: unknown };
  createContentRect(W: unknown, H: unknown, insets: Record<string, unknown>): DyniRect;
  computeLayout(args?: unknown): DyniRoutePointsLayoutResult;
}

interface DyniRoutePointsHtmlFitRow {
  ordinalStyle: string;
  nameStyle: string;
  infoStyle: string;
  infoText: string;
}

interface DyniRoutePointsHtmlFitResult {
  headerFit: { routeNameStyle: string; metaStyle: string } | null;
  rowFits: DyniRoutePointsHtmlFitRow[];
  emptyStyle: string;
}

interface DyniRoutePointsHtmlFitArgs {
  model?: DyniRoutePointsHtmlFitModel | null;
  shellRect?: DyniHtmlShellRect | null;
  targetEl?: unknown;
  hostContext?: unknown;
}

interface DyniRoutePointsHtmlFitApi {
  id: "RoutePointsHtmlFit";
  compute(args?: DyniRoutePointsHtmlFitArgs): DyniRoutePointsHtmlFitResult | null;
  buildRowInfoText: DyniRoutePointsInfoTextApi["buildRowInfoText"];
}

interface DyniRoutePointsRenderModel {
  kind: string;
  stateLabel: string;
  interactionState: string;
  mode: "flat" | "high" | "normal";
  showHeader: boolean;
  hasRoute: boolean;
  routeNameText: string;
  metaText: string;
  showLatLon: boolean;
  stableDigitsEnabled: boolean;
  isActiveRoute: boolean;
  points: Array<{
    index: number;
    ordinalText: string;
    nameText: string;
    infoText: string;
    infoPlainText: string;
    selected: boolean;
    pointSnapshot: unknown;
  }>;
  inlineGeometry: DyniRoutePointsInlineGeometry;
  selectedIndex: number;
  activeWaypointKey: string | null;
  hasValidSelection: boolean;
  canActivateRoutePoint: boolean;
  resizeSignatureParts: Array<string | number>;
  [key: string]: unknown;
}

interface DyniRoutePointsRenderModelApi {
  id: "RoutePointsRenderModel";
  buildModel(args?: unknown): DyniRoutePointsRenderModel;
  buildResizeSignatureParts(model?: Partial<DyniRoutePointsRenderModel>): Array<string | number>;
  canActivateRoutePoint(args?: unknown): boolean;
}

interface DyniRoutePointsHtmlFitModule {
  id: "RoutePointsHtmlFit";
  create(def: unknown, componentContext: DyniComponentContext): DyniRoutePointsHtmlFitApi;
}

type DyniRoutePointsRevealReason = "mount" | "active-change" | "data-refresh" | "layout" | "refit" | "resize";

interface DyniRoutePointsDomElement {
  isConnected?: boolean;
  clientHeight?: unknown;
  offsetHeight?: unknown;
  offsetTop?: unknown;
  offsetWidth?: unknown;
  clientWidth?: unknown;
  scrollTop?: unknown;
  closest?(selector: string): Element | null;
  querySelector?(selector: string): DyniRoutePointsDomElement | null;
  getBoundingClientRect?(): { top: unknown; height: unknown };
}

interface DyniRoutePointsDomEffectState {
  token: number;
  timerHandle: number | null;
  hasInitialActiveReveal: boolean;
  lastAutoScrolledActiveKey: string | null;
  lastSeenActiveKey: string | null;
}

interface DyniRoutePointsRevealArgs {
  hostContext?: unknown;
  rootEl?: DyniRoutePointsDomElement | null;
  selectedIndex?: unknown;
  activeKey?: unknown;
  reason?: unknown;
}

interface DyniRoutePointsCommittedEffectsArgs {
  hostContext?: unknown;
  targetEl?: DyniRoutePointsDomElement | null;
}

interface DyniRoutePointsCommittedEffects {
  targetEl: DyniRoutePointsDomElement | null;
  isVerticalCommitted: boolean;
  scrollbarGutterPx: number;
}

interface DyniRoutePointsDomEffectsApi {
  id: "RoutePointsDomEffects";
  isVerticalContainer(targetEl: unknown): boolean;
  measureListScrollbarGutter(targetEl: unknown): number;
  ensureSelectedRowVisible(listEl: DyniRoutePointsDomElement | null | undefined, selectedIndex: unknown): boolean;
  maybeRevealActiveRow(args?: DyniRoutePointsRevealArgs): boolean;
  scheduleSelectedRowVisibility(args?: DyniRoutePointsRevealArgs): boolean;
  applyCommittedEffects(args?: DyniRoutePointsCommittedEffectsArgs): DyniRoutePointsCommittedEffects;
}

interface DyniRoutePointsDomEffectsModule {
  id: "RoutePointsDomEffects";
  create(def: unknown, componentContext: DyniComponentContext): DyniRoutePointsDomEffectsApi;
}

interface DyniCenterDisplayLeg {
  course?: unknown;
  distance?: unknown;
}

interface DyniCenterDisplayMeasureInfo {
  activeMeasure?: unknown;
  useRhumbLine?: unknown;
}

interface DyniCenterDisplayProps {
  display?: {
    position?: unknown;
    marker?: DyniCenterDisplayLeg;
    boat?: DyniCenterDisplayLeg;
    measure?: DyniCenterDisplayMeasureInfo;
  };
  captions?: Record<string, unknown>;
  units?: Record<string, unknown>;
  formatUnits?: Record<string, unknown>;
  stableDigits?: unknown;
}

interface DyniCenterDisplayStateRow {
  id: string;
  caption: string;
  fullValueText: string;
  compactValueText: string;
}

interface DyniCenterDisplayState {
  positionCaption: string;
  latText: string;
  lonText: string;
  rows: DyniCenterDisplayStateRow[];
}

interface DyniCenterDisplayMeasurementRow {
  caption?: unknown;
  fullValueText?: unknown;
  compactValueText?: unknown;
}

type DyniCenterDisplayMeasureTextWidth = (
  ctx: CanvasRenderingContext2D,
  textApi: unknown,
  text: unknown,
  family: unknown,
  weight: unknown,
  px: unknown,
  frameWidthCache: unknown
) => number;

interface DyniCenterDisplayMeasurementHintArgs {
  rows: DyniCenterDisplayMeasurementRow[];
  measureTextWidth: DyniCenterDisplayMeasureTextWidth;
  computeResponsiveLineMaxPx: (...args: unknown[]) => unknown;
  clampShare: (value: unknown, min: unknown, max: unknown) => number;
  contentRect: { h: number };
  ctx: CanvasRenderingContext2D;
  textApi: unknown;
  labelFamily: unknown;
  coordFamily: unknown;
  relationValueFamily: unknown;
  labelWeight: unknown;
  valueWeight: unknown;
  gap: number;
  frameWidthCache: unknown;
  positionCaption?: unknown;
  latText?: unknown;
  lonText?: unknown;
}

interface DyniCenterDisplayMeasurementHints {
  normalCaptionShare: number | undefined;
  flatCenterShare: number;
  highCaptionRatio: number;
  flatCaptionRatio: number;
}

interface DyniCenterDisplayInsets {
  padX: number;
  innerY: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniCenterDisplayPanel {
  rect: DyniRect;
  captionRect: DyniRect;
  latRect: DyniRect;
  lonRect: DyniRect;
  captionAlign: "center" | "left";
  coordAlign: unknown;
}

interface DyniCenterDisplayVerticalRects {
  centerRect: DyniRect;
  rowsRect: DyniRect;
}

interface DyniCenterDisplayLayoutArgs {
  contentRect?: DyniRect;
  responsive?: DyniResponsiveScaleProfile;
  mode?: unknown;
  relationCount?: unknown;
  gap?: unknown;
  normalCaptionShare?: unknown;
  flatCenterShare?: unknown;
  highCaptionRatio?: unknown;
  flatCaptionRatio?: unknown;
  coordAlign?: unknown;
}

interface DyniCenterDisplayLayoutResult {
  mode: "high" | "flat" | "normal";
  gap?: number;
  center: DyniCenterDisplayPanel;
  rowRects: DyniRect[];
  responsive: DyniResponsiveScaleProfile;
}

interface DyniCenterDisplayLayoutApi {
  id: "CenterDisplayLayout";
  computeInsets(W: unknown, H: unknown): DyniCenterDisplayInsets;
  createContentRect(W: unknown, H: unknown, insets?: Record<string, unknown>): DyniRect;
  computeLayout(args?: DyniCenterDisplayLayoutArgs | null): DyniCenterDisplayLayoutResult;
  computeTextPadPx(rect?: Partial<DyniRect> | null, responsive?: DyniResponsiveScaleProfile): number;
  computeRowValueGapPx(rect?: Partial<DyniRect> | null, responsive?: DyniResponsiveScaleProfile): number;
}

interface DyniCenterDisplayRenderModelApi {
  id: "CenterDisplayRenderModel";
  buildDisplayState(props: unknown, math: DyniCenterDisplayMathApi, defaultText: string): DyniCenterDisplayState;
  computeMeasurementHints(args?: unknown): DyniCenterDisplayMeasurementHints;
}

interface DyniRoutePointsHeaderGeometry {
  style?: unknown;
  routeNameStyle?: unknown;
  metaStyle?: unknown;
}

interface DyniRoutePointsListGeometry {
  style?: unknown;
  contentStyle?: unknown;
}

interface DyniRoutePointsRowInlineGeometry {
  rowStyle?: unknown;
  ordinalStyle?: unknown;
  middleStyle?: unknown;
  nameStyle?: unknown;
  infoStyle?: unknown;
  markerStyle?: unknown;
  markerDotStyle?: unknown;
}

interface DyniRoutePointsInlineGeometry {
  wrapper?: { style?: unknown } | null;
  header?: DyniRoutePointsHeaderGeometry | null;
  list?: DyniRoutePointsListGeometry | null;
  rows: DyniRoutePointsRowInlineGeometry[];
}

interface DyniRoutePointMarkupRow {
  index?: unknown;
  ordinalText?: unknown;
  nameText?: unknown;
  infoText?: unknown;
  selected?: unknown;
}

interface DyniRoutePointMarkupRowFit {
  ordinalStyle?: unknown;
  nameStyle?: unknown;
  infoStyle?: unknown;
  infoText?: unknown;
}

interface DyniRoutePointsMarkupFit {
  headerFit: {
    routeNameStyle?: unknown;
    metaStyle?: unknown;
  };
  rowFits: DyniRoutePointMarkupRowFit[];
}

interface DyniRoutePointsMarkupModel {
  kind?: unknown;
  mode?: unknown;
  stateLabel?: unknown;
  interactionState?: unknown;
  showHeader?: unknown;
  hasRoute?: unknown;
  routeNameText?: unknown;
  metaText?: unknown;
  showOrdinal?: unknown;
  showLatLon?: unknown;
  stableDigitsEnabled?: unknown;
  isActiveRoute?: unknown;
  points: DyniRoutePointMarkupRow[];
  inlineGeometry: DyniRoutePointsInlineGeometry;
}

interface DyniRoutePointsMarkupRenderArgs {
  model: DyniRoutePointsMarkupModel;
  fit: DyniRoutePointsMarkupFit;
  htmlUtils: DyniHtmlWidgetUtilsApi;
  coordinatesTabular?: unknown;
  shellRect?: unknown;
  fontFamily?: unknown;
  fontWeight?: unknown;
}

interface DyniRoutePointsMarkupApi {
  id: "RoutePointsMarkup";
  render(args: DyniRoutePointsMarkupRenderArgs): string;
}

interface DyniEditRouteMetricText {
  labelText?: unknown;
  valueText?: unknown;
  unitText?: unknown;
  hasUnit?: unknown;
}

interface DyniEditRouteMetricFit {
  labelStyle?: string;
  valueRowStyle?: string;
  valueStyle?: string;
  unitStyle?: string;
}

interface DyniEditRouteMarkupFit {
  nameTextStyle?: string;
  sourceBadgeStyle?: string;
  metrics?: Record<string, DyniEditRouteMetricFit>;
  metricValues?: Record<string, string>;
}

interface DyniEditRouteComputedFit extends DyniEditRouteMarkupFit {
  nameTextStyle: string;
  sourceBadgeStyle: string;
  metrics: Record<string, DyniEditRouteMetricFit>;
  metricValues: Record<string, string>;
}

interface DyniEditRouteMarkupModel {
  mode?: string;
  kind?: unknown;
  stateLabel?: unknown;
  interactionState?: unknown;
  hasRoute?: unknown;
  isActiveRoute?: unknown;
  isLocalRoute?: unknown;
  flatMetricRows?: unknown;
  stableDigitsEnabled?: unknown;
  metricsStyle?: unknown;
  wrapperStyle?: unknown;
  nameText?: unknown;
  sourceBadgeText?: unknown;
  metrics?: Record<string, DyniEditRouteMetricText>;
  visibleMetricIds?: string[];
  metricVisibility?: Record<string, unknown>;
}

interface DyniEditRouteMarkupRenderArgs {
  model?: DyniEditRouteMarkupModel;
  fit?: DyniEditRouteMarkupFit;
  htmlUtils: DyniHtmlWidgetUtilsApi;
  shellRect?: unknown;
  fontFamily?: unknown;
  fontWeight?: unknown;
}

interface DyniEditRouteMarkupApi {
  id: "EditRouteMarkup";
  render(args?: unknown): string;
}

interface DyniEditRouteMetricEntry extends DyniEditRouteMetricText {
  label?: unknown;
  value?: unknown;
  plainValueText?: unknown;
  plainValue?: unknown;
  unit?: unknown;
}

interface DyniEditRouteMetricModel extends DyniEditRouteMarkupModel {
  metricTexts?: Record<string, DyniEditRouteMetricEntry>;
  [key: string]: unknown;
}

type DyniEditRouteLayoutMode = "flat" | "high" | "normal";
type DyniEditRouteMetricId = "pts" | "dst" | "rte" | "rteEta";

interface DyniEditRouteShellSize {
  width: number;
  height: number;
}

interface DyniEditRouteNormalizedMetricValue {
  valueText: string;
  plainValueText: string;
}

interface DyniEditRouteBuildModelArgs {
  props?: unknown;
  shellRect?: unknown;
  isVerticalCommitted?: unknown;
}

interface DyniEditRouteInteractionArgs {
  props?: unknown;
}

interface DyniEditRouteRenderModel extends DyniEditRouteHtmlFitModel {
  kind: string;
  stateLabel: string;
  isActiveRoute: boolean;
  isLocalRoute: boolean;
  isServerRoute: boolean;
  interactionState: string;
  canOpenEditRoute: boolean;
  captureClicks: boolean;
  shellWidth: number;
  shellHeight: number;
  effectiveLayoutHeight: number;
  layoutShellHeight: number;
  sourceBadgeText: string;
  metrics: Record<string, DyniEditRouteMetricEntry>;
  metricVisibility: Record<string, boolean>;
  visibleMetricIds: DyniEditRouteMetricId[];
  flatMetricRows: number;
  flatMetricColumns: number;
  metricsStyle: string;
  wrapperStyle: string;
  resizeSignatureParts: Array<string | number>;
}

interface DyniEditRouteRenderModelApi {
  id: "EditRouteRenderModel";
  buildModel(args?: DyniEditRouteBuildModelArgs): DyniEditRouteRenderModel;
  buildResizeSignatureParts(model?: Partial<DyniEditRouteRenderModel>): Array<string | number>;
  canOpenEditRoute(args?: DyniEditRouteInteractionArgs): boolean;
}

interface DyniMapZoomFitModel {
  showRequired?: boolean;
  stableDigitsEnabled?: boolean;
  caption: string;
  zoomText: string;
  zoomPlainText: string;
  unit: string;
  requiredText: string;
  requiredPlainText: string;
  captionUnitScale?: unknown;
  mode?: string;
}

interface DyniMapZoomFitMetrics {
  cPx?: number;
  vPx?: number;
  uPx?: number;
  sPx?: number;
}

interface DyniMapZoomMainFitState {
  captionPx: number;
  valuePx: number;
  unitPx: number;
  modeFit: DyniMapZoomFitMetrics;
}

interface DyniMapZoomHeightEstimateArgs {
  fit?: DyniMapZoomFitMetrics | null;
  mode?: string;
  gapPx?: unknown;
}

interface DyniMapZoomMainFitArgs {
  textApi: DyniTextLayoutEngineApi;
  mode: string;
  ctx: CanvasRenderingContext2D;
  maxW: number;
  maxH: number;
  gapPx: number;
  innerY: number;
  textFillScale: unknown;
  secScale: number;
  captionText: string;
  valueText: string;
  unitText: string;
  family: string;
  valueWeight: unknown;
  labelWeight: unknown;
  useMono: boolean;
  monoFamily: string;
}

interface DyniMapZoomCleanFitArgs {
  textApi: DyniTextLayoutEngineApi;
  ctx: CanvasRenderingContext2D;
  text: string;
  px: number;
  maxW: number;
  maxH: number;
  family: string;
  weight: unknown;
}

interface DyniMapZoomRequiredFit {
  px: number;
}

interface DyniMapZoomRequiredFitArgs {
  textApi: DyniTextLayoutEngineApi;
  ctx: CanvasRenderingContext2D;
  mode: string;
  mainFit: DyniMapZoomFitMetrics;
  gapPx: number;
  requiredText: string;
  maxW: number;
  maxH: number;
  family: string;
  labelWeight: unknown;
}

interface DyniMapZoomSignatureArgs {
  width: number;
  height: number;
  family: string;
  valueFamily: string;
  valueWeight: unknown;
  labelWeight: unknown;
  mode: string;
  secScale: number;
  model: DyniMapZoomFitModel;
}

interface DyniMapZoomThemeResolver {
  resolveForRoot(rootEl: unknown): DyniMapZoomThemeTokens;
}

interface DyniMapZoomThemeTokens {
  font: { family: string; familyMono?: string; weight: unknown; labelWeight: unknown };
}

interface DyniMapZoomRenderModel {
  kind: string;
  stateLabel: string;
  mode: string;
  interactionState: string;
  caption?: string;
  unit?: string;
  zoomText?: string;
  zoomPlainText?: string;
  requiredText?: string;
  requiredPlainText?: string;
  showRequired?: boolean;
  captionUnitScale: number;
  stableDigitsEnabled: boolean;
  captionStyle?: string;
  valueStyle?: string;
  unitStyle?: string;
  requiredStyle?: string;
}

interface DyniMapZoomMarkupRenderArgs {
  model: DyniMapZoomRenderModel;
  shellRect: DyniHtmlShellRect | null;
  theme: DyniMapZoomThemeTokens;
  htmlUtils: DyniHtmlWidgetUtilsApi;
}

interface DyniMapZoomMarkupApi {
  id: "MapZoomMarkup";
  render(args: DyniMapZoomMarkupRenderArgs): string;
}

interface DyniMapZoomHtmlFitArgs {
  model?: DyniMapZoomFitModel | null;
  hostContext?: unknown;
  shellRect?: DyniHtmlShellRect | null;
  targetEl?: unknown;
}

interface DyniMapZoomHtmlFitResult {
  captionStyle: string;
  valueStyle: string;
  unitStyle: string;
  requiredStyle: string;
  zoomText?: string;
  requiredText?: string;
}

interface DyniMapZoomHtmlFitApi {
  id: "MapZoomHtmlFit";
  compute(args?: DyniMapZoomHtmlFitArgs): DyniMapZoomHtmlFitResult;
}

interface DyniEditRouteHtmlFitModel extends DyniEditRouteMetricModel {
  mode: DyniEditRouteLayoutMode;
  hasRoute: boolean;
  isLocalRoute: boolean;
  stableDigitsEnabled: boolean;
  layoutShellHeight?: unknown;
  effectiveLayoutHeight?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
  nameText?: unknown;
  routeNameText?: unknown;
  sourceBadgeText?: unknown;
}

interface DyniEditRouteHtmlFitArgs {
  model?: DyniEditRouteHtmlFitModel | null;
  shellRect?: DyniHtmlShellRect | null;
  hostContext?: unknown;
  targetEl?: unknown;
}

interface DyniEditRouteThemeTokens {
  font: {
    family: string;
    familyMono?: string;
    weight: unknown;
    labelWeight: unknown;
  };
}

interface DyniEditRouteThemeResolver {
  resolveForRoot(rootEl: unknown): DyniEditRouteThemeTokens;
}

interface DyniEditRouteLayoutResult {
  mode: DyniEditRouteLayoutMode;
  responsive: DyniResponsiveScaleProfile;
  nameTextRect: DyniRect;
  sourceBadgeRect: DyniRect | null;
  metricVisibility: Record<DyniEditRouteMetricId, boolean>;
  metricBoxes: Partial<Record<DyniEditRouteMetricId, DyniEditRouteMetricTile>>;
  isVerticalCommitted?: boolean;
  verticalShell?: { effectiveLayoutHeight?: number; wrapperStyle?: string } | null;
  flatWrapperLayoutStyle?: string;
  flatMetricsLayoutStyle?: string;
  flatMetricRows?: number;
  flatMetricColumns?: number;
}

interface DyniEditRouteLayoutArgs {
  W?: unknown;
  H?: unknown;
  isVerticalCommitted?: boolean;
  effectiveLayoutHeight?: unknown;
  mode?: string;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  hasRoute?: boolean;
  isLocalRoute?: boolean;
  contentRect?: DyniRect;
  metricHasUnit?: Record<string, unknown>;
}

interface DyniEditRouteInsets {
  padX: number;
  innerY: number;
  gap: number;
  namePadX: number;
  metricPadX: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniEditRouteLayoutOutput extends DyniEditRouteLayoutResult {
  nameBarRect: DyniRect | null;
  nameTextRect: DyniRect | null;
  sourceBadgeRect: DyniRect | null;
  contentRect: DyniRect;
  insets: DyniEditRouteInsets;
  metricBoxes: Record<string, unknown>;
  flatMetricRows: number;
  flatMetricColumns: number;
  flatWrapperLayoutStyle: string;
  flatMetricsLayoutStyle: string;
  verticalShell?: Record<string, unknown>;
}

interface DyniEditRouteShellArgs {
  W?: unknown;
  H?: unknown;
  isVerticalCommitted?: boolean;
  effectiveLayoutHeight?: unknown;
}

interface DyniEditRouteWrapperArgs {
  nameHeight: unknown;
  metricsHeight: unknown;
  gap: unknown;
  insets: DyniEditRouteInsets;
  hasMetrics: boolean;
}

interface DyniEditRouteLayoutApi {
  id: "EditRouteLayout";
  computeLayout(args?: unknown): DyniEditRouteLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

interface DyniEditRouteLayoutTilesApi {
  id: "EditRouteLayoutTiles";
  computeNameRects(
    nameBarRect: DyniRect,
    showSourceBadge: boolean,
    insets: DyniEditRouteInsets
  ): DyniEditRouteNameRects;
  createMetricTile(
    tileRect: DyniRect,
    insets: DyniEditRouteInsets,
    responsive: DyniResponsiveScaleProfile,
    options?: Record<string, unknown>
  ): DyniEditRouteMetricTile;
  buildFlatWrapperLayoutStyle(args: DyniEditRouteWrapperArgs): string;
  buildFlatMetricsLayoutStyle(rows: number, columns: number, gapPx: number): string;
  createHighMetricRow(rowRect: DyniRect, insets: DyniEditRouteInsets, hasUnit: boolean): DyniEditRouteMetricTile;
  computeFlatMetricsLayout(
    metricsRect: DyniRect,
    insets: DyniEditRouteInsets,
    responsive: DyniResponsiveScaleProfile,
    out: DyniEditRouteLayoutOutput,
    metricHasUnit: { dst: boolean; rte: boolean }
  ): void;
}

interface DyniEditRouteHtmlFitApi {
  id: "EditRouteHtmlFit";
  compute(args?: DyniEditRouteHtmlFitArgs): DyniEditRouteMarkupFit | null;
}

interface DyniEditRouteHtmlFitModule {
  id: "EditRouteHtmlFit";
  create(def: unknown, componentContext: DyniComponentContext): DyniEditRouteHtmlFitApi;
}

interface DyniEditRouteLineFit {
  px?: unknown;
  text?: unknown;
}

interface DyniEditRouteMeasureLineArgs {
  rect?: DyniRect | null;
  text?: unknown;
  maxPx?: unknown;
  maxPxRatio?: unknown;
  textApi: unknown;
  tileLayout: DyniTextTileLayoutApi;
  ctx: CanvasRenderingContext2D;
  family?: unknown;
  weight?: unknown;
  textFillScale?: unknown;
  htmlUtils: DyniHtmlWidgetUtilsApi;
}

interface DyniEditRouteMetricValueSelectArgs extends DyniEditRouteMeasureLineArgs {
  stableDigitsEnabled?: unknown;
  primaryText?: unknown;
  plainText?: unknown;
  valueFamily?: unknown;
  valueWeight?: unknown;
}

interface DyniEditRouteMetricValueSelection {
  text: string;
  fit: DyniEditRouteLineFit | null;
}

interface DyniEditRouteHtmlFitSupportApi {
  id: "EditRouteHtmlFitSupport";
  resolveMetricLabel(model: DyniEditRouteMetricModel | null | undefined, id: string): string;
  resolveMetricValue(model: DyniEditRouteMetricModel | null | undefined, id: string): string;
  resolveMetricPlainValue(model: DyniEditRouteMetricModel | null | undefined, id: string): string;
  resolveMetricUnit(model: DyniEditRouteMetricModel | null | undefined, id: string): string;
  measureLineFit(args?: DyniEditRouteMeasureLineArgs | null): DyniEditRouteLineFit | null;
  measureEditRoutePx(args?: DyniEditRouteMeasureLineArgs | null): number;
  isLineTrimmed(lineFit?: DyniEditRouteLineFit | null, sourceText?: unknown): boolean;
  selectMetricValue(args?: DyniEditRouteMetricValueSelectArgs | null): DyniEditRouteMetricValueSelection;
  resolveMetricPx(lineFit: DyniEditRouteLineFit | null | undefined, htmlUtils: DyniHtmlWidgetUtilsApi): number;
  measureEditRouteStyle(args: DyniEditRouteMeasureLineArgs): string;
  resolveNamePxRatio(mode?: unknown): unknown;
}

interface DyniEditRouteInsets {
  [key: string]: unknown;
}

interface DyniEditRouteNameRects {
  nameTextRect: DyniRect;
  sourceBadgeRect: DyniRect | null;
}

interface DyniEditRouteMetricTile {
  tileRect: DyniRect;
  labelRect: DyniRect;
  valueRect: DyniRect;
  valueTextRect: DyniRect;
  unitRect: DyniRect | null;
}

interface DyniEditRouteNameRectArgs {
  nameBarRect?: DyniRect;
  showSourceBadge?: unknown;
  sourceBadgeRatio?: unknown;
  sourceBadgeMinPx?: unknown;
  sourceBadgeMaxRatio?: unknown;
  insets?: DyniEditRouteInsets;
}

interface DyniEditRouteInlineValueRectArgs {
  valueRect?: DyniRect;
  includeUnit?: unknown;
  insets?: DyniEditRouteInsets;
  unitShare?: unknown;
  unitMinPx?: unknown;
  unitMaxRatio?: unknown;
}

interface DyniEditRouteMetricTileArgs {
  tileRect?: DyniRect;
  insets?: DyniEditRouteInsets;
  responsive?: DyniResponsiveScaleProfile;
  profileApi?: DyniResponsiveScaleProfileApi;
  metricTilePadRatio?: unknown;
  metricTileCaptionRatio?: unknown;
  unitPlacement?: unknown;
  unitShare?: unknown;
  unitMinPx?: unknown;
  unitMaxRatio?: unknown;
}

interface DyniEditRouteHighMetricRowArgs extends DyniEditRouteInlineValueRectArgs {
  rowRect?: DyniRect;
  labelRatio?: unknown;
  labelMinRatio?: unknown;
  labelMaxRatio?: unknown;
}

interface DyniEditRouteLayoutGeometryApi {
  id: "EditRouteLayoutGeometry";
  computeNameRects(args?: DyniEditRouteNameRectArgs): DyniEditRouteNameRects;
  createMetricTile(args?: DyniEditRouteMetricTileArgs): DyniEditRouteMetricTile;
  createHighMetricRow(args?: DyniEditRouteHighMetricRowArgs): DyniEditRouteMetricTile;
}

// --- vessel kits -----------------------------------------------------------

type DyniAlarmInteractionState = "dispatch" | "passive";
type DyniAlarmState = "active" | "idle";

interface DyniAlarmRenderModel {
  state: DyniAlarmState;
  isActive: boolean;
  hasActiveAlarms: boolean;
  activeCount: number;
  alarmNames: unknown[];
  alarmText: string;
  captionText: string;
  idleValueText: string;
  activeValueText: string;
  valueText: string;
  unitText: string;
  showStrip: boolean;
  showActiveBackground: boolean;
  showHotspot: boolean;
  interactionState: DyniAlarmInteractionState;
  canDispatch: boolean;
  ratioThresholdNormal: number | undefined;
  ratioThresholdFlat: number | undefined;
}

interface DyniAlarmRenderModelApi {
  id: "AlarmRenderModel";
  buildModel(args?: unknown): DyniAlarmRenderModel;
}

interface DyniAlarmMarkupModel extends Record<string, unknown> {
  state?: unknown;
  interactionState?: unknown;
  showStrip?: unknown;
  captionText?: unknown;
  valueText?: unknown;
}

interface DyniAlarmMarkupFit extends Record<string, unknown> {
  mode?: unknown;
  captionStyle?: unknown;
  valueStyle?: unknown;
  shellStyle?: unknown;
  accentStyle?: unknown;
  activeBackgroundStyle?: unknown;
  activeForegroundStyle?: unknown;
}

interface DyniAlarmMarkupArgs {
  model?: unknown;
  fit?: unknown;
}

interface DyniAlarmMarkupApi {
  id: "AlarmMarkup";
  render(args?: unknown): string;
}

interface DyniAlarmShellRect {
  width: number;
  height: number;
}

interface DyniAlarmChromeBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  stripWidth: number;
  stripGap: number;
  stripLeft: number;
  stripTop: number;
  stripBottom: number;
  padX: number;
  padY: number;
  accentReserve: number;
  stripRadius: number;
}

interface DyniAlarmContentRect {
  width: number;
  height: number;
  chrome: DyniAlarmChromeBox;
}

interface DyniAlarmHtmlFitLayout {
  mode: "flat" | "high" | "normal";
  shellRect: DyniAlarmShellRect;
  contentRect: DyniAlarmContentRect;
}

interface DyniAlarmChromeModel {
  state?: unknown;
  interactionState?: unknown;
  captionText?: unknown;
  valueText?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  showStrip?: unknown;
  showActiveBackground?: unknown;
}

interface DyniAlarmThemeTokens {
  bg?: unknown;
  fg?: unknown;
  strip?: unknown;
}

interface DyniAlarmThemeColors {
  alarmWidget?: DyniAlarmThemeTokens;
}

interface DyniAlarmThemeFont {
  family?: unknown;
  weight?: unknown;
  labelWeight?: unknown;
}

interface DyniAlarmResolvedTheme {
  colors?: DyniAlarmThemeColors;
  font?: DyniAlarmThemeFont;
}

interface DyniAlarmThemeResolver {
  resolveForRoot(rootEl: unknown): DyniAlarmResolvedTheme;
}

interface DyniAlarmHtmlFitChromeResolveArgs {
  model?: unknown;
  shellRect?: unknown;
}

interface DyniAlarmHtmlFitChromeSignatureArgs {
  mode?: unknown;
  width?: unknown;
  height?: unknown;
  shellWidth?: unknown;
  shellHeight?: unknown;
  chrome?: unknown;
  padX?: unknown;
  model?: unknown;
  family?: unknown;
  valueWeight?: unknown;
  labelWeight?: unknown;
  themeBg?: unknown;
  themeFg?: unknown;
  themeStrip?: unknown;
  fontMetricsEpoch?: unknown;
}

interface DyniAlarmHtmlFitChromeApi {
  id: "AlarmHtmlFitChrome";
  resolveLayout(args?: DyniAlarmHtmlFitChromeResolveArgs): DyniAlarmHtmlFitLayout | null;
  buildShellStyle(chrome: DyniAlarmChromeBox): string;
  buildAccentStyle(model: unknown, chrome: DyniAlarmChromeBox, tokens: DyniAlarmThemeTokens): string;
  buildSignature(args?: DyniAlarmHtmlFitChromeSignatureArgs): string;
}

interface DyniAlarmFitModel extends DyniAlarmChromeModel {
  showActiveBackground?: unknown;
  showStrip?: unknown;
  captionText?: unknown;
  valueText?: unknown;
  state?: unknown;
  interactionState?: unknown;
}

interface DyniAlarmModeFitArgs {
  mode: DyniAlarmHtmlFitLayout["mode"];
  model: DyniAlarmFitModel;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  family?: unknown;
  valueWeight?: unknown;
  labelWeight?: unknown;
}

interface DyniAlarmModeFit {
  captionPx: number;
  valuePx: number;
  modeFit: unknown;
}

interface DyniAlarmHtmlFitComputeArgs {
  model?: unknown;
  shellRect?: unknown;
  targetEl?: unknown;
  rootEl?: unknown;
  hostContext?: unknown;
  fontMetricsEpoch?: unknown;
}

interface DyniAlarmHtmlFitResult extends DyniAlarmMarkupFit {
  mode: DyniAlarmHtmlFitLayout["mode"];
  captionPx: number;
  valuePx: number;
  captionStyle: string;
  valueStyle: string;
  shellStyle: string;
  accentStyle: string;
  activeBackgroundStyle: string;
  activeForegroundStyle: string;
  idleStripStyle: string;
  showStrip: boolean;
  showActiveBackground: boolean;
  valueSingleLine: boolean;
  interactionState: unknown;
  state: unknown;
}

interface DyniAlarmHtmlFitApi {
  id: "AlarmHtmlFit";
  compute(args?: DyniAlarmHtmlFitComputeArgs | null): DyniAlarmHtmlFitResult | null;
  resolveLayout(args?: DyniAlarmHtmlFitChromeResolveArgs): DyniAlarmHtmlFitLayout | null;
}

type DyniRegattaAudioContextCtor = {
  new (): AudioContext;
};

interface DyniRegattaTimerAudioGlobal {
  AudioContext?: DyniRegattaAudioContextCtor;
  webkitAudioContext?: DyniRegattaAudioContextCtor;
}

interface DyniRegattaTimerAudioEngine {
  ensureContext(): boolean;
  playTone(frequency: unknown, durationMs: unknown): void;
  destroy(): void;
  LOW_TONE_HZ: number;
  HIGH_TONE_HZ: number;
  MINUTE_BEEP_MS: number;
  SECOND_BEEP_MS: number;
  START_TONE_MS: number;
}

interface DyniRegattaTimerAudioApi {
  id: "RegattaTimerAudio";
  createAudioEngine(): DyniRegattaTimerAudioEngine;
}

interface DyniRegattaTimerSessionSnapshot {
  phase?: unknown;
  durationMinutes?: unknown;
  endTimeMs?: unknown;
  elapsedStartMs?: unknown;
  lastCountdownSecond?: unknown;
  [key: string]: unknown;
}

interface DyniRegattaTimerState {
  phase: DyniRegattaPhase;
  remainingMs: number;
  elapsedMs: number;
  displayTime: string;
  colorPhase: string;
}

interface DyniRegattaTimerModelOptions {
  durationMinutes?: unknown;
  snapshot?: DyniRegattaTimerSessionSnapshot | null;
  onTick?: (state: DyniRegattaTimerState) => void;
  onSignal?: (type: string, frequency: number, durationMs: number) => void;
}

interface DyniRegattaTimerModel {
  start(): void;
  sync(): void;
  reset(): void;
  destroy(): void;
  getState(): DyniRegattaTimerState;
  getSnapshot(): DyniRegattaTimerSessionSnapshot;
}

interface DyniRegattaTimerModelApi {
  id: "RegattaTimerModel";
  createTimerModel(options?: DyniRegattaTimerModelOptions): DyniRegattaTimerModel;
}

interface DyniRegattaTimerHostContext {
  __dyniRegattaTimerSession?: DyniRegattaTimerSessionSnapshot | null;
  [key: string]: unknown;
}

interface DyniRegattaTimerSessionStore {
  syncIdentity(props?: unknown, payload?: unknown): void;
  readStoredSnapshot(): DyniRegattaTimerSessionSnapshot | null;
  persistSnapshot(snapshot?: unknown): void;
  clearStoredSnapshot(): void;
}

interface DyniRegattaTimerSessionStoreApi {
  id: "RegattaTimerSessionStore";
  createSessionStore(options?: unknown): DyniRegattaTimerSessionStore;
}

interface DyniRegattaTimerMarkupModel {
  phase?: unknown;
  colorPhase?: unknown;
  displayTime?: unknown;
  remainingMs?: unknown;
}

interface DyniRegattaTimerMarkupFit {
  wrapperStyle?: unknown;
  displayStyle?: unknown;
  timerStyle?: unknown;
  controlsStyle?: unknown;
  barStyle?: unknown;
  buttonStyle?: unknown;
  startButtonStyle?: unknown;
  syncButtonStyle?: unknown;
  resetButtonStyle?: unknown;
}

interface DyniRegattaTimerMarkupConfig {
  progressBarEnabled?: unknown;
  durationMinutes?: unknown;
}

interface DyniRegattaTimerConfig extends DyniRegattaTimerMarkupConfig {
  soundEnabled: boolean;
  progressBarEnabled: boolean;
  durationMinutes: number;
  stableDigitsEnabled: boolean;
}

interface DyniRegattaTimerMarkupOptions {
  model: DyniRegattaTimerMarkupModel;
  fit: DyniRegattaTimerMarkupFit;
  config: DyniRegattaTimerMarkupConfig;
  htmlUtils: DyniHtmlWidgetUtilsApi;
  mode?: unknown;
  interactionState?: unknown;
  stableDigitsEnabled?: unknown;
}

interface DyniRegattaTimerMarkupApi {
  id: "RegattaTimerMarkup";
  render(options: DyniRegattaTimerMarkupOptions): string;
}

type DyniRegattaTimerFitMode = "high" | "flat" | "normal";

interface DyniRegattaTimerModeShares {
  display: number;
  controls: number;
}

interface DyniRegattaTimerHtmlFitModel {
  phase?: unknown;
  displayTime?: unknown;
}

interface DyniRegattaTimerHtmlFitHostContext {
  __dyniRegattaTimerHtmlFitCache?: DyniRegattaTimerHtmlFitCache;
  [key: string]: unknown;
}

interface DyniRegattaTimerHtmlFitCache {
  signature: string;
  result: DyniRegattaTimerHtmlFitResult | null;
}

interface DyniRegattaTimerThemeResolver {
  resolveForRoot(rootEl: unknown): {
    font?: { family?: unknown; familyMono?: unknown; weight?: unknown; labelWeight?: unknown };
    regatta: { buttonStrokeWeight: unknown };
  };
}

interface DyniRegattaTimerDomApi {
  requirePluginRoot(targetEl: unknown): unknown;
}

interface DyniRegattaTimerHtmlFitArgs {
  model?: unknown;
  targetEl?: unknown;
  shellRect?: unknown;
  hostContext?: unknown;
  mode?: unknown;
  stableDigitsEnabled?: unknown;
}

interface DyniRegattaTimerHtmlFitResult {
  wrapperStyle: string;
  displayStyle: string;
  timerStyle: string;
  controlsStyle: string;
  barStyle: string;
  buttonStyle: string;
  startButtonStyle: string;
  syncButtonStyle: string;
  resetButtonStyle: string;
}

interface DyniRegattaTimerHtmlFitApi {
  id: "RegattaTimerHtmlFit";
  compute(options?: DyniRegattaTimerHtmlFitArgs): DyniRegattaTimerHtmlFitResult | null;
  clearCache(hostContext: unknown): void;
  FIT_CACHE_KEY: string;
}

type DyniRegattaTimerContext = DyniComponentContext & {
  theme: { tokens: DyniRegattaTimerThemeResolver };
};

interface DyniRegattaTimerResourceOptions {
  preserveSession?: boolean;
  clearSession?: boolean;
}

// --- component require overloads ------------------------------------------

interface DyniComponentRequire {
  (id: "CanvasTextLayout"): unknown;
  (id: "LinearGaugeEngine"): DyniLinearGaugeEngineApi;
  (id: "CanvasTextFitting"): DyniCanvasTextFittingApi;
  (id: "HtmlDomPatchUtils"): DyniHtmlDomPatchUtilsApi;
  (id: "HtmlWidgetUtils"): DyniHtmlWidgetUtilsApi;
  (id: "HtmlMeasureUtils"): DyniHtmlMeasureUtilsApi;
  (id: "GaugeToolkit"): DyniGaugeToolkitApi;
  (id: "LinearCanvasPrimitives"): DyniLinearCanvasPrimitivesApi;
  (id: "LinearGaugeEngineDrawing"): DyniLinearGaugeEngineDrawingApi;
  (id: "LinearGaugeEngineFrame"): DyniLinearGaugeEngineFrameApi;
  (id: "LinearGaugeLabelFit"): DyniLinearGaugeLabelFitApi;
  (id: "LinearGaugeEngineSupport"): DyniLinearGaugeEngineSupportApi;
  (id: "LinearGaugeMath"): DyniLinearGaugeMathApi;
  (id: "LinearGaugeTextLayout"): DyniLinearGaugeTextLayoutApi;
  (id: "LinearGaugeLayoutVariants"): DyniLinearGaugeLayoutVariantsApi;
  (id: "LinearGaugeLayout"): DyniLinearGaugeLayoutApi;
  (id: "EditRouteLayoutGeometry"): DyniEditRouteLayoutGeometryApi;
  (id: "EditRouteLayoutTiles"): DyniEditRouteLayoutTilesApi;
  (id: "EditRouteLayout"): DyniEditRouteLayoutApi;
  (id: "EditRouteHtmlFit"): DyniEditRouteHtmlFitApi;
  (id: "ActiveRouteLayout"): DyniActiveRouteLayoutApi;
  (id: "ActiveRouteHtmlFit"): DyniActiveRouteHtmlFitApi;
  (id: "AisTargetLayout"): DyniAisTargetLayoutApi;
  (id: "AisTargetLayoutGeometry"): DyniAisTargetLayoutGeometryApi;
  (id: "AisTargetLayoutGeometryStyles"): DyniAisTargetLayoutGeometryStylesApi;
  (id: "AisTargetHtmlFit"): DyniAisTargetHtmlFitApi;
  (id: "AisTargetLayoutSizing"): DyniAisTargetLayoutSizingApi;
  (id: "AisTargetMarkup"): DyniAisTargetMarkupApi;
  (id: "AisTargetRenderModel"): DyniAisTargetRenderModelApi;
  (id: "CenterDisplayLayout"): DyniCenterDisplayLayoutApi;
  (id: "CenterDisplayRenderModel"): DyniCenterDisplayRenderModelApi;
  (id: "EditRouteHtmlFitSupport"): DyniEditRouteHtmlFitSupportApi;
  (id: "EditRouteMarkup"): DyniEditRouteMarkupApi;
  (id: "EditRouteRenderModel"): DyniEditRouteRenderModelApi;
  (id: "MapZoomHtmlFit"): DyniMapZoomHtmlFitApi;
  (id: "MapZoomMarkup"): DyniMapZoomMarkupApi;
  (id: "RegattaTimerHtmlFit"): DyniRegattaTimerHtmlFitApi;
  (id: "RegattaTimerModel"): DyniRegattaTimerModelApi;
  (id: "NavInteractionPolicy"): DyniNavInteractionPolicyApi;
  (id: "RoutePointsLayoutSizing"): DyniRoutePointsLayoutSizingApi;
  (id: "RoutePointsRowGeometry"): DyniRoutePointsRowGeometryApi;
  (id: "RoutePointsInfoText"): DyniRoutePointsInfoTextApi;
  (id: "RoutePointsLayout"): DyniRoutePointsLayoutApi;
  (id: "RoutePointsHtmlFit"): DyniRoutePointsHtmlFitApi;
  (id: "RoutePointsDomEffects"): DyniRoutePointsDomEffectsApi;
  (id: "RoutePointsRenderModel"): DyniRoutePointsRenderModelApi;
  (id: "RoutePointsMarkup"): DyniRoutePointsMarkupApi;
  (id: "AlarmRenderModel"): DyniAlarmRenderModelApi;
  (id: "AlarmMarkup"): DyniAlarmMarkupApi;
  (id: "AlarmHtmlFitChrome"): DyniAlarmHtmlFitChromeApi;
  (id: "AlarmHtmlFit"): DyniAlarmHtmlFitApi;
  (id: "RegattaTimerAudio"): DyniRegattaTimerAudioApi;
  (id: "RegattaTimerSessionStore"): DyniRegattaTimerSessionStoreApi;
  (id: "RegattaTimerMarkup"): DyniRegattaTimerMarkupApi;
  (id: "XteHighwayLayout"): DyniXteHighwayLayoutApi;
  (id: "XteLinearLayout"): DyniXteLinearLayoutApi;
  (id: "XteHighwayPrimitives"): DyniXteHighwayPrimitivesApi;
  (id: "XteLinearPrimitives"): DyniXteLinearPrimitivesApi;
  (id: "XteLinearDynamicMetrics"): DyniXteLinearDynamicMetricsApi;
  (id: "XteDisplayPropsNormalize"): DyniXteDisplayPropsNormalizeApi;
  (id: "XteDisplayRenderSetup"): DyniXteDisplayRenderSetupApi;
  (id: "XteDisplayMetrics"): DyniXteDisplayMetricsApi;
  (id: "StateScreenCanvasOverlay"): DyniStateScreenCanvasOverlayApi;
  (id: "StateScreenMarkup"): DyniStateScreenMarkupApi;
  (id: "StateScreenTextFit"): DyniStateScreenTextFitApi;
}
