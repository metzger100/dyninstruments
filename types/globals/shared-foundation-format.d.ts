// Ambient types for shared foundation formatting APIs: value math, format
// service, placeholder normalization, stable digits, unit-aware formatting,
// nav mode ratio, and depth display formatting.

interface DyniValueMathApi {
  ensureObject(value: unknown, name: unknown): object;
  keyToText(value: unknown): string | undefined;
  toText(value: unknown): string;
  toFiniteNumber(value: unknown): number | undefined;
  toOptionalFiniteNumber(value: unknown): number | undefined;
  resolveFiniteNumber(value: unknown, defaultValue: number): number;
  clamp(value: unknown, lo: unknown, hi: unknown): number;
  clampNumber(value: unknown, min: number, max: number, defaultValue: number): number;
  appendUnit(valueText: unknown, displayUnit: unknown, defaultText: unknown): string;
  textLength(value: unknown): number;
  toSafeInteger(value: unknown, defaultValue: number): number;
  isApprox(a: unknown, b: unknown, eps: unknown): boolean;
  almostInt(value: number, eps: unknown): boolean;
  lerp(from: number, to: number, t: number): number;
  formatGaugeDisplay(
    raw: unknown,
    props: DyniFormatterOptions | undefined,
    applyFormatter: (value: number, options: DyniFormatterOptions) => unknown,
    normalize: (text: unknown, defaultText: unknown) => string,
    defaultFormatter: unknown,
    defaultFormatterParameters: unknown
  ): { num: number; text: unknown };
  formatAngle180(value: unknown, leadingZero?: boolean): string;
  formatDirection360(value: unknown, leadingZero?: boolean): string;
  isFiniteNumber(value: unknown): value is number;
  resolveStandardTickSteps(range: unknown): { major: number; minor: number };
  resolveTemperatureTickSteps(range: unknown): { major: number; minor: number };
  resolveVoltageTickSteps(range: unknown): { major: number; minor: number };
}

interface DyniFormatService {
  applyFormatter(value: unknown, options: DyniFormatterOptions): unknown;
}

interface DyniPlaceholderNormalizeApi {
  isPlaceholder(text: unknown): boolean;
  normalize(text: unknown, defaultText?: unknown): string;
}

interface DyniStableDigitsOptions {
  integerWidth?: unknown;
  reserveSignSlot?: boolean;
  sideSuffix?: unknown;
  reserveSideSuffixSlot?: boolean;
  suffix?: unknown;
}

interface DyniStableDigitsTextPair {
  padded: string;
  plain: string;
}

interface DyniStableDigitsApi {
  id: "StableDigits";
  resolveIntegerWidth(textValue: unknown, minWidth: unknown, rangeMax?: unknown): number;
  normalize(rawFormattedText: unknown, options?: DyniStableDigitsOptions): DyniStableDigitsTextPair;
}

interface DyniUnitAwareFormatterApi {
  id: "UnitAwareFormatter";
  formatWithToken(value: unknown, formatter: unknown, token: unknown, defaultText: unknown): string;
  formatDistance(value: unknown, token: unknown, defaultText: unknown): string;
  appendUnit(valueText: unknown, displayUnit: unknown, defaultText: unknown): string;
  extractNumericDisplay(valueText: unknown, defaultValue: number): number;
}

interface DyniNavRatios {
  flat: unknown;
  high: unknown;
  normal: unknown;
}

interface DyniNavModeRatioApi {
  id: "NavModeRatio";
  resolve(mode: unknown, ratios: DyniNavRatios): unknown;
}

interface DyniDepthDisplayProps {
  default?: unknown;
  formatter?: unknown;
  formatterParameters?: unknown;
}

interface DyniDepthDisplayResult {
  num: number;
  text: unknown;
}

type DyniDepthFormat = (raw: unknown, props?: DyniDepthDisplayProps) => DyniDepthDisplayResult;

interface DyniDepthDisplayFormatterApi {
  id: "DepthDisplayFormatter";
  formatDisplay(
    raw: unknown,
    props: DyniDepthDisplayProps | undefined,
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): DyniDepthDisplayResult;
  createFormatDisplay(
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): DyniDepthFormat;
  createCanvasFormatDisplay(
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): (raw: unknown, props?: DyniDepthDisplayProps) => { num: number; text: string };
}
