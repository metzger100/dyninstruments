function flushPromises(turns) {
  const count = Number.isInteger(turns) && turns > 0 ? turns : 4;
  let chain = Promise.resolve();
  for (let i = 0; i < count; i++) {
    chain = chain.then(() => Promise.resolve());
  }
  return chain;
}

module.exports = {
  flushPromises
};
