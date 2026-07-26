// Ambient types for the surface controller/policy runtime, asset preloader,
// cluster shell renderer, and cluster mapper/view-model toolkits.

interface DyniSurfaceControllerOptions {
  surface?: unknown;
  hostContext?: unknown;
  rendererId?: unknown;
  props?: unknown;
  [key: string]: unknown;
}

interface DyniSurfaceControllerFactory {
  createSurfaceController(options: DyniSurfaceControllerOptions): unknown;
}

interface DyniSurfacePolicyRouteState {
  route: { rendererId: string };
  props: Record<string, unknown>;
}

interface DyniSurfacePolicy {
  resolveRouteStateWithPolicy(
    routeState: DyniSurfacePolicyRouteState,
    hostContext: unknown
  ): DyniSurfacePolicyRouteState;
  resolveShellWidth(shellEl: unknown): number | undefined;
}

interface DyniSurfaceRuntimeApi {
  createController(options?: DyniSurfaceControllerOptions | null): unknown;
  materializeSurfacePolicyProps(options?: DyniSurfaceControllerOptions | null): Record<string, unknown>;
  getCommonShadowCssUrl(): string;
}

type DyniAssetType = "svg" | "image" | "audio" | "json" | "font";

interface DyniAssetDeclaration {
  key: string;
  path: string;
  type: DyniAssetType;
}

interface DyniAssetRecord {
  status: "pending" | "loaded" | "failed";
  type: DyniAssetType;
  value: unknown;
}

interface DyniAssetFetchResponse {
  ok?: unknown;
  status?: unknown;
  text(): Promise<unknown>;
  arrayBuffer(): Promise<unknown>;
  json(): Promise<unknown>;
}

interface DyniAssetPreloader {
  preloadAssets(assetDeclarations: unknown): Promise<unknown[]>;
  getAsset(key: string): unknown;
}

interface DyniRouteFrame extends Record<string, unknown> {
  cluster?: unknown;
  kind?: unknown;
  __dyniRouteId?: unknown;
  __dyniRawProps?: DyniMapperProps;
}

interface DyniClusterShellHostContext {
  __dyniHostCommitState?: DyniHostCommitState | { instanceId?: unknown } | null;
}

interface DyniClusterShellRendererApi {
  normalizeRouteFrame(rawProps: unknown, def: unknown, clusterRoutes?: unknown): DyniRouteFrame;
  renderRouteShell(
    routeFrame: unknown,
    routeMeta: DyniClusterRoute | null | undefined,
    instanceId: unknown,
    hostContext: DyniClusterShellHostContext | null | undefined
  ): string;
}

interface DyniMapperToolkit {
  cap(kind: string): unknown;
  unit(kind: string): unknown;
  unitText(kind: string, metric: string, token: unknown): unknown;
  formatUnit(kind: string, metric: string): unknown;
  unitNumber(key: string, token: unknown): number | undefined;
  positiveUnitNumber(key: string, token: unknown, defaultValue: number): number;
  makeAngleFormatter(direction: boolean, leadingZero: boolean, defaultValue: unknown): unknown;
  num(value: unknown): number | undefined;
  out(
    value: unknown,
    caption: unknown,
    unit: unknown,
    formatter: unknown,
    formatterParameters: unknown
  ): Record<string, unknown>;
}

interface DyniMapperViewModel {
  build(props: DyniMapperProps): unknown;
}

interface DyniMapperRouteContextWithViewModel extends DyniMapperRouteContext {
  viewModel?: DyniMapperViewModel | null;
}

interface DyniMapperRouteContext {
  toolkit: DyniMapperToolkit;
}

type DyniMapperProps = Record<string, unknown>;

interface DyniViewModelToolkit {
  cap?(key: string): unknown;
  unit?(key: string): unknown;
  num?(value: unknown): number | undefined;
}

interface DyniActiveRouteViewModelToolkit {
  cap(key: string): unknown;
  unit(key: string): unknown;
  num?(value: unknown): number | undefined;
}
