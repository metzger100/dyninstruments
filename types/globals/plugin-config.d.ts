// Ambient types for shared plugin config: unit-format catalog, plugin shared
// config, and editable-parameter specs.

interface DyniUnitFormatFamily {
  tokens: readonly string[];
  labels: Readonly<Record<string, string>>;
  selectorList?: readonly DyniEditableOption[];
}

interface DyniUnitFormatBinding {
  family: string;
  defaultToken: string;
  rendererKey?: string;
}

interface DyniUnitFormatCatalog {
  families: Readonly<Record<string, DyniUnitFormatFamily>>;
  metricBindings: Readonly<Record<string, DyniUnitFormatBinding>>;
}

interface DyniPluginSharedConfig {
  kindMaps?: Record<string, DyniPerKindTextParameterMap>;
  componentRegistryGroups?: Record<string, DyniComponentRegistryGroup>;
  unitFormatFamilies?: DyniUnitFormatCatalog;
  commonThreeElementsEditables?: DyniEditableParameters;
  makeKindCondition?: (kind: unknown, fallbackKind: string) => DyniEditableCondition;
  makePerKindTextParams?: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makePerKindCaptionParams?: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makeUnitAwareTextParams?: (
    map: DyniPerKindTextParameterMap,
    bindings: Readonly<Record<string, DyniUnitFormatBinding>>
  ) => DyniEditableParameters;
  opt?: (name: unknown, value: unknown) => DyniEditableOption;
  buildEnvironmentEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentBaseEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentDepthEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentModeEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentTemperatureEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentSharedScaleEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentPerKindEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentThresholdEditableParameters?: () => DyniEditableParameters;
  buildVesselVoltageGaugeParams?: () => DyniEditableParameters;
  buildDefaultRadialEditableParameters?: () => DyniEditableParameters;
}

interface DyniXteScaleFieldSpec {
  default: number;
  min: number;
  max: number;
  step: number;
}

interface DyniEnvironmentEditableBuilders {
  buildEnvironmentBaseEditableParameters(): DyniEditableParameters;
  buildEnvironmentDepthEditableParameters(): DyniEditableParameters;
  buildEnvironmentModeEditableParameters(): DyniEditableParameters;
  buildEnvironmentTemperatureEditableParameters(): DyniEditableParameters;
  buildEnvironmentSharedScaleEditableParameters(): DyniEditableParameters;
  buildEnvironmentPerKindEditableParameters(): DyniEditableParameters;
  buildEnvironmentThresholdEditableParameters(): DyniEditableParameters;
}

interface DyniPluginConfig {
  bootstrapManifest?: string[];
  clusterRoutes: DyniClusterRoutesConfig;
  clusters?: DyniWidgetDefinition[];
  shared?: DyniPluginSharedConfig;
  components?: DyniComponentRegistryGroup;
  widgetDefinitions?: DyniWidgetDefinition[];
}

interface DyniEditableParameterSpec {
  default?: unknown;
  internal?: unknown;
  [key: string]: unknown;
}

type DyniEditableParameters = Record<string, DyniEditableParameterSpec | boolean>;

type DyniEditableCondition = { kind: string } | Array<{ kind: unknown }>;

interface DyniEditableOption {
  name: unknown;
  value: unknown;
}

interface DyniPerKindTextParameterDescriptor {
  kind?: unknown;
  captionName?: unknown;
  unitName?: unknown;
  cap?: unknown;
  unit?: unknown;
}

type DyniPerKindTextParameterMap = Record<string, DyniPerKindTextParameterDescriptor>;
