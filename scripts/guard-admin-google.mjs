import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const checks = [
  {
    file: "src/admin/components/AdminLayout.tsx",
    required: [
      'to: "/admin/google"',
      'label: "Google"',
      "LineChart",
    ],
  },
  {
    file: "src/admin/AdminApp.tsx",
    required: [
      '"/admin/google"',
      "GoogleDashboardPage",
    ],
  },
  {
    file: "src/admin/pages/DashboardPage.tsx",
    required: [
      'to="/admin/google"',
      "Google dashboard",
      "LineChart",
    ],
  },
  {
    file: "src/admin/components/KeyboardShortcuts.tsx",
    required: [
      'g: { to: "/admin/google", label: "Google" }',
    ],
  },
  {
    file: "src/admin/pages/LoginPage.tsx",
    required: [
      "/api/auth/google/config",
      "handleGoogleLogin",
      "Sign in with Google",
      "GOOGLE_CLIENT_ID",
      "initTokenClient",
      "accessToken",
    ],
  },
];
// Backend (server/) + render.yaml checks removed: backend now lives in the
// separate whitedot-backend repo, deployed to the Hostinger VPS.

const failures = [];

for (const check of checks) {
  const path = resolve(root, check.file);
  let source = "";

  try {
    source = readFileSync(path, "utf8");
  } catch (error) {
    failures.push(`${check.file}: cannot read file (${error.message})`);
    continue;
  }

  for (const token of check.required) {
    if (!source.includes(token)) {
      failures.push(`${check.file}: missing ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Admin Google guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Admin Google guard passed.");
