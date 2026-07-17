// Ambient types for the HTML/canvas widget-kit foundation modules pending
// promotion into types/dyni-globals.d.ts. Declaration merges extend the
// shared interfaces already declared in dyni-globals.d.ts and misc-kit.d.ts.

// --- shared value-math extension ------------------------------------------

interface DyniValueMathApi {
  trimText(value: unknown): string;
}

// --- HtmlWidgetUtils -------------------------------------------------------

interface DyniHtmlShellRect {
  width: number;
  height: number;
}

interface DyniHtmlTextOptions {
  captionOpacity: unknown;
  unitOpacity: unknown;
}

interface DyniHostCommitState {
  shellEl?: HTMLElement;
  rootEl?: HTMLElement;
}

interface DyniHtmlDomPatchUtilsApi {
  id: "HtmlDomPatchUtils";
  patchInnerHtml(rootEl: unknown, nextHtml: unknown): Element | null;
}

interface DyniHtmlWidgetUtilsApi {
  id: "HtmlWidgetUtils";
  toFiniteNumber: DyniValueMathApi["toFiniteNumber"];
  toText: DyniValueMathApi["toText"];
  trimText: DyniValueMathApi["trimText"];
  toStyleText(colorKey: string, value: unknown): string;
  resolveHostCommitTarget(hostContext: unknown): HTMLElement | null | undefined;
  resolveShellRect(hostContext: unknown, targetEl?: unknown): DyniHtmlShellRect | null;
  resolveRatioMode(options?: unknown): string;
  resolveRatioModeForRect(options?: unknown): string;
  resolveMetricValueFamily(model: unknown, tokens: unknown, baseFamily: unknown): unknown;
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

// --- HtmlMeasureUtils ------------------------------------------------------

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

interface DyniHtmlMeasureUtilsApi {
  id: "HtmlMeasureUtils";
  APPROX_CHAR_WIDTH_RATIO: number;
  parseFontPx(fontString: unknown): number;
  createApproximateMeasureContext(): DyniTextMeasureContext;
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

// --- CanvasLayerCache ------------------------------------------------------

interface DyniCanvasLayerCacheLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface DyniCanvasLayerDrawSize {
  W: number;
  H: number;
}

interface DyniCanvasLayerCacheInstance {
  ensureLayer(canvas: unknown, key: unknown, rebuildFn: unknown): void;
  blit(targetCtx: unknown): void;
  blitLayer(targetCtx: unknown, layerName: unknown): void;
  invalidate(): void;
}

interface DyniCanvasLayerCacheApi {
  id: "CanvasLayerCache";
  createLayerCache(spec?: unknown): DyniCanvasLayerCacheInstance;
}

// --- component require overloads ------------------------------------------

interface DyniComponentRequire {
  (id: "HtmlDomPatchUtils"): DyniHtmlDomPatchUtilsApi;
  (id: "HtmlWidgetUtils"): DyniHtmlWidgetUtilsApi;
  (id: "HtmlMeasureUtils"): DyniHtmlMeasureUtilsApi;
  (id: "CanvasLayerCache"): DyniCanvasLayerCacheApi;
}
