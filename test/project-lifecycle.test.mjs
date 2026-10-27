import test from "node:test";
import assert from "node:assert/strict";
import { production } from "./helpers.mjs";
import { prepareProjectRegistration } from "../scripts/prepare-project-registration.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { projectLifecyclePresentation, projectLifecycleFields, showcaseFingerprint } from "../scripts/showcases.mjs";
import { reviewShowcaseEligibility } from "../scripts/review-showcase-eligibility.mjs";
import { reviewShowcase } from "../scripts/review-showcase.mjs";

const source = { kind: "project", id: "lifecycleReview" };
const proposal = () => ({ id: source.id, name: "Lifecycle Review", status: "active", lifecycle: "in-progress", listing: "hidden",
  destination: "learning", description: { en: "A review fixture.", id: "Fikstur peninjauan." } });
function fixture({ listing = "hidden", lifecycle = "in-progress" } = {}) {
  const config = prepareProjectRegistration(production, { ...proposal(), listing, lifecycle });
  config.showcases.push(source);
  config.showcaseEligibility.push(reviewShowcaseEligibility(config, { ...source, surface: "az", listing, lifecycle: true }));
  config.showcasePublication.push(reviewShowcase(config, { ...source, surface: "az", fields: [...projectLifecycleFields] }, projectLifecyclePresentation(config, source)));
  assert.equal(validateConfig(config).ok, true);
  return config;
}
test("optional lifecycle preserves every legacy grant and fingerprint without inferring from operational status", () => {
  const config = structuredClone(production);
  for (const record of Object.values(config.projects)) record.lifecycle = "in-progress";
  assert.equal(validateConfig(config).ok, true);
  for (const grant of production.showcasePublication) assert.equal(showcaseFingerprint(config, grant), grant.fingerprint);
  assert.deepEqual(config.showcasePublication, production.showcasePublication);
});
test("registration is pure, minimal and does not create membership, eligibility, grants or Universe", () => {
  const before = structuredClone(production), config = prepareProjectRegistration(production, proposal());
  assert.deepEqual(production, before);
  for (const key of ["showcases", "showcaseEligibility", "showcasePublication", "career", "careerPublication", "concepts"]) assert.deepEqual(config[key], before[key]);
  assert.equal(config.projects[source.id].status, "active");
  assert.equal(config.projects[source.id].lifecycle, "in-progress");
  assert.throws(() => prepareProjectRegistration(config, proposal()));
  for (const id of [undefined, null, 1, "", "bad-id"]) assert.throws(() => prepareProjectRegistration(production, { ...proposal(), id }));
});
for (const listing of ["hidden", "public"]) test(`independent ${listing} project lifecycle eligibility and grant`, () => {
  const config = fixture({ listing });
  assert.deepEqual(projectLifecyclePresentation(config, source), { title: "Lifecycle Review", description: proposal().description,
    status: "in-progress", access: { kind: "static" }, deployments: [] });
  assert.deepEqual(config.showcasePublication.slice(0, production.showcasePublication.length), production.showcasePublication);
});
for (const [name, mutate] of [
  ["missing membership", c => c.showcases.pop()],
  ["missing eligibility", c => c.showcaseEligibility.pop()],
  ["stale source", c => c.showcasePublication.at(-1).fingerprint = "sha256:" + "0".repeat(64)],
  ["stale presentation", c => c.showcasePublication.at(-1).presentationFingerprint = "sha256:" + "0".repeat(64)],
  ["changed lifecycle", c => c.projects[source.id].lifecycle = "planned"],
  ["missing lifecycle", c => delete c.projects[source.id].lifecycle],
  ["unsupported lifecycle", c => c.projects[source.id].lifecycle = "released"],
  ["missing ID narrative", c => delete c.projects[source.id].description.id],
  ["empty EN narrative", c => c.projects[source.id].description.en = " "],
  ["unapproved lifecycle field", c => c.showcasePublication.at(-1).fields.pop()],
  ["unauthorized technology", c => c.showcasePublication.at(-1).technologies = ["Private"]],
  ["unauthorized media", c => c.showcasePublication.at(-1).preview = "/private.png"],
  ["unauthorized action", c => c.showcasePublication.at(-1).actions = ["private"]],
  ["unknown source", c => c.showcasePublication.at(-1).id = "unknownProject"],
  ["cross-source grant", c => c.showcasePublication.at(-1).id = "gateway"],
  ["wrong source kind", c => c.showcasePublication.at(-1).kind = "assessment"],
  ["wrong listing", c => c.projects[source.id].listing = "public"],
  ["wrong surface", c => c.showcasePublication.at(-1).surface = "catalog"],
]) test(`lifecycle approval rejects ${name}`, () => {
  const config = fixture(); mutate(config); assert.equal(validateConfig(config).ok, false);
});
for (const status of ["active", "paused"]) test(`${status} without lifecycle cannot become a lifecycle assertion`, () => {
  const config = prepareProjectRegistration(production, { ...proposal(), status }); delete config.projects[source.id].lifecycle;
  assert.equal(validateConfig(config).ok, true);
  assert.throws(() => projectLifecyclePresentation(config, source));
});
test("planned is supported explicitly; status enum remains operational", () => {
  const config = fixture({ lifecycle: "planned" });
  assert.equal(projectLifecyclePresentation(config, source).status, "planned");
  config.projects[source.id].status = "in-progress"; assert.equal(validateConfig(config).ok, false);
});
test("legacy hidden eligibility cannot authorize lifecycle and membership is required for review", () => {
  const config = prepareProjectRegistration(production, proposal());
  assert.throws(() => reviewShowcaseEligibility(config, { ...source, surface: "az", listing: "hidden", lifecycle: true }));
  config.showcases.push(source);
  config.showcaseEligibility.push(reviewShowcaseEligibility(config, { ...source, surface: "az", listing: "hidden" }));
  assert.throws(() => reviewShowcase(config, { ...source, surface: "az", fields: projectLifecycleFields }, projectLifecyclePresentation(config, source)));
});
test("review rejects altered static presentation, technology, media and artwork", () => {
  const config = fixture(), grant = { ...source, surface: "az", fields: projectLifecycleFields };
  for (const patch of [{ status: "planned" }, { access: { kind: "live", href: "https://private.invalid" } },
    { technologies: ["Private"] }, { preview: "/private.png" }, { projectId: source.id }]) {
    assert.throws(() => reviewShowcase(config, grant, { ...projectLifecyclePresentation(config, source), ...patch }));
  }
  assert.throws(() => reviewShowcase(config, grant, projectLifecyclePresentation(config, source), "0".repeat(64)));
});
test("revoked grant and complete revocation are valid and never reissued by validation", () => {
  const config = fixture(); config.showcasePublication.pop(); assert.equal(validateConfig(config).ok, true);
  config.showcases.pop(); config.showcaseEligibility.pop(); assert.equal(validateConfig(config).ok, true);
});
