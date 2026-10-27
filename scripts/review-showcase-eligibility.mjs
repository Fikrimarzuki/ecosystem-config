#!/usr/bin/env node
// Explicit owner review only; prints evidence and never writes decisions/grants.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateConfig } from "./validate.mjs";
import { showcaseEligibilityFingerprint, showcaseKey } from "./showcases.mjs";

export function reviewShowcaseEligibility(config, decision) {
  const reviewed = { ...decision, fingerprint: showcaseEligibilityFingerprint(config, decision) };
  const candidate = { ...config, showcasePublication: [], showcaseEligibility: [
    ...(config.showcaseEligibility ?? []).filter(item => showcaseKey(item) !== showcaseKey(decision)), reviewed,
  ] };
  const result = validateConfig(candidate);
  if (!result.ok) throw new Error(`Cannot review invalid A–Z eligibility: ${result.errors.join("; ")}`);
  return reviewed;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [configPath, decisionPath] = process.argv.slice(2);
    console.log(JSON.stringify(reviewShowcaseEligibility(JSON.parse(await readFile(configPath, "utf8")),
      JSON.parse(await readFile(decisionPath, "utf8"))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
