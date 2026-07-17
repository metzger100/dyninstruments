const { loadFresh } = require("../../helpers/load-umd");

const mapperCases = [
  {
    rel: "cluster/mappers/SpeedMapper.js",
    kind: "sogRadial",
    props: { kind: "sogRadial", sog: 5 },
  },
  {
    rel: "cluster/mappers/EnvironmentMapper.js",
    kind: "depthRadial",
    props: { kind: "depthRadial", depth: 12 },
  },
  {
    rel: "cluster/mappers/EnvironmentMapper.js",
    kind: "tempRadial",
    props: { kind: "tempRadial", temp: 18 },
  },
  {
    rel: "cluster/mappers/VesselMapper.js",
    kind: "voltageRadial",
    props: { kind: "voltageRadial", value: 12.7 },
  },
  {
    rel: "cluster/mappers/WindMapper.js",
    kind: "angleTrueRadial",
    props: { kind: "angleTrueRadial", twa: 25, tws: 7 },
  },
  {
    rel: "cluster/mappers/CourseHeadingMapper.js",
    kind: "hdtRadial",
    props: { kind: "hdtRadial", hdt: 312 },
  },
];

function makeToolkit() {
  return {
    cap(name) {
      return "cap:" + name;
    },
    unit(name) {
      return "unit:" + name;
    },
    formatUnit(metricKey, familyId, fallbackToken) {
      return fallbackToken;
    },
    unitText(metricKey, familyId, selectedUnitToken) {
      return "unit:" + metricKey + ":" + String(selectedUnitToken || "");
    },
    unitNumber() {
      return undefined;
    },
    out(v, cap, unit, formatter, formatterParameters) {
      const o = {};
      if (typeof v !== "undefined") o.value = v;
      if (typeof cap !== "undefined") o.caption = cap;
      if (typeof unit !== "undefined") o.unit = unit;
      if (typeof formatter !== "undefined") o.formatter = formatter;
      if (Array.isArray(formatterParameters)) {
        o.formatterParameters = formatterParameters;
      }
      return o;
    },
    num(value) {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    },
    makeAngleFormatter() {
      return function (raw) {
        return String(raw);
      };
    },
  };
}

function collectInvalidNumbers(value, prefix, out) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    out.push(prefix + "=" + String(value));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(function (item, index) {
      collectInvalidNumbers(item, prefix + "[" + index + "]", out);
    });
    return;
  }
  Object.keys(value).forEach(function (key) {
    collectInvalidNumbers(value[key], prefix + "." + key, out);
  });
}

function expectFiniteMapperOutput(output) {
  const invalids = [];
  collectInvalidNumbers(output, "out", invalids);
  expect(invalids).toEqual([]);
}

describe("mapper output finiteness", function () {
  it.each(mapperCases)(
    "does not emit non-finite numbers for $kind",
    function (item) {
      const mapper = loadFresh(item.rel).create();
      const translated = mapper.translate(item.props, {
        toolkit: makeToolkit(),
      });

      expectFiniteMapperOutput(translated || {});
    },
  );

  it("fails when nested mapper output contains a non-finite number", function () {
    expect(function () {
      expectFiniteMapperOutput({
        rendererProps: { threshold: NaN },
      });
    }).toThrow();
  });
});
