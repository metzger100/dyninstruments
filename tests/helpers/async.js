/** @param {number} [turns] @returns {Promise<void>} */
function flushPromises(turns) {
  const count = typeof turns === "number" && Number.isInteger(turns) && turns > 0 ? turns : 4;
  let chain = Promise.resolve();
  for (let i = 0; i < count; i++) {
    chain = chain.then(() => Promise.resolve());
  }
  return chain;
}

module.exports = {
  flushPromises
};
