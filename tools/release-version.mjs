const NUMERIC_IDENTIFIER = "(?:0|[1-9]\\d*)";
const NON_NUMERIC_IDENTIFIER = "(?:\\d*[A-Za-z-][0-9A-Za-z-]*)";
const PRERELEASE_IDENTIFIER = `(?:${NUMERIC_IDENTIFIER}|${NON_NUMERIC_IDENTIFIER})`;
const BUILD_IDENTIFIER = "(?:[0-9A-Za-z-]+)";

export const VERSION_PATTERN_SOURCE =
  `^${NUMERIC_IDENTIFIER}\\.${NUMERIC_IDENTIFIER}\\.${NUMERIC_IDENTIFIER}` +
  `(?:-${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*)?` +
  `(?:\\+${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*)?$`;

export const VERSION_REGEX = new RegExp(VERSION_PATTERN_SOURCE);

export function isValidReleaseVersion(version) {
  return VERSION_REGEX.test(version);
}

export function parseReleaseTag(tag) {
  if (typeof tag !== "string" || tag.charAt(0) !== "v") {
    throw new Error("release tag must use the vX.Y.Z form");
  }

  const version = tag.slice(1);
  if (!isValidReleaseVersion(version)) {
    throw new Error(`release tag is not valid SemVer: ${tag}`);
  }
  return version;
}

export function classifyReleaseTag(tag) {
  const version = parseReleaseTag(tag);
  const buildSeparator = version.indexOf("+");
  const versionWithoutBuild = buildSeparator === -1 ? version : version.slice(0, buildSeparator);

  return {
    version,
    prerelease: versionWithoutBuild.includes("-")
  };
}

export function formatGithubOutput(tag) {
  const release = classifyReleaseTag(tag);
  return `version=${release.version}\nprerelease=${release.prerelease}\n`;
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length === 1) {
    process.stdout.write(parseReleaseTag(argv[0]) + "\n");
    return;
  }
  if (argv.length === 2 && argv[0] === "--github-output") {
    process.stdout.write(formatGithubOutput(argv[1]));
    return;
  }
  throw new Error("Usage: node tools/release-version.mjs [--github-output] vX.Y.Z");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}
