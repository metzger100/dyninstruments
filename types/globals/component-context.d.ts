// Ambient overloads for componentContext.components.require() lookups and
// the shared DyniComponentContext shape.

interface DyniComponentRequire {
  (id: "AisTargetLayoutMath"): DyniAisTargetLayoutMathApi;
  (id: "HtmlWidgetLifecycle"): DyniHtmlWidgetLifecycleApi;
  (id: "PreparedPayloadModelCache"): DyniPreparedPayloadModelCacheApi;
  (id: "RadialTextFitting"): DyniCanvasTextFittingApi;
  (id: "RadialTextLayout"): DyniCanvasTextLayoutApi;
  (id: "CenterDisplayMath"): DyniCenterDisplayMathApi;
  (id: "EditRouteLayoutMath"): DyniEditRouteLayoutMathApi;
  (id: "GeometryScale"): DyniGeometryScaleApi;
  (id: "LayoutSizingHelpers"): DyniLayoutSizingHelpersApi;
  (id: "LinearGaugeMath"): DyniLinearGaugeMathApi;
  (id: "LayoutRectMath"): DyniLayoutRectMathApi;
  (id: "NavModeRatio"): DyniNavModeRatioApi;
  (id: "TextFitMath"): DyniTextFitMathApi;
  (id: "DepthDisplayFormatter"): DyniDepthDisplayFormatterApi;
  (id: "PlaceholderNormalize"): DyniPlaceholderNormalizeApi;
  (id: "UnitAwareFormatter"): DyniUnitAwareFormatterApi;
  (id: "RadialAngleMath"): DyniRadialAngleMathApi;
  (id: "RadialSectorMath"): DyniRadialSectorMathApi;
  (id: "RadialTickMath"): DyniRadialTickMathApi;
  (id: "RegattaTimerPhase"): DyniRegattaTimerPhaseApi;
  (id: "StateScreenInteraction"): DyniStateScreenInteractionApi;
  (id: "StateScreenLabels"): DyniStateScreenLabelsApi;
  (id: "StateScreenPrecedence"): DyniStateScreenPrecedenceApi;
  (id: "ResponsiveScaleProfile"): DyniResponsiveScaleProfileApi;
  (id: "SpringEasing"): DyniSpringEasingApi;
  (id: "StableDigits"): DyniStableDigitsApi;
  (id: "ValueMath"): DyniValueMathApi;
  (id: string): unknown;
}

interface DyniComponentContext {
  components: {
    require: DyniComponentRequire;
  };
  format: DyniFormatService;
}
