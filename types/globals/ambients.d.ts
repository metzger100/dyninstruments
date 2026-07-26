// Ambient globals: module/AMD shims, the host Window augmentation, and the
// window.DyniComponents registry variable.

declare const define:
  | undefined
  | {
      amd?: unknown;
      (dependencies: unknown[], factory: () => unknown): unknown;
    };

declare const module:
  | undefined
  | {
      exports?: unknown;
    };

interface Window {
  DyniComponents?: Record<string, unknown>;
  avnav?: { api?: DyniAvnavApi };
  DyniPluginBootstrapCore?: DyniBootstrapCoreApi;
}

declare var DyniComponents: Record<string, unknown> | undefined;
