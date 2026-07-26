// Ambient types for shared foundation state APIs: regatta timer phase,
// state-screen interaction/labels/precedence, and the prepared-payload model
// cache.

type DyniRegattaPhase = "countdown" | "elapsed" | "idle";

interface DyniRegattaTimerPhaseApi {
  id: "RegattaTimerPhase";
  normalize(phase: unknown): DyniRegattaPhase;
}

interface DyniStateScreenInteractionOptions {
  kind?: unknown;
  baseInteraction?: unknown;
}

interface DyniStateScreenInteractionApi {
  id: "StateScreenInteraction";
  resolveInteraction(options?: DyniStateScreenInteractionOptions): unknown;
}

interface DyniStateScreenLabelsApi {
  id: "StateScreenLabels";
  KINDS: Readonly<Record<string, string>>;
  LABELS: Readonly<Record<string, string>>;
}

interface DyniStateScreenPrecedenceApi {
  id: "StateScreenPrecedence";
  pickFirst(candidates: unknown): string;
}

interface DyniPreparedPayloadInput {
  props?: unknown;
  shellRect?: unknown;
  revision?: unknown;
}

interface DyniPreparedPayloadEntry {
  revision: number | null;
  props: unknown;
  shellWidth: number | null;
  shellHeight: number | null;
  model: unknown;
}

interface DyniPreparedModelCache {
  getPreparedPayload(payload: unknown): DyniPreparedPayloadEntry;
  clear(): void;
}

interface DyniPreparedModelCacheOptions {
  buildModel?: unknown;
}

interface DyniPreparedPayloadModelCacheApi {
  createPreparedModelCache(options?: DyniPreparedModelCacheOptions): DyniPreparedModelCache;
  createPreparedPayloadCache(buildModel: unknown): DyniPreparedModelCache;
}
