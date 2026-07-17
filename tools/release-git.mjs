export function getReleaseDirtyPaths(runGit) {
  const status = runGit(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const entries = status.split("\0");
  const paths = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;

    const statusCode = entry.slice(0, 2);
    const filePath = entry.slice(3);
    if (filePath) paths.push(filePath);

    if (/[RC]/.test(statusCode)) {
      index += 1;
      if (entries[index]) paths.push(entries[index]);
    }
  }

  return paths;
}

export function getUnexpectedDirtyPaths(runGit, allowedPaths = []) {
  const allowed = new Set(
    allowedPaths.map(function (filePath) {
      return normalizeRepoRelativePath(filePath);
    })
  );

  return getReleaseDirtyPaths(runGit).filter(function (filePath) {
    return !allowed.has(normalizeRepoRelativePath(filePath));
  });
}

export function normalizeRepoRelativePath(rawPath) {
  return String(rawPath ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();
}
