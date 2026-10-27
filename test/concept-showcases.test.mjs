import test from "node:test";
import assert from "node:assert/strict";
import { production } from "./helpers.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { conceptShowcasePresentation, showcaseKey } from "../scripts/showcases.mjs";
import { reviewShowcaseEligibility } from "../scripts/review-showcase-eligibility.mjs";
import { reviewShowcase } from "../scripts/review-showcase.mjs";

const source = { kind: "concept", id: "reviewConcept" };
function fixture(status = "planned") {
  const config = structuredClone(production);
  config.concepts.push({ id: source.id, kind: "concept", title: "Review Concept", order: 100, status,
    description: { en: "A reviewed future product.", id: "Produk mendatang yang ditinjau." } });
  config.showcases.push(source);
  const decision = reviewShowcaseEligibility(config, { ...source, surface: "az" });
  config.showcaseEligibility.push(decision);
  const presentation = conceptShowcasePresentation(config, source);
  const grant = reviewShowcase(config, { ...source, surface: "az", fields: ["title", "description.en", "description.id", "status"] }, presentation);
  config.showcasePublication.push(grant);
  return { config, presentation, grant, decision };
}
const valid = config => assert.equal(validateConfig(config).ok, true);
const invalid = config => assert.equal(validateConfig(config).ok, false);

test("explicit concept review supports exact planned/in-progress presentations without changing existing grants", () => {
  for (const status of ["planned", "in-progress"]) {
    const { config, presentation } = fixture(status); valid(config);
    assert.deepEqual(config.showcasePublication.slice(0, production.showcasePublication.length), production.showcasePublication);
    assert.deepEqual(config.showcases.slice(0, production.showcases.length), production.showcases);
    assert.deepEqual(presentation, { title: "Review Concept", description: config.concepts.at(-1).description, status, access: { kind: "static" }, deployments: [] });
  }
});
test("concept title publication never supplies independent A–Z eligibility", () => {
  const { config } = fixture(); config.showcaseEligibility.pop(); invalid(config);
  config.showcasePublication.pop(); invalid(config);
  config.showcases.pop(); valid(config);
  assert.deepEqual(config.conceptsPublication, production.conceptsPublication);
});
test("membership, eligibility and grant cannot substitute for one another; grant revocation is valid", () => {
  const { config } = fixture(); config.showcasePublication.pop(); valid(config);
  config.showcases.pop(); invalid(config);
  config.showcaseEligibility.pop(); valid(config);
  assert.equal(showcaseKey(source), "concept:reviewConcept");
  assert.notEqual(showcaseKey(source), showcaseKey({ ...source, kind: "project" }));
});
for (const field of ["title", "description.en", "description.id", "status", "kind"]) test(`concept evidence stales when ${field} changes`, () => {
  const { config } = fixture(); const record = config.concepts.at(-1);
  if (field === "status") record.status = "in-progress";
  else if (field === "kind") record.kind = "placeholder";
  else if (field.startsWith("description.")) record.description[field.split(".")[1]] += " changed";
  else record.title += " changed";
  invalid(config);
});
for (const status of ["paused", "completed", "archived", "active", "idea", "unknown", undefined]) test(`concept eligibility denies unsupported lifecycle ${status}`, () => {
  assert.throws(() => fixture(status === undefined ? null : status));
});
for (const locale of ["en", "id"]) test(`concept missing/empty ${locale} never falls back to an unapproved locale`, () => {
  for (const value of [undefined, "", "   "]) {
    const { config } = fixture(); config.concepts.at(-1).description[locale] = value; invalid(config);
    assert.throws(() => conceptShowcasePresentation(config, source));
  }
});
test("unknown concepts and placeholders cannot gain eligibility from a title grant", () => {
  const { config } = fixture();
  assert.throws(() => reviewShowcaseEligibility(config, { kind: "concept", id: "unknownConcept", surface: "az" }));
  config.concepts.at(-1).kind = "placeholder";
  assert.throws(() => reviewShowcaseEligibility(config, { ...source, surface: "az" }));
});
for (const field of ["title", "description.en", "description.id", "status"]) test(`every concept grant requires ${field}`, () => {
  const { config } = fixture(); config.showcasePublication.at(-1).fields = config.showcasePublication.at(-1).fields.filter(x => x !== field); invalid(config);
});
for (const field of ["technologies", "preview", "repositoryUrl", "deployments", "access", "listing", "publicTitle"]) test(`concept grant rejects unapproved ${field}`, () => {
  const { config } = fixture(); config.showcasePublication.at(-1)[field] = "unapproved"; invalid(config);
});
test("concept source/presentation fingerprints and az-only eligibility reject tampering", () => {
  for (const mutate of [
    c => c.showcasePublication.at(-1).fingerprint = "sha256:" + "0".repeat(64),
    c => c.showcasePublication.at(-1).presentationFingerprint = "sha256:" + "0".repeat(64),
    c => c.showcaseEligibility.at(-1).fingerprint = "sha256:" + "0".repeat(64),
    c => c.showcaseEligibility.at(-1).surface = "catalog",
    c => c.showcaseEligibility.at(-1).listing = "public",
    c => c.showcaseEligibility.push(c.showcaseEligibility.at(-1)),
    c => c.concepts.push({ ...c.concepts.at(-1), order: 101 }),
  ]) { const { config } = fixture(); mutate(config); invalid(config); }
});
test("review requires exact explicit presentation and never authorizes artwork/actions", () => {
  const { config, grant, presentation } = fixture();
  assert.throws(() => reviewShowcase(config, grant));
  assert.throws(() => reviewShowcase(config, grant, { ...presentation, access: { kind: "live", href: "https://unapproved.invalid" } }));
  assert.throws(() => reviewShowcase(config, grant, presentation, "unapproved-artwork"));
  const before = structuredClone(config); reviewShowcase(config, grant, presentation); assert.deepEqual(config, before);
});
