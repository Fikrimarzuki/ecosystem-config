import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint } from "../scripts/showcases.mjs";
import { projectSite } from "../site/scripts/projection.mjs";
import { beforeEcW9, beforeEcW91, beforeEcW93Eligibility, ecW9Added, ecW9KenaliGrant, manifestBeforeEcW9 } from "./helpers/republished-evidence.mjs";

// EC-W9: ten implemented projects approved by the owner for Gateway Projects and A–Z. Hidden (no planet), private repositories.
const config = assemble();
const expected = {
  fmAuth: ["FM Auth", "platforms", "web-fm-auth", "fm-auth"],
  fmMail: ["FM Mail", "tools", "web-fm-mail", "fm-mail"],
  fmLogs: ["FM Logs", "tools", "web-fm-logs", "fm-logs"],
  journigo: ["Journigo", "products", "web-journigo", "journigo"],
  zentralynk: ["Zentralynk", "platforms", "web-zentralynk", "zentralynk"],
  reelfrym: ["Reelfrym", "tools", "web-reelfrym", "reelfrym"],
  relyxee: ["Relyxee", "products", "web-relyxee", "relyxee"],
  forgebox: ["Forgebox", "tools", "app-forgebox", "forgebox"],
  ohBabyGrow: ["Oh Baby Grow", "products", "app-oh-baby-grow", "ohbabygrow"],
  linstem: ["Linstem", "platforms", undefined, "linstem"],
};
// SHA-256 of JSON.stringify of each manifest exactly as committed at 08e5238.
const PUBLISHED = ["c8b83b41b7e62f6a2e897f55acb2a0c0358633a0989371536899eca3b036a72f", "07ca37381ee10269d27d8401db2fb7a03d8a0b84461535373d1f73333376f31b", "dee03d025678bede8e50d6d21c1868b8de37c7fea7eda8561820477dd152c47c"];
const site = projectSite(config, JSON.parse(readFileSync(new URL("../.github/consumers.json", import.meta.url), "utf8")));

test("ten projects: identity, category, hidden listing, private repository, subdomain and thumbnail", () => {
  assert.deepEqual([...ecW9Added].sort(), Object.keys(expected).sort());
  for (const [id, [name, destination, repository, subdomain]] of Object.entries(expected)) {
    const project = config.projects[id];
    assert.deepEqual([project.name, project.destination, project.status, project.listing], [name, destination, "active", "hidden"], id);
    assert.equal(project.repository, repository, id);
    if (repository) assert.equal(project.repositoryVisibility, "private", id);
    assert.equal(project.deployments.main.subdomain, subdomain, id);
    assert.equal(project.assets.thumbnail, `assets/projects/${id}/thumbnail.webp`, id);
    assert(project.description.en && project.description.id, id);
    assert.equal(project.lifecycle, undefined, id);
    assert.equal(Object.values(config.projects).filter(other => other.name === name).length, 1, `${name} registered once`);
  }
  assert.equal(config.concepts.some(concept => concept.id === "forgebox"), false);
});

test("each of the ten has exactly one membership, one hidden eligibility decision and one project grant", () => {
  for (const id of ecW9Added) {
    for (const list of [config.showcases, config.showcaseEligibility, config.showcasePublication]) {
      assert.deepEqual(list.filter(item => item.id === id).map(item => item.kind), ["project"], id);
    }
    const decision = config.showcaseEligibility.find(item => item.id === id);
    const grant = config.showcasePublication.find(item => item.id === id);
    assert.deepEqual(Object.keys(grant).sort(), ["fingerprint", "id", "kind", "presentationFingerprint", "surface"], id);
    assert.equal(decision.listing, "hidden", id);
    assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision), id);
    assert.equal(grant.fingerprint, showcaseFingerprint(config, grant), id);
  }
  assert.deepEqual([config.showcases.length, config.showcaseEligibility.length, config.showcasePublication.length], [82, 45, 82]);
});

test("nothing else moved: undoing EC-W9 reproduces the manifests published at 08e5238", () => {
  const sha = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.equal(config.showcasePublication.find(grant => grant.id === "kenali").presentationFingerprint, ecW9KenaliGrant.after);
  assert.deepEqual([
    sha(manifestBeforeEcW9("showcases", config.showcases)),
    sha(beforeEcW93Eligibility(manifestBeforeEcW9("showcaseEligibility", config.showcaseEligibility))),
    sha(beforeEcW91(manifestBeforeEcW9("showcasePublication", config.showcasePublication))),
  ], PUBLISHED);
  assert.equal(validateConfig(beforeEcW9(config)).ok, true);
});

test("no new planet member, and the website projection exposes no repository, technology or unregistered link", () => {
  assert.equal(Object.values(config.projects).filter(project => project.listing === "public").length, 32);
  for (const [id, [, , repository, subdomain]] of Object.entries(expected)) {
    const described = site.projects.find(project => project.id === id);
    assert.equal(described.visibility, "showcase", id);
    assert.equal(described.technologies, undefined, id);
    assert.equal(described.repositoryUrl, undefined, id);
    assert.deepEqual(described.website, [{ key: "main", url: `https://${subdomain}.fikrimarzuki.work` }], id);
    assert.equal(site.showcases.filter(entry => entry.projectId === id).length, 1, id);
    if (repository) assert(!JSON.stringify(site).includes(`"${repository}"`), `${id}: repository name`);
  }
});
