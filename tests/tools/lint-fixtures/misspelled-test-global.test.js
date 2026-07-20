describe("misspelled test global negative proof", function () {
  it("references an undeclared global by mistake", function () {
    exepct(1).toBe(1);
  });
});
