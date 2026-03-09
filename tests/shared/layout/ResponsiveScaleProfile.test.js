const { loadFresh } = require("../../helpers/load-umd");

describe("ResponsiveScaleProfile", function () {
  const CENTER_DISPLAY_SCALES = {
    textFillScale: 1.18,
    normalCaptionShareScale: 0.78,
    flatCenterShareScale: 0.84,
    stackedCaptionScale: 0.76,
    highCenterWeightScale: 0.88
  };

  function createProfileApi() {
    return loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js").create();
  }

  function expectProfile(profile, expected) {
    expect(profile.minDim).toBe(expected.minDim);
    expect(profile.t).toBeCloseTo(expected.t, 6);
    expect(profile.textFillScale).toBeCloseTo(expected.textFillScale, 6);
    expect(profile.normalCaptionShareScale).toBeCloseTo(expected.normalCaptionShareScale, 6);
    expect(profile.flatCenterShareScale).toBeCloseTo(expected.flatCenterShareScale, 6);
    expect(profile.stackedCaptionScale).toBeCloseTo(expected.stackedCaptionScale, 6);
    expect(profile.highCenterWeightScale).toBeCloseTo(expected.highCenterWeightScale, 6);
  }

  it("locks the CenterDisplay baseline profile curve at boundary sizes", function () {
    const profileApi = createProfileApi();
    const cases = [
      {
        width: 60,
        height: 120,
        expected: {
          minDim: 60,
          t: 0,
          textFillScale: 1.18,
          normalCaptionShareScale: 0.78,
          flatCenterShareScale: 0.84,
          stackedCaptionScale: 0.76,
          highCenterWeightScale: 0.88
        }
      },
      {
        width: 80,
        height: 160,
        expected: {
          minDim: 80,
          t: 0,
          textFillScale: 1.18,
          normalCaptionShareScale: 0.78,
          flatCenterShareScale: 0.84,
          stackedCaptionScale: 0.76,
          highCenterWeightScale: 0.88
        }
      },
      {
        width: 130,
        height: 220,
        expected: {
          minDim: 130,
          t: 0.5,
          textFillScale: 1.09,
          normalCaptionShareScale: 0.89,
          flatCenterShareScale: 0.92,
          stackedCaptionScale: 0.88,
          highCenterWeightScale: 0.94
        }
      },
      {
        width: 180,
        height: 260,
        expected: {
          minDim: 180,
          t: 1,
          textFillScale: 1,
          normalCaptionShareScale: 1,
          flatCenterShareScale: 1,
          stackedCaptionScale: 1,
          highCenterWeightScale: 1
        }
      },
      {
        width: 240,
        height: 400,
        expected: {
          minDim: 240,
          t: 1,
          textFillScale: 1,
          normalCaptionShareScale: 1,
          flatCenterShareScale: 1,
          stackedCaptionScale: 1,
          highCenterWeightScale: 1
        }
      }
    ];

    cases.forEach((testCase) => {
      expectProfile(
        profileApi.computeProfile(testCase.width, testCase.height, { scales: CENTER_DISPLAY_SCALES }),
        testCase.expected
      );
    });
  });

  it("scales compact profiles more aggressively than medium and large profiles", function () {
    const profileApi = createProfileApi();
    const compact = profileApi.computeProfile(120, 80, { scales: CENTER_DISPLAY_SCALES });
    const medium = profileApi.computeProfile(140, 90, { scales: CENTER_DISPLAY_SCALES });
    const large = profileApi.computeProfile(260, 180, { scales: CENTER_DISPLAY_SCALES });

    expect(compact.textFillScale).toBeGreaterThan(medium.textFillScale);
    expect(medium.textFillScale).toBeGreaterThan(large.textFillScale);
    expect(compact.normalCaptionShareScale).toBeLessThan(medium.normalCaptionShareScale);
    expect(medium.normalCaptionShareScale).toBeLessThan(large.normalCaptionShareScale);
    expect(compact.flatCenterShareScale).toBeLessThan(medium.flatCenterShareScale);
    expect(medium.flatCenterShareScale).toBeLessThan(large.flatCenterShareScale);
  });

  it("computes inset pixels from minDim ratios with floor guards", function () {
    const profileApi = createProfileApi();
    const compact = profileApi.computeProfile(20, 50, { scales: CENTER_DISPLAY_SCALES });
    const medium = profileApi.computeProfile(140, 220, { scales: CENTER_DISPLAY_SCALES });

    expect(profileApi.computeInsetPx(compact, 0.03, 1)).toBe(1);
    expect(profileApi.computeInsetPx(compact, 0.02, 1)).toBe(1);
    expect(profileApi.computeInsetPx(medium, 0.03, 1)).toBe(4);
    expect(profileApi.computeInsetPx(medium, 0.02, 1)).toBe(2);
  });

  it("scales share-like values while clamping to explicit bounds", function () {
    const profileApi = createProfileApi();

    expect(profileApi.scaleShare(0.28, 0.78, 0.16, 0.42)).toBeCloseTo(0.2184, 6);
    expect(profileApi.scaleShare(0.42, 0.84, 0.28, 0.56)).toBeCloseTo(0.3528, 6);
    expect(profileApi.scaleShare(0.16, 0.5, 0.16, 0.34)).toBe(0.16);
    expect(profileApi.scaleShare(0.34, 1.5, 0.16, 0.34)).toBe(0.34);
  });

  it("scales max text pixels with floor-safe rounding", function () {
    const profileApi = createProfileApi();

    expect(profileApi.scaleMaxTextPx(20, 1.18)).toBe(23);
    expect(profileApi.scaleMaxTextPx(20, 1)).toBe(20);
    expect(profileApi.scaleMaxTextPx(1, 0.5)).toBe(1);
  });

  it("computes intrinsic inner spacing from span, fill scale, and item count", function () {
    const profileApi = createProfileApi();
    const compact = profileApi.computeProfile(120, 80, { scales: CENTER_DISPLAY_SCALES });
    const medium = profileApi.computeProfile(160, 120, { scales: CENTER_DISPLAY_SCALES });
    const large = profileApi.computeProfile(260, 180, { scales: CENTER_DISPLAY_SCALES });
    const spanPx = 240;

    expect(profileApi.computeIntrinsicSpacePx(compact, spanPx, 0.08, 2, 1)).toBeLessThan(
      profileApi.computeIntrinsicSpacePx(medium, spanPx, 0.08, 2, 1)
    );
    expect(profileApi.computeIntrinsicSpacePx(medium, spanPx, 0.08, 2, 1)).toBeLessThan(
      profileApi.computeIntrinsicSpacePx(large, spanPx, 0.08, 2, 1)
    );
    expect(profileApi.computeIntrinsicSpacePx(compact, spanPx, 0.08, 4, 1)).toBeLessThan(
      profileApi.computeIntrinsicSpacePx(compact, spanPx, 0.08, 2, 1)
    );
    expect(profileApi.computeIntrinsicSpacePx(compact, 1, 0.08, 4, 1)).toBe(1);
    expect(profileApi.computeIntrinsicSpacePx(compact, 2, 0.08, 4, 2)).toBe(2);
  });

  it("builds metric-tile spacing from the shared intrinsic helper", function () {
    const profileApi = createProfileApi();
    const compact = profileApi.computeProfile(120, 80, { scales: CENTER_DISPLAY_SCALES });
    const large = profileApi.computeProfile(260, 180, { scales: CENTER_DISPLAY_SCALES });

    const compactSpacing = profileApi.computeIntrinsicTileSpacing(compact, { w: 160, h: 80 }, 0.04, 0.34);
    const largeSpacing = profileApi.computeIntrinsicTileSpacing(large, { w: 160, h: 80 }, 0.04, 0.34);

    expect(compactSpacing.padX).toBeLessThan(largeSpacing.padX);
    expect(compactSpacing.captionHeightPx).toBeLessThan(largeSpacing.captionHeightPx);
  });
});
