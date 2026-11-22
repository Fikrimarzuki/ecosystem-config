import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { production } from "./helpers.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint, showcasePresentationFingerprint, conceptShowcasePresentation } from "../scripts/showcases.mjs";
import { beforeEcW7 } from "./helpers/republished-evidence.mjs";
const approved = [
  { id: "ohBabyGrow", title: "Oh Baby Grow", kind: "concept", order: 50, status: "planned", description: {
    en: "A planned app for tracking a baby's growth and development and exploring parenting education.",
    id: "Aplikasi yang direncanakan untuk memantau pertumbuhan dan perkembangan bayi serta mempelajari pengasuhan anak.",
  } },
  // 2026-11 registry refresh: the Vynote concept (order 60) was promoted to a hidden project with the same id, so only Oh Baby Grow remains a concept.
];
test("one independent concept approval remains (Vynote became a project) and the first 50 grants are preserved (18 re-reviewed in A4.14 with refreshed thumbnails and names)", () => {
  assert.equal(validateConfig(production).ok, true);
  assert.equal(production.showcases.length, 74); assert.equal(production.showcasePublication.length, 74);
  assert.equal(production.showcaseEligibility.length, 37);
  assert.equal(production.showcases.some(item => item.kind === "concept" && item.id === "vynote"), false);
  assert.equal(production.showcasePublication.some(item => item.kind === "concept" && item.id === "vynote"), false);
  assert.equal(production.showcaseEligibility.some(item => item.kind === "concept" && item.id === "vynote"), false);
  for (const list of [production.showcases, production.showcasePublication, production.showcaseEligibility]) assert.equal(list.filter(item => item.kind === "project" && item.id === "vynote").length, 1);
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  // Re-pinned 2026-11-21: the earlier value pre-dated P9C (seven re-approved presentation fingerprints, see a4-14-parity). The value below equals published revision 1689c7b
  // once Hearthside's presentation fingerprint (re-approved in the 2026-11 refresh for its released link and new thumbnail) is restored to its previously published value.
  const hearthsidePublished = "sha256:5c930697f3fb8174410f0af2be1a0828fb877e78e7ac1e2e099f6c95c5dcb658";
  assert.notEqual(production.showcasePublication.find(item => item.kind === "project" && item.id === "hearthside").presentationFingerprint, hearthsidePublished);
  assert.equal(createHash("sha256").update(JSON.stringify(beforeEcW7(production.showcasePublication.slice(0, 50))
    .map(item => item.kind === "project" && item.id === "hearthside" ? { ...item, presentationFingerprint: hearthsidePublished }
      : item.kind === "project" && item.id === "configEcosystem" ? { ...item, presentationFingerprint: "sha256:973f7ea22e4f94cf619729a0973455b5ed6b3fac8dc67229c9e0458040c0b900" } : item))).digest("hex"), // EC-W5: Ecosystem Config presentation restored to its prior value for this pin
    "473c8c50c997c4a7fef065b727adab08124a0818d28c366382e5e383597e1ecd");
  assert.deepEqual(production.showcases.slice(50, 51), approved.map(record => ({ kind: "concept", id: record.id })));
  assert.deepEqual(production.showcasePublication.slice(50, 51).map(record => record.id), approved.map(record => record.id));
});
for (const record of approved) test(`exact registration, static fingerprints, independent revocation: ${record.title}`, () => {
  assert.deepEqual(production.concepts.find(item => item.id === record.id), record);
  assert.equal(Object.hasOwn(record, "destination"), false);
  const grant = production.showcasePublication.find(item => item.kind === "concept" && item.id === record.id);
  const decision = production.showcaseEligibility.find(item => item.kind === "concept" && item.id === record.id);
  assert.deepEqual(grant.fields, ["title", "description.en", "description.id", "status"]);
  assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(production, decision));
  assert.equal(grant.fingerprint, showcaseFingerprint(production, grant));
  assert.equal(grant.presentationFingerprint, showcasePresentationFingerprint(grant, conceptShowcasePresentation(production, grant)));
  const revoked = structuredClone(production); revoked.showcasePublication = revoked.showcasePublication.filter(item => item.id !== record.id);
  assert.equal(validateConfig(revoked).ok, true);
  for (const mutate of [
    c => c.concepts.find(item => item.id === record.id).description.en += " drift",
    c => c.concepts.find(item => item.id === record.id).description.id += " drift",
    c => c.concepts.find(item => item.id === record.id).status = "in-progress",
    c => c.concepts.find(item => item.id === record.id).id += "Changed",
    c => c.showcaseEligibility = c.showcaseEligibility.filter(item => item.id !== record.id),
    c => c.showcases = c.showcases.filter(item => item.id !== record.id),
    c => c.showcasePublication.find(item => item.id === record.id).preview = "/unapproved.svg",
    c => c.showcasePublication.find(item => item.id === record.id).fields.push("technologies"),
    c => c.showcasePublication.find(item => item.id === record.id).access = { kind: "live", href: "https://unapproved.invalid" },
  ]) { const candidate = structuredClone(production); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
});
