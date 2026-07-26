// Ambient types for the AIS target nav kit markup/render-model shapes.

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
