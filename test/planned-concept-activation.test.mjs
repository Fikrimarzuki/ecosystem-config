import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { production } from "./helpers.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { beforeEcW7, manifestBeforeEcW9 } from "./helpers/republished-evidence.mjs";
test("Oh Baby Grow stays an unlisted project (published to A–Z in EC-W9) and the first 50 grants are preserved (18 re-reviewed in A4.14 with refreshed thumbnails and names)", () => {
  assert.equal(validateConfig(production).ok, true);
  assert.equal(production.showcases.length, 82); assert.equal(production.showcasePublication.length, 82);
  assert.equal(production.showcaseEligibility.length, 45);
  assert.equal(production.showcases.some(item => item.kind === "concept" && item.id === "vynote"), false);
  assert.equal(production.showcasePublication.some(item => item.kind === "concept" && item.id === "vynote"), false);
  assert.equal(production.showcaseEligibility.some(item => item.kind === "concept" && item.id === "vynote"), false);
  for (const list of [production.showcases, production.showcasePublication, production.showcaseEligibility]) assert.equal(list.filter(item => item.kind === "project" && item.id === "vynote").length, 1);
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  // Re-pinned 2026-11-21: the earlier value pre-dated P9C (seven re-approved presentation fingerprints, see a4-14-parity). The value below equals published revision 1689c7b
  // once Hearthside's presentation fingerprint (re-approved in the 2026-11 refresh for its released link and new thumbnail) is restored to its previously published value.
  const hearthsidePublished = "sha256:5c930697f3fb8174410f0af2be1a0828fb877e78e7ac1e2e099f6c95c5dcb658";
  assert.notEqual(production.showcasePublication.find(item => item.kind === "project" && item.id === "hearthside").presentationFingerprint, hearthsidePublished);
  assert.equal(createHash("sha256").update(JSON.stringify(beforeEcW7(manifestBeforeEcW9("showcasePublication", production.showcasePublication).slice(0, 50))
    .map(item => item.kind === "project" && item.id === "hearthside" ? { ...item, presentationFingerprint: hearthsidePublished }
      : item.kind === "project" && item.id === "configEcosystem" ? { ...item, presentationFingerprint: "sha256:973f7ea22e4f94cf619729a0973455b5ed6b3fac8dc67229c9e0458040c0b900" } : item))).digest("hex"), // EC-W5: Ecosystem Config presentation restored to its prior value for this pin
    "473c8c50c997c4a7fef065b727adab08124a0818d28c366382e5e383597e1ecd");
  const project = production.projects.ohBabyGrow;
  assert.equal(project.listing, "hidden");
  assert.equal(project.repository, "app-oh-baby-grow");
  assert.deepEqual(project.deployments, { main: { name: "oh-baby-grow", subdomain: "ohbabygrow" } });
  for (const list of [production.concepts, production.conceptsPublication]) assert.equal(list.some(item => item.id === "ohBabyGrow"), false);
  for (const list of [production.showcases, production.showcasePublication, production.showcaseEligibility]) {
    assert.deepEqual(list.filter(item => item.id === "ohBabyGrow").map(item => item.kind), ["project"]);
  }
});
