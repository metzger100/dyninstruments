export function stablePercentile(values, percentile) {
  const list = Array.isArray(values) ? values.filter(Number.isFinite) : [];
  if (!list.length) {
    return 0;
  }
  const sorted = list.slice().sort((a, b) => a - b);
  if (percentile <= 0) {
    return sorted[0];
  }
  if (percentile >= 100) {
    return sorted[sorted.length - 1];
  }
  const rank = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = rank - lower;
  return sorted[lower] + ((sorted[upper] - sorted[lower]) * weight);
}

export function summarizeSamples(values) {
  const list = Array.isArray(values) ? values.filter(Number.isFinite) : [];
  if (!list.length) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0
    };
  }

  const sorted = list.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    p50: stablePercentile(sorted, 50),
    p95: stablePercentile(sorted, 95),
    p99: stablePercentile(sorted, 99)
  };
}

export function toFixedNumber(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(digits));
}

export function normalizeSummary(summary, digits = 3) {
  return {
    count: summary.count,
    min: toFixedNumber(summary.min, digits),
    max: toFixedNumber(summary.max, digits),
    mean: toFixedNumber(summary.mean, digits),
    p50: toFixedNumber(summary.p50, digits),
    p95: toFixedNumber(summary.p95, digits),
    p99: toFixedNumber(summary.p99, digits)
  };
}
