const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/perf/profile.mjs", function () {
  const profilePath = path.resolve(__dirname, "../../tools/perf/profile.mjs");
  let summarizeCpuProfile;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(profilePath).href);
    summarizeCpuProfile = mod.summarizeCpuProfile;
  });

  it("builds top self/total lists with shares", function () {
    const profile = {
      nodes: [
        {
          id: 1,
          callFrame: { functionName: "(root)", url: "" },
          children: [2, 3]
        },
        {
          id: 2,
          callFrame: {
            functionName: "f1",
            url: path.join(process.cwd(), "cluster/ClusterWidget.js")
          },
          children: []
        },
        {
          id: 3,
          callFrame: {
            functionName: "f2",
            url: path.join(process.cwd(), "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js")
          },
          children: []
        }
      ],
      samples: [2, 2, 3],
      timeDeltas: [1000, 2000, 1000]
    };

    const summary = summarizeCpuProfile(profile, { rootDir: process.cwd() });

    expect(summary.top_by_self).toHaveLength(2);
    expect(summary.top_by_self[0].function_name).toBe("f1");
    expect(summary.top_by_self[0].file).toContain("cluster/ClusterWidget.js");
    expect(summary.hottest_self_share_pct).toBeGreaterThan(70);
    expect(summary.top5_self_share_pct).toBeGreaterThan(99);
  });

  it("normalizes file:// URLs into repo-relative paths", function () {
    const clusterPath = path.join(process.cwd(), "cluster/ClusterWidget.js");
    const profile = {
      nodes: [
        {
          id: 1,
          callFrame: { functionName: "(root)", url: "" },
          children: [2]
        },
        {
          id: 2,
          callFrame: {
            functionName: "f_file_url",
            url: pathToFileURL(clusterPath).href
          },
          children: []
        }
      ],
      samples: [2],
      timeDeltas: [1000]
    };

    const summary = summarizeCpuProfile(profile, { rootDir: process.cwd() });
    expect(summary.top_by_self).toHaveLength(1);
    expect(summary.top_by_self[0].file).toBe("cluster/ClusterWidget.js");
  });
});
