import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseFingerprint, showcasePresentationFingerprint, showcaseEligibilityFingerprint } from "../scripts/showcases.mjs";
import { reviewShowcaseEligibility } from "../scripts/review-showcase-eligibility.mjs";
import { reviewShowcase } from "../scripts/review-showcase.mjs";

const config = assemble();
test("ten hidden projects have independent source-specific eligibility; first 37 grants (re-reviewed once in A4.14 for refreshed thumbnails and names) stay exact", () => {
  const ids = ["courses", "blog", "links", "fmStudios", "templates", "watch", "frontendLab", "littleRoars", "securityLab", "weddingVendorScraper"];
  const first37 = config.showcasePublication.slice(0, 37);
  assert.equal(createHash("sha256").update(JSON.stringify(first37)).digest("hex"), "1b1d5940bdeb0007d333b6791dde3c2d1174369d59bc895e9d410c0dcc9c6684");
  // JavaScriptia's thumbnail refresh (2026-11-09) re-approved its two fingerprints; restoring them reproduces the earlier pin, so nothing else in the first 37 changed.
  const restored = first37.map(grant => grant.id === "javascriptia" ? { ...grant, fingerprint: "sha256:1a989201621af4902ba88e62049532bf255375157652dbe759eff42be5bf6c83", presentationFingerprint: "sha256:16cfd4107e8dfc53035d86865570f8f097bef78cc25af755b48fbe54875e8c84" } : grant);
  assert.equal(createHash("sha256").update(JSON.stringify(restored)).digest("hex"), "2eda611606c1909a49e9b36c96a5897e350126c2903c46fc05bc208cb959de52");
  assert.deepEqual(config.showcases.slice(37, 47), ids.map(id => ({ kind: "project", id })));
  assert.deepEqual(config.showcasePublication.slice(37, 47).map(grant => grant.id), ids);
  // A4.14B appended the four approved recent projects. A4.14: Hearthside, Momee, Quibiq, XYZ and Your Space joined the standard hidden-project path (no lifecycle decisions remain).
  assert.deepEqual(config.showcaseEligibility.filter(item => item.kind === "project" && !item.lifecycle).map(decision => decision.id), [...ids, "hearthside", "momee", "quibiq", "xyz", "yourSpace", "vaults", "zketchly", "urchinRelay", "ecosystemAssets"]);
  for (const decision of config.showcaseEligibility.filter(item => item.kind === "project" && !item.lifecycle)) {
    assert.equal(config.projects[decision.id].listing, "hidden");
    assert.deepEqual(Object.keys(decision).sort(), ["fingerprint", "id", "kind", "listing", "surface"]);
    assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
    assert.deepEqual(reviewShowcaseEligibility(config, decision), decision);
    assert.equal(config.showcasePublication.find(grant => grant.id === decision.id).fingerprint,
      showcaseFingerprint(config, { kind: "project", id: decision.id, surface: "az" }));
  }
});
test("hidden eligibility is required per identity, listing and surface; stale/revoked/duplicate/orphan decisions reject", () => {
  for (const mutate of [
    c => delete c.showcaseEligibility,
    c => c.showcaseEligibility = [],
    c => c.showcaseEligibility.pop(),
    c => c.showcaseEligibility.push(c.showcaseEligibility[0]),
    c => c.showcaseEligibility[0].id = "careerLens",
    c => c.showcaseEligibility[0].id = "wedding",
    c => c.showcaseEligibility[0].kind = "assessment",
    c => c.showcaseEligibility[0].surface = "universe",
    c => c.showcaseEligibility[0].listing = "public",
    c => c.showcaseEligibility[0].fingerprint = "sha256:" + "0".repeat(64),
    c => c.projects.courses.listing = "public",
    c => c.projects.courses.name += " Changed",
    c => c.showcases.push({ kind: "project", id: "wedding" }),
    c => c.showcases = c.showcases.filter(source => source.id !== "courses"),
    c => c.showcaseEligibility[0].allowHidden = true,
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
  for (const decision of config.showcaseEligibility.filter(item => item.kind === "project" && !item.lifecycle)) {
    const revoked = structuredClone(config);
    revoked.showcasePublication = revoked.showcasePublication.filter(grant => grant.id !== decision.id);
    assert.equal(validateConfig(revoked).ok, true); // Eligibility alone never publishes content.
    const stale = structuredClone(config); stale.projects[decision.id].name += " Changed";
    assert.equal(validateConfig(stale).ok, false);
  }
});
test("59 independent A–Z grants (the original 55 plus four approved in A4.14B) preserve the original ten members and grants; Career unchanged", () => {
  assert.equal(validateConfig(config).ok, true);
  assert.deepEqual(config.showcases.slice(0, 10), [
    { kind: "assessment", id: "aiSessionManager" }, { kind: "engagement", id: "automotiveInventorySystem" },
    { kind: "project", id: "careerLens" },
    { kind: "assessment", id: "evermosFrontend" }, { kind: "project", id: "kodeStep" },
    { kind: "work", employerId: "pixelHouseStudio", id: "managix-page-builder" },
    { kind: "project", id: "multiRepoClone" },
    { kind: "work", employerId: "pixelHouseStudio", id: "nodejs-data-converter" },
    { kind: "project", id: "pageLayr" }, { kind: "project", id: "tinyverse" },
  ]);
  assert.equal(config.showcases.length, 59);
  assert.equal(config.showcasePublication.length, 59);
  assert.equal(createHash("sha256").update(JSON.stringify(config.showcasePublication.slice(0, 10))).digest("hex"),
    "01654dd0f9c26c3fe7c2ccf65e6a5cfd66dc3ff6ddec83de0dd91a72d511453b");
  assert.deepEqual(config.careerPublication, JSON.parse(readFileSync(new URL("../config/production.json", import.meta.url))).careerPublication);
  const ai = config.showcasePublication.find(grant => grant.kind === "assessment");
  assert.deepEqual(ai.technologies, ["Next.js", "TypeScript"]);
  assert.deepEqual(ai.fields, ["title", "year", "description.en", "description.id"]);
});
test("personal bulk expansion selects exactly the 27 public project identities with individual az-only evidence", () => {
  const ids = ["cssTricks", "cv", "developerRoadmap", "configEcosystem", "ecosystemSkills", "devtools", "fmMonorepo",
    "projects", "roadmap", "tools", "foodieMap", "games", "gateway", "inventory", "javascriptia", "learning", "neuran",
    "nikahkuy", "nikahyuk", "nikahyukPrototype", "nodeApi", "playdeck", "playground", "playnest", "scriptoria", "support", "tcgHub"];
  assert.deepEqual(config.showcases.slice(10, 37), ids.map(id => ({ kind: "project", id })));
  assert.deepEqual(config.showcasePublication.slice(10, 37).map(grant => grant.id), ids);
  for (const grant of config.showcasePublication.slice(10, 37)) {
    assert.equal(config.projects[grant.id].listing, "public");
    assert.deepEqual(Object.keys(grant).sort(), ["fingerprint", "id", "kind", "presentationFingerprint", "surface"]);
    assert.equal(grant.kind, "project"); assert.equal(grant.surface, "az");
    assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
    assert.match(grant.presentationFingerprint, /^sha256:[a-f0-9]{64}$/);
    const hidden = structuredClone(config); hidden.projects[grant.id].listing = "hidden";
    assert.equal(validateConfig(hidden).ok, false);
    const stale = structuredClone(config); stale.projects[grant.id].name += " Changed";
    assert.equal(validateConfig(stale).ok, false);
    const broadened = structuredClone(config); broadened.showcasePublication.find(item => item.id === grant.id).technologies = ["UNAPPROVED"];
    assert.equal(validateConfig(broadened).ok, false);
  }
});
test("E/N grants exactly select approved bilingual leaves and technologies", () => {
  const e = config.showcasePublication.find(grant => grant.id === "evermosFrontend");
  const n = config.showcasePublication.find(grant => grant.kind === "work");
  assert.deepEqual(e.fields, ["title", "year", "description.en", "description.id"]);
  assert.deepEqual(e.technologies, ["Nuxt.js", "Pinia"]);
  assert.deepEqual(n.fields, ["title", "description.en", "description.id"]);
  assert.deepEqual(n.technologies, ["Node.js"]);
  assert.equal(n.employerId, "pixelHouseStudio");
  for (const grant of [e, n]) assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
  for (const [grant, career] of [[e, config.careerPublication.assessments.find(item => item.id === e.id)],
    [n, config.careerPublication.work.find(item => item.employerId === n.employerId && item.id === n.id)]]) {
    assert.deepEqual([...grant.fields].sort(), [...career.fields].sort());
    assert.deepEqual([...grant.technologies].sort(), [...career.technologies].sort());
  }
});
test("work references, eligibility, fingerprint qualification and field allowlists fail closed", () => {
  for (const mutate of [
    c => c.showcases.find(source => source.kind === "work").employerId = "unknownEmployer",
    c => delete c.showcases.find(source => source.kind === "work").employerId,
    c => c.career.experience.find(record => record.id === "pixelHouseStudio").listing = "hidden",
    c => c.career.experience.find(record => record.id === "pixelHouseStudio").work.find(record => record.id === "nodejs-data-converter").listing = "hidden",
    c => c.showcasePublication.find(grant => grant.kind === "work").fields.push("employerId"),
    c => c.showcasePublication.find(grant => grant.kind === "work").fields.push("kind"),
    c => c.showcasePublication.find(grant => grant.kind === "work").fields.push("year"),
    c => c.showcasePublication.find(grant => grant.id === "evermosFrontend").fields.push("company"),
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
  const candidate = structuredClone(config), original = candidate.showcasePublication.find(grant => grant.kind === "work");
  const parent = candidate.career.experience.find(record => record.id === "pixelHouseStudio");
  const sameWork = structuredClone(parent.work.find(record => record.id === original.id));
  candidate.career.experience.push({ ...structuredClone(parent), id: "fictionalEmployer", company: "Fictional Studio", work: [sameWork] });
  assert.notEqual(showcaseFingerprint(candidate, original), showcaseFingerprint(candidate, { ...original, employerId: "fictionalEmployer" }));
});
test("unknown, hidden and duplicate members and orphan/duplicate grants reject", () => {
  for (const mutate of [c => c.showcases.push(c.showcases[0]), c => c.showcases[0].id = "unknown", c => c.projects.careerLens.listing = "hidden", c => c.showcases.pop(), c => c.showcasePublication.push(c.showcasePublication[0])]) {
    const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false);
  }
});
test("revoked and absent grants never restore themselves; absent manifests are backward compatible", () => {
  for (const mutate of [c => c.showcasePublication = [], c => delete c.showcasePublication, c => { delete c.showcases; delete c.showcasePublication; delete c.showcaseEligibility; }]) {
    const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, true);
  }
});
test("changed selected narrative, ID locale, technology, title and canonical actions stale evidence", () => {
  for (const mutate of [
    c => c.career.assessments[0].description.en += " Changed.",
    c => c.career.assessments[0].description.id += " Berubah.",
    c => c.showcasePublication[0].technologies.push("Prisma"),
    c => c.projects.careerLens.name = "Changed",
    c => c.projects.kodeStep.deployments.main.subdomain = "changed",
    c => c.username = "another-owner",
    c => c.domains.primary = "example.com",
    c => delete c.showcasePublication[0].fingerprint,
    c => c.showcasePublication[0].fields.push("company"),
    c => c.showcasePublication[1].surface = "catalog",
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
});
test("fingerprints bind identity and surface; presentation evidence binds copy and artwork bytes", () => {
  const grant = config.showcasePublication[1];
  assert.equal(showcaseFingerprint(config, grant), grant.fingerprint);
  assert.notEqual(showcaseFingerprint(config, grant), showcaseFingerprint(config, { ...grant, surface: "other" }));
  const presentation = { projectId: "careerLens", title: "CareerLens" };
  const fingerprint = showcasePresentationFingerprint(grant, presentation, "art-v1");
  assert.notEqual(fingerprint, showcasePresentationFingerprint(grant, { ...presentation, title: "Changed" }, "art-v1"));
  assert.notEqual(fingerprint, showcasePresentationFingerprint(grant, presentation, "art-v2"));
  assert.throws(() => reviewShowcase(config, { ...grant, surface: "catalog" }, presentation));
  assert.deepEqual(assemble(), config); // Assembly does not regenerate evidence.
});

test("professional and freelance approvals select only exact narratives, technologies and the scoped title", () => {
  const m = config.showcasePublication.find(grant => grant.id === "managix-page-builder");
  const a = config.showcasePublication.find(grant => grant.kind === "engagement");
  for (const grant of [m, a]) {
    assert.deepEqual(grant.fields, ["title", "description.en", "description.id"]);
    assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
    assert.deepEqual(reviewShowcase(config, grant), grant);
  }
  assert.deepEqual(m.technologies, ["Vue.js", "Nuxt.js"]);
  assert.deepEqual(a.technologies, ["React.js", "Node.js", "Express.js", "MySQL"]);
  assert.equal(a.publicTitle, "Automotive Inventory System");
  assert.equal(config.career.freelance.find(record => record.id === a.id).title, "Automotive Spare Parts Inventory Management System");
  assert(!config.careerPublication.work.some(grant => grant.id === m.id));
  assert.equal(config.careerPublication.freelance.length, 0);
});

test("engagement existence, explicit freelance classification, title overrides and allowlists fail closed", () => {
  for (const mutate of [
    c => c.career.freelance = c.career.freelance.filter(record => record.id !== "automotiveInventorySystem"),
    c => delete c.career.freelance.find(record => record.id === "automotiveInventorySystem").engagement,
    c => c.career.freelance.find(record => record.id === "automotiveInventorySystem").engagement = "contract",
    c => c.career.freelance.find(record => record.id === "automotiveInventorySystem").listing = "hidden",
    c => c.showcases.find(source => source.kind === "engagement").id = "unknownEngagement",
    c => c.showcases.push({ kind: "engagement", id: "automotiveInventorySystem" }),
    c => c.showcasePublication.push(c.showcasePublication.find(grant => grant.kind === "engagement")),
    c => c.showcasePublication.find(grant => grant.kind === "engagement").publicTitle = " ",
    c => c.showcasePublication.find(grant => grant.kind === "engagement").publicTitle = 123,
    c => c.showcasePublication.find(grant => grant.kind === "engagement").fields = ["description.en"],
    c => c.showcasePublication.find(grant => grant.id === "managix-page-builder").publicTitle = "Other title",
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
  for (const field of ["client", "engagement", "role", "assets", "repository", "relatedProjects", "start", "country"]) {
    const candidate = structuredClone(config);
    candidate.showcasePublication.find(grant => grant.kind === "engagement").fields.push(field);
    assert.equal(validateConfig(candidate).ok, false);
  }
});

test("new approvals bind exact selected source values, classification and override without granting entire records", () => {
  for (const id of ["managix-page-builder", "automotiveInventorySystem"]) {
    for (const change of ["title", "en", "id", "technology", "remove-technology", "fingerprint"]) {
      const candidate = structuredClone(config), grant = candidate.showcasePublication.find(item => item.id === id);
      const record = id === "automotiveInventorySystem" ? candidate.career.freelance.find(item => item.id === id)
        : candidate.career.experience.find(item => item.id === "pixelHouseStudio").work.find(item => item.id === id);
      if (change === "title") record.title += " Changed";
      else if (change === "technology") grant.technologies.push(id === "automotiveInventorySystem" ? "Zustand" : "Node.js");
      else if (change === "remove-technology") record.technologies = record.technologies.filter(value => value !== grant.technologies[0]);
      else if (change === "fingerprint") delete grant.fingerprint;
      else record.description[change] += " Changed";
      assert.equal(validateConfig(candidate).ok, false, `${id}/${change}`);
    }
  }
  for (const override of [undefined, "Changed display title"]) {
    const candidate = structuredClone(config), grant = candidate.showcasePublication.find(item => item.kind === "engagement");
    if (override === undefined) delete grant.publicTitle; else grant.publicTitle = override;
    assert.equal(validateConfig(candidate).ok, false);
  }
  const optional = structuredClone(config), grant = optional.showcasePublication.find(item => item.kind === "engagement");
  delete grant.publicTitle;
  Object.assign(grant, reviewShowcase(optional, grant));
  assert.equal(validateConfig(optional).ok, true); // An absent override still requires explicit canonical-title approval.
  const withheld = structuredClone(config);
  withheld.career.freelance.find(item => item.id === "automotiveInventorySystem").client = "WITHHELD-CLIENT";
  assert.equal(validateConfig(withheld).ok, true); // A private field is not a publication permission.
});
