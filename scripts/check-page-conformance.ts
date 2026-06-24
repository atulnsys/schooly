import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PAGE_CONFORMANCE_MANIFEST, SETTINGS_REGRESSION_SMOKE_ROUTE } from "../src/lib/pageConformance.ts";

type CheckResult = {
  route: string;
  componentPath: string;
  ok: boolean;
  missing: string[];
};

const repoRoot = resolve(process.cwd());

function readSource(relativePath: string): string {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing conformance target: ${relativePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

function checkTokens(source: string, tokens: readonly string[]): string[] {
  return tokens.filter((token) => !source.includes(token));
}

const results: CheckResult[] = PAGE_CONFORMANCE_MANIFEST.map((entry) => {
  const source = readSource(entry.componentPath);
  const missing = checkTokens(source, entry.requiredTokens);
  return {
    route: entry.route,
    componentPath: entry.componentPath,
    ok: missing.length === 0,
    missing,
  };
});

const settingsSource = readSource("src/components/SettingsPage.tsx");
const settingsMissing = checkTokens(settingsSource, [
  "StandardPageHeader",
  "StandardMetricGrid",
]);

const failed = results.filter((result) => !result.ok);

if (settingsMissing.length > 0) {
  failed.push({
    route: SETTINGS_REGRESSION_SMOKE_ROUTE,
    componentPath: "src/components/SettingsPage.tsx",
    ok: false,
    missing: settingsMissing,
  });
}

if (failed.length > 0) {
  console.error("Page conformance check failed:");
  for (const result of failed) {
    console.error(`- ${result.route} (${result.componentPath})`);
    for (const token of result.missing) {
      console.error(`  missing: ${token}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${results.length} scoped pages plus settings smoke.`);
  console.log(`Settings smoke route: ${SETTINGS_REGRESSION_SMOKE_ROUTE}`);
}
