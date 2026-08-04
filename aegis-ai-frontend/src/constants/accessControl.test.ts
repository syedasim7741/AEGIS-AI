import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ALL_ROLES,
  routeAccess,
} from "./accessControl";


describe("access control configuration", () => {
  it("contains all supported user roles", () => {
    expect(ALL_ROLES).toEqual([
      "Administrator",
      "Plant Manager",
      "Maintenance Engineer",
      "Safety Officer",
      "Machine Operator",
      "AI Engineer",
    ]);
  });

  it("allows every role to access the dashboard", () => {
    expect(routeAccess.dashboard).toEqual(ALL_ROLES);
  });

  it("restricts administration to administrators", () => {
    expect(routeAccess.administration).toEqual([
      "Administrator",
    ]);
  });

  it("does not allow machine operators into administration", () => {
    expect(
      routeAccess.administration,
    ).not.toContain("Machine Operator");
  });

  it("allows every role to access alerts and the AI copilot", () => {
    expect(routeAccess.alerts).toEqual(ALL_ROLES);
    expect(routeAccess.copilot).toEqual(ALL_ROLES);
  });
});
