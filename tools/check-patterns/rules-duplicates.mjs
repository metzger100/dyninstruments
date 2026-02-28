import {
  asGlobal,
  compareFindings,
  findMatchingBrace,
  getFileData,
  lineAt
} from "./shared.mjs";
import {
  compareDuplicateGroups,
  countControlTokens,
  countStatementMarkers,
  dedupeLocations,
  mergeCloneSegments,
  toShapeToken,
  tokenLineAt,
  tokenizeDuplicationBody
} from "./duplicate-utils.mjs";

const DUPLICATE_FN_MIN_EXACT_TOKENS = 50;
const DUPLICATE_FN_MIN_SHAPE_TOKENS = 90;
const DUPLICATE_FN_MIN_SHAPE_CONTROL = 2;
const DUPLICATE_FN_MIN_SHAPE_STATEMENTS = 6;
const DUPLICATE_BLOCK_WINDOW = 35;
const DUPLICATE_BLOCK_MIN_TOKENS = 120;
const DUPLICATE_BLOCK_MIN_STATEMENTS = 6;

export function runDuplicateFunctions(rule, files) {
  const groupsExact = new Map();
  const groupsShape = new Map();
  const functions = extractFunctionsForDuplication(files, new Set(rule.allowlist || []));

  for (const entry of functions) {
    if (entry.tokensExact.length >= DUPLICATE_FN_MIN_EXACT_TOKENS) {
      const key = entry.signatureExact;
      if (!groupsExact.has(key)) {
        groupsExact.set(key, {
          mode: "exact",
          tokenCount: entry.tokensExact.length,
          records: []
        });
      }
      groupsExact.get(key).records.push(entry);
    }
    if (
      entry.tokensShape.length >= DUPLICATE_FN_MIN_SHAPE_TOKENS
      && entry.controlCount >= DUPLICATE_FN_MIN_SHAPE_CONTROL
      && entry.statementCount >= DUPLICATE_FN_MIN_SHAPE_STATEMENTS
    ) {
      const key = entry.signatureShape;
      if (!groupsShape.has(key)) {
        groupsShape.set(key, {
          mode: "shape",
          tokenCount: entry.tokensShape.length,
          records: []
        });
      }
      groupsShape.get(key).records.push(entry);
    }
  }

  const out = [];
  const exactMarkedSignatures = new Set();
  const exactGroups = [...groupsExact.values()]
    .sort(compareDuplicateGroups);
  for (const group of exactGroups) {
    const uniqueFiles = new Set(group.records.map((rec) => rec.file));
    if (uniqueFiles.size < 2) continue;
    const locations = dedupeLocations(group.records.map(function (rec) {
      return { file: rec.file, line: rec.line };
    })).sort(compareFindings);
    for (const rec of group.records) exactMarkedSignatures.add(rec.signatureExact);
    out.push({
      file: locations[0].file,
      line: locations[0].line,
      message: rule.message({
        mode: group.mode,
        tokenCount: group.tokenCount,
        fileCount: uniqueFiles.size,
        locations
      })
    });
  }

  const shapeGroups = [...groupsShape.values()]
    .sort(compareDuplicateGroups);
  for (const group of shapeGroups) {
    const uniqueFiles = new Set(group.records.map((rec) => rec.file));
    if (uniqueFiles.size < 2) continue;

    const exactSignatures = new Set(group.records.map((rec) => rec.signatureExact));
    if (exactSignatures.size === 1 && exactMarkedSignatures.has([...exactSignatures][0])) continue;

    const locations = dedupeLocations(group.records.map(function (rec) {
      return { file: rec.file, line: rec.line };
    })).sort(compareFindings);
    out.push({
      file: locations[0].file,
      line: locations[0].line,
      message: rule.message({
        mode: group.mode,
        tokenCount: group.tokenCount,
        fileCount: uniqueFiles.size,
        locations
      })
    });
  }

  return out;
}

export function runDuplicateBlockClones(rule, files) {
  const out = [];
  const functions = extractFunctionsForDuplication(files, new Set(rule.allowlist || []));
  const byId = new Map(functions.map((entry) => [entry.id, entry]));
  const windowGroups = new Map();

  for (const entry of functions) {
    if (entry.tokensExact.length < DUPLICATE_BLOCK_WINDOW) continue;
    for (let i = 0; i <= entry.tokensExact.length - DUPLICATE_BLOCK_WINDOW; i += 1) {
      const key = entry.tokensExact.slice(i, i + DUPLICATE_BLOCK_WINDOW).join(" ");
      if (!windowGroups.has(key)) windowGroups.set(key, []);
      windowGroups.get(key).push({
        id: entry.id,
        file: entry.file,
        start: i,
        end: i + DUPLICATE_BLOCK_WINDOW
      });
    }
  }

  const pairDeltaGroups = new Map();
  for (const matches of windowGroups.values()) {
    if (matches.length < 2) continue;
    for (let i = 0; i < matches.length; i += 1) {
      for (let j = i + 1; j < matches.length; j += 1) {
        const leftRaw = matches[i];
        const rightRaw = matches[j];
        if (leftRaw.file === rightRaw.file) continue;

        let left = leftRaw;
        let right = rightRaw;
        if (left.id > right.id) {
          left = rightRaw;
          right = leftRaw;
        }
        const delta = left.start - right.start;
        const key = `${left.id}:${right.id}:${delta}`;
        if (!pairDeltaGroups.has(key)) {
          pairDeltaGroups.set(key, {
            leftId: left.id,
            rightId: right.id,
            segments: []
          });
        }
        pairDeltaGroups.get(key).segments.push({
          leftStart: left.start,
          leftEnd: left.end,
          rightStart: right.start,
          rightEnd: right.end
        });
      }
    }
  }

  const seen = new Set();
  const sortedGroups = [...pairDeltaGroups.values()]
    .sort(function (a, b) {
      return a.leftId - b.leftId || a.rightId - b.rightId;
    });
  for (const group of sortedGroups) {
    const leftFn = byId.get(group.leftId);
    const rightFn = byId.get(group.rightId);
    if (!leftFn || !rightFn) continue;

    const merged = mergeCloneSegments(group.segments);
    for (const segment of merged) {
      const tokenCount = segment.leftEnd - segment.leftStart;
      if (tokenCount < DUPLICATE_BLOCK_MIN_TOKENS) continue;
      const statementCount = countStatementMarkers(
        leftFn.tokensExact.slice(segment.leftStart, segment.leftEnd)
      );
      if (statementCount < DUPLICATE_BLOCK_MIN_STATEMENTS) continue;

      const leftLine = tokenLineAt(leftFn, segment.leftStart);
      const rightLine = tokenLineAt(rightFn, segment.rightStart);
      const signature = [
        leftFn.file,
        leftLine,
        rightFn.file,
        rightLine,
        tokenCount
      ].join(":");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const locations = [
        { file: leftFn.file, line: leftLine },
        { file: rightFn.file, line: rightLine }
      ].sort(compareFindings);
      out.push({
        file: locations[0].file,
        line: locations[0].line,
        message: rule.message({
          tokenCount,
          statementCount,
          locations
        })
      });
    }
  }

  return out;
}

function extractFunctionsForDuplication(files, allowlist) {
  const out = [];
  const patterns = [
    /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function(?:\s+[A-Za-z_$][A-Za-z0-9_$]*)?\s*\([^)]*\)\s*\{/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*\{/g
  ];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    for (const pattern of patterns) {
      const re = asGlobal(pattern);
      let match;
      while ((match = re.exec(data.maskedText))) {
        const name = match[1];
        if (allowlist.has(name)) continue;
        const braceIndex = data.maskedText.indexOf("{", match.index + match[0].length - 1);
        if (braceIndex < 0) continue;
        const bodyEnd = findMatchingBrace(data.maskedText, braceIndex);
        if (bodyEnd < 0) continue;
        const dedupeKey = `${name}:${match.index}:${braceIndex}:${bodyEnd}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const bodyStart = braceIndex + 1;
        const bodyText = data.text.slice(bodyStart, bodyEnd);
        const bodyStartLine = lineAt(bodyStart, data.lineStarts);
        const tokens = tokenizeDuplicationBody(bodyText, bodyStartLine);
        if (!tokens.length) continue;
        const tokensExact = tokens.map(function (token) { return token.value; });
        const tokensShape = tokens.map(toShapeToken);
        out.push({
          id: -1,
          file,
          name,
          line: lineAt(match.index, data.lineStarts),
          tokens,
          tokensExact,
          tokensShape,
          signatureExact: tokensExact.join(" "),
          signatureShape: tokensShape.join(" "),
          controlCount: countControlTokens(tokensExact),
          statementCount: countStatementMarkers(tokensExact)
        });
        if (match[0].length === 0) re.lastIndex += 1;
      }
    }
  }

  out.sort(function (a, b) {
    return compareFindings(a, b) || a.name.localeCompare(b.name);
  });
  for (let i = 0; i < out.length; i += 1) out[i].id = i + 1;
  return out;
}
