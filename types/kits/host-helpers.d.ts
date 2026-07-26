// Ambient types for shared context, value-math, and host-helper APIs
// (HTML surface controller, host-commit controller, temporary host-action bridge).
// Declaration merges extend the shared global interfaces.

// Minimal Node-style process shim for dev-mode detection guards.
declare const process:
  | undefined
  | {
      env?: {
        NODE_ENV?: string;
      };
    };

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

interface DyniGaugeToolkitApi {
  id: "GaugeToolkit";
  theme: Record<string, unknown> | undefined;
  text: DyniCanvasTextLayoutApi;
  value: DyniValueMathApi;
  resolveSurface(canvas: unknown): DyniCanvasSurface | null;
}
