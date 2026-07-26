// Ambient types for the route-points nav kit layout/sizing/HTML-fit shapes.

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
