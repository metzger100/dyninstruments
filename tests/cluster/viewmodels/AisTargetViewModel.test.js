const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetViewModel", function () {
  function createViewModel() {
    return loadFresh("cluster/viewmodels/AisTargetViewModel.js").create();
  }

  it("fails closed for missing or malformed target input", function () {
    const vm = createViewModel();

    const out = vm.build({ target: null });
    expect(out.hasTargetIdentity).toBe(false);
    expect(out.hasDispatchMmsi).toBe(false);
    expect(out.colorRole).toBeUndefined();
    expect(out.frontText).toBe("-");
    expect(out.frontInitial).toBe("-");
    expect(out.showTcpaBranch).toBe(false);
    expect(out.distance).toBeUndefined();
    expect(out.cpa).toBeUndefined();
    expect(out.tcpa).toBeUndefined();
    expect(out.headingTo).toBeUndefined();
  });

  it("uses target.mmsi !== undefined as identity and bridge-compatible dispatch normalization", function () {
    const vm = createViewModel();

    const numeric = vm.build({ target: { mmsi: 123456789.91 } });
    expect(numeric.hasTargetIdentity).toBe(true);
    expect(numeric.mmsiNormalized).toBe("123456789");
    expect(numeric.hasDispatchMmsi).toBe(true);

    const text = vm.build({ target: { mmsi: "  987654321  " } });
    expect(text.hasTargetIdentity).toBe(true);
    expect(text.mmsiNormalized).toBe("987654321");
    expect(text.hasDispatchMmsi).toBe(true);

    const invalid = vm.build({ target: { mmsi: "" } });
    expect(invalid.hasTargetIdentity).toBe(true);
    expect(invalid.mmsiNormalized).toBe("");
    expect(invalid.hasDispatchMmsi).toBe(false);
  });

  it("keeps tracked-match raw-equality semantics separate from normalized dispatch mmsi", function () {
    const vm = createViewModel();

    const rawMatch = vm.build({
      target: { mmsi: 123456789 },
      trackedMmsi: 123456789
    });
    expect(rawMatch.trackedMatch).toBe(true);

    const normalizedButNotRaw = vm.build({
      target: { mmsi: 123456789 },
      trackedMmsi: "123456789"
    });
    expect(normalizedButNotRaw.mmsiNormalized).toBe("123456789");
    expect(normalizedButNotRaw.trackedMatch).toBe(false);
  });

  it("derives nameOrMmsi with AvNav parity order: AtoN name, shipname, mmsi", function () {
    const vm = createViewModel();

    const aton = vm.build({
      target: { type: 21, name: "  Buoy Alpha  ", shipname: "Ship A", mmsi: 111 }
    });
    expect(aton.nameOrMmsi).toBe("Buoy Alpha");

    const ship = vm.build({
      target: { type: 70, name: "  ", shipname: "  Ferry One  ", mmsi: 222 }
    });
    expect(ship.nameOrMmsi).toBe("Ferry One");

    const mmsiFallback = vm.build({
      target: { type: 70, name: "", shipname: "  ", mmsi: 333444555 }
    });
    expect(mmsiFallback.nameOrMmsi).toBe("333444555");
  });

  it("derives front text and initial from cpa/passFront rules", function () {
    const vm = createViewModel();

    expect(vm.build({ target: { cpa: 0, passFront: 1 } }).frontText).toBe("-");
    expect(vm.build({ target: { cpa: 1.2, passFront: 2 } }).frontText).toBe("Front");
    expect(vm.build({ target: { cpa: 1.2, passFront: -1 } }).frontText).toBe("Back");
    expect(vm.build({ target: { cpa: 1.2, passFront: 0 } }).frontText).toBe("Pass");
    expect(vm.build({ target: { cpa: 1.2 } }).frontText).toBe("Done");
    expect(vm.build({ target: { cpa: 1.2 } }).frontInitial).toBe("D");
  });

  it("uses tcpa > 0 as the only branch flag", function () {
    const vm = createViewModel();

    expect(vm.build({ target: { tcpa: 12 } }).showTcpaBranch).toBe(true);
    expect(vm.build({ target: { tcpa: 0 } }).showTcpaBranch).toBe(false);
    expect(vm.build({ target: { tcpa: -5 } }).showTcpaBranch).toBe(false);
  });

  it("applies color precedence warning -> nearest -> tracking -> normal", function () {
    const vm = createViewModel();

    const warningByFlag = vm.build({
      target: { mmsi: 1, warning: true, nearest: true },
      aisMarkAllWarning: true,
      trackedMmsi: 1
    });
    expect(warningByFlag.colorRole).toBe("warning");

    const warningByNext = vm.build({
      target: { mmsi: 1, nextWarning: true, nearest: true },
      aisMarkAllWarning: false,
      trackedMmsi: 1
    });
    expect(warningByNext.colorRole).toBe("warning");

    const nearest = vm.build({
      target: { mmsi: 1, nearest: true },
      trackedMmsi: 1
    });
    expect(nearest.colorRole).toBe("nearest");

    const tracking = vm.build({
      target: { mmsi: 1, nearest: false },
      trackedMmsi: 1
    });
    expect(tracking.colorRole).toBe("tracking");

    const normal = vm.build({
      target: { mmsi: 1, nearest: false },
      trackedMmsi: 2
    });
    expect(normal.colorRole).toBe("normal");
    expect(normal.hasColorRole).toBe(true);

    const noRole = vm.build({
      target: { mmsi: "" },
      trackedMmsi: "x"
    });
    expect(noRole.colorRole).toBeUndefined();
    expect(noRole.hasColorRole).toBe(false);
  });
});
