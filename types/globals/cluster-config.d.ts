// Ambient types for cluster route/component-registry config and the
// nav/vessel cluster shared-config shapes.

interface DyniClusterRoute {
  cluster: string;
  kind: string;
  mapperId: string;
  rendererId: string;
  viewModelId?: string;
  surface: "html" | "canvas-dom";
  shellSizing: { kind: "ratio"; aspectRatio: number } | { kind: "natural" };
  routeId?: string;
}

interface DyniClusterRoutesConfig {
  schemaVersion: number;
  routes: DyniClusterRoute[];
  byRouteId?: Record<string, DyniClusterRoute>;
}

interface DyniComponentDefinition {
  js: string;
  css?: undefined;
  shadowCss?: string[];
  globalKey: string;
  deps?: string[];
  assets?: DyniAssetDeclaration[];
  apiShape?: "factory" | "module";
}

type DyniComponentRegistryGroup = Record<string, DyniComponentDefinition>;

interface DyniNavClusterSharedConfig extends DyniPluginSharedConfig {
  kindMaps: {
    NAV_TEXT_KIND: DyniPerKindTextParameterMap;
    NAV_UNIT_AWARE_KIND: DyniPerKindTextParameterMap;
  };
  unitFormatFamilies: DyniUnitFormatCatalog;
  commonThreeElementsEditables: DyniEditableParameters;
  makePerKindCaptionParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makePerKindTextParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makeUnitAwareTextParams: (
    map: DyniPerKindTextParameterMap,
    bindings: Readonly<Record<string, DyniUnitFormatBinding>>
  ) => DyniEditableParameters;
  makeFormatUnitSelectParam: (
    metricKey: string,
    binding: DyniUnitFormatBinding,
    kindDef?: DyniPerKindTextParameterDescriptor
  ) => DyniEditableParameters;
  makePerUnitStringParams: (
    metricKey: string,
    binding: DyniUnitFormatBinding,
    kindDef?: DyniPerKindTextParameterDescriptor
  ) => DyniEditableParameters;
  opt: (name: unknown, value: unknown) => DyniEditableOption;
  buildNavRatioThresholdEditableParameters: () => DyniEditableParameters;
}

interface DyniNavClusterRoot {
  DyniPlugin: DyniPluginNamespace & {
    config: DyniPluginConfig & {
      clusters: DyniWidgetDefinition[];
      shared: DyniNavClusterSharedConfig;
    };
  };
}

interface DyniVesselClusterSharedConfig extends DyniPluginSharedConfig {
  kindMaps: {
    VESSEL_KIND: DyniPerKindTextParameterMap;
  };
  makePerKindTextParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  opt: (name: unknown, value: unknown) => DyniEditableOption;
  buildVesselVoltageGaugeParams: () => DyniEditableParameters;
}

interface DyniVesselClusterRoot {
  DyniPlugin: DyniPluginNamespace & {
    config: DyniPluginConfig & {
      clusters: DyniWidgetDefinition[];
      shared: DyniVesselClusterSharedConfig;
    };
  };
}

type DyniClusterConfigValues = Record<string, unknown>;
