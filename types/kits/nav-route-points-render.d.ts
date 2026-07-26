// Ambient types for the route-points nav kit render-model, DOM effects, and markup shapes.

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
