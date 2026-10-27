import test from "node:test";
import assert from "node:assert/strict";
import { production } from "./helpers.mjs";
import { prepareConceptRegistration } from "../scripts/prepare-concept-registration.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { reviewShowcaseEligibility } from "../scripts/review-showcase-eligibility.mjs";

const proposal = () => ({ id: "reviewPlannedConcept", title: "Review Planned Concept", kind: "concept", order: 100,
  status: "planned", description: { en: "A planned test concept.", id: "Konsep uji yang direncanakan." } });

test("planned registration preparation is pure, schema-valid and never creates publication or destination", () => {
  const before = structuredClone(production), record = proposal(), copy = structuredClone(record);
  const result = prepareConceptRegistration(production, record);
  assert.deepEqual(production, before); assert.deepEqual(record, copy);
  assert.equal(validateConfig(result).ok, true);
  assert.deepEqual(result.concepts.at(-1), record);
  assert.equal(result.concepts.at(-1).destination, undefined);
  for (const key of ["showcases", "showcaseEligibility", "showcasePublication", "conceptsPublication", "careerPublication", "projects", "career", "origins"]) assert.deepEqual(result[key], production[key]);
  assert.equal(result.showcases.length, 55); assert.equal(result.showcasePublication.length, 55);
  assert.throws(() => reviewShowcaseEligibility(result, { kind: "concept", id: record.id, surface: "az" }));
});
for (const [name, mutate] of [
  ["duplicate concept", r => r.id = "forgebox"], ["project collision", r => r.id = "gateway"],
  ["order collision", r => r.order = 10], ["malformed identity", r => r.id = "bad-id"],
  ["wrong source kind", r => r.kind = "project"], ["placeholder", r => r.kind = "placeholder"],
  ["missing EN", r => delete r.description.en], ["missing ID", r => delete r.description.id],
  ["empty ID", r => r.description.id = " "], ["missing status", r => delete r.status],
  ["active status", r => r.status = "active"], ["in-progress status", r => r.status = "in-progress"],
  ["invalid destination", r => r.destination = "coming-soon"], ["unknown property", r => r.privateHint = "WITHHELD"],
  ["technology", r => r.technologies = ["WITHHELD"]], ["repository", r => r.repository = "WITHHELD"],
  ["deployments", r => r.deployments = {}], ["artwork", r => r.assets = { thumbnail: "WITHHELD" }],
  ["relationships", r => r.relatedProjects = ["gateway"]],
]) test(`registration proposal rejects ${name}`, () => {
  const record = proposal(); mutate(record);
  assert.throws(() => prepareConceptRegistration(production, record));
});
test("registration preparation does not repair invalid existing approvals", () => {
  const stale = structuredClone(production); stale.showcasePublication[0].fingerprint = "sha256:" + "0".repeat(64);
  assert.throws(() => prepareConceptRegistration(stale, proposal()));
});
