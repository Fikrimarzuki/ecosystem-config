#!/usr/bin/env node
// Explicit owner-review helper; prints candidate evidence and NEVER writes grants.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { showcaseFingerprint, showcasePresentationFingerprint, conceptShowcasePresentation, isProjectLifecycleGrant, projectLifecyclePresentation } from "./showcases.mjs";
import { validateConfig } from "./validate.mjs";

export function reviewShowcase(config, grant, presentation, artworkSha256) {
  // Existing stale showcase evidence may be replaced only in this explicit review path.
  const candidate = { ...config, showcasePublication: [] };
  const before = validateConfig(candidate);
  if (!before.ok) throw new Error(`Cannot review invalid configuration: ${before.errors.join("; ")}`);
  if (grant.kind === "project" && !isProjectLifecycleGrant(grant) && (!presentation || presentation.projectId !== grant.id)) throw new Error("Missing project presentation evidence");
  if (grant.kind === "concept" || isProjectLifecycleGrant(grant)) {
    const expected = grant.kind === "concept" ? conceptShowcasePresentation(config, grant) : projectLifecyclePresentation(config, grant);
    if (!presentation || artworkSha256 != null ||
        showcasePresentationFingerprint(grant, presentation, null) !== showcasePresentationFingerprint(grant, expected, null)) {
      throw new Error("Lifecycle review requires the exact explicit static presentation; artwork/actions are not authorized");
    }
  }
  const reviewed = { ...grant, fingerprint: showcaseFingerprint(config, grant),
    ...(["project", "concept"].includes(grant.kind) ? { presentationFingerprint: showcasePresentationFingerprint(grant, presentation, artworkSha256) } : {}) };
  candidate.showcasePublication = [reviewed];
  const after = validateConfig(candidate);
  if (!after.ok) throw new Error(`Invalid showcase candidate: ${after.errors.join("; ")}`);
  return reviewed;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [configPath, candidatePath, presentationPath] = process.argv.slice(2);
    const config = JSON.parse(await readFile(configPath, "utf8"));
    const grant = JSON.parse(await readFile(candidatePath, "utf8"));
    const evidence = presentationPath ? JSON.parse(await readFile(presentationPath, "utf8")) : {};
    if (["project", "concept"].includes(grant.kind) && !evidence.presentation) throw new Error("Project/concept review requires explicit presentation evidence");
    console.log(JSON.stringify(reviewShowcase(config, grant, evidence.presentation, evidence.artworkSha256), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
