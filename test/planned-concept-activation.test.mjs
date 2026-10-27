import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { production } from "./helpers.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint, showcasePresentationFingerprint, conceptShowcasePresentation } from "../scripts/showcases.mjs";
const approved = [
  { id: "ohBabyGrow", title: "Oh Baby Grow", kind: "concept", order: 50, status: "planned", description: {
    en: "A planned app for tracking a baby's growth and development and exploring parenting education.",
    id: "Aplikasi yang direncanakan untuk memantau pertumbuhan dan perkembangan bayi serta mempelajari pengasuhan anak.",
  } },
  { id: "vynote", title: "Vynote", kind: "concept", order: 60, status: "planned", description: {
    en: "A planned desktop assistant for meeting transcription and communication support.",
    id: "Asisten desktop yang direncanakan untuk transkripsi rapat dan dukungan komunikasi.",
  } },
];
test("activation adds exactly two independent concept approvals and preserves the first 50 grants (18 re-reviewed in A4.14 with refreshed thumbnails and names)", () => {
  assert.equal(validateConfig(production).ok, true);
  assert.equal(production.showcases.length, 55); assert.equal(production.showcasePublication.length, 55);
  assert.equal(production.showcaseEligibility.length, 18);
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  assert.equal(createHash("sha256").update(JSON.stringify(production.showcasePublication.slice(0, 50))).digest("hex"),
    "02541b7b0965078f735a9157d22a7709fbccf039f333542b24ae1ef90541ca31");
  assert.deepEqual(production.showcases.slice(50, 52), approved.map(record => ({ kind: "concept", id: record.id })));
  assert.deepEqual(production.showcasePublication.slice(50, 52).map(record => record.id), approved.map(record => record.id));
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
