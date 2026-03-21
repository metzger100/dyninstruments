import path from "node:path";
import { fileURLToPath } from "node:url";
import { toFixedNumber } from "./metrics.mjs";

export function summarizeCpuProfile(profile, options = {}) {
  if (!profile || !Array.isArray(profile.nodes)) {
    return {
      top_by_self: [],
      top_by_total: [],
      hottest_self_share_pct: 0,
      top5_self_share_pct: 0,
      total_profiled_ms: 0
    };
  }

  const rootDir = path.resolve(options.rootDir || process.cwd());
  const nodesById = new Map();
  const parentById = new Map();

  for (const node of profile.nodes) {
    nodesById.set(node.id, node);
  }
  for (const node of profile.nodes) {
    const children = Array.isArray(node.children) ? node.children : [];
    for (const childId of children) {
      parentById.set(childId, node.id);
    }
  }

  const metricsByKey = new Map();
  const samples = Array.isArray(profile.samples) ? profile.samples : [];
  const timeDeltas = Array.isArray(profile.timeDeltas) ? profile.timeDeltas : [];

  for (let i = 0; i < samples.length; i += 1) {
    const nodeId = samples[i];
    const deltaUs = Number(timeDeltas[i] || 0);
    const deltaMs = deltaUs / 1000;
    if (!(deltaMs > 0)) {
      continue;
    }

    let cursorId = nodeId;
    let first = true;
    while (cursorId != null) {
      const node = nodesById.get(cursorId);
      if (!node) {
        break;
      }
      const callFrame = node.callFrame || {};
      const entry = getOrCreateEntry(metricsByKey, callFrame, rootDir);
      if (!entry.include) {
        cursorId = parentById.get(cursorId);
        first = false;
        continue;
      }
      entry.total_ms += deltaMs;
      if (first) {
        entry.self_ms += deltaMs;
      }

      cursorId = parentById.get(cursorId);
      first = false;
    }
  }

  const entries = Array.from(metricsByKey.values()).filter((entry) => entry.include);
  const totalSelfMs = entries.reduce((acc, entry) => acc + entry.self_ms, 0);
  const totalProfiledMs = entries.reduce((acc, entry) => acc + entry.total_ms, 0);

  const normalized = entries.map((entry) => {
    const selfShare = totalSelfMs > 0 ? (entry.self_ms / totalSelfMs) * 100 : 0;
    const totalShare = totalProfiledMs > 0 ? (entry.total_ms / totalProfiledMs) * 100 : 0;
    return {
      function_name: entry.function_name,
      file: entry.file,
      self_ms: toFixedNumber(entry.self_ms),
      total_ms: toFixedNumber(entry.total_ms),
      self_share_pct: toFixedNumber(selfShare),
      total_share_pct: toFixedNumber(totalShare)
    };
  });

  const topBySelf = normalized
    .slice()
    .sort((a, b) => b.self_ms - a.self_ms || b.total_ms - a.total_ms)
    .slice(0, 15);
  const topByTotal = normalized
    .slice()
    .sort((a, b) => b.total_ms - a.total_ms || b.self_ms - a.self_ms)
    .slice(0, 15);

  const top5Share = topBySelf.slice(0, 5).reduce((acc, entry) => acc + entry.self_share_pct, 0);
  return {
    top_by_self: topBySelf,
    top_by_total: topByTotal,
    hottest_self_share_pct: topBySelf.length ? topBySelf[0].self_share_pct : 0,
    top5_self_share_pct: toFixedNumber(top5Share),
    total_profiled_ms: toFixedNumber(totalProfiledMs)
  };
}

function getOrCreateEntry(metricsByKey, callFrame, rootDir) {
  const functionName = callFrame.functionName ? String(callFrame.functionName) : "(anonymous)";
  const normalizedFile = normalizeProfileUrl(callFrame.url, rootDir);
  const key = `${functionName}|${normalizedFile}`;

  if (metricsByKey.has(key)) {
    return metricsByKey.get(key);
  }

  const include = shouldIncludeFile(normalizedFile);
  const entry = {
    function_name: functionName,
    file: normalizedFile,
    include,
    self_ms: 0,
    total_ms: 0
  };
  metricsByKey.set(key, entry);
  return entry;
}

function normalizeProfileUrl(url, rootDir) {
  const value = typeof url === "string" ? url : "";
  if (!value) {
    return "<unknown>";
  }

  let resolvedPath = value;
  if (value.startsWith("file://")) {
    try {
      resolvedPath = fileURLToPath(value);
    } catch (error) {
      resolvedPath = value;
    }
  }

  const normalized = resolvedPath.replace(/\\/g, "/");
  const rootNorm = rootDir.replace(/\\/g, "/");
  if (normalized.startsWith(rootNorm + "/")) {
    return normalized.slice(rootNorm.length + 1);
  }

  return normalized;
}

function shouldIncludeFile(filePath) {
  if (!filePath || filePath === "<unknown>") {
    return false;
  }
  if (filePath.startsWith("node:") || filePath.includes("node_modules/")) {
    return false;
  }
  return (
    filePath.startsWith("cluster/") ||
    filePath.startsWith("widgets/") ||
    filePath.startsWith("shared/") ||
    filePath.startsWith("runtime/") ||
    filePath.startsWith("config/")
  );
}
