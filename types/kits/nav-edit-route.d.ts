// Ambient types for the edit-route nav kit (layout, render model, HTML fit, markup).

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
