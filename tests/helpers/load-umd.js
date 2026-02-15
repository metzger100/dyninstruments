const path = require("node:path");

function loadFresh(relPath) {
  const abs = path.resolve(process.cwd(), relPath);
  const id = require.resolve(abs);
  delete require.cache[id];
  return require(id);
}

module.exports = {
  loadFresh
};
