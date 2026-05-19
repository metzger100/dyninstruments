const { loadFresh } = require("../../helpers/load-umd");

describe("LayoutRectMath", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/layout/LayoutRectMath.js").create();
  }

  it("splits a row with gap and remainder absorption on the last cell", function () {
    const api = createApi();
    const rect = api.makeRect(0, 0, 100, 20);
    const cells = api.splitRow(rect, 4, 3, api.makeRect);

    expect(cells).toHaveLength(3);
    expect(cells[0]).toEqual({ x: 0, y: 0, w: 30, h: 20 });
    expect(cells[1]).toEqual({ x: 34, y: 0, w: 31, h: 20 });
    expect(cells[2]).toEqual({ x: 69, y: 0, w: 31, h: 20 });
    expect(cells.every((cell) => cell.w >= 1)).toBe(true);
  });

  it("splits a stack with gap and keeps positive heights", function () {
    const api = createApi();
    const rect = api.makeRect(0, 0, 40, 55);
    const rows = api.splitStack(rect, 4, 2, api.makeRect);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ x: 0, y: 0, w: 40, h: 25 });
    expect(rows[1]).toEqual({ x: 0, y: 29, w: 40, h: 26 });
    expect(rows.every((row) => row.h >= 1)).toBe(true);
  });

  it("returns the original row when count is one", function () {
    const api = createApi();
    const rect = api.makeRect(5, 7, 18, 9);
    const cells = api.splitRow(rect, 0, 1, api.makeRect);

    expect(cells).toEqual([rect]);
  });
});
