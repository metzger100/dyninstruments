// Ambient types for the map-zoom and center-display nav kit shapes.

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
