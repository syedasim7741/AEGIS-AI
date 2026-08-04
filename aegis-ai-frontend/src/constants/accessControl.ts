import type { UserRole } from "../store/slices/authSlice";

export const ALL_ROLES: readonly UserRole[] = [
  "Administrator",
  "Plant Manager",
  "Maintenance Engineer",
  "Safety Officer",
  "Machine Operator",
  "AI Engineer",
];

export const routeAccess = {
  dashboard: ALL_ROLES,

  analytics: ["Administrator", "Plant Manager", "AI Engineer"],

  robots: [
    "Administrator",
    "Plant Manager",
    "Maintenance Engineer",
    "Machine Operator",
  ],

  safety: [
    "Administrator",
    "Plant Manager",
    "Safety Officer",
    "Machine Operator",
  ],

  vision: ["Administrator", "Plant Manager", "Safety Officer", "AI Engineer"],

  maintenance: ["Administrator", "Plant Manager", "Maintenance Engineer"],

  workflows: ["Administrator", "Plant Manager", "AI Engineer"],

  alerts: ALL_ROLES,

  documents: [
    "Administrator",
    "Plant Manager",
    "Maintenance Engineer",
    "Safety Officer",
    "AI Engineer",
  ],

  copilot: ALL_ROLES,

  profile: ALL_ROLES,

  administration: ["Administrator"],
} satisfies Record<string, readonly UserRole[]>;
