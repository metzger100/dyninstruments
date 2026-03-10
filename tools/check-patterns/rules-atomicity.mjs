import { escapeRegex, findMatchingBrace, getFileData, lineAt, readLiteralToken } from "./shared.mjs";
import { getAtomicityContracts, getUniqueConfigDefault } from "./atomicity-contracts.mjs";
import {
  collectFrameworkAliases,
  normalizeToken,
  readConstLiteral,
  readDefaultRatioMap
} from "./atomicity-parser.mjs";

const CANVAS_METHODS = new Set([
  "arc",
  "beginPath",
  "closePath",
  "createLinearGradient",
  "createRadialGradient",
  "drawImage",
  "fill",
  "fillRect",
  "getImageData",
  "lineTo",
  "measureText",
  "moveTo",
  "putImageData",
  "restore",
  "save",
  "setLineDash",
  "stroke",
  "strokeRect"
]);

const ENGINE_LAYOUT_FAMILIES = [
  {
    family: "LinearGauge",
    engineFile: "shared/widget-kits/linear/LinearGaugeEngine.js",
    layoutFile: "shared/widget-kits/linear/LinearGaugeLayout.js"
  },
  {
    family: "SemicircleRadial",
    engineFile: "shared/widget-kits/radial/SemicircleRadialEngine.js",
    layoutFile: "shared/widget-kits/radial/SemicircleRadialLayout.js"
  },
  {
    family: "FullCircleRadial",
    engineFile: "shared/widget-kits/radial/FullCircleRadialEngine.js",
    layoutFile: "shared/widget-kits/radial/FullCircleRadialLayout.js"
  }
];

export function runWidgetRendererDefaultDuplicationRule(rule, files) {
  const out = [];
  const contracts = getAtomicityContracts();
  const fileSet = new Set(files);

  for (const spec of contracts.widgetSpecs) {
    if (!fileSet.has(spec.file)) {
      continue;
    }
    pushRendererDefaultDuplicationFinding(out, rule, spec, contracts.configDefaultsByKey, "ratioDefaults", "ratioProps");
    pushRendererDefaultDuplicationFinding(out, rule, spec, contracts.configDefaultsByKey, "rangeDefaults", "rangeProps");
  }

  return out;
}

export function runEngineLayoutDefaultDriftRule(rule, files) {
  const out = [];
  const fileSet = new Set(files);

  for (const familySpec of ENGINE_LAYOUT_FAMILIES) {
    if (!fileSet.has(familySpec.layoutFile)) {
      continue;
    }

    const engineDefaults = readDefaultRatioMap(familySpec.engineFile);
    const layoutNormal = readConstLiteral(familySpec.layoutFile, "DEFAULT_RATIO_THRESHOLD_NORMAL");
    const layoutFlat = readConstLiteral(familySpec.layoutFile, "DEFAULT_RATIO_THRESHOLD_FLAT");
    if (!engineDefaults || !layoutNormal || !layoutFlat) {
      continue;
    }

    if (layoutNormal.token === engineDefaults.normal.token) {
      out.push(buildEngineLayoutFinding(rule, familySpec, layoutNormal, "DEFAULT_RATIO_THRESHOLD_NORMAL"));
    }
    if (layoutFlat.token === engineDefaults.flat.token) {
      out.push(buildEngineLayoutFinding(rule, familySpec, layoutFlat, "DEFAULT_RATIO_THRESHOLD_FLAT"));
    }
  }

  return out;
}

export function runCanvasApiTypeofGuardRule(rule, files) {
  const out = [];
  const detect = /typeof\s+ctx\.([A-Za-z_$][A-Za-z0-9_$]*)\s*===\s*["']function["']/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.text))) {
      const methodName = match[1];
      if (!CANVAS_METHODS.has(methodName)) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${methodName}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: match[0].trim(),
          methodName
        })
      });
    }
  }

  return out;
}

export function runTryFinallyCanvasDrawingRule(rule, files) {
  const out = [];
  const detect = /\btry\s*\{/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.maskedText))) {
      const tryOpen = data.maskedText.indexOf("{", match.index + match[0].length - 1);
      if (tryOpen < 0) {
        continue;
      }
      const tryClose = findMatchingBrace(data.maskedText, tryOpen);
      if (tryClose < 0) {
        continue;
      }

      let cursor = tryClose + 1;
      while (cursor < data.maskedText.length && /\s/.test(data.maskedText[cursor])) {
        cursor += 1;
      }
      if (!data.maskedText.startsWith("finally", cursor)) {
        continue;
      }
      cursor += "finally".length;
      while (cursor < data.maskedText.length && /\s/.test(data.maskedText[cursor])) {
        cursor += 1;
      }
      if (data.maskedText[cursor] !== "{") {
        continue;
      }

      const finallyOpen = cursor;
      const finallyClose = findMatchingBrace(data.maskedText, finallyOpen);
      if (finallyClose < 0) {
        continue;
      }

      const finallyBody = data.text.slice(finallyOpen + 1, finallyClose).trim();
      const restoreMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\.restore\s*\(\s*\)\s*;?$/.exec(finallyBody);
      if (!restoreMatch) {
        continue;
      }
      const ctxAlias = restoreMatch[1];
      const prelude = data.maskedText.slice(Math.max(0, match.index - 240), match.index);
      const saveRe = new RegExp(`\\b${escapeRegex(ctxAlias)}\\.save\\s*\\(\\s*\\)`);
      if (!saveRe.test(prelude)) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${ctxAlias}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: `try { ... } finally { ${ctxAlias}.restore(); }`,
          ctxAlias
        })
      });
    }
  }

  return out;
}

export function runFrameworkMethodTypeofGuardRule(rule, files) {
  const out = [];
  const helperDetect = /typeof\s+Helpers\.([A-Za-z_$][A-Za-z0-9_$]*)\s*===\s*["']function["']/g;
  const aliasDetect = /typeof\s+([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*===\s*["']function["']/g;

  for (const file of files) {
    const data = getFileData(file);
    const aliasNames = collectFrameworkAliases(data.text);
    const seen = new Set();
    let match;

    while ((match = helperDetect.exec(data.text))) {
      const methodName = match[1];
      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:Helpers.${methodName}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: match[0].trim(),
          target: `Helpers.${methodName}`
        })
      });
    }

    while ((match = aliasDetect.exec(data.text))) {
      const alias = match[1];
      const methodName = match[2];
      if (!aliasNames.has(alias)) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${alias}.${methodName}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: match[0].trim(),
          target: `${alias}.${methodName}`
        })
      });
    }
  }

  return out;
}

export function runInlineConfigDefaultDuplicationRule(rule, files) {
  const out = [];
  const contracts = getAtomicityContracts();
  const detect = /typeof\s+([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*!==\s*["']undefined["']\s*\)?\s*\?\s*\1\.\2\s*:\s*/g;

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    let match;

    while ((match = detect.exec(data.text))) {
      const propName = match[2];
      const configEntry = getUniqueConfigDefault(contracts.configDefaultsByKey, propName);
      if (!configEntry) {
        continue;
      }

      const literal = readLiteralToken(data.text, match.index + match[0].length);
      if (!literal || normalizeToken(literal.token) !== configEntry.defaultToken) {
        continue;
      }

      const line = lineAt(match.index, data.lineStarts);
      const key = `${file}:${line}:${propName}:${literal.token}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({
          file,
          line,
          expression: `${propName} : ${normalizeToken(literal.token)}`,
          propName,
          literal: normalizeToken(literal.token),
          configFile: configEntry.file
        })
      });
    }
  }

  return out;
}

function pushRendererDefaultDuplicationFinding(out, rule, spec, configDefaultsByKey, defaultsKey, propsKey) {
  const defaultsGroup = spec[defaultsKey];
  const propsGroup = spec[propsKey];
  if (!defaultsGroup || !propsGroup) {
    return;
  }

  const keys = Object.keys(defaultsGroup.values);
  if (!keys.length) {
    return;
  }

  const configEntries = [];
  const propNames = [];
  for (const key of keys) {
    const defaultEntry = defaultsGroup.values[key];
    const propEntry = propsGroup.values[key];
    if (!defaultEntry || !propEntry) {
      return;
    }

    const configEntry = getUniqueConfigDefault(configDefaultsByKey, propEntry.value);
    if (!configEntry || defaultEntry.token !== configEntry.defaultToken) {
      return;
    }

    configEntries.push(configEntry);
    propNames.push(propEntry.value);
  }

  if (new Set(configEntries.map((entry) => entry.file)).size !== 1) {
    return;
  }

  out.push({
    file: spec.file,
    line: defaultsGroup.line,
    message: rule.message({
      file: spec.file,
      line: defaultsGroup.line,
      groupName: defaultsKey,
      expression: defaultsGroup.rawValue,
      configFile: configEntries[0].file,
      propNames: propNames.join(", ")
    })
  });
}

function buildEngineLayoutFinding(rule, familySpec, constantInfo, constantName) {
  return {
    file: familySpec.layoutFile,
    line: constantInfo.line,
    message: rule.message({
      file: familySpec.layoutFile,
      line: constantInfo.line,
      family: familySpec.family,
      constantName,
      expression: constantInfo.token,
      otherFile: familySpec.engineFile
    })
  };
}
